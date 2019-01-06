#pragma once
#include <stdlib.h>
#include <string.h>
#include <assert.h>
#include <emscripten/emscripten.h>
#include <hb.h> /* contains int definitions */
#include <ft2build.h>
#include FT_FREETYPE_H

#define EXPORT EMSCRIPTEN_KEEPALIVE

typedef uint8_t  bool;
typedef uint8_t  u8;
typedef uint16_t u16;
typedef uint32_t u32;
typedef int32_t  i32;

#ifndef TRUE
  #define TRUE 1
#endif
#ifndef FALSE
  #define FALSE 0
#endif

#define true TRUE
#define false FALSE

#ifndef static_assert
  #if __has_feature(c_static_assert)
    #define static_assert _Static_assert
  #else
    #define static_assert(cond, msg) ((void*)0)
  #endif
#endif

#define max(a,b) \
  ({__typeof__ (a) _a = (a); \
    __typeof__ (b) _b = (b); \
    _a > _b ? _a : _b; })

#define min(a,b) \
  ({__typeof__ (a) _a = (a); \
     __typeof__ (b) _b = (b); \
     _a < _b ? _a : _b; })

#define countof(x) \
  ((sizeof(x)/sizeof(0[x])) / ((size_t)(!(sizeof(x) % sizeof(0[x])))))

typedef hb_codepoint_t FKGlyphID; // glyph index
typedef hb_codepoint_t FKCodepoint; // unicode codepoint
