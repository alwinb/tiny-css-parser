"use strict"
const T = require ('./tokens')
const log = console.log.bind (console)

// Parser
// ======

let i = 0
const MAIN = 'MAIN' // ++i
  , RULES = 'RULES' // ++i
  , DECLS = 'DECLS' // ++i
  , DECL_NAME = 'DECL_NAME' // ++i
  , DECL_COLON = 'DECL_COLON' // ++i
  , DECL_VALUE = 'DECL_VALUE' // ++i
  , GROUP = 'GROUP' // ++i
  , ATRULE_NAME = 'ATRULE_NAME' // ++i
  , ATRULE_PRELUDE = 'ATRULE_PRELUDE' // ++i
  , QRULE_PRELUDE = 'QRULE_PRELUDE' // ++i
  , DIMENSION_UNIT = 'DIMENSION_UNIT' // i++

const atruleMap = {
  media: RULES,
  supports: RULES,
  document: RULES,
  keyframes: RULES,
  page: DECLS,
  viewport: DECLS,
  'font-face': DECLS,
  'counter-style': DECLS,
}


function* parse (tokens, _state = MAIN) {
  const stack = [_state]
  const contexts = []
  let ident = null
  let atrule = null
  let number = null

  for (let token of tokens) {
    let t = token [0], c = token [1]
    let top = stack.length - 1
    let state = stack [top]
    // log ('\t\t', stack, token)

    // Collect the constituents of identifiers and at keywords
    if (t === T.ident_start || t === T.at_start)
      ident = []

    if (ident)
      ident.push (token)

    // number tokens are delayed in order to wrap <number><ident> and <number><percent>
    if (number && t !== T.ident_start && t !== T.percent_sign) {
      yield number
      number = null
    }

    if (t === T.number) {
      number = token
      continue
    }

    if (t === T.space || t === T.newline)
      yield token

    else if (state === MAIN && (t === T.CDO || t === T.CDC))
      yield token

    else if (t === T.comment_start || t === T.comment_end || t === T.comment_data)
      yield token

    else if (t === T.group_start && c === '{') switch (state) {
      case MAIN:
      case RULES:
        yield [T.qrule_start]
        yield [T.prelude_start]
        yield [T.prelude_end]
        yield [T.body_start, c]
        stack.push (DECLS)
        contexts.push (T.qrule_end)
      break
      case ATRULE_PRELUDE:
        yield [T.prelude_end]
        yield [T.body_start, c]
        stack [top] = atrule in atruleMap ? atruleMap [atrule] : DECLS
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
      case RULES:
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
      case RULES:
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

    else if (t === T.at_start && (state === MAIN || state === RULES || state === DECLS)) {
      yield [T.atrule_start]
      contexts.push (T.atrule_end)
      yield [T.name_start, c]
      stack.push (ATRULE_NAME)
    }

    else if (number && t === T.ident_start) {
      yield [T.dimension_start]
      yield number
      number = null
      yield [T.unit_start, c]
      stack.push (DIMENSION_UNIT)
    }

    else if (number && t === T.percent_sign) {
      yield [T.percentage_start]
      yield number
      number = null
      yield token
      yield [T.percentage_end]
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
      atrule = eval_ident (ident)
      ident = null
      yield [T.name_end, c]
      yield [T.prelude_start]
    }

    else if (t === T.ident_end && state === DECL_NAME) {
      stack [top] = DECL_COLON
      ident = null
      yield [T.name_end, c]
    }

    else if (t === T.ident_end && state === DIMENSION_UNIT) {
      yield [T.unit_end, c]
      yield [T.dimension_end]
      ident = null
      stack.pop ()
    }
    
    else if (t === T.ident_end) {
      ident = null
      yield token
    }

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

    else if (state === MAIN || state === RULES) {
      contexts.push (T.qrule_end)
      yield [T.qrule_start]
      yield [T.prelude_start]
      stack.push (QRULE_PRELUDE)
      yield token
    }

    else 
      yield token

  }
}


function eval_ident (tokens) {
  return tokens.map (eval_token) .join('')
}

function eval_token (token) {
  switch (token [0]) {
    case T.ident_chars:
      return token [1]
    break

    case T.escape_char:
      return token [1] .substr (1)
    break

    case T.escape_hex:
      return String.fromCharCode (parseInt (token [VALUE] .substr (1), 16))
      // TODO check correctness (surrogates and null e.a.)
    break
  }
}



module.exports = { parse:parse, tokens:T }