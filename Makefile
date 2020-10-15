.PHONY: all clean

files = browser.js generic-tree.js index.js lexer.js parser.js tiny-lexer.js tokens.js tree-builder.js
sources = $(addprefix src/, $(files))

all: dist/tinycss.min.js

dist/tinycss.min.js: dist/ $(sources)
	@ echo "Making a minified browser bundle"
	@ browserify src/browser.js | terser -cm > dist/tinycss.min.js

dist/:
	@ echo "Creating dist/ directory"
	@ mkdir ./dist

clean:
	@ echo "Removing dist/ directory"
	@ test -d dist/ && rm -r dist/ || exit 0

