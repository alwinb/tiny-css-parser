Tiny Css Parser
===============

A very small css parser. 

Usage:

	var css = require ('tiny-css-parser')
	var stream = css.tokenize ('#menu { padding:0; margin:; display:block }')
	
	for (var token of stream)
	  console.log (token)


tokenize returns an iterator/ a lazy token stream.
It is possible to query the stream for state info, including source positions, as follows:


	var css = require ('tiny-css-parser')
	var stream = css.tokenize ('#menu { padding:0; margin:; display:block }')
	
	for (var token of stream)
	  console.log (token, stream.state)

