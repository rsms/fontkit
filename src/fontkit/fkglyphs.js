import { consts } from './fkinfo'
import {
  withStackFrame,
  cstrStack,
  asciicstr,
  hbtag,
  hbtagStr,
} from './fkutil'


const HB_SCRIPT_COMMON    = hbtag('Zyyy')
    , HB_SCRIPT_INHERITED = hbtag('Zinh')
    , HB_SCRIPT_UNKNOWN   = hbtag("Zzzz")


class Glyph {
  constructor(font, id, advanceX, offsetX, kerningX) {
    this.font = font
    this.id = id
    this.advanceX = advanceX
    this.offsetX = offsetX
    this.kerningX = kerningX
  }

  get name() {
    return this.font.glyphName(this.id)
  }
}


class GlyphIterator {
  constructor(ptr, font) {
    this.font = font
    this.length = _FKBufGlyphInfoLen(ptr)
    this.infoptr = _FKBufGlyphInfoPtr(ptr)
    this.posptr = _FKBufGlyphPosPtr(ptr)

    let poslen = _FKBufGlyphPosLen(ptr)
    if (poslen != this.length) {
      console.warn(`FKBufGlyphPosLen != FKBufGlyphInfoLen -- using smallest`)
      this.length = Math.min(this.length, poslen)
    }

    this.index = 0
  }

  next() {
    if (this.index == this.length) {
      return { done: true, value: null }
    }
    let i = this.index++

    const glyph_info = consts.FKGlyphInfoStruct.fields
    let gid = glyph_info.id.readv(this.infoptr, i)

    const glyph_pos = consts.FKGlyphPosStruct.fields
    let advanceX = glyph_pos.x_advance.readv(this.posptr, i)
    let offsetX = glyph_pos.x_offset.readv(this.posptr, i)

    const kerningX = advanceX - _FKFontGetGlyphAdvance(this.font.ptr, gid);

    return { done: false, value:
      new Glyph(this.font, gid, advanceX, offsetX, kerningX)
    }
  }
}


// Glyphs represents glyphs as produced by layout()
//
export class Glyphs {
  // Maps to a FKBuf object
  constructor(font) {
    // Really a wrapper around a FKBuf object
    this.ptr = _FKBufAlloc()
    this.font = font
  }

  dispose() {
    if (this.ptr) {
      _FKBufFree(this.ptr)
      this.ptr = 0
    }
  }

  // setScript sets the script from a ISO 15924 tag.
  // Returns true on success.
  // On failure, the buffer does not represent any specific script,
  // and the script will instead be guessed during layout.
  //
  // Accepts the special values "inherit" and "common".
  //
  // See http://unicode.org/iso15924/iso15924-codes.html
  setScript(script) {
    let tag = HB_SCRIPT_UNKNOWN
    if (script) {
      script = String(script)
      if (script == "inherit") {
        tag = HB_SCRIPT_INHERITED
      } else if (script == "common") {
        tag = HB_SCRIPT_COMMON
      } else if (script.length > 4) {
        throw new Error("invalid script tag")
      } else {
        tag = hbtag(script)
      }
    }
    return this.setScriptTag(tag)
  }

  // script() : string|undefined
  script() {
    let tag = this.scriptTag()
    if (tag == HB_SCRIPT_COMMON) {
      return "common"
    } else if (tag == HB_SCRIPT_INHERITED) {
      return "inherit"
    } else if (tag == HB_SCRIPT_UNKNOWN) {
      return undefined
    }
    return hbtagStr(tag)
  }

  // setScriptTag sets the script by a hb_tag
  setScriptTag(tag) {
    return _FKBufSetScript(this.ptr, tag)
  }

  // scriptTag returns the script as a hb_tag
  scriptTag() {
    return _FKBufGetScript(this.ptr)
  }

  // setLanguage sets the language from BCP 47 language tags.
  // Returns true on success.
  // On failure, the buffer does not represent any specific language,
  // and the language will instead be guessed during layout.
  setLanguage(language) {
    language = !language ? null : String(language)
    return withStackFrame(() =>
      !!_FKBufSetLanguage(this.ptr, cstrStack(language), -1)
    )
  }

  // language() : string|undefined
  language() {
    let pch = _FKBufGetLanguage(this.ptr)
    if (pch != 0) {
      return asciicstr(HEAPU8, pch)
    }
  }

  //!valid-after-layout
  [Symbol.iterator]() {
    return new GlyphIterator(this.ptr, this.font)
  }
}