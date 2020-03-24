const { parse, parseTree, tokenize, tokens } = require ('../src')
const log = console.log.bind (console)

// Quick test

var samples = require ('./samples')
samples = ['{ width: 10px 2 10% 3 }']
samples = ['@media { booo } abcd @bd <!-- { width: 10px 2 10% 3 --> }']
samples = ['@page { margin:1cm; @top-center { color:red; } }']

// log(...parse('1px solid red, foo', 'DECL_VALUE'))
// log(...parseTree('1px solid red, foo', 'DECL_VALUE'))


samples.forEach (sample => {
  log (sample)
  let t = parse (sample)
  log (Array.from (t), sample)
  try {
    log (JSON.stringify (parseTree (sample), fn, 2))
  } catch (e) { log (e) }
})

function fn (k, o) {
  let r = o
  if (!Array.isArray (o) && typeof o === 'object') {
    return Object.assign ({ type: o.constructor.name }, r)
  }
  return r
}
