const { parse, parseTree, tokenize, tokens } = require ('../src')
const log = console.log.bind (console)

// Quick test

const fs = require ('fs')
var samples =
  [ '#bla { key1: two; key2: x } .boo { boo: bla }'
  , '@media print { foo {} }'
  , '@media print { foo }'
  , '@media print { @foo bar }'
  , 'media { foo:bar; }'
  , '{ foo }'
  , '#bla { "key1": two; key2: x }'
  , ' @charset utf8; @me {} #12038, #-ai /*comm */ #uu \n "a string with es\\40capes and \' such \\\n indeed"'
  , '/* A string ended by a newline */\n "string ended\n yes indeed'
  , '/* Incorrect pairing */\npairing { one ( two } three ] four [ five ) [six, seven] ]  ) }'
  , '/* Operators and delimiters */\n |= =? ?* *= | || &| ~ ~= ='
  , '/* Invalid delimiter */ some\\\nthing'
  , 'hello  \r\n "badstring\n newline and "string with \\ff\n newline hex esc'
  , 'hello {wo]r]ld}'
  , 'hello {wo{r}ld}'
  , fs.readFileSync ('../test/colors.css')
  ]

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



