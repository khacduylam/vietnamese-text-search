/**
 * @typedef {object} TextIndex
 */

/**
 * @typedef {string} TextKey
 */

/**
 * @typedef {string} TextValue
 */

/**
 * @typedef TextObject
 * @property {TextKey} textKey
 * @property {TextValue} textValue
 */

/**
 * @typedef {string} Keyword
 */

/**
 * @typedef {number} Score
 */

/**
 * @typedef ScoreObject
 * @property {number} textKey
 */

/**
 * @typedef {[TextKey, Score]} ScoreEntry
 */

/**
 * @typedef Text4lsObject
 * @property {Set<string>} l0
 * @property {Set<string>} l1
 * @property {Set<string>} l2
 * @property {Set<string>} l3
 */

/**
 * @typedef CreateIndexOptions
 * @property {string} textKeyName
 * @property {string} textValueName
 * @property {string[]} keywords
 */

/**
 * @typedef RemoveIndexOptions
 * @property {string} textKeyName
 * @property {string} textValueName
 * @property {string[]} keywords
 */

/**
 * @typedef UpdateIndexOptions
 * @property {string} textKeyName
 * @property {string} textValueName
 * @property {string[]} newKeywords
 * @property {string[]} removedKeywords
 */

/**
 * @typedef ExtractOptions
 * @property {boolean} toLower
 * @property {string} textKeyName
 * @property {string} textValueName
 */

/**
 * @typedef InitOptions
 * @property {number} thresholdScore
 * @property {-1|1} sortOrder
 * @property {number} limit
 * @property {string} textKeyName
 * @property {string} textValueName
 */

/**
 * @typedef SearchOptions
 * @property {number} thresholdScore
 * @property {-1|1} sortOrder
 * @property {number} limit
 * @property {number} offset
 */

/**
 * @typedef SearchResult
 * @property {ScoreEntry[]} data
 * @property {number} thresholdScore
 * @property {-1|1} sortOrder
 * @property {number} limit
 * @property {number} total
 * @property {number} offset
 * @property {string} text
 */
