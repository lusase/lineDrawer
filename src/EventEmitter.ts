import {GEventName, IGEvent, LEventName} from './type/drawer'
import {GraphicDrawer} from './GraphicDrawer'
import {fabric} from 'fabric'

export class EventEmitter {
  _events: {
    [propName: string]: ((...args: any[]) => any)[] | ((...args: any[]) => any)
  }

  constructor() {
    this._events = {}
  }
  on(type: GEventName, handler: (e) => void): GraphicDrawer
  on(type: string, handler: (...args: any[]) => any): EventEmitter {
    if ('function' !== typeof handler) {
      throw new Error('method (on) only takes instances of Function')
    }
    if (!this._events[type]) {
      this._events[type] = handler
    } else {
      this._events[type] = [<(...args: any[]) => any>this._events[type], handler]
    }
    return this
  }

  off(type: string, listener: () => void): EventEmitter {
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

  emit(type: GEventName, e: IGEvent<any>): unknown
  emit(type: LEventName, e: object): unknown
  emit(type: string, e: unknown): unknown {
    const handler = this._events[type]
    if (!handler) return false
    if (typeof handler === 'function') {
      return handler.call(this, e)
    } else if (Array.isArray(handler)) {
      return handler.map(item => {
        return item.call(this, e)
      })
    } else {
      return false
    }
  }

  removeAllListeners() {
    this._events = {}
    return this
  }
}
