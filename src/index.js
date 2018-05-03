const TinyLexer = require ('./tiny-lexer')
  , { grammar, tokens:T } = require ('./grammar')
  , parse = require ('./parser')

const log = console.log.bind (console)

function CustomState () {
  this.lineStart = 0
  this.line = 0
  this.quot
}

const cssParser = new TinyLexer (grammar, 'main', CustomState)

function parseCss (input) {
  return cssParser.tokenize (input)
}

var sample = '@media blaa; one { foo:blaa; fee:haa } bee baa'
var sample = 'ab\\0c c { foo:bar; baz:paz; Boo;bah }'
var sample = 'prelude { @abc { foo:bar } asd; baz:paz; Boo;bah } }'
var sample = 'pre { @foo { baz { bar:poo } } }'

var test = parse ( parseCss (sample))

for (let t of test)
  log (t)

// coalescing, may even make it into a simple parser then. 
// <ident><lparen> => <func-start>
// <name:url><lparen> => <url-start>
// <number><ident> => <dimension>
// <number>% => <percentage>
// <string-start><string-data>*<badstring-end> ==> ??

module.exports = cssParser
if (typeof window !== 'undefined')
window.cssParser = module.exports

