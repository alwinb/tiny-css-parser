(function (){ "use strict";

// States

var i = 1
const STYLESHEET = i++
	, ATRULE = i++
	, QRULE = i++
	, PARENS = i++
	, BRACES = i++
	, BRACKS = i++
	, FUNC = i++
	, DONE = i++
	, QRULE_BODY = i++
	, ATRULE_BODY = i++
	, DECLS = i++
	, DECL_COLON = i++
	, DECL_VALUE = i++
	, DECL_INVALID = i++

// Tokens
// TODO

// Parse just enough so that we can pick out the qualified rules
//  Q. How do we distinguish style rules from other qualified rules? (is defined by the context...)

function LazyParser (tokens) {
	var	stack = [DONE]
    , q = STYLESHEET // stack, current state, current token
	var	atok, _reuse = false, _out = [], _internal = []
	var rule_count = 0
  var self = this

  this.next = next
  this.done = false
  
  this._it_next = function () { // For iterators
    this.value = next () [1] // Don't return the info
    return this
  }
  
function next () { // takes care of input buffer (one token) and output buffer
	while (!_out.length) tick ()
	return [atok[0], _out.shift()] }

// Private

function pop  (tok1, tok2, _) {
	q = stack.pop ()
	for (var i=0,l=arguments.length; i<l; i++)
		_out.push (arguments[i]) }

function goto  (state, tok1, tok2, _) {
	q = state
	for (var i=1,l=arguments.length; i<l; i++)
		_out.push (arguments[i]) }

function push  (state, tok1, tok2, _) {
	stack.push (q); q = state
	for (var i=1,l=arguments.length; i<l; i++)
		_out.push (arguments[i]) }

function tick () {
	atok = (_reuse) ? atok : tokens.next()
	_reuse = false

	var tok = atok[1]
	var c = tok[0]
	switch (q) {

		case STYLESHEET:
			if (c === 'wsp' || c === 'comment' || c === '<!--' || c === '-->')
				return goto (q, tok) // Assumes we're parsing a top-level styesheet

			if (c === 'at' )
				return push (ATRULE, ['start-atrule', tok[1]], ['start-prelude'])

			if (c === 'eof') {
        self.done = true
				return pop (['end-stylesheet'])
      }

			else {
				_reuse = true
				return push (QRULE, ['start-qrule', rule_count++], ['start-prelude']) }


    // NB this is assumed to always be in the context of a qrule, 
    // hence the handling of '}' and 'eof'

    case DECLS: 
			if (c === 'wsp' || c === 'comment' || c === ';')
				return goto (q, tok)

			if (c === 'ident')
				return goto (DECL_COLON, ['start-decl', tok[1]])

			if (c === '}' || c === 'eof')
				return pop (['end-body', c], ['end-qrule'])

			if (c === 'at')
				return push (ATRULE, ['start-atrule', tok[1]], ['start-prelude'])

			else {
				_reuse = true
				return goto (DECL_INVALID, ['start-decl'], ['decl-invalid']) }


		case DECL_COLON:
			if (c === 'wsp' || c === 'comment')
				return goto (q, tok)

			if (c === ':')
				return goto (DECL_VALUE, tok, ['start-value'])

			if (c === ';' || c === 'eof')
				return pop (['end-decl-invalid', c])

			else
				return goto (DECL_INVALID, ['decl-invalid'], tok)


		// NB all cases below might not return,
		//  in which case we continue to consume a component value

		case QRULE: // has { prelude, body }
			if (c === 'eof')
				return pop (['end-prelude'], ['end-qrule-invalid', c])

			if (c === '{')
				return goto (DECLS, ['end-prelude'], ['start-body', c])

		break

		// case QRULE_BODY: // Replaced with 'DECLS'
		//  if (c === '}' || c === 'eof')
		//    return pop (['end-body'], ['end-qrule'])
		//  break

    // DECL_VALUE. NB this is assumed to be used only in a context of DECLS, 
    //  hence the ';', 'eof' and '}' handling

		case DECL_VALUE:
			if (c === ';' || c === 'eof' || (c === '}' && (_reuse = true))) 
				return goto (DECLS, ['end-value'], ['end-decl']) // FIXME: for !important, we need to buffer
		break

		case DECL_INVALID:
			if (c === ';' || c === 'eof' || (c === '}' && (_reuse = true)))
				return goto (DECLS, ['end-decl-invalid'])
		break

		case ATRULE: // has { name, prelude, ?body }
			if (c === ';' || c === 'eof')
				return pop (['end-prelude'], ['end-atrule', c])
			if (c === '{')
				return goto (ATRULE_BODY, ['end-prelude'], ['start-body', c])
		break

		case ATRULE_BODY:
			if (c === '}' || c === 'eof')
				return pop (['end-body', c], ['end-atrule'])
		break

		case BRACES:
			if (c === '}' || c === 'eof')
				return pop (['end-braces', c])
    break

		case BRACKS:
			if (c === ']' || c === 'eof')
				return pop (['end-bracks', c])
    break

		case PARENS:
			if (c === ')' || c === 'eof')
				return pop (['end-parens', c])
    break

		case FUNC:
			if (c === ')' || c === 'eof')
				return pop (['end-function', c])
    break

		case DONE:
			return goto (q, ['eof', ''])
			//throw new SyntaxError ('Trying to read beyond end of token stream. ')
	}

	// if we did not return yet, continue to parse a component value
	if (c === '(')
		return push (PARENS, ['start-parens', c])

	if (c === '[')
		return push (BRACKS, ['start-bracks', c])

	if (c === '{')
		return push (BRACES, ['start-braces', c])

	if (c === 'func')
		return push (FUNC, ['start-function', tok[1]])

	else return goto (q, tok) 
}

/* end Parser */
}

module.exports = LazyParser
})();