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
    useAddedScore: false   // Default: false
    autoGenBucket: true    // Default: true
  };
  // Initialize textSearch instance with `ProductObjs` and `options`
  const textSearch = await TextSearch.init(ProductObjs, options);
  ...
})
```

##### Add a new `product` to bucket `products`

```javascript
// ...
const product = { id: '123', name: 'mặt nạ siêu thấm hút Aqua', addedScore: 0.1 };
// Because we initialized a `TextSearch`'s instance with {..., textKeyName: 'id', textValueName: 'name'}, so any other product which added to the bucket later should has format { id: ..., name: ... }
const addResult = await textSearch.addNewTextObj(product, { bucket: 'products' });
console.log(addResult);

// { nAdded: 1, bucket: 'products' }
// ...
```

##### Search for `mặt nạ Aqua` 

```javascript
// ...
// Search with options
const searchOptions = {
  limit: 10,
  thresholdScore: 1,
  useAddedScore: true, // this options will affected to the rank of the final results
  buckets: ['products'] // only search on bucket `products`
};
const searchResult = await textSearch.search('mặt nạ Aqua', searchOptions);
console.log(searchResult);

// {
//   data: [
//     // [id, score]
//     [ '123', 4.69999999999... ],
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

##### Update the name and addedScore field of a product

```javascript
// ...
const upProduct = { id: '123', name: 'mặt nạ siêu thấm ngược Aqua', addedScore: 0.2 };
const updateResult = await textSearch.updateTextObj(upProduct.id, upProduct, {
  bucket: 'products'
});
console.log(updateResult);

// { nUpserted: 1, bucket: 'products' }
// ...
```

##### Remove a product

```javascript
// ...
const removeResult = await textSearch.removeTextObj('123', { bucket: 'products' });
console.log(removeResult);

// { nRemoved: 1, bucket: 'products' }
// ...
```

## APIs

| API                                               | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **.init(textObjs, options, cb)**                  | Initialize a `TextSearch`'s instance with options.<br><br>**Params**:<br>&emsp; **`textObjs`**: Array of text objects (e.g. [{ id: '123, name: 'Son môi siêu thấm hút', addedScore: 0.1 }, ...]).<br><br>&emsp; **`options`**: {<br>&emsp;&emsp; **limit** _(number, default: 30)_: Limit number of search results.<br>&emsp;&emsp; **sortOrder** _(-1:Descending, 1: Ascending, default: -1)_: Order of results by score.<br>&emsp;&emsp; **thresholdScore** _(number, default: 0.5)_: Only results which have the text score >= this threshold should be returned.<br>&emsp;&emsp; **textKeyName** _(string, default: 'textId')_: Field used as `key` of a text object.<br>&emsp;&emsp; **textValueName** _(string, default: 'text')_: Field used as `value` of a text object.<br>&emsp;&emsp; **autoGenBucket** _(boolean, default: true)_: When Adding new text objects, Generate new bucket if not exist.<br>&emsp;&emsp; **bucket** _(string, default: 'default')_: Bucket which text objects will be added into when initializing a `TextSearch`'s instance with `textObjs`<br>&emsp;&emsp; **useAddedScore** _(boolean, default: false)_: `addedScore` from each text object will be added to its score when ranking results by the score.<br>&emsp; }<br><br>**Return**: _{Promise\<TextSearch\>}_ |
| **.search(text, options, cb)**                    | Search for `text`.<br><br>**Params**:<br>&emsp; **`text`**: Text to search (e.g. _son môi aqua_).<br><br>&emsp; **`options`**: {<br>&emsp;&emsp; **limit** _(number, default: 30)_: Limit number of search results.<br>&emsp;&emsp; **sortOrder** _(-1:Descending, 1: Ascending, default: -1)_: Order of results by score.<br>&emsp;&emsp; **thresholdScore** _(number, default: 0.5)_: Only results which have the text score >= this threshold should be returned.<br>&emsp;&emsp; **buckets** _(string, default: [all buckets])_: Only search in this `buckets`.<br>&emsp;&emsp; **useAddedScore** _(boolean, default: false)_: `addedScore` from each text object will be added to its score when ranking results by the score.<br>&emsp; }<br><br>**Return**: _{Promise\<{ data: \[\[\<textKey\>, \<score\>\], ...\], total: number, text: string, ...[options] }\>}_                                                                                                                                                                                                                                                                                                                                                                                              |
| **.addTextObj(textObj, options, cb)**             | Add a new text object.<br><br>**Params**:<br>&emsp; **`textObj`**: Text object to add (e.g. _{ id: '123', name: 'Son môi siêu thấm hút' }_).<br><br>&emsp; **`options`**: {<br>&emsp;&emsp; **bucket** _(string, default: 'default')_: Add new text object to this bucket.<br>&emsp; }<br><br>**Return**: _{Promise\<{ nAdded: number, bucket: string }\>}_                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **.addManyTextObjs(textObjs, options, cb)**       | Add many text objects.<br><br>**Params**:<br>&emsp; **`textObjs`**: Array of text objects to add.<br><br>&emsp; **`options`**: {<br>&emsp;&emsp; **bucket** _(string, default: 'default')_: Add new text objects to this bucket.<br>&emsp; }<br><br>**Return**: _{Promise\<{ nAdded: number, details: {\*} }\>}_                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| **.updateTextObj(textKey, textObj, options, cb)** | Update a text object.<br><br>**Params**:<br>&emsp; **`textKey`**: Text key of object to update.<br>&emsp; **`textObj`**: This text object will be merged with the old or added to a bucket if option `upsert` is **true**.<br><br>&emsp; **`options`**: {<br>&emsp;&emsp; **upsert** _(boolean, default: false)_: Add the text object if not exist.<br>&emsp;&emsp; **bucket** _(string, default: 'default')_: Update text object in this bucket.<br>&emsp; }<br><br>**Return**: _{Promise\<{ nUpserted: number, bucket: string }\>}_                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **.updateManyTextObjs(textObjs, options, cb)**    | Update many text objects.<br><br>**Params**:<br>&emsp; **`textObjs`**: This text objects will be merged with the old or added to a bucket if option `upsert` is **true**.<br>&emsp; _(Note: Text objects must contain text key, the text key will be used to find the object need to update (e.g. _\[{id: '123', name: 'Son môi siêu thấm ngược Alan', addedScore: 0.2}, ...\]_)_<br><br>&emsp; **`options`**: {<br>&emsp;&emsp; **upsert** _(boolean, default: false): Add the text object if not exist._<br>&emsp;&emsp; **bucket** _(string, default: 'default')_: Update text objects in this bucket.<br>&emsp; }<br><br>**Return**: _{Promise\<{ nUpserted: number, details: {\*} }\>}_                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **.removeTextObj(textKey, options, cb)**          | Remove a text object.<br><br>**Params**:<br>&emsp; **`textKey`**: Text key of object to remove.<br><br>&emsp; **`options`**: {<br>&emsp;&emsp; **forceRemove** _(boolean, default: false)_: Do not throw an error if `textKey` not found. <br>&emsp;&emsp; **bucket** _(string, default: 'default')_: Remove text object from this bucket.<br>&emsp; }<br><br>**Return**: _{Promise\<{ nUpserted: number, bucket: string }\>}_                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **.removeTextObjs(textKeys, options, cb)**        | Remove many text objects.<br><br>**Params**:<br>&emsp; **`textKeys`**: Remove text objects with these text keys.<br><br>&emsp; **`options`**: {<br>&emsp;&emsp; **forceRemove** _(boolean, default: false)_: Do not throw an error if `textKey` not found. <br>&emsp;&emsp; **bucket** _(string, default: 'default')_: Remove text object from this bucket.<br>&emsp; }<br><br>**Return**: _{Promise\<{ nRemoved: number, details: {\*} }\>}_                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| **.removeBuckets(buckets)**                       | Remove text bucket(s).<br><br>**Params**:<br>&emsp; **`buckets`**: Remove a bucket (e.g. 'products') or remove many buckets (e.g. \['products', 'stores', 'companies'\]).<br><br>**Return**: _{{ nRemoved: number, nRemains: number }}_                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **.getStats()**                                   | Get stats of the instance.<br><br>**Return**: _{{ nObjects: number, nIndices: number }}_                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |

## Notes

1. **TextObject** should has format like _{ **textId**: '123', **text**: 'Son môi siêu thấm hút', addedScore: 0.1 }_ if options `textKeyName` and `textValueName` are not be set when initializing the instance. Otherwise, the object should has format _{ **[textKeyName]**: textKey, **[textValueName]**: textValue, addedScore: 0.1 }_.

1. **addedScore** of a text object is 0.0 if a text object not include it.
