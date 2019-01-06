(function(exports, require){
  "use strict";

  const CHECK_CYCLES = 1;
  const DEBUG = 1; // = 1 in .g.js builds

  function emptyFunction(){}

  /** @const {Function} */
  const assert = DEBUG ? function(cond) {
    if (!cond) { throw new Error('assertion failure'); }
  } : emptyFunction;

  /** @const {Function} */
  const logdebug = DEBUG ? function(args) {
    if (define['debug']) {
      (console.debug || console.log).apply(
        console,
        ['[define]'].concat(Array.prototype.slice.call(arguments))
      );
    }
  } : emptyFunction;

  /** @private {Map<string|symbol,Module>} */
  let modules = new Map;

  /** @private {Map<string|symbol,Set<string|symbol>>} */
  let waiting = new Map;

  function _require(id) {
    let m = modules.get(id);
    if (!m) {
      if (require) {
        return require(id);
      }
      throw new Error(`unknown module "${id}"`);
    }
    return m.init ? undefined : m['exports'];
  }

  /**
   * @final
   * @constructor
   * @param {string|symbol|null} id
   * @param {Object|null}        exports
   * @param {Array<Object>|null} deps
   * @param {Function|Object}    fn
   */
  function Module(id, exports, deps, fn) {
    this['id']      = id;
    this['exports'] = exports;
    this.deps       = deps;
    this.fn         = fn;
    this.init       = null;
    this.waitdeps   = null;
  }

  // Return the path to dependency 'id' starting at m.
  // Returns null if m does not depend on id.
  // Note: This is not a generic function but only works during initialization
  // and is currently only used for cyclic-dependency check.
  /**
   * @param {Module} m
   * @param {string} id
   */
  function deppath(m, id) { // : Array<string> | null
    if (m.waitdeps) {
      for (let wdepid of m.waitdeps) {
        if (wdepid == id) {
          return [m['id']];
        }
        let wdepm = modules.get(wdepid);
        if (wdepm) {
          let path = deppath(wdepm, id);
          if (path) {
            return [m['id']].concat(path);
          }
        }
      }
    }
    return null;
  }

  /**
   * @param {Module} m
   */
  function mfinalize(m) {
    // clear init to signal that the module has been initialized
    m.init = null;
    
    // get dependants that are waiting
    let /** Set<symbol|string> */ waitingDependants = waiting.get(m['id']);
    waiting.delete(m['id']); // clear this module from `waiting`

    if (m.fn) {
      // execute module function
      let res = m.fn.apply(m['exports'], m.deps);
      if (res) {
        m['exports'] = res;
      }
      m.fn = null;
    }

    // clear module properties to free up memory since m will live forever because
    // it's owned by modules which is bound to the define's closure.
    m.deps = null;
    m.waitdeps = null;

    if (waitingDependants) {
      // check in on dependants
      for (let depid of waitingDependants) {
        let depm = modules.get(depid);
        if (depm.init) {
          if (depm.waitdeps.size == 1) {
            // The just-initialized module is the last dependency.
            // Resume initialization of depm.
            depm.init();
          } else {
            // The just-initialized module is one of many dependencies.
            // Simply clear this module from depm's waitdeps
            depm.waitdeps.delete(m['id']);
          }
        }
      }
      assert(typeof m['id'] != 'symbol');
    } else if (typeof m['id'] == 'symbol') {
      // remove anonymous module reference as it was only needed while
      // resoling its dependencies. Note that typeof=='symbol' is only available in
      // environments with native Symbols, so we will not be able to clean up
      // anon modules when running in older JS environments. It's an okay trade-off
      // as checking for "shimmed" symbol type is quite complicated.
      modules.delete(m['id']);
    }
  }

  /**
   * @param {Module} m
   */
  function* minitg(m, deps) {
    while (true) {

      for (let i = 0, L = deps.length; i != L; ++i) {
        let depid = deps[i];
        if (m.deps[i] !== undefined) {
          continue;
        }
        if (depid == 'require') {
          m.deps[i] = _require;
        } else if (depid == 'exports') {
          m.deps[i] = m['exports'];
        } else if (depid == 'module') {
          m.deps[i] = m;
        } else {
          let depm = modules.get(depid);
          if (depm && !depm.init) {
            // dependency is initialized
            m.deps[i] = depm['exports'];
            if (m.waitdeps) {
              m.waitdeps.delete(depid);
            }
          } else {
            // latent dependency — add to waitdeps
            if (!m.waitdeps) {
              m.waitdeps = new Set([depid]);
            } else if (!m.waitdeps.has(depid)) {
              m.waitdeps.add(depid);
            } else {
              continue;
            }

            // check for cyclic dependencies when depm.init is still pending
            if (CHECK_CYCLES && depm) {
              let cycle = deppath(depm, m['id']);
              if (cycle) {
                if (cycle[cycle.length-1] != m['id']) {
                  cycle.push(m['id']);
                }
                throw new Error(
                  `Cyclic module dependency: ${m['id']} -> ${cycle.join(' -> ')}`
                );
              }
            }
          }
        }
      }

      if (!m.waitdeps || m.waitdeps.size == 0) {
        // no outstanding dependencies
        break;
      }

      yield m.waitdeps;
    }

    mfinalize(m);
  }

  // Creates a resumable init function for module m with dependencies deps
  /**
   * @param {Module} m
   * @param {Array<string>|null} deps
   */
  function minit(m, deps) {
    let initg = minitg(m, deps);

    return function init() {
      logdebug('attempting to resolve dependencies for', m['id']);
      let v = initg.next();
      if (v.done) {
        // module initialized
        logdebug('completed initialization of', m['id']);
        return true;
      }

      // add outstanding dependencies to waitset
      for (let depid of v.value) {
        let waitset = waiting.get(depid);
        if (waitset) {
          waitset.add(m['id']);
        } else {
          waiting.set(depid, new Set([m['id']]));
        }
      }

      return false;
    };
  }

  // if define.timeout is set, the `timeout` function is called to check for
  // modules that has not yet loaded, and if any are found throws an error.
  let timeoutTimer = null;
  let timeoutReached = false;
  function timeout() {
    clearTimeout(timeoutTimer);
    timeoutTimer = null;
    timeoutReached = true;
    if (waiting && waiting.size > 0) {
      let v = [];
      for (let id of waiting.keys()) {
        if (!modules.has(id)) {
          v.push(id);
        }
      }
      if (v.length) {
        throw new Error(`Module load timeout -- still waiting on "${v.join('", "')}"`)
      }
    }
  }

  // define(id?, deps?, fn)
  function define(id, deps, fn) {
    logdebug('define', id, deps, fn ? typeof fn : typeof deps);
    if (define.timeout && define.timeout > 0) {
      if (timeoutReached) {
        logdebug('define bailing out since timeout has been reached');
        return;
      }
      clearTimeout(timeoutTimer);
      timeoutTimer = setTimeout(timeout, define.timeout);
    }

    let objfact = 1; // 0=no, 1=?, 2=yes

    switch (typeof id) {
      case 'function': {
        // define(factory)
        fn = id;
        id = null;
        deps = [];
        objfact = 0;
        break;
      }
      case 'object': {
        // define([...], factory)
        fn = deps;
        deps = id;
        id = null;
        if (typeof fn != 'function') {
          // define([...], {...})
          throw new Error('object module without id');
        }
        break;
      }
      default: {
        objfact = 0;
        if (typeof deps == 'function') {
          // define(id, factory)
          fn = deps;
          deps = [];
        } else if (!fn) {
          // define(id, obj)
          fn = deps;
          deps = [];
          objfact = 2;
        }
        // else: define(id, [...], factory)
        break;
      }
    }

    if (!deps || deps.length == 0) {
      // no dependencies
      logdebug('taking a shortcut becase', id, 'has no dependencies');
      objfact = (objfact == 1 && typeof fn != 'function') ? 2 : objfact;
      let m = new Module(id, objfact ? fn : {}, null, objfact ? null : fn);
      if (id) {
        modules.set(id, m);
        mfinalize(m);
      } else {
        // Note: intentionally ignoring return value as a module w/o an id
        // is never imported by anything.
        fn.apply(m['exports']);
        m.fn = null;
      }
      return true;
    }

    if (typeof fn != 'function') {
      // define('id', [...], {...})
      throw new Error('object module with dependencies');
    }

    // resolve dependencies
    let m = new Module(
      id || Symbol(''),
      {},
      new Array(deps.length),
      fn
    );
    modules.set(m['id'], m);
    m.init = minit(m, deps);
    return m.init();
  }

  // Set to a number larger than zero to enable timeout.
  // Whenever define() is called, the timeout is reset and when the timer expires
  // an error is thrown if there are still undefined modules.
  /** @export {number} */
  define['timeout'] = 0;

  define['require'] = _require;
  define['amd'] = {};

  if (DEBUG) {
    define['debug'] = false;
  }

  exports['define'] = define;
})(this, typeof require == 'function' ? require : null);
