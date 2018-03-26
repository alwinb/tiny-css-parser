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
const R_hex_esc = '\\\\[0-9A-Fa-f]{1,6}'+R_newline+'?'

// Strings
const R_string = "[^\n\r\f\\\\'\"]+"
const R_nl_esc = '\\\\'+R_newline

// Numbers
const R_fract = '(?:\\.[0-9]+)'
const R_opt_exp = '(?:[eE][+\\-]?[0-9]+)?'
const R_number = '[+-]?(?:' + R_fract + '|[0-9]+' + R_fract + '?)' + R_opt_exp

// Identifiers
// Using a lookahead of max 3 chars
const R_starts_ident = '(?=[-]?(?:[A-Za-z_\u0080-\uFFFF]|\\\\[^\n\r\f]))'
const R_hash_lookahead = '(?=(?:[A-Za-z0-9\\-_\u0080-\uFFFF]|\\\\[^\n\r\f]))'

const R_at_start = '@'+R_starts_ident
const R_hash_start = '#'+R_hash_lookahead
const R_hashid_start = '#'+R_starts_ident
const R_ident_start = '.{0}'+R_starts_ident
const R_ident = '[A-Za-z0-9\\-_\u0080-\uFFFF]+'


// ### Token types

//let t = 0
const T_CDC = 'CDC' // ++t
  , T_CDO = 'CDO' // ++t
  , T_delim = 'delim' // ++t
  , T_delim_invalid = 'delim-invalid' // ++t
  , T_escape_char = 'escape-char' // ++t
  , T_escape_hex = 'escape-hex' // ++t
  , T_group_start = 'group-start' // ++t
  , T_group_end = 'group-end' // ++t
  , T_group_noend = 'group-noend' // ++t
  , T_number = 'number' // ++t
  , T_sep = 'sep' // ++t
  , T_column = 'column' // ++t
  , T_op = 'operator' // ++t
  , T_space = 'space' // ++t
  , T_newline = 'newline' // ++t
  , T_comment_start = 'comment-start' // ++t
  , T_comment_data = 'comment-data' // ++t
  , T_comment_end = 'comment-end' // ++t
  , T_at_start = 'ident-start-at' // ++t
  , T_hash_start = 'ident-start-hash' // ++t
  , T_hashid_start = 'ident-start-hashid' // ++t
  , T_ident_start = 'ident-start' // ++t
  , T_ident_data = 'ident-data' // ++t
  , T_ident_end = 'ident-end' // ++t
  , T_string_start = 'string-start' // ++t
  , T_string_data = 'string-data' // ++t
  , T_ignore_newline = 'ignore-newline' // ++t
  , T_escape_eof = 'escape-eof' // ++t
  , T_string_end = 'string-end' // ++t
  , T_string_end_bad = 'string-end-bad' // ++t


// ### The actual grammar

const grammar = 
{ main: [
  { if: '/[*]',         emit: T_comment_start,  goto: 'comment' },
  { if: '["\']',        emit: T_string_start,   goto:  quote    },
  { if: R_ident_start,  emit: T_ident_start,    goto: 'ident'   },
  { if: R_hashid_start, emit: T_hashid_start,   goto: 'ident'   },
  { if: R_hash_start,   emit: T_hash_start,     goto: 'ident'   },
  { if: R_at_start,     emit: T_at_start,       goto: 'ident'   },
  { if: R_space,        emit: T_space,                          },
  { if: R_newline,      emit: nl (T_newline),                   },
  { if: R_number,       emit: T_number,                         },
  { if: R_lgroup,       emit: group_start,                      },
  { if: R_rgroup,       emit: group_end,                        },
  { if: '[,:;]',        emit: T_sep,                            }, // In the spec these are separate tokens
  { if: R_op,           emit: T_op,                             }, // likewise
  { if: '[|][|]',       emit: T_column,                         },
  { if: '<!--',         emit: T_CDO,                            },
  { if: '-->',          emit: T_CDC,                            },
  { if: '\\\\',         emit: T_delim_invalid,                  },
  { if: '.',            emit: T_delim,                          }]

, comment: [
  { if: '[*]/',         emit: T_comment_end,    goto: 'main'    },
  { if: '.[^*]*',       emit: T_comment_data                    }]

, string: [
  { if: '["\']',        emit: quote_emit,       goto: unquote   },
  { if: '$',            emit: T_string_end,     goto: 'main'    },
  { if: R_string,       emit: T_string_data                     },
  { if: R_nl_esc,       emit: nl (T_ignore_newline)             },
  { if: R_hex_esc,      emit: nl (T_escape_hex)                 }, // FIXME newline count
  { if: '\\\\$',        emit: T_escape_eof                      },
  { if: '\\\\.',        emit: T_escape_char                     },
  {                     emit: T_string_end_bad, goto: 'main'    }]

, ident: [
  { if: R_ident,        emit: T_ident_data                      },
  { if: R_hex_esc,      emit: nl (T_escape_hex)                 }, // FIXME newline count
  { if: '\\\\.',        emit: T_escape_char                     },
  {                     emit: T_ident_end,      goto: 'main'    }]
}


// Additional state management, to
//  supplement the grammar/ state machine. 

function nl (type) { return function (chunk) {
  this.lineStart = this.position
  this.line++
  return type
} }

function quote (chunk) {
  this.quot = chunk
  return 'string'
}

function quote_emit (chunk) {
  return chunk !== this.quot ? T_string_data : T_string_end
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
  return T_group_start
}

function group_end (chunk) {
  const s = this.stack
  if (mirror [chunk] === s [s.length-1]) {
    s.pop ()
    return T_group_end
  }
  return T_group_noend
}


module.exports = grammar