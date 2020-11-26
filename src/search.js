import textHandler from './text-handler';
import scoreHandler from './score-handler';
import configs from './config';
import indexHandler from './index-handler';
import { log } from './utils';

class TextSearch {
  constructor() {
    this.textIndex = {};
    this.thresholdScore = configs.DefaultThreshold;
    this.sortOrder = configs.DefaultSortOrder;
    this.limit = 0;
  }
  async init(textObjs = [], options = {}, cb) {
    try {
      const {
        thresholdScore = configs.DefaultThreshold,
        sortOrder = configs.DefaultSortOrder,
        limit = 0
      } = options;
      if (!Number.isNaN(+thresholdScore) && thresholdScore >= 0) {
        this.thresholdScore = thresholdScore;
      } else {
        throw new Error('thresholdScore is invalid');
      }
      if ([-1, 1, '-1', '1'].includes(sortOrder)) {
        this.sortOrder = +sortOrder;
      } else {
        throw new Error('sortOrder muse be -1 or 1');
      }

      const { textIndex, nIndices } = await indexHandler.createTextIndexByManyTextObjs(textObjs);
      this.textIndex = textIndex;
      const result = { nIndices };
      if (cb) {
        return cb(null, result);
      }

      this.textDict = {};
      const textObjsSize = textObjs.length;
      let i = 0;
      while (i < textObjsSize) {
        this.textDict[textObjs[i].textId] = textObjs[i].text;
        i += 1;
      }

      if (Number.isInteger(+limit) && +limit > -1) {
        this.limit = +limit;
      } else {
        throw new 'limit muse be greater than or equals 0'();
      }

      return result;
    } catch (err) {
      if (cb) {
        return cb(err);
      }
      throw err;
    }
  }
  async search(text, options = {}, cb) {
    try {
      const {
        sortOrder = this.sortOrder,
        thresholdScore = this.thresholdScore,
        limit = this.limit,
        offset = 0
      } = options;
      const { keywords } = textHandler.extractKeywordsFromText(text, true);
      const rawResult = await scoreHandler.getTextScoresWithManyKeywords(this.textIndex, keywords);

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
            text
          })
        : {
            data: finalResult.slice(offset, +limit !== 0 ? +limit : total),
            sortOrder,
            thresholdScore,
            offset,
            limit,
            total,
            text
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
  async addNewTextObj(textObj, cb) {
    try {
      const { keywords } = indexHandler.createIndexForTextObj(this.textIndex, textObj);

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
  async updateTextObj(oldTextObj, textObj, cb) {
    try {
      const { newKeywords, removedKeywords } = await indexHandler.updateIndexOfTextObj(
        this.textIndex,
        oldTextObj,
        textObj
      );

      const result = { nUpserted: 1, newKeywords, removedKeywords };
      if (cb) {
        return cb(null, result);
      }
      return result;
    } catch (err) {
      log('addNewTextObj error:');
      log(err);
      if (cb) {
        return cb(err);
      }

      throw err;
    }
  }
  async removeTextObj(textObj, cb) {
    try {
      const { removedKeywords } = indexHandler.removeIndexOfTextObj(this.textIndex, textObj);

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
