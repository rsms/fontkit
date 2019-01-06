#pragma once
#include "common.h"
#include <freetype/ftmm.h>

typedef struct _FKFont FKFont;

typedef struct _FKVar {
  FKFont*    f; // weak; parent
  FT_MM_Var* m;
} FKVar;

FKVar* FKVarNew(FKFont*);
void FKVarFree(FKVar*);

// FKVarGetStyleCount returns the number of variations of a variable font.
// Returns 0 if the font is not variable.
//
u32 FKVarGetStyleCount(FKVar*);

u32 FKVarGetStyleName(FKVar*, u32 vi, const char** ppch);

// FKVarGetAxisCount returns the number of axes in a variable font.
//
u32 FKVarGetAxisCount(FKVar*);


u32 FKVarGetAxisName(FKVar*, u32 ai, const char** ppch);

// FKVarGetAxisRange retrieves the extremum of the axis and stores them
// into minv and maxv. Returns the default value of the axis.
//
long FKVarGetAxisRange(FKVar*, u32 ai, /*out*/long* minv, /*out*/long* maxv);

/*    This type is used to store 16.16 fixed-point values, like scaling  */
/*    values or matrix coefficients.                                     */
/*                                                                       */
// typedef signed long  FT_Fixed;
