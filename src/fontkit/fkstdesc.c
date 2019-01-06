#include "common.h"
#include "fkstdesc.h"

u8* StDescEncode(size_t structsize, const StDescFieldInfo* fields) {
  assert(structsize <= 0xffff);

  // calculate size needed for buffer and count fields
  size_t bufsize = 2 + 1; // size + nfields
  u8 nfields = 0;
  for (size_t i = 0; i < 0x100; i++) {
    if (fields[i].type == 0) {
      break;
    }
    assert(i < 0xff); // nfields is u8
    // offset + namelen + type + <namebytes>
    bufsize += 2 + 1 + 1 + fields[i].namelen;
    nfields++;
  }

  // allocate memory
  u8* buf = (u8*)malloc(bufsize);
  u8* bufp = buf;

  // struct size
  ((u16*)bufp)[0] = (u16)structsize;
  bufp += 2;

  // fields
  *(bufp++) = nfields;
  for (u8 i = 0; i < nfields; i++) {
    const StDescFieldInfo* field = &fields[i];

    ((u16*)bufp)[0] = field->offs;
    bufp += 2;

    *(bufp++) = field->type;
    
    *(bufp++) = field->namelen;

    memcpy((void*)bufp, (const void*)field->namestr, field->namelen);
    bufp += field->namelen;
  }

  assert(bufp - buf == bufsize);

  return buf;
}
