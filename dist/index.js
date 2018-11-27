"use strict";var _slicedToArray=function(t,e){if(Array.isArray(t))return t;if(Symbol.iterator in Object(t))return function(t,e){var i=[],n=!0,o=!1,r=void 0;try{for(var a,s=t[Symbol.iterator]();!(n=(a=s.next()).done)&&(i.push(a.value),!e||i.length!==e);n=!0);}catch(t){o=!0,r=t}finally{try{!n&&s.return&&s.return()}finally{if(o)throw r}}return i}(t,e);throw new TypeError("Invalid attempt to destructure non-iterable instance")},_extends=Object.assign||function(t){for(var e=1;e<arguments.length;e++){var i=arguments[e];for(var n in i)Object.prototype.hasOwnProperty.call(i,n)&&(t[n]=i[n])}return t},_createClass=function(){function n(t,e){for(var i=0;i<e.length;i++){var n=e[i];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,n.key,n)}}return function(t,e,i){return e&&n(t.prototype,e),i&&n(t,i),t}}(),_typeof="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t};function _toConsumableArray(t){if(Array.isArray(t)){for(var e=0,i=Array(t.length);e<t.length;e++)i[e]=t[e];return i}return Array.from(t)}function _classCallCheck(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}!function(t,e){"object"===("undefined"==typeof module?"undefined":_typeof(module))&&"object"===_typeof(module.exports)?module.exports=e(t,require("fabric").fabric):e(t,t.fabric,!0)}("undefined"!=typeof window?window:void 0,function(e,t,i){var g=t.Canvas,o=t.Circle,l=t.Path;t.Object.prototype.originX=t.Object.prototype.originY="center";var n=function(){function b(t){var e=1<arguments.length&&void 0!==arguments[1]?arguments[1]:{},i=e.strokeWidth,n=void 0===i?1:i,o=e.lineStroke,r=void 0===o?"#000":o,a=e.arrowRadius,s=void 0===a?6:a,h=e.editable,l=void 0!==h&&h,u=e.formatter,c=void 0===u?function(){return""}:u,d=e.hasShadow,f=void 0!==d&&d,v=e.pathOpacity,p=void 0===v?1:v,y=arguments[2];_classCallCheck(this,b),this.config={strokeWidth:n,lineStroke:r,arrowRadius:s,editable:l,formatter:c,hasShadow:f,pathOpacity:p},this.canvas=new g(t,{selection:!1}),this.lineMap={},this.currentLineId=null,this.pathShadow={color:"#fff",blur:5,offsetX:.5,offsetY:.5},this.newEmptyLine(),this.initListeners(),y&&this.load(y),!l&&this.insertTooltip()}return _createClass(b,[{key:"dispose",value:function(){this.canvas.dispose()}},{key:"insertTooltip",value:function(){this.tooltip=document.createElement("div"),this.tooltip.className="tooltip",this.canvas.wrapperEl.appendChild(this.tooltip)}},{key:"resize",value:function(){var t=0<arguments.length&&void 0!==arguments[0]?arguments[0]:{},e=t.width,i=t.height;void 0!==e&&void 0!==i&&(this.canvas.setDimensions({width:e,height:i}),this.reload())}},{key:"convert",value:function(t){var e=this.canvas,i=e.width,n=e.height;return t.map(function(t){return[t[0]*i,t[1]*n]})}},{key:"load",value:function(t){var o=this;t&&("string"==typeof t&&(t=JSON.parse(t)),this.dataSource=t,this.lineMap={},t.forEach(function(n){o.newEmptyLine(),o.convert(n.dots).forEach(function(t){var e=o.getCurrentLine(),i=o.makeDot.apply(o,_toConsumableArray(t));e.dots.push(i),o.renderLines(n)})}))}},{key:"setConfig",value:function(t){this.config=_extends({},this.config,t),this.reload()}},{key:"reload",value:function(){var t=0<arguments.length&&void 0!==arguments[0]?arguments[0]:this.dataSource;this.canvas.clear(),this.load(t)}},{key:"newEmptyLine",value:function(){var t=Object.values(this.lineMap).find(function(t){return 0===t.dots.length});if(t)this.currentLineId=t.id;else{var e=Array.from({length:8},function(){return Math.floor(65536*(1+Math.random())).toString(16).substr(1)}).join("");this.lineMap[e]={dots:[],id:e,path:null},this.currentLineId=e}}},{key:"savePaths",value:function(){var e=this;return Object.values(this.lineMap).map(function(t){return{strokeWidth:t.path.strokeWidth,stroke:t.path.stroke,dots:t.dots.map(function(t){return[t.left/e.canvas.width,t.top/e.canvas.height]})}})}},{key:"getCurrentLine",value:function(){return this.lineMap[this.currentLineId]}},{key:"configCurrentPath",value:function(t){this.getCurrentLine().path.set(t),this.renderLines()}},{key:"initListeners",value:function(){this.onObjectMoving=this.onObjectMoving.bind(this),this.onMouseDown=this.onMouseDown.bind(this),this.onMouseOver=this.onMouseOver.bind(this),this.onMouseOut=this.onMouseOut.bind(this),this.onMouseMove=this.onMouseMove.bind(this),this.onKeydown=this.onKeydown.bind(this);var t=this.config.editable?{"object:moving":this.onObjectMoving,"mouse:down":this.onMouseDown}:{"mouse:over":this.onMouseOver,"mouse:out":this.onMouseOut,"mouse:move":this.onMouseMove};this.canvas.on(t),this.config.editable&&e.addEventListener("keydown",this.onKeydown)}},{key:"showToolTip",value:function(){this.tooltip.style.visibility="visible"}},{key:"hideToolTip",value:function(){this.tooltip.style.visibility="hidden"}},{key:"isToolTipHidden",value:function(){return"hidden"===this.tooltip.style.visibility}},{key:"onKeydown",value:function(t){"Delete"===t.code?this.delCurrentLine():"KeyZ"===t.code&&t.ctrlKey&&this.delSelectedDot()}},{key:"onMouseMove",value:function(t){this.config.editable||this.isToolTipHidden()||(this.tooltip.style.left=t.pointer.x+"px",this.tooltip.style.top=t.pointer.y+"px")}},{key:"onMouseOver",value:function(t){if(!this.config.editable){var e=t.target;e&&"path"===e.name&&(this.showToolTip(),this.tooltip.innerHTML=this.config.formatter(e._data))}}},{key:"onMouseOut",value:function(t){if(!this.config.editable){var e=t.target;e&&"path"===e.name&&this.hideToolTip()}}},{key:"onObjectMoving",value:function(t){this.config.editable&&"dot"===t.target.name&&this.renderLines()}},{key:"onMouseDown",value:function(t){if(this.config.editable){t.e.ctrlKey&&this.newEmptyLine();var e=t.target;if(!e){var i=this.getCurrentLine(),n=this.makeDot(t.pointer.x,t.pointer.y);i.dots.push(n),this.renderLines(),this.selectDot(n),this.selectCurrentPath()}e&&"dot"===e.name&&(this.currentLineId=e.parentLine.id,this.selectDot(e),this.selectCurrentPath())}}},{key:"selectDot",value:function(t){this.lastSelectedDot&&this.lastSelectedDot.set({fill:"transparent",stroke:"#ddd",radius:5,selected:!1}),(this.lastSelectedDot=t).set({fill:"#fff0f0",stroke:"#0000ff",radius:8,selected:!0})}},{key:"selectCurrentPath",value:function(){var t=this.getCurrentLine().path;this.lastSelectedPath&&this.lastSelectedPath.set({shadow:null,selected:!1}),(this.lastSelectedPath=t).set({shadow:this.pathShadow,selected:!0})}},{key:"delSelectedDot",value:function(){if(this.config.editable){var t=this.getCurrentLine();if(this.lastSelectedDot){var e=t.dots.indexOf(this.lastSelectedDot),i=t.dots.splice(e,1),n=_slicedToArray(i,1)[0];this.canvas.remove(n),this.renderLines()}}}},{key:"delCurrentLine",value:function(){var e=this;if(this.config.editable){var t=this.getCurrentLine();if(t.path.selected){t.dots.forEach(function(t){return e.canvas.remove(t)}),this.canvas.remove(t.path),delete this.lineMap[t.id];var i=Object.keys(this.lineMap);i.length?this.currentLineId=i[0]:this.newEmptyLine()}}}},{key:"renderLines",value:function(){var t=0<arguments.length&&void 0!==arguments[0]?arguments[0]:{};if(0!==t.strokeWidth){var e=t.stroke||this.config.lineStroke,i=t.strokeWidth||this.config.strokeWidth,n=this.config.editable,o={stroke:e,strokeWidth:i,opacity:this.config.pathOpacity,hoverCursor:n?"move":"pointer",fill:"",originX:"left",originY:"top",selectable:!1,evented:!n},r=this.getCurrentLine();!n&&this.config.hasShadow&&(o.shadow=this.pathShadow);var a=r.dots.map(function(t){return[t.left,t.top]}),s=this.makeSvgCurvePath.apply(this,_toConsumableArray(a));r.path&&(Object.assign(o,{stroke:r.path.stroke,shadow:r.path.shadow,strokeWidth:r.path.strokeWidth}),this.canvas.remove(r.path));var h=new l(s,o);h.name="path",h._data=t,r.path&&(this.lastSelectedPath=h),r.path=h,this.canvas.add(h)}}},{key:"makeDot",value:function(t,e){var i=this.getCurrentLine(),n=new o({left:t,top:e,strokeWidth:3,radius:5,fill:"transparent",stroke:this.config.editable?"#ddd":"transparent",evented:this.config.editable,shadow:{color:"#000",blur:2,offsetX:1,offsetY:1}});return n.hasControls=n.hasBorders=!1,n.name="dot",n.parentLine=i,this.canvas.add(n),n}},{key:"getCanvasInfo",value:function(){return this.canvas.toJSON()}},{key:"makeSvgCurvePath",value:function(){for(var t=arguments.length,e=Array(t),i=0;i<t;i++)e[i]=arguments[i];var n=e.length;if(n<2)return"";var o=e[n-1],r=e[n-2],a=Math.PI/6,s=this.config.arrowRadius,h=r[1]-o[1],l=o[0]-r[0],u=Math.atan(h/l),c=l<0?-1:1,d=o[0]-Math.cos(u+a)*s*c,f=o[1]+Math.sin(u+a)*s*c,v=o[0]-Math.cos(u-a)*s*c,p=o[1]+Math.sin(u-a)*s*c,y=[["M",d,f],["L"].concat(_toConsumableArray(o)),["L",v,p],["L",d,f],["L"].concat(_toConsumableArray(o))];if(2===n)return[["M"].concat(_toConsumableArray(e[0])),["L"].concat(_toConsumableArray(e[1]))].concat(y);for(var b=[["M"].concat(_toConsumableArray(e[0]))],g=1;g<n-1;g++){var m=(e[g][0]+e[g+1][0])/2,k=(e[g][1]+e[g+1][1])/2;b.push(["Q"].concat(_toConsumableArray(e[g]),[m,k]))}return b.push.apply(b,[["T"].concat(_toConsumableArray(o))].concat(y)),b}}]),b}();return i&&(e.LineDrawer=n),n});