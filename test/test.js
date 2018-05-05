"use strict"

const { tokenize, parse } = require ('../src')
  , { head, renderTokens, flush } = require ('./template')
  , fs = require ('fs')

const log = console.log.bind (console)

function compose (fn1, fn2, fn3, __) { 
  var fns = arguments
  return function (x) {
    for (let i = fns.length - 1; i >= 0; i--) x = fns [i] (x)
    return x } }


function map (fn) { return function* (obj) {
  for (let a of obj) yield fn (a) } }


// Test

const samples =
  [ ' @charset utf8; @me {} #12038, #-ai /*comm */ #uu \n "a string with es\\40capes and \' such \\\n indeed"'
  , '/* A string ended by a newline */\n "string ended\n yes indeed'
  , '/* Incorrect pairing */\npairing { one ( two } three ] four [ five ) [six, seven] ]  ) }'
  , '/* Operators and delimiters */\n |= =? ?* *= | || &| ~ ~= ='
  , '/* Escapes in ientifiers */\n one\\" two, thee\\fc0 four fi\\F0ve'
  , '/* Invalid delimiter */ some\\\nthing'
  , 'hello  \r\n {wo[r]ld} "badstring\n newline and "string with \\ff\n newline hex esc'
  , fs.readFileSync ('./data/style.dpl')
  , fs.readFileSync ('./data/style6.dpl')
  , fs.readFileSync ('./colors.css')
  ]

function info (stream) {
  return { line:stream.state.line, col:stream.state.position - stream.state.lineStart }
}

//let r = Math.random ()
//compose (flush, head ('file://'+__dirname+'/colors.css?'+r), map (renderTokens), map (tokenize)) (samples)


var sample = '@media blaa; one { foo:blaa; fee:haa } bee baa'
var sample = 'ab\\0c c { foo:bar; baz:paz; Boo;bah }'
var sample = 'prelude { @abc { foo:bar } asd; baz:paz; Boo;bah } }'
var sample = 'pre { @foo { baz { bar:poo } } }'

var test = tokenize (sample)
for (let t of test)
  log (t)

var stream = parse ('#menu { padding:0; margin:; display:block }')
log (stream.state)
for (var token of stream)
  console.log (token, stream.state)