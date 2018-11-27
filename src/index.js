
let fabric

if (typeof require !== 'undefined') {
  fabric = require('fabric').fabric
} else {
  fabric = window.fabric
}

const {Canvas, Circle, Path} = fabric
fabric.Object.prototype.originX = fabric.Object.prototype.originY = 'center'

function uuid() {
  return Array.from({length: 8}, () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substr(1)).join('')
}

class LineDrawer {
  constructor(canvasId, {
    strokeWidth = 1,
    lineStroke = '#000',
    arrowRadius = 6,
    editable = false,
    formatter = () => (''),
    hasShadow = false,
    pathOpacity = 1
  } = {}, data) {
    this.config = {
      strokeWidth,
      lineStroke,
      arrowRadius,
      editable,
      formatter,
      hasShadow,
      pathOpacity
    }
    this.canvas = new Canvas(canvasId, {selection: false})

    this.lineMap = {}

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

    !editable && this.insertTooltip()
  }

  insertTooltip() {
    this.tooltip = document.createElement('div')
    this.tooltip.className = 'tooltip'

    this.canvas.wrapperEl.appendChild(this.tooltip)
  }

  resize({width, height} = {}) {
    if (width === undefined || height === undefined) return
    this.canvas.setDimensions({
      width,
      height
    })
    this.reload()
  }

  convert(dots) {
    const {width, height} = this.canvas
    return dots.map(e => ([e[0] * width, e[1] * height]))
  }

  load(data) {
    if (!data) return
    if (typeof data === 'string') {
      data = JSON.parse(data)
    }
    this.dataSource = data
    this.lineMap = {}
    data.forEach(item => {
      this.newEmptyLine()
      this.convert(item.dots).forEach(e => {
        const line = this.getCurrentLine()
        const dot = this.makeDot(...e)
        line.dots.push(dot)
        this.renderLines(item)
      })
    })
  }

  setConfig(config) {
    this.config = {...this.config, ...config}
    this.reload()
  }

  reload(data = this.dataSource) {
    this.canvas.clear()
    this.load(data)
  }

  newEmptyLine() {
    const line = Object.values(this.lineMap).find(e => e.dots.length === 0)
    if (!line) {
      const id = uuid()
      this.lineMap[id] = {dots: [], id, path: null}
      this.currentLineId = id
    } else {
      this.currentLineId = line.id
    }
  }

  savePaths() {
    return Object.values(this.lineMap).map(item => {
        const strokeWidth = item.path.strokeWidth
        return {
          strokeWidth,
          stroke: item.path.stroke,
          dots: item.dots.map(e => ([e.left / this.canvas.width, e.top / this.canvas.height]))
        }
      }
    )
  }

  getCurrentLine() {
    return this.lineMap[this.currentLineId]
  }

  configCurrentPath(config) {
    const {path} = this.getCurrentLine()
    path.set(config)
    this.renderLines()
  }

  initListeners() {
    const listeners = this.config.editable ? {
      'object:moving': this.onObjectMoving.bind(this),
      'mouse:down': this.onMouseDown.bind(this)
    } : {
      'mouse:over': this.onMouseOver.bind(this),
      'mouse:out': this.onMouseOut.bind(this),
      'mouse:move': this.onMouseMove.bind(this)
    }
    this.canvas.on(listeners)
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

  onMouseMove(e) {
    if (this.config.editable) return
    if (!this.isToolTipHidden()) {
      this.tooltip.style.left = e.pointer.x + 'px'
      this.tooltip.style.top = e.pointer.y + 'px'
    }
  }

  onMouseOver(e) {
    if (this.config.editable) return
    const target = e.target
    if (target && target.name === 'path') {
      this.showToolTip()
      this.tooltip.innerHTML = this.config.formatter(target._data)
    }
  }

  onMouseOut(e) {
    if (this.config.editable) return
    const target = e.target
    if (target && target.name === 'path') {
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

  selectDot(dot) {
    if (this.lastSelectedDot) {
      this.lastSelectedDot.set({fill: 'transparent', stroke: '#ddd', radius: 5})
    }
    this.lastSelectedDot = dot
    dot.set({fill: '#fff0f0', stroke: '#0000ff', radius: 8})
  }

  selectCurrentPath() {
    const {path} = this.getCurrentLine()
    this.lastSelectedPath && this.lastSelectedPath.set({shadow: null})
    this.lastSelectedPath = path
    path.set({shadow: this.pathShadow})
  }

  delSelectedDot() {
    if (!this.config.editable) return
    const line = this.getCurrentLine()
    if (this.lastSelectedDot) {
      const idx = line.dots.indexOf(this.lastSelectedDot)
      const [dot] = line.dots.splice(idx, 1)
      this.canvas.remove(dot)
      this.renderLines()
    }
  }

  delCurrentLine() {
    if (!this.config.editable) return
    const line = this.getCurrentLine()
    line.dots.forEach(dot => this.canvas.remove(dot))
    this.canvas.remove(line.path)
    delete this.lineMap[line.id]
    const keys = Object.keys(this.lineMap)
    if (keys.length) {
      this.currentLineId = keys[0]
    } else {
      this.newEmptyLine()
    }
  }

  renderLines(data = {}) {
    if (data.strokeWidth === 0) return
    const stroke = data.stroke || this.config.lineStroke
    const strokeWidth = data.strokeWidth || this.config.strokeWidth
    const isEditable = this.config.editable
    const pathConfig = {
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

  makeDot(x, y) {
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

if (typeof module !== 'undefined' && typeof exports !== 'undefined') {
  module.exports = LineDrawer
} else if(typeof define === 'function' && define.amd){
  define([], function() { return LineDrawer })
} else {
  window.LineDrawer = LineDrawer
}

