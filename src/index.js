const TinyLexer = require ('./tiny-lexer')
  , grammar = require ('./grammar')

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
  

// coalescing, may even make it into a simple parser then. 
// <ident><lparen> => <func-start>
// <name:url><lparen> => <url-start>
// <number><ident> => <dimension>
// <number>% => <percentage>
// <string-start><string-data>*<badstring-end> ==> ??

function* coalesced (tokens) {
  let spare
  for (let token of tokens) {
    if token [0] === 'ident-start'
  }
}

module.exports = cssParser
if (typeof window !== 'undefined')
window.cssParser = module.exports
  