const TinyLexer = require ('./tiny-lexer')
  , { tokenize, tokens:T } = require ('./lexer')
  , _parse = require ('./parser').parse

const log = console.log.bind (console)

function parse (input) {
  return _parse (tokenize (input))
}

var sample = '@media blaa; one { foo:blaa; fee:haa } bee baa'
var sample = 'ab\\0c c { foo:bar; baz:paz; Boo;bah }'
var sample = 'prelude { @abc { foo:bar } asd; baz:paz; Boo;bah } }'
var sample = 'pre { @foo { baz { bar:poo } } }'

var test = tokenize (sample)
for (let t of test)
  log (t)

log (test)

	var stream = parse ('#menu { padding:0; margin:; display:block }')

	for (var token of stream)
	  console.log (token)

// var stream = tokenize (sample) .values ()
// while (!stream.done) {
//   let column = stream.state.position - stream.state.lineStart
//   let t = stream.next ()
//   log ({ line:stream.state.line, column:column }, t.value)
// }

// coalescing, may even make it into a simple parser then. 
// <ident><lparen> => <func-start>
// <name:url><lparen> => <url-start>
// <number><ident> => <dimension>
// <number>% => <percentage>
// <string-start><string-data>*<badstring-end> ==> ??

module.exports = {
  tokenize: tokenize,
  tokenise: tokenize,
  parse: parse
}

if (typeof window !== 'undefined')
window.cssParser = module.exports
