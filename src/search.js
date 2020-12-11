import textHandler from './text-handler';
import scoreHandler from './score-handler';
import configs from './config';
import indexHandler from './index-handler';
import { log, countNestedObjectKeys } from './utils';

/** @class TextSearch */
class TextSearch {
  #textBucket;
  #textKeyName;
  #textValueName;
  #autoGenBucket;
  constructor() {
    /** @private */
    this.#textBucket = {};
    this.#textKeyName = configs.DefaultKeyName;
    this.#textValueName = configs.DefaultValueName;
    this.#autoGenBucket = true;

    /** @public */
    this.thresholdScore = configs.DefaultThreshold;
    this.sortOrder = configs.DefaultSortOrder;
    this.limit = configs.DefaultLimit;
    this.offset = 0;
    this.useAddedScore = false;
  }

  #setup(args = {}) {
    const {
      textBucket = { [configs.DefaultTextBucket]: { textIndex: {}, textDict: {} } },
      textKeyName = configs.DefaultKeyName,
      textValueName = configs.DefaultValueName,
      thresholdScore = configs.DefaultThreshold,
      sortOrder = configs.DefaultSortOrder,
      limit = configs.DefaultLimit,
      offset = 0,
      autoGenBucket = true,
      useAddedScore = false
    } = args;

    /** @private */
    this.#textBucket = textBucket;
    this.#textKeyName = textKeyName;
    this.#textValueName = textValueName;
    this.#autoGenBucket = autoGenBucket;

    /** @public */
    this.thresholdScore = thresholdScore;
    this.sortOrder = sortOrder;
    this.limit = limit;
    this.offset = offset;
    this.useAddedScore = useAddedScore;
  }

  #initBucketIfNotExist(bucket) {
    if (!this.#textBucket[bucket]) {
      this.#textBucket[bucket] = { textIndex: {}, textDict: {} };
    }
  }

  #validateAddParams(textObj = {}, options = {}) {
    const textKeyName = this.#textKeyName;
    const textValueName = this.#textValueName;
    const textKey = textObj[textKeyName];
    const textValue = textObj[textValueName];
    const addedScore = textObj['addedScore'] || 0;
    const textBucket = this.#textBucket;
    const autoGenBucket = this.#autoGenBucket;
    let bucket = options.bucket || textObj['bucket'];

    if (
      typeof textKey !== 'string' ||
      !textKey.trim() ||
      typeof textValue !== 'string' ||
      !textValue.trim() ||
      Number.isNaN(+addedScore)
    ) {
      return {
        valid: false,
        message: `invalid text object [${textKey}] or textKeyName & textValueName of the object not match with the initialization configs`
      };
    }
    if (bucket) {
      if (typeof bucket !== 'string' || !(bucket.trim() + '')) {
        return { valid: false, message: `invalid bucket [${bucket}]` };
      } else {
        bucket = bucket.trim().toLowerCase();
      }
    } else {
      bucket = configs.DefaultTextBucket;
    }
    if (!textBucket[bucket] && !autoGenBucket) {
      return { valid: false, message: `bucket [${bucket}] not found` };
    }
    if (textBucket[bucket] && textBucket[bucket].textDict[textKey.trim()]) {
      return { valid: false, message: `textKey [${textKey}] existed` };
    }

    const valTextObj = {
      [textKeyName]: textKey.trim(),
      [textValueName]: textValue.trim(),
      bucket,
      addedScore: +addedScore
    };
    return { valid: true, data: { textObj: valTextObj, options } };
  }

  async #validateAddManyParams(textObjs, options = {}) {
    const self = this;
    const valResults = await Promise.all(
      textObjs.map((textObj) => self.#validateAddParams(textObj, options))
    );
    const hasInvalid = valResults.find((res) => !res.valid);
    if (hasInvalid) {
      return { valid: false, message: hasInvalid.message };
    }
    const valTextObjs = valResults.map((res) => res.data.textObj);
    return { valid: true, data: { textObjs: valTextObjs, options }, rawResults: valResults };
  }

  #validateUpdateParams(textKey, textObj = {}, options = {}) {
    const textKeyName = this.#textKeyName;
    const textValueName = this.#textValueName;
    const textValue = textObj[textValueName];
    const addedScore = textObj['addedScore'];
    const textBucket = this.#textBucket;
    const upsert = options.upsert;
    let bucket = options.bucket || textObj['bucket'];

    if (typeof textKey !== 'string' || !textKey.trim()) {
      return { valid: false, message: `invalid textKey [${textKey}]` };
    }
    if (typeof textValue !== 'string' || !textValue.trim()) {
      return { valid: false, message: `invalid text object [${textKey}]` };
    }
    if (addedScore && Number.isNaN(+addedScore)) {
      return { valid: false, message: `invalid addedScore at [${textKey}]` };
    }
    if (bucket) {
      if (typeof bucket !== 'string' || !(bucket.trim() + '')) {
        return { valid: false, message: `invalid bucket [${bucket}]` };
      } else {
        bucket = bucket.trim().toLowerCase();
      }
    } else {
      bucket = configs.DefaultTextBucket;
    }
    if (!textBucket[bucket]) {
      return { valid: false, message: `bucket [${bucket}] not found` };
    }
    if (!textBucket[bucket].textDict[textKey.trim()] && !upsert) {
      return { valid: false, message: `textKey [${textKey}] not found` };
    }

    const valTextObj = {
      [textKeyName]: textKey.trim(),
      [textValueName]: textValue.trim(),
      ...(addedScore ? { addedScore: +addedScore } : {}),
      bucket
    };
    return {
      valid: true,
      data: { textKey: textKey.trim(), textObj: valTextObj, options }
    };
  }

  async #validateUpdateManyParams(textObjs, options) {
    const self = this;
    const valResults = await Promise.all(
      textObjs.map((textObj) =>
        self.#validateUpdateParams(textObj[self.#textKeyName], textObj, options)
      )
    );
    const hasInvalid = valResults.find((res) => !res.valid);
    if (hasInvalid) {
      return { valid: false, message: hasInvalid.message };
    }
    const valTextObjs = valResults.map((res) => res.data.textObj);
    return { valid: true, data: { textObjs: valTextObjs, options }, rawResults: valResults };
  }

  #validateRemoveParams(textKey, options = {}) {
    const textBucket = this.#textBucket;
    const forceRemove = options.forceRemove;
    let bucket = options.bucket;

    if (typeof textKey !== 'string' || !textKey.trim()) {
      return { valid: false, message: `invalid textKey [${textKey}]` };
    }
    if (bucket) {
      if (typeof bucket !== 'string' || !(bucket.trim() + '')) {
        return { valid: false, message: `invalid bucket [${bucket}]` };
      } else {
        bucket = bucket.trim().toLowerCase();
      }
    } else {
      bucket = configs.DefaultTextBucket;
    }
    if (!textBucket[bucket]) {
      return { valid: !!forceRemove, message: `bucket [${bucket}] not found` };
    }
    if (!textBucket[bucket].textDict[textKey.trim()]) {
      return { valid: !!forceRemove, message: `textKey [${textKey}] not found` };
    }

    const textObj = textBucket[bucket].textDict[textKey.trim()];
    textObj['bucket'] = textObj['bucket'] || bucket;

    return { valid: true, data: { textKey: textKey.trim(), textObj, options } };
  }

  async #validateRemoveManyParams(textKeys, options) {
    const self = this;
    const valResults = await Promise.all(
      textKeys.map((textKey) => self.#validateRemoveParams(textKey, options))
    );
    const hasInvalid = valResults.find((res) => !res.valid);
    if (hasInvalid) {
      return { valid: false, message: hasInvalid.message };
    }
    const valTextObjs = valResults.map((res) => (res.data ? res.data.textObj : null));
    return { valid: true, data: { textObjs: valTextObjs, options }, rawResults: valResults };
  }

  #validateSearchOptions(options = {}) {
    try {
      let { offset, limit, sortOrder, thresholdScore, useAddedScore, buckets } = options;
      const valOptions = { useAddedScore: !!useAddedScore || this.useAddedScore };

      if (offset) {
        if (!Number.isInteger(+offset) || +offset < 0) {
          throw new Error('offset must be an integer and greater than or equals 0');
        }
        valOptions.offset = +offset;
      } else {
        valOptions.offset = this.offset;
      }
      if (limit) {
        if (!Number.isInteger(+limit) || +limit < 0) {
          throw new Error('limit must be an integer and greater than or equals 0');
        }
        valOptions.limit = +limit;
      } else {
        valOptions.limit = this.limit;
      }
      if (sortOrder) {
        if (![-1, 1, '-1', '1'].includes(sortOrder)) {
          throw new Error('sortOrder must be -1: descending | 1: ascending');
        }
        valOptions.sortOrder = +sortOrder;
      } else {
        valOptions.sortOrder = this.sortOrder;
      }
      if (thresholdScore) {
        if (Number.isNaN(+thresholdScore) || +thresholdScore < 0) {
          throw new Error('thresholdScore must be an integer and greater than or equals 0');
        }
        valOptions.thresholdScore = +thresholdScore;
      } else {
        valOptions.thresholdScore = this.thresholdScore;
      }
      if (Array.isArray(buckets) && buckets.length) {
        const textBucket = this.#textBucket;
        buckets = [...new Set(buckets)];
        const length = buckets.length;
        let i = 0;
        while (i < length) {
          const bucket = buckets[i];
          if (typeof bucket !== 'string' || !bucket.trim()) {
            throw new Error(`invalid bucket [${bucket}]`);
          }
          if (!textBucket[bucket.trim().toLowerCase()]) {
            throw new Error(`bucket [${bucket}] not found`);
          }
          i += 1;
        }

        valOptions.buckets = buckets.map((bucket) => bucket.trim().toLowerCase());
      } else {
        valOptions.buckets = Object.keys(this.#textBucket);
      }

      return {
        valid: true,
        message: 'ok',
        data: valOptions
      };
    } catch (err) {
      return { valid: false, message: err.message || 'something went wrong', data: null };
    }
  }

  #validateInitOptions(options = {}) {
    const textPattern = /[a-zA-Z0-9_]/g;
    let { textKeyName, textValueName, autoGenBucket, bucket, ...searchOptions } = options;
    const searchValResult = this.#validateSearchOptions(searchOptions);
    if (!searchValResult.valid) {
      throw new Error(searchValResult.message);
    }

    const valOptions = { ...searchValResult.data, autoGenBucket: !!autoGenBucket };

    if (bucket) {
      if (typeof bucket !== 'string' || !textPattern.test(bucket)) {
        throw new Error('bucket can only contains a-z, A-Z, 0-9, _');
      }
      valOptions.bucket = bucket.trim();
    } else {
      valOptions.bucket = configs.DefaultTextBucket;
    }
    if (textKeyName) {
      if (typeof textKeyName !== 'string' || !textPattern.test(textKeyName.trim())) {
        throw new Error('textKeyName can only contains a-z, A-Z, 0-9, _');
      }
      valOptions.textKeyName = textKeyName.trim();
    } else {
      valOptions.textKeyName = configs.DefaultKeyName;
    }
    if (textValueName) {
      if (typeof textValueName !== 'string' || !textPattern.test(textValueName.trim())) {
        throw new Error('textValueName can only contains a-z, A-Z, 0-9, _');
      }
      valOptions.textValueName = textValueName.trim();
    } else {
      valOptions.textValueName = configs.DefaultValueName;
    }

    return {
      valid: true,
      message: 'ok',
      data: valOptions
    };
  }

  /**
   * Initialize an TextSearch instance with options
   * @param {TextObject} textObjs
   * @param {InitOptions} options
   * @param {Function} cb
   * @returns {Promise<TextSearch>} TextSearch's instance
   */
  static async init(textObjs = [], options = {}, cb = null) {
    try {
      if (!Array.isArray(textObjs)) {
        throw new Error('textObjs must be array');
      }

      const initArgs = {};

      const instance = new TextSearch();
      const valOptionsResult = instance.#validateInitOptions(options);
      if (!valOptionsResult.valid) {
        throw new Error(valOptionsResult.message);
      }

      Object.entries(valOptionsResult.data).forEach(([key, val]) => {
        initArgs[key] = val;
      });

      instance.#setup(initArgs);

      const { bucket } = valOptionsResult.data;
      instance.#initBucketIfNotExist(bucket);
      await instance.addManyTextObjs(textObjs, {
        ...(bucket ? { bucket } : {})
      });

      if (cb) {
        return cb(null, instance);
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
   * Search for `text`
   * @param {string} text
   * @param {SearchOptions} options
   * @param {Function} cb
   * @returns {Promise<SearchResult>} { data, sortOrder, thresholdScore, offset, limit, total, text, buckets }
   */
  async search(text, options = {}, cb = null) {
    try {
      const textToSearch = (text + '').trim();
      const valResult = this.#validateSearchOptions(options);
      if (!valResult.valid) {
        throw new Error(valResult.message);
      }
      const { sortOrder, limit, offset, thresholdScore, buckets, useAddedScore } = valResult.data;
      const { keywords } = textHandler.extractKeywordsFromText(textToSearch, true);
      const rawResult = await scoreHandler.getTextScoresWithManyKeywords(
        this.#textBucket,
        keywords,
        { buckets, useAddedScore }
      );
      const sortFunc = sortOrder === -1 ? (s1, s2) => -s1[1] + s2[1] : (s1, s2) => s1[1] - s2[1];
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
            buckets,
            text: textToSearch
          })
        : {
            data: finalResult.slice(startResults, endResults),
            sortOrder,
            thresholdScore,
            offset,
            limit,
            total,
            buckets,
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
   * Add a new text object to a bucket
   * @param {TextObject} textObj
   * @param {AddObjectOptions} options
   * @param {Function} cb
   * @returns {Promise<{ nAdded: number, bucket: string, keywords: Keyword[]}>} { nAdded: number, bucket: string, keywords: [] }
   * @deprecated use addTextObj instead.
   */
  async addNewTextObj(textObj, options = {}, cb = null) {
    try {
      const valResult = this.#validateAddParams(textObj, options);
      if (!valResult.valid) {
        throw new Error(valResult.message);
      }

      const baseOptions = {
        textKeyName: this.#textKeyName,
        textValueName: this.#textValueName
      };

      const { bucket, keywords } = indexHandler.createIndexForTextObj(
        this.#textBucket,
        valResult.data.textObj,
        baseOptions
      );

      if (cb) {
        return cb(null, { nAdded: 1, bucket, keywords });
      }
      return { nAdded: 1, bucket, keywords };
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
   * Add many text objects to bucket(s)
   * @param {TextObject} textObj
   * @param {AddObjectOptions} options
   * @param {Function} cb
   * @returns {Promise<{nAdded: number, details: object}>} { nAdded: number, details: {} }
   * @deprecated use addManyTextObjs instead.
   */
  async addManyNewTextObjs(textObjs, options = {}, cb = null) {
    try {
      const valResult = await this.#validateAddManyParams(textObjs, options);
      if (!valResult.valid) {
        throw new Error(valResult.message);
      }

      const baseOptions = {
        textKeyName: this.#textKeyName,
        textValueName: this.#textValueName
      };

      const { textBucket, ...metadata } = await indexHandler.createTextIndexByManyTextObjs(
        valResult.data.textObjs,
        this.#textBucket,
        baseOptions
      );

      const result = {
        nAdded: metadata.totalObjects,
        details: metadata.details
      };
      if (cb) {
        return cb(null, result);
      }
      return result;
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
   * Add a new text object to a bucket
   * @param {TextObject} textObj
   * @param {AddObjectOptions} options
   * @param {Function} cb
   * @returns {Promise<{ nAdded: number, bucket: string, keywords: Keyword[]}>} { nAdded: number, bucket: string, keywords: [] }
   */
  async addTextObj(textObj, options = {}, cb = null) {
    try {
      const valResult = this.#validateAddParams(textObj, options);
      if (!valResult.valid) {
        throw new Error(valResult.message);
      }

      const baseOptions = {
        textKeyName: this.#textKeyName,
        textValueName: this.#textValueName
      };

      const { bucket, keywords } = indexHandler.createIndexForTextObj(
        this.#textBucket,
        valResult.data.textObj,
        baseOptions
      );

      if (cb) {
        return cb(null, { nAdded: 1, bucket, keywords });
      }
      return { nAdded: 1, bucket, keywords };
    } catch (err) {
      log('addTextObj error:');
      log(err);
      if (cb) {
        return cb(err);
      }

      throw err;
    }
  }

  /**
   * Add many text objects to bucket(s)
   * @param {TextObject} textObj
   * @param {AddObjectOptions} options
   * @param {Function} cb
   * @returns {Promise<{nAdded: number, details: object}>} { nAdded: number, details: {} }
   */
  async addManyTextObjs(textObjs, options = {}, cb = null) {
    try {
      const valResult = await this.#validateAddManyParams(textObjs, options);
      if (!valResult.valid) {
        throw new Error(valResult.message);
      }

      const baseOptions = {
        textKeyName: this.#textKeyName,
        textValueName: this.#textValueName
      };

      const { textBucket, ...metadata } = await indexHandler.createTextIndexByManyTextObjs(
        valResult.data.textObjs,
        this.#textBucket,
        baseOptions
      );

      const result = {
        nAdded: metadata.totalObjects,
        details: metadata.details
      };
      if (cb) {
        return cb(null, result);
      }
      return result;
    } catch (err) {
      log('addManyTextObjs error:');
      log(err);
      if (cb) {
        return cb(err);
      }

      throw err;
    }
  }

  /**
   * Update a text object
   * @param {TextKey} textKey
   * @param {TextObject} textObj
   * @param {UpdateObjectOptions} options
   * @param {Function} cb
   * @returns {Promise<{ nUpserted: number, bucket: string, newKeywords: Keyword[], removedKeywords: Keyword[]}>} { nUpserted: number, bucket: string, newKeywords: [], removedKeywords: []}
   */
  async updateTextObj(textKey, textObj, options = {}, cb = null) {
    try {
      const valResult = this.#validateUpdateParams(textKey, textObj, options);
      if (!valResult.valid) {
        throw new Error(valResult.message);
      }

      const { textKey: valTextKey, textObj: valTextObj } = valResult.data;
      const baseOptions = {
        textKeyName: this.#textKeyName,
        textValueName: this.#textValueName
      };

      const oldTextObj = this.#textBucket[valTextObj.bucket].textDict[valTextKey];
      const { bucket, newKeywords, removedKeywords } = await indexHandler.updateIndexOfTextObj(
        this.#textBucket,
        oldTextObj,
        valTextObj,
        baseOptions
      );

      const result = { nUpserted: 1, bucket, newKeywords, removedKeywords };
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
   * Update many text objects
   * @param {TextObject[]} textObjs
   * @param {UpdateObjectOptions} options
   * @param {Function} cb
   * @returns {Promise<{ nUpserted: number, details: object}>} { nUpserted: number, details: {} }
   */
  async updateManyTextObjs(textObjs, options = {}, cb = null) {
    try {
      const valResult = await this.#validateUpdateManyParams(textObjs, options);
      if (!valResult.valid) {
        throw new Error(valResult.message);
      }

      const textKeyName = this.#textKeyName;
      const { textObjs: valTextObjs } = valResult.data;
      const baseOptions = {
        textKeyName,
        textValueName: this.#textValueName
      };

      const length = valTextObjs.length;
      let i = 0;
      let nUpserted = 0;
      const details = {};
      while (i < length) {
        const textObj = valTextObjs[i];
        const textKey = textObj[textKeyName];
        const oldTextObj = this.#textBucket[textObj.bucket].textDict[textKey];

        const {
          bucket,
          newKeywords,
          removedKeywords,
          nUpdated: _nUpdated,
          nAdded: _nAdded
        } = await indexHandler.updateIndexOfTextObj(
          this.#textBucket,
          oldTextObj,
          textObj,
          baseOptions
        );

        if (details[bucket]) {
          details[bucket].nUpdated += _nUpdated;
          details[bucket].nAdded += _nAdded;
        } else {
          details[bucket] = { nUpdated: _nUpdated, nAdded: _nAdded };
        }

        nUpserted += 1;

        i += 1;
      }

      const result = { nUpserted, details };
      if (cb) {
        return cb(null, result);
      }
      return result;
    } catch (err) {
      log('updateManyTextObjs error:');
      log(err);
      if (cb) {
        return cb(err);
      }

      throw err;
    }
  }

  /**
   * Remove a text object
   * @param {TextKey} textKey
   * @param {RemoveObjectOptions} options
   * @param {Function} cb
   * @returns {Promise<{ nRemoved: number, bucket: string, removedKeywords: Keyword[]}>} { nRemoved: number, bucket, string, removedKeywords: [] }
   */
  async removeTextObj(textKey, options = {}, cb = null) {
    try {
      const valResult = this.#validateRemoveParams(textKey, options);
      if (!valResult.valid) {
        throw new Error(valResult.message);
      }
      if (valResult.valid && !valResult.data) {
        return { nRemoved: 0, removedKeywords: [] };
      }

      const baseOptions = { textKeyName: this.#textKeyName, textValueName: this.#textValueName };
      const { bucket, removedKeywords } = indexHandler.removeIndexOfTextObj(
        this.#textBucket,
        valResult.data.textObj,
        baseOptions
      );

      const result = { nRemoved: 1, bucket, removedKeywords };
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
   * Remove many text objects
   * leave textKeys = [] for removing all text indices
   * @param {TextKeys[]} textKeys
   * @param {RemoveObjectOptions} options
   * @param {Function} cb
   * @returns {Promise<{ nRemoved: number, details: object}>} { nRemoved: number, details: {} }
   */
  async removeManyTextObjs(textKeys, options = {}, cb = null) {
    try {
      if (!Array.isArray(textKeys)) {
        throw new Error('textKeys must be array');
      }
      const valResult = await this.#validateRemoveManyParams(textKeys, options);
      if (!valResult.valid) {
        throw new Error(valResult.message);
      }

      const baseOptions = { textKeyName: this.#textKeyName, textValueName: this.#textValueName };
      const { textObjs: valTextObjs } = valResult.data;
      const length = valTextObjs.length;
      let i = 0;
      let nRemoved = 0;
      const details = {};
      while (i < length) {
        const textObj = valTextObjs[i];
        if (textObj) {
          const { bucket } = indexHandler.removeIndexOfTextObj(
            this.#textBucket,
            textObj,
            baseOptions
          );
          if (details[bucket]) {
            details[bucket].nRemoved += 1;
          } else {
            details[bucket] = { nRemoved: 1 };
          }

          nRemoved += 1;
        }

        i += 1;
      }

      const result = { nRemoved, details };
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

  /**
   * Remove bucket(s)
   * @param {string[] | string} buckets
   * @returns {{ nRemoved: number, nRemains: number}} { nRemoved: number, nRemains: number }
   */
  removeBuckets(buckets) {
    let bucketsToRemove = [];
    if (typeof buckets === 'string') {
      bucketsToRemove.push(buckets.trim().toLowerCase());
    } else if (Array.isArray(buckets)) {
      bucketsToRemove = [...new Set(buckets.map((bucket) => ('' + bucket).trim().toLowerCase()))];
    } else {
      throw new Error('invalid buckets');
    }

    const length = bucketsToRemove.length;
    const currentBuckets = Object.keys(this.#textBucket);
    let i = 0;
    let nRemoved = 0;
    let nRemains = currentBuckets.length;
    while (i < length) {
      const bucket = bucketsToRemove[i];
      if (!currentBuckets.includes(bucket)) {
        throw new Error(`bucket [${bucket}] not found`);
      } else if (bucket === configs.DefaultTextBucket) {
        continue;
      }

      delete this.#textBucket[bucket];
      nRemoved += 1;
      nRemains -= 1;

      i += 1;
    }

    return { nRemoved, nRemains };
  }

  /**
   * Get stats of TextSearch's instance
   * @returns {{ nObjects: number, nIndices: number, details: []}} { nObjects: number, nIndices: number, details: []}
   */
  getStats() {
    const textBucket = this.#textBucket;
    const result = { nBuckets: 0, nObjects: 0, nIndices: 0, details: [] };
    const buckets = Object.keys(textBucket);
    result.nBuckets = buckets.length;
    let i = 0;
    while (i < result.nBuckets) {
      const bucket = textBucket[buckets[i]];
      const nObjects = Object.keys(bucket.textDict).length;
      const nIndices = countNestedObjectKeys(bucket.textIndex);

      result.details.push({ bucket: buckets[i], nIndices, nObjects });
      result.nObjects += nObjects;
      result.nIndices += nIndices;

      i += 1;
    }

    return result;
  }
}

export default TextSearch;
