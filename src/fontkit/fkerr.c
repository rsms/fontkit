#include "common.h"
#include "fkerr.h"

#undef __FTERRORS_H__
#define FT_ERRORDEF( e, v, s )  { e, s },
#define FT_ERROR_START_LIST     {
#define FT_ERROR_END_LIST       { 0, 0 } };
const struct {
    int          code;
    const char*  message;
} FT_Errors[] =
#include FT_ERRORS_H


static u32         errcode = 0;
static const char* errmsg = "";
static bool        free_errmsg = false;


u32 EXPORT FKErrGetCode() {
  return errcode;
}

const char* EXPORT FKErrGetMsg() {
  return errmsg;
}


void EXPORT FKErrClear() {
  errcode = 0;
  if (free_errmsg) {
    free((void*)errmsg);
    free_errmsg = false;
  }
  errmsg = NULL;
}


bool FKErrSetFT(FT_Error error) {
  FKErrClear();
  if (error != FT_Err_Ok) {
    errcode = FT_Errors[error].code;
    errmsg = FT_Errors[error].message;
    return true;
  }
  return false;
}


bool FKErrSetHB(bool ok) {
  // Note: Harfbuzz does not have the concept of errors, only "success".
  return FKErrSetHBStr(ok, "harfbuzz failure");
}


bool FKErrSetHBStr(bool ok, const char* msg) {
  FKErrClear();
  if (!ok) {
    errcode = 1;
    errmsg = msg;
    return true;
  }
  return false;
}
