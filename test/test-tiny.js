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
  [ ' @charset utf8; @me {} #12038, #-ai /*comm */ #uu tes[ bad} pairing) ting "a str\\40ing with \' a bad end " "uaabc\\'
  , '/* A string ended by a newline */\n "string ended\n yes indeed'
  , '/* Incorrect pairing */\npairing { one ( two } three ] four [ five ) [six, seven] ]  ) }'
  , '/* Operators and delimiters */\n |= =? ?* *= | || &| ~ ~= ='
  , fs.readFileSync ('./style.dpl')
  , fs.readFileSync ('./style6.dpl')
  , fs.readFileSync ('./colors.css')
  ]


function tokenize (input) {
  return new tinylex (grammar, 'main', { stack:[] }, input)
}

compose (flush, flatten, head ('colors.css?q'+Math.random()), map (renderTokens), map (tokenize)) (samples)
