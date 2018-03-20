"use strict"

//
//  A tiny-lexer based tokenizer for CSS

const R_space = '[\t ]+'
const R_newline = '[\n\r\f]'
const R_url = '[Uu][Rr][Ll]\\(' // May do that on 
const R_lgroup = '\\(\\[\\{'
const R_rgroup = '\\)\\]\\}'
//const R_op = /// TODO

// Strings
const R_dqstring = '[^\n\r\f\\"]+'
const R_sqstring = "[^\n\r\f\\']+"
const R_hex_esc = '\\\\[0-9A-Fa-f]{1,6}[ \t\n\r\f]?' // NB newlines
const R_nl_esc = '\\\\[\n\r\f]'

// Numbers
const R_fract = '(?:\\.[0-9]+)'
const R_opt_exp = '(?:[eE][+-]?[0-9]+)?'
const R_number = '[+-]?(?:' + R_fract + '|[0-9]+' + R_fract + '?)' + R_opt_exp

// Names
// I am doing a lookahead and emit an empty T_name_start token, switch to name. 
const R_name_start = '.{0}(?=\\-?(:?[A-Za-z_\u0080-\uFFFF]|\\\\[^\n\r\f]))'
const R_name = '\\[A-Za-z_\u0080-\uFFFF0-9\\-]+'

// TODO list:
// [ ] handle surrogate pairs
// [ ] unicode range tokens
// [ ] count newlines
// [ ] hashid vs hash?
// [ ] url parsing
// [ ] coalescing
// [ ] sqstring

// Coalescing
// <number><ident> => <dimension>
// <number>% => <percentage>
// #<name> => <hash>
// @<name> => <at-keyword>

// Parsing
// <ident><lparen> => <func-start>
// ...


const grammar = 
{ main: [
  { if: '/\\*',       emit: T_comment_start,  goto: 'comment'   },
  { if: '"',          emit: T_string_start,   goto: 'dqstring'  },
  { if: "'",          emit: T_string_start,   goto: 'sqstring'  },
  { if: R_url,        emit: T_url_start,      goto: 'url'       },
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
  { if: '<!--',       emit: T_CDO,                              },
  { if: '-->',        emit: T_CDC,                              },
  { if: '\\\\',       emit: T_delim_invalid,                    },
  { if: '.',          emit: T_delim,                            },
  ]

, comment: [
  { if: '\\*/',       emit: T_comment_end,    goto: 'main'      },
  { if: '[^*]+',      emit: T_comment_data,                     },
  { if: '*[^/][^*]*', emit: T_comment_data                      },
  ]

, dqstring: [ // TODO add sqstring
  { if: '[\n\r\f]',   emit: T_badstring_end,  goto: 'main'      }, // NB newlines
  { if: '"',          emit: T_string_end,     goto: 'main'      },
  { if: R_dqstring,   emit: T_string_data                       },
  { if: R_nl_esc,     emit: T_ignore_newline                    },
  { if: '\\\\$',      emit: T_escape_eof                        },
  { if: R_hex_esc,    emit: T_escape_hex                        },
  { if: '\\\\.',      emit: T_escape_char                       },
  ]

, name: [
  { if: R_name,       emit: T_name_data   },
  { if: R_hex_esc,    emit: T_escape_hex  },
  { if: '\\\\.',      emit: T_escape_char }, // FIXME what about backslash-newline?
  { emit: T_name_end, goto: 'main' },
  ]

}


module.exports = grammar