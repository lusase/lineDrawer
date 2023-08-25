import {fabric} from 'fabric'
import tinyColor from 'tinycolor2'
import {DrawType, GraphicDrawer} from './GraphicDrawer'
import {Sketchpad} from './Sketchpad'
import {IEvent} from 'fabric/fabric-impl'

type GraphicCfg = {
  id?: string
  name?: string
  closed?: boolean
  fill?: string
  group?: string
  dots?: fabric.IPoint[]
}

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

const timeoutFn = (function useTimeout() {
  let timer: string | number | NodeJS.Timeout
  return (handler: () => void, ms?: number) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(handler, ms)
  }
})()


export class Graphic {
  id: string
  name?: string
  fill: string
  group: string
  closed: boolean = false
  private active: boolean = false
  private selected = false
  graph: fabric.Group
  path: fabric.Path
  movePointer: fabric.IPoint
  readonly type: DrawType
  dots: fabric.IPoint[] = []
  vertexes: fabric.Object[] = []
  vertexName: string
  pathName: string
  data?: unknown
  constructor(
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
    if (cfg.closed) {
      this.addClosedListeners()
    } else {
      this.addDrawingListeners()
    }
    if (cfg.dots?.length) {
      this.dots = cfg.dots
      this.renderPath()
    }
    this.updateState()
  }
  private bindMethods() {
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

  private toggleVisible(visible: boolean) {
    this.path.set({visible})
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

  private renderVertexes() {
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
  private brighten() {
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
    this.selected = false
  }
  select() {
    this.ctx.graphicMap.forEach((g) => {
      g !== this && g.unselect()
    })
    this.brighten()
    this.selected = true
  }
  onPathMouseDown(e: IEvent<MouseEvent>) {
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

  private bringPathToFront() {
    const index = this.ctx.canvas.getObjects().length - this.vertexes.length - 1
    this.path.moveTo(index)
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
}
