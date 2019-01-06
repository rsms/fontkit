#pragma once
#include "common.h"
#include "fkfont-props.inc"
#include "fkbuf.h"
#include "fkvar.h"

#include <freetype/ftsnames.h>

typedef struct _FKFont {
  FT_Face    face;
  hb_font_t* font;
  hb_map_t*  nameindex;  // maps strid to SFNT index
  FKVar*     vm;
} FKFont;

// FKFontCreate allocates and initialized a new font object from font data.
// You must not deallocate the memory at p before calling FKFontFree.
//
FKFont* FKFontCreate(const FT_Byte* p, unsigned length);

// FKFontFree deallocates font previously allocated with FKFontCreate.
//
void FKFontFree(FKFont*);

// FKFontSetCharSize sets the character size which is used as the basis
// for layout. Defaults to the font's UPM, causing all other functions
// to return metrics in the font's UPM (i.e. 1:1.)
//
bool FKFontSetCharSize(const FKFont*, long size);

// FKFontGetGlyphAdvance returns the nominal glyph advance (horizontal)
// for glyph with codepoint.
//
i32 FKFontGetGlyphAdvance(FKFont*, FKCodepoint);

// FKFontGetGlyphKerning returns the kerning (horizontal) for a glyph pair,
// defined by codepoints.
//
i32 FKFontGetGlyphKerning(FKFont*, FKCodepoint left, FKCodepoint right);

// FKFontGetGlyphName copies the name of glyph with codepoint into memory
// at pch. No more than size bytes will be copied. If there's not enough
// space, or if there's no glyph mapped to cp, the function returns false
// and FKErr is set.
//
bool FKFontGetGlyphName(FKFont*, FKGlyphID, char* pch, u32 size);

// FKFontGetVarCount returns a variations object if the font is variable,
// or null if the font is not variable.
// The returned object is managed by the FKFont and is valid as long as the
// parent FKFont object is.
//
FKVar* FKFontGetVar(FKFont*);

// FKFontLayout executes text layout
//
bool FKFontLayout(FKFont*, FKBuf*, hb_feature_t*, u32 nfeats);

// Properties of FT_Face exposed via accessor functions.
// i.e.
//   const char* FKFontGet_family_name(const FKFont*)
//
#define A(TYPE, NAME) \
  TYPE FKFontGet_##NAME(const FKFont*);
FK_FONT_PROPS(A)
#undef A


// -------------------------------------------------------
// internal

hb_font_t* FKFontGetHB(FKFont*);

// FKFontGetName finds a name in the SFNT table, by string id.
// Returns true if strid was found.
//
bool FKFontGetName(FKFont*, u32 strid, /*out*/FT_SfntName*);
