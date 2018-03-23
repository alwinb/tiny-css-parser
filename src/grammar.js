"use strict"
const tinylex = require ('./tiny-lexer')
var log = console.log.bind (console)

// A tiny-lexer based tokenizer for CSS
// ====================================

// TODO list:
// - [x] handle surrogate pairs (not needed)
// - [ ] unicode range tokens
// - [ ] count newlines
// - [x] hashid vs hash?
// - [ ] url parsing (via coalescing, no, more tricky)
// - [ ] coalescing (see below)
// - [x] sqstring (via this.quot)
// - [x] operators, |=, ~= etc
// - [x] added pairing {}, [], () into the lexer

// ### Regular expressions
// These are used in the tiny-lexer grammar below.
// Each regular expression corresponds to a transition between states. 

const R_space = '[\t ]+'
const R_newline = '\r?\n|[\r\f]'
const R_lgroup = '[({[]'
const R_rgroup = '[)}\\]]'
const R_op = '[|~^*$]='

// Escapes
const R_hex_esc = '\\\\[0-9A-Fa-f]{1,6}[ \t\n\r\f]?' // NB newlines

// Strings
const R_string = "[^\n\r\f\\'\"]+"
const R_nl_esc = '\\\\[\n\r\f]' // NB newlines

// Numbers
const R_fract = '(?:\\.[0-9]+)'
const R_opt_exp = '(?:[eE][+\\-]?[0-9]+)?'
const R_number = '[+-]?(?:' + R_fract + '|[0-9]+' + R_fract + '?)' + R_opt_exp

// Names
// For identifier-like tokens, I am doing a lookahead (max 3 chars)
const R_starts_ident = '(?=[-]?(?:[A-Za-z_\u0080-\uFFFF]|\\\\[^\n\r\f]))'
const R_hash_lookahead = '(?=(?:[A-Za-z0-9\\-_\u0080-\uFFFF]|\\\\[^\n\r\f]))'

const R_hash_start = '#'+R_hash_lookahead
const R_hashid_start = '#'+R_starts_ident
const R_ident_start = '.{0}'+R_starts_ident
const R_at_start = '@'+R_starts_ident
const R_ident = '[A-Za-z0-9\\-_\u0080-\uFFFF]+'


// ### Token types

let t = 0
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
  , T_string_end_bad = 'string-end-badstring' // ++t


// ### The actual grammar

const grammar = 
{ main: [
  { if: '/[*]',         emit: T_comment_start,  goto: 'comment'   },
  { if: '["\']',        emit: start_string,     goto: 'string'    },
  { if: R_ident_start,  emit: T_ident_start,    goto: 'ident'     },
  { if: R_hashid_start, emit: T_hashid_start,   goto: 'ident'     },
  { if: R_hash_start,   emit: T_hash_start,     goto: 'ident'     },
  { if: R_at_start,     emit: T_at_start,       goto: 'ident'     },
  { if: R_space,        emit: T_space,                            },
  { if: R_newline,      emit: T_newline,                          },  // NB newlines
  { if: R_number,       emit: T_number,                           },
  { if: R_lgroup,       emit: group_start,                        },
  { if: R_rgroup,       emit: group_end,                          },
  { if: '[,:;]',        emit: T_sep,                              }, // In the spec these are separate tokens
  { if: R_op,           emit: T_op,                               }, // likewise
  { if: '[|][|]',       emit: T_column,                           },
  { if: '<!--',         emit: T_CDO,                              },
  { if: '-->',          emit: T_CDC,                              },
  { if: '\\\\',         emit: T_delim_invalid,                    },
  { if: '.',            emit: T_delim,                            },
  ]

, comment: [
  { if: '[*]/',         emit: T_comment_end,    goto: 'main'      },
  { if: '[*][^/][^*]*', emit: T_comment_data                      },
  { if: '[^*]+',        emit: T_comment_data,                     },
  ]

, string: [
  { if: R_newline,      emit: T_string_end_bad, goto: 'main'      }, // NB newlines
  { if: '["\']',        emit: quote_emit,       goto: unquote     },
  { if: R_string,       emit: T_string_data                       },
  { if: R_nl_esc,       emit: T_ignore_newline                    },
  { if: '\\\\$',        emit: T_escape_eof                        },
  { if: R_hex_esc,      emit: T_escape_hex                        },
  { if: '\\\\.',        emit: T_escape_char                       },
  ]

, ident: [
  { if: R_ident,        emit: T_ident_data                        },
  { if: R_hex_esc,      emit: T_escape_hex                        },
  { if: '\\\\.',        emit: T_escape_char                       }, // FIXME what about backslash-newline?
  {                     emit: T_ident_end,      goto: 'main'      },                           
  ]
}

// Additional state management, to
//  supplement the grammar/ state machine. 

function start_string (chunk) {
  this.quot = chunk
  return [T_string_start, chunk]
}

function quote_emit (chunk) {
  return [chunk === this.quot ? T_string_end : T_string_data, chunk]
}

function unquote (chunk) {
  return chunk === this.quot ? 'main' : 'string'
}

const mirror = 
  { '(':')', '{':'}', '[':']'
  , ')':'(', ']':'[', '}':'{' }

function group_start (chunk) {
  this.stack.push (chunk)
  return [T_group_start, chunk]
}

function group_end (chunk) {
  const s = this.stack
  if (s[s.length-1] === mirror [chunk]) {
    s.pop ()
    return [T_group_end, chunk]
  }
  else {
   return [T_group_noend, chunk]
  }
}


//
// Test

var sample = require ('fs') .readFileSync ( __dirname+'/../test/style6.dpl')

var sample = ' @charset utf8; @me {} #12038, #-ai #uu tes[ bad} pairing) ting "a string with \' a bad end " uaa'
const chunks = new tinylex (grammar, 'main', { stack:[] }, sample)

for (var i of chunks)
  log (i)


// coalescing, may even make it into a simple parser then. 
// <number><ident> => <dimension>
// <number>% => <percentage>
// #<name> => <hash>
// <ident><lparen> => <func-start>
// <name:url><lparen> => <url-start>
// <name-start><name-data><name-end> ==> <name>?
// <string-start><string-data>*<badstring-end> ==> ??

function* coalesced (tokens) {
  let spare
  for (let token of tokens) 
    null // TODO
}


module.exports = grammar