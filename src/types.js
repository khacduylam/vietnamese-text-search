/**
 * @typedef {Object} TextIndex
 */

/**
 * @typedef {string} TextId
 */

/**
 * @typedef {string} Text
 */

/**
 * @typedef TextObject
 * @property {TextId} textId
 * @property {Text} text
 */

/**
 * @typedef {string} Keyword
 */

/**
 * @typedef ScoreObject
 * @property {number} textId
 */

/**
 * @typedef {[TextId, Text]} ScoreEntry
 */

/**
 * @typedef Text4lsObject
 * @property {Set<string>} l0
 * @property {Set<string>} l1
 * @property {Set<string>} l2
 * @property {Set<string>} l3
 */

/**
 * @typedef SearchOptions
 * @property {number} thresholdScore
 * @property {-1|1} sortOrder
 * @property {number} limit
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
