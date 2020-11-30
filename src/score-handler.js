import { getNestedObjValues, getLigatures, removeAccents, log } from './utils';
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
   * @param {Text4lsObject} textKeysObj
   * @returns {ScoreObject} { textKey1: score1, textKey2: score2, ... }
   */
  getTextScoresWithKeyword(textIndex, keyword, textKeysObj = {}) {
    let { l0, l1, l2, l3 } = textKeysObj;
    if (!textKeysObj || Object.keys(textKeysObj).length !== 4) {
      let { l0: _l0, l1: _l1, l2: _l2, l3: _l3 } = this.getAll4LsTextIds(textIndex, keyword);
      l0 = _l0;
      l1 = _l1;
      l2 = _l2;
      l3 = _l3;
    }
    const allTextIds = new Set([...l0, ...l1, ...l2, ...l3]);

    const topTextObjs = [...allTextIds].reduce((acc, cur) => {
      let score = 0;
      const coeff01 = getLigatures(keyword).length;
      l0.has(cur) && (score += configs.ScoreL0 * coeff01);
      l1.has(cur) && (score += configs.ScoreL1 * coeff01);
      l2.has(cur) && (score += configs.ScoreL2);
      l3.has(cur) && (score += configs.ScoreL3);
      acc[cur] = score;
      return acc;
    }, {});

    return topTextObjs;
  },

  /**
   * @param {TextIndex} textIndex
   * @param {Keyword[]} keywords
   * @returns {Promise<ScoreEntry[]>} [ [textKey1, score1], [textKey2, score2], ... ]
   */
  async getTextScoresWithManyKeywords(textIndex, keywords) {
    const textScoreObjs = await Promise.all(
      keywords.map((keyword) => this.getTextScoresWithKeyword(textIndex, keyword))
    );
    const mergedTextScoresObj = this.mergeScoreObjs(textScoreObjs);
    return Object.entries(mergedTextScoresObj);
  }
};
