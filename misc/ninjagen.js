//
// ninjagen
//
// Generates Ninja build files
//

// -- begin inlined miniglob (https://github.com/rsms/js-miniglob) --
const glob = ((exports => {
!function(t,e){"object"==typeof exports&&"undefined"!=typeof module?e(exports):
"function"==typeof define&&define.amd?define(["exports"],e):e(t.miniglob={})}
(this,function(t){"use strict";const{readdirSync:e,statSync:r}=require("fs"),
n=(()=>{try{return require("path").sep}catch(t){return"/"}})(),o=n.charCodeAt(0),
s=":"==n?/\:+/g:"\\"==n?/\\+/g:/\/+/g,u="win32"==process.platform;
class c extends Error{constructor(){super("bad pattern")}}const i=u?t=>{
if(t.length<2)return 0;let e=t[0];return":"==t[1]&&("a"<=e&&e<="z"||"A"<=e&&
e<="Z")?2:0}:t=>0,l=u?(t,e)=>{const r=e(t);return""==t?[0,"."]:r+1==t.length&&
h(t,t.length-1)?[r+1,t]:r==t.length&&2==t.length?[r,t+"."]:(r>=t.length&&
(r=t.length-1),[r,t.substr(0,t.length-1)])}:(t,e)=>""==t?[e,"."]:t==n?[e,t]:
[e,t.substr(0,t.length-1)];function h(t,e){return t.charCodeAt(e)===o}
function f(t,u){t=function(t){let e=t.length-1,r=e;for(;r&&t.charCodeAt(r)===o;
)--r;r!=e&&(t=t.substr(0,r+1));return t.split(s).join(n)}(t);let c=r(t);
c.isDirectory()&&function t(r,n,o){for(let s of e(r)){let e=k(r,s),u=y(e),
c=n(e,u);(c||void 0===c)&&u&&u.isDirectory()&&!o.has(u.ino)&&(o.add(u.ino),
t(e,n,o))}}(t,u,new Set([c.ino]))}function a(t){let e=[];if(!g(t))
return y(t)?[t]:e;let r=i(t),n=t.length-1;for(;n>=r&&!h(t,n);)n--;
let o=t.substr(0,n+1),s=t.substr(n+1);if([r,o]=l(o,r),g(o.substr(r))){if(o==t)
throw new c;const r=a(o);for(let t of r)d(t,s,e)}else d(o,s,e);return e}
function d(t,r,n){const o=y(t);if(null===o)return;if(!o.isDirectory())return;
let s;try{s=e(t)}catch(t){return}s.sort();for(let e of s)A(r,e)&&
n.push(k(t,e))}function g(t){for(let e=0;e<t.length;++e)switch(t.charCodeAt(e))
{case 42:case 63:case 91:case 123:return!0}return!1}function b(t,e){for(
let r=0;r<t.length;++r)if(t.charCodeAt(r)===e)return!0;return!1}
function A(t,e){t:for(;t.length>0;){let r=!1,n="";if([r,n,t]=C(t),r&&""==n)
return!b(e,o);let[s,u]=w(n,e);if(!u||!(0==s.length||t.length>0)){if(r)for(
let r=0;r<e.length&&e.charCodeAt(r)!=o;r++)if([s,u]=w(n,e.substr(r+1)),u){
if(0==t.length&&s.length>0)continue;e=s;continue t}return!1}e=s}
return 0==e.length}function C(t){let e=!1;for(;t.length>0&&42==t.charCodeAt(0);
)t=t.substr(1),e=!0;let r=!1,n=0;t:for(;n<t.length;n++)switch(t.charCodeAt(n)){
case 92:u||n+1<t.length&&n++;break;case 91:r=!0;break;case 93:r=!1;break;
case 42:if(!r)break t}return[e,t.substr(0,n),t.substr(n)]}function w(t,e){
for(;t.length>0;){if(0==e.length)return["",!1];switch(t.charCodeAt(0)){
case 91:{let r=e.codePointAt(0),n=r<=65535?1:2;if(e=e.substr(n),t=t.substr(1),
r.toString(16),0==t.length)throw new c;let o=94==t.charCodeAt(0);o&&
(t=t.substr(1));let s=!1,u=0;for(;;){if(t.length>0&&93==t.charCodeAt(0)&&
u>0){t=t.substr(1);break}let e,n;if([n,t,e]=p(t),!e)return["",!1];let o=n;
if(45==t.charCodeAt(0)&&([o,t,e]=p(t.substr(1)),!e))return["",!1];n<=r&&r<=o&&
(s=!0),u++}if(s==o)return["",!1];break}case 63:if(e.charCodeAt(0)==o)
return["",!1];let r=e.codePointAt(0)<=65535?1:2;e=e.substr(r),t=t.substr(1);
break;case 92:if(!u&&0==(t=t.substr(1)).length)throw new c;default:if(
t.charCodeAt(0)!=e.charCodeAt(0))return t[0],e[0],t.charCodeAt(0).toString(16),
e.charCodeAt(0).toString(16),["",!1];e=e.substr(1),t=t.substr(1)}}return[e,!0]}
function p(t){let e=0,r="",n=t.charCodeAt(0);if(0==t.length||45==n||93==n)
throw new c;if(92==n&&!u&&0==(t=t.substr(1)).length)throw new c;let o=(
e=t.codePointAt(0))<=65535?1:2;if(65535==e&&1==o)throw new c;if(0==(
r=t.substr(o)).length)throw new c;return[e,r,!0]}function y(t){try{return r(t)}
catch(t){}return null}function k(t,e){return"."==t||""==t?e:t+n+e}
t.PatternError=c,t.glob=function(t){if(t.indexOf("**")<0)return a(t);
let e=[],s=new Set;return function t(e,s,u,c,i){u>=s.length&&(u=s.length-1);
let l=s[u],h=l;function d(t){return!i.has(t)&&(i.add(t),!0)}function g(t){
let e=t,r=e.lastIndexOf(n);-1!=r&&(e=e.substr(r+1));let i=Math.min(u+1,
s.length-1),l=s.slice(i).join("*");l.charCodeAt(0)==o?l=function(t){let e=0;
for(;t.charCodeAt(e)===o;)e++;return 0!=e?t.substr(e):t}(l):"*"!=l[0]&&
(l="*"+l),A(l,e)&&c.push(t)}0===u?l.charCodeAt(l.length-1)!=o&&(h+="*"):
u===s.length-1?l.charCodeAt(0)!=o&&(h="*"+h):(l.charCodeAt(0)!=o&&(h="*"+h),
l.charCodeAt(l.length-1)!=o&&(h+="*")),e&&(h=h[0]!=n?e+n+h:e+h);let b=!1;
h.charCodeAt(h.length-1)===o&&(b=!0,h=function(t){let e=t.length-1,r=e;for(;
t.charCodeAt(r)===o;)r--;return r!=e?t.substr(0,r+1):t}(h));let C=a(h);for(
let e of C){let n=r(e);n.isDirectory()?d(e)&&f(e,(e,r)=>{d(e)&&(r.isDirectory()
?t(e,s,u+1,c,i):g(e))}):!b&&d(e)&&g(e)}return c}("",t.split(/\*{2,}/),0,e,s),
e},t.match=A,Object.defineProperty(t,"__esModule",{value:!0})});
return exports})({})).glob
// -- end inlined miniglob --

const fs = require('fs')
const {
  join: joinpath,
  relative: relpath,
  dirname,
  basename,
  extname,
  sep: dirsep,
  isAbsolute: isabspath,
} = require('path')

if (typeof exports == 'undefined') { exports = (this['ninjagen'] = {}) }


class NinjaRule { constructor(name, command, meta) {
  this.name = name
  this.command = command
  this.meta = meta }
}

exports.NinjaRule = NinjaRule


class NinjaProduct { constructor(name, file, deps, cflags) {
  this.name = name
  this.file = file
  this.deps = deps
  this.cflags = cflags ? Array.from(cflags) : null }
}

exports.NinjaProduct = NinjaProduct


class NinjaWasmProduct extends NinjaProduct { constructor(jswrapper, ...rest) {
  super(...rest)
  this.jswrapper = jswrapper }
}

exports.NinjaWasmProduct = NinjaWasmProduct


class NinjaCLib { constructor(name, files, cflags) {
  this.name = name
  this.files = files
  this._sourcefiles = null // lazy-initialized
  this.cflags = cflags ? Array.from(cflags) : null }

  sourceFiles() {
    if (this._sourcefiles === null) {
      this._sourcefiles = globv(this.files)
    }
    return this._sourcefiles
  }
}

exports.NinjaCLib = NinjaCLib


class NinjaWriter { constructor(ninjafile, outdir, ninjaversion) {
  this.ninjafile = ninjafile
  this.ninjafiledir = dirname(ninjafile)
  this.outdir = relpath(this.ninjafiledir, outdir)
  this.ninjaversion = ninjaversion
  this.cflags = [] // string[]
  this.products = new Map() // Map<string,NinjaProduct> (name => obj)
  this.rules = new Map() // Map<string,NinjaRule> (name => obj)
  this.vars = new Map([
    ['outdir', this.outdir],
    ['cc', 'cc'],
  ])
  this.configdeps = new Set() // Set<string> (filename)
  this.defaultTargets = []
  this.generator = '' }


  cflag(...flags) {
    this.cflags = this.cflags.concat(flags)
  }


  clib(name, files, cflags) {
    return new NinjaCLib(name, files, cflags)
  }


  wasm(name, file, jswrapper, deps, cflags) {
    jswrapper = this.filepath(jswrapper)
    let p = new NinjaWasmProduct(jswrapper, name, file, deps, cflags)
    return this.addProduct(p)
  }

  appendVar(name, value) {
    let v = this.vars.get(name)
    this.vars.set(name, v ? ' ' + v + value : value)
  }


  addProduct(product) {
    if (this.products.has(product.name)) {
      throw new Error(`duplicate product "${product.name}"`)
    }
    this.products.set(product.name, product)
    return product
  }


  removeProduct(product) {
    let name = typeof product != 'string' ? product.name : product
    if (!this.products.delete(name)) {
      throw new Error(`unknown product "${name}"`)
    }
  }


  rule(name, command, meta) {
    let rule = new NinjaRule(name, command, meta)
    this.rules.set(name, rule)
    return rule
  }


  removeRule(rule) {
    let name = typeof rule != 'string' ? rule.name : rule
    if (!this.rules.delete(name)) {
      throw new Error(`unknown rule "${name}"`)
    }
  }


  filepath(filename) {
    let relfile = relpath(this.ninjafiledir, filename)
    if (relfile.startsWith('../')) {
      return filename
    }
    // inside (and relative to) project directory
    return relfile
  }


  configdep(...files) {
    for (let file of files) {
      this.configdeps.add(this.filepath(file))
    }
  }


  // generate(onlyWriteIfChanged? :boolean) : bool (wrote)
  generate(onlyWriteIfChanged) {
    let s = []
    const w = str => s.push(str)

    this.genHeader(w)
    this.genRules(w)

    let deps = this.resolveUsedDeps()
    let objfiles = this.genSourceObjects(w, deps)

    this.genProducts(w, objfiles)

    // implicit deps
    // w(`build $outdir/obj: mkdirs\n\n`)

    this.genConfigDeps(w)

    // default targets
    let defaultTargets = this.getDefaultTargets()
    if (defaultTargets.length > 0) {
      w(`default ${defaultTargets.join(' ')}\n`)
    }

    let str = s.join('')

    if (onlyWriteIfChanged) {
      try {
        let existingStr = fs.readFileSync(this.ninjafile, 'utf8')
        if (str === existingStr) {
          // skip writing -- already up to date
          return false
        }
      } catch(_) {}
    }

    fs.writeFileSync(this.ninjafile, str, 'utf8')
    return true
  }


  // ------ internal functions -------


  getDefaultTargets() {
    if (this.defaultTargets && this.defaultTargets.length > 0) {
      return this.defaultTargets.map(p => (
        p && typeof p.name == 'string' ? p.name : String(p)
      ))
    }
    return Array.from(this.products.keys())
  }


  genConfigDeps(w) {
    if (this.generator) {
      w(`build ${this.ninjafile}: configure |`)
      w(` $\n  ${this.generator}`)
      for (let file of this.configdeps) {
        // build build.ninja: configure | configure.py misc/ninja_syntax.py
        w(` $\n  ${file}`)
      }
      w(`\n\n`)
    } else if (this.configdeps.size > 0) {
      throw new Error('configdeps but not generator configured')
    }
  }


  genHeader(w) {
    w(`ninja_required_version = ${this.ninjaversion}\n\n`)

    if (!this.rules.has('wasmc') && this.hasWasmProducts()) {
      if (!this.vars.has('wasmc')) {
        logwarn('missing $wasmc in vars -- setting to "wasmc"')
        this.vars.set('wasmc', 'wasmc')
      } /*else {
        let wasmc = this.vars.get('wasmc')
        this.configdep(this.filepath(wasmc))
      }*/

      if (!this.vars.has('wasmc_flags')) {
        this.vars.set('wasmc_flags', '')
      }
    }

    // vars
    if (this.vars.size > 0) {
      for (let [name, value] of this.vars) {
        w(`${name} = ${value}\n`)
      }
      w(`\n`)
    }
    let cflags = this.getCFlagsVar()
    if (cflags) {
      w(`cflags = ${cflags}\n\n`)
    }
  }


  fmtCFlags(cflags, indent) {
    if (indent === undefined) {
      indent = ''
    }
    let nextOnSameLine = false
    let sameLineFlags = new Set('-s --pre-js --post-js'.split(/\s+/))
    let s = ''
    for (let flag of cflags) {
      if (nextOnSameLine) {
        s += ` ${flag}`
        nextOnSameLine = false
      } else {
        s += ` $\n${indent}${flag}`
      }
      if (sameLineFlags.has(flag) || flag.startsWith('--llvm-')) {
        nextOnSameLine = true
      }
    }
    return s
  }


  getCFlagsVar() {
    let s = this.fmtCFlags(this.cflags, '  ')

    // incorporate any existing cflags var
    let explicit_cflags = this.vars.get('cflags')
    if (s && explicit_cflags) {
      s = '$cflags' + s
    }

    return s
  }


  genRules(w) {
    if (!this.rules.has('cc')) {
      this.rule('cc',
        '$cc -MMD -MF $out.d $cflags $in -o $out',
        {
          description: '$cc $out',
          depfile: '$out.d',
          deps: 'gcc', // 'msvc' for Visual Studio
        }
      )
    }

    if (this.generator) {
      let generatorProgram = this.generator
      if (!isabspath(generatorProgram) && process.platform != 'win32') {
        generatorProgram = './' + generatorProgram
      }
      this.rule(
        'configure',
        '${configure_env} ' + generatorProgram,
        {
          generator: '1',
        }
      )
    }

    if (!this.rules.has('cp')) {
      if (this.hasWasmProducts()) {
        this.rule('cp', 'cp -a $in $out')
      }
    }

    if (!this.rules.has('wasmc')) {
      if (this.hasWasmProducts()) {
        this.rule('wasmc', '$wasmc $wasmc_flags $in $out')
      }
    }

    // if (!this.rules.has('mkdirs')) {
    //   this.rule('mkdirs', 'mkdir -vp $out')
    // }

    for (let rule of this.rules.values()) {
      w(`rule ${rule.name}\n`)
      w(`  command = ${rule.command}\n`)
      if (rule.meta) for (let k in rule.meta) {
        w(`  ${k} = ${rule.meta[k]}\n`)
      }
      w(`\n`)
    }
  }


  objectFormat(rulename) {
    let rulenameVar = this.vars.get(rulename)
    if (rulenameVar == 'emcc' || rulenameVar == 'em++') {
      // Emscripten outputs LLVM IR bitcode
      return '.llvmbc'
    }
    return '.o'
  }


  genSourceObjects(w, deps) { // : Map<string,string> (srcfile => objfile)
    let objfiles = new Map()
    let objdir = '$outdir/obj'

    // dep sources
    for (let dep of deps) {
      if (dep instanceof NinjaProduct || typeof dep == 'string') {
        continue
      }

      w(`# [source -> object] ${dep.name}\n`)

      // body of the build rule
      let buildBody = []

      if (dep.cflags && dep.cflags.length > 0) {
        buildBody.push(`cflags = $${dep.name}_cflags`)
        const s = this.fmtCFlags(dep.cflags, '  ')
        w(`${dep.name}_cflags = $cflags${s}\n`)
      }

      let rulename = 'cc'
      let objext = '.bc' // this.objectFormat(rulename)

      for (let srcfile of dep.sourceFiles()) {
        let objfile = this.objfile(objdir, srcfile, objext)
        objfiles.set(srcfile, objfile)
        w(`build ${objfile}: ${rulename} ${srcfile}\n`)
        if (buildBody.length > 0) {
          w('  ' + buildBody.join('\n  ') + '\n')
        }
      }
      w(`\n`)
    }

    return objfiles
  }


  genProducts(w, objfiles) {
    for (let product of this.products.values()) {

      if (!product.deps || product.deps.length == 0) {
        throw new Error(`product without deps: ${product}`)
      }

      // wasm product?
      let iswasm = product instanceof NinjaWasmProduct

      // body of the build rule
      let buildBody = ''

      // cflags?
      if (product.cflags && product.cflags.length > 0) {
        const s = this.fmtCFlags(product.cflags, '    ')
        buildBody += `  cflags = $cflags${s}\n`
      }

      // collect different kinds of dependencies
      let fdeps = []
      let tdeps = []
      let cdeps = []
      for (let dep of product.deps) {
        if (dep instanceof NinjaProduct) {
          tdeps.push(dep)
        } else if (dep instanceof NinjaCLib) {
          cdeps.push(dep)
        } else if (typeof dep == 'string') {
          let files = glob(dep)
          if (files.length == 0) {
            fdeps.push(dep)
          } else {
            fdeps = fdeps.concat(files)
          }
        } else {
          throw new Error(
            `unknown dependency ${dep} of product ${product.name}`
          )
        }
      }

      // write comment and alias
      w(`# [product] ${product.name || product.file}\n`)

      if (iswasm) {
        // WASM target
        let interJsFile = '$outdir/obj/' + basename(product.file)
        let interWasmFile = replaceext(interJsFile, '.wasm')
        let outWasmFile = replaceext(product.file, '.wasm')

        w(`build ${product.name}: phony ${product.file} ${outWasmFile}\n`)
        w(`build ${interWasmFile}: phony | ${interJsFile}\n`)
        w(`build ${outWasmFile}: cp ${interWasmFile}\n`)

        w(`build ${product.file}: wasmc`)
        w(` $\n  ${interJsFile}`)
        w(` $\n  ${product.jswrapper}`)

        // implicit dependencies on other files
        if (fdeps.length > 0) {
          fdeps.forEach((dep, i) => {
            w(` $\n  ${i == 0 ? '|' : ' '} ${dep}`)
          })
        }

        w('\n')
        w(`build ${interJsFile}:`)

      } else {
        // generic target
        w(`build ${product.name}: phony ${product.file}\n`)
        w(`build ${product.file}:`)
      }

      // dependencies on c source code
      if (cdeps.length > 0) {
        w(' cc')
        for (let dep of cdeps) {
          for (let srcfile of dep.sourceFiles()) {
            let objfile = this.getObjFile(objfiles, srcfile)
            w(` $\n  ${objfile}`)
          }
        }
      }

      // dependencies on other targets
      if (tdeps.length > 0) {
        tdeps.forEach((dep, i) => {
          w(` $\n  ${i == 0 ? '|' : ' '} ${dep.file}`)
        })
      }

      if (!iswasm) {
        // implicit dependencies on other files
        if (fdeps.length > 0) {
          fdeps.forEach((dep, i) => {
            w(` $\n  ${i == 0 ? '|' : ' '} ${dep}`)
          })
        }
      }

      w(`\n${buildBody}\n`)
    }
  }


  resolveUsedDeps() {
    let deps = new Set()
    for (let product of this.products.values()) {
      if (product.deps) for (let dep of product.deps) {
        deps.add(dep)
      }
    }
    return deps
  }


  // e.g. ("build/g", "src/foo/bar.c", ".o") -> "build/g/src/foo/bar.o"
  objfile(objdir, srcfile, objext) {
    let sp = srcfile.lastIndexOf('/')
    let dp = srcfile.lastIndexOf('.')
    let objfile = (
      dp < 0 || dp < sp ?
        objfile = srcfile + objext :
        srcfile.substr(0, dp) + objext
    )
    return joinpath(objdir, objfile)
  }


  getObjFile(objfiles, srcfile) {
    const objfile = objfiles.get(srcfile)
    if (!objfile) {
      throw new Error(`missing object file for "${srcfile}"`)
    }
    return objfile
  }


  hasWasmProducts() {
    for (let product of this.products.values()) {
      if (product instanceof NinjaWasmProduct) {
        return true
      }
    }
    return false
  }
}

exports.NinjaWriter = NinjaWriter


function abspath(rootdir, path) {
  return isabspath(path) ? path : joinpath(rootdir, path)
}


// project(rootdir :string, outdir? :string, ninjafile? :string) : NinjaWriter
function project(rootdir, outdir, ninjafile) {
  let generator = ''

  let st = fs.statSync(rootdir)
  if (st.isFile()) {
    generator = relpath(process.cwd(), rootdir)
    rootdir = dirname(rootdir)
  }

  // simplify rootdir relative to working directory
  rootdir = relpath(process.cwd(), rootdir)

  // simplify outdir
  if (outdir) {
    outdir = abspath(rootdir, outdir)
  } else {
    // default output directory
    outdir = joinpath(rootdir, 'build')
  }

  // set ninja file if undefined
  if (!ninjafile) {
    ninjafile = joinpath(rootdir, 'build.ninja')
  }

  const p = new NinjaWriter(ninjafile, outdir, '1.3')

  if (generator) {
    p.generator = p.filepath(generator)
  }
  p.configdep(__filename)

  return p
}

exports.project = project


function logwarn(/* ... */) {
  let args = Array.prototype.slice.call(arguments)
  if (typeof args[0] === 'string') {
    args[0] = '[warn] ' + args[0]
  } else {
    args.unshift('[warn]')
  }
  console.error.apply(console, args)
}


// e.g. replaceext("foo/bar.baz", ".md") => "foo/bar.md"
function replaceext(filename, newext) {
  return filename.substr(0, filename.length - extname(filename).length) + newext
}


// globv(patterns : string[] | string) : string[]
function globv(patterns) {
  let files = new Set()
  for (let pattern of (typeof patterns == 'string' ? [patterns] : patterns)) {
    let matches = glob(pattern)
    if (matches.length == 0) {
      logwarn('file not found %o -- ignoring', pattern)
    }
    for (let path of matches) {
      files.add(path)
    }
  }
  return Array.from(files)
}
