import {IEvent} from 'fabric/fabric-impl'
import {Sketchpad} from './Sketchpad'
import {SketchConfig} from './type/drawer'
import {Graphic} from './Graphic'

export type DrawType = 'polygon' | 'rectangle' | 'circle'

export class GraphicDrawer extends Sketchpad {
  drawType: 'polygon' | 'rectangle' | 'circle' = 'polygon'
  currentGraphic: Graphic = null
  graphicMap = new Map<string, Graphic>()
  constructor(canvasId: string, public config: SketchConfig = {}) {
    super(canvasId, config)
  }

  onKeydown(e: KeyboardEvent): void {
    if (!this.config.editable) return
    if (e.code === 'Delete') {
      this.currentGraphic?.destroy()
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

  private polygonMouseDown(e: IEvent<MouseEvent>) {
    // 点到了空白区域
    if(!e.target) {
      if (this.currentGraphic) {
        this.currentGraphic.blur()
      }
      this.currentGraphic = new Graphic(this)
      this.graphicMap.set(this.currentGraphic.id, this.currentGraphic)
      this.currentGraphic.makeStartDot(this.canvas.getPointer(e.e))
    } else if(e.target.data?._graphic){
      const graphic = e.target.data._graphic as Graphic
      if(this.currentGraphic.closed && graphic !== this.currentGraphic) {
        this.currentGraphic.blur()
        this.currentGraphic = graphic
        this.currentGraphic.focus()
      }
    }
  }
}
