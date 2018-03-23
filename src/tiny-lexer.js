"use strict"
module.exports = Lexer
var log = console.log.bind (console)

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

function Lexer (grammar, start, customState, input) {
  const states = compile (grammar)
	const self = this

	let symbol = start
    , position = 0

  this.goto = function name (s) { symbol = s }

  this.value
  this.done = false
  this.next = next
  this[Symbol.iterator] = _ => this // That should create a copy instead, or be up one level

	function next () {
    if (states [symbol] == null) 
      throw new Error ('Lexer: no such symbol: '+symbol)

    let state = states [symbol]
      , regex = state.regex

    regex.lastIndex = position
		let r = regex.exec (input)
    // log (position, r)

    if (position === input.length && regex.lastIndex === 0) {
      self.value = null
      self.done = true
			return self
    }

		if (r == null) { // FIXME end at EOF only, else emit error? or throw it?
      log ('invalid')
      self.value = '' // Or even specify that explicitly in the grammar?
      self.done = true
			return self
    }

    // TODO take care not to skip chars! (e.g. simulate the y flag)..
    // log (position, regex.lastIndex)
		position = regex.lastIndex
    let i = 1; while (r[i] == null) i++
    let edge = state.edges [i-1]
      , chunk = r[i]


    self.value = (typeof edge.emit === 'function')
      ? [edge.emit.call (customState, chunk), chunk]
      : [edge.emit, chunk]

    symbol = (typeof edge.goto === 'function')
      ? edge.goto.call (customState, chunk)
      : edge.goto

    return self
	}
}


// The compiler
// ------------

function State (table, name) {
	this.regex = new RegExp ('(' + table.map (fst) .join (')|(') + ')', 'gy')
	this.edges = table.map ( fn )

  function fn (row) {
    return { goto:'goto' in row ? row.goto : name, emit: 'emit' in row ? row.emit : null }
  }
}

function fst (row) {
  return ('if' in row) ? row ['if'] : '.{0}'
}

function compile (grammar) {
	const compiled = {}
	for (let state_name in grammar)
		compiled [state_name] = new State (grammar [state_name], state_name)
	return compiled
}




