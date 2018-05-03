"use strict"
module.exports = Lexer

// Tiny lexer runtime
// ==================

// The idea is that lexical grammars can be very compactly expressed by a 
// state machine that has transitions that are labeled with regular expressions
// rather than individual characters. 

// Since the javascript RegExp object allows reading and writing the position
// of reference in the input string, it is possible to represent each state by
// a single RegExp object with capture groups; each capture groups then 
// identifies a transition. 

// The Lexer runtime
// -----------------

let _iterator = Symbol !== undefined ? Symbol.iterator : '@@iterator'

function Lexer (grammar, start, CustomState) {
  const states = compile (grammar)
  this.tokenize = tokenize
  this.tokenise = tokenize

  function LazyTokenStream (input) {
    this [_iterator] = function () { return iterator (input) }
  }

  function tokenize (input) {
    return new LazyTokenStream (input)
  }

  function iterator (input) {
    const custom = new CustomState ()
    let symbol = start
      , state = states [symbol]
      , position = 0

    const self = { value: null, done: false, next: next, state: custom }
    return self

    function next () {
      const regex = state.regex
      regex.lastIndex = position
      const match = regex.exec (input)

      if (position === input.length && regex.lastIndex === 0) {
        self.value = null
        self.done = true
        return self
      }

      if (match == null)
        throw new SyntaxError ('Lexer: invalid input before: ' + input.substr (position, 12))

      position = custom.position = regex.lastIndex

      let i = 1; while (match [i] == null) i++
      const edge = state.edges [i-1]

      self.value = typeof edge.emit === 'function'
        ? [edge.emit.call (custom, match [i]), match [i]]
        : [edge.emit, match [i]]

      symbol = custom.symbol = typeof edge.goto === 'function'
        ? edge.goto.call (custom, match [i])
        : edge.goto

      state = states [symbol]
      if (state == null) 
        throw new Error ('Lexer: no such symbol: '+symbol)
  
      return self
    }
  }
}


// The compiler
// ------------

function compile (grammar) {
  const compiled = {}
  for (let state_name in grammar)
    compiled [state_name] = new State (grammar [state_name], state_name)
  return compiled
}

function State (table, name) {
  this.name = name
  this.regex = new RegExp ('(' + table.map (fst) .join (')|(') + ')', 'gy')
  this.edges = table.map (fn)

  function fn (row) {
    return {
      goto: 'goto' in row ? row.goto : name, 
      emit: 'emit' in row ? row.emit : null
    }
  }
}

function fst (row) {
  return ('if' in row) ? row ['if'] : '.{0}'
}


