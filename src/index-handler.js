import { removeAccents, intersect, getLigatures, log } from './utils';
import textHandler from './text-handler';

export default {
  /**
   * @description Create new text indices from a single text object
   * @param {TextIndex} textIndex
   * @param {TextObject} textObj
   * @param {Keyword[]} newKeywords
   * @returns {{keywords: Keyword[]}} new keywords which are created indices for
   */
  createIndexForTextObj(textIndex = {}, textObj, newKeywords = []) {
    const { textId, text } = textObj;

    let keywords = newKeywords;
    let pureKeywords = keywords.map((kw) => removeAccents(kw));
    if (!newKeywords.length) {
      const {
        keywords: _keywords,
        pureKeywords: _pureKeywords
      } = textHandler.extractKeywordsFromText(text);
      keywords = _keywords;
      pureKeywords = _pureKeywords;
    }

    const length = pureKeywords.length;
    let i = 0;
    while (i < length) {
      const keyword = keywords[i];
      const firstKeywordChars = getLigatures(keyword);
      const pureKeyword = pureKeywords[i];
      const firstPureKeywordChars = removeAccents(firstKeywordChars);
      // nested level 0
      if (textIndex[firstPureKeywordChars]) {
        const textIndexL0 = textIndex[firstPureKeywordChars];
        // nested level 1
        if (textIndexL0[firstKeywordChars]) {
          const textIndexL1 = textIndexL0[firstKeywordChars];
          // nested level 2
          if (textIndexL1[pureKeyword]) {
            const textIndexL2 = textIndexL1[pureKeyword];
            // nested level 3
            if (textIndexL2[keyword]) {
              textIndex[firstPureKeywordChars][firstKeywordChars][pureKeyword][keyword].add(textId);
            } else {
              textIndex[firstPureKeywordChars][firstKeywordChars][pureKeyword][keyword] = new Set([
                textId
              ]);
            }
          } else {
            textIndex[firstPureKeywordChars][firstKeywordChars][pureKeyword] = {
              [keyword]: new Set([textId])
            };
          }
        } else {
          textIndex[firstPureKeywordChars][firstKeywordChars] = {
            [pureKeyword]: { [keyword]: new Set([textId]) }
          };
        }
      } else {
        textIndex[firstPureKeywordChars] = {
          [firstKeywordChars]: {
            [pureKeyword]: { [keyword]: new Set([textId]) }
          }
        };
      }

      i += 1;
    }

    return { keywords };
  },

  /**
   * @description Remove created text indices of a single text object
   * @param {TextIndex} textIndex
   * @param {TextObject} textObj
   * @param {Keyword[]} removedKeywords
   * @returns {{keywords: Keyword[]}} keywords which are created indices from before
   */
  removeIndexOfTextObj(textIndex, textObj, removedKeywords = []) {
    const { textId, text } = textObj;

    let keywords = removedKeywords;
    let pureKeywords = keywords.map((kw) => removeAccents(kw));
    if (!removedKeywords.length) {
      const {
        keywords: _keywords,
        pureKeywords: _pureKeywords
      } = textHandler.extractKeywordsFromText(text);
      keywords = _keywords;
      pureKeywords = _pureKeywords;
    }

    const length = pureKeywords.length;
    let i = 0;
    while (i < length) {
      const keyword = keywords[i];
      const firstKeywordChars = getLigatures(keyword);
      const pureKeyword = pureKeywords[i];
      const firstPureKeywordChars = removeAccents(firstKeywordChars);
      // nested level 0
      if (textIndex[firstPureKeywordChars]) {
        const textIndexL0 = textIndex[firstPureKeywordChars];
        const textIndexL0Size = Object.keys(textIndexL0).length;
        // nested level 1
        if (textIndexL0[firstKeywordChars]) {
          const textIndexL1 = textIndexL0[firstKeywordChars];
          const textIndexL1Size = Object.keys(textIndexL1).length;
          // nested level 2
          if (textIndexL1[pureKeyword]) {
            const textIndexL2 = textIndexL1[pureKeyword];
            const textIndexL2Size = Object.keys(textIndexL2).length;
            // nested level 3
            if (textIndexL2[keyword]) {
              const textIndexL3 = textIndexL2[keyword];
              const textIndexL3Size = Object.keys(textIndexL3).length;
              // delete textId out of index L3 (if exists)
              if (textIndexL3.has(textId)) {
                textIndex[firstPureKeywordChars][firstKeywordChars][pureKeyword][keyword].delete(
                  textId
                );

                // delete index level3 if empty
                textIndexL3Size === 1 &&
                  delete textIndex[firstPureKeywordChars][firstKeywordChars][pureKeyword][keyword];

                // delete index level2 if empty
                textIndexL2Size === 1 &&
                  delete textIndex[firstPureKeywordChars][firstKeywordChars][pureKeyword];

                // delete index level1 if empty
                textIndexL1Size === 1 && delete textIndex[firstPureKeywordChars][firstKeywordChars];

                // delete index level0 if empty
                textIndexL0Size === 1 && delete textIndex[firstPureKeywordChars];
              }
            }
          }
        }
      }

      i += 1;
    }

    return { removedKeywords: keywords };
  },

  /**
   * @description Update created text indices of a single text object
   * @param {TextIndex} textIndex
   * @param {TextObject} oldTextObj
   * @param {TextObject} textObj
   * @param {Keyword[]} removedKeywords
   * @returns {Promise<{keywords: Keyword[]}>} keywords which are created indices from before
   */
  async updateIndexOfTextObj(textIndex, oldTextObj, textObj) {
    const [
      { keywords: oldKeywords },
      { keywords }
    ] = await textHandler.extractKeywordsFromManyTexts([oldTextObj.text, textObj.text]);
    const { diff1: removedKeywords, diff2: newKeywords } = intersect(oldKeywords, keywords);

    if (removedKeywords.length) {
      this.removeIndexOfTextObj(textIndex, oldTextObj, removedKeywords);
    }

    if (newKeywords.length) {
      this.createIndexForTextObj(textIndex, textObj, newKeywords);
    }

    return { newKeywords, removedKeywords };
  },

  /**
   * @description Create text indices from many text objects
   * @param {TextObject[]} textObjs
   * @returns {Promise<TextIndex>} Global text index
   */
  async createTextIndexByManyTextObjs(textObjs = []) {
    try {
      const length = textObjs.length;
      log(`[${new Date()}]: Start indexing for ${length} objects...`);

      log(`[${new Date()}]: Extracting keywords from text objects...`);
      // ouput: [{ keywords: [], pureKeywords: [], textId, text },...]
      const keywordObjs = await textHandler.extractKeywordsFromManyTextObjs(textObjs, true);

      const globalIndex = keywordObjs.reduce((accObj, { keywords, pureKeywords, ...textObj }) => {
        // sometime input text is not at normal form (e.g. '𝐕𝐄𝐑𝐒𝐀𝐂𝐄 𝐀𝐔𝐓𝐇𝐄𝐍𝐓𝐈𝐂 𝟑𝟒𝐦𝐦')
        if (textHandler.validateTextObj(textObj) && keywords.length) {
          this.createIndexForTextObj(accObj, textObj, keywords);
        }
        return accObj;
      }, {});

      log(`[${new Date()}]: Finish indexing for ${length} objects`);

      return { textIndex: globalIndex, nIndices: Object.keys(globalIndex).length };
    } catch (err) {
      log('createTextIndexByManyTextObjs error');
      throw err;
    }
  }
};
