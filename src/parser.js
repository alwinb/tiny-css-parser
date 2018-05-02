"use strict"
module.exports = parse
const { tokens:T } = require ('./grammar')
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
  decl_start: 'decl-start',
  decl_end: 'decl-end',
  value_start: 'value-start',
  value_end: 'value-end',
  decl_end_invalid: 'decl-end-invalid',
  group_badend: 'group-badend'
}

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
  let P = parserTokens
  let context_end // FIXME needs to be stored on stack

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
        yield [P.qrule_start]
        yield [P.prelude_start]
        yield [P.group_badend, c]
        stack.push (QRULE_PRELUDE)
      break
      case BODY:
      case DECLS:
        yield [P.body_end, c]
        yield [context_end]
        stack.pop ()
      break
      case DECL_COLON:
        yield [P.decl_end_invalid]
        yield [P.body_end, c]
        yield [context_end]
        stack.pop ()
      break
      case DECL_VALUE:
        yield [P.decl_end]
        yield [P.body_end, c]
        yield [context_end]
        stack.pop ()
      break
      case DECL_INVALID:
        yield [P.decl_end_invalid]
        yield [P.body_end, c]
        yield [context_end]
        stack.pop ()
      break
      case BRACES:
        yield token
        stack.pop ()
      break
      default:
        yield [P.group_badend, c]
    }

    else if (t === T.at_start && (state === MAIN || state === BODY || state === DECLS)) {
      context_end = P.atrule_end
      stack.push (ATRULE_NAME)
      yield [P.atrule_start]
      yield [P.name_start, c]
    }

    else if (t === T.ident_end && state === ATRULE_NAME) {
      stack [top] = ATRULE_PRELUDE
      yield [P.name_end, c]
      yield [P.prelude_start]
    }

    else if (t === T.ident_start && state === DECLS) {
      yield [P.decl_start]
      yield token
    }

    else if (t === T.ident_end && state === DECLS) {
      stack [top] = DECL_COLON
      yield token
    }

    // Careful with the nested else here
    // It's here because the other branches below
    // are preceded by some conditional action,
    // see below...

    else {

      // Conditional actions

      if (state === MAIN || state === BODY) {
        context_end = P.qrule_end
        yield [P.qrule_start]
        yield [P.prelude_start]
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
          yield [P.decl_end_invalid, c]
          stack [top] = DECLS
        break
        case DECL_VALUE:
          yield [P.decl_end, c]
          stack [top] = DECLS
        break
        case ATRULE_PRELUDE:
          yield [P.prelude_end]
          yield [P.atrule_end, c]
          stack.pop ()
        break
        default:
          yield token
      }

      else if (c === '{') switch (state) {
        case ATRULE_PRELUDE:
          stack [top] = BODY // | DECLS // TODO make configurable
          yield [P.prelude_end]
          yield [P.body_start]
        break
        case QRULE_PRELUDE:
          stack [top] = DECLS
          yield [P.prelude_end]
          yield [P.body_start]
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
          yield [P.group_noend, c]
      }

      else if (c === ')') switch (state) {
        case PARENS:
          yield token
          stack.pop ()
        break
        default:
          yield [P.group_noend, c]
      }

      else if (t === T.colon && state === DECL_COLON) {
        stack [top] = DECL_VALUE
        yield token
        yield [P.value_start]
      }

      // FUNC && c === ')'
      //   stack.pop ()

      else {
        yield token
      }
    }
  }
}


