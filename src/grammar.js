"use strict"
const tinylex = require ('./tiny-lexer')

// A tiny-lexer based tokenizer for CSS
// ====================================

// ### Regular expressions
// These are used in the tiny-lexer grammar below.
// Each regular expression corresponds to a transition between states. 

const R_space = '[\t ]+'
const R_newline = '(?:\r?\n|[\r\f])'
const R_lgroup = '[({[]'
const R_rgroup = '[)}\\]]'
const R_op = '[|~^*$]='

// Escapes
const R_hex_esc = '\\\\[0-9A-Fa-f]{1,6}' + R_newline + '?'

// Strings
const R_string = "[^\n\r\f\\\\'\"]+"
const R_nl_esc = '\\\\' + R_newline

// Numbers
const R_fract = '(?:\\.[0-9]+)'
const R_opt_exp = '(?:[eE][+\\-]?[0-9]+)?'
const R_number = '[+-]?(?:' + R_fract + '|[0-9]+' + R_fract + '?)' + R_opt_exp

// Identifiers
// Using a lookahead of max 3 chars
const R_starts_ident = '(?=[-]?(?:[A-Za-z_\\u0080-\\uFFFF]|\\\\[^\n\r\f]))'
const R_hash_lookahead = '(?=(?:[A-Za-z0-9\\-_\\u0080-\\uFFFF]|\\\\[^\n\r\f]))'

const R_at_start = '@' + R_starts_ident
const R_hash_start = '#' + R_hash_lookahead
const R_hashid_start = '#' + R_starts_ident
const R_ident_start = '.{0}' + R_starts_ident
const R_ident = '[A-Za-z0-9\\-_\\u0080-\\uFFFF]+'


// ### Token types

//let t = 0
const tokens =
  { CDC: 'CDC' // ++t
  , CDO: 'CDO' // ++t
  , delim: 'delim' // ++t
  , delim_invalid: 'delim-invalid' // ++t
  , escape_char: 'escape-char' // ++t
  , escape_hex: 'escape-hex' // ++t
  , group_start: 'group-start' // ++t
  , group_end: 'group-end' // ++t
  , group_badend: 'group-badend' // ++t
  , number: 'number' // ++t
  , comma: 'comma' // ++t
  , semicolon: 'semicolon' // ++t
  , colon: 'colon' // ++t
  , column: 'column' // ++t
  , op: 'operator' // ++t
  , space: 'space' // ++t
  , newline: 'newline' // ++t
  , comment_start: 'comment-start' // ++t
  , comment_data: 'comment-data' // ++t
  , comment_end: 'comment-end' // ++t
  , at_start: 'ident-start-at' // ++t
  , hash_start: 'ident-start-hash' // ++t
  , hashid_start: 'ident-start-hashid' // ++t
  , ident_start: 'ident-start' // ++t
  , ident_data: 'ident-data' // ++t
  , ident_end: 'ident-end' // ++t
  , string_start: 'string-start' // ++t
  , string_data: 'string-data' // ++t
  , ignore_newline: 'ignore-newline' // ++t
  , escape_eof: 'escape-eof' // ++t
  , string_end: 'string-end' // ++t
  , string_end_bad: 'string-end-bad' // ++t
  }


// ### The actual grammar

const T = tokens
const grammar = 
{ main: [
  { if: '/[*]',         emit: T.comment_start,  goto: 'comment' },
  { if: '["\']',        emit: T.string_start,   goto:  quote    },
  { if: R_ident_start,  emit: T.ident_start,    goto: 'ident'   },
  { if: R_hashid_start, emit: T.hashid_start,   goto: 'ident'   },
  { if: R_hash_start,   emit: T.hash_start,     goto: 'ident'   },
  { if: R_at_start,     emit: T.at_start,       goto: 'ident'   },
  { if: R_space,        emit: T.space,                          },
  { if: R_newline,      emit: nl (T.newline),                   },
  { if: R_number,       emit: T.number,                         },
  { if: R_lgroup,       emit: group_start,                      },
  { if: R_rgroup,       emit: group_end,                        },
  { if: ',',            emit: T.comma                           },
  { if: ';',            emit: T.semicolon,                      },
  { if: ':',            emit: T.colon,                          },
  { if: R_op,           emit: T.op,                             }, // In the spec these are separate tokens
  { if: '[|][|]',       emit: T.column,                         },
  { if: '<!--',         emit: T.CDO,                            },
  { if: '-->',          emit: T.CDC,                            },
  { if: '\\\\',         emit: T.delim_invalid,                  },
  { if: '.',            emit: T.delim,                          }]

, comment: [
  { if: '[*]/',         emit: T.comment_end,    goto: 'main'    },
  { if: '.[^*]*',       emit: T.comment_data                    }]

, string: [
  { if: '["\']',        emit: quote_emit,       goto: unquote   },
  { if: '$',            emit: T.string_end,     goto: 'main'    },
  { if: R_string,       emit: T.string_data                     },
  { if: R_nl_esc,       emit: nl (T.ignore_newline)             },
  { if: R_hex_esc,      emit: nl (T.escape_hex)                 }, // FIXME newline count
  { if: '\\\\$',        emit: T.escape_eof                      },
  { if: '\\\\.',        emit: T.escape_char                     },
  {                     emit: T.string_end_bad, goto: 'main'    }]

, ident: [
  { if: R_ident,        emit: T.ident_data                      },
  { if: R_hex_esc,      emit: nl (T.escape_hex)                 }, // FIXME newline count
  { if: '\\\\.',        emit: T.escape_char                     },
  {                     emit: T.ident_end,      goto: 'main'    }]
}


// Additional state management, to count newlines
//  and to track quotation style and open groups. 

function nl (type) { return function (chunk) {
  this.lineStart = this.position
  this.line++
  return type
} }



function ident_data (chunk) {
  this.buffer += chunk
}

function ident_escape_char (chunk) {
  this.buffer += '' // TODO
}



function quote (chunk) {
  this.quot = chunk
  return 'string'
}

function quote_emit (chunk) {
  return chunk !== this.quot ? T.string_data : T.string_end
}

function unquote (chunk) {
  if (chunk !== this.quot) return 'string'
  this.quot = null
  return 'main'
}

const mirror = 
  { '(':')', '{':'}', '[':']'
  , ')':'(', ']':'[', '}':'{' }

function group_start (chunk) {
  this.stack.push (chunk)
  return T.group_start
}

function group_end (chunk) {
  const s = this.stack
  if (mirror [chunk] === s [s.length-1]) {
    s.pop ()
    return T.group_end
  }
  return T.group_badend
}


module.exports = { grammar:grammar, tokens:tokens }