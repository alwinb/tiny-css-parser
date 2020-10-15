const { parse, tokens:T } = require ('./parser')
const { TreeBuilder } = require ('./generic-tree')
const { START, END } = TreeBuilder.constants
const log = console.log.bind (console)

// CSS Object model
// ----------------

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

function _ident ([type, value]) {
  return type === T.hash_start ? new Hash (false)
    : type === T.hashid_start ? new Hash (true)
    : type === T.at_start ? new At ()
    : new Ident ()
}

// Tree builder config for CSS Object Model
// ----------------------------------------

// Try it on the css using a quick transformer on the tokens
// to extract START/ END markers

function tokenInfo (token) {
  const chunks = token[0].split('-')
    , type = chunks[0]
    , tag = chunks.pop ()
  if (tag === 'start') return [START, type]
  if (tag === 'end') return [END, type]
  return [null, token[0]]
}

const tset = (n, [t, v]) => {
  // log ('tset', {n, t, v})
  if (t in n) n[t] = v
}

const handlers = {

  // Non-retained nodes
  percentage: { start:_ => new Percentage,  push:(n,[t,v]) => { if (t === 'number') n.value = v } },
  dimension:  { start:_ => new Dimension,   push:(n,[t,v]) => { if (t === 'number') n.value = v; else if (t === 'unit') n[t] = v } },
  atrule:     { start:_ => new AtRule,      push:tset  },
  qrule:      { start:_ => new QRule,       push:tset  },
  decl:       { start:_ => new Declaration, push:tset  },
  prelude:    { start:_ => [] },
  body:       { start:_ => [] },
  value:      { start:_ => [] },

  // Retained nodes (for eval)
  number: { eval: s => +s  },
  ident:  { eval: ({start, content}) => { let r; return (r = _ident (start), r.value = content.join(''), r) } },
  name:   { eval: ({content}) => content.join ('') },
  unit:   { eval: ({content}) => content.join ('') },

  'ident-chars': { eval: cs => cs },
  'escape-hex':  { eval: _ => String.fromCodePoint (parseInt (_.substr(1), 16)) },
  'escape-hex-space': { eval: _ => ''  },
}

// Exports
// =======

module.exports = { tokenInfo, handlers }


// Test
// ----

/*// Sample
const util = require ('util')
var sample = 'foo @someAtIdent #someHashIdent { itemOne:values one two !important; declTwo:values "string-value" he\\240 e; }'
sample = '{ width: 10px 2 10% 3 he\\240 e }'
sample = '@media print { selector .bodyless qrule } #strange .selector [attr=foo] @atIdent <!-- { width: 10px 2 10% 3 --> }'
// // sample = '@page { margin:1cm; @top-center { color:red; } }'

log (sample)
var tree = buildTree (sample, tokenInfo, handlers)
log (util.inspect (tree, { depth:Infinity }))
//*/
