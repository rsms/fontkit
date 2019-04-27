#include "common.h"
#include "fkbuf.h"
#include "fkerr.h"
#include "fkstdesc.h"


FKBuf* EXPORT FKBufAlloc() {
  hb_buffer_t* b = hb_buffer_create();
  // hb_buffer_set_script(b, HB_SCRIPT_INVALID);
  // hb_buffer_set_direction(b, HB_DIRECTION_LTR);
  hb_buffer_set_cluster_level(b, HB_BUFFER_CLUSTER_LEVEL_MONOTONE_CHARACTERS);
  // hb_buffer_set_content_type(b, HB_BUFFER_CONTENT_TYPE_UNICODE);
  return b;
}


void EXPORT FKBufReset(FKBuf* b) {
  hb_buffer_reset(b);
  hb_buffer_set_cluster_level(b, HB_BUFFER_CLUSTER_LEVEL_MONOTONE_CHARACTERS);
}

void EXPORT FKBufFree(FKBuf* b) {
  hb_buffer_destroy(b);
}


// ---------------------------------------------------------------------------
// Functions for dealing with a buffer representing input text


FKBuf* EXPORT FKBufCreateUTF8(const u8* ptr, u32 len) {
  FKBuf* b = FKBufAlloc();
  FKBufAppendUTF8(b, ptr, len);
  return b;
}

FKBuf* EXPORT FKBufCreateUTF16(const u16* ptr, u32 len) {
  FKBuf* b = FKBufAlloc();
  FKBufAppendUTF16(b, ptr, len);
  return b;
}


void EXPORT FKBufIsText(FKBuf* b) {
  hb_buffer_get_content_type(b);
}


void EXPORT FKBufAppendUTF8(FKBuf* b, const u8* ptr, u32 len) {
  hb_buffer_add_utf8(b, (const char*)ptr, len, 0, len);
}

void EXPORT FKBufAppendUTF16(FKBuf* b, const u16* ptr, u32 len) {
  hb_buffer_add_utf16(b, ptr, len, 0, len);
}


bool EXPORT FKBufSetLanguage(FKBuf* b, const char* str, i32 len) {
  if (!str || len == 0) {
    hb_buffer_set_language(b, HB_LANGUAGE_INVALID);
    return true;
  }
  hb_language_t lang = hb_language_from_string(str, len);
  hb_buffer_set_language(b, lang);
  return lang != HB_LANGUAGE_INVALID;
}

const char* EXPORT FKBufGetLanguage(FKBuf* b) {
  hb_language_t lang = hb_buffer_get_language(b);
  return lang == HB_LANGUAGE_INVALID ? NULL : hb_language_to_string(lang);
}


bool EXPORT FKBufSetScript(FKBuf* b, hb_tag_t t) {
  hb_script_t script = hb_script_from_iso15924_tag(t);
  hb_buffer_set_script(b, script);
  return script != HB_SCRIPT_UNKNOWN || t == HB_SCRIPT_UNKNOWN;
}

hb_tag_t EXPORT FKBufGetScript(FKBuf* b) {
  return hb_script_to_iso15924_tag(hb_buffer_get_script(b));
}


bool EXPORT FKBufSetDirection(FKBuf* b, i32 dir) {
  switch (dir) {
    case HB_DIRECTION_INVALID:
    case HB_DIRECTION_LTR:
    case HB_DIRECTION_RTL:
    case HB_DIRECTION_TTB:
    case HB_DIRECTION_BTT:
      hb_buffer_set_direction(b, (hb_direction_t)dir);
      return true;
    default:
      return false;
  }
}

i32 EXPORT FKBufGetDirection(FKBuf* b) {
  return (i32)hb_buffer_get_direction(b);
}

void EXPORT FKBufGuessSegmentProps(FKBuf* b) {
  hb_buffer_guess_segment_properties(b);
}


// ---------------------------------------------------------------------------
// Functions for dealing with a buffer representing glyphs


u8* EXPORT FKGlyphInfoStructDesc() {
  // Note: .codepoint is ucp before shape, but glyph id after.
  return StDescEncode(sizeof(hb_glyph_info_t), (const StDescFieldInfo[]){
    StDescField1(hb_glyph_info_t, codepoint, "id", u32),
    StDescField(hb_glyph_info_t, mask, u32),
    StDescField(hb_glyph_info_t, cluster, u32),
    StDescFieldEnd,
  });
}

const hb_glyph_info_t* EXPORT FKBufGlyphInfoPtr(FKBuf* b) {
  // Note: hb_buffer_get_glyph_infos is a very simple and fast function.
  // It just passes on a pointer from an internal struct field.
  const hb_glyph_info_t* info = hb_buffer_get_glyph_infos(b, NULL);
  FKErrSetHB(!!info);
  return info;
}

u32 EXPORT FKBufGlyphInfoLen(FKBuf* b) {
  u32 count = 0;
  if (FKErrSetHB(!!hb_buffer_get_glyph_infos(b, &count))) {
    count = 0;
  }
  return count;
}


u8* EXPORT FKBufGlyphPosStructDesc() {
  /**
   * hb_glyph_position_t:
   * @x_advance: how much the line advances after drawing this glyph when setting
   *             text in horizontal direction.
   * @y_advance: how much the line advances after drawing this glyph when setting
   *             text in vertical direction.
   * @x_offset: how much the glyph moves on the X-axis before drawing it, this
   *            should not affect how much the line advances.
   * @y_offset: how much the glyph moves on the Y-axis before drawing it, this
   *            should not affect how much the line advances.
   *
   * The #hb_glyph_position_t is the structure that holds the positions of the
   * glyph in both horizontal and vertical directions. All positions in
   * #hb_glyph_position_t are relative to the current point.
   */
  return StDescEncode(sizeof(hb_glyph_position_t), (const StDescFieldInfo[]){
    StDescField(hb_glyph_position_t, x_advance, i32),
    StDescField(hb_glyph_position_t, y_advance, i32),
    StDescField(hb_glyph_position_t, x_offset,  i32),
    StDescField(hb_glyph_position_t, y_offset,  i32),
    StDescFieldEnd,
  });
}

const hb_glyph_position_t* EXPORT FKBufGlyphPosPtr(FKBuf* b) {
  const hb_glyph_position_t* pos = hb_buffer_get_glyph_positions(b, NULL);
  FKErrSetHB(!!pos);
  return pos;
}

u32 EXPORT FKBufGlyphPosLen(FKBuf* b) {
  u32 count = 0;
  if (FKErrSetHB(!!hb_buffer_get_glyph_positions(b, &count))) {
    count = 0;
  }
  return count;
}

// char glyphname[64];
//     hb_font_get_glyph_name(font, cp, glyphname, sizeof(glyphname));

