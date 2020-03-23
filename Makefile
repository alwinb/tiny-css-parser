.PHONY: all clean

files = browser.js index.js tiny-lexer.js lexer.js tokens.js parser.js tree-builder.js
sources = $(addprefix src/, $(files))

all: dist/tinycss.min.js

dist/tinycss.min.js: dist/ $(sources)
	@ echo "Making a minified browser bundle"
	@ browserify src/browser.js | terser -cm > dist/tinycss.min.js

dist/:
	@ echo "Creating dist/ directory"
	@ mkdir ./dist

clean:
	@ test -d dist/ && rm -r dist/ || exit 0

