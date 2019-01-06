// FKError represents a fontkit error
//
export class FKError extends Error {
  constructor(code, message, file, line) {
    if (code === undefined) {
      code = _FKErrGetCode()
      const msgptr = _FKErrGetMsg()
      message = msgptr != 0 ? UTF8ArrayToString(HEAPU8, msgptr) : ""
      file = "fontkit.wasm"
      line = 0
      _FKErrClear()
    }
    super(message, file, line)
    this.name = "FKError"
    this.code = code
  }
}
