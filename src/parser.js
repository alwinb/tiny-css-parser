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
  declaration_invalid: 'decl-invalid',
  value_start: 'value-start',
  value_end: 'value-end',
}

for (let a in tokens)
  parserTokens [a] = tokens [a]

let i = 0
const MAIN = 'MAIN' // ++i
  , BODY = 'BODY' // ++i
  , DECLS = 'DECLS' // ++i
  , DECL_NAME = 'DECL_NAME' // ++i
  , DECL_COLON = 'DECL_COLON' // ++i
  , DECL_VALUE = 'DECL_VALUE' // ++i
  , GROUP = 'GROUP'
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

    else if (t === T.group_start && c === '{') switch (state) {
      case MAIN:
      case BODY:
        yield [T.qrule_start]
        yield [T.prelude_start]
        yield [T.prelude_end]
        yield [T.body_start, c]
        stack [top] = DECLS
        contexts.push (T.qrule_end)
      break
      case ATRULE_PRELUDE:
        yield [T.prelude_end]
        yield [T.body_start, c]
        stack [top] = BODY // | DECLS
      break
      case QRULE_PRELUDE:
        yield [T.prelude_end]
        yield [T.body_start, c]
        stack [top] = DECLS
      break
      case DECLS:
        yield [T.declaration_start]
        stack [top] = state = DECL_COLON
      // NB. Fallthrough (no break)
      case DECL_COLON:
        yield [T.declaration_invalid]
        yield [T.value_start]
        stack [top] = state = DECL_VALUE
      // NB. Fallthrough (no break)
      default:
        stack.push (GROUP)
        yield token
    }

    else if (t === T.group_end && c === '}') switch (state) {
      case QRULE_PRELUDE:
      case ATRULE_PRELUDE:
        yield [T.prelude_end]
        yield [contexts.pop ()]
        stack.pop ()
        top = stack.length - 1
        state = stack [top]
      // NB. Fallthrough (no break)
      case BODY:
      case DECLS:
        yield [T.body_end, c]
        yield [contexts.pop ()]
        stack.pop ()
      break
      case DECL_COLON:
        yield [T.declaration_invalid]
        yield [T.declaration_end]
        yield [T.body_end, c]
        yield [contexts.pop ()]
        stack.pop ()
      break
      case DECL_VALUE:
        yield [T.value_end]
        yield [T.declaration_end]
        state = DECLS
        yield [T.body_end, c]
        yield [contexts.pop ()]
        stack.pop ()
      break
      case GROUP:
        yield token
        stack.pop ()
      break
      default:
        // should never happen
        stack.pop ()
        yield token
    }

    else if (t === T.group_start) {
      if (state === DECLS) {
        yield [T.declaration_start]
        stack [top] = DECL_COLON
      }
      if (state === DECL_COLON) {
        yield [T.declaration_invalid]
        yield [T.value_start]
        stack [top] = DECL_VALUE
      }
      stack.push (GROUP)
      yield token
    }

    else if (t === T.group_end) {
      stack.pop ()
      yield token
    }

    else if (t === T.semicolon) switch (state) {
      case MAIN:
      case BODY:
        yield [T.qrule_start]
        yield [T.prelude_start]
        yield token
        contexts.push (T.qrule_end)
        stack.push (QRULE_PRELUDE)
      break
      case ATRULE_PRELUDE:
        yield [T.prelude_end]
        yield [T.atrule_end, c]
        stack.pop ()
      break
      case DECL_VALUE:
        yield [T.value_end]
        yield [T.declaration_end, c]
        stack [top] = DECLS
      break
      case DECLS:
        yield [T.declaration_start]
        yield [T.declaration_invalid]
        yield [T.declaration_end, c]
      break
      case DECL_COLON:
        yield [T.declaration_invalid]
        yield [T.declaration_end, c]
        stack [top] = DECLS
      break
      default:
        yield token
    }

    else if (t === T.at_start && (state === MAIN || state === BODY || state === DECLS)) {
      yield [T.atrule_start]
      contexts.push (T.atrule_end)
      yield [T.name_start, c]
      stack.push (ATRULE_NAME)
    }

    else if (t === T.ident_start && state === DECLS) {
      yield [T.declaration_start]
      yield [T.name_start, c]
      stack [top] = DECL_NAME
    }

    else if (state === DECLS) {
      yield [T.declaration_start]
      yield [T.declaration_invalid]
      yield [T.value_start]
      yield token
      stack [top] = DECL_VALUE
    }
    
    else if (t === T.ident_end && state === ATRULE_NAME) {
      stack [top] = ATRULE_PRELUDE
      yield [T.name_end, c]
      yield [T.prelude_start]
    }

    else if (t === T.ident_end && state === DECL_NAME) {
      stack [top] = DECL_COLON
      yield [T.name_end, c]
    }

    //else if (t === T.number) {
    //  spare = token
    //  yield token
    //  // TODO Wait for the next token(s) to merge into percentage/ dimension
    //}

    else if (t === T.colon && state === DECL_COLON) {
      yield token
      yield [T.value_start]
      stack [top] = DECL_VALUE
    }

    else if (state === DECL_COLON && t !== T.colon) {
      yield [T.declaration_invalid]
      yield [T.value_start]
      stack [top] = DECL_VALUE
      yield token
    }

    else {
      // Conditional action
      if (state === MAIN || state === BODY) {
        contexts.push (T.qrule_end)
        yield [T.qrule_start]
        yield [T.prelude_start]
        stack.push (QRULE_PRELUDE)
      }

      yield token
    }
  }
}


module.exports = { parse:parse, tokens:parserTokens }
