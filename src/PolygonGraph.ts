import {fabric} from 'fabric'
import tinyColor from 'tinycolor2'
import {DrawType, GraphicDrawer} from './GraphicDrawer'
import {Graphic, GraphicCfg} from './Graphic'


const drawingCfg: fabric.IPathOptions = {
  stroke: 'rgba(0, 0, 0, 0.75)',
  strokeWidth: 1,
  fill: 'rgba(255, 255, 255, 0.75)',
  hasBorders: false,
  hasControls: false,
  hoverCursor: 'crosshair'
}

const closedCfg: fabric.IPathOptions = {
  fill: 'rgba(255, 255, 0, 0.75)',
  hasBorders: false,
  hasControls: false,
  perPixelTargetFind: true
}


export class PolygonGraph<T = any> extends Graphic{
  readonly type: DrawType = 'polygon'
  constructor(
    public ctx: GraphicDrawer,
    public cfg: GraphicCfg = {}
  ) {
    super(ctx, cfg)
    if (cfg.closed) {
      this.addClosedListeners()
    } else {
      this.addDrawingListeners()
    }
    if (cfg.dots?.length) {
      this.dots = cfg.dots
      this.renderPath()
      this.renderText()
    }
    this.updateState()
  }
  close() {
    if (this.closed) return
    this.closed = true
    this.pushDot(this.movePointer)
    if (this.dots.length <= 2) {
      return this.destroy()
    }
    this.active = true
    this.removeDrawingListeners()
    this.movePointer = null
    this.renderPath()
    this.addClosedListeners()
    this.renderVertexes()
    this.ctx.emit('graph.create', {
      target: this,
      data: {id: this.id, name: this.name}
    })
  }

  brighten() {
    const fill = tinyColor(this.fill).darken().toString()
    const shadow = new fabric.Shadow({
      color: this.fill,
      blur: 6,
      offsetX: 0,
      offsetY: 0,
    })
    this.path.set({fill, shadow})
  }
  private recoverFill() {
    this.path.set({fill: this.fill, shadow: null})
  }
  unselect() {
    this.recoverFill()
    super.unselect()
  }
  renderPath() {
    if (this.path) {
      this.path.off('mousedown', this.onPathMouseDown)
      this.ctx.rmFCvs(this.path)
    }
    const dots = this.closed ? this.dots : [...this.dots, this.movePointer]
    const cfg = this.closed
      ? {...closedCfg, fill: this.fill}
      : drawingCfg
    const pathStr = this.ctx.getPathStr(dots)
    this.path = new fabric.Path(pathStr, cfg)
    this.path.name = this.pathName
    this.path.data = {x: this.path.left, y: this.path.top, _graphic: this}
    this.path.on('mousedown', this.onPathMouseDown)
    this.ctx.add2Cvs(this.path)
    this.bringPathToFront()
  }
}
