import {fabric} from 'fabric'
import {EventEmitter} from './EventEmitter'
import {SketchConfig} from './type/drawer'
import {defCfg, mergeDefault} from './util'


export class Sketchpad extends EventEmitter {
  canvas: fabric.Canvas & {
    wrapperEl?: HTMLElement
  }
  tooltip: HTMLElement
  static uuid(): string {
    return Array.from({length: 8}, () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substr(1)).join('')
  }
  constructor(
    canvasId: string,
    public config: SketchConfig = {}
  ) {
    super()
    mergeDefault(config, defCfg)
    this.canvas = new fabric.Canvas(canvasId, {selection: false})
    this.initBg()
    this.initHandlers()
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
}
