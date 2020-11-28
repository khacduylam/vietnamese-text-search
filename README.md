# vietnamese-search

Text search for Vietnamese.

- [Install](#install)
- [Usage](#usage)
- [Search Options](#search-options)

## Install

```sh
npm install vietnamese-text-search
```

## Usage

### Import

#### Commonjs

```javascript
const TextObjs = require('./text.json');
const TextSearch = require('vietnamese-text-search');

(async () => {
  const options = {
    thresholdScore: 0.5,
    limit: 10,
    sortOrder: -1
  };
  // Initialize textSearch instance with `TextObjs` may take some seconds.
  const textSearch = await TextSearch.init(TextObjs, options);
  ...
})
```

#### ES6

```javascript
import TextObjs from './text.json';
import TextSearch from 'vietnamese-text-search';

(async () => {
  const options = {
    thresholdScore: 0.5,
    limit: 10,
    sortOrder: -1
  };
  const textSearch = await TextSearch.init(TextObjs, options);
  ...
})
```

#### Example

##### Add a new `text object` to textSearch's dictionary

```javascript
// ...
const textObj = { textId: '123', text: 'mặt nạ siêu thấm hút Aqua' };
const addResult = await textSearch.addNewTextObj(textObj);
console.log(addResult);

// { nUpserted: 1 }
// ...
```

##### Search for `mặt nạ Aqua`

```javascript
// ...
const searchResult = await textSearch.search('mặt nạ Aqua', { limit: 10, thresholdScore: 0.5 });
console.log(searchResult);

// {
//   data: [
//     // [textId, score]
//     [ '123', 4.6 ],
//     ...
//   ],
//   sortOrder: -1,
//   thresholdScore: 0.5,
//   offset: 0,
//   limit: 10,
//   total: 1046,
//   text: 'mặt nạ Aqua'
// }
// ...
```

##### Update field `text` of a `text object` from textSearch's dictionary

```javascript
// ...
const textObj = { textId: '123', text: 'mặt nạ siêu thấm ngược Aqua' };
const updateResult = await textSearch.updateTextObj(textObj.textId, textObj);
console.log(updateResult);

// { nUpserted: 1, newKeywords: [ 'ngược' ], removedKeywords: [ 'hút' ] }
// ...
```

##### Remove a `text object` from textSearch's dictionary

```javascript
// ...
const textObj = { textId: '123', text: 'mặt nạ siêu thấm ngược Aqua' };
const removeResult = await textSearch.removeTextObj(textObj.textId);
console.log(removeResult);

// { removedKeywords: [ 'mặt', 'nạ', 'siêu', 'thấm', 'ngược', 'Aqua' ] }
// ...
```

## APIs

| API                              | Description                                                                                                            |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| .addNewTextObj(newTextObj)       | Add a new `TextObject` to `TextSearch` instance's dictionary _(TextObject's format: { textId: string, text: string })_ |
| .addManyNewTextObjs(newTextObjs) | Add many new `TextObject` to `TextSearch` instance's dictionary                                                        |
| .updateTextObj(textId, textObj)  | Update field `text` of a `TextObject` from `TextSearch` instance's dictionary                                          |
| .removeTextObj(textId)           | Remove a `TextObject` from `TextSearch` instance's dictionary                                                          |
| .removeManyTextObjs(textIds)     | Remove many `TextObject` from `TextSearch` instance's dictionary _(remove all when textIds is [])_                     |
| .search(text, options)           | Search for `text` from `TextSearch` instance's dictionary                                                              |

## Search Options

1. `limit`(number) - Limit number of search results (_default: 30_).
1. `offset`(number) - Used with limit for page pagination (_default: 0_).
1. `sortOrder` (-1: descending | 1: ascending) - The order of search results (_default: -1_).
1. `thresholdScore`(number) - "Threshold" of score to return results (_default: 0.5_).
