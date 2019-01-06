#pragma once
#include <ft2build.h>
#include FT_FREETYPE_H

// FKErrOK == no error
#define FKErrOK 0

// FKErrSetFT sets or clears error from Freetype result.
// Returns true if an error was set; false if no error.
bool FKErrSetFT(FT_Error error);

// FKErrSetHB sets or clears error from Harfbuzz result.
// Returns true if an error was set; false if no error.
bool FKErrSetHB(bool ok);

// FKErrSetHBStr works like FKErrSetHB but sets error message to `msg`
// msg must be long-lived.
bool FKErrSetHBStr(bool ok, const char* msg);

// clear error state
// sets code to FKErrOK and message to ""
void FKErrClear();

// read code
u32 FKErrGetCode();

// read message
const char* FKErrGetMsg();
