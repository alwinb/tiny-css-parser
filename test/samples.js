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
  , fs.readFileSync ('../test/style/tokens.css')
  ]

module.exports = samples