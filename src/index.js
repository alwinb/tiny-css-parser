const TinyLexer = require ('./tiny-lexer')
  , { tokenize } = require ('./lexer')
  , { parse:_parse, tokens } = require ('./parser')
  , TreeBuilder = require ('./tree-builder').TreeBuilder

const log = console.log.bind (console)

let _iterator = Symbol !== undefined ? Symbol.iterator : '@iterator'

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
    builder.write (x)
  return builder.tree
}


module.exports = {
  tokenize: tokenize,
  tokenise: tokenize,
  parse: parse,
  parseTree: parseTree,
  tokens: tokens
}

if (typeof window === 'object')
  window.cssParser = module.exports
