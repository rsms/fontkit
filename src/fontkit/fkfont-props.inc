
// fields of FT_FaceRec

#define FK_FONT_PROPS(_) \
\
_(FT_Long, num_faces) \
_(FT_Long, face_index) \
\
_(FT_Long, face_flags) \
_(FT_Long, style_flags) \
\
_(FT_Long, num_glyphs) \
\
_(const FT_String*, family_name) \
_(const FT_String*, style_name) \
\
_(FT_Int,          num_fixed_sizes) \
/* _(FT_Bitmap_Size*, available_sizes) */ \
\
_(FT_Int,      num_charmaps) \
/*_(FT_CharMap*, charmaps)*/ \
\
/* The following member variables (down to `underline_thickness') */ \
/* are only relevant to scalable outlines; cf. @FT_Bitmap_Size    */ \
/* for bitmap fonts.                                              */ \
\
/*FT_BBox bbox;*/ \
\
_(FT_UShort, units_per_EM) \
_(FT_Short,  ascender) \
_(FT_Short,  descender) \
_(FT_Short,  height) \
\
_(FT_Short, max_advance_width) \
_(FT_Short, max_advance_height) \
\
_(FT_Short, underline_position) \
_(FT_Short, underline_thickness) \


// FT_GlyphSlot glyph;
// FT_Size      size;
// FT_CharMap   charmap;

