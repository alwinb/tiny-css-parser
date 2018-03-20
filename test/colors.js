const Tokens = require ('../src/lexer')
  , h = require ('hyperscript')
  , fs = require ('fs')
  , Parser = require ('../src/parser')
  , cssTokens = Tokens.tokenize


const log = console.log.bind (console)

// Using the new iterator construct
// Yes, that's fine, but..
// beter yet to finally implement the composition nicely
// Streams, yet again

let sample
sample = fs.readFileSync (__dirname+'/style6.dpl', 'utf8')
sample = fs.readFileSync (__dirname+'/colors.css', 'utf8')

// Cool now, I want to make a lazy h function somehow, to do this well
// h ('pre', tokens (sample)

// FIXME funcs.. should have open paren in lexer still there?

process.stdout.write ('<style>')
process.stdout.write (fs.readFileSync (__dirname+'/colors.css', 'utf8'))
process.stdout.write ('</style>')

process.stdout.write ('<pre style="tab-size:2">')
 for (let token of cssTokens (sample))
   process.stdout.write (h('span', { class:token[0], title:token[0] }, token[1]).outerHTML )

process.exit (205)
