import { getNestedObjValues, getLigatures, removeAccents } from './utils';
import configs from './config';

export default {
  /**
   * @param {ScoreObject[]} scoreObjs
   * @returns {ScoreObject} { textKey1: score1, textKey2: score2, ... }
   */
  mergeScoreObjs(scoreObjs) {
    return scoreObjs.reduce((finalObj, curObj) => {
      for (const [key, val] of Object.entries(curObj)) {
        finalObj[key] ? (finalObj[key] += val) : (finalObj[key] = val);
      }

      return finalObj;
    }, {});
  },

  /**
   * @param {TextIndex} textIndex
   * @param {Keyword} keyword
   * @returns {Text4lsObject} { l0: Set(ids), l1: Set(ids), l2: Set(ids), l3: Set(ids) }
   */
  getAll4LsTextIds(textIndex, keyword) {
    const firstKeywordChars = getLigatures(keyword);
    const pureKeyword = removeAccents(keyword);
    const pureFirstKeywordChars = removeAccents(firstKeywordChars);
    const { l0 = [], l1 = [], l2 = [], l3 = [] } = {};
    if (textIndex[pureFirstKeywordChars]) {
      const textIndexL0 = textIndex[pureFirstKeywordChars];
      getNestedObjValues(textIndexL0, l0);
      if (textIndexL0[firstKeywordChars]) {
        const textIndexL1 = textIndexL0[firstKeywordChars];
        getNestedObjValues(textIndexL1, l1);
        if (textIndexL1[pureKeyword]) {
          const textIndexL2 = textIndexL1[pureKeyword];
          getNestedObjValues(textIndexL2, l2);
          if (textIndexL2[keyword]) {
            const textIndexL3 = textIndexL2[keyword];
            getNestedObjValues(textIndexL3, l3);
          }
        }
      }
    }

    const resultObj = { l0: new Set(l0), l1: new Set(l1), l2: new Set(l2), l3: new Set(l3) };
    return resultObj;
  },

  /**
   * @param {TextIndex} textIndex
   * @param {Keyword} keyword
   * @param {GetTextScoreOptions} options
   * @returns {ScoreObject} { textKey1: score1, textKey2: score2, ... }
   */
  async getTextScoresWithKeyword(textBucket, keyword, options = {}) {
    const { buckets = Object.keys(textBucket), useAddedScore = false, keysLength = 1 } = options;
    const scoreObjs = await Promise.all(
      buckets.map((bucket) => {
        const textIndex = textBucket[bucket].textIndex;
        const { l0, l1, l2, l3 } = this.getAll4LsTextIds(textIndex, keyword);
        const allTextIds = new Set([...l0, ...l1, ...l2, ...l3]);

        const topTextObjs = [...allTextIds].reduce((acc, cur) => {
          let score = 0;
          const coeff01 = getLigatures(keyword).length;
          l0.has(cur) && (score += configs.ScoreL0 * coeff01);
          l1.has(cur) && (score += configs.ScoreL1 * coeff01);
          l2.has(cur) && (score += configs.ScoreL2);
          l3.has(cur) && (score += configs.ScoreL3);
          const textObj = textBucket[bucket].textDict[cur];
          if (textObj) {
            acc[cur] = score + (+useAddedScore * textObj.addedScore) / keysLength;
          }
          return acc;
        }, {});
        return topTextObjs;
      })
    );
    return this.mergeScoreObjs(scoreObjs);
  },

  /**
   * @param {TextBucket} textBucket
   * @param {Keyword[]} keywords
   * @param {GetTextScoreOptions} options
   * @returns {Promise<ScoreEntry[]>} [ [textKey1, score1], [textKey2, score2], ... ]
   */
  async getTextScoresWithManyKeywords(textBucket, keywords, options = {}) {
    const { buckets = Object.keys(textBucket), useAddedScore = false } = options;
    if (!buckets.length) {
      return [];
    }
    const textScoreObjs = await Promise.all(
      keywords.map((keyword) =>
        this.getTextScoresWithKeyword(textBucket, keyword, {
          buckets,
          useAddedScore,
          keysLength: keywords.length
        })
      )
    );
    const mergedTextScoresObj = this.mergeScoreObjs(textScoreObjs);
    return Object.entries(mergedTextScoresObj);
  }
};
