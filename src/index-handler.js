import { removeAccents, validateTextObj, intersect, getLigatures, log } from './utils';
import configs from './config';
import textHandler from './text-handler';

export default {
  /**
   * @description Create new text indices from a single text object
   * @param {TextIndex} textIndex
   * @param {TextObject} textObj
   * @param {CreateIndexOptions} options
   * @returns {{keywords: Keyword[]}} new keywords which are created indices for
   */
  createIndexForTextObj(
    textIndex = {},
    textObj,
    {
      textKeyName = configs.DefaultKeyName,
      textValueName = configs.DefaultValueName,
      keywords: newKeywords = []
    }
  ) {
    const valResult = validateTextObj(textObj, { textKeyName, textValueName });
    if (!valResult.valid) {
      throw new Error(valResult.message);
    }

    const textKey = valResult.data[textKeyName];
    const textValue = valResult.data[textValueName];

    let keywords = newKeywords;
    let pureKeywords = keywords.map((kw) => removeAccents(kw));
    if (!keywords.length) {
      const {
        keywords: _keywords,
        pureKeywords: _pureKeywords
      } = textHandler.extractKeywordsFromText(textValue, true);
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
              textIndex[firstPureKeywordChars][firstKeywordChars][pureKeyword][keyword].add(
                textKey
              );
            } else {
              textIndex[firstPureKeywordChars][firstKeywordChars][pureKeyword][keyword] = new Set([
                textKey
              ]);
            }
          } else {
            textIndex[firstPureKeywordChars][firstKeywordChars][pureKeyword] = {
              [keyword]: new Set([textKey])
            };
          }
        } else {
          textIndex[firstPureKeywordChars][firstKeywordChars] = {
            [pureKeyword]: { [keyword]: new Set([textKey]) }
          };
        }
      } else {
        textIndex[firstPureKeywordChars] = {
          [firstKeywordChars]: {
            [pureKeyword]: { [keyword]: new Set([textKey]) }
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
   * @param {RemoveIndexOptions} options
   * @returns {{keywords: Keyword[]}} keywords which are created indices from before
   */
  removeIndexOfTextObj(
    textIndex,
    textObj,
    {
      textKeyName = configs.DefaultKeyName,
      textValueName = configs.DefaultValueName,
      keywords: removedKeywords = []
    }
  ) {
    const valResult = validateTextObj(textObj, { textKeyName, textValueName });
    if (!valResult.valid) {
      throw new Error(valResult.message);
    }

    const textKey = valResult.data[textKeyName];
    const textValue = valResult.data[textValueName];

    let keywords = removedKeywords;
    let pureKeywords = keywords.map((kw) => removeAccents(kw));
    if (!keywords.length) {
      const {
        keywords: _keywords,
        pureKeywords: _pureKeywords
      } = textHandler.extractKeywordsFromText(textValue, true);
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
              // delete textKey out of index L3 (if exists)
              if (textIndexL3.has(textKey)) {
                textIndex[firstPureKeywordChars][firstKeywordChars][pureKeyword][keyword].delete(
                  textKey
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
   * @param {UpdateIndexOptions} options
   * @returns {Promise<{newKeywords: Keyword[], removedKeywords: Keyword[]}>}
   */
  async updateIndexOfTextObj(
    textIndex,
    oldTextObj,
    textObj,
    {
      textKeyName = configs.DefaultKeyName,
      textValueName = configs.DefaultValueName,
      keywords: _keywords = [],
      oldKeywords: _oldKeywords = []
    }
  ) {
    let keywords = _keywords;
    let oldKeywords = _oldKeywords;
    if (!keywords.length) {
      const { keywords: keywordsFromTextObj } = textHandler.extractKeywordsFromText(
        textObj[textValueName]
      );
      keywords = keywordsFromTextObj;
    }
    if (!oldKeywords.length) {
      const { keywords: keywordsFromOldTextObj } = textHandler.extractKeywordsFromText(
        oldTextObj[textValueName]
      );
      oldKeywords = keywordsFromOldTextObj;
    }
    const { diff1: removedKeywords, diff2: newKeywords } = intersect(oldKeywords, keywords);

    const baseOptions = { textKeyName, textValueName };
    if (removedKeywords.length) {
      this.removeIndexOfTextObj(textIndex, oldTextObj, {
        ...baseOptions,
        keywords: removedKeywords
      });
    }

    if (newKeywords.length) {
      this.createIndexForTextObj(textIndex, textObj, { ...baseOptions, keywords: newKeywords });
    }

    return { newKeywords, removedKeywords };
  },

  /**
   * Create text indices from many text objects, if the second argument is passed to the function,
   * then using this argument as global textIndex for indexing new text objects.
   * @param {TextObject[]} textObjs
   * @param {TextIndex} textIndex
   * @param {CreateIndexOptions} options
   * @returns {Promise<{textIndex: TextIndex, nIndices: number, nCreated: number, errors: TextKey[]}>} Global text index
   */
  async createTextIndexByManyTextObjs(
    textObjs = [],
    textIndex = null,
    { textKeyName = configs.DefaultKeyName, textValueName = configs.DefaultValueName }
  ) {
    try {
      const length = textObjs.length;
      log(`[${new Date()}]: Start indexing for ${length} objects...`);

      log(`[${new Date()}]: Extracting keywords from text objects...`);
      // ouput: [{ keywords: [], pureKeywords: [], textKey, textValue },...]
      const keywordObjs = await textHandler.extractKeywordsFromManyTextObjs(textObjs, {
        toLower: true,
        textKeyName,
        textValueName
      });

      let nCreated = 0;
      const errors = [];
      const globalIndex = keywordObjs.reduce((accObj, { keywords, pureKeywords, ...textObj }) => {
        // sometime input text is not at normal form (e.g. '𝐕𝐄𝐑𝐒𝐀𝐂𝐄 𝐀𝐔𝐓𝐇𝐄𝐍𝐓𝐈𝐂 𝟑𝟒𝐦𝐦')
        if (keywords.length) {
          this.createIndexForTextObj(accObj, textObj, {
            keywords,
            textKeyName,
            textValueName
          });
          nCreated += 1;
        } else {
          errors.push(textObj[textKeyName]);
        }
        return accObj;
      }, textIndex || {});

      log(`[${new Date()}]: Finish indexing for ${nCreated} objects | Error objects: ${errors}`);
      log(`[${new Date()}]: ${errors}`);
      return {
        textIndex: globalIndex,
        nIndices: Object.keys(globalIndex).length,
        nCreated,
        errors
      };
    } catch (err) {
      log('createTextIndexByManyTextObjs error');
      throw err;
    }
  }
};
