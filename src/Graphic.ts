import {fabric} from 'fabric'
import {DrawType, GraphicDrawer} from './GraphicDrawer'
import {Sketchpad} from './Sketchpad'

type GraphicCfg = {
  id?: string
}

const drawingCfg: fabric.IPathOptions = {
  stroke: 'rgba(0, 0, 0, 0.75)',
  strokeWidth: 1,
  fill: 'rgba(255, 255, 255, 0.75)',
  hasBorders: false,
  hasControls: false
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
  closed: boolean = false
  active: boolean = true
  graph: fabric.Group
  path: fabric.Path
  movePointer: fabric.IPoint
  readonly type: DrawType
  dots: fabric.IPoint[] = []
  vertexes: fabric.Object[] = []
  vertexName: string
  pathName: string
  constructor(
    public ctx: GraphicDrawer,
    public cfg: GraphicCfg = {}
  ) {
    this.id = cfg.id || Sketchpad.uuid()
    this.vertexName = 'vertex' + this.id
    this.pathName = 'path' + this.id
    this.addDrawingListeners()
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
    this.removeDrawingListeners()
    this.movePointer = null
    this.renderPath()
    this.addClosedListeners()
    this.renderVertexes()
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
  onObjectMoving(e: fabric.IEvent<MouseEvent>) {
    if (!this.active) return
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
    this.addDot = this.addDot.bind(this)
    this.rightClick = this.rightClick.bind(this)
    this.close = this.close.bind(this)
    this.onMove = this.onMove.bind(this)
    this.ctx.canvas.on('mouse:down', this.addDot)
    this.ctx.canvas.on('mouse:down:before', this.rightClick)
    this.ctx.canvas.on('mouse:dblclick', this.close)
    this.ctx.canvas.on('mouse:move', this.onMove)
  }

  removeDrawingListeners() {
    this.ctx.canvas.off('mouse:down', this.addDot)
    this.ctx.canvas.off('mouse:move', this.onMove)
    this.ctx.canvas.off('mouse:down:before', this.rightClick)
    this.ctx.canvas.off('mouse:dblclick', this.close)
  }

  addClosedListeners() {
    this.onObjectMoving = this.onObjectMoving.bind(this)
    this.ctx.canvas.on('object:moving', this.onObjectMoving)
  }
  removeClosedListeners() {
    this.ctx.canvas.off('object:moving', this.onObjectMoving)
  }
  renderPath() {
    if (this.path) {
      this.ctx.rmFCvs(this.path)
    }
    const dots = this.closed ? this.dots : [...this.dots, this.movePointer]
    const cfg = this.closed ? closedCfg : drawingCfg
    const pathStr = this.ctx.getPathStr(dots)
    this.path = new fabric.Path(pathStr, cfg)
    this.path.name = this.pathName
    this.path.data = {x: this.path.left, y: this.path.top, _graphic: this}
    this.ctx.add2Cvs(this.path)
    this.path.sendToBack()
  }

  blur() {
    this.active = false
    this.ctx.rmFCvs(...this.vertexes)
    this.removeClosedListeners()
  }
  focus() {
    this.active = true
    if (this.closed) this.addClosedListeners()
    this.renderVertexes()
  }

  destroy() {
    this.ctx.rmFCvs(this.path, ...this.vertexes)
    this.removeClosedListeners()
    this.removeDrawingListeners()
    this.ctx.graphicMap.delete(this.id)
    if (this.ctx.currentGraphic === this) {
      this.ctx.currentGraphic = null
    }
  }
}
