const css = require ('../src')

// Example 1
var tree = css.parseTree ('#menu { padding:0; margin:0; display:block }')
console.log (tree)

// Example 2
var stream = css.parse ('#menu { padding:0; margin:0; display:block }')

for (var token of stream)
  console.log (token)

// Example 3
var stream = css.parse ('#menu { padding:0; margin:0; display:block }')

for (var token of stream)
  console.log (token, stream.state)
