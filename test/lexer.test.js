const { tokenize } = require ('../src/lexer')
const log = console.log.bind (console)

//var sample = '#bla { key1: two; key2: x } .boo { boo: bla }'
var samples = require ('./samples')

for (let sample of samples) {
  
  var stream = tokenize (sample)
  log (stream.state)
  for (let token of stream) {
    log (token)
    log (stream.state)
  }

}