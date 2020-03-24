const TinyLexer = require ('./tiny-lexer')
  , { tokenize } = require ('./lexer')
  , { parse:_parse, tokens } = require ('./parser')
  , { TreeBuilder } = require ('./tree-builder')

const log = console.log.bind (console)
const _iterator = Symbol !== undefined ? Symbol.iterator : '@iterator'

function parse (input, _state) {
  const tokens = tokenize (input)
  const traversal = _parse (tokens, _state)
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

module.exports = { tokenize, tokenise: tokenize, parse, parseTree, tokens }