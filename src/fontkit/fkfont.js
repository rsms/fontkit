import {
  bytebuf,
  mallocbuf,
  withUTF16Str,
  withTmpBytePtr,
  strFromUTF8Ptr,
} from './fkutil'
import { FKError } from './fkerr'
import { Glyphs } from './fkglyphs'
import { FontVariations } from './fkvar'


export class Font {
  constructor() {
    this.ptr = null      // pointer to FT_Face
    this.dataptr = null  // pointer to font data
    this.info = {}
    this._glyphNameCache = new Map()
    this._glyphNamePtr = 0
  }

  // load initializes the objects by parsing font data.
  // Call this on an existing/valid Font object is valid and causes the
  // underlying font object to be replaced.
  //
  // load(buf :ArrayBuffer|byte[]) : this
  //
  load(buf) {
    this.dispose()

    const u8buf = bytebuf(buf)
    const buflen = u8buf.length
    this.dataptr = mallocbuf(u8buf, buflen)

    this.ptr = _FKFontCreate(this.dataptr, buflen)
    if (this.ptr == 0) {
      _free(this.dataptr)
      throw new FKError()
    }

    // preload properties
    // TODO: implement "statically" without reflection
    const objprops = {}
    const accessorPrefix = '_FKFontGet_'
    for (let k in asm) {
      if (k.startsWith(accessorPrefix)) {
        let name = k.substr(accessorPrefix.length).toLowerCase()
        name = name.replace(/_(.)/g, (m, a) => a.toUpperCase())
        objprops[name] = {
          configurable: true,
          enumerable: true,
          get: () => {
            let value = asm[k](this.ptr)
            if (k.endsWith('_name')) {
              value = UTF8ArrayToString(HEAPU8, value)
            }
            Object.defineProperty(this, name, { enumerable: true, value })
            return value
          }
        }
      }
    }
    this.info = Object.create(null, objprops)

    // XXX DEBUG
    _FKFontFeatures(this.ptr)
  }

  dispose() {
    // if (this.onDispose) {
    //   for (let f of this.onDispose) {
    //     f(this)
    //   }
    //   this.onDispose = null
    // }
    if (this.ptr) {
      _FKFontFree(this.ptr)
      this.ptr = 0
      _free(this.dataptr)
      this.dataptr = 0
    }
    if (this._glyphNamePtr) {
      _free(this._glyphNamePtr)
      this._glyphNamePtr = 0
    }
  }

  toString() {
    let s = `[Font#0x${this.ptr.toString(16)}`
    if (this.info.family_name) {
      s += ' ' + this.info.family_name
    }
    if (this.info.style_name) {
      s += ' ' + this.info.style_name
    }
    return s + ']'
  }

  // variations is non-null for variable fonts
  get variations() { // :FontVariations|null
    let v = null, vptr = _FKFontGetVar(this.ptr)
    if (vptr != 0) {
      v = new FontVariations(vptr)
    }
    Object.defineProperty(this, 'variations', {value:v, enumerable:true})
    return v
  }

  glyphName(gid) {
    let name = this._glyphNameCache.get(gid)
    if (name === undefined) {
      if (this._glyphNamePtr == 0) {
        this._glyphNamePtr = _malloc(256)
      }
      if (!_FKFontGetGlyphName(
        this.ptr,
        gid >>> 0,
        this._glyphNamePtr,
        256
      )) {
        throw new FKError()
      }
      name = UTF8ArrayToString(HEAPU8, this._glyphNamePtr)
      this._glyphNameCache.set(gid, name)
    }
    return name
  }

  // layout(text :string, config? :Config) : Glyphs
  //
  layout(text, config) {
    let g = allocGlyphsObj(this)
    withUTF16Str(text, (textptr, _) => {
      _FKBufAppendUTF16(g.ptr, textptr, text.length)
    })
    try {
      this._layout(g, config)
    } catch (err) {
      g.dispose()
      throw err
    }
    return g
  }


  // layoutUTF8 is similar to layout but accepts UTF8 encoded text.
  //
  // layoutUTF8(bytes :number[], config? :Config) : Glyphs
  //
  layoutUTF8(bytes, config) {
    let g = allocGlyphsObj(this)
    withTmpBytePtr(bytes, (ptr, bytesize) => {
      _FKBufAppendUTF8(g.ptr, ptr, bytesize)
    })
    try {
      this._layout(g, config)
    } catch (err) {
      g.dispose()
      throw err
    }
    return g
  }


  _layout(g, config) {
    let featptr = 0, nfeats = 0
    if (config) {
      featptr = config._featPtr
      nfeats = config._featCount

      // TODO something more efficient
      g.setLanguage(config.language)
      g.setScript(config.script)
    } else {
      // TODO something more efficient
      g.setLanguage(null)
      g.setScript(null)
    }
    if (!_FKFontLayout(this.ptr, g.ptr, featptr, nfeats)) {
      throw new FKError()
    }
  }
}


// free-list of Glyphs objects, wrapping FKBuf
const glyphsFreeList = []

function allocGlyphsObj(font) {
  let g = glyphsFreeList.pop()
  if (g) {
    _FKBufReset(g.ptr)
    g.font = font
  } else {
    g = new Glyphs(font)
    g.dispose = () => {
      g.font = null
      if (g.ptr) {
        glyphsFreeList.push(g)
      }
    }
  }
  return g
}

