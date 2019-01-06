import './fkinfo'
import { FKError } from './fkerr'
import { Font } from './fkfont'
import { malloc32, withTmpBytePtr, hbtag } from './fkutil'

// exports
export { FKError } from './fkerr'
export { Font } from './fkfont'
export { Glyphs } from './fkglyphs'


console.time('fontkit load')
Module.postRun.push(() => {
  console.timeEnd('fontkit load')
  // check for init failure
  if (_FKErrGetCode() != 0) { throw new FKError() }
})


// load initializes a Font
//
// This function can be called in different ways:
//
// load(uri :string) : Promise<Font>
//   Asynchronously fetch font from URI
//
// load(data :ArrayBuffer|Iterable<byte>|byte[]) : Font
//   Load directly from font data
//
export function load(source) {
  const font = new Font()
  if (typeof source == 'string') {
    return fetch(source, {credentials:'same-origin'})
      .then(r => r.arrayBuffer())
      .then(buf => { font.load(buf); return font })
  }
  font.load(source)
  return font
}


export function demo1(buf) {
  return withTmpBytePtr(buf, (ptr, size) =>
    _FKDemo1(ptr, size)
  )
}


const NULL = 0 >>> 0
const U32_MAX = -1 >>> 0


// all supported features
export const features = {
  // Imported on Dec 1, 2018 from
  // https://docs.microsoft.com/en-us/typography/opentype/spec/featurelist
  aalt: { tag: hbtag("aalt"), name: "Access All Alternates" },
  abvf: { tag: hbtag("abvf"), name: "Above-base Forms" },
  abvm: { tag: hbtag("abvm"), name: "Above-base Mark Positioning" },
  abvs: { tag: hbtag("abvs"), name: "Above-base Substitutions" },
  afrc: { tag: hbtag("afrc"), name: "Alternative Fractions" },
  akhn: { tag: hbtag("akhn"), name: "Akhands" },
  blwf: { tag: hbtag("blwf"), name: "Below-base Forms" },
  blwm: { tag: hbtag("blwm"), name: "Below-base Mark Positioning" },
  blws: { tag: hbtag("blws"), name: "Below-base Substitutions" },
  calt: { tag: hbtag("calt"), name: "Contextual Alternates" },
  case: { tag: hbtag("case"), name: "Case-Sensitive Forms" },
  ccmp: { tag: hbtag("ccmp"), name: "Glyph Composition / Decomposition" },
  cfar: { tag: hbtag("cfar"), name: "Conjunct Form After Ro" },
  cjct: { tag: hbtag("cjct"), name: "Conjunct Forms" },
  clig: { tag: hbtag("clig"), name: "Contextual Ligatures" },
  cpct: { tag: hbtag("cpct"), name: "Centered CJK Punctuation" },
  cpsp: { tag: hbtag("cpsp"), name: "Capital Spacing" },
  cswh: { tag: hbtag("cswh"), name: "Contextual Swash" },
  curs: { tag: hbtag("curs"), name: "Cursive Positioning" },
  cv01: { tag: hbtag("cv01"), name: "Character Variant 1" },
  cv02: { tag: hbtag("cv02"), name: "Character Variant 2" },
  cv03: { tag: hbtag("cv03"), name: "Character Variant 3" },
  cv04: { tag: hbtag("cv04"), name: "Character Variant 4" },
  cv05: { tag: hbtag("cv05"), name: "Character Variant 5" },
  cv06: { tag: hbtag("cv06"), name: "Character Variant 6" },
  cv07: { tag: hbtag("cv07"), name: "Character Variant 7" },
  cv08: { tag: hbtag("cv08"), name: "Character Variant 8" },
  cv09: { tag: hbtag("cv09"), name: "Character Variant 9" },
  cv10: { tag: hbtag("cv10"), name: "Character Variant 10" },
  cv11: { tag: hbtag("cv11"), name: "Character Variant 11" },
  cv12: { tag: hbtag("cv12"), name: "Character Variant 12" },
  cv13: { tag: hbtag("cv13"), name: "Character Variant 13" },
  cv14: { tag: hbtag("cv14"), name: "Character Variant 14" },
  cv15: { tag: hbtag("cv15"), name: "Character Variant 15" },
  cv16: { tag: hbtag("cv16"), name: "Character Variant 16" },
  cv17: { tag: hbtag("cv17"), name: "Character Variant 17" },
  cv18: { tag: hbtag("cv18"), name: "Character Variant 18" },
  cv19: { tag: hbtag("cv19"), name: "Character Variant 19" },
  cv20: { tag: hbtag("cv20"), name: "Character Variant 20" },
  cv21: { tag: hbtag("cv21"), name: "Character Variant 21" },
  cv22: { tag: hbtag("cv22"), name: "Character Variant 22" },
  cv23: { tag: hbtag("cv23"), name: "Character Variant 23" },
  cv24: { tag: hbtag("cv24"), name: "Character Variant 24" },
  cv25: { tag: hbtag("cv25"), name: "Character Variant 25" },
  cv26: { tag: hbtag("cv26"), name: "Character Variant 26" },
  cv27: { tag: hbtag("cv27"), name: "Character Variant 27" },
  cv28: { tag: hbtag("cv28"), name: "Character Variant 28" },
  cv29: { tag: hbtag("cv29"), name: "Character Variant 29" },
  cv30: { tag: hbtag("cv30"), name: "Character Variant 30" },
  cv31: { tag: hbtag("cv31"), name: "Character Variant 31" },
  cv32: { tag: hbtag("cv32"), name: "Character Variant 32" },
  cv33: { tag: hbtag("cv33"), name: "Character Variant 33" },
  cv34: { tag: hbtag("cv34"), name: "Character Variant 34" },
  cv35: { tag: hbtag("cv35"), name: "Character Variant 35" },
  cv36: { tag: hbtag("cv36"), name: "Character Variant 36" },
  cv37: { tag: hbtag("cv37"), name: "Character Variant 37" },
  cv38: { tag: hbtag("cv38"), name: "Character Variant 38" },
  cv39: { tag: hbtag("cv39"), name: "Character Variant 39" },
  cv40: { tag: hbtag("cv40"), name: "Character Variant 40" },
  cv41: { tag: hbtag("cv41"), name: "Character Variant 41" },
  cv42: { tag: hbtag("cv42"), name: "Character Variant 42" },
  cv43: { tag: hbtag("cv43"), name: "Character Variant 43" },
  cv44: { tag: hbtag("cv44"), name: "Character Variant 44" },
  cv45: { tag: hbtag("cv45"), name: "Character Variant 45" },
  cv46: { tag: hbtag("cv46"), name: "Character Variant 46" },
  cv47: { tag: hbtag("cv47"), name: "Character Variant 47" },
  cv48: { tag: hbtag("cv48"), name: "Character Variant 48" },
  cv49: { tag: hbtag("cv49"), name: "Character Variant 49" },
  cv50: { tag: hbtag("cv50"), name: "Character Variant 50" },
  cv51: { tag: hbtag("cv51"), name: "Character Variant 51" },
  cv52: { tag: hbtag("cv52"), name: "Character Variant 52" },
  cv53: { tag: hbtag("cv53"), name: "Character Variant 53" },
  cv54: { tag: hbtag("cv54"), name: "Character Variant 54" },
  cv55: { tag: hbtag("cv55"), name: "Character Variant 55" },
  cv56: { tag: hbtag("cv56"), name: "Character Variant 56" },
  cv57: { tag: hbtag("cv57"), name: "Character Variant 57" },
  cv58: { tag: hbtag("cv58"), name: "Character Variant 58" },
  cv59: { tag: hbtag("cv59"), name: "Character Variant 59" },
  cv60: { tag: hbtag("cv60"), name: "Character Variant 60" },
  cv61: { tag: hbtag("cv61"), name: "Character Variant 61" },
  cv62: { tag: hbtag("cv62"), name: "Character Variant 62" },
  cv63: { tag: hbtag("cv63"), name: "Character Variant 63" },
  cv64: { tag: hbtag("cv64"), name: "Character Variant 64" },
  cv65: { tag: hbtag("cv65"), name: "Character Variant 65" },
  cv66: { tag: hbtag("cv66"), name: "Character Variant 66" },
  cv67: { tag: hbtag("cv67"), name: "Character Variant 67" },
  cv68: { tag: hbtag("cv68"), name: "Character Variant 68" },
  cv69: { tag: hbtag("cv69"), name: "Character Variant 69" },
  cv70: { tag: hbtag("cv70"), name: "Character Variant 70" },
  cv71: { tag: hbtag("cv71"), name: "Character Variant 71" },
  cv72: { tag: hbtag("cv72"), name: "Character Variant 72" },
  cv73: { tag: hbtag("cv73"), name: "Character Variant 73" },
  cv74: { tag: hbtag("cv74"), name: "Character Variant 74" },
  cv75: { tag: hbtag("cv75"), name: "Character Variant 75" },
  cv76: { tag: hbtag("cv76"), name: "Character Variant 76" },
  cv77: { tag: hbtag("cv77"), name: "Character Variant 77" },
  cv78: { tag: hbtag("cv78"), name: "Character Variant 78" },
  cv79: { tag: hbtag("cv79"), name: "Character Variant 79" },
  cv80: { tag: hbtag("cv80"), name: "Character Variant 80" },
  cv81: { tag: hbtag("cv81"), name: "Character Variant 81" },
  cv82: { tag: hbtag("cv82"), name: "Character Variant 82" },
  cv83: { tag: hbtag("cv83"), name: "Character Variant 83" },
  cv84: { tag: hbtag("cv84"), name: "Character Variant 84" },
  cv85: { tag: hbtag("cv85"), name: "Character Variant 85" },
  cv86: { tag: hbtag("cv86"), name: "Character Variant 86" },
  cv87: { tag: hbtag("cv87"), name: "Character Variant 87" },
  cv88: { tag: hbtag("cv88"), name: "Character Variant 88" },
  cv89: { tag: hbtag("cv89"), name: "Character Variant 89" },
  cv90: { tag: hbtag("cv90"), name: "Character Variant 90" },
  cv91: { tag: hbtag("cv91"), name: "Character Variant 91" },
  cv92: { tag: hbtag("cv92"), name: "Character Variant 92" },
  cv93: { tag: hbtag("cv93"), name: "Character Variant 93" },
  cv94: { tag: hbtag("cv94"), name: "Character Variant 94" },
  cv95: { tag: hbtag("cv95"), name: "Character Variant 95" },
  cv96: { tag: hbtag("cv96"), name: "Character Variant 96" },
  cv97: { tag: hbtag("cv97"), name: "Character Variant 97" },
  cv98: { tag: hbtag("cv98"), name: "Character Variant 98" },
  cv99: { tag: hbtag("cv99"), name: "Character Variant 99" },
  c2pc: { tag: hbtag("c2pc"), name: "Petite Capitals From Capitals" },
  c2sc: { tag: hbtag("c2sc"), name: "Small Capitals From Capitals" },
  dist: { tag: hbtag("dist"), name: "Distances" },
  dlig: { tag: hbtag("dlig"), name: "Discretionary Ligatures" },
  dnom: { tag: hbtag("dnom"), name: "Denominators" },
  dtls: { tag: hbtag("dtls"), name: "Dotless Forms" },
  expt: { tag: hbtag("expt"), name: "Expert Forms" },
  falt: { tag: hbtag("falt"), name: "Final Glyph on Line Alternates" },
  fin2: { tag: hbtag("fin2"), name: "Terminal Forms #2" },
  fin3: { tag: hbtag("fin3"), name: "Terminal Forms #3" },
  fina: { tag: hbtag("fina"), name: "Terminal Forms" },
  flac: { tag: hbtag("flac"), name: "Flattened accent forms" },
  frac: { tag: hbtag("frac"), name: "Fractions" },
  fwid: { tag: hbtag("fwid"), name: "Full Widths" },
  half: { tag: hbtag("half"), name: "Half Forms" },
  haln: { tag: hbtag("haln"), name: "Halant Forms" },
  halt: { tag: hbtag("halt"), name: "Alternate Half Widths" },
  hist: { tag: hbtag("hist"), name: "Historical Forms" },
  hkna: { tag: hbtag("hkna"), name: "Horizontal Kana Alternates" },
  hlig: { tag: hbtag("hlig"), name: "Historical Ligatures" },
  hngl: { tag: hbtag("hngl"), name: "Hangul" },
  hojo: { tag: hbtag("hojo"), name: "Hojo Kanji Forms (JIS X 0212-1990 Kanji Forms)" },
  hwid: { tag: hbtag("hwid"), name: "Half Widths" },
  init: { tag: hbtag("init"), name: "Initial Forms" },
  isol: { tag: hbtag("isol"), name: "Isolated Forms" },
  ital: { tag: hbtag("ital"), name: "Italics" },
  jalt: { tag: hbtag("jalt"), name: "Justification Alternates" },
  jp78: { tag: hbtag("jp78"), name: "JIS78 Forms" },
  jp83: { tag: hbtag("jp83"), name: "JIS83 Forms" },
  jp90: { tag: hbtag("jp90"), name: "JIS90 Forms" },
  jp04: { tag: hbtag("jp04"), name: "JIS2004 Forms" },
  kern: { tag: hbtag("kern"), name: "Kerning" },
  lfbd: { tag: hbtag("lfbd"), name: "Left Bounds" },
  liga: { tag: hbtag("liga"), name: "Standard Ligatures" },
  ljmo: { tag: hbtag("ljmo"), name: "Leading Jamo Forms" },
  lnum: { tag: hbtag("lnum"), name: "Lining Figures" },
  locl: { tag: hbtag("locl"), name: "Localized Forms" },
  ltra: { tag: hbtag("ltra"), name: "Left-to-right alternates" },
  ltrm: { tag: hbtag("ltrm"), name: "Left-to-right mirrored forms" },
  mark: { tag: hbtag("mark"), name: "Mark Positioning" },
  med2: { tag: hbtag("med2"), name: "Medial Forms #2" },
  medi: { tag: hbtag("medi"), name: "Medial Forms" },
  mgrk: { tag: hbtag("mgrk"), name: "Mathematical Greek" },
  mkmk: { tag: hbtag("mkmk"), name: "Mark to Mark Positioning" },
  mset: { tag: hbtag("mset"), name: "Mark Positioning via Substitution" },
  nalt: { tag: hbtag("nalt"), name: "Alternate Annotation Forms" },
  nlck: { tag: hbtag("nlck"), name: "NLC Kanji Forms" },
  nukt: { tag: hbtag("nukt"), name: "Nukta Forms" },
  numr: { tag: hbtag("numr"), name: "Numerators" },
  onum: { tag: hbtag("onum"), name: "Oldstyle Figures" },
  opbd: { tag: hbtag("opbd"), name: "Optical Bounds" },
  ordn: { tag: hbtag("ordn"), name: "Ordinals" },
  ornm: { tag: hbtag("ornm"), name: "Ornaments" },
  palt: { tag: hbtag("palt"), name: "Proportional Alternate Widths" },
  pcap: { tag: hbtag("pcap"), name: "Petite Capitals" },
  pkna: { tag: hbtag("pkna"), name: "Proportional Kana" },
  pnum: { tag: hbtag("pnum"), name: "Proportional Figures" },
  pref: { tag: hbtag("pref"), name: "Pre-Base Forms" },
  pres: { tag: hbtag("pres"), name: "Pre-base Substitutions" },
  pstf: { tag: hbtag("pstf"), name: "Post-base Forms" },
  psts: { tag: hbtag("psts"), name: "Post-base Substitutions" },
  pwid: { tag: hbtag("pwid"), name: "Proportional Widths" },
  qwid: { tag: hbtag("qwid"), name: "Quarter Widths" },
  rand: { tag: hbtag("rand"), name: "Randomize" },
  rclt: { tag: hbtag("rclt"), name: "Required Contextual Alternates" },
  rkrf: { tag: hbtag("rkrf"), name: "Rakar Forms" },
  rlig: { tag: hbtag("rlig"), name: "Required Ligatures" },
  rphf: { tag: hbtag("rphf"), name: "Reph Forms" },
  rtbd: { tag: hbtag("rtbd"), name: "Right Bounds" },
  rtla: { tag: hbtag("rtla"), name: "Right-to-left alternates" },
  rtlm: { tag: hbtag("rtlm"), name: "Right-to-left mirrored forms" },
  ruby: { tag: hbtag("ruby"), name: "Ruby Notation Forms" },
  rvrn: { tag: hbtag("rvrn"), name: "Required Variation Alternates" },
  salt: { tag: hbtag("salt"), name: "Stylistic Alternates" },
  sinf: { tag: hbtag("sinf"), name: "Scientific Inferiors" },
  size: { tag: hbtag("size"), name: "Optical size" },
  smcp: { tag: hbtag("smcp"), name: "Small Capitals" },
  smpl: { tag: hbtag("smpl"), name: "Simplified Forms" },
  ss01: { tag: hbtag("ss01"), name: "Stylistic Set 1" },
  ss02: { tag: hbtag("ss02"), name: "Stylistic Set 2" },
  ss03: { tag: hbtag("ss03"), name: "Stylistic Set 3" },
  ss04: { tag: hbtag("ss04"), name: "Stylistic Set 4" },
  ss05: { tag: hbtag("ss05"), name: "Stylistic Set 5" },
  ss06: { tag: hbtag("ss06"), name: "Stylistic Set 6" },
  ss07: { tag: hbtag("ss07"), name: "Stylistic Set 7" },
  ss08: { tag: hbtag("ss08"), name: "Stylistic Set 8" },
  ss09: { tag: hbtag("ss09"), name: "Stylistic Set 9" },
  ss10: { tag: hbtag("ss10"), name: "Stylistic Set 10" },
  ss11: { tag: hbtag("ss11"), name: "Stylistic Set 11" },
  ss12: { tag: hbtag("ss12"), name: "Stylistic Set 12" },
  ss13: { tag: hbtag("ss13"), name: "Stylistic Set 13" },
  ss14: { tag: hbtag("ss14"), name: "Stylistic Set 14" },
  ss15: { tag: hbtag("ss15"), name: "Stylistic Set 15" },
  ss16: { tag: hbtag("ss16"), name: "Stylistic Set 16" },
  ss17: { tag: hbtag("ss17"), name: "Stylistic Set 17" },
  ss18: { tag: hbtag("ss18"), name: "Stylistic Set 18" },
  ss19: { tag: hbtag("ss19"), name: "Stylistic Set 19" },
  ss20: { tag: hbtag("ss20"), name: "Stylistic Set 20" },
  ssty: { tag: hbtag("ssty"), name: "Math script style alternates" },
  stch: { tag: hbtag("stch"), name: "Stretching Glyph Decomposition" },
  subs: { tag: hbtag("subs"), name: "Subscript" },
  sups: { tag: hbtag("sups"), name: "Superscript" },
  swsh: { tag: hbtag("swsh"), name: "Swash" },
  titl: { tag: hbtag("titl"), name: "Titling" },
  tjmo: { tag: hbtag("tjmo"), name: "Trailing Jamo Forms" },
  tnam: { tag: hbtag("tnam"), name: "Traditional Name Forms" },
  tnum: { tag: hbtag("tnum"), name: "Tabular Figures" },
  trad: { tag: hbtag("trad"), name: "Traditional Forms" },
  twid: { tag: hbtag("twid"), name: "Third Widths" },
  unic: { tag: hbtag("unic"), name: "Unicase" },
  valt: { tag: hbtag("valt"), name: "Alternate Vertical Metrics" },
  vatu: { tag: hbtag("vatu"), name: "Vattu Variants" },
  vert: { tag: hbtag("vert"), name: "Vertical Writing" },
  vhal: { tag: hbtag("vhal"), name: "Alternate Vertical Half Metrics" },
  vjmo: { tag: hbtag("vjmo"), name: "Vowel Jamo Forms" },
  vkna: { tag: hbtag("vkna"), name: "Vertical Kana Alternates" },
  vkrn: { tag: hbtag("vkrn"), name: "Vertical Kerning" },
  vpal: { tag: hbtag("vpal"), name: "Proportional Alternate Vertical Metrics" },
  vrt2: { tag: hbtag("vrt2"), name: "Vertical Alternates and Rotation" },
  vrtr: { tag: hbtag("vrtr"), name: "Vertical Alternates for Rotation" },
  zero: { tag: hbtag("zero"), name: "Slashed Zero" },
}


// interface Configuration {
//   features? :(FeatureConfig[]|string[])
// }
//
export class Config {
  // props :Configuration
  constructor(props) {
    this._featPtr = NULL
    this._featPtrOrig = NULL
    this._featCount = 0

    this.features = {}
    if (props && props.features) {
      this.setFeatures(props.features)
    }

    this.language = null
    this.script = null
  }

  dispose() {
    this._freeFeatPtr()
  }

  //
  // featslist : (FeatureConfig|string)[]
  // interface FeatureConfig {
  //   name    :string   // e.g. "tnum"
  //   enabled :bool
  //   start?  :int      // range start (defaults to 0)
  //   end?    :int      // range end (exclusive; defaults to U32_MAX)
  // }
  //
  setFeatures(featslist) {
    let feats = []

    if (featslist) {
      for (let ent of featslist) {
        let feat = null, value = 1 >>> 0, start = 0 >>> 0, end = U32_MAX
        if (!ent) {
          continue
        }
        if (typeof ent == 'string') {
          feat = features[ent]
        } else if (typeof ent == 'object') {
          feat = features[ent.name]
          if (!ent.enabled) {
            value = 0
          }
          if (ent.start !== undefined) {
            start = ent.start >>> 0
          }
          if (ent.end !== undefined) {
            end = ent.end >>> 0
          }
        }
        if (feat === undefined) {
          throw new Error(`unknown feature "${ent.name}"`)
        }
        feats.push([ feat.tag, value, start, end ])
      }
    }

    this._freeFeatPtr()

    let [featPtrOrig, featPtr] = malloc32(feats.length * 16)
      // 16 is the hb_feature_t struct size in bytes
    let p = featPtr

    for (let [tag, value, start, end] of feats) {
      // hb_feature_t struct {
      //   uint32_t      tag
      //   uint32_t      value
      //   unsigned int  start
      //   unsigned int  end
      // }

      console.log('init feat:', {tag, value, start, end})

      HEAP32[p >> 2] = tag
      p += 4

      HEAP32[p >> 2] = value
      p += 4

      HEAP32[p >> 2] = start
      p += 4

      HEAP32[p >> 2] = end
      p += 4
    }

    this._featCount = feats.length
    this._featPtr = featPtr
    this._featPtrOrig = featPtrOrig

    this.features = feats
  }

  _freeFeatPtr() {
    if (this._featPtrOrig != 0) {
      _free(this._featPtrOrig)
      this._featPtr = 0
      this._featPtrOrig = 0
      this._featCount = 0
    }
  }
}

