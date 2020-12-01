# vietnamese-search

Text search for Vietnamese.

- [Install](#install)
- [Usage](#usage)
- [Options](#options)

## Install

```sh
npm install vietnamese-text-search
```

## Usage

### Import

#### Commonjs

```javascript
const TextSearch = require('vietnamese-text-search');
```

#### ES6

```javascript
import TextSearch from 'vietnamese-text-search';
```

### Example

##### Initialize a `TextSearch`'s instance for searching on product's names

```javascript
import ProductObjs from './products.json';
import TextSearch from 'vietnamese-text-search';

(async () => {
  const options = {
    thresholdScore: 0.5,   // Default: 0.5
    limit: 30,             // Default: 30
    sortOrder: -1,         // Default: -1
    textKeyName: 'id',     // Default: 'textId'
    textValueName: 'name'  // Default: 'text'
  };
  // Initialize textSearch instance with `TextObjs` may take some seconds (depends on text object's size).
  const textSearch = await TextSearch.init(ProductObjs, options);
  ...
})
```

##### Add a new `product` to textSearch's dictionary

```javascript
// ...
const product = { id: '123', name: 'mặt nạ siêu thấm hút Aqua' };
// Because we initialized a `TextSearch`'s instance with {..., textKeyName: 'id', textValueName: 'name'}, so any other product which added to the instance's dictionary later should has format { id: ..., name: ... }
const addResult = await textSearch.addNewTextObj(product);
console.log(addResult);

// { nUpserted: 1 }
// ...
```

##### Search for `mặt nạ Aqua`

```javascript
// ...
const searchResult = await textSearch.search('mặt nạ Aqua', { limit: 10, thresholdScore: 1 }); // override default options
console.log(searchResult);

// {
//   data: [
//     // [id, score]
//     [ '123', 4.6 ],
//     ...
//   ],
//   sortOrder: -1,
//   thresholdScore: 1,
//   offset: 0,
//   limit: 10,
//   total: 100,
//   text: 'mặt nạ Aqua'
// }
// ...
```

##### Update product's name of a `product` from textSearch's dictionary

```javascript
// ...
const upProduct = { id: '123', name: 'mặt nạ siêu thấm ngược Aqua' };
const updateResult = await textSearch.updateTextObj(upProduct.id, upProduct);
console.log(updateResult);

// { nUpserted: 1, newKeywords: [ 'ngược' ], removedKeywords: [ 'hút' ] }
// ...
```

##### Remove a `product` from textSearch's dictionary

```javascript
// ...
const removeResult = await textSearch.removeTextObj('123');
console.log(removeResult);

// { nRemoved: 1, removedKeywords: [ 'mặt', 'nạ', 'siêu', 'thấm', 'ngược', 'Aqua' ] }
// ...
```

## APIs

| API                                  | Description                                                                                                            |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| .init(textObjs, options)             | Initilize a `TextSearch`'s instance with array of text objects and [Initilization Options](#initilization-options)     |
| ~~.addNewTextObj(newTextObj)~~       | Add a new `TextObject` to `TextSearch` instance's dictionary _(TextObject's format: { textId: string, text: string })_ |
| ~~.addManyNewTextObjs(newTextObjs)~~ | Add many new `TextObject` to `TextSearch` instance's dictionary                                                        |
| .addTextObj(newTextObj)              | Add a new `TextObject` to `TextSearch` instance's dictionary _(TextObject's format: { textId: string, text: string })_ |
| .addManyTextObjs(newTextObjs)        | Add many new `TextObject` to `TextSearch` instance's dictionary                                                        |
| .updateTextObj(textKey, textObj)     | Update field `text` of a `TextObject` from `TextSearch` instance's dictionary                                          |
| .removeTextObj(textKey)              | Remove a `TextObject` from `TextSearch` instance's dictionary                                                          |
| .removeManyTextObjs(textKeys)        | Remove many `TextObject` from `TextSearch` instance's dictionary _(remove all when textKeys is [])_                    |
| .search(text, options)               | Search for `text` from `TextSearch` instance's dictionary with [Search Options](#search-options)                       |

## Options

### Search options

1. `limit`(number) - Limit number of search results (_default: 30_).
1. `offset`(number) - Used with limit for page pagination (_default: 0_).
1. `sortOrder` (-1: descending | 1: ascending) - The order of _text score_ results (_default: -1_).
1. `thresholdScore`(number) - "Threshold" of score to return results (_default: 0.5_).

### Initilization options

1. `limit`(number) - Default limit number of search results (_default: 30_).
1. `offset`(number) - Default offset (default: 0).
1. `sortOrder` (-1: descending | 1: ascending) - The default order of _text score_ results.
1. `thresholdScore`(number) - "Threshold" of score to return results.
1. { `textKeyName`, `textValueName` } - This option allows you custom default key's name and value's name when initializing a `TextSearch` instance (e.g. _{ **id**: '123', **name**: 'son môi siêu thấm hút' }_ instead of _{ **textId**: '123', **text**: 'son môi siêu thấm hút' }_ as default).

> **_Note:_**
> You can always override initialization options when using the search API.
