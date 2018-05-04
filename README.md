Tiny Css Parser
===============

A very small css parser. 
Work in progress. 

Consists of a lazy tokenizer and a lazy parser. 
Both the tokenizer as well as the parser produce a stream of tokens.

The parser inserts properly balanced start and end tokens into the stream,
effectively producing a traversal of the full parse tree. 

Usage:

	var css = require ('tiny-css-parser')
	var stream = css.parse ('#menu { padding:0; margin:0; display:block }')

	for (var token of stream)
	  console.log (token)


It is possible to query the iterator for state info and source position,
as follows (only the tokenizer at the moment, WIP):

	var css = require ('tiny-css-parser')
	var it = css.tokenize ('#menu { padding:0; margin:0; display:block }')
	
	for (var token of it)
	  console.log (token, it.state)

