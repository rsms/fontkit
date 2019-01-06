#include "common.h"
#include "fontkit-internal.h"
#include "fkerr.h"
// #include "fkbuf.h"
// #include "fkfont.h"

// #include <hb-ft.h>
// #include <hb-ot.h>

FT_Library fk_ftlib;


// typedef struct _FKFeats {
//   u32           len;
//   hb_feature_t* ptr;
// } FKFeats;


// FKFeats* EXPORT FKFeatsCreate(const hb_tag_t* hbtags, bool values, u32 len) {
//   FKFeats* feats = malloc(sizeof(FKFeats));
//   feats->len = 0;
//   feats->ptr = NULL;

//   // #define HB_TAG(c1,c2,c3,c4) ((hb_tag_t)((((uint8_t)(c1))<<24)|(((uint8_t)(c2))<<16)|(((uint8_t)(c3))<<8)|((uint8_t)(c4))))

//   hb_feature_t features[] = {
//     {HB_TAG('l','i','g','a'), 1, 0, (unsigned)-1},
//     {HB_TAG('c','a','l','t'), 1, 0, (unsigned)-1},
//   };

//   return feats;
// }



void __attribute__((constructor)) init() {
  FKErrSetFT(FT_Init_FreeType(&fk_ftlib));
  // Note: check FKErrGetCode() at startup
  printf("FK INIT\n");
}



/*bool EXPORT FKDemo1(const FT_Byte* bufptr, unsigned buflen) {
  FT_Error error;
  FT_Face face;

  // foo();

  if (FKErrSetFT(FT_New_Memory_Face(fk_ftlib, bufptr, buflen, 0, &face))) {
    return false;
  }

  FT_F26Dot6 upm = face->units_per_EM;
  if (FKErrSetFT(FT_Set_Char_Size(face, upm, upm, 0, 0))) {
    return false;
  }

  printf(
    "loaded '%s' style: '%s', num_faces: %ld, UPM: %u"
    ", ascender: %d, descender: %d, height: %d"
    ", underline_position: %d, underline_thickness: %d"
    "\n"
    ,
    face->family_name, face->style_name, face->num_faces, face->units_per_EM,
    face->ascender, face->descender, face->height,
    face->underline_position, face->underline_thickness);

  // if (FT_HAS_KERNING(face)) {
  //   puts("FreeType found kerning. Found 'kern' table.");
  // } else {
  //   puts("FreeType did not find kerning. (no 'kern' table)");
  // }

  hb_font_t* font = hb_ft_font_create(face, NULL);
  if (font == NULL) { puts("hb_ft_font_create failed"); return 1; }



  // Create hb-buffer and populate.
  hb_buffer_t *buffer;
  buffer = hb_buffer_create();
  // hb_buffer_reset(buffer.get()); // reuseable
  hb_buffer_set_cluster_level(buffer, HB_BUFFER_CLUSTER_LEVEL_MONOTONE_CHARACTERS);
  hb_buffer_set_direction(buffer, HB_DIRECTION_LTR);
  hb_buffer_add_utf8(buffer, "-aA-TäTeMe", -1, 0, -1);
  hb_buffer_guess_segment_properties(buffer);
  
  // Shape it!
  // hb_shape(font, buffer, NULL, 0);

  hb_feature_t features[] = {
    {HB_TAG('l','i','g','a'), 1, 0, (unsigned)-1},
    {HB_TAG('c','a','l','t'), 1, 0, (unsigned)-1},
  };
  unsigned nfeatures = sizeof(features) / sizeof(hb_feature_t);

  // hb_bool_t ok;
  // ok = hb_shape_full(font, buffer, features, nfeatures, NULL);
  // if (!ok) { puts("hb_shape_full failed"); return 1; }
  hb_shape(font, buffer, features, nfeatures);

  u32 infoCount = 0;
  const hb_glyph_info_t* info = hb_buffer_get_glyph_infos(
    buffer, &infoCount);
  if (!info) { puts("hb_buffer_get_glyph_infos failed"); return 1; }

  u32 posCount = 0;
  const hb_glyph_position_t* pos = hb_buffer_get_glyph_positions(
    buffer, &posCount);
  if (!pos) { puts("hb_buffer_get_glyph_positions failed"); return 1; }

  for (unsigned i = 0; i < infoCount; ++i) {
    hb_codepoint_t cp = info[i].codepoint;
    unsigned cluster = info[i].cluster;
    hb_position_t advance = pos[i].x_advance;
    // ((pos[i].x_advance / face->charSize()) + tracking) * fontSize

    hb_position_t unkernedAdvance = hb_font_get_glyph_h_advance(font, cp);
    int kerning = (int)advance - (int)unkernedAdvance;

    char glyphname[64];
    hb_font_get_glyph_name(font, cp, glyphname, sizeof(glyphname));

    printf(
      "glyph#%d '%s' U+%04X  cluster: %d, advance: %u, kerning: %d"
      "\n",
      i, glyphname, cp, cluster, advance, kerning
    );
  }

  hb_buffer_destroy(buffer);
  hb_font_destroy(font);

  FT_Done_Face(face);

  // Note on kerning: Both hb_font_get_glyph_h_kerning and
  // hb_font_get_glyph_kerning_for_direction returns zero even for pairs that
  // do have kerning, for which shape returns kerning info. No idea why.

  return 0;
}*/


// FT_Size_RequestRec req;
// // req.type = FT_SIZE_REQUEST_TYPE_REAL_DIM;
// req.type = FT_SIZE_REQUEST_TYPE_NOMINAL;
// req.width = 0;
// req.height = 12;
// req.horiResolution = 0;
// req.vertResolution = 0;
// FT_Request_Size(font->face, &req);
// // FT_Long  width;
// // FT_Long  height;
// // FT_UInt  horiResolution;
// // FT_UInt  vertResolution;
// printf(
//   "FT_Request_Size() => %d"
//   "\n  width = %d"
//   "\n  height = %d"
//   "\n  horiResolution = %d"
//   "\n  vertResolution = %d"
//   "\n"
//   ,
//   req.width,
//   req.height,
//   req.horiResolution,
//   req.vertResolution
// );


