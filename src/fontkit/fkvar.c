#include "common.h"
#include "fontkit-internal.h"
#include "fkerr.h"
#include "fkvar.h"
#include "fkfont.h"

#include <hb-ft.h>
#include <hb-ot.h>


FKVar* FKVarNew(FKFont* f) {
  FKVar* v = malloc(sizeof(FKVar));
  v->f = f;
  if (FT_Get_MM_Var(f->face, &v->m) != FT_Err_Ok) {
    v->m = NULL;
  }
  return v;
}


void FKVarFree(FKVar* v) {
  if (v->m) {
    FT_Done_MM_Var(fk_ftlib, v->m);
    v->m = NULL;
  }
  free(v);
}


u32 EXPORT FKVarGetStyleCount(FKVar* v) {
  return v->m->num_namedstyles;
}


u32 EXPORT FKVarGetStyleName(FKVar* v, u32 vi, const char** ppch) {
  FT_Var_Named_Style* style = &v->m->namedstyle[vi];
  FT_SfntName name;
  if (!FKFontGetName(v->f, style->strid, &name)) {
    name.string_len = 0;
  }
  *ppch = (const char*)name.string;
  return name.string_len;
}


u32 EXPORT FKVarGetAxisCount(FKVar* v) {
  return v->m->num_axis;
}


u32 EXPORT FKVarGetAxisName(FKVar* v, u32 ai, const char** ppch) {
  FT_Var_Axis* axis = &v->m->axis[ai];
  if (axis->strid != 0xFFFFFFFF) {
    FT_SfntName name;
    if (FKFontGetName(v->f, axis->strid, &name)) {
      *ppch = (const char*)name.string;
      return name.string_len;
    }
  }
  *ppch = axis->name;
  return (u32)strlen(axis->name);
}


long EXPORT FKVarGetAxisRange(FKVar* v, u32 ai, long* minv, long* maxv) {
  FT_Var_Axis* a = &v->m->axis[ai];
  *minv = a->minimum;
  *maxv = a->maximum;
  return a->def;
}
