import {fabric} from 'fabric'
import {EventEmitter} from './EventEmitter'
import {SketchConfig} from './type/drawer'
import {defCfg, mergeDefault} from './util'


export abstract class Sketchpad extends EventEmitter {
  canvas: fabric.Canvas & {
    wrapperEl?: HTMLElement
  }
  tooltip: HTMLElement
  static uuid(): string {
    return Array.from({length: 8}, () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substr(1)).join('')
  }
  protected constructor(
    canvasId: string,
    public config: SketchConfig = {}
  ) {
    super()
    mergeDefault(config, defCfg)
    this.canvas = new fabric.Canvas(canvasId, {
      selection: false,
      preserveObjectStacking: true
    })
    this.initBg()
    this.initHandlers()
    this.initListeners()
  }
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
    this.canvas.setZoom(1)
    const vpt = this.canvas.viewportTransform
    vpt[4] = 0
    vpt[5] = 0
  }

  setConfig(config: SketchConfig) {
    this.config = {...this.config, ...config}
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
    if (zoom < 0.01) zoom = 0.01
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
  makeCtlDot(pointer: fabric.IPoint) {
    const dot = new fabric.Circle({
      left: pointer.x,
      top: pointer.y,
      originX: 'center',
      originY: 'center',
      radius: 5,
      strokeWidth: 2,
      fill: '#0018ff',
      stroke: '#f0f0f0',
      evented: this.config.editable,
      hasBorders: false,
      hasControls: false
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
