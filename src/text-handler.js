import { removeAccents, tokenize, log } from './utils';

export default {
  /**
   * @param {string} rawText
   * @param {boolean} toLower
   * @returns {{keywords: Keyword[], pureKeywords: Keyword[]}}
   */
  extractKeywordsFromText(rawText, toLower = false) {
    const tokens = tokenize(rawText, toLower);

    const keywords = [...new Set(tokens)];
    const pureKeywords = keywords.map((kw) => removeAccents(kw));

    return { keywords, pureKeywords };
  },

  /**
   * @param {string[]} textArr
   * @param {boolean} toLower
   * @returns {Promise<[{keywords: Keyword[], pureKeywords: Keyword[]}]>}
   */
  async extractKeywordsFromManyTexts(textArr = [], toLower = false) {
    const results = await Promise.all(
      textArr.map((text) => this.extractKeywordsFromText(text, toLower))
    );

    return results;
  },

  /**
   * @param {TextObject[]} textObjs
   * @param {ExtractOptions} extractOptions
   * @returns {Promise<[{keywords: Keyword[], pureKeywords: Keyword[], textKey: string, textValue: string}]>}
   */
  async extractKeywordsFromManyTextObjs(
    textObjs = [],
    {
      toLower = false,
      textKeyName = configs.DefaultKeyName,
      textValueName = configs.DefaultValueName
    }
  ) {
    try {
      const textArr = textObjs.map((textObj) => textObj[textValueName]);

      // output: [{ keywords: [], pureKeywords: [] },..]
      const extractedKeywordsArr = await this.extractKeywordsFromManyTexts(textArr, toLower);

      // ouput: [{ keywords: [], pureKeywords: [], textKey, textValue },...]
      const extractedKeywordObjs = textObjs.map((textObj, idx) => ({
        ...textObj,
        ...extractedKeywordsArr[idx]
      }));

      return extractedKeywordObjs;
    } catch (err) {
      log(`extractKeywordsFromManyTextObjs error`);
      log(err);

      throw err;
    }
  }
};
