const log = console.log.bind (console)

const START = 'start'
const END = 'end'

function start (type, value) {
  return { tag:START, type:type, value:value }
}

function end (type, value) {
  return { tag:END, type:type, value:value }
}

function Node (type) {
  this.type = type
  this.start = null
  this.content = []
  this.end = null
}

// Tree builder
// Reduces a sequence of start/end/other tokens to a tree. 
// Assumes that the itrable has balanced start and end tags. 

function TreeBuilder (fn) {
  this.root = new Node ('#root')
  const stack = [this.root]
  this.write = write

  function write (token) {
    let brace = fn (token)
    if (brace && brace.tag === START) {
      let node = new Node (brace.type)
      node.start = token
      stack [stack.length-1].content.push (node)
      stack.push (node)
    }

    else if (brace && brace.tag === END) {
      // TODO should we check mismatches?
      // TODO replace the top of the stack/content with its evalled version
      let node = stack.pop ()
      node.end = token
    }

    else
      stack[stack.length-1].content.push (token)
  }
}

function buildTree (iterable) {
  const builder = new TreeBuilder (_ => _)
  for (let x of iterable)
    builder.write (x)
  return builder.root
}


//
// Test
/*

function token (type, value) {
  return [type, value]
}

var tokens = [start('foo'), token ('string', 'asdff'), start ('bar'), token ('asdf'), end ('bar'), token('foo')]
var tree = buildTree (tokens)

log (JSON.stringify(tree.content[0], null, 2))

//*/

// Aallllright, excellent
// Now.. try it on the css using a quick transformer on the tokens
// to add start/end values

function brace (token) {
  const chunks = token[0].split('-')
    , type = chunks[0]
    , tag = chunks.pop ()
  if (tag === 'start')
    return start (type, token[1])
  if (tag === 'end')
    return end (type, token[1])
}


let parse = require ('./').parse
function buildTree (iterable) {
  const builder = new TreeBuilder (brace)
  for (let x of iterable)
    builder.write (x)
  return builder.root
}


var sample = 'foo @bar { baz:bee; he:he\\ae e; }'

function str (o) {
  return JSON.stringify (o, null , 2)
}

log (str (buildTree (parse (sample)).content))

// Excellent
// Now... add the algebraic interpretation










