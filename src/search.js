import textHandler from './text-handler';
import scoreHandler from './score-handler';
import configs from './config';
import indexHandler from './index-handler';
import { log, validateSearchOptions, validateInitOptions } from './utils';

/** @class TextSearch */
class TextSearch {
  constructor() {
    /** @private  */
    this.textIndex_ = {};
    /** @private  */
    this.textDict_ = {};
    /** @public */
    this.textKeyName = configs.DefaultKeyName;
    /** @public */
    this.textValueName = configs.DefaultValueName;
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
   * @param {InitOptions} options
   * @param {Function} cb
   * @returns {Promise<{nIndices: number}>} { nIndices }
   */
  static async init(textObjs = [], options = {}, cb = null) {
    try {
      if (!Array.isArray(textObjs)) {
        throw new Error('textObjs must be array');
      }
      const instance = new TextSearch();
      const valResult = validateInitOptions({
        offset: options.offset || 0,
        limit: options.limit || configs.DefaultLimit,
        sortOrder: options.sortOrder || configs.DefaultSortOrder,
        thresholdScore: options.thresholdScore || configs.DefaultThreshold,
        textKeyName: options.textKeyName || configs.DefaultKeyName,
        textValueName: options.textValueName || configs.DefaultValueName
      });
      if (!valResult.valid) {
        throw new Error(valResult.message);
      }

      Object.entries(valResult.data).forEach(([key, val]) => {
        instance[key] = val;
      });
      const { textKeyName, textValueName } = valResult.data;
      const { textIndex, nIndices } = await indexHandler.createTextIndexByManyTextObjs(
        textObjs,
        null,
        {
          textKeyName,
          textValueName
        }
      );
      instance.textIndex_ = textIndex;

      instance.textDict_ = {};
      const textObjsSize = textObjs.length;
      let i = 0;
      while (i < textObjsSize) {
        instance.textDict_[textObjs[i][textKeyName]] = textObjs[i];
        i += 1;
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
      const valResult = validateSearchOptions({
        offset: options.offset || 0,
        limit: options.limit || this.limit,
        sortOrder: options.sortOrder || this.sortOrder,
        thresholdScore: options.thresholdScore || this.thresholdScore
      });
      if (!valResult.valid) {
        throw new Error(valResult.message);
      }

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
   * @deprecated use addTextObj instead.
   */
  async addNewTextObj(textObj, cb = null) {
    try {
      const baseOptions = { textKeyName: this.textKeyName, textValueName: this.textValueName };
      const { keywords } = indexHandler.createIndexForTextObj(
        this.textIndex_,
        valResult.data,
        baseOptions
      );
      this.textDict_[textObj[this.textKeyName]] = textObj;

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
   * Add many text objects to `this.textDict_`
   * @param {TextObject} textObj
   * @param {Function} cb
   * @returns {Promise<{nUpserted: number}>} cb
   * @deprecated use addManyTextObjs instead.
   */
  async addManyNewTextObjs(textObjs, cb = null) {
    try {
      const baseOptions = { textKeyName: this.textKeyName, textValueName: this.textValueName };
      await indexHandler.createTextIndexByManyTextObjs(textObjs, this.textIndex_, baseOptions);
      textObjs.reduce((accObj, curObj) => {
        accObj[curObj[baseOptions.textKeyName]] = curObj;
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
   * Add a new text object to `this.textDict_`
   * @param {TextObject} textObj
   * @param {Function} cb
   * @returns {Promise<{ nUpserted: number, keywords: Keyword[]}>} cb
   */
  async addTextObj(textObj, cb = null) {
    try {
      const baseOptions = { textKeyName: this.textKeyName, textValueName: this.textValueName };
      const { keywords } = indexHandler.createIndexForTextObj(
        this.textIndex_,
        textObj,
        baseOptions
      );
      this.textDict_[textObj[this.textKeyName]] = textObj;

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
   * Add many text objects to `this.textDict_`
   * @param {TextObject} textObj
   * @param {Function} cb
   * @returns {Promise<{nUpserted: number}>} cb
   */
  async addManyTextObjs(textObjs, cb = null) {
    try {
      const baseOptions = { textKeyName: this.textKeyName, textValueName: this.textValueName };
      const { nCreated } = await indexHandler.createTextIndexByManyTextObjs(
        textObjs,
        this.textIndex_,
        baseOptions
      );
      textObjs.reduce((accObj, curObj) => {
        accObj[curObj[baseOptions.textKeyName]] = curObj;
        return accObj;
      }, this.textDict_);

      if (cb) {
        return cb(null, { nUpserted: textObjs.length });
      }
      return { nUpserted: nCreated };
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
   * @param {TextKey} textKey
   * @param {TextObject} textObj
   * @param {Function} cb
   * @returns {Promise<{ nUpserted: number, newKeywords: Keyword[], removedKeywords: Keyword[]}>} cb
   */
  async updateTextObj(textKey, textObj, cb = null) {
    try {
      const baseOptions = { textKeyName: this.textKeyName, textValueName: this.textValueName };
      if (!this.textDict_[textKey]) {
        throw new Error('textKey not found');
      }
      const { newKeywords, removedKeywords } = await indexHandler.updateIndexOfTextObj(
        this.textIndex_,
        this.textDict_[textKey],
        textObj,
        baseOptions
      );
      this.textDict_[textKey] = textObj;

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
   * @param {TextKey} textKey
   * @param {Function} cb
   * @returns {Promise<{ nRemoved: number, removedKeywords: Keyword[]}>} cb
   */
  async removeTextObj(textKey, cb = null) {
    try {
      if (!this.textDict_[textKey]) {
        throw new Error('textKey not found');
      }
      const baseOptions = { textKeyName: this.textKeyName, textValueName: this.textValueName };
      const { removedKeywords } = indexHandler.removeIndexOfTextObj(
        this.textIndex_,
        this.textDict_[textKey],
        baseOptions
      );
      delete this.textDict_[textKey];

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
   * leave textKeys = [] for removing all text indices
   * @param {TextKeys[]} textKeys
   * @param {Function} cb
   * @returns {Promise<{nRemoved: number}>} cb
   */
  async removeManyTextObjs(textKeys, cb = null) {
    try {
      const self = this;
      if (!Array.isArray(textKeys)) {
        throw new Error('textKeys must be array');
      }
      let nRemoved = 0;
      if (!textKeys.length) {
        nRemoved = Object.keys(self.textDict_).length;
        this.textIndex_ = {};
        this.textDict_ = {};
      } else {
        const removedTextKeys = [...new Set(textKeys)];
        const baseOptions = { textKeyName: this.textKeyName, textValueName: this.textValueName };
        nRemoved = removedTextKeys.reduce((acc, cur) => {
          if (!self.textDict_[cur]) {
            throw new Error('textKey not found');
          }
          indexHandler.removeIndexOfTextObj(self.textIndex_, self.textDict_[cur], baseOptions);
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
