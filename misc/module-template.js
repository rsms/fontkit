"use strict";
(function(define){
  var wasmLoadPromise = fetchWasmModule($MODULE_WASM_URL_STR);

  var Module = {
    // run before and after initializing the module.
    // Can be a function or an array of functions.
    preRun() { console.time('module-init') },
    postRun() { console.timeEnd('module-init') },

    instantiateWasm(info, receiveInstance) {
      wasmLoadPromise
        .then(module => WebAssembly.instantiate(module, info))
        .then(receiveInstance)
      return {} // empty exports until loaded
    },

    print(text) {
      if (arguments.length > 1) {
        text = Array.prototype.slice.call(arguments).join(' ');
      }
      console.log(text);
    },

    printErr(text) {
      if (arguments.length > 1) {
        text = Array.prototype.slice.call(arguments).join(' ');
      }
      console.error(text);
    },

    onRuntimeInitialized() {
      const api = Module['asm']
      define($MODULE_ID_STR, Object.assign({

        memAllocSet(byteArray, length) {
          const offs = api._malloc(length)
          Module.HEAPU8.set(byteArray, offs)
          return offs
        },

      }, api))
    },
  };

  $MODULE_JS

})(
  typeof define == 'function' ? define :
  function(id, m) { window[id] = m }
);
