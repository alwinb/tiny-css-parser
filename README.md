Tiny Css Parser
===============

A very small css parser. 

Consists of a lazy tokenizer and a lazy parser. 
Both the tokenizer as well as the parser produce a stream of tokens.

The parser inserts properly balanced start and end tokens into the stream,
effectively producing a traversal of the full parse tree. 

Example
-------

To parse a stylesheet into a syntax tree:

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
