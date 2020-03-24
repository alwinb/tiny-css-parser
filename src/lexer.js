const T = require ('./tokens')
const TinyLexer = require ('./tiny-lexer')
const raw = String.raw

// A tiny-lexer based tokenizer for CSS
// ====================================

// ### Regular expressions
// These are used in the tiny-lexer grammar below.
// Each regular expression corresponds to a transition between states. 

const R_space   = raw `[\t ]+`
const R_space1  = raw `[\t ]`
const R_newline = raw `(?:\r?\n|[\r\f])`
const R_lgroup  = raw `[({[]`
const R_rgroup  = raw `[)}\]]`
const R_op      = raw `[|~^*$]=` // In the spec these are separate tokens

// Escapes
const R_hex_esc = raw `\\[0-9A-Fa-f]{1,6}`

// Strings
const R_string  = raw `[^\n\r\f\\'"]+`
const R_nl_esc  = raw `\\` + R_newline

// Comments
const R_comment  = raw `.[^\n\r\f*]*`

// Numbers
const R_fract   = '(?:\\.[0-9]+)'
const R_opt_exp = '(?:[eE][+\\-]?[0-9]+)?'
const R_number  = '[+-]?(?:' + R_fract + '|[0-9]+' + R_fract + '?)' + R_opt_exp

// Identifiers
// Using a lookahead of max 3 chars
const R_starts_ident   = raw `(?=[-]?(?:[A-Za-z_\u0080-\uFFFF]|\\[^\n\r\f]))`
const R_hash_lookahead = raw `(?=(?:[A-Za-z0-9\-_\u0080-\uFFFF]|\\[^\n\r\f]))`

const R_at_start     =    '@' + R_starts_ident
const R_hash_start   =    '#' + R_hash_lookahead
const R_hashid_start =    '#' + R_starts_ident
const R_ident_start  = '.{0}' + R_starts_ident
const R_ident        = raw `[A-Za-z0-9\-_\u0080-\uFFFF]+`


// ### The actual grammar

const grammar = 
{ main: [
  [ '/[*]',         T.comment_start,  'comment'],
  [ '["\']',        T.string_start,    quote   ],
  [ R_ident_start,  T.ident_start,    'ident'  ],
  [ R_hashid_start, T.hashid_start,   'ident'  ],
  [ R_hash_start,   T.hash_start,     'ident'  ],
  [ R_at_start,     T.at_start,       'ident'  ],
  [ R_space,        T.space,                   ],
  [ R_newline,      nl (T.newline),            ],
  [ R_number,       T.number,                  ],
  [ R_lgroup,       group_start,               ],
  [ R_rgroup,       group_end,                 ],
  [ ',',            T.comma                    ],
  [ ';',            T.semicolon,               ],
  [ ':',            T.colon,                   ],
  [ '%',            T.percent_sign,            ],
  [ R_op,           T.op,                      ],
  [ '[|][|]',       T.column,                  ],
  [ '<!--',         T.CDO,                     ],
  [ '-->',          T.CDC,                     ],
  [ '\\\\',         T.delim_invalid,           ],
  [ '.',            T.delim,                   ]]

, comment: [
  [ '[*]/',         T.comment_end,    'main'   ],
  [ R_newline,      nl (T.comment_data),       ],
  [ R_comment,      T.comment_data             ]]

, string: [
  [ '["\']',        quote_emit,        unquote ],
  [ '$',            T.string_end,     'main'   ],
  [ R_string,       T.string_chars             ],
  [ R_nl_esc,       nl (T.ignore_newline)      ],
  [ R_hex_esc,      T.escape_hex,      hex_end ],
  [ '\\\\$',        T.escape_eof               ],
  [ '\\\\.',        T.escape_char              ],
  [ '.{0}',         T.string_bad_end, 'main'   ]]

, ident: [
  [ R_ident,        T.ident_chars              ],
  [ R_hex_esc,      T.escape_hex,      hex_end ],
  [ '\\\\.',        T.escape_char              ],
  [ '.{0}',         T.ident_end,      'main'   ]]

, hex_end: [
  [ R_space1,       T.hex_end,         context ],
  [ R_newline,      nl (T.hex_end),    context ],
  [ '.{0}',         T.hex_end,         context ]]

}


// Additional state management, to count newlines
//  and to track quotation style and open groups. 

function CustomState () {
  this.symbol = 'main'
  this.position = 0
  this.lineStart = 0
  this.line = 0
  this.stack = []
  this.quot
  this.context
}

function nl (type) { return function (chunk) {
  this.lineStart = this.position
  this.line++
  return type
} }

function hex_end () {
  this.context = this.symbol
  return 'hex_end'
}

function context () {
  return this.context
}

function quote (chunk) {
  this.quot = chunk
  return 'string'
}

function quote_emit (chunk) {
  return chunk !== this.quot ? T.string_chars : T.string_end
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
  if (mirror [chunk] === s [s.length - 1]) {
    s.pop ()
    return T.group_end
  }
  return T.group_badend
}


// ### The actual lexer
// Wrapping it all up together

const lexer = new TinyLexer (grammar, 'main', CustomState)
module.exports = { grammar, tokens:T, tokenise:lexer.tokenize, tokenize:lexer.tokenize }