// The compiler and runtime
// ------------------------

function State (table, name) {
  this.name = name
  this.regex = new RegExp ('(' + table.map (fst) .join (')|(') + ')', 'sgy')
  this.edges = table.map (compileRow (name))
}

function compile (grammar) {
  const compiled = {}
  for (let state_name in grammar)
    compiled [state_name] = new State (grammar [state_name], state_name)
  return compiled
}

function fst (row) {
  return Array.isArray (row) ? row [0] || '.{0}'
    : 'if' in row ? row.if : '.{0}'
}

function compileRow (symbol) {
  return function (row) {
    let r, emit, goto
    if (Array.isArray) [r = '.{0}', emit, goto = symbol] = row
    else ({ if:r = '.{0}', emit, goto = symbol } = row )
    const g = typeof goto === 'function' ? goto : (data) => goto
    const e = typeof emit === 'function' ? wrapEmit (emit) : (data) => [emit, data]
    return { emit:e, goto:g }
  }
}

function wrapEmit (fn) { return function (data) {
  return [fn.call (this, data), data]
}}


// The Lexer runtime
// -----------------

function TinyLexer (grammar, start, CustomState = Object) {
  const states = compile (grammar)

  this.tokenize = function (input, position = 0, symbol = start) {
    const custom = new CustomState (input, position, symbol)
    const stream = tokenize (input, custom, position, symbol)
    stream.state = custom
    return stream
  }

  function *tokenize (input, custom, position, symbol) {
    do if (!(symbol in states))
      throw new Error (`Lexer: no such symbol: ${symbol}.`)

    else {
      const state = states [symbol]
      const regex = state.regex
      const match = (regex.lastIndex = position, regex.exec (input))

      if (!match){
        if (position !== input.length)
          throw new SyntaxError (`Lexer: invalid input at index ${position} in state ${symbol} before ${input.substr (position, 12)}`)
        return
      }

      let i = 1; while (match [i] == null) i++
      const edge = state.edges [i-1]
      const token = edge.emit.call (custom, match[i])
      symbol = edge.goto.call (custom, match[i])
      position = regex.lastIndex
      Object.assign (custom, { symbol, position })
      yield token
    }

    while (position <= input.length)
  }
}

module.exports = TinyLexer