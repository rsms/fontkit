
class Drop {
  constructor(dataTransfer) {
    this.dataTransfer = dataTransfer
  }

  [Symbol.iterator]() {
    return this.items
  }

  get items() {
    return new ArrayLikeIterator(this.dataTransfer.items)
  }

  get files() {
    return new ArrayLikeIteratorWithPredicate(
      this.dataTransfer.items,
      v => v.kind === 'file' ? v.getAsFile() : undefined
    )
  }
}


class DropClassic extends Drop {
  get items() {
    return { next() { return IteratorDone } }
  }

  get files() {
    return new ArrayLikeIterator(this.dataTransfer.files)
  }
}


function initDropTarget(dropTarget, onBeginDrag, onEndDrag) {
  // count in/out messages to avoid what seems to be a bug in chrome where
  // an uneven number of enter/leave events are emitted in certain
  // circumstances.
  let dragOverCounter = 0

  dropTarget.addEventListener('dragenter', ev => {
    ev.preventDefault()
    dragOverCounter++
    console.log(`dragenter dragOverCounter: ${dragOverCounter}`)
    if (dragOverCounter == 1) {
      onBeginDrag()
    }
  }, {passive:false, capture:true})

  dropTarget.addEventListener('dragover', ev => {
    ev.preventDefault()
    ev.stopPropagation()
  }, {passive:false, capture:true})

  dropTarget.addEventListener('drop', ev => {
    ev.preventDefault()
    ev.stopPropagation()
    dragOverCounter = 0
    if (ev.dataTransfer.items) {
      onEndDrag(new Drop(ev.dataTransfer))
      ev.dataTransfer.items.clear()
    } else {
      onEndDrag(new DropClassic(ev.dataTransfer))
      ev.dataTransfer.clearData()
    }
  }, {passive:false, capture:true})

  dropTarget.addEventListener('dragleave', ev => {
    dragOverCounter--
    ev.preventDefault()
    if (dragOverCounter == 0) {
      onEndDrag(null)
    }
  }, {passive:false, capture:true})
}
