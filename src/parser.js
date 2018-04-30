"use strict"
module.exports = parse
const { tokens:T } = require ('./grammar')
const log = console.log.bind (console)

const parseTokens = {
  atrule_start: 'atrule-start',
  atrule_end: 'atrule-end',
  qrule_start: 'qrule-start',
  qrule_end: 'qrule-end',
  prelude_start: 'prelude-start',
  prelude_end: 'prelude-end',
  body_start: 'body-start',
  body_end: 'body-end',
}

let i = 1
const STYLESHEET = i++
  , ATRULE_NAME = i++
  , ATRULE_PRELUDE = i++
  , ATRULE_BODY = i++
  , QRULE_PRELUDE = i++
  , QRULE_BODY = i++
  , FUNC = i++
  , DONE = i++
  , DECL_COLON = i++
  , DECL_VALUE = i++
  , DECL_INVALID = i++

// Parses at-rules, q-rules, declarations
// at-rule  has { name, prelude, ?body }
// q-rule has { prelude, body }

function* parse (tokens) {
  const stack = [STYLESHEET]
  let state = stack [stack.length-1]

  for (const tok of tokens) {
    const t = tok[0], c = tok[1]

    // if (t === T.CDO || t === T.CDC) { // TODO
    //   if (state === STYLESHEET) yield tok
    //   else yield tok // or what?
    // }

    if (t === T.at_start) switch (state) {
      case STYLESHEET:
      case QRULE_BODY:
      case ATRULE_BODY:
        yield ['start-atrule']
        yield tok
        state = ATRULE_NAME
      break
      
      default:
        yield tok
    }
    
    else if (t === T.ident_end) switch (state) {
      case ATRULE_NAME:
        yield tok
        yield ['start-prelude']
        state = ATRULE_PRELUDE
      break
      
      case QRULE_BODY:
        yield
      break
      
      default:
        yield tok
    }

    else if (t === T.semicolon) switch (state) {
      case DECL_COLON:
      case DECL_INVALID:
        yield ['end-decl-invalid', c]
      break

      case DECL_VALUE:
        yield ['end-value', c]
      break

      case ATRULE_PRELUDE:
        yield ['end-prelude']
        yield ['end-atrule', c]
        state = STYLESHEET
      break

      default:
        yield tok
    }

    else if (c === '{') switch (state) {
      case QRULE_PRELUDE:
        yield ['end-prelude']
        yield ['start-body', c]
        state = QRULE_BODY
      break
      
      case ATRULE_PRELUDE:
        yield ['end-prelude']
        yield ['start-body', c]
        state = ATRULE_BODY
      break
      
      default:
        yield tok
    }

    else if (c === '}') switch (state) {
      case DECL_COLON:
      case DECL_INVALID:
        yield ['end-decl-invalid']
        yield ['end-body', c]
        yield ['end-qrule']
      break

      case DECL_VALUE:
        yield ['end-value']
        yield ['end-body', c]
        yield ['end-qrule']
      break

      case ATRULE_BODY:
        yield ['end-body', c]
        yield ['end-atrule']
      break
      
      case QRULE_BODY:
        yield ['end-body', c]
        yield ['end-qrule']
        state = STYLESHEET
      break

      default:
        yield tok
    }
    
    else switch (state) {
      case STYLESHEET:
        yield ['start-qrule']
        yield ['start-prelude']
        state = QRULE_PRELUDE
        yield tok
      break
      
      default:
        yield tok
    }
  }
}

///
