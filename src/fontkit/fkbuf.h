#pragma once
#include "common.h"

typedef hb_buffer_t FKBuf;

FKBuf* FKBufAlloc();
void FKBufFree(FKBuf*);


// ---------------------------------------------------------------------
// Functions for dealing with a buffer representing input text

FKBuf* FKBufCreateUTF8(const u8*, u32 len);
FKBuf* FKBufCreateUTF16(const u16*, u32 len);

// FKBufReset resets the object so it can be reused.
void FKBufReset(FKBuf*);

void FKBufAppendUTF8(FKBuf*, const u8*, u32 len);
void FKBufAppendUTF16(FKBuf*, const u16*, u32 len);

// Set language from BCP 47 language tags (https://tools.ietf.org/html/bcp47)
// Returns true if the language was set.
// On failure, language is unset and will be guessed during layout.
// If len < 0, then str must be a nul-terminated "c string".
// If str==NULL, sets HB_LANGUAGE_INVALID and returns true.
//
bool FKBufSetLanguage(FKBuf*, const char* str, i32 len);

// FKBufGetLanguage returns the BCP 47 language string for the
// currently-configured language, or NULL if no language is configured.
//
const char* FKBufGetLanguage(FKBuf*);

// FKBufSetScript sets the script from a ISO 15924 tag.
// Returns true on success. On failure, HB_SCRIPT_UNKNOWN is set and the
// script will be guesses during layout.
// See http://unicode.org/iso15924/iso15924-codes.html
//
bool FKBufSetScript(FKBuf*, hb_tag_t);

// FKBufGetScript returns the ISO 15924 tag for the buffer's script,
// or HB_SCRIPT_UNKNOWN if no script is configured.
//
hb_tag_t FKBufGetScript(FKBuf*);


// ---------------------------------------------------------------------------
// Functions for dealing with a buffer representing glyphs

// FKBufGlyphInfoPtr accesses the glyph information array.
// Returned pointer is valid as long as buffer contents are not modified.
const hb_glyph_info_t* FKBufGlyphInfoPtr(FKBuf*);

// FKBufGlyphInfoLen returns the length of the glyph information array.
u32 FKBufGlyphInfoLen(FKBuf* b);

// FKBufGlyphInfoPtr accesses the glyph position array.
// Returned pointer is valid as long as buffer contents are not modified.
const hb_glyph_position_t* FKBufGlyphPosPtr(FKBuf*);

// FKBufGlyphPosLen returns the length of the glyph position array.
u32 FKBufGlyphPosLen(FKBuf*);


// ---------------------------------------------------------------------------
// internal

static inline hb_buffer_t* FKBufGetHBBuf(FKBuf* t) {
  return t;
}
