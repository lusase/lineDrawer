import {fabric} from 'fabric'
import {EventEmitter} from './EventEmitter'
import {ArrowLine, ArrowLineData, SketchConfig} from './type/drawer'
import {defCfg, mergeDefault} from './util'


function setStyle(ele: HTMLElement, styleObj: object): void {
  Object.keys(styleObj).forEach(e => {
    ele.style[e] = styleObj[e]
  })
}

export class Sketchpad extends EventEmitter {
  canvas: fabric.Canvas & {
    wrapperEl?: HTMLElement
  }
  lineMap: Record<string, ArrowLine> = {}
  currentLineId: string
  pathShadow = new fabric.Shadow({
    color: '#fff',
    blur: 5,
    offsetX: 0.5,
    offsetY: 0.5
  })
  tooltip: HTMLElement
  dataSource: ArrowLineData[] = []
  lastSelectedDot: fabric.Circle
  lastSelectedPath: fabric.Path
  static uuid(): string {
    return Array.from({length: 8}, () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substr(1)).join('')
  }
  constructor(canvasId: string, public config: SketchConfig = {}, data: ArrowLineData[]) {
    super()
    mergeDefault(config, defCfg)
    this.canvas = new fabric.Canvas(canvasId, {selection: false})
    this.currentLineId = null
    this.initBg()
    this.newEmptyLine()
    this.initListeners()
    data && this.load(data)
  }
  initBg() {
    if (!this.config.bgUrl) return

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

  insertPathTip(item: ArrowLineData): void {
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

  createTipEl() {
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

  load(data: ArrowLineData[] | string) {
    if (!data || !data.length) return
    if (typeof data === 'string') {
      data = JSON.parse(data) as ArrowLineData[]
    }
    this.dataSource = data
    this.dataSource.forEach(item => {
      const id = item.id !== undefined ? String(item.id) : undefined
      this.newEmptyLine(id)
      this.convert(item.dots).forEach((e) => {
        const line = this.getCurrentLine()
        const dot = this.makeDot(e[0], e[1])
        line.lineDots.push(dot)
        this.renderLines(item)
      })
    })
    !this.config.editable && this.insertTooltip()
  }

  setConfig(config: SketchConfig) {
    this.config = {...this.config, ...config}
    this.reload(this.getLinesInfo())
  }

  reload(data = this.dataSource) {
    this.canvas.clear()
    this.load(data)
  }

  newEmptyLine(lineId?: string) {
    const line = Object.values(this.lineMap).find((e: ArrowLine) => e.lineDots.length === 0)
    if (!line) {
      const id = lineId || Sketchpad.uuid()
      this.lineMap[id] = {lineDots: [], id, path: null, idx: Object.keys(this.lineMap).length}
      this.currentLineId = id
      this.emit('add.line', this.lineMap[id])
    } else {
      this.currentLineId = line.id
    }
  }

  getLinesInfo() {
    return Object.values(this.lineMap)
      .sort((a, b) => a.idx - b.idx)
      .map(item => {
        if (!item.path) return null
        return {
          id: item.id,
          // @ts-ignore
          selected: item.path.selected,
          strokeWidth: item.path.strokeWidth,
          stroke: item.path.stroke,
          dots: item.lineDots?.map(e => ([e.left / this.canvas.width, e.top / this.canvas.height])) as [number, number][]
        }
      }).filter(Boolean)
  }

  getCurrentLine(): ArrowLine {
    return this.lineMap[this.currentLineId]
  }

  configCurrentPath(config: Partial<fabric.Path>) {
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
    this.onMouseWheel = this.onMouseWheel.bind(this)
    this.canvas.on('object:moving', this.onObjectMoving)
    this.canvas.on('mouse:down', this.onMouseDown)
    this.canvas.on('mouse:over', this.onMouseOver)
    this.canvas.on('mouse:out', this.onMouseOut)
    this.canvas.on('mouse:move', this.onMouseMove)
    this.canvas.on('mouse:wheel', this.onMouseWheel)
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

  onKeydown(e: KeyboardEvent) {
    if (this.config.editable) return
    // delete 键 删除当前线条
    if (e.code === 'Delete') {
      this.delCurrentLine()
      // ctrl + z 删除当前点
    } else if (e.code === 'KeyZ' && e.ctrlKey) {
      this.delSelectedDot()
    }
  }

  onMouseMove(e: fabric.IEvent<MouseEvent>) {
    if (this.config.editable) return
    if (this.tooltip && !this.isToolTipHidden()) {
      setStyle(this.tooltip, {
        left: e.pointer.x + 'px',
        top: e.pointer.y + 'px'
      })
    }
  }

  onMouseOver(e: fabric.IEvent<MouseEvent>) {
    if (this.config.editable) return
    const target = e.target
    const {alwaysShowTip} = this.config
    if (!alwaysShowTip && target && target.name === 'path') {
      this.showToolTip()
      // @ts-ignore
      this.tooltip.innerHTML = this.config.formatter(target._data)
    }
  }

  onMouseOut(e: fabric.IEvent<MouseEvent>) {
    if (this.config.editable) return
    const target = e.target
    const {alwaysShowTip} = this.config
    if (!alwaysShowTip && target && target.name === 'path') {
      this.hideToolTip()
    }
  }

  onObjectMoving(e: fabric.IEvent<MouseEvent>) {
    if (!this.config.editable) return
    if (e.target.name === 'dot') {
      this.renderLines()
    }
  }

  onMouseWheel(e: fabric.IEvent<WheelEvent>) {
    if (!this.config.scalable) return
    const delta = e.e.deltaY
    const x = e.e.offsetX
    const y = e.e.offsetY
    let zoom = this.canvas.getZoom()
    zoom *= 0.999 ** delta
    if (zoom > 20) zoom = 20
    if (zoom < 0.01) zoom = 0.01
    this.canvas.zoomToPoint({x, y}, zoom)
    e.e.preventDefault()
    e.e.stopPropagation()
  }

  onMouseDown(e: fabric.IEvent<MouseEvent>) {
    if (!this.config.editable) return
    if (e.e.ctrlKey) {
      this.newEmptyLine()
    }

    const target = e.target as fabric.Circle
    if (!target) {
      const line = this.getCurrentLine()
      const dot = this.makeDot(e.pointer.x, e.pointer.y)
      line.lineDots.push(dot)
      this.renderLines()
      this.selectDot(dot)
      this.selectCurrentPath()
    }
    if (target && target.name === 'dot') {
      // @ts-ignore
      this.currentLineId = target.parentLine.id
      this.selectDot(target)
      this.selectCurrentPath()
    }
  }

  selectLine(id: string) {
    if (this.lineMap[id]) {
      this.currentLineId = id
      this.selectDot(this.getCurrentLine().lineDots[0])
      this.selectCurrentPath()
      this.renderLines()
    }
  }

  selectDot(dot: fabric.Circle) {
    if (this.lastSelectedDot) {
      //@ts-ignore
      this.lastSelectedDot.set({fill: 'transparent', stroke: '#ddd', radius: 5, selected: false})
    }
    this.lastSelectedDot = dot
    //@ts-ignore
    dot.set({fill: '#fff0f0', stroke: '#0000ff', radius: 8, selected: true})
    this.emit('focus.dot', dot)
  }

  selectCurrentPath() {
    const {path} = this.getCurrentLine()
    // @ts-ignore
    this.lastSelectedPath && this.lastSelectedPath.set({shadow: null, selected: false})
    this.lastSelectedPath = path
    // @ts-ignore
    path.set({shadow: this.pathShadow, selected: true})
    this.emit('focus.path', path)
  }

  delSelectedDot() {
    if (!this.config.editable) return
    const line = this.getCurrentLine()
    if (this.lastSelectedDot) {
      const idx = line.lineDots.indexOf(this.lastSelectedDot)
      const [dot] = line.lineDots.splice(idx, 1)
      this.canvas.remove(dot)
      this.renderLines()
      this.emit('del.dot', dot)
    }
  }

  delCurrentLine() {
    if (!this.config.editable) return
    const line = this.getCurrentLine()
    // @ts-ignore
    if (!line.path || !line.path.selected) return
    line.lineDots.forEach(dot => this.canvas.remove(dot))
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

  delLine(id: string, force = false) {
    const line = this.lineMap[id]
    if ((!force && !this.config.editable) || !line || !line.path) return
    line.lineDots.forEach(dot => this.canvas.remove(dot))
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
    const pathConfig: fabric.IPathOptions = {
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
    const coords: [number, number][] = line.lineDots.map(dot => ([dot.left, dot.top]))
    const svgPath = this.makeSvgCurvePath(...coords)

    if (line.path) {
      Object.assign(pathConfig, {
        stroke: line.path.stroke,
        shadow: line.path.shadow,
        strokeWidth: line.path.strokeWidth
      })
      this.canvas.remove(line.path)
    }

    const newPath = new fabric.Path(svgPath, pathConfig)

    newPath.name = 'path'
    // @ts-ignore
    newPath._data = data

    if (line.path) {
      this.lastSelectedPath = newPath
    }
    line.path = newPath

    this.canvas.add(newPath)
  }

  makeDot(x: number, y: number) {
    const line = this.getCurrentLine()
    const c = new fabric.Circle({
      left: x,
      top: y,
      strokeWidth: 3,
      radius: 5,
      fill: 'transparent',
      stroke: this.config.editable ? '#ddd' : 'transparent',
      evented: this.config.editable,
      shadow: new fabric.Shadow({
        color: '#000',
        blur: 2,
        offsetX: 1,
        offsetY: 1
      })
    })
    c.hasControls = c.hasBorders = false
    c.name = 'dot'
    // @ts-ignore
    c.parentLine = line
    this.canvas.add(c)
    this.emit('add.dot', c)
    return c
  }

  getCanvasInfo() {
    return this.canvas.toJSON()
  }

  makeSvgCurvePath(...points: [number, number][]) {
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

    if (len === 2)
      return [['M', ...points[0]], ['L', ...points[1]], ...arrowPath]
        .map(item => item.join(',')).join('')

    let path = [['M', ...points[0]]]
    for (let i = 1; i < len - 1; i++) {
      let x = (points[i][0] + points[i + 1][0]) / 2
      let y = (points[i][1] + points[i + 1][1]) / 2
      path.push(['Q', ...points[i], x, y])
    }
    path.push(['T', ...endP], ...arrowPath)
    return path.map(item => item.join(',')).join('')
  }
}
