#pragma once
//
// StDesc describes memory structures.
//
// Encoding:
//
//   Struct  = size nfields field*
//   size    = <u16>  -- size in bytes of entire struct
//   nfields = <u8>
//
//   field   = offset type namelen namestr
//   offset  = <u16>
//   type    = t_u8 | t_i8 | t_u16 | t_i16 | t_u32 | t_i32 | t_u64 | t_i64
//           | t_ptr | t_cstr
//   namelen = <u8>
//   namestr = <u8>*  -- count is namelen
//
//   t_u8    = 0x01
//   t_i8    = 0x02
//   t_u16   = 0x03
//   t_i16   = 0x04
//   t_u32   = 0x05
//   t_i32   = 0x06
//   t_u64   = 0x07
//   t_i64   = 0x08
//   t_ptr   = 0x20  -- address (arch dependent size)
//   t_cstr  = 0x30  -- null-terminated string of bytes
//

// type
enum StDescType {
  StDesc_u8    = (u8)0x01,
  StDesc_i8    = (u8)0x02,
  StDesc_u16   = (u8)0x03,
  StDesc_i16   = (u8)0x04,
  StDesc_u32   = (u8)0x05,
  StDesc_i32   = (u8)0x06,
  StDesc_u64   = (u8)0x07,
  StDesc_i64   = (u8)0x08,
  StDesc_ptr   = (u8)0x20,  // address (arch dependent size)
  StDesc_cstr  = (u8)0x30,  // zero-terminated string of bytes
};

// field
typedef struct _StDescFieldInfo {
  u16         offs;
  u8          type;
  u8          namelen;
  const char* namestr;
} StDescFieldInfo;

// convenience macros for defining fields
// StDescField1(id struct, const char* field, const char* export_name, id type)
// StDescField(id struct, const char* field_and_export_name, id type)
//
#define StDescField1(STRUCT, FIELD, EXPORT_NAME, TYPE) { \
  ({ \
    static_assert(offsetof(STRUCT, FIELD) <= 0xffff, "struct too large"); \
    (u16)offsetof(STRUCT, FIELD); \
  }), \
  StDesc_##TYPE, \
  (u8)min(0xFF, strlen(EXPORT_NAME)), \
  EXPORT_NAME \
}
#define StDescField(STRUCT, FIELD_AND_EXPORT_NAME, TYPE) \
  StDescField1(STRUCT, FIELD_AND_EXPORT_NAME, #FIELD_AND_EXPORT_NAME, TYPE)


// field array sentinel
#define StDescFieldEnd {0,0,0,NULL}

// StDescEncode encodes a struct of structsize with fields.
// Returns a heap-allocated byte array that should be free()'d when
// no longer needed.
// 
u8* StDescEncode(size_t structsize, const StDescFieldInfo* fields);
