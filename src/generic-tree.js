"use strict";
const log = console.log.bind (console)

// Generic Tree builder
// =====================

// Generic Tree node

class Node {
  constructor (type, start = null) {
    Object.defineProperty (this, 'type', { value:type, enumerable:false })
    this.start = start
    this.content = []
    this.end = null
  }
  get [Symbol.toStringTag] () {
    return this.type
  }
}

// START/ END markers

const START = Symbol ('START')
const END = Symbol ('END')
TreeBuilder.constants = { START, END }

// The TreeBuilder (closure-based class)
// This is quite nice, it actually pairs each token with its evaluation.
// It would be nice to expose that pairing in an output stream :)

function TreeBuilder (tokenInfo, handlers = { }) {
  const root = new Node ('#root')
  const stack = [['#root', root]]

  Object.defineProperties (this, { write: { value:write }, root: { value:root }})
  return this

  function write (token) {
    // log ({ root })
    // log (stack.map ( _ => _.type ), 'write', token)

    const [tag, nodeType] = tokenInfo (token)
    const handler = handlers [nodeType] || { }

    if (tag === START) { // log ('open', { nodeType, token })
      const node = handler.start ? handler.start (nodeType, token) : new Node (nodeType, token)
      stack.unshift ([nodeType, node])
      if (!handler.eval)
        _push (stack[1], stack[0]) // Incremental construction possible
    }

    else if (tag === END) { // log ('close', { nodeType, token })
      const [_,node] = stack.shift ()
      if (node instanceof Node) node.end = token
      else if (handler.end) handler.end (node, token) // REVIEW (as of yet, unused)
      if (handler.eval)
        _push (stack[0], [nodeType, handler.eval (node)]) // Node was retained
    }

    else { // log ('leaf', { token })
      const [type] = token
      const handler = handlers [type] || { }
      const result = handler.eval ? [type, handler.eval (token[1])] : [type, token]
      _push (stack[0], result)
    }
  }

  function _push ([nodeType, node], [type, item]) {
    if (type === 'space') return // TODO can we ignore in a less verbose way than in push everywhere?
    const handler = (handlers[nodeType]||{})
    // log ('push', { handler, nodeType, node, type, item })
    if (handler.push)
      handler.push (node, [type, item])
    else if (node instanceof Node)
      node.content.push (item)
    else if (node instanceof Array)
      node.push (item)
    else {
      log ('Err', { nodeType, node, item })
      throw new Error (`push: don't know how to push to ${node.constructor.name}'`)
    }
  }

}

// Exports
// -------

module.exports = { Node, TreeBuilder }