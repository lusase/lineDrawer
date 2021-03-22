"use strict";var _slicedToArray=function(t,e){if(Array.isArray(t))return t;if(Symbol.iterator in Object(t))return function(t,e){var i=[],n=!0,o=!1,r=void 0;try{for(var s,a=t[Symbol.iterator]();!(n=(s=a.next()).done)&&(i.push(s.value),!e||i.length!==e);n=!0);}catch(t){o=!0,r=t}finally{try{!n&&a.return&&a.return()}finally{if(o)throw r}}return i}(t,e);throw new TypeError("Invalid attempt to destructure non-iterable instance")},_createClass=function(){function n(t,e){for(var i=0;i<e.length;i++){var n=e[i];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,n.key,n)}}return function(t,e,i){return e&&n(t.prototype,e),i&&n(t,i),t}}(),_typeof="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t};function _toConsumableArray(t){if(Array.isArray(t)){for(var e=0,i=Array(t.length);e<t.length;e++)i[e]=t[e];return i}return Array.from(t)}function _possibleConstructorReturn(t,e){if(!t)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!e||"object"!=typeof e&&"function"!=typeof e?t:e}function _inherits(t,e){if("function"!=typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function, not "+typeof e);t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,enumerable:!1,writable:!0,configurable:!0}}),e&&(Object.setPrototypeOf?Object.setPrototypeOf(t,e):t.__proto__=e)}function _classCallCheck(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}!function(t,e){"object"===("undefined"==typeof module?"undefined":_typeof(module))&&"object"===_typeof(module.exports)?module.exports=e(t,require("fabric").fabric):e(t,t.fabric,!0)}("undefined"!=typeof window?window:void 0,function(e,t,i){if(!t)throw new Error("fabric required. please install it by npm or load it by script tag");var w=t.Canvas,o=t.Circle,l=t.Path;function n(){return Array.from({length:8},function(){return Math.floor(65536*(1+Math.random())).toString(16).substr(1)}).join("")}function c(e,i){Object.keys(i).forEach(function(t){e.style[t]=i[t]})}t.Object.prototype.originX=t.Object.prototype.originY="center";var r=function(){function t(){_classCallCheck(this,t),this._events={}}return _createClass(t,[{key:"on",value:function(t,e){if("function"!=typeof e)throw new Error("method (on) only takes instances of Function");return this._events[t]?this._events[t]=[this._events[t],e]:this._events[t]=e,this}},{key:"off",value:function(t,e){if(!this._events[t])return this;e||delete this._events[t];var i=this._events[t];if(Array.isArray(i)){var n=i.indexOf(e);if(n<0)return this;i.splice(n,1),0===i.length&&delete this._events[t]}else i===e&&delete this._events[t];return this}},{key:"emit",value:function(t){for(var e=this,i=arguments.length,n=Array(1<i?i-1:0),o=1;o<i;o++)n[o-1]=arguments[o];var r=this._events[t];return!!r&&("function"==typeof r?(r.call.apply(r,[this].concat(n)),!0):!!Array.isArray(r)&&(r.forEach(function(t){t.call.apply(t,[e].concat(n))}),!0))}},{key:"removeAllListeners",value:function(){return this._events={},this}}]),t}(),s=function(t){function k(t){var e=1<arguments.length&&void 0!==arguments[1]?arguments[1]:{},i=e.strokeWidth,n=void 0===i?1:i,o=e.lineStroke,r=void 0===o?"#000":o,s=e.arrowRadius,a=void 0===s?6:s,h=e.editable,l=void 0!==h&&h,c=e.formatter,u=void 0===c?function(){return""}:c,d=e.hasShadow,f=void 0!==d&&d,v=e.pathOpacity,p=void 0===v?1:v,y=e.alwaysShowTip,b=void 0!==y&&y,g=arguments[2];_classCallCheck(this,k);var m=_possibleConstructorReturn(this,(k.__proto__||Object.getPrototypeOf(k)).call(this));return m.config={strokeWidth:n,lineStroke:r,arrowRadius:a,editable:l,formatter:u,hasShadow:f,pathOpacity:p,alwaysShowTip:b},m.canvas=new w(t,{selection:!1}),m.lineMap={},m.currentLineId=null,m.pathShadow={color:"#fff",blur:5,offsetX:.5,offsetY:.5},m.newEmptyLine(),m.initListeners(),g&&m.load(g),m}return _inherits(k,r),_createClass(k,[{key:"dispose",value:function(){this.canvas.dispose(),this.config.editable&&e.removeEventListener("keydown",this.onKeydown)}},{key:"insertTooltip",value:function(){var e=this;this.dataSource&&(this.removeTooltipEl(),this.config.alwaysShowTip?this.dataSource.forEach(function(t){return e.insertPathTip(t)}):this.tooltip=this.createTipEl())}},{key:"removeTooltipEl",value:function(){var t=this.canvas.wrapperEl.getElementsByClassName("tooltip");[].concat(_toConsumableArray(t)).forEach(function(t){return t.remove()})}},{key:"insertPathTip",value:function(t){if(0!==t.strokeWidth){t.tooltip=this.createTipEl(),t.tooltip.innerHTML=this.config.formatter(t);var e=this.convert([t.dots[0],t.dots[t.dots.length-1]]),i=_slicedToArray(e,2),n=_slicedToArray(i[0],2),o=n[0],r=n[1],s=_slicedToArray(i[1],2),a=s[0],h=s[1];c(t.tooltip,{visibility:"visible",left:(o+a)/2+"px",top:(r+h)/2+"px"})}}},{key:"createTipEl",value:function(){var t=this.canvas.wrapperEl,e=document.createElement("div");return e.className="tooltip",t.appendChild(e),e}},{key:"resize",value:function(){var t=0<arguments.length&&void 0!==arguments[0]?arguments[0]:{},e=t.width,i=t.height;void 0!==e&&void 0!==i&&(this.canvas.setDimensions({width:e,height:i}),this.reload())}},{key:"convert",value:function(t){var e=this.canvas,i=e.width,n=e.height;return t.map(function(t){return[t[0]*i,t[1]*n]})}},{key:"load",value:function(t){var o=this;t&&t.length&&("string"==typeof t&&(t=JSON.parse(t)),this.dataSource=t,this.lineMap={},t.forEach(function(n){var t=void 0!==n.id?String(n.id):void 0;o.newEmptyLine(t),o.convert(n.dots).forEach(function(t){var e=o.getCurrentLine(),i=o.makeDot(t[0],t[1]);e.dots.push(i),o.renderLines(n)})}),!this.config.editable&&this.insertTooltip())}},{key:"setConfig",value:function(t){this.config=Object.assign({},this.config,t),this.reload()}},{key:"reload",value:function(){var t=0<arguments.length&&void 0!==arguments[0]?arguments[0]:this.dataSource;this.canvas.clear(),this.load(t)}},{key:"newEmptyLine",value:function(t){var e=Object.values(this.lineMap).find(function(t){return 0===t.dots.length});if(e)this.currentLineId=e.id;else{var i=t||n();this.lineMap[i]={dots:[],id:i,path:null,idx:Object.keys(this.lineMap).length},this.currentLineId=i}}},{key:"getLinesInfo",value:function(){var e=this;return Object.values(this.lineMap).sort(function(t,e){return t.idx-e.idx}).map(function(t){return t.path?{id:t.id,selected:t.path.selected,strokeWidth:t.path.strokeWidth,stroke:t.path.stroke,dots:t.dots.map(function(t){return[t.left/e.canvas.width,t.top/e.canvas.height]})}:{}})}},{key:"getCurrentLine",value:function(){return this.lineMap[this.currentLineId]}},{key:"configCurrentPath",value:function(t){var e=this.getCurrentLine().path;e&&(e.set(t),this.renderLines())}},{key:"initListeners",value:function(){this.onObjectMoving=this.onObjectMoving.bind(this),this.onMouseDown=this.onMouseDown.bind(this),this.onMouseOver=this.onMouseOver.bind(this),this.onMouseOut=this.onMouseOut.bind(this),this.onMouseMove=this.onMouseMove.bind(this),this.onKeydown=this.onKeydown.bind(this);var t=this.config.editable?{"object:moving":this.onObjectMoving,"mouse:down":this.onMouseDown}:{"mouse:over":this.onMouseOver,"mouse:out":this.onMouseOut,"mouse:move":this.onMouseMove};this.canvas.on(t),this.config.editable&&e.addEventListener("keydown",this.onKeydown)}},{key:"showToolTip",value:function(){this.tooltip.style.visibility="visible"}},{key:"hideToolTip",value:function(){this.tooltip.style.visibility="hidden"}},{key:"isToolTipHidden",value:function(){return"hidden"===this.tooltip.style.visibility}},{key:"onKeydown",value:function(t){"Delete"===t.code?this.delCurrentLine():"KeyZ"===t.code&&t.ctrlKey&&this.delSelectedDot()}},{key:"onMouseMove",value:function(t){this.config.editable||this.tooltip&&!this.isToolTipHidden()&&c(this.tooltip,{left:t.pointer.x+"px",top:t.pointer.y+"px"})}},{key:"onMouseOver",value:function(t){if(!this.config.editable){var e=t.target;!this.config.alwaysShowTip&&e&&"path"===e.name&&(this.showToolTip(),this.tooltip.innerHTML=this.config.formatter(e._data))}}},{key:"onMouseOut",value:function(t){if(!this.config.editable){var e=t.target;!this.config.alwaysShowTip&&e&&"path"===e.name&&this.hideToolTip()}}},{key:"onObjectMoving",value:function(t){this.config.editable&&"dot"===t.target.name&&this.renderLines()}},{key:"onMouseDown",value:function(t){if(this.config.editable){t.e.ctrlKey&&this.newEmptyLine();var e=t.target;if(!e){var i=this.getCurrentLine(),n=this.makeDot(t.pointer.x,t.pointer.y);i.dots.push(n),this.renderLines(),this.selectDot(n),this.selectCurrentPath()}e&&"dot"===e.name&&(this.currentLineId=e.parentLine.id,this.selectDot(e),this.selectCurrentPath())}}},{key:"selectLine",value:function(t){this.lineMap[t]&&(this.currentLineId=t,this.selectDot(this.getCurrentLine().dots[0]),this.selectCurrentPath(),this.renderLines())}},{key:"selectDot",value:function(t){this.lastSelectedDot&&this.lastSelectedDot.set({fill:"transparent",stroke:"#ddd",radius:5,selected:!1}),(this.lastSelectedDot=t).set({fill:"#fff0f0",stroke:"#0000ff",radius:8,selected:!0}),this.emit("focus.dot",t)}},{key:"selectCurrentPath",value:function(){var t=this.getCurrentLine().path;this.lastSelectedPath&&this.lastSelectedPath.set({shadow:null,selected:!1}),(this.lastSelectedPath=t).set({shadow:this.pathShadow,selected:!0}),this.emit("focus.path",t)}},{key:"delSelectedDot",value:function(){if(this.config.editable){var t=this.getCurrentLine();if(this.lastSelectedDot){var e=t.dots.indexOf(this.lastSelectedDot),i=t.dots.splice(e,1),n=_slicedToArray(i,1)[0];this.canvas.remove(n),this.renderLines(),this.emit("del.dot",n)}}}},{key:"delCurrentLine",value:function(){var e=this;if(this.config.editable){var t=this.getCurrentLine();if(t.path&&t.path.selected){t.dots.forEach(function(t){return e.canvas.remove(t)}),this.canvas.remove(t.path),delete this.lineMap[t.id],this.emit("del.line",t);var i=Object.keys(this.lineMap);i.length?this.currentLineId=i[0]:this.newEmptyLine()}}}},{key:"delLine",value:function(t){var e=this,i=this.lineMap[t];if(this.config.editable&&i&&i.path){i.dots.forEach(function(t){return e.canvas.remove(t)}),this.canvas.remove(i.path),delete this.lineMap[t],this.emit("del.line",i);var n=Object.keys(this.lineMap);n.length?this.currentLineId=n[0]:this.newEmptyLine()}}},{key:"getLineStroke",value:function(){var t=this.config.lineStroke;if(Array.isArray(t)){var e=t.length;return t[(Object.keys(this.lineMap).length-1)%e]||"#fff"}return t}},{key:"renderLines",value:function(){var t=0<arguments.length&&void 0!==arguments[0]?arguments[0]:{};if(0!==t.strokeWidth){var e=t.stroke||this.getLineStroke(),i=t.strokeWidth||this.config.strokeWidth,n=this.config.editable,o={stroke:e,strokeWidth:i,opacity:this.config.pathOpacity,hoverCursor:n?"move":"pointer",fill:"",originX:"left",originY:"top",selectable:!1,evented:!n},r=this.getCurrentLine();!n&&this.config.hasShadow&&(o.shadow=this.pathShadow);var s=r.dots.map(function(t){return[t.left,t.top]}),a=this.makeSvgCurvePath.apply(this,_toConsumableArray(s));r.path&&(Object.assign(o,{stroke:r.path.stroke,shadow:r.path.shadow,strokeWidth:r.path.strokeWidth}),this.canvas.remove(r.path));var h=new l(a,o);h.name="path",h._data=t,r.path&&(this.lastSelectedPath=h),r.path=h,this.canvas.add(h)}}},{key:"makeDot",value:function(t,e){var i=this.getCurrentLine(),n=new o({left:t,top:e,strokeWidth:3,radius:5,fill:"transparent",stroke:this.config.editable?"#ddd":"transparent",evented:this.config.editable,shadow:{color:"#000",blur:2,offsetX:1,offsetY:1}});return n.hasControls=n.hasBorders=!1,n.name="dot",n.parentLine=i,this.canvas.add(n),this.emit("add.dot",n),n}},{key:"getCanvasInfo",value:function(){return this.canvas.toJSON()}},{key:"makeSvgCurvePath",value:function(){for(var t=arguments.length,e=Array(t),i=0;i<t;i++)e[i]=arguments[i];var n=e.length;if(n<2)return"";var o=e[n-1],r=e[n-2],s=Math.PI/6,a=this.config.arrowRadius,h=r[1]-o[1],l=o[0]-r[0],c=Math.atan(h/l),u=l<0?-1:1,d=o[0]-Math.cos(c+s)*a*u,f=o[1]+Math.sin(c+s)*a*u,v=o[0]-Math.cos(c-s)*a*u,p=o[1]+Math.sin(c-s)*a*u,y=[["M",d,f],["L"].concat(_toConsumableArray(o)),["L",v,p],["L",d,f],["L"].concat(_toConsumableArray(o))];if(2===n)return[["M"].concat(_toConsumableArray(e[0])),["L"].concat(_toConsumableArray(e[1]))].concat(y);for(var b=[["M"].concat(_toConsumableArray(e[0]))],g=1;g<n-1;g++){var m=(e[g][0]+e[g+1][0])/2,k=(e[g][1]+e[g+1][1])/2;b.push(["Q"].concat(_toConsumableArray(e[g]),[m,k]))}return b.push.apply(b,[["T"].concat(_toConsumableArray(o))].concat(y)),b}}]),k}();return s.uuid=n,i&&(e.LineDrawer=s),s});
