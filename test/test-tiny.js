"use strict"

const tinylex = require ('../src/tiny-lexer')
  , grammar = require ('../src/grammar')
  , { head, renderTokens, flush, flatten } = require ('./template')
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
// ====

const samples =
  [ ' @charset utf8; @me {} #12038, #-ai /*comm */ #uu \n "a string with es\\40capes and \' such \\\n indeed"'
  , '/* A string ended by a newline */\n "string ended\n yes indeed'
  , '/* Incorrect pairing */\npairing { one ( two } three ] four [ five ) [six, seven] ]  ) }'
  , '/* Operators and delimiters */\n |= =? ?* *= | || &| ~ ~= ='
  , '/* Escapes in ientifiers */\n one\\" two, thee\\fc0 four fi\\F0ve'
  , '/* Invalid delimiter */ some\\\nthing'
  , fs.readFileSync ('./data/style.dpl')
  , fs.readFileSync ('./data/style6.dpl')
  , fs.readFileSync ('./colors.css')
  ]


function tokenize (input) {
  return new tinylex (grammar, 'main', { lineStart:0, line:0, stack:[] }, input)
}

//compose (flush, flatten, head ('colors.css?q'+Math.random()), map (renderTokens), map (tokenize)) (samples)


var stream = tokenize ('hello  \r\n world "badstring\n newline and "string with \\ff\n newline hex esc')
for (var i of stream)
  log (i, stream.getState())