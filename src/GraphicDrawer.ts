import {IEvent} from 'fabric/fabric-impl'
import {Sketchpad} from './Sketchpad'
import {GraphicDrawerConfig, SketchConfig} from './type/drawer'
import {Graphic} from './Graphic'

export type DrawType = 'polygon' | 'rectangle' | 'circle'

export type DataType = {
  drawType: DrawType
  group?: string
  graphics: {
    id: string
    name: string
    path: {x: number, y: number}[]
  }[]
}

export class GraphicDrawer extends Sketchpad {
  drawType: DrawType = 'polygon'
  currentGraphic: Graphic = null
  graphicMap = new Map<string, Graphic>()
  constructor(canvasId: string | HTMLCanvasElement, public config: GraphicDrawerConfig = {}) {
    super(canvasId, config)
  }

  toReadonlyState() {
    this.config.editable = false
    this.currentGraphic = null
    this.graphicMap.forEach(g => {
      g.isActive() && g.blur()
      g.updateState()
    })
    this.canvas.requestRenderAll()
  }

  showGraphics(...groups: string[]) {
    this.graphicMap.forEach(g => {
      if (groups.length && !groups.includes(g.group)) return
      g.show()
    })
  }

  hideGraphics(...groups: string[]) {
    this.graphicMap.forEach(g => {
      if (groups.length && !groups.includes(g.group)) return
      g.hide()
    })
  }

  toEditingState() {
    this.config.editable = true
    this.graphicMap.forEach(g => {
      g.updateState()
    })
    this.canvas.requestRenderAll()
  }

  setConfig(config: SketchConfig) {
    const {editable} = this.config
    if (editable && !config.editable) {
      this.toReadonlyState()
    } else if (!editable && config.editable) {
      this.toEditingState()
    }
    super.setConfig(config)
  }

  cleanGraphics() {
    this.graphicMap.forEach((g) => {
      g.destroy()
    })
  }
  private getFill() {
    const {fills, fill} = this.config
    if (fills?.length) {
      return fills[this.graphicMap.size % fills.length]
    }
    return fill
  }
  addData(data: DataType) {
    const width = this.canvas.getWidth()
    const height = this.canvas.getHeight()
    data.graphics.forEach(g => {
      const graph = new Graphic(this, {
        id: g.id,
        name: g.name,
        closed: true,
        fill: this.getFill(),
        group: data.group,
        dots: g.path.map(p => ({
          x: p.x * width,
          y: p.y * height
        }))
      })
      this.graphicMap.set(g.id, graph)
    })
  }
  getData() {
    const graphics = [...this.graphicMap.values()].map(graph => {
      return {
        id: graph.id,
        name: graph.name,
        path: graph.getPath()
      }
    })
    return {
      drawType: this.drawType,
      graphics
    }
  }

  async onKeydown(e: KeyboardEvent): Promise<void> {
    if (!this.config.editable) return
    if (e.code === 'Delete') {
      await (this.emit('graph.beforeDel', {}) as Promise<unknown>)
      const {id, name} = this.currentGraphic
      this.currentGraphic?.destroy()
      this.emit('graph.delete', {
        data:{id, name}
      })
    }
  }

  onMouseDown(e: IEvent<MouseEvent>): void {
    if (!this.config.editable) return
    switch (this.drawType) {
      case 'polygon':
        this.polygonMouseDown(e)
    }
  }

  onMouseMove(e: IEvent<MouseEvent>): void {
  }

  onMouseOut(e: IEvent<MouseEvent>): void {
  }

  onMouseOver(e: IEvent<MouseEvent>): void {
  }

  onObjectMoving(e: IEvent<MouseEvent>): void {
  }

  focus(graph: Graphic) {
    if (!graph) return
    if (this.currentGraphic === graph) {
      return graph.focus()
    }
    this.currentGraphic?.blur()
    this.currentGraphic = graph
    this.currentGraphic.focus()
  }

  private polygonMouseDown(e: IEvent<MouseEvent>) {
    // 点到了空白区域
    if(!e.target) {
      if (this.currentGraphic) {
        this.currentGraphic.blur()
      }
      this.currentGraphic = new Graphic(this, {
        fill: this.getFill()
      })
      this.graphicMap.set(this.currentGraphic.id, this.currentGraphic)
      this.currentGraphic.makeStartDot(this.canvas.getPointer(e.e))
    } else if(e.target.data?._graphic){
      const graphic = e.target.data._graphic as Graphic
      if(
        !this.currentGraphic
        || (this.currentGraphic.closed && graphic !== this.currentGraphic)
      ) {
        this.config.editable && this.focus(graphic)
      }
    }
  }
}
