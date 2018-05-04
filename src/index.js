const TinyLexer = require ('./tiny-lexer')
  , { tokenize, tokens:T } = require ('./lexer')
  , _parse = require ('./parser').parse

const log = console.log.bind (console)

let _iterator = Symbol !== undefined ? Symbol.iterator : '@@iterator'

function parse (input) {
  let tokens = tokenize (input)
  let traversal = _parse (tokens)
  let self = { next:traversal.next.bind(traversal), state:tokens.state }
  self [_iterator] = function () { return self }
  return self
}

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
