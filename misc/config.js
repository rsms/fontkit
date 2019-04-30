#!/usr/bin/env node
const { project } = require('./ninjagen')
const { ASCIITable } = require('./asciitable')
const Path = require('path')
const fs = require('fs')
// -----------------------------------------------------------

// FontKit source files (src/fontkit/...)
const fkSourceFiles = `
*.c
`

// Freetype source files (freetype/src/...)
// Note: Extensions must match registration in freetype/ftmodule.h
const ftSourceFiles = `
base/ftadvanc.c
base/ftbitmap.c
base/ftcalc.c
base/ftgloadr.c
base/fthash.c
base/ftinit.c
base/ftmm.c
base/ftobjs.c
base/ftoutln.c
base/ftrfork.c
base/ftstream.c
base/ftsystem.c
base/fttrigon.c
base/ftutil.c
base/ftsnames.c
base/fttype1.c
base/ftfntfmt.c
base/ftpsprop.c
base/ftlcdfil.c

truetype/truetype.c
cff/cff.c
sfnt/sfnt.c
type1/type1.c
psaux/psaux.c
psnames/psnames.c
otvalid/otvalid.c
gxvalid/gxvalid.c
gzip/ftgzip.c
`
// Disabled FT modules:
//
// pshinter/pshinter.c
// autofit/autofit.c
// bdf/bdf.c          BDF driver
// pcf/pcf.c          PCF driver
// pfr/pfr.c          PFR driver
// winfonts/winfnt.c  Windows FNT/FON driver
// lzw/ftlzw.c
// cache/ftcache.c


// Harfbuzz source files (src/harfbuzz/src/...)
const hbSourceFiles = `
*.cc
hb-ucdn/*.c
`

// -----------------------------------------------------------

const argv = process.argv

const opts = {
  debug: !argv.includes('-O'),
  help: argv.includes('-h') || argv.includes('-help'),
  pretty: argv.includes('-pretty'),
  write_if_changed: argv.includes('-write-if-changed'),
}

if (opts.help) {
  const prog = 
  // docker run --rm -v "$PWD:/src" rsms/emsdk ninja
  console.error(`

  Configure build
  usage: %s [-O | -help]
    -O                  Enable optimizations
    -h, -help           Show help message and exit
    -pretty             Generate pretty code i/c/w -O
    -write-if-changed   Only write changes if things actually changed

    `.trim().replace(/^\s{2}/gm, ''),
    process.env['_'] || argv[1]
  )
  process.exit(1)
}


// Ninja project
const outdir = opts.debug ? 'build/debug' : 'build/release'
const p = project(Path.dirname(__dirname), outdir)
p.generator = p.filepath(__filename)

// vars
p.vars.set('cc', 'emcc')
p.vars.set('wasmc', p.filepath('misc/wasmc'))

// General c flags
p.cflag(
  '-fno-rtti',
  '-fno-exceptions',
  '-ftemplate-backtrace-limit=0',
  '-Wall',
  '-Wno-shorten-64-to-32',
  '-Wno-unused-function',
  '-Wno-unused-parameter',
  '-Wno-unused-variable',
  '-Wno-null-conversion',
  '-Wno-c++11-extensions',
  // '-Wshadow',
  '-Wtautological-compare',

  // enabled ANSI color output when attached to a TTY
  '-fcolor-diagnostics',
)

// Emscripten, ASM.JS, and WASM
p.cflag(
  '--llvm-lto', '0',
  '--llvm-opts', '2',
  '-s', 'WASM=1',
  '-s', 'NO_EXIT_RUNTIME=1',
  '-s', 'NO_FILESYSTEM=1',
  '-s', 'ABORTING_MALLOC=0',
  '-s', 'ALLOW_MEMORY_GROWTH=1',
  '-s', 'DISABLE_EXCEPTION_CATCHING=1',
  '-s', 'ERROR_ON_UNDEFINED_SYMBOLS=1',
  '-s', 'BINARYEN_TRAP_MODE="clamp"',
)

// Debug build?
if (opts.debug) {
  p.cflag(
    '-O0',
    '-g',
    '-s', 'DEMANGLE_SUPPORT=1',
  )
  p.appendVar('wasmc_flags', '-g')
} else {
  p.cflag(
    '-Os',
    '-DNDEBUG',
  )
  if (opts.pretty) {
    p.appendVar('wasmc_flags', '-pretty')
  }
}

function parsefilenames(text, basedir) {
  return text.trim().split(/[\s\n]+/m).map(s => `${basedir}/${s}`)
}

// Freetype
const freetype = p.clib('freetype',
  parsefilenames(ftSourceFiles, 'src/freetype/src'),
  [ // cflags
    '-DFT2_BUILD_LIBRARY',
    '-Isrc/freetype/include'
  ]
)

// harfbuzz
const harfbuzz = p.clib('harfbuzz',
  parsefilenames(hbSourceFiles, `src/harfbuzz/src`),
  [ // cflags
    '-DHAVE_OT=1',
    '-DHAVE_UCDN',
    '-DHB_NO_MT=1',
    '-Isrc/harfbuzz/src',
    '-Isrc/harfbuzz/src/hb-ucdn',
    '-Isrc/freetype/include',
  ],
)

// fontkit
let cflags = [
  '-Isrc/freetype/include',
  '-Isrc/harfbuzz/src',
]
const fontkit = p.clib('fontkit',
  parsefilenames(fkSourceFiles, `src/fontkit`),
  cflags
)


// products
p.wasm(
  'fontkit',
  '$outdir/fontkit.js',
  'src/fontkit/fontkit.js',
  [fontkit, freetype, harfbuzz, 'src/fontkit/fk*.js'],
)


// Write ninja file
if (p.generate(opts.write_if_changed)) {
  console.log(`wrote %o`, p.ninjafile)
  console.log(`mode: ${opts.debug ? 'debug' : 'release'}`)
}
