import {GEventName, IGEvent, LEventName} from './type/drawer'
import {GraphicDrawer} from './GraphicDrawer'

type Fn = (...args: any[]) => any

export class EventEmitter {
  _events: Record<string, Fn | Fn[]>

  constructor() {
    this._events = {}
  }
  on(type: GEventName, handler: Fn): GraphicDrawer
  on(type: string, handler: Fn): EventEmitter {
    if ('function' !== typeof handler) {
      throw new Error('method (on) only takes instances of Function')
    }
    const fn = this._events[type]
    if (!fn) {
      this._events[type] = handler
    } else {
      if (Array.isArray(fn)) {
        fn.push(handler)
      } else {
        this._events[type] = [fn, handler]
      }
    }
    return this
  }

  off(type: string, handler?: Fn): EventEmitter {
    if (!this._events[type]) return this
    if (!handler) delete this._events[type]
    const fn = this._events[type]
    if (Array.isArray(fn)) {
      const index = fn.indexOf(handler)
      if (index < 0) return this
      fn.splice(index, 1)
      if (fn.length === 0) delete this._events[type]
    } else if (fn === handler) {
      delete this._events[type]
    }
    return this
  }

  emit(type: GEventName, e: IGEvent<any>): unknown
  emit(type: LEventName, e: object): unknown
  emit(type: string, e: unknown): unknown {
    const fn = this._events[type]
    if (!fn) return false
    if (typeof fn === 'function') {
      return fn.call(this, e)
    } else if (Array.isArray(fn)) {
      return fn.map(item => {
        if (typeof item === 'function') return item.call(this, e)
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
