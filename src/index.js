const TinyLexer = require ('./tiny-lexer')
  , { tokenize } = require ('./lexer')
  , { parse:_parse, tokens } = require ('./parser')
  , TreeBuilder = require ('./tree-builder').TreeBuilder

const log = console.log.bind (console)

let _iterator = Symbol !== undefined ? Symbol.iterator : '@@iterator'

function parse (input) {
  const tokens = tokenize (input)
  const traversal = _parse (tokens)
  const self = { next:traversal.next.bind(traversal), state:tokens.state }
  self [_iterator] = function () { return self }
  return self
}

function parseTree (input) {
  const traversal = parse (input)
  const builder = new TreeBuilder ()
  for (let x of traversal)
    builder.step (x)
  return builder.tree
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
  parse: parse,
  tokens: tokens
}

if (typeof window === 'object')
  window.cssParser = module.exports


// Quick test
/*

try {

var sample = 'bla { key1: two; key2: x } .boo { boo: bla }'
var sample = '@media print { foo {} }'

let t = parseTree (sample)
log (JSON.stringify (t, null, 2))

}
catch (e) { log (e) }

//*/