const tokens = require ('./parser').tokens
const log = console.log.bind (console)
module.exports = { TreeBuilder }

// Idea is to consume the token stream from the parser and build a tree,
// simply. This is almost boilerplate, so it would be quite nice to make
// some small changes to the tokens and mostly derive this instead. 
// Yes I want to do that once this works. 

const VALUE = 1
const TYPE = 0
const T = tokens

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
  this.valid = true
}

function Dimension () {
  this.value = 0
  this.unit
}

function Percentage () {
  this.value = 0
  this.unit = '%'
}

function Group (type) {
  this.type = type
  this.body = []
}

function Comment (value) {
  this.value = value
}

function Ident (type) {
  this.value = ''
}

function Hash (id_flag) {
  this.value = ''
  this.isId = id_flag
}

function At () {
  this.value = ''
}

function _ident (type) {
  return type === T.hash_start ? new Hash (false)
    : type === T.hashid_start ? new Hash (true)
    : type === T.at_start ? new At ()
    : new Ident ()
}


// The actual TreeBuilder - 
//  a (parser-) tokenStream reducer

function TreeBuilder () {
  this.tree = []
  this.stack = [this.tree]
  this._chars = ''
}

TreeBuilder.prototype.write = function (token) {
  const stack = this.stack
  let top = stack [stack.length-1]
  //log (token, top)

  switch (token [TYPE]) {

    // start tags

    case T.atrule_start: {
      const a = new AtRule (null)
      top.push (a)
      stack.push (a) }
    break

    case T.qrule_start: {
      const q = new QRule ()
      top.push (q)
      stack.push (q) }
    break

    case T.declaration_start: {
      const d = new Declaration (null)
      top.push (d)
      stack.push (d) }
    break

    case T.percentage_start: {
      const d = new Percentage ()
      top.push (d)
      stack.push (d) }
    break

    case T.dimension_start: {
      const d = new Dimension ()
      top.push (d)
      stack.push (d) }
    break

    case T.group_start: {
      const g = new Group (token [VALUE])
      top.push (g)
      stack.push (g.body) }
    break

    case T.at_start:
    case T.ident_start:
    case T.hash_start:
    case T.hashid_start: {
      const i = _ident (token [TYPE])
      top.push (i)
      stack.push (i) }
    break

    //case T.unit_start:
    //break

    case T.comment_start: {
      const c = new Comment ('')
      top.push (c)
      stack.push (c) }
    break

    case T.prelude_start:
      stack.push (top.prelude)
    break

    case T.body_start:
      stack.push (top.body)
    break

    case T.value_start:
      stack.push (top.value)
    break
    
    case T.name_start:
    case T.string_start:
      // this._chars = '' // done in _end
    break

    // end tags

    case T.atrule_end:
    case T.qrule_end:
    case T.prelude_end:
    case T.body_end:
    case T.value_end:
    case T.declaration_end:
    case T.dimension_end:
    case T.percentage_end:
    case T.group_end:
    case T.comment_end:
      stack.pop ()
    break

    case T.declaration_invalid:
      top.valid = false
    break

    case T.unit_end:
      top.unit = this._chars
      this._chars = ''
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

    case T.string_bad_end:
      // TODO: this should invalidate the parent construct
      top.push (this._chars)
      this._chars = ''
    break

    // content tags

    case T.comment_data:
      top.value += token [VALUE]
    break
    
    case T.number: {
      let v = parseFloat (token [VALUE], 10)
      if ((top instanceof Dimension) || (top instanceof Percentage))
        top.value = v
      else
        top.push (v) }
    break

    case T.ident_chars:
    case T.string_chars:
      this._chars += token [VALUE]
    break

    case T.escape_char:
      this._chars += token [VALUE] .substr (1)
    break
    
    case T.escape_hex:
      this._chars += String.fromCharCode (parseInt (token [VALUE] .substr (1), 16))
      // TODO: what about the encoding?
    break
    
    case T.space:
    case T.newline:
    case T.escape_eof:
    case T.ignore_newline:
    case T.hex_end:
      // ignore
    break
    
    case T.CDO:
    case T.CDC:
      // Ignore these in top-level stylesheet
      if (stack.length > 1 && Array.isArray (top))
        top.push (token)
    break

    // delim, delim_invalid, comma, semicolon, colon, column, op, group_badend:
    default:
      if (Array.isArray (top))
        top.push (token)
    break
  }
}

