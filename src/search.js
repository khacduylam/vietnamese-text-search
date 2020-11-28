import textHandler from './text-handler';
import scoreHandler from './score-handler';
import configs from './config';
import indexHandler from './index-handler';
import { log } from './utils';

/** @class TextSearch */
class TextSearch {
  constructor() {
    /** @private  */
    this.textIndex_ = {};
    /** @private  */
    this.textDict_ = {};
    /** @public  */
    this.thresholdScore = configs.DefaultThreshold;
    /** @public  */
    this.sortOrder = configs.DefaultSortOrder;
    /** @public  */
    this.limit = configs.DefaultLimit;
  }

  /**
   * Initilize an TextSearch instance with options
   * @param {TextObject} textObjs
   * @param {SearchOptions} options
   * @param {Function} cb
   * @returns {Promise<{nIndices: number}>} { nIndices }
   */
  static async init(textObjs = [], options = {}, cb = null) {
    try {
      if (!Array.isArray(textObjs)) {
        throw new Error('textObjs must be array');
      }
      const instance = new TextSearch();
      const {
        thresholdScore = configs.DefaultThreshold,
        sortOrder = configs.DefaultSortOrder,
        limit = configs.DefaultLimit,
        offset = 0
      } = options;
      if (!Number.isNaN(+thresholdScore) && thresholdScore >= 0) {
        instance.thresholdScore = thresholdScore;
      } else {
        throw new Error('thresholdScore is invalid');
      }
      if ([-1, 1, '-1', '1'].includes(sortOrder)) {
        instance.sortOrder = +sortOrder;
      } else {
        throw new Error('sortOrder must be -1 or 1');
      }

      const { textIndex, nIndices } = await indexHandler.createTextIndexByManyTextObjs(textObjs);
      instance.textIndex_ = textIndex;

      instance.textDict_ = {};
      const textObjsSize = textObjs.length;
      let i = 0;
      while (i < textObjsSize) {
        instance.textDict_[textObjs[i].textId] = textObjs[i];
        i += 1;
      }

      if (Number.isInteger(+limit) && +limit > -1) {
        instance.limit = +limit;
      } else {
        throw new Error('limit must be greater than or equals 0');
      }

      if (Number.isInteger(+offset) && +offset > -1) {
        instance.offset = +offset;
      } else {
        throw new Error('offset must be greater than or equals 0');
      }

      const result = { nIndices };
      if (cb) {
        return cb(null, instance, result);
      }
      return instance;
    } catch (err) {
      if (cb) {
        return cb(err);
      }
      throw err;
    }
  }

  /**
   * Search for `text` on the text objects that initialized
   * @param {string} text
   * @param {SearchOptions} options
   * @param {Function} cb
   * @returns {Promise<SearchResult>} { data, sortOrder, thresholdScore, offset, limit, total, text }
   */
  async search(text, options = {}, cb = null) {
    try {
      const textToSearch = (text + '').trim();
      const {
        sortOrder = this.sortOrder,
        thresholdScore = this.thresholdScore,
        limit = this.limit,
        offset = this.offset
      } = options;
      const { keywords } = textHandler.extractKeywordsFromText(textToSearch, true);
      const rawResult = await scoreHandler.getTextScoresWithManyKeywords(this.textIndex_, keywords);

      const sortFunc = +sortOrder === -1 ? (s1, s2) => -s1[1] + s2[1] : (s1, s2) => s1[1] - s2[1];
      const finalResult = rawResult.filter((s) => s[1] > thresholdScore).sort(sortFunc);
      const total = finalResult.length;

      const startResults = +offset;
      const endResults = +limit !== 0 ? +offset + +limit : total;
      return cb
        ? cb(null, finalResult.slice(startResults, endResults), {
            sortOrder,
            thresholdScore,
            offset,
            limit,
            total,
            text: textToSearch
          })
        : {
            data: finalResult.slice(startResults, endResults),
            sortOrder,
            thresholdScore,
            offset,
            limit,
            total,
            text: textToSearch
          };
    } catch (err) {
      log('search error:');
      log(err);
      if (cb) {
        return cb(err);
      }

      throw err;
    }
  }

  /**
   * Add a new text object to `this.textDict_`
   * @param {TextObject} textObj
   * @param {Function} cb
   * @returns {Promise<{ nUpserted: number, keywords: Keyword[]}>} cb
   */
  async addNewTextObj(textObj, cb = null) {
    try {
      if (!textHandler.validateTextObj(textObj)) {
        throw new Error('invalid textObj');
      }
      const { keywords } = indexHandler.createIndexForTextObj(this.textIndex_, textObj);
      this.textDict_[textObj.textId] = textObj;

      if (cb) {
        return cb(null, { nUpserted: 1, keywords });
      }
      return { nUpserted: 1, keywords };
    } catch (err) {
      log('addNewTextObj error:');
      log(err);
      if (cb) {
        return cb(err);
      }

      throw err;
    }
  }

  /**
   * Add many new text objects to `this.textDict_`
   * @param {TextObject} textObj
   * @param {Function} cb
   * @returns {Promise<{nUpserted: number}>} cb
   */
  async addManyNewTextObjs(textObjs, cb = null) {
    try {
      await indexHandler.createTextIndexByManyTextObjs(textObjs, this.textIndex_);
      textObjs.reduce((accObj, curObj) => {
        accObj[curObj.textId] = curObj;
        return accObj;
      }, this.textDict_);

      if (cb) {
        return cb(null, { nUpserted: textObjs.length });
      }
      return { nUpserted: textObjs.length };
    } catch (err) {
      log('addManyNewTextObjs error:');
      log(err);
      if (cb) {
        return cb(err);
      }

      throw err;
    }
  }

  /**
   * Update a text object of `this.textDict_`
   * @param {TextId} textId
   * @param {TextObject} textObj
   * @param {Function} cb
   * @returns {Promise<{ nUpserted: number, newKeywords: Keyword[], removedKeywords: Keyword[]}>} cb
   */
  async updateTextObj(textId, textObj, cb = null) {
    try {
      if (!textHandler.validateTextObj(textObj)) {
        throw new Error('invalid textObj');
      }
      if (!this.textDict_[textId]) {
        throw new Error('textId not found');
      }
      const { newKeywords, removedKeywords } = await indexHandler.updateIndexOfTextObj(
        this.textIndex_,
        this.textDict_[textId],
        textObj
      );
      this.textDict_[textId] = textObj;

      const result = { nUpserted: 1, newKeywords, removedKeywords };
      if (cb) {
        return cb(null, result);
      }
      return result;
    } catch (err) {
      log('updateTextObj error:');
      log(err);
      if (cb) {
        return cb(err);
      }

      throw err;
    }
  }

  /**
   * Remove a text object from `this.textDict_`
   * @param {TextId} textId
   * @param {Function} cb
   * @returns {Promise<{ nRemoved: number, removedKeywords: Keyword[]}>} cb
   */
  async removeTextObj(textId, cb = null) {
    try {
      if (!this.textDict_[textId]) {
        throw new Error('textId not found');
      }
      const { removedKeywords } = indexHandler.removeIndexOfTextObj(
        this.textIndex_,
        this.textDict_[textId]
      );
      delete this.textDict_[textId];

      const result = { nRemoved: 1, removedKeywords };
      if (cb) {
        return cb(null, result);
      }
      return result;
    } catch (err) {
      log('removeTextObj error:');
      log(err);
      if (cb) {
        return cb(err);
      }

      throw err;
    }
  }

  /**
   * Remove many text objects from `this.textDict_`,
   * leave textIds = [] for removing all text indices
   * @param {TextId[]} textIds
   * @param {Function} cb
   * @returns {Promise<{nRemoved: number}>} cb
   */
  async removeManyTextObjs(textIds, cb = null) {
    try {
      const self = this;
      if (!Array.isArray(textIds)) {
        throw new Error('textIds must be array');
      }
      let nRemoved = 0;
      if (!textIds.length) {
        nRemoved = Object.keys(self.textDict_);
        this.textIndex_ = {};
        this.textDict_ = {};
      } else {
        const removedTextIds = [...new Set(textIds)];
        nRemoved = removedTextIds.reduce((acc, cur) => {
          if (!self.textDict_[cur]) {
            throw new Error('textId not found');
          }
          indexHandler.removeIndexOfTextObj(self.textIndex_, self.textDict_[cur]);
          delete self.textDict_[cur];

          acc += 1;
          return acc;
        }, 0);
      }

      const result = { nRemoved };
      if (cb) {
        return cb(null, result);
      }
      return result;
    } catch (err) {
      log('removeManyTextObjs error:');
      log(err);
      if (cb) {
        return cb(err);
      }

      throw err;
    }
  }
}

export default TextSearch;
