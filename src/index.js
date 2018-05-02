const TinyLexer = require ('./tiny-lexer')
  , { grammar, tokens:T } = require ('./grammar')
  , parse = require ('./parser')


const log = console.log.bind (console)

// TODO list:
// - [x] handle surrogate pairs (not needed)
// - [ ] unicode range tokens
// - [x] count newlines
// - [x] hashid vs hash?
// - [ ] url parsing (via coalescing, no, is more tricky)
// - [ ] coalescing (see below)
// - [x] sqstring (via this.quot)
// - [x] operators, |=, ~= etc
// - [x] added pairing {}, [], () into the lexer
// - [x] wrap up/ api
// - [ ] parser/ declarations e.a. 
// - [x] Compat/ Symbol

// OK. Parsing. I wish to parameterise how atrules contents are parsed. 
// At the moment.. qrule contents is always parsed as a list of decls and atrules. 
// As for atrules, hmm may do the same. 

function CustomState () {
  this.lineStart = 0
  this.line = 0
  this.stack = []
  this.quot
}

const cssParser = new TinyLexer (grammar, 'main', CustomState)

function parseCss (input) {
  return cssParser.tokenize (input)
}

var sample = '@media blaa; one { foo:blaa; fee:haa } bee baa'
var sample = 'abc { foo:bar; baz:paz; Boo;bah }'
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

