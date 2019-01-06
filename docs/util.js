const IteratorDone = { done: true, value: null }

class ArrayLikeIterator {
  constructor(a) {
    this.a = a
    this.i = 0
  }

  next() {
    if (this.i == this.a.length) {
      return IteratorDone
    }
    return { done: false, value: this.a[this.i++] }
  }
}


class ArrayLikeIteratorWithPredicate {
  constructor(a, pred) {
    this.a = a
    this.pred = pred
    this.i = 0
  }

  next() {
    while (this.i < this.a.length) {
      let v = this.pred(this.a[this.i], this.i++)
      if (v !== undefined) {
        return { done: false, value: v }
      }
    }
    return IteratorDone
  }

  [Symbol.iterator]() {
    return this
  }
}
