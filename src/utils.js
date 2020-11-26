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
  if (typeof rawText !== 'string') {
    throw new Error('argument must be a string');
  }
  if (!rawText.trim()) {
    return [];
  }

  const text = slugifyText(rawText, toLower).replace(pattern, ' ').trim();

  return text.split(/\s+/g);
}
