import { removeAccents, intersect, getLigatures, log, compare2Objs } from './utils';
import configs from './config';
import textHandler from './text-handler';

export default {
  /**
   * @description Create new text indices from a single text object
   * @param {TextIndex} textIndex
   * @param {TextObject} textObj
   * @param {CreateIndexOptions} options
   * @returns {{bucket: string, keywords: Keyword[]}} { bucket: string, keywords: [] }
   */
  createIndexForTextObj(
    textBucket = {},
    textObj,
    {
      textKeyName = configs.DefaultKeyName,
      textValueName = configs.DefaultValueName,
      keywords: newKeywords = []
    }
  ) {
    const textKey = textObj[textKeyName];
    const textValue = textObj[textValueName];
    const bucket = textObj['bucket'];

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

    let textIndex = null;
    if (textBucket[bucket]) {
      textIndex = textBucket[bucket].textIndex;
    } else {
      textBucket[bucket] = { textIndex: {}, textDict: {} };
      textIndex = textBucket[bucket].textIndex;
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
              textBucket[bucket].textIndex[firstPureKeywordChars][firstKeywordChars][pureKeyword][
                keyword
              ].add(textKey);
            } else {
              textBucket[bucket].textIndex[firstPureKeywordChars][firstKeywordChars][pureKeyword][
                keyword
              ] = new Set([textKey]);
            }
          } else {
            textBucket[bucket].textIndex[firstPureKeywordChars][firstKeywordChars][pureKeyword] = {
              [keyword]: new Set([textKey])
            };
          }
        } else {
          textBucket[bucket].textIndex[firstPureKeywordChars][firstKeywordChars] = {
            [pureKeyword]: { [keyword]: new Set([textKey]) }
          };
        }
      } else {
        textBucket[bucket].textIndex[firstPureKeywordChars] = {
          [firstKeywordChars]: {
            [pureKeyword]: { [keyword]: new Set([textKey]) }
          }
        };
      }

      i += 1;
    }

    textBucket[bucket].textDict[textKey] = textObj;

    return { bucket, keywords };
  },

  /**
   * @description Remove created text indices of a single text object
   * @param {TextIndex} textIndex
   * @param {TextObject} textObj
   * @param {RemoveIndexOptions} options
   * @returns {{bucket: string, keywords: Keyword[]}} { bucket:string, keywords: [] }
   */
  removeIndexOfTextObj(
    textBucket = {},
    textObj,
    {
      textKeyName = configs.DefaultKeyName,
      textValueName = configs.DefaultValueName,
      keywords: removedKeywords = []
    }
  ) {
    const bucket = textObj['bucket'];
    const textKey = textObj[textKeyName];
    const textValue = textObj[textValueName];

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

    let textIndex = null;
    if (textBucket[bucket]) {
      textIndex = textBucket[bucket].textIndex;
    } else {
      textBucket[bucket] = { textIndex: {}, textDict: {} };
      textIndex = textBucket[bucket].textIndex;
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
                textBucket[bucket].textIndex[firstPureKeywordChars][firstKeywordChars][pureKeyword][
                  keyword
                ].delete(textKey);

                // delete index level3 if empty
                textIndexL3Size <= 1 &&
                  delete textBucket[bucket].textIndex[firstPureKeywordChars][firstKeywordChars][
                    pureKeyword
                  ][keyword];

                // delete index level2 if empty
                textIndexL2Size <= 1 &&
                  delete textBucket[bucket].textIndex[firstPureKeywordChars][firstKeywordChars][
                    pureKeyword
                  ];

                // delete index level1 if empty
                textIndexL1Size <= 1 &&
                  delete textBucket[bucket].textIndex[firstPureKeywordChars][firstKeywordChars];

                // delete index level0 if empty
                textIndexL0Size <= 1 && delete textBucket[bucket].textIndex[firstPureKeywordChars];
              }
            }
          }
        }
      }

      i += 1;
    }

    delete textBucket[bucket].textDict[textKey];

    return { bucket, removedKeywords: keywords };
  },

  /**
   * @description Update created text indices of a single text object
   * @param {TextBucket} textBucket
   * @param {TextObject} oldTextObj
   * @param {TextObject} textObj
   * @param {UpdateIndexOptions} options
   * @returns {Promise<{bucket: string, newKeywords: Keyword[], removedKeywords: Keyword[], nUpdated: number, nAdded: number}>} { bucket: string, newKeywords: [], removedKeywords: [], nUpdated: number, nAdded: number }
   */
  async updateIndexOfTextObj(
    textBucket,
    oldTextObj,
    textObj,
    {
      textKeyName = configs.DefaultKeyName,
      textValueName = configs.DefaultValueName,
      keywords: _keywords = [],
      oldKeywords: _oldKeywords = []
    }
  ) {
    const bucket = textObj['bucket'];
    const textKey = textObj[textKeyName];
    const textValue = textObj[textValueName];
    const textOldValue = oldTextObj ? oldTextObj[textValueName] : '';

    let keywords = _keywords;
    let oldKeywords = _oldKeywords;
    if (!keywords.length) {
      const { keywords: keywordsFromTextObj } = textHandler.extractKeywordsFromText(
        textValue,
        true
      );
      keywords = keywordsFromTextObj;
    }

    if (!oldKeywords.length) {
      const { keywords: keywordsFromOldTextObj } = oldTextObj
        ? textHandler.extractKeywordsFromText(textOldValue, true)
        : { keywords: [] };
      oldKeywords = keywordsFromOldTextObj;
    }
    const { diff1: removedKeywords, diff2: newKeywords } = intersect(oldKeywords, keywords);
    const baseOptions = { textKeyName, textValueName };

    if (!removedKeywords.length && !newKeywords.length) {
      const isSame = compare2Objs(oldTextObj, textObj);
      isSame && (textBucket[bucket].textDict[textKey] = textObj);
      return { bucket, newKeywords: [], removedKeywords: [], nUpdated: 1, nAdded: 0 };
    }

    if (removedKeywords.length && oldTextObj) {
      this.removeIndexOfTextObj(textBucket, oldTextObj, {
        ...baseOptions,
        keywords: removedKeywords
      });
    }

    const oldObj = { ...(oldTextObj || {}) };
    const newObj = { ...textObj };
    delete oldObj[textKeyName];
    const newTextObj = { ...oldObj, ...newObj };

    if (newKeywords.length) {
      this.createIndexForTextObj(textBucket, newTextObj, {
        ...baseOptions,
        keywords: newKeywords
      });
    }

    return {
      bucket,
      newKeywords,
      removedKeywords,
      nUpdated: +!!oldTextObj,
      nAdded: +!oldTextObj
    };
  },

  /**
   * Create text indices from many text objects, if the second argument is passed to the function,
   * then using this argument as global textBucket for indexing new text objects.
   * @param {TextObject[]} textObjs
   * @param {TextBucket} textBucket
   * @param {CreateIndexOptions} options
   * @returns {Promise<{textBucket: TextBucket, totalIndices: number, totalObjects: number, emptyKeywordKeys: TextKey[], details: object}>} { textBucket: {}, totalIndices: number, totalObjects: number, emptyKeywordKeys: [], details: {} }
   */
  async createTextIndexByManyTextObjs(
    textObjs = [],
    textBucket = null,
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

      const emptyKeywordKeys = [];
      let totalIndices = 0;
      let totalObjects = 0;
      const details = {};
      const globalTextBucket = keywordObjs.reduce(
        (accObj, { keywords, pureKeywords, ...textObj }) => {
          // sometime input text is not at normal form (e.g. '𝐕𝐄𝐑𝐒𝐀𝐂𝐄 𝐀𝐔𝐓𝐇𝐄𝐍𝐓𝐈𝐂 𝟑𝟒𝐦𝐦')
          if (keywords.length) {
            const { bucket } = this.createIndexForTextObj(accObj, textObj, {
              keywords,
              textKeyName,
              textValueName
            });
            totalIndices += 1;
            totalObjects += 1;
            if (details[bucket]) {
              details[bucket].nAdded += 1;
              details[bucket].nIndices += keywords.length;
            } else {
              details[bucket] = { nAdded: 1, nIndices: keywords.length, errorKeys: [] };
            }
          } else {
            emptyKeywordKeys.push(textObj[textKeyName]);
          }
          return accObj;
        },
        textBucket || {}
      );

      log(`[${new Date()}]: Finish indexing for ${totalObjects} objects`);
      log(`[${new Date()}]: Error object keys ${emptyKeywordKeys}`);
      return {
        textBucket: globalTextBucket,
        totalObjects,
        totalIndices,
        emptyKeywordKeys,
        details
      };
    } catch (err) {
      log('createTextIndexByManyTextObjs error');
      throw err;
    }
  }
};
