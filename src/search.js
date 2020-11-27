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
    this.limit = 0;
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
      const instance = new TextSearch();
      const {
        thresholdScore = configs.DefaultThreshold,
        sortOrder = configs.DefaultSortOrder,
        limit = 0
      } = options;
      if (!Number.isNaN(+thresholdScore) && thresholdScore >= 0) {
        instance.thresholdScore = thresholdScore;
      } else {
        throw new Error('thresholdScore is invalid');
      }
      if ([-1, 1, '-1', '1'].includes(sortOrder)) {
        instance.sortOrder = +sortOrder;
      } else {
        throw new Error('sortOrder muse be -1 or 1');
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
        throw new 'limit muse be greater than or equals 0'();
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
        offset = 0
      } = options;
      const { keywords } = textHandler.extractKeywordsFromText(textToSearch, true);
      const rawResult = await scoreHandler.getTextScoresWithManyKeywords(this.textIndex_, keywords);

      const sortFunc = +sortOrder === -1 ? (s1, s2) => -s1[1] + s2[1] : (s1, s2) => s1[1] - s2[1];
      const finalResult = rawResult.filter((s) => s[1] > thresholdScore).sort(sortFunc);
      const total = finalResult.length;

      return cb
        ? cb(null, finalResult.slice(offset, +limit !== 0 ? +limit : total), {
            sortOrder,
            thresholdScore,
            offset,
            limit,
            total,
            text: textToSearch
          })
        : {
            data: finalResult.slice(offset, +limit !== 0 ? +limit : total),
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
   * @returns {Promise<{keywords: Keyword[]}>} cb
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
      return { nUpserted: 1 };
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
   * Update a text object of `this.textDict_`
   * @param {TextId} textId
   * @param {TextObject} textObj
   * @param {Function} cb
   * @returns {Promise<{newKeywords: Keyword[], removedKeywords: Keyword[]}>} cb
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
   * @returns {Promise<{removedKeywords: Keyword[]}>} cb
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

      const result = { removedKeywords };
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
}

export default TextSearch;
