Tiny Css Parser
===============

[![Install size][size-image]][size-url] [![Dependencies][deps-image]][deps-url] [![NPM version][npm-image]][npm-url]

A very small css parser. 

Consists of a lazy tokenizer, a lazy parser and an incremental tree builder.
Both the tokenizer as well as the parser produce a stream of tokens.

The parser inserts properly balanced start and end tokens into the stream,
effectively producing a traversal of the full parse tree. This stream can be fed to the tree builder to incrementally build an object tree from the stream. 

[npm-image]: https://img.shields.io/npm/v/tiny-css-parser.svg
[npm-url]: https://npmjs.org/package/tiny-css-parser
[deps-image]: https://img.shields.io/david/alwinb/tiny-css-parser.svg
[deps-url]: https://david-dm.org/alwinb/tiny-css-parser
[size-url]: https://packagephobia.com/result?p=tiny-css-parser
[size-image]: https://packagephobia.com/badge?p=tiny-css-parser

Example
-------

To parse a stylesheet into an object tree:

```javascript
var css = require ('tiny-css-parser')
var tree = css.parseTree ('#menu { padding:0; margin:0; display:block }')
console.log (tree)
```

To lazily parse and traverse a stylesheet:

```javascript
var stream = css.parse ('#menu { padding:0; margin:0; display:block }')

for (var token of stream)
  console.log (token)
```

It is possible to query the stream for state info and source position,
as follows:

```javascript
var stream = css.parse ('#menu { padding:0; margin:0; display:block }')

for (var token of stream)
  console.log (token, stream.state)
```

API
---

- `tokenize (string)` (generator function)
- `parse (string)` (generator function)
- `parseTree (string)` (function)
- `tokens` (object/ dictionary)
