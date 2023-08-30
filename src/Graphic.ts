import {fabric} from 'fabric'
import {DrawType, GraphicDrawer} from './GraphicDrawer'
import {Sketchpad} from './Sketchpad'

export type GraphicCfg = {
  id?: string
  name?: string
  closed?: boolean
  fill?: string
  stroke?: string
  group?: string
  dots?: fabric.IPoint[]
}

const closedCfg: fabric.IPathOptions = {
  fill: 'rgba(255, 255, 0, 0.75)',
  hasBorders: false,
  hasControls: false,
  perPixelTargetFind: true
}

const textCfg: fabric.TextOptions = {
  evented: false,
  textAlign: 'center',
  originX: 'center',
  originY: 'center'
}

const timeoutFn = (function useTimeout() {
  let timer: string | number | NodeJS.Timeout
  return (handler: () => void, ms?: number) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(handler, ms)
  }
})()


export abstract class Graphic<T = any> {
  id: string
  protected __name: string
  fill: string
  group: string
  closed: boolean = false
  evented = true
  protected active: boolean = false
  protected selected = false
  protected movePointer: fabric.IPoint
  graph: fabric.Group
  path: fabric.Path
  readonly type: DrawType
  dots: fabric.IPoint[] = []
  vertexes: fabric.Object[] = []
  vertexName: string
  pathName: string
  text: fabric.Text
  // 用作携带数据
  data?: T
  get name() {
    return this.__name
  }
  set name(name: string) {
    this.__name = name
    this.updateTextContent()
  }
  protected constructor(
    public ctx: GraphicDrawer,
    public cfg: GraphicCfg = {}
  ) {
    this.id = cfg.id || Sketchpad.uuid()
    this.name = cfg.name
    this.closed = cfg.closed ?? false
    this.vertexName = 'vertex' + this.id
    this.pathName = 'path' + this.id
    this.fill = cfg.fill ?? closedCfg.fill as string
    this.group = cfg.group ?? 'default'
    this.bindMethods()
  }
  protected bindMethods() {
    this.rightClick = this.rightClick.bind(this)
    this.close = this.close.bind(this)
    this.addDot = this.addDot.bind(this)
    this.onMove = this.onMove.bind(this)
    this.onKeydown = this.onKeydown.bind(this)
    this.onObjectMoving = this.onObjectMoving.bind(this)
    this.onPathMouseDown = this.onPathMouseDown.bind(this)
  }
  show() {
    this.toggleVisible(true)
  }

  hide() {
    this.toggleVisible(false)
  }

  protected toggleVisible(visible: boolean) {
    this.path.set({visible})
    this.text?.set({visible})
    if (this.ctx.config.editable) {
      this.vertexes.forEach(v => {
        v.set({visible})
      })
    }
  }

  getPath() {
    const width = this.ctx.canvas.getWidth()
    const height = this.ctx.canvas.getHeight()
    return this.dots.map(dot => {
      return {x: dot.x / width, y: dot.y / height}
    })
  }

  isActive() {
    return this.active
  }

  isSelected() {
    return this.selected
  }

  makeStartDot(point: fabric.IPoint) {
    this.dots = []
    this.pushDot(point)
  }
  rightClick(e: fabric.IEvent<MouseEvent>) {
    // 鼠标右键
    if (e.e.button === 2) {
      this.close()
    }
  }
  pushDot(point: fabric.IPoint) {
    if (this.isSameDot(point, this.dots[this.dots.length - 1])) return
    this.dots.push(point)
  }
  abstract close(): void

  protected renderVertexes() {
    if (this.vertexes.length) {
      this.ctx.rmFCvs(...this.vertexes)
      this.vertexes.forEach(vtx => {
        vtx.left = vtx.data.x
        vtx.top = vtx.data.y
      })
      this.ctx.add2Cvs(...this.vertexes)
      return
    }
    this.dots.forEach(p => {
      const vertex = this.ctx.makeCtlDot(p)
      vertex.name = this.vertexName
      vertex.data = p
      this.vertexes.push(vertex)
    })
    this.ctx.add2Cvs(...this.vertexes)
  }
  isSameDot(dot1: fabric.IPoint, dot2: fabric.IPoint) {
    if (!dot1 || !dot2) return false
    return dot1.x === dot2.x && dot1.y === dot2.y
  }
  addDot(e: fabric.IEvent<MouseEvent>) {
    const point = this.ctx.canvas.getPointer(e.e)
    const lastDot = this.dots[this.dots.length - 1]
    if (this.isSameDot(point, lastDot)) return
    this.pushDot(point)
    this.renderPath()
  }
  onMove(e: fabric.IEvent<MouseEvent>) {
    this.movePointer = this.ctx.canvas.getPointer(e.e)
    this.renderPath()
  }
  onKeydown(e: KeyboardEvent) {
    if (e.code === 'Escape' && !this.closed) {
      this.close()
    }
  }
  onObjectMoving(e: fabric.IEvent<MouseEvent>) {
    if (!this.active || !this.ctx.config.editable) return
    if (e.target.name === this.vertexName) {
      const p = e.target.data as fabric.IPoint
      p.x = e.target.left
      p.y = e.target.top
      this.renderPath()
      this.updateTextPos()
    } else if (e.target.name === this.pathName) {
      const path = e.target as fabric.Path
      const {x, y} = path.data as fabric.IPoint
      const offsetX = x - path.left
      const offsetY = y - path.top
      this.dots.forEach(dot => {
        dot.x -= offsetX
        dot.y -= offsetY
      })
      this.renderVertexes()
      this.updateTextPos()
      path.data = {x: path.left, y: path.top, _graphic: this}
    }
  }
  addDrawingListeners() {
    this.ctx.canvas.on('mouse:down', this.addDot)
    this.ctx.canvas.on('mouse:down:before', this.rightClick)
    this.ctx.canvas.on('mouse:dblclick', this.close)
    this.ctx.canvas.on('mouse:move', this.onMove)
    window.addEventListener('keydown', this.onKeydown)
  }
  removeDrawingListeners() {
    this.ctx.canvas.off('mouse:down', this.addDot)
    this.ctx.canvas.off('mouse:move', this.onMove)
    this.ctx.canvas.off('mouse:down:before', this.rightClick)
    this.ctx.canvas.off('mouse:dblclick', this.close)
    window.removeEventListener('keydown', this.onKeydown)
  }

  addClosedListeners() {
    this.ctx.canvas.on('object:moving', this.onObjectMoving)
  }
  removeClosedListeners() {
    this.ctx.canvas.off('object:moving', this.onObjectMoving)
  }
  abstract brighten(): void
  unselect() {
    this.selected = false
  }
  select() {
    this.ctx.graphicMap.forEach((g) => {
      g !== this && g.unselect()
    })
    this.brighten()
    this.selected = true
  }
  onPathMouseDown(e: fabric.IEvent<MouseEvent>) {
    if (!this.closed || e.target !== this.path) return
    if (!this.ctx.config.editable) {
      this.select()
    }
    this.ctx.emit('graph.click', {
      target: this,
      data: {id: this.id, name: this.name}
    })
  }
  updateState() {
    if (this.ctx.config.editable) {
      this.path?.set({hoverCursor: 'move', selectable: true})
      this.path && this.selected && this.unselect()
    } else {
      this.path?.set({hoverCursor: 'pointer', selectable: false})
      this.active = false
    }
  }

  renderPath() {
    if (this.path) {
      this.path.off('mousedown', this.onPathMouseDown)
      this.ctx.rmFCvs(this.path)
    }
    const cfg = this.getPathCfg()
    cfg.evented = this.evented
    const pathStr = this.getPathStr()
    this.path = new fabric.Path(pathStr, cfg)
    this.path.name = this.pathName
    this.path.data = {x: this.path.left, y: this.path.top, _graphic: this}
    this.path.on('mousedown', this.onPathMouseDown)
    this.ctx.add2Cvs(this.path)
    this.bringPathToFront()
  }

  abstract getPathCfg(): fabric.IPathOptions
  abstract getPathStr(): string
  renderText() {
    const {textStyle} = this.ctx.config
    if (!textStyle.visible || !this.name || !this.path) return
    const center = this.path.getCenterPoint()
    this.text = new fabric.Text(this.name, {
      ...textCfg,
      left: center.x,
      top: center.y,
      ...textStyle
    })
    this.ctx.add2Cvs(this.text)
  }

  updateTextContent() {
    if (!this.text) {
      return this.renderText()
    }
    this.text.set({
      text: this.name
    })
    this.ctx.canvas.requestRenderAll()
  }

  updateTextPos() {
    if (!this.text) return
    const center = this.path.getCenterPoint()
    this.text.set({
      left: center.x,
      top: center.y,
    })
  }

  protected bringPathToFront() {
    let index = this.ctx.canvas.getObjects().length - this.vertexes.length - 1
    this.path.moveTo(index)
    if (this.text?.visible) {
      this.text.moveTo(index)
    }
  }

  blur() {
    this.active = false
    this.ctx.rmFCvs(...this.vertexes)
    this.removeClosedListeners()
  }
  focus() {
    if (!this.ctx.config.editable) return
    this.active = true
    if (this.closed) this.addClosedListeners()
    this.renderVertexes()
    this.bringPathToFront()
  }

  destroy() {
    this.ctx.rmFCvs(this.path, ...this.vertexes)
    this.removeClosedListeners()
    this.removeDrawingListeners()
    this.ctx.graphicMap.delete(this.id)
    if (this.ctx.currentGraphic?.id === this.id) {
      this.ctx.currentGraphic = null
    }
  }

  updateTextStyle() {
    if (!this.text) return
    const {textStyle} = this.ctx.config
    this.text.set(textStyle)
  }
}
