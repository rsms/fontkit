class ASCIITable { constructor() {
  this._nchars = [] // indexed by char code
  this._seps = null // Set<int> (rowindex)
  this.cells = []
  this.colw = [] }

  // add a cell
  cell(index, str) {
    let v = this.cells[index]
    if (v) {
      v.push(str)
      let w = this.colw[index] || 0
      if (w < str.length) {
        this.colw[index] = str.length
      }
    } else {
      this.cells[index] = [str]
      this.colw[index] = str.length
    }
  }

  ncols() {
    return this.cells.length
  }

  nrows() {
    return this.cells[0] ? this.cells[0].length : 0
  }

  // add a row of cells
  row(...cells) {
    let i = 0
    for (let cell of cells) {
      this.cell(i++, cell)
    }
  }

  // add a row separator
  sep() {
    if (!this._seps) {
      this._seps = new Set()
    }
    this._seps.add(this.nrows())
  }

  // returns a string with n number of c characters
  nchars(c, n) {
    let s = this._nchars[c]
    let avail = s ? s.length : 0
    if (avail < n) {
      let cs = String.fromCharCode(c)
      if (!s) { s = cs }
      while (avail < n) {
        s += cs
        avail++
      }
      this._nchars[c] = s
    }
    return s.substr(0, n)
  }

  getsp(n) {
    return this.nchars(0x20, n)

    if (!this._sp) { this._sp = '' }
    if (this._sp.length < n) {
      while (this._sp.length < n) {
        this._sp += '    '
      }
    }
    return this._sp.substr(0, n)
  }

  build(colsep) {
    if (!colsep && typeof colsep != 'string') {
      colsep = ' '
    }

    let rows = []
    let ncols = this.cells.length
    let lastcol = ncols - 1
    let nrows = this.cells[0].length

    for (let rowindex = 0; rowindex < nrows; rowindex++) {
      let row = []

      if (this._seps.has(rowindex)) {
        // separator -- draw hyphens (0x2D) for each column
        for (let colindex = 0; colindex < ncols; colindex++) {
          row.push(this.nchars(0x2D, this.colw[colindex]))
        }
        rows.push(row.join(colsep))
        row = []
      }

      for (let colindex = 0; colindex < ncols; colindex++) {
        let colw = this.colw[colindex]
        let cell = String(this.cells[colindex][rowindex])
        if (colindex < lastcol && cell.length < colw) {
          cell += this.nchars(0x20, colw - cell.length)
        }
        row.push(cell)
      }

      rows.push(row.join(colsep))
    }

    return rows
  }
}

if (typeof exports != 'undefined') { exports.ASCIITable = ASCIITable }
