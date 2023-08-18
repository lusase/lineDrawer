import {SketchConfig} from '../type/drawer'

export const defCfg: SketchConfig = {
  strokeWidth: 1,
  lineStroke: '#000',
  arrowRadius: 6,
  editable: false,
  formatter: () => '',
  hasShadow: false,
  pathOpacity: 1,
  alwaysShowTip: false,
  bgUrl: '',
  scalable: true,
  ctlSize: 6
}

export function mergeDefault(src: Record<string, unknown> | {}, def: Record<string, unknown> | {}) {
  Object.keys(def).forEach(key => {
    src[key] = src[key] ?? def[key]
  })
}
