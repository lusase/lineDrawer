import {SketchConfig} from '../type/drawer'

export const defCfg: SketchConfig = {
  strokeWidth: 1,
  lineStroke: '#000',
  arrowRadius: 8,
  editable: false,
  formatter: () => '',
  hasShadow: false,
  pathOpacity: 1,
  alwaysShowTip: false,
  bgUrl: '',
  scalable: true,
  ctlSize: 6,
  textStyle: {
    visible: false,
    fontSize: 12,
    stroke: '#ccc'
  }
}

export function merge<T extends object>(target: T, ...sources: object[]) {
  if (!sources.length) {
    return target
  }

  const source = sources.shift()

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      if (Array.isArray(source[key])) {
        target[key] = Array.isArray(target[key]) ? target[key] : []
        target[key] = target[key].concat(source[key])
      } else if (typeof source[key] === 'object' && source[key] !== null) {
        if (!target[key]) {
          target[key] = {}
        }

        merge(target[key], source[key])
      } else {
        target[key] = source[key]
      }
    }
  }

  return merge(target, ...sources)
}
