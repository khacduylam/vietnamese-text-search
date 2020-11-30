import configs from './config';
import charmap from './charmap.json';
const pattern = /[`!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/gi;
const ligatures = ['ch', 'gh', 'gi', 'kh', 'ng', 'ngh', 'nh', 'ph', 'th', 'tr'];
const specialCharacters = [
  '/',
  '\\',
  '@',
  '#',
  '$',
  '%',
  '^',
  '&',
  '*',
  '(',
  ')',
  '{',
  '}',
  '[',
  ']',
  '+',
  '-',
  '=',
  '_',
  ',',
  '.',
  '!',
  '`',
  '!',
  '<',
  '>',
  '?',
  ';',
  ':',
  '"',
  "'",
  'NULLL'
];
const textPattern = /[a-zA-Z0-9_]/g;

export function containsSpecialChars(rawText) {
  if (typeof rawText !== 'string') {
    throw new Error('argument must be a string');
  }

  return rawText
    .trim()
    .split('')
    .some((char) => specialCharacters.includes(char));
}

export function slugifyText(rawText, toLower = false) {
  if (typeof rawText !== 'string') {
    throw new Error('argument must be a string');
  }
  let text = '';
  const length = rawText.trim().length;
  for (let i = 0; i < length; i += 1) {
    const char = rawText[i];
    if (charmap[char]) {
      text += char;
    } else if (specialCharacters.includes(char)) {
      text += ' ';
    }
  }

  return toLower ? text.toLowerCase() : text;
}

export function intersect(arr1, arr2) {
  if (!arr1.length) {
    return { same: [], diff1: arr2, diff2: arr2 };
  }
  if (!arr2.length) {
    return { same: [], diff1: arr1, diff2: arr1 };
  }

  const result = { same: [], diff1: [], diff2: [] };
  result.same = arr1.filter((item) => arr2.includes(item));
  result.diff1 = arr1.filter((item) => !arr2.includes(item));
  result.diff2 = arr2.filter((item) => !result.same.includes(item));

  return result;
}

export function removeAccents(rawText) {
  if (typeof rawText !== 'string') {
    throw new Error('argument must be a string');
  }
  return rawText
    .normalize('NFD')
    .replace(/[\u0300-\u036f\u2000-\u200f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

export function parseObjectOfArrays(obj) {
  let results = [];
  for (const val of Object.values(obj)) {
    results = results.concat([...val]);
  }

  return [...new Set([...results])];
}

export function shuffleArray(arr) {
  const array = [...arr];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
export function getNestedObjValues(obj, values) {
  if (!obj) {
    return;
  }
  if (obj instanceof Set) {
    values.push(...obj);
    return;
  }
  Object.values(obj).forEach((childObj) => getNestedObjValues(childObj, values));
}

export function log(message, ...rest) {
  if (process.env.NODE_ENV === 'development') {
    return console.log(message, ...rest);
  }
}

export function getLigatures(rawText) {
  if (typeof rawText !== 'string') {
    throw new Error('argument must be a string');
  }

  let text = rawText.trim();
  const end = +ligatures.includes(text.slice(0, 2)) + 1;
  return text.slice(0, end);
}

export function tokenize(rawText, toLower = false) {
  if (typeof rawText !== 'string' || !rawText.trim()) {
    return [];
  }

  const text = slugifyText(rawText, toLower).replace(pattern, ' ').trim();

  return text.split(/\s+/g);
}

export function validateSearchOptions(options = {}) {
  try {
    let { offset, limit, sortOrder, thresholdScore } = options;

    if (!Number.isInteger(+offset) || +offset < 0) {
      throw new Error('offset must be an integer and greater than or equals 0');
    }
    if (!Number.isInteger(+limit) || +limit < 0) {
      throw new Error('limit must be an integer and greater than or equals 0');
    }
    if (Number.isNaN(+thresholdScore) || +thresholdScore < 0) {
      throw new Error('thresholdScore must be an integer and greater than or equals 0');
    }
    if (![-1, 1, '-1', 1].includes(sortOrder)) {
      throw new Error('sortOrder must be -1: descending | 1: ascending');
    } else {
      sortOrder = +sortOrder;
    }

    return {
      valid: true,
      message: 'ok',
      data: { offset, limit, sortOrder, thresholdScore }
    };
  } catch (err) {
    return { valid: false, message: err.message || 'something went wrong', data: null };
  }
}

export function validateInitOptions(options = {}) {
  let { textKeyName, textValueName, ...searchOptions } = options;
  const searchValResult = validateSearchOptions(searchOptions);
  if (!searchValResult.valid) {
    throw new Error(searchValResult.message);
  }

  if (typeof textKeyName !== 'string' || !textPattern.test(textKeyName.trim())) {
    throw new Error('textKeyName can only contains a-z, A-Z, 0-9, _');
  } else {
    textKeyName = textKeyName.trim();
  }
  if (typeof textValueName !== 'string' || !textPattern.test(textValueName.trim())) {
    throw new Error('textValueName can only contains a-z, A-Z, 0-9, _');
  } else {
    textValueName = textValueName.trim();
  }

  return {
    valid: true,
    message: 'ok',
    data: { ...searchValResult.data, textKeyName, textValueName }
  };
}

export function validateTextObj(
  textObj = {},
  { textKeyName = configs.DefaultKeyName, textValueName = configs.DefaultValueName }
) {
  const textKey = textObj[textKeyName];
  const textValue = textObj[textValueName];
  if (
    !textObj ||
    typeof textKey !== 'string' ||
    !textKey.trim() ||
    typeof textValue !== 'string' ||
    !textValue.trim()
  ) {
    return { valid: false, message: 'invalid text object', data: null };
  }

  return {
    valid: true,
    message: 'ok',
    data: { [textKeyName]: textKey.trim(), [textValueName]: textValue.trim() }
  };
}
