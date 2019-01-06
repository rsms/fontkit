import { ureadU16, ureadI16, ureadU32, ureadI32, asciicstr } from './fkutil'

class StructDesc {
  constructor(size, fields) {
    this.size = size
    this.fields = fields

    for (let fname in fields) {
      const field = fields[fname]
      const foffset = field.offset

      switch (field.type) {
        case 0x01: // u8
          field.read = (stptr) => HEAPU8[stptr + foffset]
          field.readv = (stptr, stindex) =>
            HEAPU8[stptr + (stindex * this.size) + foffset]
          break

        case 0x02: // i8
          field.read = (stptr) => HEAP8[stptr + foffset]
          field.readv = (stptr, stindex) =>
            HEAP8[stptr + (stindex * this.size) + foffset]
          break

        case 0x03: // u16
          field.read = (stptr) => ureadU16(HEAPU8, stptr + foffset)
          field.readv = (stptr, stindex) =>
            ureadU16(HEAPU8, stptr + (stindex * this.size) + foffset)
          break

        case 0x04: // i16
          field.read = (stptr) => ureadI16(HEAPU8, stptr + foffset)
          field.readv = (stptr, stindex) =>
            ureadI16(HEAPU8, stptr + (stindex * this.size) + foffset)
          break

        case 0x05: // u32
        case 0x20: // address (u32 on wasm and asm.js)
          field.read = (stptr) => ureadU32(HEAPU8, stptr + foffset)
          field.readv = (stptr, stindex) =>
            ureadU32(HEAPU8, stptr + (stindex * this.size) + foffset)
          break

        case 0x06: // i32
          field.read = (stptr) => ureadI32(HEAPU8, stptr + foffset)
          field.readv = (stptr, stindex) =>
            ureadI32(HEAPU8, stptr + (stindex * this.size) + foffset)
          break

        case 0x30: // null-terminated string
          field.read = (stptr) => asciicstr(HEAPU8, stptr + foffset)
          field.readv = (stptr, stindex) =>
            asciicstr(HEAPU8, stptr + (stindex * this.size) + foffset)
          break

        default:
          throw new Error(`unexpected type 0x${field.type.toString(16)}`)
      }
    } // for each field
  }
}

function StDescParseBuf(buf, offs) {
  let p = offs

  const size = ureadU16(buf, p)
  p += 2
  let nfields = buf[p++]
  const fields = Object.create(null)

  while (nfields--) {
    const offset = ureadU16(buf, p)
    p += 2
    const type = buf[p++]
    let namelen = buf[p++]
    let name = ''
    while (namelen--) {
      name += String.fromCharCode(buf[p++])
    }
    fields[name] = { offset, type }
  }

  return new StructDesc(size, fields)
}


export function StDescParse(ptr) {
  const r = StDescParseBuf(HEAPU8, ptr)
  _free(ptr)
  return r
}
