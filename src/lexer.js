"use strict"
module.exports = TokenStream

const EOF = 'eof'

// Css tokenizer
// =============

function tokenize (input) {
  var stream = new TokenStream (input)
  var it = 
    { done: false
    , value: null
    , [Symbol.iterator]: function () { return it }
    , next: function () {
      var v = stream.next ()
      this.position = v[0]
      this.value = v[1]
      this.done = v[1][0] === EOF 
      return it }
    }
  return it
}

TokenStream.tokenize = tokenize

function TokenStream (input) {
  let pos = 0
    , lastnl = 0
    , line = 1
    , self = this

  this.info = info
  this.next = next
  
  function next () {
    var left = [pos, line, pos - lastnl] // position; line; col
    if (pos >= input.length) {
      input = null
      return [left, [EOF, '']]
    }
    var c2 = input.substr (pos, 2)
      , c = c2[0]
      , cc = c.charCodeAt (0)
    return [left, _next (c, cc, c2)]
  }

  function info () {
    return [pos, line, pos - lastnl] // position; line; col
  }


  // Private

  function peek (l) {
    return input.substr (pos + 1, l)
  }

  function _next (c, cc, c2) {
    if (is_wsp_char (cc)) return space (input, pos, line, lastnl)

    if (c === 'U' || c === 'u') { // Consume a unicode range
      var _c = input[pos + 2]
      if (c2[1] === '+' && _c === '?' || is_hex_digit_char(_c.charCodeAt(0))) {
        pos++
        return unicode_range () // TODO unicode range
      }
      else return ident ('ident')
    }

    if (is_name_start_char (cc)) return ident ('ident')
    if (is_digit_char (cc)) return regex ('number', _number_re)
    if (c === '"') return regex ('string', _dstring) // TODO add escape sequences, badstrings, newline counts
    if (c === "'") return regex ('string', _sstring)
    if (c2 === '/*') return comment ()

    if (c2 in _ops2) {
      pos += 2;
      return ['operator', c2]
    }

    if (c === '<') { // '<!--', or standalone '<'
      if (peek(3) === '!--') {
        pos += 3
        return ['<!--', '<!--']
      }
      else {
        pos++
        return ['<', c]
      }
    }

    if (c === '#') { // hash-keyword, or standalone '#'
      if (is_name_char (c2.charCodeAt(1)) || is_escape_string (peek (2))) {
        var type = is_ident_start (peek (3)) ? 'hashid' : 'hash'
        return name (type)
      }
      else {
        pos++
        return ['#', c]
      }
    }

    if (c === '@') { // at-keyword, or standalone '@'
      if (is_ident_start( peek (3)))
        return name ('at')
      else {
        pos++
        return ['@', c]
      }
    }

    if (c === '-') { // number, ident, '-->' or standalone '-'
      var s = c + peek(2)
      if (is_number_start(s))
        return regex( 'number', _number_re)
      else if (is_ident_start(s))
        return ident ('ident')
      else if (s === '-->') {
        pos += 3
        return ['-->', '-->']
      }
      else {
        pos++
        return ['-', c]
      }
    }

    if (c === '+' || c === '.') { // number or standalone '.'
      if (is_number_start (c + peek(2)))
        return regex ('number', _number_re)
      else {
        pos++;
        return [c, c]
      }
    }

    if (c === '\\') {
      if (c2[1] !== '\n')
        return ident ('ident') // identifier starting with an esape sequence
      else return ['\\', '\\']
    }
    else {
      pos++;
      return [c, c]
    }
  }

  // token producers
  //  consume a token from the input and update the lexer state

  function space () {
    var pos0 = pos // ASSUMES input[pos] is whitespace. Counts newlines. 
    do {
      if (input[pos] === '\n') {
        line++
        lastnl = pos
      };
      ++pos
    }
    while (is_wsp_char (input.charCodeAt (pos)))
    return ['wsp', input.substring(pos0, pos)]
  }

  function ident (type) {
    var n = name (type) // TODO, url, bad-url, escapes
    if (input[pos] === '(') {
      pos++;
      return ['func', n[1]]
    }
    else return n
  }

  function name (type) {
    var l = pos
    do {
      ++pos
    }
    while (is_name_char (input.charCodeAt (pos))) // TODO implement escape points
    return [type, input.substring (l, pos)]
  }

  function comment () {
    // ASSUMES that input.substr(pos,2) === '/*'
    // Note, this could be sped up by removing the overlap
    var pos0 = pos
    pos += 2
    do {
      if (input[pos] === '\n') {
        line++
        lastnl = pos
      }
      ++pos
    }
    while (input.substr(pos, 2) !== '*/')
    pos += 2
    return ['comment', input.substring(pos0, pos)]
  }

  function regex (type, re) {
    var pos0 = pos
    re.lastIndex = pos
    var t = re.test(input)
    if (t && re.lastIndex > pos) {
      pos = re.lastIndex
      return [type, input.substring(pos0, pos)]
    }
    else {
      return error('expecting' + type)
    }
  }

  /* end of TokenStream */
}

function is_wsp_char (cc) { // TODO adapt to CSS spec (the newline thing)
  return (cc === 0x20 || cc === 0x09 || cc === 0x0a || cc === 0x0d)
}

function is_digit_char (cc) { // 0-9
  return (0x30 <= cc && cc <= 0x39)
}

function is_hex_digit_char (cc) { // 0-9 | A-F | a-f
  return (0x30 <= cc && cc <= 0x39 || 0x41 <= cc && cc <= 0x46 || 0x61 <= cc && cc <= 0x66)
}

function is_name_start_char (cc) { // A-Z | a-z | '_' | nonASCII
  return (0x41 <= cc && cc <= 0x5A) || (0x61 <= cc && cc <= 0x7A) || (cc === 0x5F) || (cc >= 0x80)
}

function is_name_char (cc) { // name-start | digit | '-'
  return is_name_start_char (cc) || (0x30 <= cc && cc <= 0x39) || (cc === 0x2D)
}

function is_ident_start (s) {
  return is_name_start_char (s.charCodeAt(0)) ||
    (s[0] === '-' && (is_name_start_char(s.charCodeAt(1)) || is_escape_string(s.substr(1)))) ||
    is_escape_string(s)
}

// Note: a bit superfluous, re-checks some invarints ensured by the call context
function is_number_start (s) { // [0-9]|\.[0-9]|[+-]\.?[0-9]
  return is_digit_char(s.charCodeAt(0)) ||
    (s[0] === '.' && is_digit_char(s.charCodeAt(1)) ||
      ((s[0] === '+' || s[0] === '-') && is_digit_char(s.charCodeAt(1)) || (s[2] === '.' && is_digit_char(s.charCodeAt(2)))))
}

function is_escape_string (s) {
  return s[0] === '\\' && s[1] !== '\n'
} // TODO: other 'newline' combinations?

var _ops2 = {
  '~=': true,
  '|=': true,
  '^=': true,
  '$=': true,
  '*=': true
}

const _frac = '(?:\\.[0-9]+)'
const _exp = '(?:[eE][+-]?[0-9]+)'
const _number = '(?:[+-]?(?:' + _frac + '|(?:[0-9]+' + _frac + '?))' + _exp + '?)'
const _number_re = new RegExp(_number + '|.{0}', 'g')
const _dstring = new RegExp('"([^"\\u000A\\u000C\\u000D\\\\]*)"|.{0}', 'g')
const _sstring = new RegExp("'([^'\\u000A\\u000C\\u000D\\\\]*)'|.{0}", 'g')

