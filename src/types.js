/**
 * @typedef {object} TextIndex
 */

/**
 * @typedef {object} TextBucket
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
 * @property {number} [addedScore=0]
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
 * @typedef GetTextScoreOptions
 * @property {string[]} [buckets]
 * @property {boolean} [useAddedScore]
 * @property {number} [keysLength]
 */

/**
 * @typedef CreateIndexOptions
 * @property {string} textKeyName
 * @property {string} textValueName
 * @property {string[]} [keywords]
 */

/**
 * @typedef RemoveIndexOptions
 * @property {string} textKeyName
 * @property {string} textValueName
 * @property {string[]} [keywords]
 */

/**
 * @typedef UpdateIndexOptions
 * @property {string} textKeyName
 * @property {string} textValueName
 * @property {string[]} [newKeywords]
 * @property {string[]} [removedKeywords]
 */

/**
 * @typedef ExtractOptions
 * @property {boolean} toLower
 * @property {string} textKeyName
 * @property {string} textValueName
 */

/**
 * @typedef InitOptions
 * @property {number} [thresholdScore=0.5]
 * @property {-1|1} [sortOrder=-1]
 * @property {number} [limit=30]
 * @property {string} [textKeyName="textId"]
 * @property {string} [textValueName="text"]
 * @property {string} [bucket]
 * @property {boolean} [useAddedScore=false]
 * @property {boolean} [autoGenBucket=true]
 */

/**
 * @typedef SearchOptions
 * @property {number} [thresholdScore=0.5]
 * @property {-1|1} [sortOrder=-1]
 * @property {number} [limit=30]
 * @property {number} [offset=0]
 * @property {string[]} [buckets]
 * @property {boolean} [useAddedScore=false]
 */

/**
 * @typedef AddObjectOptions
 * @property {string} [bucket="default"]
 */

/**
 * @typedef UpdateObjectOptions
 * @property {string} [bucket="default"]
 * @property {string} [upsert=false]
 */

/**
 * @typedef RemoveObjectOptions
 * @property {string} [bucket="default"]
 * @property {string} [forceRemove=false]
 */

/**
 * @typedef SearchResult
 * @property {ScoreEntry[]} data
 * @property {number} thresholdScore
 * @property {-1|1} sortOrder
 * @property {number} limit
 * @property {number} total
 * @property {number} offset
 * @property {string[]} buckets
 * @property {string} text
 */
