var Lexer = require ('../src/lexer')
  , Parser = require ('../src/parser')
  , tokenize = Lexer.tokenize
  , fs = require ('fs')

//
// Sample input

var inp = ' @media .name & [asdf * true] { color:red /* ass */; background:rgba(1.2,.2,3); width:10px } asdkjas ads @-Abd #bcd < d '
var inp = ' @media print { .name & [asdf * true] { color:red /* ass */; { [ ( background:rgba(1.2,.2,3); width:10px } asdkjas ads @-Abd #bcd < d '
var inp = ' { color : red b ; ;; @bla foo {asdasd sdk 3 43 } } /* ass */; { [ background:rgba(1.2,.2,3); width:10px ] } asdkjas ads @-Abd #bcd < d '
var inp = ' rgba(asd {ef} gh) '
var inp = ' a { rgba(asd {ef} gh) }'
var inp = ' a { foo bar asdf: rgba(asd {ef} gh) blue red s-attr(bah); #asd:pink } b { s-atrr-bla:none }'
var inp = fs.readFileSync(__dirname+'/style6.dpl', 'utf8')


// Example: Using lexer

var log = console.log.bind (console)

for (var tok of tokenize (inp)) {
  //log (tokens.position)
  log (tok)
}

// console.log('Test lexer\n==========')
// console.log(inp)
// console.log(out)
// console.log('idempotency check ' + (inp === out ? 'passed' : 'failed'))
// console.log(toks)
// console.log('====')


//
// Example: Using 'Parser'

var p = new Parser (new Lexer (inp))
//var p = Processor (p)

var toks = [],
  tok
do {
  toks.push(tok = p.next())
}
while (tok[1][0] !== 'end-stylesheet')

function fn(t) {
  if (t[1][0] === 'func' || t[1][0] === 'start-function')
    return t[1][1] + '('
  else if (t[1][0] === 'end-function')
    return ')'
  else return t[1][1]
}

console.log(toks, toks.map(fn).join(''))
//console.log(JSON.stringify(p.get(), null, 2))




