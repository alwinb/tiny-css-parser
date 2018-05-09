"use strict"
const { tokens } = require ('./lexer')
const log = console.log.bind (console)

const parserTokens = {
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
  declaration_end_invalid: 'decl-end-invalid',
  value_start: 'value-start',
  value_end: 'value-end',
  group_badend: 'group-badend'
}

for (let a in tokens)
  parserTokens [a] = tokens [a]

const MAIN = 'MAIN' // ++i
  , BODY = 'BODY' // ++i
  , DECLS = 'DECLS' // ++i
  , DECL_COLON = 'DECL_COLON' // ++i
  , DECL_VALUE = 'DECL_VALUE' // ++i
  , DECL_INVALID = 'DECL_INVALID' // ++i
  , BRACES = 'BRACES' // ++i
  , BRACKS = 'BRACKS' // ++i
  , PARENS = 'PARENS' // ++i
  , ATRULE_NAME = 'ATRULE_NAME' // ++i
  , ATRULE_PRELUDE = 'ATRULE_PRELUDE' // ++i
  , QRULE_PRELUDE = 'QRULE_PRELUDE' // ++i


function* parse (tokens) {
  const stack = [MAIN]
  const contexts = []
  let T = parserTokens
  let spare

  for (let token of tokens) {
    let t = token [0], c = token [1]
    let top = stack.length - 1
    let state = stack [top]
    //log ('\t\t', stack, token)

    if (t === T.space || t === T.newline)
      yield token

    else if (t === T.comment_start || t === T.comment_end || t === T.comment_data)
      yield token

    else if (c === '}') switch (state) {
      case MAIN:
        yield [T.qrule_start]
        yield [T.prelude_start]
        yield [T.group_badend, c]
        stack.push (QRULE_PRELUDE)
      break
      case BODY:
      case DECLS:
        yield [T.body_end, c]
        yield [contexts.pop ()]
        stack.pop ()
      break
      case DECL_COLON:
        yield [T.declaration_end_invalid]
        yield [T.body_end, c]
        yield [contexts.pop ()]
        stack.pop ()
      break
      case DECL_VALUE:
        yield [T.value_end]
        yield [T.declaration_end]
        yield [T.body_end, c]
        yield [contexts.pop ()]
        stack.pop ()
      break
      case DECL_INVALID:
        yield [T.declaration_end_invalid]
        yield [T.body_end, c]
        yield [contexts.pop ()]
        stack.pop ()
      break
      case BRACES:
        yield token
        stack.pop ()
      break
      default:
        yield [T.group_badend, c]
    }

    else if (t === T.at_start && (state === MAIN || state === BODY || state === DECLS)) {
      contexts.push (T.atrule_end)
      stack.push (ATRULE_NAME)
      yield [T.atrule_start]
      yield [T.name_start, c]
    }

    else if (t === T.ident_end && state === ATRULE_NAME) {
      stack [top] = ATRULE_PRELUDE
      yield [T.name_end, c]
      yield [T.prelude_start]
    }

    else if (t === T.ident_start && state === DECLS) {
      yield [T.declaration_start]
      yield [T.name_start, c]
    }

    else if (t === T.ident_end && state === DECLS) {
      stack [top] = DECL_COLON
      yield [T.name_end, c]
    }

    else if (t === T.number) {
      spare = token
      yield token
      // TODO Wait for the next token(s) to merge into percentage/ dimension
    }

    // Careful with the nested else here
    // It's here because the other branches below
    // are preceded by some conditional action,
    // see below...

    else {

      // Conditional actions

      if (state === MAIN || state === BODY) {
        contexts.push (T.qrule_end)
        yield [T.qrule_start]
        yield [T.prelude_start]
        stack.push (QRULE_PRELUDE)
      }

      else if (state === DECL_COLON && t !== T.colon) {
        stack [top] = DECL_INVALID
        state = stack [top]
      }

      // NB! Fallthrough (no else)
      // Continue with the remaining branches

      if (t === T.semicolon) switch (state) {
        case DECL_COLON:
        case DECL_INVALID:
          yield [T.declaration_end_invalid, c]
          stack [top] = DECLS
        break
        case DECL_VALUE:
          yield [T.value_end, c]
          yield [T.declaration_end, c]
          stack [top] = DECLS
        break
        case ATRULE_PRELUDE:
          yield [T.prelude_end]
          yield [T.atrule_end, c]
          stack.pop ()
        break
        default:
          yield token
      }

      else if (c === '{') switch (state) {
        case ATRULE_PRELUDE:
          stack [top] = BODY // | DECLS // TODO make configurable
          yield [T.prelude_end]
          yield [T.body_start]
        break
        case QRULE_PRELUDE:
          stack [top] = DECLS
          yield [T.prelude_end]
          yield [T.body_start]
        break
        default:
          stack.push (BRACES)
          yield token
      }

      else if (c === '[') {
        stack.push (BRACKS)
        yield token
      }

      else if (c === '(') {
        stack.push (PARENS)
        yield token
      }

      else if (c === ']') switch (state) {
        case BRACKS:
          yield token
          stack.pop ()
        break
        default:
          yield [T.group_noend, c]
      }

      else if (c === ')') switch (state) {
        case PARENS:
          yield token
          stack.pop ()
        break
        default:
          yield [T.group_noend, c]
      }

      else if (t === T.colon && state === DECL_COLON) {
        stack [top] = DECL_VALUE
        yield token
        yield [T.value_start]
      }

      // FUNC && c === ')'
      //   stack.pop ()

      else {
        yield token
      }
    }
  }
}


module.exports = { parse:parse, tokens:parserTokens }
