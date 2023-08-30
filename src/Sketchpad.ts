import {fabric} from 'fabric'
import {EventEmitter} from './EventEmitter'
import {SketchConfig} from './type/drawer'
import {defCfg, merge} from './util'


export abstract class Sketchpad extends EventEmitter {
  canvas: fabric.Canvas & {
    wrapperEl?: HTMLElement
  }
  tooltip: HTMLElement
  static uuid(): string {
    return Array.from({length: 8}, () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substr(1)).join('')
  }
  protected constructor(
    canvasId: string | HTMLCanvasElement,
    public config: SketchConfig = {}
  ) {
    super()
    this.config = new Proxy(merge({}, defCfg, config), {
      set: this.configSetHandler.bind(this)
    })
    this.canvas = new fabric.Canvas(canvasId, {
      selection: false,
      preserveObjectStacking: true
    })
    this.initBg()
    this.initHandlers()
    this.initListeners()
  }
  abstract configSetHandler(target: any, p: string | symbol, newValue: any, receiver: any): boolean
  initBg() {
    if (!this.config.bgUrl) return
    this.canvas.setBackgroundImage(
      this.config.bgUrl,
      (img: HTMLImageElement) => {
        const bgImg = this.canvas.backgroundImage as fabric.Image
        bgImg.scaleX = this.canvas.width / img.width
        bgImg.scaleY = this.canvas.height / img.height
        this.canvas.renderAll()
      },
      {
        originX: 'left',
        originY: 'top'
      }
    )
  }

  abstract onObjectMoving(e: fabric.IEvent<MouseEvent>): void
  abstract onMouseDown(e: fabric.IEvent<MouseEvent>): void
  abstract onMouseOver(e: fabric.IEvent<MouseEvent>): void
  abstract onMouseOut(e: fabric.IEvent<MouseEvent>): void
  abstract onMouseMove(e: fabric.IEvent<MouseEvent>): void
  abstract onKeydown(e: KeyboardEvent): void

  initListeners() {
    this.onObjectMoving = this.onObjectMoving.bind(this)
    this.onMouseDown = this.onMouseDown.bind(this)
    this.onMouseOver = this.onMouseOver.bind(this)
    this.onMouseOut = this.onMouseOut.bind(this)
    this.onMouseMove = this.onMouseMove.bind(this)
    this.onKeydown = this.onKeydown.bind(this)
    this.canvas.on('object:moving', this.onObjectMoving)
    this.canvas.on('mouse:down', this.onMouseDown)
    this.canvas.on('mouse:over', this.onMouseOver)
    this.canvas.on('mouse:out', this.onMouseOut)
    this.canvas.on('mouse:move', this.onMouseMove)
    window.addEventListener('keydown', this.onKeydown)
  }

  dispose() {
    this.canvas.dispose()
  }

  removeTooltipEl() {
    const {wrapperEl} = this.canvas
    const tooltips = wrapperEl.getElementsByClassName('tooltip')
    ;[...tooltips].forEach(e => e.remove())
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

  recover() {
    const vpt = this.canvas.viewportTransform
    vpt[4] = 0
    vpt[5] = 0
    this.canvas.setZoom(1)
  }

  setConfig(config: SketchConfig) {
    Reflect.ownKeys(config).forEach(key => {
      if (typeof config[key] !== 'object' || config[key] === null) {
        this.config[key] = config[key]
      } else {
        this.config[key] = merge(this.config[key], config[key])
      }
    })
  }

  resetConfig() {
    this.setConfig(defCfg)
  }

  renderCanvas() {
    this.canvas.renderAll()
  }
  reload() {
    this.canvas.clear()
    this.initBg()
  }
  initHandlers() {
    this.panHandler = this.panHandler.bind(this)
    this.scaleHandler = this.scaleHandler.bind(this)
    this.canvas.on('mouse:down', this.panHandler)
    this.canvas.on('mouse:wheel', this.scaleHandler)
    this.canvas.wrapperEl
      .addEventListener('contextmenu', e => e.preventDefault())
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

  scaleHandler(e: fabric.IEvent<WheelEvent>) {
    if (this.config.editable || !this.config.scalable) return
    const delta = e.e.deltaY
    const x = e.e.offsetX
    const y = e.e.offsetY
    let zoom = this.canvas.getZoom()
    zoom *= 0.999 ** delta
    if (zoom > 20) zoom = 20
    if (zoom < 0.6) zoom = 0.6
    this.canvas.zoomToPoint({x, y}, zoom)
    e.e.preventDefault()
    e.e.stopPropagation()
  }

  panHandler(e: fabric.IEvent<MouseEvent>) {
    if (this.config.editable) return
    const moveFn = (evt: fabric.IEvent<MouseEvent>) => {
      const {x: moveX, y: moveY} = this.canvas.getPointer(evt.e)
      this.canvas.relativePan(
        new fabric.Point(moveX - startX, moveY - startY)
      )
    }
    let {x: startX, y: startY} = this.canvas.getPointer(e.e)
    this.canvas.on('mouse:move', moveFn)
    this.canvas.on('mouse:up', () => {
      this.canvas.off('mouse:move', moveFn)
    })
  }

  getCanvasInfo() {
    return this.canvas.toJSON()
  }
  makeSvgCurvePath(points: fabric.IPoint[], arrow = false) {
    const len = points.length
    if (len < 2) return ''

    let path: (string|number)[][] = fabric.util
      // @ts-ignore
      .getSmoothPathFromPoints(
        points.map(p => new fabric.Point(p.x, p.y))
      )

    if (arrow) {
      const arrowPath = this.makeArrowPath(points[len - 1], points[len - 2])
      path = path.concat(arrowPath)
    }

    return path.map(item => item.join(' ')).join(' ')
  }
  makeArrowPath(lastDot: fabric.IPoint, preLastDot: fabric.IPoint) {
    const {arrowRadius} = this.config
    const angle = Math.PI / 6
    const yDiff = preLastDot.y - lastDot.y
    const xDiff = lastDot.x - preLastDot.x
    const slope = Math.atan(yDiff / xDiff)
    const fix = xDiff < 0 ? -1 : 1
    const x1 = lastDot.x - Math.cos(slope + angle) * arrowRadius * fix
    const y1 = lastDot.y + Math.sin(slope + angle) * arrowRadius * fix
    const x2 = lastDot.x - Math.cos(slope - angle) * arrowRadius * fix
    const y2 = lastDot.y + Math.sin(slope - angle) * arrowRadius * fix
    return [['M', x1, y1], ['L', lastDot.x, lastDot.y], ['L', x2, y2], ['L', x1, y1], ['L', lastDot.x, lastDot.y]]
  }
  makeCtlDot(pointer: fabric.IPoint) {
    const dot = new fabric.Circle({
      left: pointer.x,
      top: pointer.y,
      originX: 'center',
      originY: 'center',
      radius: this.config.ctlSize,
      strokeWidth: 2,
      fill: '#0018ff88',
      stroke: '#f0f0f088',
      evented: this.config.editable,
      hasBorders: false,
      hasControls: false,
      hoverCursor: 'pointer',
      moveCursor: 'pointer'
    })
    return dot
  }

  getPathStr(dots: fabric.IPoint[]) {
    if (dots.length < 2) return ''
    const start = 'M '
    const middle = dots.filter(Boolean).map(({x, y}) => {
      return `${x},${y}`
    }).join('L')
    const end = ' z'
    return start + middle + end
  }
  add2Cvs(...objs: fabric.Object[]) {
    this.canvas.add(...objs)
  }
  rmFCvs(...objs: fabric.Object[]) {
    this.canvas.remove(...objs)
  }
}
