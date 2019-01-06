(function(exports){"use strict";

let IS_NODEJS_LIKE = typeof process === "object" && typeof require === "function";

let Path, Fs;

if (IS_NODEJS_LIKE) {
  try {
    Path = require("path");
    Fs = require("fs");
  } catch (_) {
    IS_NODEJS_LIKE = false;
  }
}

let orig_module;

if (typeof module != "undefined") {
  orig_module = module;
  module = undefined;
}

function emptyfun() {}

var Module = {
  preRun: [],
  postRun: [],
  print(text) {
    console.log.apply(console, Array.prototype.slice.call(arguments));
  },
  printErr(text) {
    console.error.apply(console, Array.prototype.slice.call(arguments));
  }
};

Module.ready = new Promise((resolve, reject) => {
  Module.onRuntimeInitialized = (() => {
    asm = Module["asm"];
    if (typeof define == "function") {
      define("fontkit", exports);
    }
    resolve();
  });
});

if (IS_NODEJS_LIKE) {
  Module.locateFile = function(name) {
    return Path.join(__dirname, name);
  };
}

Module["print"] = function(msg) {
  console.log("[wasm log] " + msg);
};

Module["printErr"] = function(msg) {
  console.error("[wasm err] " + msg);
};

var Module = typeof Module !== "undefined" ? Module : {};

var moduleOverrides = {};

var key;

for (key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}

Module["arguments"] = [];

Module["thisProgram"] = "./this.program";

Module["quit"] = function(status, toThrow) {
  throw toThrow;
};

Module["preRun"] = [];

Module["postRun"] = [];

var ENVIRONMENT_IS_WEB = false;

var ENVIRONMENT_IS_WORKER = false;

var ENVIRONMENT_IS_NODE = false;

var ENVIRONMENT_IS_SHELL = false;

ENVIRONMENT_IS_WEB = typeof window === "object";

ENVIRONMENT_IS_WORKER = typeof importScripts === "function";

ENVIRONMENT_IS_NODE = typeof process === "object" && typeof require === "function" && !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_WORKER;

ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;

if (Module["ENVIRONMENT"]) {
  throw new Error("Module.ENVIRONMENT has been deprecated. To force the environment, use the ENVIRONMENT compile-time option (for example, -s ENVIRONMENT=web or -s ENVIRONMENT=node)");
}

var scriptDirectory = "";

function locateFile(path) {
  if (Module["locateFile"]) {
    return Module["locateFile"](path, scriptDirectory);
  } else {
    return scriptDirectory + path;
  }
}

if (ENVIRONMENT_IS_NODE) {
  scriptDirectory = __dirname + "/";
  var nodeFS;
  var nodePath;
  Module["read"] = function shell_read(filename, binary) {
    var ret;
    if (!nodeFS) nodeFS = require("fs");
    if (!nodePath) nodePath = require("path");
    filename = nodePath["normalize"](filename);
    ret = nodeFS["readFileSync"](filename);
    return binary ? ret : ret.toString();
  };
  Module["readBinary"] = function readBinary(filename) {
    var ret = Module["read"](filename, true);
    if (!ret.buffer) {
      ret = new Uint8Array(ret);
    }
    assert(ret.buffer);
    return ret;
  };
  if (process["argv"].length > 1) {
    Module["thisProgram"] = process["argv"][1].replace(/\\/g, "/");
  }
  Module["arguments"] = process["argv"].slice(2);
  if (typeof module !== "undefined") {
    module["exports"] = Module;
  }
  process["on"]("uncaughtException", function(ex) {
    if (!(ex instanceof ExitStatus)) {
      throw ex;
    }
  });
  process["on"]("unhandledRejection", abort);
  Module["quit"] = function(status) {
    process["exit"](status);
  };
  Module["inspect"] = function() {
    return "[Emscripten Module object]";
  };
} else if (ENVIRONMENT_IS_SHELL) {
  if (typeof read != "undefined") {
    Module["read"] = function shell_read(f) {
      return read(f);
    };
  }
  Module["readBinary"] = function readBinary(f) {
    var data;
    if (typeof readbuffer === "function") {
      return new Uint8Array(readbuffer(f));
    }
    data = read(f, "binary");
    assert(typeof data === "object");
    return data;
  };
  if (typeof scriptArgs != "undefined") {
    Module["arguments"] = scriptArgs;
  } else if (typeof arguments != "undefined") {
    Module["arguments"] = arguments;
  }
  if (typeof quit === "function") {
    Module["quit"] = function(status) {
      quit(status);
    };
  }
} else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  if (ENVIRONMENT_IS_WORKER) {
    scriptDirectory = self.location.href;
  } else if (document.currentScript) {
    scriptDirectory = document.currentScript.src;
  }
  if (scriptDirectory.indexOf("blob:") !== 0) {
    scriptDirectory = scriptDirectory.substr(0, scriptDirectory.lastIndexOf("/") + 1);
  } else {
    scriptDirectory = "";
  }
  Module["read"] = function shell_read(url) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, false);
    xhr.send(null);
    return xhr.responseText;
  };
  if (ENVIRONMENT_IS_WORKER) {
    Module["readBinary"] = function readBinary(url) {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", url, false);
      xhr.responseType = "arraybuffer";
      xhr.send(null);
      return new Uint8Array(xhr.response);
    };
  }
  Module["readAsync"] = function readAsync(url, onload, onerror) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.responseType = "arraybuffer";
    xhr.onload = function xhr_onload() {
      if (xhr.status == 200 || xhr.status == 0 && xhr.response) {
        onload(xhr.response);
        return;
      }
      onerror();
    };
    xhr.onerror = onerror;
    xhr.send(null);
  };
  Module["setWindowTitle"] = function(title) {
    document.title = title;
  };
} else {
  throw new Error("environment detection error");
}

var out = Module["print"] || (typeof console !== "undefined" ? console.log.bind(console) : typeof print !== "undefined" ? print : null);

var err = Module["printErr"] || (typeof printErr !== "undefined" ? printErr : typeof console !== "undefined" && console.warn.bind(console) || out);

for (key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}

moduleOverrides = undefined;

assert(typeof Module["memoryInitializerPrefixURL"] === "undefined", "Module.memoryInitializerPrefixURL option was removed, use Module.locateFile instead");

assert(typeof Module["pthreadMainPrefixURL"] === "undefined", "Module.pthreadMainPrefixURL option was removed, use Module.locateFile instead");

assert(typeof Module["cdInitializerPrefixURL"] === "undefined", "Module.cdInitializerPrefixURL option was removed, use Module.locateFile instead");

assert(typeof Module["filePackagePrefixURL"] === "undefined", "Module.filePackagePrefixURL option was removed, use Module.locateFile instead");

var STACK_ALIGN = 16;

stackSave = stackRestore = stackAlloc = function() {
  abort("cannot use the stack before compiled code is ready to run, and has provided stack access");
};

function staticAlloc(size) {
  assert(!staticSealed);
  var ret = STATICTOP;
  STATICTOP = STATICTOP + size + 15 & -16;
  assert(STATICTOP < TOTAL_MEMORY, "not enough memory for static allocation - increase TOTAL_MEMORY");
  return ret;
}

function dynamicAlloc(size) {
  assert(DYNAMICTOP_PTR);
  var ret = HEAP32[DYNAMICTOP_PTR >> 2];
  var end = ret + size + 15 & -16;
  HEAP32[DYNAMICTOP_PTR >> 2] = end;
  if (end >= TOTAL_MEMORY) {
    var success = enlargeMemory();
    if (!success) {
      HEAP32[DYNAMICTOP_PTR >> 2] = ret;
      return 0;
    }
  }
  return ret;
}

function alignMemory(size, factor) {
  if (!factor) factor = STACK_ALIGN;
  var ret = size = Math.ceil(size / factor) * factor;
  return ret;
}

function getNativeTypeSize(type) {
  switch (type) {
   case "i1":
   case "i8":
    return 1;

   case "i16":
    return 2;

   case "i32":
    return 4;

   case "i64":
    return 8;

   case "float":
    return 4;

   case "double":
    return 8;

   default:
    {
      if (type[type.length - 1] === "*") {
        return 4;
      } else if (type[0] === "i") {
        var bits = parseInt(type.substr(1));
        assert(bits % 8 === 0);
        return bits / 8;
      } else {
        return 0;
      }
    }
  }
}

function warnOnce(text) {
  if (!warnOnce.shown) warnOnce.shown = {};
  if (!warnOnce.shown[text]) {
    warnOnce.shown[text] = 1;
    err(text);
  }
}

var asm2wasmImports = {
  "f64-rem": function(x, y) {
    return x % y;
  },
  debugger: function() {
    debugger;
  }
};

var jsCallStartIndex = 1;

var functionPointers = new Array(0);

function addFunction(func, sig) {
  if (typeof sig === "undefined") {
    err("warning: addFunction(): You should provide a wasm function signature string as a second argument. This is not necessary for asm.js and asm2wasm, but is required for the LLVM wasm backend, so it is recommended for full portability.");
  }
  var base = 0;
  for (var i = base; i < base + 0; i++) {
    if (!functionPointers[i]) {
      functionPointers[i] = func;
      return jsCallStartIndex + i;
    }
  }
  throw "Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.";
}

function removeFunction(index) {
  functionPointers[index - jsCallStartIndex] = null;
}

var funcWrappers = {};

function getFuncWrapper(func, sig) {
  if (!func) return;
  assert(sig);
  if (!funcWrappers[sig]) {
    funcWrappers[sig] = {};
  }
  var sigCache = funcWrappers[sig];
  if (!sigCache[func]) {
    if (sig.length === 1) {
      sigCache[func] = function dynCall_wrapper() {
        return dynCall(sig, func);
      };
    } else if (sig.length === 2) {
      sigCache[func] = function dynCall_wrapper(arg) {
        return dynCall(sig, func, [ arg ]);
      };
    } else {
      sigCache[func] = function dynCall_wrapper() {
        return dynCall(sig, func, Array.prototype.slice.call(arguments));
      };
    }
  }
  return sigCache[func];
}

function makeBigInt(low, high, unsigned) {
  return unsigned ? +(low >>> 0) + +(high >>> 0) * 4294967296 : +(low >>> 0) + +(high | 0) * 4294967296;
}

function dynCall(sig, ptr, args) {
  if (args && args.length) {
    assert(args.length == sig.length - 1);
    assert("dynCall_" + sig in Module, "bad function pointer type - no table for sig '" + sig + "'");
    return Module["dynCall_" + sig].apply(null, [ ptr ].concat(args));
  } else {
    assert(sig.length == 1);
    assert("dynCall_" + sig in Module, "bad function pointer type - no table for sig '" + sig + "'");
    return Module["dynCall_" + sig].call(null, ptr);
  }
}

var tempRet0 = 0;

var setTempRet0 = function(value) {
  tempRet0 = value;
};

var getTempRet0 = function() {
  return tempRet0;
};

function getCompilerSetting(name) {
  throw "You must build with -s RETAIN_COMPILER_SETTINGS=1 for getCompilerSetting or emscripten_get_compiler_setting to work";
}

var Runtime = {
  dynCall,
  getTempRet0: function() {
    abort('getTempRet0() is now a top-level function, after removing the Runtime object. Remove "Runtime."');
  },
  staticAlloc: function() {
    abort('staticAlloc() is now a top-level function, after removing the Runtime object. Remove "Runtime."');
  },
  stackAlloc: function() {
    abort('stackAlloc() is now a top-level function, after removing the Runtime object. Remove "Runtime."');
  }
};

var GLOBAL_BASE = 1024;

var ABORT = false;

var EXITSTATUS = 0;

function assert(condition, text) {
  if (!condition) {
    abort("Assertion failed: " + text);
  }
}

var globalScope = this;

function getCFunc(ident) {
  var func = Module["_" + ident];
  assert(func, "Cannot call unknown function " + ident + ", make sure it is exported");
  return func;
}

var JSfuncs = {
  stackSave: function() {
    stackSave();
  },
  stackRestore: function() {
    stackRestore();
  },
  arrayToC: function(arr) {
    var ret = stackAlloc(arr.length);
    writeArrayToMemory(arr, ret);
    return ret;
  },
  stringToC: function(str) {
    var ret = 0;
    if (str !== null && str !== undefined && str !== 0) {
      var len = (str.length << 2) + 1;
      ret = stackAlloc(len);
      stringToUTF8(str, ret, len);
    }
    return ret;
  }
};

var toC = {
  string: JSfuncs["stringToC"],
  array: JSfuncs["arrayToC"]
};

function ccall(ident, returnType, argTypes, args, opts) {
  function convertReturnValue(ret) {
    if (returnType === "string") return Pointer_stringify(ret);
    if (returnType === "boolean") return Boolean(ret);
    return ret;
  }
  var func = getCFunc(ident);
  var cArgs = [];
  var stack = 0;
  assert(returnType !== "array", 'Return type should not be "array".');
  if (args) {
    for (var i = 0; i < args.length; i++) {
      var converter = toC[argTypes[i]];
      if (converter) {
        if (stack === 0) stack = stackSave();
        cArgs[i] = converter(args[i]);
      } else {
        cArgs[i] = args[i];
      }
    }
  }
  var ret = func.apply(null, cArgs);
  ret = convertReturnValue(ret);
  if (stack !== 0) stackRestore(stack);
  return ret;
}

function cwrap(ident, returnType, argTypes, opts) {
  return function() {
    return ccall(ident, returnType, argTypes, arguments, opts);
  };
}

function setValue(ptr, value, type, noSafe) {
  type = type || "i8";
  if (type.charAt(type.length - 1) === "*") type = "i32";
  switch (type) {
   case "i1":
    HEAP8[ptr >> 0] = value;
    break;

   case "i8":
    HEAP8[ptr >> 0] = value;
    break;

   case "i16":
    HEAP16[ptr >> 1] = value;
    break;

   case "i32":
    HEAP32[ptr >> 2] = value;
    break;

   case "i64":
    tempI64 = [ value >>> 0, (tempDouble = value, +Math_abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math_min(+Math_floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0) ], 
    HEAP32[ptr >> 2] = tempI64[0], HEAP32[ptr + 4 >> 2] = tempI64[1];
    break;

   case "float":
    HEAPF32[ptr >> 2] = value;
    break;

   case "double":
    HEAPF64[ptr >> 3] = value;
    break;

   default:
    abort("invalid type for setValue: " + type);
  }
}

function getValue(ptr, type, noSafe) {
  type = type || "i8";
  if (type.charAt(type.length - 1) === "*") type = "i32";
  switch (type) {
   case "i1":
    return HEAP8[ptr >> 0];

   case "i8":
    return HEAP8[ptr >> 0];

   case "i16":
    return HEAP16[ptr >> 1];

   case "i32":
    return HEAP32[ptr >> 2];

   case "i64":
    return HEAP32[ptr >> 2];

   case "float":
    return HEAPF32[ptr >> 2];

   case "double":
    return HEAPF64[ptr >> 3];

   default:
    abort("invalid type for getValue: " + type);
  }
  return null;
}

var ALLOC_NORMAL = 0;

var ALLOC_STACK = 1;

var ALLOC_STATIC = 2;

var ALLOC_DYNAMIC = 3;

var ALLOC_NONE = 4;

function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === "number") {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }
  var singleType = typeof types === "string" ? types : null;
  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [ typeof _malloc === "function" ? _malloc : staticAlloc, stackAlloc, staticAlloc, dynamicAlloc ][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }
  if (zeroinit) {
    var stop;
    ptr = ret;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (;ptr < stop; ptr += 4) {
      HEAP32[ptr >> 2] = 0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[ptr++ >> 0] = 0;
    }
    return ret;
  }
  if (singleType === "i8") {
    if (slab.subarray || slab.slice) {
      HEAPU8.set(slab, ret);
    } else {
      HEAPU8.set(new Uint8Array(slab), ret);
    }
    return ret;
  }
  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];
    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }
    assert(type, "Must know what type to store in allocate!");
    if (type == "i64") type = "i32";
    setValue(ret + i, curr, type);
    if (previousType !== type) {
      typeSize = getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }
  return ret;
}

function getMemory(size) {
  if (!staticSealed) return staticAlloc(size);
  if (!runtimeInitialized) return dynamicAlloc(size);
  return _malloc(size);
}

function Pointer_stringify(ptr, length) {
  if (length === 0 || !ptr) return "";
  var hasUtf = 0;
  var t;
  var i = 0;
  while (1) {
    assert(ptr + i < TOTAL_MEMORY);
    t = HEAPU8[ptr + i >> 0];
    hasUtf |= t;
    if (t == 0 && !length) break;
    i++;
    if (length && i == length) break;
  }
  if (!length) length = i;
  var ret = "";
  if (hasUtf < 128) {
    var MAX_CHUNK = 1024;
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK;
    }
    return ret;
  }
  return UTF8ToString(ptr);
}

function AsciiToString(ptr) {
  var str = "";
  while (1) {
    var ch = HEAP8[ptr++ >> 0];
    if (!ch) return str;
    str += String.fromCharCode(ch);
  }
}

function stringToAscii(str, outPtr) {
  return writeAsciiToMemory(str, outPtr, false);
}

var UTF8Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf8") : undefined;

function UTF8ArrayToString(u8Array, idx) {
  var endPtr = idx;
  while (u8Array[endPtr]) ++endPtr;
  if (endPtr - idx > 16 && u8Array.subarray && UTF8Decoder) {
    return UTF8Decoder.decode(u8Array.subarray(idx, endPtr));
  } else {
    var u0, u1, u2, u3, u4, u5;
    var str = "";
    while (1) {
      u0 = u8Array[idx++];
      if (!u0) return str;
      if (!(u0 & 128)) {
        str += String.fromCharCode(u0);
        continue;
      }
      u1 = u8Array[idx++] & 63;
      if ((u0 & 224) == 192) {
        str += String.fromCharCode((u0 & 31) << 6 | u1);
        continue;
      }
      u2 = u8Array[idx++] & 63;
      if ((u0 & 240) == 224) {
        u0 = (u0 & 15) << 12 | u1 << 6 | u2;
      } else {
        u3 = u8Array[idx++] & 63;
        if ((u0 & 248) == 240) {
          u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | u3;
        } else {
          u4 = u8Array[idx++] & 63;
          if ((u0 & 252) == 248) {
            u0 = (u0 & 3) << 24 | u1 << 18 | u2 << 12 | u3 << 6 | u4;
          } else {
            u5 = u8Array[idx++] & 63;
            u0 = (u0 & 1) << 30 | u1 << 24 | u2 << 18 | u3 << 12 | u4 << 6 | u5;
          }
        }
      }
      if (u0 < 65536) {
        str += String.fromCharCode(u0);
      } else {
        var ch = u0 - 65536;
        str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
      }
    }
  }
}

function UTF8ToString(ptr) {
  return UTF8ArrayToString(HEAPU8, ptr);
}

function stringToUTF8Array(str, outU8Array, outIdx, maxBytesToWrite) {
  if (!(maxBytesToWrite > 0)) return 0;
  var startIdx = outIdx;
  var endIdx = outIdx + maxBytesToWrite - 1;
  for (var i = 0; i < str.length; ++i) {
    var u = str.charCodeAt(i);
    if (u >= 55296 && u <= 57343) {
      var u1 = str.charCodeAt(++i);
      u = 65536 + ((u & 1023) << 10) | u1 & 1023;
    }
    if (u <= 127) {
      if (outIdx >= endIdx) break;
      outU8Array[outIdx++] = u;
    } else if (u <= 2047) {
      if (outIdx + 1 >= endIdx) break;
      outU8Array[outIdx++] = 192 | u >> 6;
      outU8Array[outIdx++] = 128 | u & 63;
    } else if (u <= 65535) {
      if (outIdx + 2 >= endIdx) break;
      outU8Array[outIdx++] = 224 | u >> 12;
      outU8Array[outIdx++] = 128 | u >> 6 & 63;
      outU8Array[outIdx++] = 128 | u & 63;
    } else if (u <= 2097151) {
      if (outIdx + 3 >= endIdx) break;
      outU8Array[outIdx++] = 240 | u >> 18;
      outU8Array[outIdx++] = 128 | u >> 12 & 63;
      outU8Array[outIdx++] = 128 | u >> 6 & 63;
      outU8Array[outIdx++] = 128 | u & 63;
    } else if (u <= 67108863) {
      if (outIdx + 4 >= endIdx) break;
      outU8Array[outIdx++] = 248 | u >> 24;
      outU8Array[outIdx++] = 128 | u >> 18 & 63;
      outU8Array[outIdx++] = 128 | u >> 12 & 63;
      outU8Array[outIdx++] = 128 | u >> 6 & 63;
      outU8Array[outIdx++] = 128 | u & 63;
    } else {
      if (outIdx + 5 >= endIdx) break;
      outU8Array[outIdx++] = 252 | u >> 30;
      outU8Array[outIdx++] = 128 | u >> 24 & 63;
      outU8Array[outIdx++] = 128 | u >> 18 & 63;
      outU8Array[outIdx++] = 128 | u >> 12 & 63;
      outU8Array[outIdx++] = 128 | u >> 6 & 63;
      outU8Array[outIdx++] = 128 | u & 63;
    }
  }
  outU8Array[outIdx] = 0;
  return outIdx - startIdx;
}

function stringToUTF8(str, outPtr, maxBytesToWrite) {
  assert(typeof maxBytesToWrite == "number", "stringToUTF8(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!");
  return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
}

function lengthBytesUTF8(str) {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    var u = str.charCodeAt(i);
    if (u >= 55296 && u <= 57343) u = 65536 + ((u & 1023) << 10) | str.charCodeAt(++i) & 1023;
    if (u <= 127) {
      ++len;
    } else if (u <= 2047) {
      len += 2;
    } else if (u <= 65535) {
      len += 3;
    } else if (u <= 2097151) {
      len += 4;
    } else if (u <= 67108863) {
      len += 5;
    } else {
      len += 6;
    }
  }
  return len;
}

var UTF16Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf-16le") : undefined;

function UTF16ToString(ptr) {
  assert(ptr % 2 == 0, "Pointer passed to UTF16ToString must be aligned to two bytes!");
  var endPtr = ptr;
  var idx = endPtr >> 1;
  while (HEAP16[idx]) ++idx;
  endPtr = idx << 1;
  if (endPtr - ptr > 32 && UTF16Decoder) {
    return UTF16Decoder.decode(HEAPU8.subarray(ptr, endPtr));
  } else {
    var i = 0;
    var str = "";
    while (1) {
      var codeUnit = HEAP16[ptr + i * 2 >> 1];
      if (codeUnit == 0) return str;
      ++i;
      str += String.fromCharCode(codeUnit);
    }
  }
}

function stringToUTF16(str, outPtr, maxBytesToWrite) {
  assert(outPtr % 2 == 0, "Pointer passed to stringToUTF16 must be aligned to two bytes!");
  assert(typeof maxBytesToWrite == "number", "stringToUTF16(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!");
  if (maxBytesToWrite === undefined) {
    maxBytesToWrite = 2147483647;
  }
  if (maxBytesToWrite < 2) return 0;
  maxBytesToWrite -= 2;
  var startPtr = outPtr;
  var numCharsToWrite = maxBytesToWrite < str.length * 2 ? maxBytesToWrite / 2 : str.length;
  for (var i = 0; i < numCharsToWrite; ++i) {
    var codeUnit = str.charCodeAt(i);
    HEAP16[outPtr >> 1] = codeUnit;
    outPtr += 2;
  }
  HEAP16[outPtr >> 1] = 0;
  return outPtr - startPtr;
}

function lengthBytesUTF16(str) {
  return str.length * 2;
}

function UTF32ToString(ptr) {
  assert(ptr % 4 == 0, "Pointer passed to UTF32ToString must be aligned to four bytes!");
  var i = 0;
  var str = "";
  while (1) {
    var utf32 = HEAP32[ptr + i * 4 >> 2];
    if (utf32 == 0) return str;
    ++i;
    if (utf32 >= 65536) {
      var ch = utf32 - 65536;
      str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
    } else {
      str += String.fromCharCode(utf32);
    }
  }
}

function stringToUTF32(str, outPtr, maxBytesToWrite) {
  assert(outPtr % 4 == 0, "Pointer passed to stringToUTF32 must be aligned to four bytes!");
  assert(typeof maxBytesToWrite == "number", "stringToUTF32(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!");
  if (maxBytesToWrite === undefined) {
    maxBytesToWrite = 2147483647;
  }
  if (maxBytesToWrite < 4) return 0;
  var startPtr = outPtr;
  var endPtr = startPtr + maxBytesToWrite - 4;
  for (var i = 0; i < str.length; ++i) {
    var codeUnit = str.charCodeAt(i);
    if (codeUnit >= 55296 && codeUnit <= 57343) {
      var trailSurrogate = str.charCodeAt(++i);
      codeUnit = 65536 + ((codeUnit & 1023) << 10) | trailSurrogate & 1023;
    }
    HEAP32[outPtr >> 2] = codeUnit;
    outPtr += 4;
    if (outPtr + 4 > endPtr) break;
  }
  HEAP32[outPtr >> 2] = 0;
  return outPtr - startPtr;
}

function lengthBytesUTF32(str) {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    var codeUnit = str.charCodeAt(i);
    if (codeUnit >= 55296 && codeUnit <= 57343) ++i;
    len += 4;
  }
  return len;
}

function allocateUTF8(str) {
  var size = lengthBytesUTF8(str) + 1;
  var ret = _malloc(size);
  if (ret) stringToUTF8Array(str, HEAP8, ret, size);
  return ret;
}

function allocateUTF8OnStack(str) {
  var size = lengthBytesUTF8(str) + 1;
  var ret = stackAlloc(size);
  stringToUTF8Array(str, HEAP8, ret, size);
  return ret;
}

function demangle(func) {
  var __cxa_demangle_func = Module["___cxa_demangle"] || Module["__cxa_demangle"];
  assert(__cxa_demangle_func);
  try {
    var s = func;
    if (s.startsWith("__Z")) s = s.substr(1);
    var len = lengthBytesUTF8(s) + 1;
    var buf = _malloc(len);
    stringToUTF8(s, buf, len);
    var status = _malloc(4);
    var ret = __cxa_demangle_func(buf, 0, 0, status);
    if (HEAP32[status >> 2] === 0 && ret) {
      return Pointer_stringify(ret);
    }
  } catch (e) {} finally {
    if (buf) _free(buf);
    if (status) _free(status);
    if (ret) _free(ret);
  }
  return func;
}

function demangleAll(text) {
  var regex = /__Z[\w\d_]+/g;
  return text.replace(regex, function(x) {
    var y = demangle(x);
    return x === y ? x : y + " [" + x + "]";
  });
}

function jsStackTrace() {
  var err = new Error();
  if (!err.stack) {
    try {
      throw new Error(0);
    } catch (e) {
      err = e;
    }
    if (!err.stack) {
      return "(no stack trace available)";
    }
  }
  return err.stack.toString();
}

function stackTrace() {
  var js = jsStackTrace();
  if (Module["extraStackTrace"]) js += "\n" + Module["extraStackTrace"]();
  return demangleAll(js);
}

var PAGE_SIZE = 16384;

var WASM_PAGE_SIZE = 65536;

var ASMJS_PAGE_SIZE = 16777216;

var MIN_TOTAL_MEMORY = 16777216;

function alignUp(x, multiple) {
  if (x % multiple > 0) {
    x += multiple - x % multiple;
  }
  return x;
}

var HEAP, buffer, HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;

function updateGlobalBuffer(buf) {
  Module["buffer"] = buffer = buf;
}

function updateGlobalBufferViews() {
  Module["HEAP8"] = HEAP8 = new Int8Array(buffer);
  Module["HEAP16"] = HEAP16 = new Int16Array(buffer);
  Module["HEAP32"] = HEAP32 = new Int32Array(buffer);
  Module["HEAPU8"] = HEAPU8 = new Uint8Array(buffer);
  Module["HEAPU16"] = HEAPU16 = new Uint16Array(buffer);
  Module["HEAPU32"] = HEAPU32 = new Uint32Array(buffer);
  Module["HEAPF32"] = HEAPF32 = new Float32Array(buffer);
  Module["HEAPF64"] = HEAPF64 = new Float64Array(buffer);
}

var STATIC_BASE, STATICTOP, staticSealed;

var STACK_BASE, STACKTOP, STACK_MAX;

var DYNAMIC_BASE, DYNAMICTOP_PTR;

STATIC_BASE = STATICTOP = STACK_BASE = STACKTOP = STACK_MAX = DYNAMIC_BASE = DYNAMICTOP_PTR = 0;

staticSealed = false;

function writeStackCookie() {
  assert((STACK_MAX & 3) == 0);
  HEAPU32[(STACK_MAX >> 2) - 1] = 34821223;
  HEAPU32[(STACK_MAX >> 2) - 2] = 2310721022;
}

function checkStackCookie() {
  if (HEAPU32[(STACK_MAX >> 2) - 1] != 34821223 || HEAPU32[(STACK_MAX >> 2) - 2] != 2310721022) {
    abort("Stack overflow! Stack cookie has been overwritten, expected hex dwords 0x89BACDFE and 0x02135467, but received 0x" + HEAPU32[(STACK_MAX >> 2) - 2].toString(16) + " " + HEAPU32[(STACK_MAX >> 2) - 1].toString(16));
  }
  if (HEAP32[0] !== 1668509029) throw "Runtime error: The application has corrupted its heap memory area (address zero)!";
}

function abortStackOverflow(allocSize) {
  abort("Stack overflow! Attempted to allocate " + allocSize + " bytes on the stack, but stack has only " + (STACK_MAX - stackSave() + allocSize) + " bytes available!");
}

if (!Module["reallocBuffer"]) Module["reallocBuffer"] = function(size) {
  var ret;
  try {
    var oldHEAP8 = HEAP8;
    ret = new ArrayBuffer(size);
    var temp = new Int8Array(ret);
    temp.set(oldHEAP8);
  } catch (e) {
    return false;
  }
  var success = _emscripten_replace_memory(ret);
  if (!success) return false;
  return ret;
};

function enlargeMemory() {
  assert(HEAP32[DYNAMICTOP_PTR >> 2] > TOTAL_MEMORY);
  var PAGE_MULTIPLE = Module["usingWasm"] ? WASM_PAGE_SIZE : ASMJS_PAGE_SIZE;
  var LIMIT = 2147483648 - PAGE_MULTIPLE;
  if (HEAP32[DYNAMICTOP_PTR >> 2] > LIMIT) {
    err("Cannot enlarge memory, asked to go up to " + HEAP32[DYNAMICTOP_PTR >> 2] + " bytes, but the limit is " + LIMIT + " bytes!");
    return false;
  }
  var OLD_TOTAL_MEMORY = TOTAL_MEMORY;
  TOTAL_MEMORY = Math.max(TOTAL_MEMORY, MIN_TOTAL_MEMORY);
  while (TOTAL_MEMORY < HEAP32[DYNAMICTOP_PTR >> 2]) {
    if (TOTAL_MEMORY <= 536870912) {
      TOTAL_MEMORY = alignUp(2 * TOTAL_MEMORY, PAGE_MULTIPLE);
    } else {
      TOTAL_MEMORY = Math.min(alignUp((3 * TOTAL_MEMORY + 2147483648) / 4, PAGE_MULTIPLE), LIMIT);
      if (TOTAL_MEMORY === OLD_TOTAL_MEMORY) {
        warnOnce("Cannot ask for more memory since we reached the practical limit in browsers (which is just below 2GB), so the request would have failed. Requesting only " + TOTAL_MEMORY);
      }
    }
  }
  var start = Date.now();
  var replacement = Module["reallocBuffer"](TOTAL_MEMORY);
  if (!replacement || replacement.byteLength != TOTAL_MEMORY) {
    err("Failed to grow the heap from " + OLD_TOTAL_MEMORY + " bytes to " + TOTAL_MEMORY + " bytes, not enough memory!");
    if (replacement) {
      err("Expected to get back a buffer of size " + TOTAL_MEMORY + " bytes, but instead got back a buffer of size " + replacement.byteLength);
    }
    TOTAL_MEMORY = OLD_TOTAL_MEMORY;
    return false;
  }
  updateGlobalBuffer(replacement);
  updateGlobalBufferViews();
  if (!Module["usingWasm"]) {
    err("Warning: Enlarging memory arrays, this is not fast! " + [ OLD_TOTAL_MEMORY, TOTAL_MEMORY ]);
  }
  return true;
}

var byteLength;

try {
  byteLength = Function.prototype.call.bind(Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, "byteLength").get);
  byteLength(new ArrayBuffer(4));
} catch (e) {
  byteLength = function(buffer) {
    return buffer.byteLength;
  };
}

var TOTAL_STACK = Module["TOTAL_STACK"] || 5242880;

var TOTAL_MEMORY = Module["TOTAL_MEMORY"] || 16777216;

if (TOTAL_MEMORY < TOTAL_STACK) err("TOTAL_MEMORY should be larger than TOTAL_STACK, was " + TOTAL_MEMORY + "! (TOTAL_STACK=" + TOTAL_STACK + ")");

assert(typeof Int32Array !== "undefined" && typeof Float64Array !== "undefined" && Int32Array.prototype.subarray !== undefined && Int32Array.prototype.set !== undefined, "JS engine does not provide full typed array support");

if (Module["buffer"]) {
  buffer = Module["buffer"];
  assert(buffer.byteLength === TOTAL_MEMORY, "provided buffer should be " + TOTAL_MEMORY + " bytes, but it is " + buffer.byteLength);
} else {
  if (typeof WebAssembly === "object" && typeof WebAssembly.Memory === "function") {
    assert(TOTAL_MEMORY % WASM_PAGE_SIZE === 0);
    Module["wasmMemory"] = new WebAssembly.Memory({
      initial: TOTAL_MEMORY / WASM_PAGE_SIZE
    });
    buffer = Module["wasmMemory"].buffer;
  } else {
    buffer = new ArrayBuffer(TOTAL_MEMORY);
  }
  assert(buffer.byteLength === TOTAL_MEMORY);
  Module["buffer"] = buffer;
}

updateGlobalBufferViews();

function getTotalMemory() {
  return TOTAL_MEMORY;
}

HEAP32[0] = 1668509029;

HEAP16[1] = 25459;

if (HEAPU8[2] !== 115 || HEAPU8[3] !== 99) throw "Runtime error: expected the system to be little-endian!";

function callRuntimeCallbacks(callbacks) {
  while (callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == "function") {
      callback();
      continue;
    }
    var func = callback.func;
    if (typeof func === "number") {
      if (callback.arg === undefined) {
        Module["dynCall_v"](func);
      } else {
        Module["dynCall_vi"](func, callback.arg);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}

var __ATPRERUN__ = [];

var __ATINIT__ = [];

var __ATMAIN__ = [];

var __ATEXIT__ = [];

var __ATPOSTRUN__ = [];

var runtimeInitialized = false;

var runtimeExited = false;

function preRun() {
  if (Module["preRun"]) {
    if (typeof Module["preRun"] == "function") Module["preRun"] = [ Module["preRun"] ];
    while (Module["preRun"].length) {
      addOnPreRun(Module["preRun"].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}

function ensureInitRuntime() {
  checkStackCookie();
  if (runtimeInitialized) return;
  runtimeInitialized = true;
  callRuntimeCallbacks(__ATINIT__);
}

function preMain() {
  checkStackCookie();
  callRuntimeCallbacks(__ATMAIN__);
}

function exitRuntime() {
  checkStackCookie();
  callRuntimeCallbacks(__ATEXIT__);
  runtimeExited = true;
}

function postRun() {
  checkStackCookie();
  if (Module["postRun"]) {
    if (typeof Module["postRun"] == "function") Module["postRun"] = [ Module["postRun"] ];
    while (Module["postRun"].length) {
      addOnPostRun(Module["postRun"].shift());
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}

function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}

function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}

function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}

function addOnExit(cb) {
  __ATEXIT__.unshift(cb);
}

function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}

function writeStringToMemory(string, buffer, dontAddNull) {
  warnOnce("writeStringToMemory is deprecated and should not be called! Use stringToUTF8() instead!");
  var lastChar, end;
  if (dontAddNull) {
    end = buffer + lengthBytesUTF8(string);
    lastChar = HEAP8[end];
  }
  stringToUTF8(string, buffer, Infinity);
  if (dontAddNull) HEAP8[end] = lastChar;
}

function writeArrayToMemory(array, buffer) {
  assert(array.length >= 0, "writeArrayToMemory array must have a length (should be an array or typed array)");
  HEAP8.set(array, buffer);
}

function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; ++i) {
    assert(str.charCodeAt(i) === str.charCodeAt(i) & 255);
    HEAP8[buffer++ >> 0] = str.charCodeAt(i);
  }
  if (!dontAddNull) HEAP8[buffer >> 0] = 0;
}

function unSign(value, bits, ignore) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2 * Math.abs(1 << bits - 1) + value : Math.pow(2, bits) + value;
}

function reSign(value, bits, ignore) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << bits - 1) : Math.pow(2, bits - 1);
  if (value >= half && (bits <= 32 || value > half)) {
    value = -2 * half + value;
  }
  return value;
}

assert(Math.imul, "This browser does not support Math.imul(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill");

assert(Math.fround, "This browser does not support Math.fround(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill");

assert(Math.clz32, "This browser does not support Math.clz32(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill");

assert(Math.trunc, "This browser does not support Math.trunc(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill");

var Math_abs = Math.abs;

var Math_cos = Math.cos;

var Math_sin = Math.sin;

var Math_tan = Math.tan;

var Math_acos = Math.acos;

var Math_asin = Math.asin;

var Math_atan = Math.atan;

var Math_atan2 = Math.atan2;

var Math_exp = Math.exp;

var Math_log = Math.log;

var Math_sqrt = Math.sqrt;

var Math_ceil = Math.ceil;

var Math_floor = Math.floor;

var Math_pow = Math.pow;

var Math_imul = Math.imul;

var Math_fround = Math.fround;

var Math_round = Math.round;

var Math_min = Math.min;

var Math_max = Math.max;

var Math_clz32 = Math.clz32;

var Math_trunc = Math.trunc;

var runDependencies = 0;

var runDependencyWatcher = null;

var dependenciesFulfilled = null;

var runDependencyTracking = {};

function getUniqueRunDependency(id) {
  var orig = id;
  while (1) {
    if (!runDependencyTracking[id]) return id;
    id = orig + Math.random();
  }
  return id;
}

function addRunDependency(id) {
  runDependencies++;
  if (Module["monitorRunDependencies"]) {
    Module["monitorRunDependencies"](runDependencies);
  }
  if (id) {
    assert(!runDependencyTracking[id]);
    runDependencyTracking[id] = 1;
    if (runDependencyWatcher === null && typeof setInterval !== "undefined") {
      runDependencyWatcher = setInterval(function() {
        if (ABORT) {
          clearInterval(runDependencyWatcher);
          runDependencyWatcher = null;
          return;
        }
        var shown = false;
        for (var dep in runDependencyTracking) {
          if (!shown) {
            shown = true;
            err("still waiting on run dependencies:");
          }
          err("dependency: " + dep);
        }
        if (shown) {
          err("(end of list)");
        }
      }, 1e4);
    }
  } else {
    err("warning: run dependency added without ID");
  }
}

function removeRunDependency(id) {
  runDependencies--;
  if (Module["monitorRunDependencies"]) {
    Module["monitorRunDependencies"](runDependencies);
  }
  if (id) {
    assert(runDependencyTracking[id]);
    delete runDependencyTracking[id];
  } else {
    err("warning: run dependency removed without ID");
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback();
    }
  }
}

Module["preloadedImages"] = {};

Module["preloadedAudios"] = {};

var memoryInitializer = null;

var FS = {
  error: function() {
    abort("Filesystem support (FS) was not included. The problem is that you are using files from JS, but files were not used from C/C++, so filesystem support was not auto-included. You can force-include filesystem support with  -s FORCE_FILESYSTEM=1");
  },
  init: function() {
    FS.error();
  },
  createDataFile: function() {
    FS.error();
  },
  createPreloadedFile: function() {
    FS.error();
  },
  createLazyFile: function() {
    FS.error();
  },
  open: function() {
    FS.error();
  },
  mkdev: function() {
    FS.error();
  },
  registerDevice: function() {
    FS.error();
  },
  analyzePath: function() {
    FS.error();
  },
  loadFilesFromDB: function() {
    FS.error();
  },
  ErrnoError: function ErrnoError() {
    FS.error();
  }
};

Module["FS_createDataFile"] = FS.createDataFile;

Module["FS_createPreloadedFile"] = FS.createPreloadedFile;

var dataURIPrefix = "data:application/octet-stream;base64,";

function isDataURI(filename) {
  return String.prototype.startsWith ? filename.startsWith(dataURIPrefix) : filename.indexOf(dataURIPrefix) === 0;
}

function integrateWasmJS() {
  var method = "native-wasm";
  var wasmTextFile = "fontkit.wast";
  var wasmBinaryFile = "fontkit.wasm";
  var asmjsCodeFile = "fontkit.temp.asm.js";
  if (!isDataURI(wasmTextFile)) {
    wasmTextFile = locateFile(wasmTextFile);
  }
  if (!isDataURI(wasmBinaryFile)) {
    wasmBinaryFile = locateFile(wasmBinaryFile);
  }
  if (!isDataURI(asmjsCodeFile)) {
    asmjsCodeFile = locateFile(asmjsCodeFile);
  }
  var wasmPageSize = 64 * 1024;
  var info = {
    global: null,
    env: null,
    asm2wasm: asm2wasmImports,
    parent: Module
  };
  var exports = null;
  function mergeMemory(newBuffer) {
    var oldBuffer = Module["buffer"];
    if (newBuffer.byteLength < oldBuffer.byteLength) {
      err("the new buffer in mergeMemory is smaller than the previous one. in native wasm, we should grow memory here");
    }
    var oldView = new Int8Array(oldBuffer);
    var newView = new Int8Array(newBuffer);
    newView.set(oldView);
    updateGlobalBuffer(newBuffer);
    updateGlobalBufferViews();
  }
  function getBinary() {
    try {
      if (Module["wasmBinary"]) {
        return new Uint8Array(Module["wasmBinary"]);
      }
      if (Module["readBinary"]) {
        return Module["readBinary"](wasmBinaryFile);
      } else {
        throw "both async and sync fetching of the wasm failed";
      }
    } catch (err) {
      abort(err);
    }
  }
  function getBinaryPromise() {
    if (!Module["wasmBinary"] && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) && typeof fetch === "function") {
      return fetch(wasmBinaryFile, {
        credentials: "same-origin"
      }).then(function(response) {
        if (!response["ok"]) {
          throw "failed to load wasm binary file at '" + wasmBinaryFile + "'";
        }
        return response["arrayBuffer"]();
      }).catch(function() {
        return getBinary();
      });
    }
    return new Promise(function(resolve, reject) {
      resolve(getBinary());
    });
  }
  function doNativeWasm(global, env, providedBuffer) {
    if (typeof WebAssembly !== "object") {
      abort("No WebAssembly support found. Build with -s WASM=0 to target JavaScript instead.");
      err("no native wasm support detected");
      return false;
    }
    if (!(Module["wasmMemory"] instanceof WebAssembly.Memory)) {
      err("no native wasm Memory in use");
      return false;
    }
    env["memory"] = Module["wasmMemory"];
    info["global"] = {
      NaN,
      Infinity
    };
    info["global.Math"] = Math;
    info["env"] = env;
    function receiveInstance(instance, module) {
      exports = instance.exports;
      if (exports.memory) mergeMemory(exports.memory);
      Module["asm"] = exports;
      Module["usingWasm"] = true;
      removeRunDependency("wasm-instantiate");
    }
    addRunDependency("wasm-instantiate");
    if (Module["instantiateWasm"]) {
      try {
        return Module["instantiateWasm"](info, receiveInstance);
      } catch (e) {
        err("Module.instantiateWasm callback failed with error: " + e);
        return false;
      }
    }
    var trueModule = Module;
    function receiveInstantiatedSource(output) {
      assert(Module === trueModule, "the Module object should not be replaced during async compilation - perhaps the order of HTML elements is wrong?");
      trueModule = null;
      receiveInstance(output["instance"], output["module"]);
    }
    function instantiateArrayBuffer(receiver) {
      getBinaryPromise().then(function(binary) {
        return WebAssembly.instantiate(binary, info);
      }).then(receiver, function(reason) {
        err("failed to asynchronously prepare wasm: " + reason);
        abort(reason);
      });
    }
    if (!Module["wasmBinary"] && typeof WebAssembly.instantiateStreaming === "function" && !isDataURI(wasmBinaryFile) && typeof fetch === "function") {
      WebAssembly.instantiateStreaming(fetch(wasmBinaryFile, {
        credentials: "same-origin"
      }), info).then(receiveInstantiatedSource, function(reason) {
        err("wasm streaming compile failed: " + reason);
        err("falling back to ArrayBuffer instantiation");
        instantiateArrayBuffer(receiveInstantiatedSource);
      });
    } else {
      instantiateArrayBuffer(receiveInstantiatedSource);
    }
    return {};
  }
  Module["asmPreload"] = Module["asm"];
  var asmjsReallocBuffer = Module["reallocBuffer"];
  var wasmReallocBuffer = function(size) {
    var PAGE_MULTIPLE = Module["usingWasm"] ? WASM_PAGE_SIZE : ASMJS_PAGE_SIZE;
    size = alignUp(size, PAGE_MULTIPLE);
    var old = Module["buffer"];
    var oldSize = old.byteLength;
    if (Module["usingWasm"]) {
      try {
        var result = Module["wasmMemory"].grow((size - oldSize) / wasmPageSize);
        if (result !== (-1 | 0)) {
          return Module["buffer"] = Module["wasmMemory"].buffer;
        } else {
          return null;
        }
      } catch (e) {
        console.error("Module.reallocBuffer: Attempted to grow from " + oldSize + " bytes to " + size + " bytes, but got error: " + e);
        return null;
      }
    }
  };
  Module["reallocBuffer"] = function(size) {
    if (finalMethod === "asmjs") {
      return asmjsReallocBuffer(size);
    } else {
      return wasmReallocBuffer(size);
    }
  };
  var finalMethod = "";
  Module["asm"] = function(global, env, providedBuffer) {
    if (!env["table"]) {
      var TABLE_SIZE = Module["wasmTableSize"];
      if (TABLE_SIZE === undefined) TABLE_SIZE = 1024;
      var MAX_TABLE_SIZE = Module["wasmMaxTableSize"];
      if (typeof WebAssembly === "object" && typeof WebAssembly.Table === "function") {
        if (MAX_TABLE_SIZE !== undefined) {
          env["table"] = new WebAssembly.Table({
            initial: TABLE_SIZE,
            maximum: MAX_TABLE_SIZE,
            element: "anyfunc"
          });
        } else {
          env["table"] = new WebAssembly.Table({
            initial: TABLE_SIZE,
            element: "anyfunc"
          });
        }
      } else {
        env["table"] = new Array(TABLE_SIZE);
      }
      Module["wasmTable"] = env["table"];
    }
    if (!env["__memory_base"]) {
      env["__memory_base"] = Module["STATIC_BASE"];
    }
    if (!env["__table_base"]) {
      env["__table_base"] = 0;
    }
    var exports;
    exports = doNativeWasm(global, env, providedBuffer);
    assert(exports, "no binaryen method succeeded. consider enabling more options, like interpreting, if you want that: http://kripken.github.io/emscripten-site/docs/compiling/WebAssembly.html#binaryen-methods");
    return exports;
  };
  var methodHandler = Module["asm"];
}

integrateWasmJS();

var ASM_CONSTS = [];

STATIC_BASE = GLOBAL_BASE;

STATICTOP = STATIC_BASE + 381632;

__ATINIT__.push({
  func: function() {
    _init();
  }
}, {
  func: function() {
    ___emscripten_environ_constructor();
  }
});

var STATIC_BUMP = 381632;

Module["STATIC_BASE"] = STATIC_BASE;

Module["STATIC_BUMP"] = STATIC_BUMP;

var tempDoublePtr = STATICTOP;

STATICTOP += 16;

assert(tempDoublePtr % 8 == 0);

function copyTempFloat(ptr) {
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr + 1] = HEAP8[ptr + 1];
  HEAP8[tempDoublePtr + 2] = HEAP8[ptr + 2];
  HEAP8[tempDoublePtr + 3] = HEAP8[ptr + 3];
}

function copyTempDouble(ptr) {
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr + 1] = HEAP8[ptr + 1];
  HEAP8[tempDoublePtr + 2] = HEAP8[ptr + 2];
  HEAP8[tempDoublePtr + 3] = HEAP8[ptr + 3];
  HEAP8[tempDoublePtr + 4] = HEAP8[ptr + 4];
  HEAP8[tempDoublePtr + 5] = HEAP8[ptr + 5];
  HEAP8[tempDoublePtr + 6] = HEAP8[ptr + 6];
  HEAP8[tempDoublePtr + 7] = HEAP8[ptr + 7];
}

function ___assert_fail(condition, filename, line, func) {
  abort("Assertion failed: " + Pointer_stringify(condition) + ", at: " + [ filename ? Pointer_stringify(filename) : "unknown filename", line, func ? Pointer_stringify(func) : "unknown function" ]);
}

var ENV = {};

function ___buildEnvironment(environ) {
  var MAX_ENV_VALUES = 64;
  var TOTAL_ENV_SIZE = 1024;
  var poolPtr;
  var envPtr;
  if (!___buildEnvironment.called) {
    ___buildEnvironment.called = true;
    ENV["USER"] = ENV["LOGNAME"] = "web_user";
    ENV["PATH"] = "/";
    ENV["PWD"] = "/";
    ENV["HOME"] = "/home/web_user";
    ENV["LANG"] = "C.UTF-8";
    ENV["_"] = Module["thisProgram"];
    poolPtr = getMemory(TOTAL_ENV_SIZE);
    envPtr = getMemory(MAX_ENV_VALUES * 4);
    HEAP32[envPtr >> 2] = poolPtr;
    HEAP32[environ >> 2] = envPtr;
  } else {
    envPtr = HEAP32[environ >> 2];
    poolPtr = HEAP32[envPtr >> 2];
  }
  var strings = [];
  var totalSize = 0;
  for (var key in ENV) {
    if (typeof ENV[key] === "string") {
      var line = key + "=" + ENV[key];
      strings.push(line);
      totalSize += line.length;
    }
  }
  if (totalSize > TOTAL_ENV_SIZE) {
    throw new Error("Environment size exceeded TOTAL_ENV_SIZE!");
  }
  var ptrSize = 4;
  for (var i = 0; i < strings.length; i++) {
    var line = strings[i];
    writeAsciiToMemory(line, poolPtr);
    HEAP32[envPtr + i * ptrSize >> 2] = poolPtr;
    poolPtr += line.length + 1;
  }
  HEAP32[envPtr + strings.length * ptrSize >> 2] = 0;
}

function __ZSt18uncaught_exceptionv() {
  return !!__ZSt18uncaught_exceptionv.uncaught_exception;
}

var EXCEPTIONS = {
  last: 0,
  caught: [],
  infos: {},
  deAdjust: function(adjusted) {
    if (!adjusted || EXCEPTIONS.infos[adjusted]) return adjusted;
    for (var key in EXCEPTIONS.infos) {
      var ptr = +key;
      var adj = EXCEPTIONS.infos[ptr].adjusted;
      var len = adj.length;
      for (var i = 0; i < len; i++) {
        if (adj[i] === adjusted) {
          return ptr;
        }
      }
    }
    return adjusted;
  },
  addRef: function(ptr) {
    if (!ptr) return;
    var info = EXCEPTIONS.infos[ptr];
    info.refcount++;
  },
  decRef: function(ptr) {
    if (!ptr) return;
    var info = EXCEPTIONS.infos[ptr];
    assert(info.refcount > 0);
    info.refcount--;
    if (info.refcount === 0 && !info.rethrown) {
      if (info.destructor) {
        Module["dynCall_vi"](info.destructor, ptr);
      }
      delete EXCEPTIONS.infos[ptr];
      ___cxa_free_exception(ptr);
    }
  },
  clearRef: function(ptr) {
    if (!ptr) return;
    var info = EXCEPTIONS.infos[ptr];
    info.refcount = 0;
  }
};

function ___cxa_begin_catch(ptr) {
  var info = EXCEPTIONS.infos[ptr];
  if (info && !info.caught) {
    info.caught = true;
    __ZSt18uncaught_exceptionv.uncaught_exception--;
  }
  if (info) info.rethrown = false;
  EXCEPTIONS.caught.push(ptr);
  EXCEPTIONS.addRef(EXCEPTIONS.deAdjust(ptr));
  return ptr;
}

function ___resumeException(ptr) {
  if (!EXCEPTIONS.last) {
    EXCEPTIONS.last = ptr;
  }
  throw ptr + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";
}

function ___cxa_find_matching_catch() {
  var thrown = EXCEPTIONS.last;
  if (!thrown) {
    return (setTempRet0(0), 0) | 0;
  }
  var info = EXCEPTIONS.infos[thrown];
  var throwntype = info.type;
  if (!throwntype) {
    return (setTempRet0(0), thrown) | 0;
  }
  var typeArray = Array.prototype.slice.call(arguments);
  var pointer = Module["___cxa_is_pointer_type"](throwntype);
  if (!___cxa_find_matching_catch.buffer) ___cxa_find_matching_catch.buffer = _malloc(4);
  HEAP32[___cxa_find_matching_catch.buffer >> 2] = thrown;
  thrown = ___cxa_find_matching_catch.buffer;
  for (var i = 0; i < typeArray.length; i++) {
    if (typeArray[i] && Module["___cxa_can_catch"](typeArray[i], throwntype, thrown)) {
      thrown = HEAP32[thrown >> 2];
      info.adjusted.push(thrown);
      return (setTempRet0(typeArray[i]), thrown) | 0;
    }
  }
  thrown = HEAP32[thrown >> 2];
  return (setTempRet0(throwntype), thrown) | 0;
}

function ___gxx_personality_v0() {}

function ___lock() {}

var ERRNO_CODES = {
  EPERM: 1,
  ENOENT: 2,
  ESRCH: 3,
  EINTR: 4,
  EIO: 5,
  ENXIO: 6,
  E2BIG: 7,
  ENOEXEC: 8,
  EBADF: 9,
  ECHILD: 10,
  EAGAIN: 11,
  EWOULDBLOCK: 11,
  ENOMEM: 12,
  EACCES: 13,
  EFAULT: 14,
  ENOTBLK: 15,
  EBUSY: 16,
  EEXIST: 17,
  EXDEV: 18,
  ENODEV: 19,
  ENOTDIR: 20,
  EISDIR: 21,
  EINVAL: 22,
  ENFILE: 23,
  EMFILE: 24,
  ENOTTY: 25,
  ETXTBSY: 26,
  EFBIG: 27,
  ENOSPC: 28,
  ESPIPE: 29,
  EROFS: 30,
  EMLINK: 31,
  EPIPE: 32,
  EDOM: 33,
  ERANGE: 34,
  ENOMSG: 42,
  EIDRM: 43,
  ECHRNG: 44,
  EL2NSYNC: 45,
  EL3HLT: 46,
  EL3RST: 47,
  ELNRNG: 48,
  EUNATCH: 49,
  ENOCSI: 50,
  EL2HLT: 51,
  EDEADLK: 35,
  ENOLCK: 37,
  EBADE: 52,
  EBADR: 53,
  EXFULL: 54,
  ENOANO: 55,
  EBADRQC: 56,
  EBADSLT: 57,
  EDEADLOCK: 35,
  EBFONT: 59,
  ENOSTR: 60,
  ENODATA: 61,
  ETIME: 62,
  ENOSR: 63,
  ENONET: 64,
  ENOPKG: 65,
  EREMOTE: 66,
  ENOLINK: 67,
  EADV: 68,
  ESRMNT: 69,
  ECOMM: 70,
  EPROTO: 71,
  EMULTIHOP: 72,
  EDOTDOT: 73,
  EBADMSG: 74,
  ENOTUNIQ: 76,
  EBADFD: 77,
  EREMCHG: 78,
  ELIBACC: 79,
  ELIBBAD: 80,
  ELIBSCN: 81,
  ELIBMAX: 82,
  ELIBEXEC: 83,
  ENOSYS: 38,
  ENOTEMPTY: 39,
  ENAMETOOLONG: 36,
  ELOOP: 40,
  EOPNOTSUPP: 95,
  EPFNOSUPPORT: 96,
  ECONNRESET: 104,
  ENOBUFS: 105,
  EAFNOSUPPORT: 97,
  EPROTOTYPE: 91,
  ENOTSOCK: 88,
  ENOPROTOOPT: 92,
  ESHUTDOWN: 108,
  ECONNREFUSED: 111,
  EADDRINUSE: 98,
  ECONNABORTED: 103,
  ENETUNREACH: 101,
  ENETDOWN: 100,
  ETIMEDOUT: 110,
  EHOSTDOWN: 112,
  EHOSTUNREACH: 113,
  EINPROGRESS: 115,
  EALREADY: 114,
  EDESTADDRREQ: 89,
  EMSGSIZE: 90,
  EPROTONOSUPPORT: 93,
  ESOCKTNOSUPPORT: 94,
  EADDRNOTAVAIL: 99,
  ENETRESET: 102,
  EISCONN: 106,
  ENOTCONN: 107,
  ETOOMANYREFS: 109,
  EUSERS: 87,
  EDQUOT: 122,
  ESTALE: 116,
  ENOTSUP: 95,
  ENOMEDIUM: 123,
  EILSEQ: 84,
  EOVERFLOW: 75,
  ECANCELED: 125,
  ENOTRECOVERABLE: 131,
  EOWNERDEAD: 130,
  ESTRPIPE: 86
};

function ___setErrNo(value) {
  if (Module["___errno_location"]) HEAP32[Module["___errno_location"]() >> 2] = value; else err("failed to set errno from JS");
  return value;
}

function ___map_file(pathname, size) {
  ___setErrNo(ERRNO_CODES.EPERM);
  return -1;
}

var SYSCALLS = {
  buffers: [ null, [], [] ],
  printChar: function(stream, curr) {
    var buffer = SYSCALLS.buffers[stream];
    assert(buffer);
    if (curr === 0 || curr === 10) {
      (stream === 1 ? out : err)(UTF8ArrayToString(buffer, 0));
      buffer.length = 0;
    } else {
      buffer.push(curr);
    }
  },
  varargs: 0,
  get: function(varargs) {
    SYSCALLS.varargs += 4;
    var ret = HEAP32[SYSCALLS.varargs - 4 >> 2];
    return ret;
  },
  getStr: function() {
    var ret = Pointer_stringify(SYSCALLS.get());
    return ret;
  },
  get64: function() {
    var low = SYSCALLS.get(), high = SYSCALLS.get();
    if (low >= 0) assert(high === 0); else assert(high === -1);
    return low;
  },
  getZero: function() {
    assert(SYSCALLS.get() === 0);
  }
};

function ___syscall140(which, varargs) {
  SYSCALLS.varargs = varargs;
  try {
    var stream = SYSCALLS.getStreamFromFD(), offset_high = SYSCALLS.get(), offset_low = SYSCALLS.get(), result = SYSCALLS.get(), whence = SYSCALLS.get();
    var offset = offset_low;
    FS.llseek(stream, offset, whence);
    HEAP32[result >> 2] = stream.position;
    if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null;
    return 0;
  } catch (e) {
    if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
}

function ___syscall145(which, varargs) {
  SYSCALLS.varargs = varargs;
  try {
    var stream = SYSCALLS.getStreamFromFD(), iov = SYSCALLS.get(), iovcnt = SYSCALLS.get();
    return SYSCALLS.doReadv(stream, iov, iovcnt);
  } catch (e) {
    if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
}

function flush_NO_FILESYSTEM() {
  var fflush = Module["_fflush"];
  if (fflush) fflush(0);
  var buffers = SYSCALLS.buffers;
  if (buffers[1].length) SYSCALLS.printChar(1, 10);
  if (buffers[2].length) SYSCALLS.printChar(2, 10);
}

function ___syscall146(which, varargs) {
  SYSCALLS.varargs = varargs;
  try {
    var stream = SYSCALLS.get(), iov = SYSCALLS.get(), iovcnt = SYSCALLS.get();
    var ret = 0;
    for (var i = 0; i < iovcnt; i++) {
      var ptr = HEAP32[iov + i * 8 >> 2];
      var len = HEAP32[iov + (i * 8 + 4) >> 2];
      for (var j = 0; j < len; j++) {
        SYSCALLS.printChar(stream, HEAPU8[ptr + j]);
      }
      ret += len;
    }
    return ret;
  } catch (e) {
    if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
}

function ___syscall221(which, varargs) {
  SYSCALLS.varargs = varargs;
  try {
    return 0;
  } catch (e) {
    if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
}

function ___syscall5(which, varargs) {
  SYSCALLS.varargs = varargs;
  try {
    var pathname = SYSCALLS.getStr(), flags = SYSCALLS.get(), mode = SYSCALLS.get();
    var stream = FS.open(pathname, flags, mode);
    return stream.fd;
  } catch (e) {
    if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
}

function ___syscall54(which, varargs) {
  SYSCALLS.varargs = varargs;
  try {
    return 0;
  } catch (e) {
    if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
}

function ___syscall6(which, varargs) {
  SYSCALLS.varargs = varargs;
  try {
    var stream = SYSCALLS.getStreamFromFD();
    FS.close(stream);
    return 0;
  } catch (e) {
    if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
}

function ___syscall91(which, varargs) {
  SYSCALLS.varargs = varargs;
  try {
    var addr = SYSCALLS.get(), len = SYSCALLS.get();
    var info = SYSCALLS.mappings[addr];
    if (!info) return 0;
    if (len === info.len) {
      var stream = FS.getStream(info.fd);
      SYSCALLS.doMsync(addr, stream, len, info.flags);
      FS.munmap(stream);
      SYSCALLS.mappings[addr] = null;
      if (info.allocated) {
        _free(info.malloc);
      }
    }
    return 0;
  } catch (e) {
    if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
}

function ___unlock() {}

function _abort() {
  Module["abort"]();
}

function _getenv(name) {
  if (name === 0) return 0;
  name = Pointer_stringify(name);
  if (!ENV.hasOwnProperty(name)) return 0;
  if (_getenv.ret) _free(_getenv.ret);
  _getenv.ret = allocateUTF8(ENV[name]);
  return _getenv.ret;
}

function _longjmp(env, value) {
  Module["setThrew"](env, value || 1);
  throw "longjmp";
}

function _emscripten_memcpy_big(dest, src, num) {
  HEAPU8.set(HEAPU8.subarray(src, src + num), dest);
  return dest;
}

var PTHREAD_SPECIFIC = {};

function _pthread_getspecific(key) {
  return PTHREAD_SPECIFIC[key] || 0;
}

var PTHREAD_SPECIFIC_NEXT_KEY = 1;

function _pthread_key_create(key, destructor) {
  if (key == 0) {
    return ERRNO_CODES.EINVAL;
  }
  HEAP32[key >> 2] = PTHREAD_SPECIFIC_NEXT_KEY;
  PTHREAD_SPECIFIC[PTHREAD_SPECIFIC_NEXT_KEY] = 0;
  PTHREAD_SPECIFIC_NEXT_KEY++;
  return 0;
}

function _pthread_once(ptr, func) {
  if (!_pthread_once.seen) _pthread_once.seen = {};
  if (ptr in _pthread_once.seen) return;
  Module["dynCall_v"](func);
  _pthread_once.seen[ptr] = 1;
}

function _pthread_setspecific(key, value) {
  if (!(key in PTHREAD_SPECIFIC)) {
    return ERRNO_CODES.EINVAL;
  }
  PTHREAD_SPECIFIC[key] = value;
  return 0;
}

DYNAMICTOP_PTR = staticAlloc(4);

STACK_BASE = STACKTOP = alignMemory(STATICTOP);

STACK_MAX = STACK_BASE + TOTAL_STACK;

DYNAMIC_BASE = alignMemory(STACK_MAX);

HEAP32[DYNAMICTOP_PTR >> 2] = DYNAMIC_BASE;

staticSealed = true;

assert(DYNAMIC_BASE < TOTAL_MEMORY, "TOTAL_MEMORY not big enough for stack");

var ASSERTIONS = true;

function intArrayFromString(stringy, dontAddNull, length) {
  var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
  var u8array = new Array(len);
  var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
  if (dontAddNull) u8array.length = numBytesWritten;
  return u8array;
}

function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 255) {
      if (ASSERTIONS) {
        assert(false, "Character code " + chr + " (" + String.fromCharCode(chr) + ")  at offset " + i + " not in 0x00-0xFF.");
      }
      chr &= 255;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join("");
}

function nullFunc_ii(x) {
  err("Invalid function pointer called with signature 'ii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
  err("Build with ASSERTIONS=2 for more info.");
  abort(x);
}

function nullFunc_iii(x) {
  err("Invalid function pointer called with signature 'iii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
  err("Build with ASSERTIONS=2 for more info.");
  abort(x);
}

function nullFunc_iiii(x) {
  err("Invalid function pointer called with signature 'iiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
  err("Build with ASSERTIONS=2 for more info.");
  abort(x);
}

function nullFunc_iiiii(x) {
  err("Invalid function pointer called with signature 'iiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
  err("Build with ASSERTIONS=2 for more info.");
  abort(x);
}

function nullFunc_iiiiii(x) {
  err("Invalid function pointer called with signature 'iiiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
  err("Build with ASSERTIONS=2 for more info.");
  abort(x);
}

function nullFunc_iiiiiii(x) {
  err("Invalid function pointer called with signature 'iiiiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
  err("Build with ASSERTIONS=2 for more info.");
  abort(x);
}

function nullFunc_iiiiiiii(x) {
  err("Invalid function pointer called with signature 'iiiiiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
  err("Build with ASSERTIONS=2 for more info.");
  abort(x);
}

function nullFunc_iiiiiiiii(x) {
  err("Invalid function pointer called with signature 'iiiiiiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
  err("Build with ASSERTIONS=2 for more info.");
  abort(x);
}

function nullFunc_iiiiiiiiii(x) {
  err("Invalid function pointer called with signature 'iiiiiiiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
  err("Build with ASSERTIONS=2 for more info.");
  abort(x);
}

function nullFunc_v(x) {
  err("Invalid function pointer called with signature 'v'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
  err("Build with ASSERTIONS=2 for more info.");
  abort(x);
}

function nullFunc_vi(x) {
  err("Invalid function pointer called with signature 'vi'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
  err("Build with ASSERTIONS=2 for more info.");
  abort(x);
}

function nullFunc_vii(x) {
  err("Invalid function pointer called with signature 'vii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
  err("Build with ASSERTIONS=2 for more info.");
  abort(x);
}

function nullFunc_viii(x) {
  err("Invalid function pointer called with signature 'viii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
  err("Build with ASSERTIONS=2 for more info.");
  abort(x);
}

function nullFunc_viiii(x) {
  err("Invalid function pointer called with signature 'viiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
  err("Build with ASSERTIONS=2 for more info.");
  abort(x);
}

function nullFunc_viiiii(x) {
  err("Invalid function pointer called with signature 'viiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
  err("Build with ASSERTIONS=2 for more info.");
  abort(x);
}

function nullFunc_viiiiii(x) {
  err("Invalid function pointer called with signature 'viiiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
  err("Build with ASSERTIONS=2 for more info.");
  abort(x);
}

function nullFunc_viiiiiiii(x) {
  err("Invalid function pointer called with signature 'viiiiiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
  err("Build with ASSERTIONS=2 for more info.");
  abort(x);
}

Module["wasmTableSize"] = 12544;

Module["wasmMaxTableSize"] = 12544;

function invoke_iii(index, a1, a2) {
  var sp = stackSave();
  try {
    return Module["dynCall_iii"](index, a1, a2);
  } catch (e) {
    stackRestore(sp);
    if (typeof e !== "number" && e !== "longjmp") throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiiii(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiiii"](index, a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (typeof e !== "number" && e !== "longjmp") throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viiii(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    Module["dynCall_viiii"](index, a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (typeof e !== "number" && e !== "longjmp") throw e;
    Module["setThrew"](1, 0);
  }
}

Module.asmGlobalArg = {};

Module.asmLibraryArg = {
  abort,
  assert,
  enlargeMemory,
  getTotalMemory,
  setTempRet0,
  getTempRet0,
  abortStackOverflow,
  nullFunc_ii,
  nullFunc_iii,
  nullFunc_iiii,
  nullFunc_iiiii,
  nullFunc_iiiiii,
  nullFunc_iiiiiii,
  nullFunc_iiiiiiii,
  nullFunc_iiiiiiiii,
  nullFunc_iiiiiiiiii,
  nullFunc_v,
  nullFunc_vi,
  nullFunc_vii,
  nullFunc_viii,
  nullFunc_viiii,
  nullFunc_viiiii,
  nullFunc_viiiiii,
  nullFunc_viiiiiiii,
  invoke_iii,
  invoke_iiiii,
  invoke_viiii,
  __ZSt18uncaught_exceptionv,
  ___assert_fail,
  ___buildEnvironment,
  ___cxa_begin_catch,
  ___cxa_find_matching_catch,
  ___gxx_personality_v0,
  ___lock,
  ___map_file,
  ___resumeException,
  ___setErrNo,
  ___syscall140,
  ___syscall145,
  ___syscall146,
  ___syscall221,
  ___syscall5,
  ___syscall54,
  ___syscall6,
  ___syscall91,
  ___unlock,
  _abort,
  _emscripten_memcpy_big,
  _getenv,
  _longjmp,
  _pthread_getspecific,
  _pthread_key_create,
  _pthread_once,
  _pthread_setspecific,
  flush_NO_FILESYSTEM,
  DYNAMICTOP_PTR,
  tempDoublePtr,
  STACKTOP,
  STACK_MAX
};

var asm = Module["asm"](Module.asmGlobalArg, Module.asmLibraryArg, buffer);

var real__FKBufAlloc = asm["_FKBufAlloc"];

asm["_FKBufAlloc"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return real__FKBufAlloc.apply(null, arguments);
};

var real__FKBufAppendUTF16 = asm["_FKBufAppendUTF16"];

asm["_FKBufAppendUTF16"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return real__FKBufAppendUTF16.apply(null, arguments);
};

var real__FKBufAppendUTF8 = asm["_FKBufAppendUTF8"];

asm["_FKBufAppendUTF8"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return real__FKBufAppendUTF8.apply(null, arguments);
};

var real__FKBufCreateUTF16 = asm["_FKBufCreateUTF16"];

asm["_FKBufCreateUTF16"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return real__FKBufCreateUTF16.apply(null, arguments);
};

var real__FKBufCreateUTF8 = asm["_FKBufCreateUTF8"];

asm["_FKBufCreateUTF8"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return real__FKBufCreateUTF8.apply(null, arguments);
};

var real__FKBufFree = asm["_FKBufFree"];

asm["_FKBufFree"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return real__FKBufFree.apply(null, arguments);
};

var real__FKBufGetLanguage = asm["_FKBufGetLanguage"];

asm["_FKBufGetLanguage"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return real__FKBufGetLanguage.apply(null, arguments);
};

var real__FKBufGetScript = asm["_FKBufGetScript"];

asm["_FKBufGetScript"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return real__FKBufGetScript.apply(null, arguments);
};

var real__FKBufGlyphInfoLen = asm["_FKBufGlyphInfoLen"];

asm["_FKBufGlyphInfoLen"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return real__FKBufGlyphInfoLen.apply(null, arguments);
};

var real__FKBufGlyphInfoPtr = asm["_FKBufGlyphInfoPtr"];

asm["_FKBufGlyphInfoPtr"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return real__FKBufGlyphInfoPtr.apply(null, arguments);
};

var real__FKBufGlyphPosLen = asm["_FKBufGlyphPosLen"];

asm["_FKBufGlyphPosLen"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return real__FKBufGlyphPosLen.apply(null, arguments);
};

var real__FKBufGlyphPosPtr = asm["_FKBufGlyphPosPtr"];

asm["_FKBufGlyphPosPtr"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return real__FKBufGlyphPosPtr.apply(null, arguments);
};

var real__FKBufGlyphPosStructDesc = asm["_FKBufGlyphPosStructDesc"];

asm["_FKBufGlyphPosStructDesc"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return real__FKBufGlyphPosStructDesc.apply(null, arguments);
};

var real__FKBufIsText = asm["_FKBufIsText"];

asm["_FKBufIsText"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return real__FKBufIsText.apply(null, arguments);
};

var real__FKBufReset = asm["_FKBufReset"];

asm["_FKBufReset"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return real__FKBufReset.apply(null, arguments);
};

var real__FKBufSetLanguage = asm["_FKBufSetLanguage"];

asm["_FKBufSetLanguage"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return real__FKBufSetLanguage.apply(null, arguments);
};

var real__FKBufSetScript = asm["_FKBufSetScript"];

asm["_FKBufSetScript"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return real__FKBufSetScript.apply(null, arguments);
};

var real__FKErrClear = asm["_FKErrClear"];

asm["_FKErrClear"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return real__FKErrClear.apply(null, arguments);
};

var real__FKErrGetCode = asm["_FKErrGetCode"];

asm["_FKErrGetCode"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return real__FKErrGetCode.apply(null, arguments);
};

var real__FKErrGetMsg = asm["_FKErrGetMsg"];

asm["_FKErrGetMsg"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return real__FKErrGetMsg.apply(null, arguments);
};

var real__FKFontCreate = asm["_FKFontCreate"];

asm["_FKFontCreate"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return real__FKFontCreate.apply(null, arguments);
};

var real__FKFontFeatures = asm["_FKFontFeatures"];

asm["_FKFontFeatures"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return real__FKFontFeatures.apply(null, arguments);
};

var real__FKFontFree = asm["_FKFontFree"];

asm["_FKFontFree"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return real__FKFontFree.apply(null, arguments);
};

var real__FKFontGetGlyphAdvance = asm["_FKFontGetGlyphAdvance"];

asm["_FKFontGetGlyphAdvance"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return real__FKFontGetGlyphAdvance.apply(null, arguments);
};

var real__FKFontGetGlyphKerning = asm["_FKFontGetGlyphKerning"];

asm["_FKFontGetGlyphKerning"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return real__FKFontGetGlyphKerning.apply(null, arguments);
};

var real__FKFontGetGlyphName = asm["_FKFontGetGlyphName"];

asm["_FKFontGetGlyphName"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return real__FKFontGetGlyphName.apply(null, arguments);
};

var real__FKFontGetVar = asm["_FKFontGetVar"];

asm["_FKFontGetVar"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return real__FKFontGetVar.apply(null, arguments);
};

var real__FKFontGet_ascender = asm["_FKFontGet_ascender"];

asm["_FKFontGet_ascender"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return real__FKFontGet_ascender.apply(null, arguments);
};

var real__FKFontGet_descender = asm["_FKFontGet_descender"];

asm["_FKFontGet_descender"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return real__FKFontGet_descender.apply(null, arguments);
};

var real__FKFontGet_face_flags = asm["_FKFontGet_face_flags"];

asm["_FKFontGet_face_flags"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return real__FKFontGet_face_flags.apply(null, arguments);
};

var real__FKFontGet_face_index = asm["_FKFontGet_face_index"];

asm["_FKFontGet_face_index"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return real__FKFontGet_face_index.apply(null, arguments);
};

var real__FKFontGet_family_name = asm["_FKFontGet_family_name"];

asm["_FKFontGet_family_name"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return real__FKFontGet_family_name.apply(null, arguments);
};

var real__FKFontGet_height = asm["_FKFontGet_height"];

asm["_FKFontGet_height"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return real__FKFontGet_height.apply(null, arguments);
};

var real__FKFontGet_max_advance_height = asm["_FKFontGet_max_advance_height"];

asm["_FKFontGet_max_advance_height"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return real__FKFontGet_max_advance_height.apply(null, arguments);
};

var real__FKFontGet_max_advance_width = asm["_FKFontGet_max_advance_width"];

asm["_FKFontGet_max_advance_width"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return real__FKFontGet_max_advance_width.apply(null, arguments);
};

var real__FKFontGet_num_charmaps = asm["_FKFontGet_num_charmaps"];

asm["_FKFontGet_num_charmaps"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return real__FKFontGet_num_charmaps.apply(null, arguments);
};

var real__FKFontGet_num_faces = asm["_FKFontGet_num_faces"];

asm["_FKFontGet_num_faces"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return real__FKFontGet_num_faces.apply(null, arguments);
};

var real__FKFontGet_num_fixed_sizes = asm["_FKFontGet_num_fixed_sizes"];

asm["_FKFontGet_num_fixed_sizes"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return real__FKFontGet_num_fixed_sizes.apply(null, arguments);
};

var real__FKFontGet_num_glyphs = asm["_FKFontGet_num_glyphs"];

asm["_FKFontGet_num_glyphs"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return real__FKFontGet_num_glyphs.apply(null, arguments);
};

var real__FKFontGet_style_flags = asm["_FKFontGet_style_flags"];

asm["_FKFontGet_style_flags"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return real__FKFontGet_style_flags.apply(null, arguments);
};

var real__FKFontGet_style_name = asm["_FKFontGet_style_name"];

asm["_FKFontGet_style_name"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return real__FKFontGet_style_name.apply(null, arguments);
};

var real__FKFontGet_underline_position = asm["_FKFontGet_underline_position"];

asm["_FKFontGet_underline_position"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return real__FKFontGet_underline_position.apply(null, arguments);
};

var real__FKFontGet_underline_thickness = asm["_FKFontGet_underline_thickness"];

asm["_FKFontGet_underline_thickness"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return real__FKFontGet_underline_thickness.apply(null, arguments);
};

var real__FKFontGet_units_per_EM = asm["_FKFontGet_units_per_EM"];

asm["_FKFontGet_units_per_EM"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return real__FKFontGet_units_per_EM.apply(null, arguments);
};

var real__FKFontLayout = asm["_FKFontLayout"];

asm["_FKFontLayout"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return real__FKFontLayout.apply(null, arguments);
};

var real__FKFontSetCharSize = asm["_FKFontSetCharSize"];

asm["_FKFontSetCharSize"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return real__FKFontSetCharSize.apply(null, arguments);
};

var real__FKGlyphInfoStructDesc = asm["_FKGlyphInfoStructDesc"];

asm["_FKGlyphInfoStructDesc"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return real__FKGlyphInfoStructDesc.apply(null, arguments);
};

var real__FKVarGetAxisCount = asm["_FKVarGetAxisCount"];

asm["_FKVarGetAxisCount"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return real__FKVarGetAxisCount.apply(null, arguments);
};

var real__FKVarGetAxisName = asm["_FKVarGetAxisName"];

asm["_FKVarGetAxisName"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return real__FKVarGetAxisName.apply(null, arguments);
};

var real__FKVarGetAxisRange = asm["_FKVarGetAxisRange"];

asm["_FKVarGetAxisRange"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return real__FKVarGetAxisRange.apply(null, arguments);
};

var real__FKVarGetStyleCount = asm["_FKVarGetStyleCount"];

asm["_FKVarGetStyleCount"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return real__FKVarGetStyleCount.apply(null, arguments);
};

var real__FKVarGetStyleName = asm["_FKVarGetStyleName"];

asm["_FKVarGetStyleName"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return real__FKVarGetStyleName.apply(null, arguments);
};

var real____cxa_demangle = asm["___cxa_demangle"];

asm["___cxa_demangle"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return real____cxa_demangle.apply(null, arguments);
};

var real____emscripten_environ_constructor = asm["___emscripten_environ_constructor"];

asm["___emscripten_environ_constructor"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return real____emscripten_environ_constructor.apply(null, arguments);
};

var real___get_environ = asm["__get_environ"];

asm["__get_environ"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return real___get_environ.apply(null, arguments);
};

var real__free = asm["_free"];

asm["_free"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return real__free.apply(null, arguments);
};

var real__init = asm["_init"];

asm["_init"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return real__init.apply(null, arguments);
};

var real__llvm_bswap_i16 = asm["_llvm_bswap_i16"];

asm["_llvm_bswap_i16"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return real__llvm_bswap_i16.apply(null, arguments);
};

var real__llvm_bswap_i32 = asm["_llvm_bswap_i32"];

asm["_llvm_bswap_i32"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return real__llvm_bswap_i32.apply(null, arguments);
};

var real__malloc = asm["_malloc"];

asm["_malloc"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return real__malloc.apply(null, arguments);
};

var real__memmove = asm["_memmove"];

asm["_memmove"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return real__memmove.apply(null, arguments);
};

var real__realloc = asm["_realloc"];

asm["_realloc"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return real__realloc.apply(null, arguments);
};

var real__saveSetjmp = asm["_saveSetjmp"];

asm["_saveSetjmp"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return real__saveSetjmp.apply(null, arguments);
};

var real__sbrk = asm["_sbrk"];

asm["_sbrk"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return real__sbrk.apply(null, arguments);
};

var real__testSetjmp = asm["_testSetjmp"];

asm["_testSetjmp"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return real__testSetjmp.apply(null, arguments);
};

var real_establishStackSpace = asm["establishStackSpace"];

asm["establishStackSpace"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return real_establishStackSpace.apply(null, arguments);
};

var real_setThrew = asm["setThrew"];

asm["setThrew"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return real_setThrew.apply(null, arguments);
};

var real_stackAlloc = asm["stackAlloc"];

asm["stackAlloc"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return real_stackAlloc.apply(null, arguments);
};

var real_stackRestore = asm["stackRestore"];

asm["stackRestore"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return real_stackRestore.apply(null, arguments);
};

var real_stackSave = asm["stackSave"];

asm["stackSave"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return real_stackSave.apply(null, arguments);
};

Module["asm"] = asm;

var _FKBufAlloc = Module["_FKBufAlloc"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["_FKBufAlloc"].apply(null, arguments);
};

var _FKBufAppendUTF16 = Module["_FKBufAppendUTF16"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["_FKBufAppendUTF16"].apply(null, arguments);
};

var _FKBufAppendUTF8 = Module["_FKBufAppendUTF8"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["_FKBufAppendUTF8"].apply(null, arguments);
};

var _FKBufCreateUTF16 = Module["_FKBufCreateUTF16"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["_FKBufCreateUTF16"].apply(null, arguments);
};

var _FKBufCreateUTF8 = Module["_FKBufCreateUTF8"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["_FKBufCreateUTF8"].apply(null, arguments);
};

var _FKBufFree = Module["_FKBufFree"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["_FKBufFree"].apply(null, arguments);
};

var _FKBufGetLanguage = Module["_FKBufGetLanguage"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["_FKBufGetLanguage"].apply(null, arguments);
};

var _FKBufGetScript = Module["_FKBufGetScript"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["_FKBufGetScript"].apply(null, arguments);
};

var _FKBufGlyphInfoLen = Module["_FKBufGlyphInfoLen"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["_FKBufGlyphInfoLen"].apply(null, arguments);
};

var _FKBufGlyphInfoPtr = Module["_FKBufGlyphInfoPtr"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["_FKBufGlyphInfoPtr"].apply(null, arguments);
};

var _FKBufGlyphPosLen = Module["_FKBufGlyphPosLen"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["_FKBufGlyphPosLen"].apply(null, arguments);
};

var _FKBufGlyphPosPtr = Module["_FKBufGlyphPosPtr"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["_FKBufGlyphPosPtr"].apply(null, arguments);
};

var _FKBufGlyphPosStructDesc = Module["_FKBufGlyphPosStructDesc"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["_FKBufGlyphPosStructDesc"].apply(null, arguments);
};

var _FKBufIsText = Module["_FKBufIsText"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["_FKBufIsText"].apply(null, arguments);
};

var _FKBufReset = Module["_FKBufReset"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["_FKBufReset"].apply(null, arguments);
};

var _FKBufSetLanguage = Module["_FKBufSetLanguage"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["_FKBufSetLanguage"].apply(null, arguments);
};

var _FKBufSetScript = Module["_FKBufSetScript"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["_FKBufSetScript"].apply(null, arguments);
};

var _FKErrClear = Module["_FKErrClear"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["_FKErrClear"].apply(null, arguments);
};

var _FKErrGetCode = Module["_FKErrGetCode"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["_FKErrGetCode"].apply(null, arguments);
};

var _FKErrGetMsg = Module["_FKErrGetMsg"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["_FKErrGetMsg"].apply(null, arguments);
};

var _FKFontCreate = Module["_FKFontCreate"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["_FKFontCreate"].apply(null, arguments);
};

var _FKFontFeatures = Module["_FKFontFeatures"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["_FKFontFeatures"].apply(null, arguments);
};

var _FKFontFree = Module["_FKFontFree"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["_FKFontFree"].apply(null, arguments);
};

var _FKFontGetGlyphAdvance = Module["_FKFontGetGlyphAdvance"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["_FKFontGetGlyphAdvance"].apply(null, arguments);
};

var _FKFontGetGlyphKerning = Module["_FKFontGetGlyphKerning"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["_FKFontGetGlyphKerning"].apply(null, arguments);
};

var _FKFontGetGlyphName = Module["_FKFontGetGlyphName"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["_FKFontGetGlyphName"].apply(null, arguments);
};

var _FKFontGetVar = Module["_FKFontGetVar"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["_FKFontGetVar"].apply(null, arguments);
};

var _FKFontGet_ascender = Module["_FKFontGet_ascender"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["_FKFontGet_ascender"].apply(null, arguments);
};

var _FKFontGet_descender = Module["_FKFontGet_descender"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["_FKFontGet_descender"].apply(null, arguments);
};

var _FKFontGet_face_flags = Module["_FKFontGet_face_flags"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["_FKFontGet_face_flags"].apply(null, arguments);
};

var _FKFontGet_face_index = Module["_FKFontGet_face_index"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["_FKFontGet_face_index"].apply(null, arguments);
};

var _FKFontGet_family_name = Module["_FKFontGet_family_name"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["_FKFontGet_family_name"].apply(null, arguments);
};

var _FKFontGet_height = Module["_FKFontGet_height"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["_FKFontGet_height"].apply(null, arguments);
};

var _FKFontGet_max_advance_height = Module["_FKFontGet_max_advance_height"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["_FKFontGet_max_advance_height"].apply(null, arguments);
};

var _FKFontGet_max_advance_width = Module["_FKFontGet_max_advance_width"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["_FKFontGet_max_advance_width"].apply(null, arguments);
};

var _FKFontGet_num_charmaps = Module["_FKFontGet_num_charmaps"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["_FKFontGet_num_charmaps"].apply(null, arguments);
};

var _FKFontGet_num_faces = Module["_FKFontGet_num_faces"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["_FKFontGet_num_faces"].apply(null, arguments);
};

var _FKFontGet_num_fixed_sizes = Module["_FKFontGet_num_fixed_sizes"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["_FKFontGet_num_fixed_sizes"].apply(null, arguments);
};

var _FKFontGet_num_glyphs = Module["_FKFontGet_num_glyphs"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["_FKFontGet_num_glyphs"].apply(null, arguments);
};

var _FKFontGet_style_flags = Module["_FKFontGet_style_flags"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["_FKFontGet_style_flags"].apply(null, arguments);
};

var _FKFontGet_style_name = Module["_FKFontGet_style_name"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["_FKFontGet_style_name"].apply(null, arguments);
};

var _FKFontGet_underline_position = Module["_FKFontGet_underline_position"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["_FKFontGet_underline_position"].apply(null, arguments);
};

var _FKFontGet_underline_thickness = Module["_FKFontGet_underline_thickness"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["_FKFontGet_underline_thickness"].apply(null, arguments);
};

var _FKFontGet_units_per_EM = Module["_FKFontGet_units_per_EM"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["_FKFontGet_units_per_EM"].apply(null, arguments);
};

var _FKFontLayout = Module["_FKFontLayout"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["_FKFontLayout"].apply(null, arguments);
};

var _FKFontSetCharSize = Module["_FKFontSetCharSize"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["_FKFontSetCharSize"].apply(null, arguments);
};

var _FKGlyphInfoStructDesc = Module["_FKGlyphInfoStructDesc"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["_FKGlyphInfoStructDesc"].apply(null, arguments);
};

var _FKVarGetAxisCount = Module["_FKVarGetAxisCount"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["_FKVarGetAxisCount"].apply(null, arguments);
};

var _FKVarGetAxisName = Module["_FKVarGetAxisName"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["_FKVarGetAxisName"].apply(null, arguments);
};

var _FKVarGetAxisRange = Module["_FKVarGetAxisRange"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["_FKVarGetAxisRange"].apply(null, arguments);
};

var _FKVarGetStyleCount = Module["_FKVarGetStyleCount"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["_FKVarGetStyleCount"].apply(null, arguments);
};

var _FKVarGetStyleName = Module["_FKVarGetStyleName"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["_FKVarGetStyleName"].apply(null, arguments);
};

var ___cxa_demangle = Module["___cxa_demangle"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["___cxa_demangle"].apply(null, arguments);
};

var ___emscripten_environ_constructor = Module["___emscripten_environ_constructor"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["___emscripten_environ_constructor"].apply(null, arguments);
};

var __get_environ = Module["__get_environ"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["__get_environ"].apply(null, arguments);
};

var _emscripten_replace_memory = Module["_emscripten_replace_memory"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["_emscripten_replace_memory"].apply(null, arguments);
};

var _free = Module["_free"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["_free"].apply(null, arguments);
};

var _init = Module["_init"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["_init"].apply(null, arguments);
};

var _llvm_bswap_i16 = Module["_llvm_bswap_i16"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["_llvm_bswap_i16"].apply(null, arguments);
};

var _llvm_bswap_i32 = Module["_llvm_bswap_i32"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["_llvm_bswap_i32"].apply(null, arguments);
};

var _malloc = Module["_malloc"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["_malloc"].apply(null, arguments);
};

var _memcpy = Module["_memcpy"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["_memcpy"].apply(null, arguments);
};

var _memmove = Module["_memmove"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["_memmove"].apply(null, arguments);
};

var _memset = Module["_memset"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["_memset"].apply(null, arguments);
};

var _realloc = Module["_realloc"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["_realloc"].apply(null, arguments);
};

var _saveSetjmp = Module["_saveSetjmp"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["_saveSetjmp"].apply(null, arguments);
};

var _sbrk = Module["_sbrk"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["_sbrk"].apply(null, arguments);
};

var _testSetjmp = Module["_testSetjmp"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["_testSetjmp"].apply(null, arguments);
};

var establishStackSpace = Module["establishStackSpace"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["establishStackSpace"].apply(null, arguments);
};

var setThrew = Module["setThrew"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["setThrew"].apply(null, arguments);
};

var stackAlloc = Module["stackAlloc"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["stackAlloc"].apply(null, arguments);
};

var stackRestore = Module["stackRestore"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["stackRestore"].apply(null, arguments);
};

var stackSave = Module["stackSave"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["stackSave"].apply(null, arguments);
};

var dynCall_ii = Module["dynCall_ii"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["dynCall_ii"].apply(null, arguments);
};

var dynCall_iii = Module["dynCall_iii"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["dynCall_iii"].apply(null, arguments);
};

var dynCall_iiii = Module["dynCall_iiii"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["dynCall_iiii"].apply(null, arguments);
};

var dynCall_iiiii = Module["dynCall_iiiii"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["dynCall_iiiii"].apply(null, arguments);
};

var dynCall_iiiiii = Module["dynCall_iiiiii"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["dynCall_iiiiii"].apply(null, arguments);
};

var dynCall_iiiiiii = Module["dynCall_iiiiiii"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["dynCall_iiiiiii"].apply(null, arguments);
};

var dynCall_iiiiiiii = Module["dynCall_iiiiiiii"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["dynCall_iiiiiiii"].apply(null, arguments);
};

var dynCall_iiiiiiiii = Module["dynCall_iiiiiiiii"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["dynCall_iiiiiiiii"].apply(null, arguments);
};

var dynCall_iiiiiiiiii = Module["dynCall_iiiiiiiiii"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["dynCall_iiiiiiiiii"].apply(null, arguments);
};

var dynCall_v = Module["dynCall_v"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["dynCall_v"].apply(null, arguments);
};

var dynCall_vi = Module["dynCall_vi"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["dynCall_vi"].apply(null, arguments);
};

var dynCall_vii = Module["dynCall_vii"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["dynCall_vii"].apply(null, arguments);
};

var dynCall_viii = Module["dynCall_viii"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["dynCall_viii"].apply(null, arguments);
};

var dynCall_viiii = Module["dynCall_viiii"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["dynCall_viiii"].apply(null, arguments);
};

var dynCall_viiiii = Module["dynCall_viiiii"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["dynCall_viiiii"].apply(null, arguments);
};

var dynCall_viiiiii = Module["dynCall_viiiiii"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["dynCall_viiiiii"].apply(null, arguments);
};

var dynCall_viiiiiiii = Module["dynCall_viiiiiiii"] = function() {
  assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
  assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  return Module["asm"]["dynCall_viiiiiiii"].apply(null, arguments);
};

Module["asm"] = asm;

if (!Module["intArrayFromString"]) Module["intArrayFromString"] = function() {
  abort("'intArrayFromString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Module["intArrayToString"]) Module["intArrayToString"] = function() {
  abort("'intArrayToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Module["ccall"]) Module["ccall"] = function() {
  abort("'ccall' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Module["cwrap"]) Module["cwrap"] = function() {
  abort("'cwrap' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Module["setValue"]) Module["setValue"] = function() {
  abort("'setValue' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Module["getValue"]) Module["getValue"] = function() {
  abort("'getValue' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Module["allocate"]) Module["allocate"] = function() {
  abort("'allocate' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Module["getMemory"]) Module["getMemory"] = function() {
  abort("'getMemory' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you");
};

if (!Module["Pointer_stringify"]) Module["Pointer_stringify"] = function() {
  abort("'Pointer_stringify' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Module["AsciiToString"]) Module["AsciiToString"] = function() {
  abort("'AsciiToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Module["stringToAscii"]) Module["stringToAscii"] = function() {
  abort("'stringToAscii' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Module["UTF8ArrayToString"]) Module["UTF8ArrayToString"] = function() {
  abort("'UTF8ArrayToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Module["UTF8ToString"]) Module["UTF8ToString"] = function() {
  abort("'UTF8ToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Module["stringToUTF8Array"]) Module["stringToUTF8Array"] = function() {
  abort("'stringToUTF8Array' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Module["stringToUTF8"]) Module["stringToUTF8"] = function() {
  abort("'stringToUTF8' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Module["lengthBytesUTF8"]) Module["lengthBytesUTF8"] = function() {
  abort("'lengthBytesUTF8' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Module["UTF16ToString"]) Module["UTF16ToString"] = function() {
  abort("'UTF16ToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Module["stringToUTF16"]) Module["stringToUTF16"] = function() {
  abort("'stringToUTF16' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Module["lengthBytesUTF16"]) Module["lengthBytesUTF16"] = function() {
  abort("'lengthBytesUTF16' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Module["UTF32ToString"]) Module["UTF32ToString"] = function() {
  abort("'UTF32ToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Module["stringToUTF32"]) Module["stringToUTF32"] = function() {
  abort("'stringToUTF32' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Module["lengthBytesUTF32"]) Module["lengthBytesUTF32"] = function() {
  abort("'lengthBytesUTF32' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Module["allocateUTF8"]) Module["allocateUTF8"] = function() {
  abort("'allocateUTF8' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Module["stackTrace"]) Module["stackTrace"] = function() {
  abort("'stackTrace' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Module["addOnPreRun"]) Module["addOnPreRun"] = function() {
  abort("'addOnPreRun' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Module["addOnInit"]) Module["addOnInit"] = function() {
  abort("'addOnInit' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Module["addOnPreMain"]) Module["addOnPreMain"] = function() {
  abort("'addOnPreMain' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Module["addOnExit"]) Module["addOnExit"] = function() {
  abort("'addOnExit' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Module["addOnPostRun"]) Module["addOnPostRun"] = function() {
  abort("'addOnPostRun' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Module["writeStringToMemory"]) Module["writeStringToMemory"] = function() {
  abort("'writeStringToMemory' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Module["writeArrayToMemory"]) Module["writeArrayToMemory"] = function() {
  abort("'writeArrayToMemory' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Module["writeAsciiToMemory"]) Module["writeAsciiToMemory"] = function() {
  abort("'writeAsciiToMemory' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Module["addRunDependency"]) Module["addRunDependency"] = function() {
  abort("'addRunDependency' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you");
};

if (!Module["removeRunDependency"]) Module["removeRunDependency"] = function() {
  abort("'removeRunDependency' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you");
};

if (!Module["ENV"]) Module["ENV"] = function() {
  abort("'ENV' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Module["FS"]) Module["FS"] = function() {
  abort("'FS' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Module["FS_createFolder"]) Module["FS_createFolder"] = function() {
  abort("'FS_createFolder' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you");
};

if (!Module["FS_createPath"]) Module["FS_createPath"] = function() {
  abort("'FS_createPath' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you");
};

if (!Module["FS_createDataFile"]) Module["FS_createDataFile"] = function() {
  abort("'FS_createDataFile' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you");
};

if (!Module["FS_createPreloadedFile"]) Module["FS_createPreloadedFile"] = function() {
  abort("'FS_createPreloadedFile' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you");
};

if (!Module["FS_createLazyFile"]) Module["FS_createLazyFile"] = function() {
  abort("'FS_createLazyFile' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you");
};

if (!Module["FS_createLink"]) Module["FS_createLink"] = function() {
  abort("'FS_createLink' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you");
};

if (!Module["FS_createDevice"]) Module["FS_createDevice"] = function() {
  abort("'FS_createDevice' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you");
};

if (!Module["FS_unlink"]) Module["FS_unlink"] = function() {
  abort("'FS_unlink' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you");
};

if (!Module["GL"]) Module["GL"] = function() {
  abort("'GL' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Module["staticAlloc"]) Module["staticAlloc"] = function() {
  abort("'staticAlloc' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Module["dynamicAlloc"]) Module["dynamicAlloc"] = function() {
  abort("'dynamicAlloc' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Module["warnOnce"]) Module["warnOnce"] = function() {
  abort("'warnOnce' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Module["loadDynamicLibrary"]) Module["loadDynamicLibrary"] = function() {
  abort("'loadDynamicLibrary' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Module["loadWebAssemblyModule"]) Module["loadWebAssemblyModule"] = function() {
  abort("'loadWebAssemblyModule' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Module["getLEB"]) Module["getLEB"] = function() {
  abort("'getLEB' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Module["getFunctionTables"]) Module["getFunctionTables"] = function() {
  abort("'getFunctionTables' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Module["alignFunctionTables"]) Module["alignFunctionTables"] = function() {
  abort("'alignFunctionTables' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Module["registerFunctions"]) Module["registerFunctions"] = function() {
  abort("'registerFunctions' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Module["addFunction"]) Module["addFunction"] = function() {
  abort("'addFunction' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Module["removeFunction"]) Module["removeFunction"] = function() {
  abort("'removeFunction' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Module["getFuncWrapper"]) Module["getFuncWrapper"] = function() {
  abort("'getFuncWrapper' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Module["prettyPrint"]) Module["prettyPrint"] = function() {
  abort("'prettyPrint' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Module["makeBigInt"]) Module["makeBigInt"] = function() {
  abort("'makeBigInt' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Module["dynCall"]) Module["dynCall"] = function() {
  abort("'dynCall' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Module["getCompilerSetting"]) Module["getCompilerSetting"] = function() {
  abort("'getCompilerSetting' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Module["stackSave"]) Module["stackSave"] = function() {
  abort("'stackSave' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Module["stackRestore"]) Module["stackRestore"] = function() {
  abort("'stackRestore' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Module["stackAlloc"]) Module["stackAlloc"] = function() {
  abort("'stackAlloc' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Module["establishStackSpace"]) Module["establishStackSpace"] = function() {
  abort("'establishStackSpace' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Module["print"]) Module["print"] = function() {
  abort("'print' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Module["printErr"]) Module["printErr"] = function() {
  abort("'printErr' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Module["ALLOC_NORMAL"]) Object.defineProperty(Module, "ALLOC_NORMAL", {
  get: function() {
    abort("'ALLOC_NORMAL' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
});

if (!Module["ALLOC_STACK"]) Object.defineProperty(Module, "ALLOC_STACK", {
  get: function() {
    abort("'ALLOC_STACK' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
});

if (!Module["ALLOC_STATIC"]) Object.defineProperty(Module, "ALLOC_STATIC", {
  get: function() {
    abort("'ALLOC_STATIC' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
});

if (!Module["ALLOC_DYNAMIC"]) Object.defineProperty(Module, "ALLOC_DYNAMIC", {
  get: function() {
    abort("'ALLOC_DYNAMIC' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
});

if (!Module["ALLOC_NONE"]) Object.defineProperty(Module, "ALLOC_NONE", {
  get: function() {
    abort("'ALLOC_NONE' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
});

function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
}

ExitStatus.prototype = new Error();

ExitStatus.prototype.constructor = ExitStatus;

var initialStackTop;

var calledMain = false;

dependenciesFulfilled = function runCaller() {
  if (!Module["calledRun"]) run();
  if (!Module["calledRun"]) dependenciesFulfilled = runCaller;
};

function run(args) {
  args = args || Module["arguments"];
  if (runDependencies > 0) {
    return;
  }
  writeStackCookie();
  preRun();
  if (runDependencies > 0) return;
  if (Module["calledRun"]) return;
  function doRun() {
    if (Module["calledRun"]) return;
    Module["calledRun"] = true;
    if (ABORT) return;
    ensureInitRuntime();
    preMain();
    if (Module["onRuntimeInitialized"]) Module["onRuntimeInitialized"]();
    assert(!Module["_main"], 'compiled without a main, but one is present. if you added it from JS, use Module["onRuntimeInitialized"]');
    postRun();
  }
  if (Module["setStatus"]) {
    Module["setStatus"]("Running...");
    setTimeout(function() {
      setTimeout(function() {
        Module["setStatus"]("");
      }, 1);
      doRun();
    }, 1);
  } else {
    doRun();
  }
  checkStackCookie();
}

Module["run"] = run;

function checkUnflushedContent() {
  var print = out;
  var printErr = err;
  var has = false;
  out = err = function(x) {
    has = true;
  };
  try {
    var flush = flush_NO_FILESYSTEM;
    if (flush) flush(0);
  } catch (e) {}
  out = print;
  err = printErr;
  if (has) {
    warnOnce("stdio streams had content in them that was not flushed. you should set EXIT_RUNTIME to 1 (see the FAQ), or make sure to emit a newline when you printf etc.");
    warnOnce("(this may also be due to not including full filesystem support - try building with -s FORCE_FILESYSTEM=1)");
  }
}

function exit(status, implicit) {
  checkUnflushedContent();
  if (implicit && Module["noExitRuntime"] && status === 0) {
    return;
  }
  if (Module["noExitRuntime"]) {
    if (!implicit) {
      err("exit(" + status + ") called, but EXIT_RUNTIME is not set, so halting execution but not exiting the runtime or preventing further async execution (build with EXIT_RUNTIME=1, if you want a true shutdown)");
    }
  } else {
    ABORT = true;
    EXITSTATUS = status;
    STACKTOP = initialStackTop;
    exitRuntime();
    if (Module["onExit"]) Module["onExit"](status);
  }
  Module["quit"](status, new ExitStatus(status));
}

var abortDecorators = [];

function abort(what) {
  if (Module["onAbort"]) {
    Module["onAbort"](what);
  }
  if (what !== undefined) {
    out(what);
    err(what);
    what = JSON.stringify(what);
  } else {
    what = "";
  }
  ABORT = true;
  EXITSTATUS = 1;
  var extra = "";
  var output = "abort(" + what + ") at " + stackTrace() + extra;
  if (abortDecorators) {
    abortDecorators.forEach(function(decorator) {
      output = decorator(output, what);
    });
  }
  throw output;
}

Module["abort"] = abort;

if (Module["preInit"]) {
  if (typeof Module["preInit"] == "function") Module["preInit"] = [ Module["preInit"] ];
  while (Module["preInit"].length > 0) {
    Module["preInit"].pop()();
  }
}

Module["noExitRuntime"] = true;

run();

Module.inspect = (() => "[asm]");

if (orig_module !== undefined) {
  module = orig_module;
  orig_module = undefined;
}

"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function bytebuf(buf) {
  if (buf instanceof Uint8Array) {
    return buf;
  }
  return new Uint8Array(buf);
}

function withTmpBytePtr(buf, fn) {
  const u8buf = bytebuf(buf);
  const size = u8buf.length;
  const ptr = mallocbuf(u8buf, size);
  const r = fn(ptr, size);
  _free(ptr);
  return r;
}

function mallocbuf(byteArray, length) {
  const offs = _malloc(length);
  HEAPU8.set(byteArray, offs);
  return offs;
}

function malloc32(size) {
  let ptr_orig = _malloc(size + 3);
  return [ ptr_orig, ptr_orig + (4 - ptr_orig % 4) ];
}

function writeUTF16Str(str, ptr) {
  for (let i = 0; i < str.length; ++i) {
    HEAP16[ptr >> 1] = str.charCodeAt(i);
    ptr += 2;
  }
}

function withUTF16Str(str, fn) {
  let bytesize = str.length * 2;
  let ptr = _malloc(bytesize + 1);
  let aligned_ptr = ptr % 2 != 0 ? ptr + 1 : ptr;
  writeUTF16Str(str, aligned_ptr, bytesize);
  fn(aligned_ptr, bytesize);
  _free(ptr);
}

function asciicstr(buf, offset) {
  let str = "";
  while (true) {
    let b = buf[offset++ >> 0];
    if (b == 0) {
      break;
    }
    str += String.fromCharCode(b);
  }
  return str;
}

function cstrStack(str) {
  var ret = 0;
  if (str !== null && str !== undefined && str !== 0) {
    var len = (str.length << 2) + 1;
    ret = stackAlloc(len);
    stringToUTF8Array(str, HEAPU8, ret, len);
  }
  return ret;
}

let tmpPtr = 0;

Module.postRun.push(() => {
  tmpPtr = _malloc(4);
});

function strFromUTF8Ptr(fn) {
  let z = fn(tmpPtr);
  let offs = HEAP32[tmpPtr >> 2];
  return z == 0 ? "" : utf8.decode(HEAPU8.subarray(offs, offs + z));
}

function withStackFrame(fn) {
  let stack = stackSave();
  try {
    return fn();
  } finally {
    stackRestore(stack);
  }
}

function ureadU16(buf, addr) {
  return (buf[addr] | buf[addr + 1] << 8) >>> 0;
}

function ureadI16(buf, addr) {
  let n = buf[addr] | buf[addr + 1] << 8;
  return n >= 32768 ? n - 65536 : n;
}

function ureadU32(buf, addr) {
  return (buf[addr + 3] << 24 | buf[addr + 2] << 16 | buf[addr + 1] << 8 | buf[addr] >>> 0) >>> 0;
}

function ureadI32(buf, addr) {
  return buf[addr + 3] << 24 | buf[addr + 2] << 16 | buf[addr + 1] << 8 | buf[addr] >>> 0;
}

function hbtag(name) {
  return name.charCodeAt(0) >>> 0 << 24 >>> 0 | name.charCodeAt(1) >>> 0 << 16 | name.charCodeAt(2) >>> 0 << 8 | name.charCodeAt(3) >>> 0;
}

function hbtagStr(tag) {
  return String.fromCharCode(tag >> 24 & 255, tag >> 16 & 255, tag >> 8 & 255, tag >> 0 & 255);
}

const utf8 = typeof TextEncoder != "undefined" ? (() => {
  const enc = new TextEncoder("utf-8");
  const dec = new TextDecoder("utf-8");
  return {
    encode: s => enc.encode(s),
    decode: b => dec.decode(b)
  };
})() : typeof Buffer != "undefined" ? {
  encode: s => new Uint8Array(Buffer.from(s, "utf-8")),
  decode: b => Buffer.from(b.buffer, b.byteOffset, b.byteLength).toString("utf8")
} : {
  encode: s => {
    let asciiBytes = [];
    for (let i = 0, L = s.length; i != L; ++i) {
      asciiBytes[i] = 255 & s.charCodeAt(i);
    }
    return new Uint8Array(asciiBytes);
  },
  decode: b => String(b)
};

function fixedToFloat(i) {
  return i / 65536;
}

class StructDesc {
  constructor(size, fields) {
    this.size = size;
    this.fields = fields;
    for (let fname in fields) {
      const field = fields[fname];
      const foffset = field.offset;
      switch (field.type) {
       case 1:
        field.read = (stptr => HEAPU8[stptr + foffset]);
        field.readv = ((stptr, stindex) => HEAPU8[stptr + stindex * this.size + foffset]);
        break;

       case 2:
        field.read = (stptr => HEAP8[stptr + foffset]);
        field.readv = ((stptr, stindex) => HEAP8[stptr + stindex * this.size + foffset]);
        break;

       case 3:
        field.read = (stptr => ureadU16(HEAPU8, stptr + foffset));
        field.readv = ((stptr, stindex) => ureadU16(HEAPU8, stptr + stindex * this.size + foffset));
        break;

       case 4:
        field.read = (stptr => ureadI16(HEAPU8, stptr + foffset));
        field.readv = ((stptr, stindex) => ureadI16(HEAPU8, stptr + stindex * this.size + foffset));
        break;

       case 5:
       case 32:
        field.read = (stptr => ureadU32(HEAPU8, stptr + foffset));
        field.readv = ((stptr, stindex) => ureadU32(HEAPU8, stptr + stindex * this.size + foffset));
        break;

       case 6:
        field.read = (stptr => ureadI32(HEAPU8, stptr + foffset));
        field.readv = ((stptr, stindex) => ureadI32(HEAPU8, stptr + stindex * this.size + foffset));
        break;

       case 48:
        field.read = (stptr => asciicstr(HEAPU8, stptr + foffset));
        field.readv = ((stptr, stindex) => asciicstr(HEAPU8, stptr + stindex * this.size + foffset));
        break;

       default:
        throw new Error(`unexpected type 0x${field.type.toString(16)}`);
      }
    }
  }
}

function StDescParseBuf(buf, offs) {
  let p = offs;
  const size = ureadU16(buf, p);
  p += 2;
  let nfields = buf[p++];
  const fields = Object.create(null);
  while (nfields--) {
    const offset = ureadU16(buf, p);
    p += 2;
    const type = buf[p++];
    let namelen = buf[p++];
    let name = "";
    while (namelen--) {
      name += String.fromCharCode(buf[p++]);
    }
    fields[name] = {
      offset,
      type
    };
  }
  return new StructDesc(size, fields);
}

function StDescParse(ptr) {
  const r = StDescParseBuf(HEAPU8, ptr);
  _free(ptr);
  return r;
}

const consts = {
  FKGlyphInfoStruct: null,
  FKGlyphPosStruct: null
};

Module.postRun.push(() => {
  consts.FKGlyphInfoStruct = StDescParse(_FKGlyphInfoStructDesc());
  consts.FKGlyphPosStruct = StDescParse(_FKBufGlyphPosStructDesc());
});

class FKError extends Error {
  constructor(code, message, file, line) {
    if (code === undefined) {
      code = _FKErrGetCode();
      const msgptr = _FKErrGetMsg();
      message = msgptr != 0 ? UTF8ArrayToString(HEAPU8, msgptr) : "";
      file = "fontkit.wasm";
      line = 0;
      _FKErrClear();
    }
    super(message, file, line);
    this.name = "FKError";
    this.code = code;
  }
}

const HB_SCRIPT_COMMON = hbtag("Zyyy"), HB_SCRIPT_INHERITED = hbtag("Zinh"), HB_SCRIPT_UNKNOWN = hbtag("Zzzz");

class Glyph {
  constructor(font, id, advanceX, offsetX, kerningX) {
    this.font = font;
    this.id = id;
    this.advanceX = advanceX;
    this.offsetX = offsetX;
    this.kerningX = kerningX;
  }
  get name() {
    return this.font.glyphName(this.id);
  }
}

class GlyphIterator {
  constructor(ptr, font) {
    this.font = font;
    this.length = _FKBufGlyphInfoLen(ptr);
    this.infoptr = _FKBufGlyphInfoPtr(ptr);
    this.posptr = _FKBufGlyphPosPtr(ptr);
    let poslen = _FKBufGlyphPosLen(ptr);
    if (poslen != this.length) {
      console.warn(`FKBufGlyphPosLen != FKBufGlyphInfoLen -- using smallest`);
      this.length = Math.min(this.length, poslen);
    }
    this.index = 0;
  }
  next() {
    if (this.index == this.length) {
      return {
        done: true,
        value: null
      };
    }
    let i = this.index++;
    const glyph_info = consts.FKGlyphInfoStruct.fields;
    let gid = glyph_info.id.readv(this.infoptr, i);
    const glyph_pos = consts.FKGlyphPosStruct.fields;
    let advanceX = glyph_pos.x_advance.readv(this.posptr, i);
    let offsetX = glyph_pos.x_offset.readv(this.posptr, i);
    const kerningX = advanceX - _FKFontGetGlyphAdvance(this.font.ptr, gid);
    return {
      done: false,
      value: new Glyph(this.font, gid, advanceX, offsetX, kerningX)
    };
  }
}

class Glyphs {
  constructor(font) {
    this.ptr = _FKBufAlloc();
    this.font = font;
  }
  dispose() {
    if (this.ptr) {
      _FKBufFree(this.ptr);
      this.ptr = 0;
    }
  }
  setScript(script) {
    let tag = HB_SCRIPT_UNKNOWN;
    if (script) {
      script = String(script);
      if (script == "inherit") {
        tag = HB_SCRIPT_INHERITED;
      } else if (script == "common") {
        tag = HB_SCRIPT_COMMON;
      } else if (script.length > 4) {
        throw new Error("invalid script tag");
      } else {
        tag = hbtag(script);
      }
    }
    return this.setScriptTag(tag);
  }
  script() {
    let tag = this.scriptTag();
    if (tag == HB_SCRIPT_COMMON) {
      return "common";
    } else if (tag == HB_SCRIPT_INHERITED) {
      return "inherit";
    } else if (tag == HB_SCRIPT_UNKNOWN) {
      return undefined;
    }
    return hbtagStr(tag);
  }
  setScriptTag(tag) {
    return _FKBufSetScript(this.ptr, tag);
  }
  scriptTag() {
    return _FKBufGetScript(this.ptr);
  }
  setLanguage(language) {
    language = !language ? null : String(language);
    return withStackFrame(() => !!_FKBufSetLanguage(this.ptr, cstrStack(language), -1));
  }
  language() {
    let pch = _FKBufGetLanguage(this.ptr);
    if (pch != 0) {
      return asciicstr(HEAPU8, pch);
    }
  }
  [Symbol.iterator]() {
    return new GlyphIterator(this.ptr, this.font);
  }
}

class FontVariations {
  constructor(vptr) {
    this.ptr = vptr;
    let n = _FKVarGetStyleCount(vptr);
    this.styles = new Array(n);
    for (let i = 0; i < n; i++) {
      this.styles[i] = new VarStyle(vptr, i);
    }
    n = _FKVarGetAxisCount(vptr);
    this.axes = new Array(n);
    let p1 = _malloc(8), p2 = p1 + 4;
    for (let i = 0; i < n; i++) {
      let def = fixedToFloat(_FKVarGetAxisRange(vptr, i, p1, p2));
      let min = fixedToFloat(HEAP32[p1 >> 2]);
      let max = fixedToFloat(HEAP32[p2 >> 2]);
      this.axes[i] = new VarAxis(vptr, i, min, max, def);
    }
    _free(p1);
  }
}

class VarStyle {
  constructor(vptr, index) {
    this._vptr = vptr;
    this.index = index;
  }
  get name() {
    let s = strFromUTF8Ptr(p => _FKVarGetStyleName(this._vptr, this.index, p));
    Object.defineProperty(this, "name", {
      value: s,
      enumerable: true
    });
    return s;
  }
}

class VarAxis {
  constructor(vptr, index, min, max, default_) {
    this._vptr = vptr;
    this.index = index;
    this.min = min;
    this.max = max;
    this.default = default_;
  }
  get name() {
    let s = strFromUTF8Ptr(p => _FKVarGetAxisName(this._vptr, this.index, p));
    Object.defineProperty(this, "name", {
      value: s,
      enumerable: true
    });
    return s;
  }
}

class Font {
  constructor() {
    this.ptr = null;
    this.dataptr = null;
    this.info = {};
    this._glyphNameCache = new Map();
    this._glyphNamePtr = 0;
  }
  load(buf) {
    this.dispose();
    const u8buf = bytebuf(buf);
    const buflen = u8buf.length;
    this.dataptr = mallocbuf(u8buf, buflen);
    this.ptr = _FKFontCreate(this.dataptr, buflen);
    if (this.ptr == 0) {
      _free(this.dataptr);
      throw new FKError();
    }
    const objprops = {};
    const accessorPrefix = "_FKFontGet_";
    for (let k in asm) {
      if (k.startsWith(accessorPrefix)) {
        let name = k.substr(accessorPrefix.length).toLowerCase();
        name = name.replace(/_(.)/g, (m, a) => a.toUpperCase());
        objprops[name] = {
          configurable: true,
          enumerable: true,
          get: () => {
            let value = asm[k](this.ptr);
            if (k.endsWith("_name")) {
              value = UTF8ArrayToString(HEAPU8, value);
            }
            Object.defineProperty(this, name, {
              enumerable: true,
              value
            });
            return value;
          }
        };
      }
    }
    this.info = Object.create(null, objprops);
    _FKFontFeatures(this.ptr);
  }
  dispose() {
    if (this.ptr) {
      _FKFontFree(this.ptr);
      this.ptr = 0;
      _free(this.dataptr);
      this.dataptr = 0;
    }
    if (this._glyphNamePtr) {
      _free(this._glyphNamePtr);
      this._glyphNamePtr = 0;
    }
  }
  toString() {
    let s = `[Font#0x${this.ptr.toString(16)}`;
    if (this.info.family_name) {
      s += " " + this.info.family_name;
    }
    if (this.info.style_name) {
      s += " " + this.info.style_name;
    }
    return s + "]";
  }
  get variations() {
    let v = null, vptr = _FKFontGetVar(this.ptr);
    if (vptr != 0) {
      v = new FontVariations(vptr);
    }
    Object.defineProperty(this, "variations", {
      value: v,
      enumerable: true
    });
    return v;
  }
  glyphName(gid) {
    let name = this._glyphNameCache.get(gid);
    if (name === undefined) {
      if (this._glyphNamePtr == 0) {
        this._glyphNamePtr = _malloc(256);
      }
      if (!_FKFontGetGlyphName(this.ptr, gid >>> 0, this._glyphNamePtr, 256)) {
        throw new FKError();
      }
      name = UTF8ArrayToString(HEAPU8, this._glyphNamePtr);
      this._glyphNameCache.set(gid, name);
    }
    return name;
  }
  layout(text, config) {
    let g = allocGlyphsObj(this);
    withUTF16Str(text, (textptr, _) => {
      _FKBufAppendUTF16(g.ptr, textptr, text.length);
    });
    try {
      this._layout(g, config);
    } catch (err) {
      g.dispose();
      throw err;
    }
    return g;
  }
  layoutUTF8(bytes, config) {
    let g = allocGlyphsObj(this);
    withTmpBytePtr(bytes, (ptr, bytesize) => {
      _FKBufAppendUTF8(g.ptr, ptr, bytesize);
    });
    try {
      this._layout(g, config);
    } catch (err) {
      g.dispose();
      throw err;
    }
    return g;
  }
  _layout(g, config) {
    let featptr = 0, nfeats = 0;
    if (config) {
      featptr = config._featPtr;
      nfeats = config._featCount;
      g.setLanguage(config.language);
      g.setScript(config.script);
    } else {
      g.setLanguage(null);
      g.setScript(null);
    }
    if (!_FKFontLayout(this.ptr, g.ptr, featptr, nfeats)) {
      throw new FKError();
    }
  }
}

const glyphsFreeList = [];

function allocGlyphsObj(font) {
  let g = glyphsFreeList.pop();
  if (g) {
    _FKBufReset(g.ptr);
    g.font = font;
  } else {
    g = new Glyphs(font);
    g.dispose = (() => {
      g.font = null;
      if (g.ptr) {
        glyphsFreeList.push(g);
      }
    });
  }
  return g;
}

console.time("fontkit load");

Module.postRun.push(() => {
  console.timeEnd("fontkit load");
  if (_FKErrGetCode() != 0) {
    throw new FKError();
  }
});

function load(source) {
  const font = new Font();
  if (typeof source == "string") {
    return fetch(source, {
      credentials: "same-origin"
    }).then(r => r.arrayBuffer()).then(buf => {
      font.load(buf);
      return font;
    });
  }
  font.load(source);
  return font;
}

function demo1(buf) {
  return withTmpBytePtr(buf, (ptr, size) => _FKDemo1(ptr, size));
}

const NULL = 0 >>> 0;

const U32_MAX = -1 >>> 0;

const features = {
  aalt: {
    tag: hbtag("aalt"),
    name: "Access All Alternates"
  },
  abvf: {
    tag: hbtag("abvf"),
    name: "Above-base Forms"
  },
  abvm: {
    tag: hbtag("abvm"),
    name: "Above-base Mark Positioning"
  },
  abvs: {
    tag: hbtag("abvs"),
    name: "Above-base Substitutions"
  },
  afrc: {
    tag: hbtag("afrc"),
    name: "Alternative Fractions"
  },
  akhn: {
    tag: hbtag("akhn"),
    name: "Akhands"
  },
  blwf: {
    tag: hbtag("blwf"),
    name: "Below-base Forms"
  },
  blwm: {
    tag: hbtag("blwm"),
    name: "Below-base Mark Positioning"
  },
  blws: {
    tag: hbtag("blws"),
    name: "Below-base Substitutions"
  },
  calt: {
    tag: hbtag("calt"),
    name: "Contextual Alternates"
  },
  case: {
    tag: hbtag("case"),
    name: "Case-Sensitive Forms"
  },
  ccmp: {
    tag: hbtag("ccmp"),
    name: "Glyph Composition / Decomposition"
  },
  cfar: {
    tag: hbtag("cfar"),
    name: "Conjunct Form After Ro"
  },
  cjct: {
    tag: hbtag("cjct"),
    name: "Conjunct Forms"
  },
  clig: {
    tag: hbtag("clig"),
    name: "Contextual Ligatures"
  },
  cpct: {
    tag: hbtag("cpct"),
    name: "Centered CJK Punctuation"
  },
  cpsp: {
    tag: hbtag("cpsp"),
    name: "Capital Spacing"
  },
  cswh: {
    tag: hbtag("cswh"),
    name: "Contextual Swash"
  },
  curs: {
    tag: hbtag("curs"),
    name: "Cursive Positioning"
  },
  cv01: {
    tag: hbtag("cv01"),
    name: "Character Variant 1"
  },
  cv02: {
    tag: hbtag("cv02"),
    name: "Character Variant 2"
  },
  cv03: {
    tag: hbtag("cv03"),
    name: "Character Variant 3"
  },
  cv04: {
    tag: hbtag("cv04"),
    name: "Character Variant 4"
  },
  cv05: {
    tag: hbtag("cv05"),
    name: "Character Variant 5"
  },
  cv06: {
    tag: hbtag("cv06"),
    name: "Character Variant 6"
  },
  cv07: {
    tag: hbtag("cv07"),
    name: "Character Variant 7"
  },
  cv08: {
    tag: hbtag("cv08"),
    name: "Character Variant 8"
  },
  cv09: {
    tag: hbtag("cv09"),
    name: "Character Variant 9"
  },
  cv10: {
    tag: hbtag("cv10"),
    name: "Character Variant 10"
  },
  cv11: {
    tag: hbtag("cv11"),
    name: "Character Variant 11"
  },
  cv12: {
    tag: hbtag("cv12"),
    name: "Character Variant 12"
  },
  cv13: {
    tag: hbtag("cv13"),
    name: "Character Variant 13"
  },
  cv14: {
    tag: hbtag("cv14"),
    name: "Character Variant 14"
  },
  cv15: {
    tag: hbtag("cv15"),
    name: "Character Variant 15"
  },
  cv16: {
    tag: hbtag("cv16"),
    name: "Character Variant 16"
  },
  cv17: {
    tag: hbtag("cv17"),
    name: "Character Variant 17"
  },
  cv18: {
    tag: hbtag("cv18"),
    name: "Character Variant 18"
  },
  cv19: {
    tag: hbtag("cv19"),
    name: "Character Variant 19"
  },
  cv20: {
    tag: hbtag("cv20"),
    name: "Character Variant 20"
  },
  cv21: {
    tag: hbtag("cv21"),
    name: "Character Variant 21"
  },
  cv22: {
    tag: hbtag("cv22"),
    name: "Character Variant 22"
  },
  cv23: {
    tag: hbtag("cv23"),
    name: "Character Variant 23"
  },
  cv24: {
    tag: hbtag("cv24"),
    name: "Character Variant 24"
  },
  cv25: {
    tag: hbtag("cv25"),
    name: "Character Variant 25"
  },
  cv26: {
    tag: hbtag("cv26"),
    name: "Character Variant 26"
  },
  cv27: {
    tag: hbtag("cv27"),
    name: "Character Variant 27"
  },
  cv28: {
    tag: hbtag("cv28"),
    name: "Character Variant 28"
  },
  cv29: {
    tag: hbtag("cv29"),
    name: "Character Variant 29"
  },
  cv30: {
    tag: hbtag("cv30"),
    name: "Character Variant 30"
  },
  cv31: {
    tag: hbtag("cv31"),
    name: "Character Variant 31"
  },
  cv32: {
    tag: hbtag("cv32"),
    name: "Character Variant 32"
  },
  cv33: {
    tag: hbtag("cv33"),
    name: "Character Variant 33"
  },
  cv34: {
    tag: hbtag("cv34"),
    name: "Character Variant 34"
  },
  cv35: {
    tag: hbtag("cv35"),
    name: "Character Variant 35"
  },
  cv36: {
    tag: hbtag("cv36"),
    name: "Character Variant 36"
  },
  cv37: {
    tag: hbtag("cv37"),
    name: "Character Variant 37"
  },
  cv38: {
    tag: hbtag("cv38"),
    name: "Character Variant 38"
  },
  cv39: {
    tag: hbtag("cv39"),
    name: "Character Variant 39"
  },
  cv40: {
    tag: hbtag("cv40"),
    name: "Character Variant 40"
  },
  cv41: {
    tag: hbtag("cv41"),
    name: "Character Variant 41"
  },
  cv42: {
    tag: hbtag("cv42"),
    name: "Character Variant 42"
  },
  cv43: {
    tag: hbtag("cv43"),
    name: "Character Variant 43"
  },
  cv44: {
    tag: hbtag("cv44"),
    name: "Character Variant 44"
  },
  cv45: {
    tag: hbtag("cv45"),
    name: "Character Variant 45"
  },
  cv46: {
    tag: hbtag("cv46"),
    name: "Character Variant 46"
  },
  cv47: {
    tag: hbtag("cv47"),
    name: "Character Variant 47"
  },
  cv48: {
    tag: hbtag("cv48"),
    name: "Character Variant 48"
  },
  cv49: {
    tag: hbtag("cv49"),
    name: "Character Variant 49"
  },
  cv50: {
    tag: hbtag("cv50"),
    name: "Character Variant 50"
  },
  cv51: {
    tag: hbtag("cv51"),
    name: "Character Variant 51"
  },
  cv52: {
    tag: hbtag("cv52"),
    name: "Character Variant 52"
  },
  cv53: {
    tag: hbtag("cv53"),
    name: "Character Variant 53"
  },
  cv54: {
    tag: hbtag("cv54"),
    name: "Character Variant 54"
  },
  cv55: {
    tag: hbtag("cv55"),
    name: "Character Variant 55"
  },
  cv56: {
    tag: hbtag("cv56"),
    name: "Character Variant 56"
  },
  cv57: {
    tag: hbtag("cv57"),
    name: "Character Variant 57"
  },
  cv58: {
    tag: hbtag("cv58"),
    name: "Character Variant 58"
  },
  cv59: {
    tag: hbtag("cv59"),
    name: "Character Variant 59"
  },
  cv60: {
    tag: hbtag("cv60"),
    name: "Character Variant 60"
  },
  cv61: {
    tag: hbtag("cv61"),
    name: "Character Variant 61"
  },
  cv62: {
    tag: hbtag("cv62"),
    name: "Character Variant 62"
  },
  cv63: {
    tag: hbtag("cv63"),
    name: "Character Variant 63"
  },
  cv64: {
    tag: hbtag("cv64"),
    name: "Character Variant 64"
  },
  cv65: {
    tag: hbtag("cv65"),
    name: "Character Variant 65"
  },
  cv66: {
    tag: hbtag("cv66"),
    name: "Character Variant 66"
  },
  cv67: {
    tag: hbtag("cv67"),
    name: "Character Variant 67"
  },
  cv68: {
    tag: hbtag("cv68"),
    name: "Character Variant 68"
  },
  cv69: {
    tag: hbtag("cv69"),
    name: "Character Variant 69"
  },
  cv70: {
    tag: hbtag("cv70"),
    name: "Character Variant 70"
  },
  cv71: {
    tag: hbtag("cv71"),
    name: "Character Variant 71"
  },
  cv72: {
    tag: hbtag("cv72"),
    name: "Character Variant 72"
  },
  cv73: {
    tag: hbtag("cv73"),
    name: "Character Variant 73"
  },
  cv74: {
    tag: hbtag("cv74"),
    name: "Character Variant 74"
  },
  cv75: {
    tag: hbtag("cv75"),
    name: "Character Variant 75"
  },
  cv76: {
    tag: hbtag("cv76"),
    name: "Character Variant 76"
  },
  cv77: {
    tag: hbtag("cv77"),
    name: "Character Variant 77"
  },
  cv78: {
    tag: hbtag("cv78"),
    name: "Character Variant 78"
  },
  cv79: {
    tag: hbtag("cv79"),
    name: "Character Variant 79"
  },
  cv80: {
    tag: hbtag("cv80"),
    name: "Character Variant 80"
  },
  cv81: {
    tag: hbtag("cv81"),
    name: "Character Variant 81"
  },
  cv82: {
    tag: hbtag("cv82"),
    name: "Character Variant 82"
  },
  cv83: {
    tag: hbtag("cv83"),
    name: "Character Variant 83"
  },
  cv84: {
    tag: hbtag("cv84"),
    name: "Character Variant 84"
  },
  cv85: {
    tag: hbtag("cv85"),
    name: "Character Variant 85"
  },
  cv86: {
    tag: hbtag("cv86"),
    name: "Character Variant 86"
  },
  cv87: {
    tag: hbtag("cv87"),
    name: "Character Variant 87"
  },
  cv88: {
    tag: hbtag("cv88"),
    name: "Character Variant 88"
  },
  cv89: {
    tag: hbtag("cv89"),
    name: "Character Variant 89"
  },
  cv90: {
    tag: hbtag("cv90"),
    name: "Character Variant 90"
  },
  cv91: {
    tag: hbtag("cv91"),
    name: "Character Variant 91"
  },
  cv92: {
    tag: hbtag("cv92"),
    name: "Character Variant 92"
  },
  cv93: {
    tag: hbtag("cv93"),
    name: "Character Variant 93"
  },
  cv94: {
    tag: hbtag("cv94"),
    name: "Character Variant 94"
  },
  cv95: {
    tag: hbtag("cv95"),
    name: "Character Variant 95"
  },
  cv96: {
    tag: hbtag("cv96"),
    name: "Character Variant 96"
  },
  cv97: {
    tag: hbtag("cv97"),
    name: "Character Variant 97"
  },
  cv98: {
    tag: hbtag("cv98"),
    name: "Character Variant 98"
  },
  cv99: {
    tag: hbtag("cv99"),
    name: "Character Variant 99"
  },
  c2pc: {
    tag: hbtag("c2pc"),
    name: "Petite Capitals From Capitals"
  },
  c2sc: {
    tag: hbtag("c2sc"),
    name: "Small Capitals From Capitals"
  },
  dist: {
    tag: hbtag("dist"),
    name: "Distances"
  },
  dlig: {
    tag: hbtag("dlig"),
    name: "Discretionary Ligatures"
  },
  dnom: {
    tag: hbtag("dnom"),
    name: "Denominators"
  },
  dtls: {
    tag: hbtag("dtls"),
    name: "Dotless Forms"
  },
  expt: {
    tag: hbtag("expt"),
    name: "Expert Forms"
  },
  falt: {
    tag: hbtag("falt"),
    name: "Final Glyph on Line Alternates"
  },
  fin2: {
    tag: hbtag("fin2"),
    name: "Terminal Forms #2"
  },
  fin3: {
    tag: hbtag("fin3"),
    name: "Terminal Forms #3"
  },
  fina: {
    tag: hbtag("fina"),
    name: "Terminal Forms"
  },
  flac: {
    tag: hbtag("flac"),
    name: "Flattened accent forms"
  },
  frac: {
    tag: hbtag("frac"),
    name: "Fractions"
  },
  fwid: {
    tag: hbtag("fwid"),
    name: "Full Widths"
  },
  half: {
    tag: hbtag("half"),
    name: "Half Forms"
  },
  haln: {
    tag: hbtag("haln"),
    name: "Halant Forms"
  },
  halt: {
    tag: hbtag("halt"),
    name: "Alternate Half Widths"
  },
  hist: {
    tag: hbtag("hist"),
    name: "Historical Forms"
  },
  hkna: {
    tag: hbtag("hkna"),
    name: "Horizontal Kana Alternates"
  },
  hlig: {
    tag: hbtag("hlig"),
    name: "Historical Ligatures"
  },
  hngl: {
    tag: hbtag("hngl"),
    name: "Hangul"
  },
  hojo: {
    tag: hbtag("hojo"),
    name: "Hojo Kanji Forms (JIS X 0212-1990 Kanji Forms)"
  },
  hwid: {
    tag: hbtag("hwid"),
    name: "Half Widths"
  },
  init: {
    tag: hbtag("init"),
    name: "Initial Forms"
  },
  isol: {
    tag: hbtag("isol"),
    name: "Isolated Forms"
  },
  ital: {
    tag: hbtag("ital"),
    name: "Italics"
  },
  jalt: {
    tag: hbtag("jalt"),
    name: "Justification Alternates"
  },
  jp78: {
    tag: hbtag("jp78"),
    name: "JIS78 Forms"
  },
  jp83: {
    tag: hbtag("jp83"),
    name: "JIS83 Forms"
  },
  jp90: {
    tag: hbtag("jp90"),
    name: "JIS90 Forms"
  },
  jp04: {
    tag: hbtag("jp04"),
    name: "JIS2004 Forms"
  },
  kern: {
    tag: hbtag("kern"),
    name: "Kerning"
  },
  lfbd: {
    tag: hbtag("lfbd"),
    name: "Left Bounds"
  },
  liga: {
    tag: hbtag("liga"),
    name: "Standard Ligatures"
  },
  ljmo: {
    tag: hbtag("ljmo"),
    name: "Leading Jamo Forms"
  },
  lnum: {
    tag: hbtag("lnum"),
    name: "Lining Figures"
  },
  locl: {
    tag: hbtag("locl"),
    name: "Localized Forms"
  },
  ltra: {
    tag: hbtag("ltra"),
    name: "Left-to-right alternates"
  },
  ltrm: {
    tag: hbtag("ltrm"),
    name: "Left-to-right mirrored forms"
  },
  mark: {
    tag: hbtag("mark"),
    name: "Mark Positioning"
  },
  med2: {
    tag: hbtag("med2"),
    name: "Medial Forms #2"
  },
  medi: {
    tag: hbtag("medi"),
    name: "Medial Forms"
  },
  mgrk: {
    tag: hbtag("mgrk"),
    name: "Mathematical Greek"
  },
  mkmk: {
    tag: hbtag("mkmk"),
    name: "Mark to Mark Positioning"
  },
  mset: {
    tag: hbtag("mset"),
    name: "Mark Positioning via Substitution"
  },
  nalt: {
    tag: hbtag("nalt"),
    name: "Alternate Annotation Forms"
  },
  nlck: {
    tag: hbtag("nlck"),
    name: "NLC Kanji Forms"
  },
  nukt: {
    tag: hbtag("nukt"),
    name: "Nukta Forms"
  },
  numr: {
    tag: hbtag("numr"),
    name: "Numerators"
  },
  onum: {
    tag: hbtag("onum"),
    name: "Oldstyle Figures"
  },
  opbd: {
    tag: hbtag("opbd"),
    name: "Optical Bounds"
  },
  ordn: {
    tag: hbtag("ordn"),
    name: "Ordinals"
  },
  ornm: {
    tag: hbtag("ornm"),
    name: "Ornaments"
  },
  palt: {
    tag: hbtag("palt"),
    name: "Proportional Alternate Widths"
  },
  pcap: {
    tag: hbtag("pcap"),
    name: "Petite Capitals"
  },
  pkna: {
    tag: hbtag("pkna"),
    name: "Proportional Kana"
  },
  pnum: {
    tag: hbtag("pnum"),
    name: "Proportional Figures"
  },
  pref: {
    tag: hbtag("pref"),
    name: "Pre-Base Forms"
  },
  pres: {
    tag: hbtag("pres"),
    name: "Pre-base Substitutions"
  },
  pstf: {
    tag: hbtag("pstf"),
    name: "Post-base Forms"
  },
  psts: {
    tag: hbtag("psts"),
    name: "Post-base Substitutions"
  },
  pwid: {
    tag: hbtag("pwid"),
    name: "Proportional Widths"
  },
  qwid: {
    tag: hbtag("qwid"),
    name: "Quarter Widths"
  },
  rand: {
    tag: hbtag("rand"),
    name: "Randomize"
  },
  rclt: {
    tag: hbtag("rclt"),
    name: "Required Contextual Alternates"
  },
  rkrf: {
    tag: hbtag("rkrf"),
    name: "Rakar Forms"
  },
  rlig: {
    tag: hbtag("rlig"),
    name: "Required Ligatures"
  },
  rphf: {
    tag: hbtag("rphf"),
    name: "Reph Forms"
  },
  rtbd: {
    tag: hbtag("rtbd"),
    name: "Right Bounds"
  },
  rtla: {
    tag: hbtag("rtla"),
    name: "Right-to-left alternates"
  },
  rtlm: {
    tag: hbtag("rtlm"),
    name: "Right-to-left mirrored forms"
  },
  ruby: {
    tag: hbtag("ruby"),
    name: "Ruby Notation Forms"
  },
  rvrn: {
    tag: hbtag("rvrn"),
    name: "Required Variation Alternates"
  },
  salt: {
    tag: hbtag("salt"),
    name: "Stylistic Alternates"
  },
  sinf: {
    tag: hbtag("sinf"),
    name: "Scientific Inferiors"
  },
  size: {
    tag: hbtag("size"),
    name: "Optical size"
  },
  smcp: {
    tag: hbtag("smcp"),
    name: "Small Capitals"
  },
  smpl: {
    tag: hbtag("smpl"),
    name: "Simplified Forms"
  },
  ss01: {
    tag: hbtag("ss01"),
    name: "Stylistic Set 1"
  },
  ss02: {
    tag: hbtag("ss02"),
    name: "Stylistic Set 2"
  },
  ss03: {
    tag: hbtag("ss03"),
    name: "Stylistic Set 3"
  },
  ss04: {
    tag: hbtag("ss04"),
    name: "Stylistic Set 4"
  },
  ss05: {
    tag: hbtag("ss05"),
    name: "Stylistic Set 5"
  },
  ss06: {
    tag: hbtag("ss06"),
    name: "Stylistic Set 6"
  },
  ss07: {
    tag: hbtag("ss07"),
    name: "Stylistic Set 7"
  },
  ss08: {
    tag: hbtag("ss08"),
    name: "Stylistic Set 8"
  },
  ss09: {
    tag: hbtag("ss09"),
    name: "Stylistic Set 9"
  },
  ss10: {
    tag: hbtag("ss10"),
    name: "Stylistic Set 10"
  },
  ss11: {
    tag: hbtag("ss11"),
    name: "Stylistic Set 11"
  },
  ss12: {
    tag: hbtag("ss12"),
    name: "Stylistic Set 12"
  },
  ss13: {
    tag: hbtag("ss13"),
    name: "Stylistic Set 13"
  },
  ss14: {
    tag: hbtag("ss14"),
    name: "Stylistic Set 14"
  },
  ss15: {
    tag: hbtag("ss15"),
    name: "Stylistic Set 15"
  },
  ss16: {
    tag: hbtag("ss16"),
    name: "Stylistic Set 16"
  },
  ss17: {
    tag: hbtag("ss17"),
    name: "Stylistic Set 17"
  },
  ss18: {
    tag: hbtag("ss18"),
    name: "Stylistic Set 18"
  },
  ss19: {
    tag: hbtag("ss19"),
    name: "Stylistic Set 19"
  },
  ss20: {
    tag: hbtag("ss20"),
    name: "Stylistic Set 20"
  },
  ssty: {
    tag: hbtag("ssty"),
    name: "Math script style alternates"
  },
  stch: {
    tag: hbtag("stch"),
    name: "Stretching Glyph Decomposition"
  },
  subs: {
    tag: hbtag("subs"),
    name: "Subscript"
  },
  sups: {
    tag: hbtag("sups"),
    name: "Superscript"
  },
  swsh: {
    tag: hbtag("swsh"),
    name: "Swash"
  },
  titl: {
    tag: hbtag("titl"),
    name: "Titling"
  },
  tjmo: {
    tag: hbtag("tjmo"),
    name: "Trailing Jamo Forms"
  },
  tnam: {
    tag: hbtag("tnam"),
    name: "Traditional Name Forms"
  },
  tnum: {
    tag: hbtag("tnum"),
    name: "Tabular Figures"
  },
  trad: {
    tag: hbtag("trad"),
    name: "Traditional Forms"
  },
  twid: {
    tag: hbtag("twid"),
    name: "Third Widths"
  },
  unic: {
    tag: hbtag("unic"),
    name: "Unicase"
  },
  valt: {
    tag: hbtag("valt"),
    name: "Alternate Vertical Metrics"
  },
  vatu: {
    tag: hbtag("vatu"),
    name: "Vattu Variants"
  },
  vert: {
    tag: hbtag("vert"),
    name: "Vertical Writing"
  },
  vhal: {
    tag: hbtag("vhal"),
    name: "Alternate Vertical Half Metrics"
  },
  vjmo: {
    tag: hbtag("vjmo"),
    name: "Vowel Jamo Forms"
  },
  vkna: {
    tag: hbtag("vkna"),
    name: "Vertical Kana Alternates"
  },
  vkrn: {
    tag: hbtag("vkrn"),
    name: "Vertical Kerning"
  },
  vpal: {
    tag: hbtag("vpal"),
    name: "Proportional Alternate Vertical Metrics"
  },
  vrt2: {
    tag: hbtag("vrt2"),
    name: "Vertical Alternates and Rotation"
  },
  vrtr: {
    tag: hbtag("vrtr"),
    name: "Vertical Alternates for Rotation"
  },
  zero: {
    tag: hbtag("zero"),
    name: "Slashed Zero"
  }
};

class Config {
  constructor(props) {
    this._featPtr = NULL;
    this._featPtrOrig = NULL;
    this._featCount = 0;
    this.features = {};
    if (props && props.features) {
      this.setFeatures(props.features);
    }
    this.language = null;
    this.script = null;
  }
  dispose() {
    this._freeFeatPtr();
  }
  setFeatures(featslist) {
    let feats = [];
    if (featslist) {
      for (let ent of featslist) {
        let feat = null, value = 1 >>> 0, start = 0 >>> 0, end = U32_MAX;
        if (!ent) {
          continue;
        }
        if (typeof ent == "string") {
          feat = features[ent];
        } else if (typeof ent == "object") {
          feat = features[ent.name];
          if (!ent.enabled) {
            value = 0;
          }
          if (ent.start !== undefined) {
            start = ent.start >>> 0;
          }
          if (ent.end !== undefined) {
            end = ent.end >>> 0;
          }
        }
        if (feat === undefined) {
          throw new Error(`unknown feature "${ent.name}"`);
        }
        feats.push([ feat.tag, value, start, end ]);
      }
    }
    this._freeFeatPtr();
    let [featPtrOrig, featPtr] = malloc32(feats.length * 16);
    let p = featPtr;
    for (let [tag, value, start, end] of feats) {
      console.log("init feat:", {
        tag,
        value,
        start,
        end
      });
      HEAP32[p >> 2] = tag;
      p += 4;
      HEAP32[p >> 2] = value;
      p += 4;
      HEAP32[p >> 2] = start;
      p += 4;
      HEAP32[p >> 2] = end;
      p += 4;
    }
    this._featCount = feats.length;
    this._featPtr = featPtr;
    this._featPtrOrig = featPtrOrig;
    this.features = feats;
  }
  _freeFeatPtr() {
    if (this._featPtrOrig != 0) {
      _free(this._featPtrOrig);
      this._featPtr = 0;
      this._featPtrOrig = 0;
      this._featCount = 0;
    }
  }
}

exports.load = load;

exports.demo1 = demo1;

exports.features = features;

exports.Config = Config;

exports.FKError = FKError;

exports.Font = Font;

exports.Glyphs = Glyphs;}).call(this,typeof exports!='undefined'?exports:this["fontkit"]={})