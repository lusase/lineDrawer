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
  ctlSize?: number
  textStyle?: {
    show?: boolean
    color?: string
    fontSize?: number
  }
}

export interface GraphicDrawerConfig extends SketchConfig {
  fill?: string
  fills?: string[]
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

export interface IData {
  id?: string
  name?: string
}

export interface IGEvent<T> {
  target?: T
  data?: IData
}

export type GEventName =
  'graph.create'
  | 'graph.delete'
  | 'graph.click'
  | 'graph.beforeDel'
export type LEventName =
  'add.line'
  | 'add.dot'
  | 'del.line'
  | 'del.dot'
  | 'focus.path'
  | 'focus.dot'
