import {fabric} from 'fabric'

export interface SketchConfig {
  strokeWidth?: number
  lineStroke?: string
  arrowRadius?: number
  editable?: boolean
  formatter?: (param: unknown) => string
  hasShadow?: boolean
  pathOpacity?: number
  alwaysShowTip?: boolean
  bgUrl?: string
  scalable?: boolean
}

export interface ArrowLine {
  id: string
  idx: number
  lineDots: fabric.Circle[]
  path: fabric.Path
  selected?: boolean
}

export interface ArrowLineData {
  strokeWidth: number
  stroke: string
  dots: [number, number][]
  id: string
  tooltip?: HTMLElement
}

export interface IGEvent<T> {
  target?: T
  data?: any
}

export type GEventName =
  'graph.create'
  |'graph.delete'
  |'graph.click'
