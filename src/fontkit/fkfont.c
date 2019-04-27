#include "common.h"
#include "fontkit-internal.h"
#include "fkerr.h"
#include "fkfont.h"

#include <hb-ft.h>
#include <hb-ot.h>
#include <freetype/ftmm.h>
#include <freetype/ttnameid.h>
#include <freetype/tttables.h>
#include <freetype/ftfntfmt.h>


FKFont* EXPORT FKFontCreate(const FT_Byte* bufptr, unsigned buflen) {
  FKFont* f = malloc(sizeof(FKFont));
  f->face = NULL;
  f->font = NULL;
  f->nameindex = NULL;
  f->vm = NULL;

  // First try loading the first named instance of a variable font
  // if (FKErrSetFT(FT_New_Memory_Face(fk_ftlib, bufptr, buflen, 0x00010000, &f->face))) {
    // if that fails, try loading as non-variable
    if (FKErrSetFT(FT_New_Memory_Face(fk_ftlib, bufptr, buflen, 0, &f->face))) {
      free(f);
      return NULL;
    }
  // }

  // set character size to UPM
  // Note: If we don't set this, layout & shaping will fail.
  if (!FKFontSetCharSize(f, f->face->units_per_EM)) {
    FKFontFree(f);
    return NULL;
  }

  return f;
}


void EXPORT FKFontFree(FKFont* f) {
  if (f->font) {
    hb_font_destroy(f->font);
    f->font = NULL;
  }
  if (f->face) {
    FT_Done_Face(f->face);
    f->face = NULL;
  }
  if (f->nameindex) {
    hb_map_destroy(f->nameindex);
    f->nameindex = NULL;
  }
  if (f->vm) {
    FKVarFree(f->vm);
    f->vm = NULL;
  }
  free(f);
}


// ---- START OF INFO ----


// Properties of FT_Face exposed via accessor functions.
//
//   FKFontGet_<property>(FKFont)
//
// E.g.
//
//   FKFontGet_family_name(FKFont) => char*
//
// See https://www.freetype.org/freetype2/docs/reference/ft2-base_interface.html#FT_FaceRec
#define A(TYPE, NAME) \
  TYPE EXPORT FKFontGet_##NAME(const FKFont* f) { return f->face->NAME; }
#include "fkfont-props.inc"
FK_FONT_PROPS(A)
#undef A

const char* EXPORT FKFontGet_format_name(const FKFont* f) {
  return FT_Get_Font_Format(f->face);
}


bool EXPORT FKFontGetIsSFNT(const FKFont* f) {
  return !!FT_IS_SFNT(f->face);
}

bool EXPORT FKFontGetIsScalable(const FKFont* f) {
  return !!FT_IS_SCALABLE(f->face);
}

bool EXPORT FKFontGetIsMonospace(const FKFont* f) {
  return !!FT_IS_FIXED_WIDTH(f->face);
}

u16 EXPORT FKFontGetWeightClass(const FKFont* f) {
  // get pointer to OS/2 table (table memory owned by f->face)
  const TT_OS2* os2 = (const TT_OS2*)FT_Get_Sfnt_Table(f->face, FT_SFNT_OS2);
  if (!os2) {
    // Note: The FT2 documentation is a little vague on when this retuns NULL.
    // It seems possible that this returns NULL if a table hasn't been loaded
    // from side-effects but actually does exist in the font file.
    // See https://www.freetype.org/freetype2/docs/reference/
    //   ft2-truetype_tables.html#ft_get_sfnt_table
    // See related FT_Load_Sfnt_Table function.
    return 0;
  }
  return os2->usWeightClass;
}

u16 EXPORT FKFontGetWidthClass(const FKFont* f) {
  const TT_OS2* os2 = (const TT_OS2*)FT_Get_Sfnt_Table(f->face, FT_SFNT_OS2);
  if (!os2) {
    return 0;
  }
  return os2->usWidthClass;
}

i16 EXPORT FKFontGetXHeight(const FKFont* f) {
  const TT_OS2* os2 = (const TT_OS2*)FT_Get_Sfnt_Table(f->face, FT_SFNT_OS2);
  if (!os2 || os2->version < 2) {
    return 0;
  }
  return os2->sxHeight;
}

i16 EXPORT FKFontGetCapHeight(const FKFont* f) {
  const TT_OS2* os2 = (const TT_OS2*)FT_Get_Sfnt_Table(f->face, FT_SFNT_OS2);
  if (!os2 || os2->version < 2) {
    return 0;
  }
  return os2->sCapHeight;
}

const char* EXPORT FKFontGetVendorID(const FKFont* f) {
  const TT_OS2* os2 = (const TT_OS2*)FT_Get_Sfnt_Table(f->face, FT_SFNT_OS2);
  if (!os2 || os2->version < 2) {
    return NULL;
  }
  return (const char*)&os2->achVendID[0];
}



// ---- END OF INFO ----


// Set character size
bool EXPORT FKFontSetCharSize(const FKFont* f, long size) {
  return !FKErrSetFT(FT_Set_Char_Size(f->face, size, size, 0, 0));
}


hb_font_t* FKFontGetHB(FKFont* f) {
  if (!f->font) {
    f->font = hb_ft_font_create_referenced(f->face);
  }
  return f->font;
}


i32 EXPORT FKFontGetGlyphAdvance(FKFont* f, FKGlyphID g) {
  return hb_font_get_glyph_h_advance(FKFontGetHB(f), g);
}

i32 EXPORT FKFontGetGlyphKerning(FKFont* f, FKGlyphID left, FKGlyphID right) {
  return hb_font_get_glyph_h_kerning(FKFontGetHB(f), left, right);
}

bool EXPORT FKFontGetGlyphName(FKFont* f, FKGlyphID g, char* pch, u32 size) {
  return !FKErrSetHB(hb_font_get_glyph_name(FKFontGetHB(f), g, pch, size));
}


bool EXPORT FKFontLayout(
  FKFont* f,
  FKBuf* buf,
  hb_feature_t* featptr,
  u32 featcount
) {
  // hb_feature_t features[] = {
  //   {HB_TAG('l','i','g','a'), 1, 0, (unsigned)-1},
  //   {HB_TAG('c','a','l','t'), 2, 0, (unsigned)-1},
  // };
  // featcount = sizeof(features) / sizeof(hb_feature_t);
  // featptr = features;

  hb_buffer_t* buffer = FKBufGetHBBuf(buf);
  hb_buffer_guess_segment_properties(buffer);

  // shape
  // Note: the difference between hb_shape is simply a convenience function
  // around hb_shape_full that passes NULL for the shaper list.
  // hb_shape_full returns the status of hb_shape_plan_execute.
  // Sets buffer->content_type = HB_BUFFER_CONTENT_TYPE_GLYPHS on success.
  hb_font_t* font = FKFontGetHB(f);
  if (FKErrSetHB(hb_shape_full(font, buffer, featptr, featcount, NULL))) {
    return false;
  }

  return true;
}


static void _FKFontBuildNameIndex(FKFont* f, /*out*/FT_SfntName* n) {
  assert(f->nameindex == NULL);
  f->nameindex = hb_map_create();

  u16 platform = 0xFFFF;
  u16 encoding = 0xFFFF;
  u32 namecount = FT_Get_Sfnt_Name_Count(f->face);

  // Note: The special value HB_MAP_VALUE_INVALID is used by hb_map_get
  // to indicate "not found" and thus it can't be used for the actual value.
  // However, since HB_MAP_VALUE_INVALID==UINT32_MAX and namecount is u32,
  // it's not actually possible for us to store HB_MAP_VALUE_INVALID as the
  // value, since the variable `i` would never reach that far.

  for (u32 i = 0; i < namecount; i++) {
    if (FT_Get_Sfnt_Name(f->face, i, n) != 0) {
      continue;
    }

    if (encoding == 0xFFFF) {
      // stick to first platform & encoding encountered
      platform = n->platform_id;
      encoding = n->encoding_id;
    } else if (encoding != n->encoding_id || platform != n->platform_id) {
      continue;
    }

    hb_map_set(f->nameindex, n->name_id, i);
  }
}


bool FKFontGetName(FKFont* f, u32 strid, /*out*/FT_SfntName* name) {
  if (!f->nameindex) {
    // printf("_FKFontBuildNameIndex\n");
    _FKFontBuildNameIndex(f, name);
  }
  u32 index = hb_map_get(f->nameindex, strid);
  if (index == HB_MAP_VALUE_INVALID) {
    name->string_len = 0;
    return false;
  }
  return FT_Get_Sfnt_Name(f->face, index, name) == 0;
}


// _FKFontGetNameStr is NOT thread safe and NOT recursion safe.
// It calls FKFontGetName with a single shared global struct for which a
// pointer is returned. The returned pointer is only valid until the next
// call to this function.
//
static const FT_SfntName* _FKFontGetNameStr(FKFont* f, u32 strid) {
  static FT_SfntName name;
  FKFontGetName(f, strid, &name);
  return &name;
}


// Like _FKFontGetNameStr but returns a nul-terminated string.
//
static const char* _FKFontGetNameCStr(FKFont* f, u32 strid) {
  static char buf[512];
  const FT_SfntName* name = _FKFontGetNameStr(f, strid);
  const u32 z = min(countof(buf)-1, name->string_len);
  memcpy(buf, name->string, z);
  buf[z] = 0;
  return buf;
}


FKVar* EXPORT FKFontGetVar(FKFont* f) {
  if (!f->vm) {
    f->vm = FKVarNew(f);
  }
  // vm->m==NULL if font is not variable
  return f->vm->m ? f->vm : NULL;
}


u32 EXPORT FKFontFeatures(FKFont* f) {
  FKVar* v = FKFontGetVar(f);
  if (!v) {
    return 0;  // not variable
  }
  FT_MM_Var* m = v->m;

  printf(
    "[FKFontFeatures] "
    "font is variable;\n"
    "  num_designs:     %u\n"
    "  num_namedstyles: %u\n"
    "  num_axis:        %u\n"
    ,
    m->num_designs == 0xFFFFFFFF ? 0 : m->num_designs,
    m->num_namedstyles,
    m->num_axis
  );

  printf("FT_Get_Sfnt_Name_Count() => %u\n",
    FT_Get_Sfnt_Name_Count(f->face));

  for (u32 i = 0; i < m->num_namedstyles; i++) {
    FT_Var_Named_Style* style = &m->namedstyle[i];

    const char* name = _FKFontGetNameCStr(f, style->strid);
    printf("  namedstyle: \"%s\" (strid: %u)", name, style->strid);

    if (style->psid != 0xFFFF) {
      printf("  psname: \"%s\" (psid: %u)",
        _FKFontGetNameCStr(f, style->psid),
        style->psid);
    }

    printf("\n");
  }

  printf("axes:\n");
  for (u32 i = 0; i < m->num_axis; i++) {
    FT_Var_Axis* a = &m->axis[i];

    // The FT manual says the foloowing about "strid":
    //   The axis name entry in the font's ‘name’ table. This is another
    //   (and often better) version of the ‘name’ field for TrueType GX or
    //   OpenType variation fonts. Not meaningful for Adobe MM fonts.
    //
    FT_SfntName name;
    FKFontGetName(f, a->strid, &name);

    printf(
      "  name1: \"%s\" range: [%ld–%ld], default: %ld, "
      "tag: %lu, name2: \"%.*s\"\n",
      a->name,
      a->minimum,
      a->maximum,
      a->def,
      a->tag,
      (int)name.string_len, (const char*)name.string
    );
  }

  return 0;
}


// Return the glyph index of a given glyph name
// FT_EXPORT( FT_UInt )
//   FT_Get_Name_Index( FT_Face     face,
//                      FT_String*  glyph_name );


// List all available platforms and charmaps for the font face:
// for (int i = 0; i < f->face->num_charmaps; i++) {
//   FT_CharMap cm = f->face->charmaps[i];
//   printf("face charmap #%d platform: %s, encoding: %s\n",
//     i,
//     ftPlatformName(cm->platform_id),
//     ftEncodingName(cm->platform_id, cm->encoding_id)
//   );
// }


// void EXPORT FKFontFeatures(FKFont* f) {

//   hb_font_t* font = FKFontGetHB(f);
//   hb_face_t* face = hb_font_get_face(font);

//   u32 table_count = 64;
//   hb_tag_t table_tags[table_count];

//   u32 ntables = hb_face_get_table_tags(face, 0, &table_count, table_tags);

//   // Note: Most OT features are defined in HB_OT_TAG_GSUB

//   for (u32 i = 0; i < ntables; i++) {
//     hb_tag_t table_tag = table_tags[i];

//     // hb_ot_layout_collect_features
//     // - if scripts==NULL, get for all scripts
//     // - if languages==NULL, get for all languages
//     // - if features==NULL, get all features
//     hb_set_t* feature_indexes = hb_set_create();
//     hb_ot_layout_collect_features(
//       face,
//       table_tags[i],
//       NULL,
//       NULL,
//       NULL,
//       feature_indexes
//     );

//     char tagstr[] = {0,0,0,0,0};
//     hb_tag_to_string(table_tag, tagstr);
//     printf("table_tag: %s, features:\n", tagstr);

//     hb_codepoint_t feature_index = HB_SET_VALUE_INVALID;
//     while (hb_set_next(feature_indexes, &feature_index)) {
//       printf("  feature_index: %u\n", feature_index);
//       // ...
//     }

//     hb_set_destroy(feature_indexes);
//   }

//   // ---------------------
//   // feat

//   u32 script_index = HB_OT_LAYOUT_NO_SCRIPT_INDEX;
//   u32 language_index = HB_OT_LAYOUT_DEFAULT_LANGUAGE_INDEX;
//   u32 start_offset = 0;
//   u32 feature_count = 64;
//   hb_tag_t feature_tags[feature_count];

//   unsigned int ret = hb_ot_layout_language_get_feature_tags(
//     face,
//     HB_OT_TAG_GSUB,
//     script_index,
//     language_index,
//     start_offset,
//     &feature_count,
//     feature_tags
//   );
//   printf("hb_ot_layout_language_get_feature_tags => %u\n", ret);
//   printf("feature_count => %u\n", feature_count);

//   // ---------------------
//   // cvXX

//   // read feature info name IDs
//   hb_ot_name_id_t label_id = 0;
//   hb_ot_name_id_t tooltip_id = 0;
//   hb_ot_name_id_t sample_id = 0;
//   hb_ot_name_id_t first_param_id = 0;
//   u32 num_named_parameters = 0;

//   hb_bool_t ok = hb_ot_layout_feature_get_name_ids(
//     face,
//     HB_OT_TAG_GSUB,
//     1,
//     &label_id             /* OUT. May be NULL */,
//     &tooltip_id           /* OUT. May be NULL */,
//     &sample_id            /* OUT. May be NULL */,
//     &num_named_parameters /* OUT. May be NULL */,
//     &first_param_id       /* OUT. May be NULL */
//   );
//   if (!ok) {
//     printf("  (failed to get_name_ids)\n");
//   }
//   printf(
//     "label_id=%u\n"
//     "tooltip_id=%u\n"
//     "sample_id=%u\n"
//     "first_param_id=%u\n"
//     "num_named_parameters=%u\n"
//     ,
//     label_id,
//     tooltip_id,
//     sample_id,
//     first_param_id,
//     num_named_parameters
//   );

//   hb_language_t language = HB_LANGUAGE_INVALID;

//   char buf[4096];
//   u32 buflen = sizeof(buf);

//   hb_ot_name_get_utf8(
//     face,
//     label_id,
//     language,
//     &buflen /* IN/OUT */,
//     buf      /* OUT */
//   );
//   // Note: There's also hb_ot_name_get_utf16 and 32

//   printf("  name: %.*s\n", (int)buflen, buf);
// }
