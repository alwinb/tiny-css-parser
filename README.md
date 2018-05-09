Tiny Css Parser
===============

A very small css parser. 
Work in progress. 

Consists of a lazy tokenizer and a lazy parser. 
Both the tokenizer as well as the parser produce a stream of tokens.

The parser inserts properly balanced start and end tokens into the stream,
effectively producing a traversal of the full parse tree. 

Example
-------

	var css = require ('tiny-css-parser')
	var stream = css.parse ('#menu { padding:0; margin:0; display:block }')

	for (var token of stream)
	  console.log (token)


It is possible to query the stream for state info and source position,
as follows:

	var css = require ('tiny-css-parser')
	var stream = css.parse ('#menu { padding:0; margin:0; display:block }')
	
	for (var token of stream)
	  console.log (token, stream.state)


API
---

- `tokenize`
- `parse`
- `tokens`

