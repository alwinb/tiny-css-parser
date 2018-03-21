"use strict"
const tinylex = require ('./tiny-lexer')
var log = console.log.bind (console)

// A tiny-lexer based tokenizer for CSS
// ====================================

// TODO list:
// - [x] handle surrogate pairs (not needed)
// - [ ] unicode range tokens
// - [ ] count newlines
// - [ ] hashid vs hash?
// - [ ] url parsing (via coalescing)
// - [ ] coalescing (see below)
// - [x] sqstring (via this.quot)
// - [x] operators, |=, ~= etc

// ### Regular expressions
// These are used in the tiny-lexer grammar below.
// Each regular expression corresponds to a transition between states. 

const R_space = '[\t ]+'
const R_newline = '\r?\n|[\r\f]'
const R_lgroup = '[({[]'
const R_rgroup = '[)}\\]]'
const R_op = '[|~^*$]='


// Strings
const R_dqstring = '[^\n\r\f\\"]+'
const R_sqstring = "[^\n\r\f\\']+"
const R_string = "[^\n\r\f\\'\"]+"
const R_hex_esc = '\\\\[0-9A-Fa-f]{1,6}[ \t\n\r\f]?' // NB newlines
const R_nl_esc = '\\\\[\n\r\f]' // NB newlines

// Numbers
const R_fract = '(?:\\.[0-9]+)'
const R_opt_exp = '(?:[eE][+\\-]?[0-9]+)?'
const R_number = '[+-]?(?:' + R_fract + '|[0-9]+' + R_fract + '?)' + R_opt_exp

// Names
// I am doing a lookahead, emit an empty T_name_start token and switch to name. 
const R_name_start = '.{0}(?=\\-?(?:[A-Za-z_\u0080-\uFFFF]|\\\\[^\n\r\f]))'
const R_name = '[A-Za-z0-9\\-_\u0080-\uFFFF]+'


// ### Token types

let t = 0
const T_CDC = 'CDC' // ++t
  , T_CDO = 'CDO' // ++t
  , T_at = 'at' // ++t
  , T_badstring_end = 'badstring-end' // ++t
  , T_comment_data = 'comment-data' // ++t
  , T_comment_end = 'comment-end' // ++t
  , T_comment_start = 'comment-start' // ++t
  , T_delim = 'delim' // ++t
  , T_delim_invalid = 'delim-invalid' // ++t
  , T_escape_char = 'escape-char' // ++t
  , T_escape_eof = 'escape-eof' // ++t
  , T_escape_hex = 'escape-hex' // ++t
  , T_group_end = 'group-end' // ++t
  , T_group_start = 'group-start' // ++t
  , T_hash = 'hash' // ++t
  , T_ignore_newline = 'ignore-newline' // ++t
  , T_name_data = 'name-data' // ++t
  , T_name_end = 'name-end' // ++t
  , T_name_start = 'name-start' // ++t
  , T_newline = 'newline' // ++t
  , T_number = 'number' // ++t
  , T_op = 'operator' // ++t
  , T_column = 'column' // ++t
  , T_sep = 'sep' // ++t
  , T_space = 'space' // ++t
  , T_string_data = 'string-data' // ++t
  , T_string_end = 'string-end' // ++t
  , T_string_start = 'string-start' // ++t


// ### The actual grammar

const grammar = 
{ main: [
  { if: '/\\*',       emit: T_comment_start,  goto: 'comment'   },
  { if: '"|\'',       emit: start_string,     goto: 'string'    },
  { if: R_name_start, emit: T_name_start,     goto: 'name'      },
  { if: R_space,      emit: T_space,                            },
  { if: R_newline,    emit: T_newline,                          },  // NB newlines
  { if: R_number,     emit: T_number,                           },
  { if: R_lgroup,     emit: T_group_start,                      },
  { if: R_rgroup,     emit: T_group_end,                        },
  { if: '#',          emit: T_hash,                             },
  { if: '@',          emit: T_at,                               },
  { if: '[,:;]',      emit: T_sep,                              }, // In the spec these are separate tokens
  { if: R_op,         emit: T_op,                               }, // likewise
  { if: '[|][|]',     emit: T_column,                           },
  { if: '<!--',       emit: T_CDO,                              },
  { if: '-->',        emit: T_CDC,                              },
  { if: '\\\\',       emit: T_delim_invalid,                    },
  { if: '.',          emit: T_delim,                            },
  ]

, comment: [
  { if: '[*]/',       emit: T_comment_end,    goto: 'main'      },
  { if: '[*][^/][^*]*',emit: T_comment_data                     },
  { if: '[^*]+',      emit: T_comment_data,                     },
  ]

, string: [
  { if: '[\n\r\f]',   emit: T_badstring_end,  goto: 'main'      }, // NB newlines
  { if: '"|\'',       emit: quote_emit,       goto: quote_state },
  { if: R_string,     emit: T_string_data                       },
  { if: R_nl_esc,     emit: T_ignore_newline                    },
  { if: '\\\\$',      emit: T_escape_eof                        },
  { if: R_hex_esc,    emit: T_escape_hex                        },
  { if: '\\\\.',      emit: T_escape_char                       },
  ]

, name: [
  { if: R_name,       emit: T_name_data                         },
  { if: R_hex_esc,    emit: T_escape_hex                        },
  { if: '\\\\.',      emit: T_escape_char                       }, // FIXME what about backslash-newline?
  {                   emit: T_name_end,       goto: 'main'      },                           
  ]
}

// Additional state management, to
//  supplement the grammar/ state machine

function start_string (chunk) {
  this.quot = chunk
  return [T_string_start, chunk]
}

function quote_emit (chunk) {
  return [chunk === this.quot ? T_string_end : T_string_data, chunk]
}

function quote_state (chunk) {
  return chunk === this.quot ? 'main' : 'string'
}


//
// Test

var sample = require ('fs') .readFileSync ( __dirname+'/../test/style6.dpl')
var sample = ' testtin "a string with \' a bad end " uaa'
const chunks = new tinylex (grammar, 'main', {}, sample)

for (var i of chunks)
  log (i)


// coalescing, may even make it into a simple parser then. 
// <number><ident> => <dimension>
// <number>% => <percentage>
// #<name> => <hash>
// @<name> => <at-keyword>
// <ident><lparen> => <func-start>
// <name:url><lparen> => <url-start>
// <name-start><name-data><name-end> ==> <name>
// <string-start><string-data>*<badstring-end> ==> ??

function* coalesced (tokens) {
  let spare
  for (let token of tokens) 
    null // TODO
}


module.exports = grammar