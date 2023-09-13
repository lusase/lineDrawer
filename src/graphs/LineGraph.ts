import {Graphic, GraphicCfg} from './Graphic'
import {GraphicDrawer} from '../GraphicDrawer'
import {fabric} from 'fabric'
import tinyColor from 'tinycolor2'
import {IPathOptions} from 'fabric/fabric-impl'
import {setStyle} from '../util'

const drawingCfg: fabric.IPathOptions = {
  stroke: 'rgba(0, 0, 0, 0.45)',
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
  smooth: boolean
  stroke: string
  strokeWidth: number

  constructor(
    public ctx: GraphicDrawer,
    public cfg: GraphicCfg = {}
  ) {
    super(ctx, cfg)
    this.stroke = cfg.stroke ?? closedCfg.stroke
    this.strokeWidth = cfg.strokeWidth ?? closedCfg.strokeWidth
    this.smooth = cfg.smooth ?? this.ctx.config.smooth ?? true

    if (cfg.closed) {
      this.addClosedListeners()
    } else {
      this.addDrawingListeners()
    }
    if (cfg.path?.length) {
      this.dots = cfg.path
      this.renderPath()
      this.renderText()
    }
    this.updateState()
    this.initTooltip()
  }

  protected initTooltip() {
    if (this.ctx.config.editable) return
    super.initTooltip()
    if (!this.tooltip || !this.ctx.config.formatter) return
    const html = this.ctx.config.formatter(this.path)
    if (!html) return
    this.tooltip.innerHTML = html
    this.updateTooltipPos = this.updateTooltipPos.bind(this)
    this.updateTooltipPos()
    this.ctx.on('canvas.scale', this.updateTooltipPos)
    this.ctx.on('canvas.pan', this.updateTooltipPos)
  }

  updateTooltipPos() {
    const lastDot = this.dots[this.dots.length - 1]
    const pos = fabric.util.transformPoint(
      new fabric.Point(lastDot.x, lastDot.y),
      this.ctx.canvas.viewportTransform
    )
    setStyle(this.tooltip, {
      visibility: 'visible',
      left: pos.x + 'px',
      top: pos.y + 'px'
    })
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
      ? {
        ...closedCfg,
        stroke: this.stroke,
        strokeWidth: this.strokeWidth
      }
      : drawingCfg
  }

  getPathStr() {
    const dots = this.closed ? this.dots : [...this.dots, this.movePointer]
    const arrowShow = this.ctx.config.arrowShow
    return this.smooth
      ? this.ctx.makeSvgCurvePath(dots, this.closed && arrowShow)
      : this.ctx.getPathStr(dots, this.closed && arrowShow, true)
  }

  private recoverStroke() {
    this.path.set({stroke: this.stroke, shadow: null})
  }
  destroy() {
    super.destroy()
    this.ctx.off('canvas.scale', this.updateTooltipPos)
    this.ctx.off('canvas.pan', this.updateTooltipPos)
    if (this.ctx.config.alwaysShowTip && this.tooltip) {
      this.tooltip.remove()
      this.tooltip = null
    }
  }
}
