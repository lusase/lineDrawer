# lineDrawer.js

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
