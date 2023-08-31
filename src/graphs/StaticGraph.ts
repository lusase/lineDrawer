import {fabric} from 'fabric'
import {GraphicDrawer} from '../GraphicDrawer'
import {Sketchpad} from '../Sketchpad'
import {SketchConfig} from '../type/drawer'

const commonCfg: fabric.IObjectOptions = {
  originX: 'center',
  originY: 'center',
  hasControls: false,
  hasBorders: false,
  lockMovementX: true,
  lockMovementY: true
}

export type StaticGraphCfg = {
  id?: string
  type: 'image' | 'rect' | 'circle'
  name?: string
  evented?: boolean
  fill?: string
  stroke?: string
  strokeWidth?: number
  group?: string
  bg?: string | HTMLImageElement
  x?: number
  y?: number
  width?: number
  height?: number
  radius?: number
  textStyle?: SketchConfig['textStyle']
}

export class StaticGraph {
  id: string
  protected __name: string
  group: string
  evented: boolean
  selected = false
  text: fabric.Text
  graph: fabric.Object
  get name() {
    return this.__name
  }
  set name(name: string) {
    this.__name = name
    this.updateTextContent()
  }
  constructor(
    public ctx: GraphicDrawer,
    public cfg: StaticGraphCfg = {type: 'circle'}
  ) {
    this.id = cfg.id || Sketchpad.uuid()
    this.name = cfg.name
    this.evented = cfg.evented ?? true
    this.group = cfg.group ?? 'static'
    this.renderGraph()
    this.renderText()
    this.addListeners()
  }

  renderGraph() {
    switch (this.cfg.type) {
      case 'circle':
        this.renderCircle()
        break
      case 'rect':
        this.renderRect()
        break
      case 'image':
        this.renderImage()
        break
      default:
        throw new Error(`暂无匹配的静态绘图类型: ${this.cfg.type}`)
    }
    this.ctx.add2Cvs(this.graph)
  }
  renderImage() {
    this.graph = new fabric.Image(this.cfg.bg, {
      ...commonCfg,
      left: this.cfg.x,
      top: this.cfg.y,
      width: this.cfg.width,
      height: this.cfg.height,
    })
  }
  renderRect() {
    this.graph = new fabric.Rect({
      ...commonCfg,
      left: this.cfg.x,
      top: this.cfg.y,
      width: this.cfg.width,
      height: this.cfg.height,
      fill: this.cfg.fill,
      stroke: this.cfg.stroke,
      strokeWidth: this.cfg.strokeWidth
    })
  }

  renderCircle() {
    this.graph = new fabric.Circle({
      ...commonCfg,
      left: this.cfg.x,
      top: this.cfg.y,
      radius: this.cfg.radius,
      fill: this.cfg.fill,
      stroke: this.cfg.stroke,
      strokeWidth: this.cfg.strokeWidth
    })
  }
  addListeners() {
    if (!this.graph) return
    this.graph.on('mouse:down', () => {
      this.ctx.emit('graph.click', {
        target: this
      })
    })
  }

  removeListeners() {
    if (!this.graph) return
    this.graph.off('mouse:down')
  }
  renderText() {
    this.text = new fabric.Text(this.name, {
      ...commonCfg,
      left: this.cfg.x,
      top: this.cfg.y,
      stroke: '#000',
      fill: '#fff',
      strokeWidth: 0.5,
      fontSize: 14,
      ...this.cfg.textStyle
    })
    this.ctx.add2Cvs(this.text)
  }
  updateTextContent() {
    if (!this.text) return
    this.text.set({text: this.name})
    this.ctx.canvas.requestRenderAll()
  }

  destroy() {
    this.removeListeners()
    this.ctx.rmFCvs(this.graph, this.text)
    this.ctx.staticGraphicMap.delete(this.id)
  }
}
