# [lineDrawer.js](https://github.com/lusase/lineDrawer)
> **A Graphic Drawing Tool Based on Fabric.js**

[编辑页预览](https://lusase.github.io?url=http%3A%2F%2F47.94.153.220%2FlineDrawer%2Ftest%2Findex.html)

## 用于绘制和显示流向图

![image](https://github.com/lusase/lineDrawer/blob/master/doc/img1.png)

![image](https://github.com/lusase/lineDrawer/blob/master/doc/img2.png)

![image](https://github.com/lusase/lineDrawer/blob/master/doc/img3.png)

## 用法

### 安装
> npm install linedrawer

<hr>

### 使用

- lineDrawer
  - [示例](#示例)
  - [API](#API)
  - [旧版示例](#旧版示例)
  - [旧版API](#旧版API)

#### 示例
```ts
// 引入绘画类
import {GraphicDrawer} from 'linedrawer'
// 初始化
const g = new GraphicDrawer<GraphicData>('#canvas', {
  // 是否可编辑
  editable: false,
  // 设置背景
  bgUrl: 'https://www.someurl.com/someimg.png'
})

// 通过数据向画布中加入多边形
g.addData({
  drawType: 'polygon',
  group: '分组信息',
  graphics: [{
    id: '图形的id',
    name: '图形的名称',
    evented: true, // 是否相应事件
    fill: '#fff000', // 填充颜色
    // 归一化坐标, 相对于画布的宽高
    path: [{x: 0.3, y: 0.1}, {x: 0.2, y: 0.3}, {x: 0.5, y: 0.4}, {x: 0.4, y: 0.15}],
    // 自定义元素携带的数据
    data: {},
  }]
})

// 通过数据向画布中加入曲线
g.addData({
  drawType: 'line',
  group: '分组信息',
  graphics: [{
    id: '图形的id',
    name: '图形的名称',
    evented: true, // 是否相应事件
    stroke: '#fff000', // 线条颜色
    strokeWidth: 10, // 线条宽度
    // 归一化坐标, 相对于画布的宽高
    path: [{x: 0.3, y: 0.1}, {x: 0.2, y: 0.3}, {x: 0.5, y: 0.4}, {x: 0.4, y: 0.15}],
    // 自定义元素携带的数据
    data: {},
  }]
})

// 加入静态的元素如 image
g.addStaticData({
  group: 'image',
  graphics: [{
    id: '5',
    type: 'image',
    bg: './icon.png',
    name: '1',
    width: 50,
    height: 50,
    x: 0.5,
    y: 0.5
  }]
})

// 元素创建时触发的事件
g.on('graph.create', (e) => {
  // do something
})


```
#### API
- GraphicDrawer
  - 属性
    - drawType 'polygon' | 'rectangle'(计划中) | 'circle'(计划中) | 'line'
    - currentGraphic 编辑状态下选中的图形
    - graphicMap 绘制图形集合
    - staticGraphicMap 静态图形集合
  - 方法
    - showGraphics 显示分组下的图形
      - 参数 groups 要显示的分组, 不填则为全部显示
    - hideGraphics 隐藏分组下的图形
      - 参数 groups 要显示的分组, 不填则为全部显示
    - setConfig 更改设置
      - 参数 config 类型为 [GraphicDrawerConfig](#GraphicDrawerConfig)
    - setDrawType 更改绘画类型
      - 参数 drawType 
    - cleanGraphics 清除画布上所有的图形
    - addData 通过数据向画布中添加图形
      - 参数 data 类型为 [DataType](#DataType)
    - addStaticData 通过数据向画布中添加静态的图形
      - 参数 data 类型为 [StaticDataType](#StaticDataType)
    - getData 获取当前画布上可绘制图形的数据
      - 返回类型为 [ReturnDataType](#ReturnDataType)



##### GraphicDrawerConfig
  ``` ts
  interface GraphicDrawerConfig extends SketchConfig {
    fill?: string
    fills?: string[]
  }
  ```

##### DataType
```ts
interface DataType<T = any> {
  drawType: DrawType
  group?: string
  graphics: (GraphicCfg & {
    data?: T
  })[]
}
```
##### StaticDataType
```ts
interface StaticDataType {
  group?: string
  graphics: StaticGraphCfg[]
}
type StaticGraphCfg = {
  id?: string
  type: 'image' | 'rect' | 'circle'
  name?: string
  evented?: boolean
  fill?: string
  stroke?: string
  strokeWidth?: number
  group?: string
  bg?: string | HTMLImageElement
  x?: number
  y?: number
  width?: number
  height?: number
  radius?: number
  textStyle?: SketchConfig['textStyle']
}
```
##### ReturnDataType
```ts
type ReturnDataType = {
  drawType: DrawType, 
  graphics: {
    id: string, 
    name: string, 
    path: {x: number, y: number}[], 
    group: string, 
    data: any
  }[]
}
```

#### 旧版示例
```
    import LineDrawer from 'linedrawer'

    // 用于展示
    new LineDrawer('canvasId', {
            formatter(line) {
              return `<span class="dot" style="background: ${line.stroke}"></span> ${toPercent(line.percent)}`
            },
            pathOpacity: 0.7
          }, data)

    // 用于绘图
    new LineDrawer('canvasId', {
        lineStroke: '#fff',
        strokeWidth: 2,
        editable: true,
        pathOpacity: 0.5
    })

```

#### 旧版API

> 构造函数
```
    new LineDrawer(id : String, config: Object, data: Array|String)
        id: canvas元素的id
        config: 配置
            strokeWidth: 线宽, 默认为1
            lineStroke: 线条初始化颜色, 默认黑色,
                        支持颜色字符串数组, 如果为颜色数组,
                        则新画的线的颜色依次自动取值
            arrowRadius: 箭头大小, 默认6
            editable: 是否可编辑, 默认false不可编辑
            formatter: 函数, 返回html字符串用于控制tooltip显示的内容, 接受一个参数, 为当前path的配置对象
            hasShadow: 线条是否显示阴影, 默认为false 不显示
            pathOpacity: 线条透明度, 默认为1 不透明
        data: 用于回显的数据
                格式为 类似
                [{
                  "strokeWidth": 2,
                  "stroke": "#ff0",
                  "dots": [
                    [
                      0.51875,
                      0.1375
                    ],
                    [
                      0.425,
                      0.4125
                    ]
                  ],
                  "id": 0
                }]
```

> 方法

```
        load(data: Array| String) 加载数据
        reload(data: Array| String| undefined) 重新加载数据
        newEmptyLine() 新建空线条
        getLinesInfo() 获取绘制线条数据
        configCurrentPath(config) 配置当前线条
        on(type, cb)
        off(type, cb)
        dispose() 销毁
```
> 事件

```
     'focus.dot' 控制点被选中
     'focus.path' 线条被选中
     'del.dot' 控制点被删除
     'add.line' 增加新线条
```

> 操作

```
    ctrl + 左击 新建线条
    ctrl + z 删除点
    delete 删除选中的线
```


