import { StDescParse } from './fkstdesc'

// constants defined by the asm code.
// not valid until asm has been initialized.
export const consts = {
  FKGlyphInfoStruct: null, // StructDesc
  FKGlyphPosStruct: null, // StructDesc
}

Module.postRun.push(() => {
  // load struct descriptions
  consts.FKGlyphInfoStruct = StDescParse(_FKGlyphInfoStructDesc())
  consts.FKGlyphPosStruct = StDescParse(_FKBufGlyphPosStructDesc())
  // console.log('FKGlyphInfoStruct:', consts.FKGlyphInfoStruct)
  // console.log('FKGlyphPosStruct:', consts.FKGlyphPosStruct)
})
