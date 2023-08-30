import {Graphic, GraphicCfg} from './Graphic'
import {GraphicDrawer} from './GraphicDrawer'
import {fabric} from 'fabric'
import tinyColor from 'tinycolor2'
import {IPathOptions} from 'fabric/fabric-impl'
const drawingCfg: fabric.IPathOptions = {
  stroke: 'rgba(0, 0, 0, 0.75)',
  strokeWidth: 2,
  fill: 'transparent',
  hasBorders: false,
  hasControls: false,
  hoverCursor: 'crosshair'
}

const closedCfg: fabric.IPathOptions = {
  stroke: 'rgba(255, 213, 145, 1)',
  strokeWidth: 6,
  fill: 'transparent',
  hasBorders: false,
  hasControls: false,
  perPixelTargetFind: true
}
export class LineGraph<T = any> extends Graphic {
  stroke: string
  constructor(
    public ctx: GraphicDrawer,
    public cfg: GraphicCfg = {}
  ) {
    super(ctx, cfg)
    this.stroke = cfg.stroke ?? closedCfg.stroke
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

  brighten() {
    const stroke = tinyColor(this.stroke).darken().toString()
    const shadow = new fabric.Shadow({
      color: stroke,
      blur: 6,
      offsetX: 0,
      offsetY: 0,
    })
    this.path.set({stroke, shadow})
  }

  close() {
    if (this.closed) return
    this.closed = true
    this.pushDot(this.movePointer)
    if (this.dots.length <= 1) {
      return this.destroy()
    }
    this.active = true
    this.movePointer = null
    this.removeDrawingListeners()
    this.renderPath()
    this.addClosedListeners()
    this.renderVertexes()
    this.ctx.emit('graph.create', {
      target: this,
      data: {id: this.id, name: this.name}
    })
  }

  unselect() {
    this.recoverStroke()
    super.unselect()
  }

  getPathCfg() {
    return this.closed
      ? {...closedCfg, stroke: this.stroke}
      : drawingCfg
  }
  getPathStr() {
    const dots = this.closed ? this.dots : [...this.dots, this.movePointer]
    return this.ctx.makeSvgCurvePath(dots, this.closed)
  }
  private recoverStroke() {
    this.path.set({stroke: this.stroke, shadow: null})
  }
}
