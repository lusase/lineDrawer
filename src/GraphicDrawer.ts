import {fabric} from 'fabric'
import {Sketchpad} from './Sketchpad'
import {GraphicDrawerConfig} from './type/drawer'
import {Graphic, GraphicCfg} from './Graphic'
import {PolygonGraph} from './PolygonGraph'
import {LineGraph} from './LineGraph'

export type DrawType = 'polygon' | 'rectangle' | 'circle' | 'line'

export interface DataType<T = any> {
  drawType: DrawType
  group?: string
  graphics: {
    id: string
    name: string
    evented?: boolean
    data?: T
    path: {x: number, y: number}[]
  }[]
}

export class GraphicDrawer<GDATA = any> extends Sketchpad {
  drawType: DrawType = 'polygon'
  currentGraphic: Graphic<GDATA> = null
  graphicMap = new Map<string, Graphic<GDATA>>()
  constructor(canvasId: string | HTMLCanvasElement, config: GraphicDrawerConfig = {}) {
    super(canvasId, config)
  }

  private toReadonlyState() {
    this.currentGraphic = null
    this.graphicMap.forEach(g => {
      g.isActive() && g.blur()
      g.updateState()
    })
    this.canvas.requestRenderAll()
  }

  showGraphics(...groups: string[]) {
    this.toggleGraphicsVisible(true, ...groups)
  }

  hideGraphics(...groups: string[]) {
    this.toggleGraphicsVisible(false, ...groups)
  }

  private toggleGraphicsVisible(visible: boolean, ...groups: string[]) {
    this.graphicMap.forEach(g => {
      if (groups.length && !groups.includes(g.group)) return
      visible ? g.show() : g.hide()
    })
    this.canvas.requestRenderAll()
  }

  private toEditingState() {
    this.graphicMap.forEach(g => {
      g.updateState()
    })
    this.canvas.requestRenderAll()
  }

  setConfig(config: GraphicDrawerConfig) {
    super.setConfig(config)
  }
  setDrawType(drawType: DrawType) {
    this.drawType = drawType
  }
  cleanGraphics() {
    this.graphicMap.forEach((g) => {
      g.destroy()
    })
  }
  private getFill() {
    const {fills, fill} = this.config as GraphicDrawerConfig
    if (fills?.length) {
      return fills[this.graphicMap.size % fills.length]
    }
    return fill
  }
  private getGraphicCfg(g: DataType<GDATA>['graphics'][number], width: number, height: number, group: string): GraphicCfg {
    return {
      id: g.id,
      name: g.name,
      closed: true,
      fill: this.getFill(),
      group,
      dots: g.path.map(p => ({
        x: p.x * width,
        y: p.y * height
      }))
    }
  }
  addData(data: DataType<GDATA>) {
    const width = this.canvas.getWidth()
    const height = this.canvas.getHeight()
    data.graphics.forEach(g => {
      const cfg = this.getGraphicCfg(g, width, height, data.group)
      let graph: Graphic
      switch (data.drawType) {
        case 'polygon':
          graph = new PolygonGraph(this, cfg)
          break
        case 'line':
          graph = new LineGraph(this, cfg)
          break
        default:
          throw new Error(`不支持的绘图类型:${data.drawType}`)
      }
      graph.data = g.data
      graph.evented = g.evented
      this.graphicMap.set(g.id, graph)
    })
  }
  getData() {
    const graphics = [...this.graphicMap.values()].map(graph => {
      return {
        id: graph.id,
        name: graph.name,
        path: graph.getPath(),
        data: graph.data
      }
    })
    return {
      drawType: this.drawType,
      graphics
    }
  }

  async onKeydown(e: KeyboardEvent): Promise<void> {
    if (!this.config.editable) return
    if (e.code === 'Delete' && this.currentGraphic) {
      await (this.emit('graph.beforeDel', {}) as Promise<unknown>)
      const {id, name} = this.currentGraphic
      this.currentGraphic?.destroy()
      this.emit('graph.delete', {
        data:{id, name}
      })
    }
  }

  onMouseDown(e: fabric.IEvent<MouseEvent>): void {
    if (!this.config.editable) return
    switch (this.drawType) {
      case 'polygon':
        this.polygonMouseDown(e)
        break
      case 'line':
        this.lineMouseDown(e)
        break
      default:
        throw new Error(`不支持的绘图类型:${this.drawType}`)
    }
  }

  onMouseMove(e: fabric.IEvent<MouseEvent>): void {
  }

  onMouseOut(e: fabric.IEvent<MouseEvent>): void {
  }

  onMouseOver(e: fabric.IEvent<MouseEvent>): void {
  }

  onObjectMoving(e: fabric.IEvent<MouseEvent>): void {
  }

  focus(graph: Graphic<GDATA>) {
    if (!graph) return
    if (this.currentGraphic === graph) {
      return graph.focus()
    }
    this.currentGraphic?.blur()
    this.currentGraphic = graph
    this.currentGraphic.focus()
  }

  private polygonMouseDown(e: fabric.IEvent<MouseEvent>) {
    // 点到了空白区域
    if(!e.target) {
      if (this.currentGraphic) {
        this.currentGraphic.blur()
      }
      this.currentGraphic = new PolygonGraph<GDATA>(this, {
        fill: this.getFill()
      })
      this.graphicMap.set(this.currentGraphic.id, this.currentGraphic)
      this.currentGraphic.makeStartDot(this.canvas.getPointer(e.e))
    // 点到了graph上
    } else if (e.target.data?._graphic){
      const graphic = e.target.data._graphic as Graphic
      if(
        !this.currentGraphic
        || (this.currentGraphic.closed && graphic !== this.currentGraphic)
      ) {
        this.config.editable && this.focus(graphic)
      }
    }
  }

  private lineMouseDown(e: fabric.IEvent<MouseEvent>) {
    // 点到了空白区域
    if(!e.target) {
      if (this.currentGraphic) {
        this.currentGraphic.blur()
      }
      this.currentGraphic = new LineGraph<GDATA>(this, {})
      this.graphicMap.set(this.currentGraphic.id, this.currentGraphic)
      this.currentGraphic.makeStartDot(this.canvas.getPointer(e.e))
      // 点到了graph上
    } else if (e.target.data?._graphic){
      const graphic = e.target.data._graphic as Graphic
      if(
        !this.currentGraphic
        || (this.currentGraphic.closed && graphic !== this.currentGraphic)
      ) {
        this.config.editable && this.focus(graphic)
      }
    }
  }

  private updateTextStyle() {
    this.graphicMap.forEach(graph => {
      graph.updateTextStyle()
    })
    this.canvas.requestRenderAll()
  }

  configSetHandler(target: GraphicDrawerConfig, p: keyof GraphicDrawerConfig, newValue: GraphicDrawerConfig[typeof p], receiver: any): boolean {
    Reflect.set(target, p, newValue)
    switch (p) {
      case 'editable':
        newValue ? this.toEditingState() : this.toReadonlyState()
        break
      case 'textStyle':
        this.updateTextStyle()
        break
    }
    return true
  }
}
