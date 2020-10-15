const TinyLexer = require ('./tiny-lexer')
  , { tokenize } = require ('./lexer')
  , { parse:_parse, tokens } = require ('./parser')
  , { TreeBuilder } = require ('./generic-tree')
  , { tokenInfo, handlers } = require ('./tree-builder')

const log = console.log.bind (console)
const _iterator = Symbol !== undefined ? Symbol.iterator : '@iterator'

function parseTree (str) {
  const builder = new TreeBuilder (tokenInfo, handlers)
  for (let x of parse (str)) builder.write (x)
  return builder.root.content
}

function parse (input, _state) {
  const tokens = tokenize (input)
  const traversal = _parse (tokens, _state)
  const self = { next:traversal.next.bind(traversal), state:tokens.state }
  self [_iterator] = function () { return self }
  return self
}

module.exports = {
  tokenize: tokenize,
  tokenise: tokenize,
  parse: parse,
  parseTree,
  tokens: tokens
}

if (typeof window === 'object')
  window.cssParser = module.exports
