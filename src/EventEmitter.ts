export class EventEmitter {
  _events: {
    [propName: string]: ((...args: any[]) => any)[] | ((...args: any[]) => any)
  }

  constructor() {
    this._events = {}
  }

  on(type, listener: (...args: any[]) => any): EventEmitter {
    if ('function' !== typeof listener) {
      throw new Error('method (on) only takes instances of Function')
    }
    if (!this._events[type]) {
      this._events[type] = listener
    } else {
      this._events[type] = [<(...args: any[]) => any>this._events[type], listener]
    }
    return this
  }

  off(type, listener): EventEmitter {
    if (!this._events[type]) return this
    if (!listener) delete this._events[type]
    const list = this._events[type]
    if (Array.isArray(list)) {
      const index = list.indexOf(listener)
      if (index < 0) return this
      list.splice(index, 1)
      if (list.length === 0) delete this._events[type]
    } else if (list === listener) {
      delete this._events[type]
    }
    return this
  }

  emit(type, ...args): boolean {
    const handler = this._events[type]
    if (!handler) return false
    if (typeof handler === 'function') {
      handler.call(this, ...args)
      return true
    } else if (Array.isArray(handler)) {
      handler.forEach(item => {
        item.call(this, ...args)
      })
      return true
    } else {
      return false
    }
  }

  removeAllListeners() {
    this._events = {}
    return this
  }
}
