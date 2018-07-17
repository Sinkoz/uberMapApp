# array.partial [![Build Status](https://travis-ci.org/mrchief/array.partial.svg?branch=master)](https://travis-ci.org/mrchief/array.partial)

[![npm](https://img.shields.io/npm/v/array.partial.svg)](https://www.npmjs.com/package/array.partial)
[![npm bundle size (minified + gzip)](https://img.shields.io/bundlephobia/minzip/array.partial.svg)](https://bundlephobia.com/result?p=array.partial)

---

> When you want array.some but not array.every

Useful when you need to determine "partially" selected states - like partially selecting tree nodes when some but not all child nodes are checked.

In fact, the idea originated while building a feature for my own [react-dropdown-tree-select](https://github.com/dowjones/react-dropdown-tree-select) component.

## Why

[array.some](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/some) returns true when _at least one_ element matches. [array.every](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/every) returns true when _all_ elements match. `array.some` will also return true when `array.every` returns true.

`array.partial` is something in between. It returns `true` **only, and only when** _some_ (but not all) elements match. If all elements match, then it'll return `false`.

This can also be achieved with `array.some && !array.every` if you don't mind iterating over the array twice. This module does it with one iteration over the array.

## Install

```
npm install array.partial
```

## Usage

```
const partial = require('array.partial')
partial(array, callback)
```

## API

### partial(array, callback)

Return true if and only if some elements pass the check, otherwise false.

#### array

Type: `Array` - Input array

#### callback

Type: `Function` - Function is a predicate, to test each element of the array. This is called with the following arguments:

`element` - The current element being processed in the array

`index` (Optional) - The index of the current element being processed in the array.

`array` (Optional) - The array filter was called upon.

## Examples

```
const partial = require('array.partial')

const myArr = [{id: 'a1', checked: true}, {id: 'a2', checked: false}]
partial(myArr, x => x.checked)  // -> returns true

// ...

const myArr = [{id: 'a1', checked: true}, {id: 'a2', checked: true}]
partial(myArr, x => x.checked)  // -> returns false

// ...

const myArr = [{id: 'a1', checked: false}, {id: 'a2', checked: false}]
partial(myArr, x => x.checked)  // -> returns false
```

## License

MIT © [Hrusikesh Panda](https://about.me/hkpanda)
