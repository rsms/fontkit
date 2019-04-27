import * as u from './fkutil'

// FontVariations represents the master of a variable font.
// It describes its axes and styles.
//
export class FontVariations {
  constructor(vptr) {
    this.ptr = vptr

    let n = _FKVarGetStyleCount(vptr)
    this.styles = new Array(n)
    for (let i = 0; i < n; i++) {
      this.styles[i] = new VarStyle(vptr, i)
    }

    n = _FKVarGetAxisCount(vptr)
    this.axes = new Array(n)
    let p1 = _malloc(8), p2 = p1 + 4
    for (let i = 0; i < n; i++) {
      let def = u.fixedToFloat(_FKVarGetAxisRange(vptr, i, p1, p2))
      let min = u.fixedToFloat(HEAP32[p1 >> 2])
      let max = u.fixedToFloat(HEAP32[p2 >> 2])
      this.axes[i] = new VarAxis(vptr, i, min, max, def)
    }
    _free(p1)
  }

  _reset() {
    this.ptr = 0
    this.styles = []
    this.axes = []
  }
}

class VarStyle {
  constructor(vptr, index) {
    this._vptr = vptr
    this.index = index
  }

  get name() {
    let s = u.strFromUTF8Ptr(p => _FKVarGetStyleName(this._vptr, this.index, p))
    Object.defineProperty(this, 'name', {value:s, enumerable:true})
    return s
  }
}


class VarAxis {
  constructor(vptr, index, min, max, default_) {
    this._vptr = vptr
    this.index = index
    this.min = min
    this.max = max
    this.default = default_
  }

  get name() {
    let s = u.strFromUTF8Ptr(p => _FKVarGetAxisName(this._vptr, this.index, p))
    Object.defineProperty(this, 'name', {value:s, enumerable:true})
    return s
  }
}
