# [lineDrawer.js](https://github.com/lusase/lineDrawer)

[编辑页预览](https://lusase.github.io?url=http%3A%2F%2F47.94.153.220%2FlineDrawer%2Ftest%2Findex.html)

## 用于绘制和显示流向图

![imgage](https://github.com/lusase/lineDrawer/blob/master/doc/img1.png)

![imgage](https://github.com/lusase/lineDrawer/blob/master/doc/img2.png)

![imgage](https://github.com/lusase/lineDrawer/blob/master/doc/img3.png)

## 用法

### 安装
> npm install linedrawer

### 使用

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

## API

> 构造函数
```
    new LineDrawer(id : String, config: Object, data: Array|String)
        id: canvas元素的id
        config: 配置
            strokeWidth: 线宽, 默认为1
            lineStroke: 线条初始化颜色, 默认黑色
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
```

> 操作

```
    ctrl + 左击 新建线条
    ctrl + z 删除点
    delete 删除选中的线
```


