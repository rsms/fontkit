
// features contains OpenType feature data, maping between
// feature tags and human-readable names.
// e.g. "case" => "Case-Sensitive Forms"
declare const features :{[tag:string]:string}

type bool  = boolean
type int   = number
type float = number
type byte  = number
type Data  = ArrayBuffer|Iterable<byte>|byte[]

// load a font
// Asynchronously fetch font from URI, or parse from array of bytes.
function load(uri :string) :Promise<Font>
function load(data :Data) :Font


class Font {
  info       :FontInfo             // information about the font, e.g. name
  variations :FontVariations|null  // variable-font information

  // load font data
  load(data :Data) :void

  // dispose memory and other resources, and resets the object.
  // It's important to call this function when you're done with the font, or
  // the underlying memory will never be reclaimed.
  dispose() :void

  // toString returns a string representation of the font
  toString() :string

  // layout performs layout, or "shaping", of text
  layout(text :string, config? :Config) :Glyphs
  layoutUTF8(utf8bytes :Data, config? :Config) :Glyphs
}

interface FontVariations {
  styles :VarStyle[]
  axes   :VarAxis[]
}

interface VarStyle {
  index :int
  name  :string
}

interface VarAxis {
  index   :int
  name    :string
  min     :float
  max     :float
  default :float
}

interface FontInfo {
  familyName         :string // "Family"
  styleName          :string // "Regular"

  weightClass        :int // 400
  widthClass         :int // 5
  isMonospace        :bool
  isScalable         :bool
  vendorID           :string // "ABCD"

  unitsPerEm         :int // 2816
  capHeight          :int // 2048
  xHeight            :int // 1536
  ascender           :int // 2728
  descender          :int // -680
  underlinePosition  :int // -560
  underlineThickness :int // 192
  maxAdvanceWidth    :int // 4928
  maxAdvanceHeight   :int // 3408
  height             :int // 3408

  faceFlags          :int // 2841
  faceIndex          :int // 0
  numCharmaps        :int // 4
  numFaces           :int // 1
  numFixedSizes      :int // 0
  numGlyphs          :int // 2412
  styleFlags         :int // 1310720
  formatName         :string // "TrueType"
  isSFNT             :bool
}


class Glyphs implements Iterable<Glyph> {
  readonly font :Font

  constructor(f :Font)

  // dispose memory and other resources
  dispose() :void

  // script retrieves the current script.
  // For new Glyphs objects the script is null. You can either set it via
  // setScript or leave it null, in which case HarfBuzz will guess the script
  // for you. After a call to guessScriptAndLanguage or Font.layout, you can
  // call this function to retrieve the script that was guessed.
  script() :string|null
  scriptTag() :int

  // setScript sets the script from a ISO 15924 tag.
  // Returns true on success.
  // On failure, the buffer does not represent any specific script,
  // and the script will instead be guessed during layout.
  //
  // Accepts the special values "inherit", "common" and "unknown".
  //
  // See http://unicode.org/iso15924/iso15924-codes.html
  setScript(script :string|null) :bool
  setScriptTag(scriptTag :int) :bool

  // The direction of layout. Initially None.
  direction() :TextDirection

  // Set layout direction
  setDirection(dir :TextDirection) :void

  // language returns the BCP 47 language tag when a language is set.
  // null indicates that language is unknown and will be guessed.
  language() :string|null

  // setLanguage sets the language from BCP 47 language tags, or unsets the
  // language if null is provided. Returns true on success.
  setLanguage(language :string|null) :bool

  // Guesses script, language and direction.
  // If a property has been set, it is not guessed (only unset properties are
  // guessed.)
  // Note: New Glyphs objects have all properties unset (null).
  guessSegmentProperties() :void

  // Returns an iterator over the glyphs
  [Symbol.iterator](): Iterator<Glyph>
}


interface Glyph {
  readonly font     :Font
  readonly id       :int
  readonly advanceX :int
  readonly offsetX  :int
  readonly kerningX :int
  readonly name     :string
}


enum TextDirection {
  None = 0, // unset
  LTR  = 4, // horizontally from left to right
  RTL  = 5, // horizontally from right to left
  TTB  = 6, // vertically from top to bottom
  BTT  = 7, // vertically from bottom to top
}


class Config {
  language :string|null
  script   :string|null
  features :FeatureConfig[]

  dispose() :void
  setFeatures(f :FeatureConfig[]|string[]|null)
}


interface FeatureConfig {
  name    :string   // e.g. "tnum"
  enabled :bool
  start?  :int      // range start (defaults to 0)
  end?    :int      // range end (exclusive; defaults to U32_MAX)
}
