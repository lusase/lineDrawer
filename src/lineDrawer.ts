declare const module: any
declare const require: any

(function (global, factory) {

  if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = factory(global, require('fabric').fabric)
  } else {
    factory(global, global.fabric, true)
  }

})(typeof window !== 'undefined' ? window : this, function (window, fabric, noGlobal?) {
  if (!fabric)
    throw new Error('fabric required. please install it by npm or load it by script tag')
  const {Canvas, Circle, Path} = fabric
  fabric.Object.prototype.originX = fabric.Object.prototype.originY = 'center'

  function uuid(): string {
    return Array.from({length: 8}, () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substr(1)).join('')
  }

  function setStyle(ele: HTMLElement, styleObj: object): void {
    Object.keys(styleObj).forEach(e => {
      ele.style[e] = styleObj[e]
    })
  }

  class EventEmitter {
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

  interface Line {
    id: string
    idx: number
    dots
    path
  }

  class LineDrawer extends EventEmitter {
    config: {
      formatter: (obj: any) => any
      [propName: string]: any
    }
    canvas: {
      [propName: string]: any
      on: (l: object) => any
      wrapperEl: HTMLElement
    }
    lineMap: { Line }
    currentLineId: string
    pathShadow: object
    tooltip: HTMLElement
    dataSource
    lastSelectedDot
    lastSelectedPath

    static uuid: Function = uuid

    constructor(canvasId, {
      strokeWidth = 1,
      lineStroke = '#000',
      arrowRadius = 6,
      editable = false,
      formatter = () => '',
      hasShadow = false,
      pathOpacity = 1,
      alwaysShowTip = false
    } = {}, data) {
      super()
      this.config = {
        strokeWidth,
        lineStroke,
        arrowRadius,
        editable,
        formatter,
        hasShadow,
        pathOpacity,
        alwaysShowTip
      }
      this.canvas = new Canvas(canvasId, {selection: false})

      this.lineMap = <{ Line }>{}

      this.currentLineId = null

      this.pathShadow = {
        color: '#fff',
        blur: 5,
        offsetX: 0.5,
        offsetY: 0.5
      }

      this.newEmptyLine()

      this.initListeners()

      data && this.load(data)
    }

    dispose() {
      this.canvas.dispose()
      window.removeEventListener('keydown', this.onKeydown)
    }

    insertTooltip() {
      if (!this.dataSource) return
      this.removeTooltipEl()

      if (this.config.alwaysShowTip) {
        this.dataSource.forEach(item => this.insertPathTip(item))
      } else {
        this.tooltip = this.createTipEl()
      }
    }

    removeTooltipEl() {
      const {wrapperEl} = this.canvas
      const tooltips = wrapperEl.getElementsByClassName('tooltip')
      ;[...tooltips].forEach(e => e.remove())
    }

    insertPathTip(item): void {
      if (item.strokeWidth === 0) return
      item.tooltip = this.createTipEl()

      item.tooltip.innerHTML = this.config.formatter(item)

      const [[x1, y1], [x2, y2]] = this.convert([item.dots[0], item.dots[item.dots.length - 1]])
      setStyle(item.tooltip, {
        visibility: 'visible',
        left: (x1 + x2) / 2 + 'px',
        top: (y1 + y2) / 2 + 'px'
      })
    }

    createTipEl(): HTMLElement {
      const {wrapperEl} = this.canvas
      const el = document.createElement('div')
      el.className = 'tooltip'
      wrapperEl.appendChild(el)
      return el
    }

    resize({width, height}: { width?: number, height?: number } = {}) {
      if (width === undefined || height === undefined) return
      this.canvas.setDimensions({
        width,
        height
      })
      this.reload()
    }

    convert(dots = []): [number, number][] {
      const {width, height} = this.canvas
      return dots.map(e => ([e[0] * width, e[1] * height]))
    }

    load(data) {
      if (!data || !data.length) return
      if (typeof data === 'string') {
        data = JSON.parse(data)
      }
      this.dataSource = data
      this.lineMap = <{ Line }>{}
      data.forEach(item => {
        const id = item.id !== undefined ? String(item.id) : undefined
        this.newEmptyLine(id)
        this.convert(item.dots).forEach((e: [number, number]) => {
          const line = this.getCurrentLine()
          const dot = this.makeDot(e[0], e[1])
          line.dots.push(dot)
          this.renderLines(item)
        })
      })
      !this.config.editable && this.insertTooltip()
    }

    setConfig(config) {
      this.config = {...this.config, ...config}
      this.reload(this.getLinesInfo())
    }

    reload(data = this.dataSource) {
      console.log(data)
      this.canvas.clear()
      this.load(data)
    }

    newEmptyLine(lineId?: string) {
      const line = Object.values(this.lineMap).find((e: Line) => e.dots.length === 0)
      if (!line) {
        const id = lineId || uuid()
        this.lineMap[id] = {dots: [], id, path: null, idx: Object.keys(this.lineMap).length}
        this.currentLineId = id
        this.emit('add.line', this.lineMap[id])
      } else {
        this.currentLineId = line.id
      }
    }

    getLinesInfo() {
      return Object.values(this.lineMap).sort((a, b) => a.idx - b.idx).map(item => {
          if (!item.path) return {}
          return {
            id: item.id,
            selected: item.path.selected,
            strokeWidth: item.path.strokeWidth,
            stroke: item.path.stroke,
            dots: item.dots?.map(e => ([e.left / this.canvas.width, e.top / this.canvas.height]))
          }
        }
      )
    }

    getCurrentLine(): Line {
      return this.lineMap[this.currentLineId]
    }

    configCurrentPath(config) {
      const {path} = this.getCurrentLine()
      if (!path) return
      path.set(config)
      this.renderLines()
    }

    initListeners() {
      this.onObjectMoving = this.onObjectMoving.bind(this)
      this.onMouseDown = this.onMouseDown.bind(this)
      this.onMouseOver = this.onMouseOver.bind(this)
      this.onMouseOut = this.onMouseOut.bind(this)
      this.onMouseMove = this.onMouseMove.bind(this)
      this.onKeydown = this.onKeydown.bind(this)

      const canvasListeners = {
        'object:moving': this.onObjectMoving,
        'mouse:down': this.onMouseDown,

        'mouse:over': this.onMouseOver,
        'mouse:out': this.onMouseOut,
        'mouse:move': this.onMouseMove
      }
      this.canvas.on(canvasListeners)

      window.addEventListener('keydown', this.onKeydown)
    }

    showToolTip() {
      this.tooltip.style.visibility = 'visible'
    }

    hideToolTip() {
      this.tooltip.style.visibility = 'hidden'
    }

    isToolTipHidden() {
      return this.tooltip.style.visibility === 'hidden'
    }

    onKeydown(e) {
      if (this.config.editable) return
      // delete 键 删除当前线条
      if (e.code === 'Delete') {
        this.delCurrentLine()
        // ctrl + z 删除当前点
      } else if (e.code === 'KeyZ' && e.ctrlKey) {
        this.delSelectedDot()
      }
    }

    onMouseMove(e) {
      if (this.config.editable) return
      if (this.tooltip && !this.isToolTipHidden()) {
        setStyle(this.tooltip, {
          left: e.pointer.x + 'px',
          top: e.pointer.y + 'px'
        })
      }
    }

    onMouseOver(e) {
      if (this.config.editable) return
      const target = e.target
      const {alwaysShowTip} = this.config
      if (!alwaysShowTip && target && target.name === 'path') {
        this.showToolTip()
        this.tooltip.innerHTML = this.config.formatter(target._data)
      }
    }

    onMouseOut(e) {
      if (this.config.editable) return
      const target = e.target
      const {alwaysShowTip} = this.config
      if (!alwaysShowTip && target && target.name === 'path') {
        this.hideToolTip()
      }
    }

    onObjectMoving(e) {
      if (!this.config.editable) return
      if (e.target.name === 'dot') {
        this.renderLines()
      }
    }

    onMouseDown(e) {
      if (!this.config.editable) return
      if (e.e.ctrlKey) {
        this.newEmptyLine()
      }

      const target = e.target
      if (!target) {
        const line = this.getCurrentLine()
        const dot = this.makeDot(e.pointer.x, e.pointer.y)
        line.dots.push(dot)
        this.renderLines()
        this.selectDot(dot)
        this.selectCurrentPath()
      }
      if (target && target.name === 'dot') {
        this.currentLineId = target.parentLine.id
        this.selectDot(target)
        this.selectCurrentPath()
      }
    }

    selectLine(id: string) {
      if (this.lineMap[id]) {
        this.currentLineId = id
        this.selectDot(this.getCurrentLine().dots[0])
        this.selectCurrentPath()
        this.renderLines()
      }
    }

    selectDot(dot) {
      if (this.lastSelectedDot) {
        this.lastSelectedDot.set({fill: 'transparent', stroke: '#ddd', radius: 5, selected: false})
      }
      this.lastSelectedDot = dot
      dot.set({fill: '#fff0f0', stroke: '#0000ff', radius: 8, selected: true})
      this.emit('focus.dot', dot)
    }

    selectCurrentPath() {
      const {path} = this.getCurrentLine()
      this.lastSelectedPath && this.lastSelectedPath.set({shadow: null, selected: false})
      this.lastSelectedPath = path
      path.set({shadow: this.pathShadow, selected: true})
      this.emit('focus.path', path)
    }

    delSelectedDot() {
      if (!this.config.editable) return
      const line = this.getCurrentLine()
      if (this.lastSelectedDot) {
        const idx = line.dots.indexOf(this.lastSelectedDot)
        const [dot] = line.dots.splice(idx, 1)
        this.canvas.remove(dot)
        this.renderLines()
        this.emit('del.dot', dot)
      }
    }

    delCurrentLine() {
      if (!this.config.editable) return
      const line = this.getCurrentLine()
      if (!line.path || !line.path.selected) return
      line.dots.forEach(dot => this.canvas.remove(dot))
      this.canvas.remove(line.path)
      delete this.lineMap[line.id]
      this.emit('del.line', line)
      const keys = Object.keys(this.lineMap)
      if (keys.length) {
        this.currentLineId = keys[0]
      } else {
        this.newEmptyLine()
      }
    }

    delLine(id: string) {
      const line = this.lineMap[id]
      if (!this.config.editable || !line || !line.path) return
      line.dots.forEach(dot => this.canvas.remove(dot))
      this.canvas.remove(line.path)
      delete this.lineMap[id]
      this.emit('del.line', line)
      const keys = Object.keys(this.lineMap)
      if (keys.length) {
        this.currentLineId = keys[0]
      } else {
        this.newEmptyLine()
      }
    }
    getLineStroke() {
      const {lineStroke} = this.config
      if (Array.isArray(lineStroke)) {
        const len = lineStroke.length
        return lineStroke[(Object.keys(this.lineMap).length - 1) % len] || '#fff'
      }
      return lineStroke
    }

    renderLines(data: { strokeWidth?: number, stroke?: string } = {}) {
      if (data.strokeWidth === 0) return

      const stroke = data.stroke || this.getLineStroke()
      const strokeWidth = data.strokeWidth || this.config.strokeWidth
      const isEditable = this.config.editable
      const pathConfig: any = {
        stroke,
        strokeWidth,
        opacity: this.config.pathOpacity,
        hoverCursor: isEditable ? 'move' : 'pointer',
        fill: '',
        originX: 'left',
        originY: 'top',
        selectable: false,
        evented: !isEditable
      }
      const line = this.getCurrentLine()
      // 添加阴影
      if (!isEditable && this.config.hasShadow) {
        pathConfig.shadow = this.pathShadow
      }
      const coords = line.dots.map(dot => ([dot.left, dot.top]))
      const svgPath = this.makeSvgCurvePath(...coords)

      if (line.path) {
        Object.assign(pathConfig, {
          stroke: line.path.stroke,
          shadow: line.path.shadow,
          strokeWidth: line.path.strokeWidth
        })
        this.canvas.remove(line.path)
      }

      const newPath = new Path(svgPath, pathConfig)

      newPath.name = 'path'

      newPath._data = data

      if (line.path) {
        this.lastSelectedPath = newPath
      }
      line.path = newPath

      this.canvas.add(newPath)
    }

    makeDot(x: number, y: number) {
      const line = this.getCurrentLine()
      const c = new Circle({
        left: x,
        top: y,
        strokeWidth: 3,
        radius: 5,
        fill: 'transparent',
        stroke: this.config.editable ? '#ddd' : 'transparent',
        evented: this.config.editable,
        shadow: {
          color: '#000',
          blur: 2,
          offsetX: 1,
          offsetY: 1
        }
      })
      c.hasControls = c.hasBorders = false
      c.name = 'dot'
      c.parentLine = line
      this.canvas.add(c)
      this.emit('add.dot', c)
      return c
    }

    getCanvasInfo() {
      return this.canvas.toJSON()
    }

    makeSvgCurvePath(...points) {
      const len = points.length
      if (len < 2) return ''

      const endP = points[len - 1]
      const endP2 = points[len - 2]
      const angle = Math.PI / 6
      const {arrowRadius} = this.config
      const yDiff = endP2[1] - endP[1]
      const xDiff = endP[0] - endP2[0]
      const slope = Math.atan(yDiff / xDiff)

      const fix = xDiff < 0 ? -1 : 1

      const x1 = endP[0] - Math.cos(slope + angle) * arrowRadius * fix
      const y1 = endP[1] + Math.sin(slope + angle) * arrowRadius * fix
      const x2 = endP[0] - Math.cos(slope - angle) * arrowRadius * fix
      const y2 = endP[1] + Math.sin(slope - angle) * arrowRadius * fix

      const arrowPath = [['M', x1, y1], ['L', ...endP], ['L', x2, y2], ['L', x1, y1], ['L', ...endP]]

      if (len === 2) return [['M', ...points[0]], ['L', ...points[1]], ...arrowPath]

      let path = [['M', ...points[0]]]
      for (let i = 1; i < len - 1; i++) {
        let x = (points[i][0] + points[i + 1][0]) / 2
        let y = (points[i][1] + points[i + 1][1]) / 2
        path.push(['Q', ...points[i], x, y])
      }
      path.push(['T', ...endP], ...arrowPath)
      return path
    }
  }

  if (noGlobal) {
    window.LineDrawer = LineDrawer
  }

  return LineDrawer
})
