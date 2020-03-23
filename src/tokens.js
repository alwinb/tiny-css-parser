// These are token types. 
// Tokens are pairs (arrays) [type, value]

const tokens = {

  // Lexer tokens
  
  CDC: 'CDC',
  CDO: 'CDO',
  delim: 'delim',
  delim_invalid: 'delim-invalid',
  escape_char: 'escape-char',
  escape_hex: 'escape-hex',
  hex_end: 'escape-hex-space',
  group_start: 'group-start',
  group_end: 'group-end',
  group_badend: 'group-badend',
  number: 'number',
  comma: 'comma',
  semicolon: 'semicolon',
  colon: 'colon',
  column: 'column',
  percent_sign : 'percent-sign',
  op: 'operator',
  space: 'space',
  newline: 'newline',
  comment_start: 'comment-start',
  comment_data: 'comment-data',
  comment_end: 'comment-end',
  at_start: 'ident-at-start',
  hash_start: 'ident-hash-start',
  hashid_start: 'ident-hashid-start',
  ident_start: 'ident-start',
  ident_chars: 'ident-chars',
  ident_end: 'ident-end',
  string_start: 'string-start',
  string_chars: 'string-chars',
  ignore_newline: 'ignore-newline',
  escape_eof: 'escape-eof',
  string_end: 'string-end',
  string_bad_end: 'string-bad-end',
  
  // And parser tokens

  atrule_start: 'atrule-start',
  atrule_end: 'atrule-end',
  name_start: 'name-start',
  name_end: 'name-end',
  qrule_start: 'qrule-start',
  qrule_end: 'qrule-end',
  prelude_start: 'prelude-start',
  prelude_end: 'prelude-end',
  body_start: 'body-start',
  body_end: 'body-end',
  declaration_start: 'decl-start',
  declaration_end: 'decl-end',
  declaration_invalid: 'decl-invalid',
  value_start: 'value-start',
  value_end: 'value-end',
  dimension_start: 'dimension-start', 
  dimension_end: 'dimension-end', 
  unit_start: 'unit-start', 
  unit_end: 'unit-end', 
  percentage_start: 'percentage-start', 
  percentage_end: 'percentage-end', 
}

module.exports = tokens