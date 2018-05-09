const tokens = require ('./parser').tokens
const log = console.log.bind (console)
module.exports = { TreeBuilder }

// Work in progress

// Idea is to consume the token stream from the parser and build a tree,
// simply. This is almost boilerplate, so it would be quite nice to make
// some small changes to the tokens and mostly derive this instead. 
// Yes I want to do that once this works. 

// TODO
// - [ ] parser error on bodyless qrule
// - [ ] handle invalid declarations

// FIXME
// - [ ] let '{ ... }' be parsed as a Qrule with empty prelude?
// - [ ] incorrect parse of 'foo { bla bar }'
// - [ ] incorrect body on '@media print { foo }' 


const VALUE = 1
const TYPE = 0

function AtRule (name) {
  this.name = name
  this.prelude = []
  this.body = []
}

function QRule () {
  this.prelude = []
  this.body = []
}

function Declaration (name) {
  this.name = name
  this.value = []
}

function Group (type) {
  this.type = type
  this.body = []
}

function Comment (value) {
  this.value = value
}

function Ident (type) {
  this.type = type
  this.value = ''
}


// The actual TreeBuilder - 
//  a (parser-) tokenStream reducer

function TreeBuilder () {
  this.tree = []
  this.stack = [this.tree]
  this._type = null
  this._chars = ''
}

const T = tokens

TreeBuilder.prototype.step = function (token) {
  const stack = this.stack
  let top = stack [stack.length-1]
  // log (token, top)

  switch (token [TYPE]) {

    // start tags

    case T.atrule_start: {
      const a = new AtRule ('')
      top.push (a)
      stack.push (a) }
    break

    case T.qrule_start: {
      const q = new QRule ()
      top.push (q)
      stack.push (q) }
    break

    case T.prelude_start:
      stack.push (top.prelude)
    break

    case T.body_start:
      stack.push (top.body)
    break

    case T.declaration_start: {
      const d = new Declaration ('')
      top.push (d)
      stack.push (d) }
    break

    case T.value_start:
      stack.push (top.value)
    break

    case T.group_start:
      stack.push (new Group (token [VALUE]))
    break

    case T.name_start:
    case T.string_start:
      this._type = token [TYPE]
    break

    case T.hash_start:
    case T.hashid_start:
    case T.ident_start: {
      const i = new Ident (token [TYPE])
      top.push (i)
      stack.push (i)
    }
    break

    case T.comment_start: {
      const c = new Comment ('')
      top.push (c)
      stack.push (c) }
    break
    
    // end tags

    case T.atrule_end:
    case T.qrule_end:
    case T.prelude_end:
    case T.body_end:
    case T.value_end:
    case T.declaration_end:
    case T.group_end:
      stack.pop ()
    break

    case T.ident_end:
      top.value = this._chars
      this._chars = ''
      stack.pop ()
    break

    case T.name_end:
      // emitted inside at-rules and for declarations
      top.name = this._chars
      this._chars = ''
    break

    case T.string_end:
      top.push (this._chars)
      this._chars = ''
    break

    case T.string_end_bad:
      top.push (this._chars)
      this._chars = ''
      // TODO mark as invalid?
    break

    case T.declaration_end_invalid:
      // TODO decide: mark current decl as invalid, or drop it?
      stack.pop ()
    break

    // content tags

    case T.comment_chars:
      top.value += token [VALUE]
    break
    
    case T.number:
      top.push (parseFloat (token [VALUE], 10))
      // TODO is this ok? Does parseFloat _always_ work on number tokens?
    break

    case T.ident_chars:
    case T.string_chars:
      this._chars += token [VALUE]
    break

    // TODO
    // escape_char:
    // escape_hex:
    // hex_end:

    case T.space:
    case T.newline:
    case T.escape_eof:
    case T.ignore_newline:
      // ignore
    break
    
    // CDC:
    // CDO:
    // delim:
    // delim_invalid:
    // comma:
    // semicolon:
    // colon:
    // column:
    // op:
    // group_badend:
    default:
      if (Array.isArray (top)) // TODO careful
        top.push (token)
    break
  }
}
