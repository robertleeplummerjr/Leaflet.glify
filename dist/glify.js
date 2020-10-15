parcelRequire=function(e,r,t,n){var i,o="function"==typeof parcelRequire&&parcelRequire,u="function"==typeof require&&require;function f(t,n){if(!r[t]){if(!e[t]){var i="function"==typeof parcelRequire&&parcelRequire;if(!n&&i)return i(t,!0);if(o)return o(t,!0);if(u&&"string"==typeof t)return u(t);var c=new Error("Cannot find module '"+t+"'");throw c.code="MODULE_NOT_FOUND",c}p.resolve=function(r){return e[t][1][r]||r},p.cache={};var l=r[t]=new f.Module(t);e[t][0].call(l.exports,p,l,l.exports,this)}return r[t].exports;function p(e){return f(p.resolve(e))}}f.isParcelRequire=!0,f.Module=function(e){this.id=e,this.bundle=f,this.exports={}},f.modules=e,f.cache=r,f.parent=o,f.register=function(r,t){e[r]=[function(e,r){r.exports=t},{}]};for(var c=0;c<t.length;c++)try{f(t[c])}catch(e){i||(i=e)}if(t.length){var l=f(t[t.length-1]);"object"==typeof exports&&"undefined"!=typeof module?module.exports=l:"function"==typeof define&&define.amd?define(function(){return l}):n&&(this[n]=l)}if(parcelRequire=f,i)throw i;return f}({"eMRn":[function(require,module,exports) {
"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.MapMatrix=void 0;var t=function(){function t(){this.array=new Float32Array(16)}return t.prototype.set=function(t,r){return this.array.set(t,r),this},t.prototype.translateMatrix=function(t,r){var a=this.array;return a[12]+=a[0]*t+a[4]*r,a[13]+=a[1]*t+a[5]*r,a[14]+=a[2]*t+a[6]*r,a[15]+=a[3]*t+a[7]*r,this},t.prototype.scaleMatrix=function(t){var r=this.array;return r[0]*=t,r[1]*=t,r[2]*=t,r[3]*=t,r[4]*=t,r[5]*=t,r[6]*=t,r[7]*=t,this},t}();exports.MapMatrix=t;
},{}],"IxA4":[function(require,module,exports) {
"use strict";var e=r(require("leaflet"));function t(){if("function"!=typeof WeakMap)return null;var e=new WeakMap;return t=function(){return e},e}function r(e){if(e&&e.__esModule)return e;if(null===e||"object"!=typeof e&&"function"!=typeof e)return{default:e};var r=t();if(r&&r.has(e))return r.get(e);var n={},o=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var u in e)if(Object.prototype.hasOwnProperty.call(e,u)){var i=o?Object.getOwnPropertyDescriptor(e,u):null;i&&(i.get||i.set)?Object.defineProperty(n,u,i):n[u]=e[u]}return n.default=e,r&&r.set(e,n),n}let n=e;window&&window.L&&(n=window.L),module.exports=n;
},{}],"OTlA":[function(require,module,exports) {
"use strict";var t=this&&this.__extends||function(){var t=function(e,o){return(t=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var o in e)e.hasOwnProperty(o)&&(t[o]=e[o])})(e,o)};return function(e,o){function n(){this.constructor=e}t(e,o),e.prototype=null===o?Object.create(o):(n.prototype=o.prototype,new n)}}();Object.defineProperty(exports,"__esModule",{value:!0}),exports.CanvasOverlay=void 0;var e=require("./leaflet-bindings"),o=function(o){function n(t,e){var n=o.call(this)||this;return n._userDrawFunc=t,n._frame=null,n._redrawCallbacks=[],n._pane=e,n}return t(n,o),n.prototype.drawing=function(t){return this._userDrawFunc=t,this},n.prototype.params=function(t){return e.Util.setOptions(this,t),this},n.prototype.redraw=function(t){return"function"==typeof t&&this._redrawCallbacks.push(t),null===this._frame&&(this._frame=e.Util.requestAnimFrame(this._redraw,this)),this},n.prototype.onAdd=function(t){this._map=t,this.canvas=this.canvas||document.createElement("canvas");var o=t.getSize(),n=t.options.zoomAnimation&&e.Browser.any3d;return this.canvas.width=o.x,this.canvas.height=o.y,this.canvas.className="leaflet-zoom-"+(n?"animated":"hide"),t._panes[this._pane].appendChild(this.canvas),t.on("moveend",this._reset,this),t.on("resize",this._resize,this),n&&t.on("zoomanim",e.Layer?this._animateZoom:this._animateZoomNoLayer,this),this._reset(),this},n.prototype.onRemove=function(t){return t.getPanes()[this._pane].removeChild(this.canvas),t.off("moveend",this._reset,this),t.off("resize",this._resize,this),t.options.zoomAnimation&&e.Browser.any3d&&t.off("zoomanim",e.Layer?this._animateZoom:this._animateZoomNoLayer,this),this},n.prototype.addTo=function(t){return t.addLayer(this),this},n.prototype._resize=function(t){this.canvas.width=t.newSize.x,this.canvas.height=t.newSize.y},n.prototype._reset=function(){var t=this._map.containerPointToLayerPoint([0,0]);e.DomUtil.setPosition(this.canvas,t),this._redraw()},n.prototype._redraw=function(){var t=this._map,o=this.canvas,n=t.getSize(),a=t.getBounds(),s=180*n.x/(20037508.34*(a.getEast()-a.getWest())),r=t.getZoom(),i=new e.LatLng(a.getNorth(),a.getWest()),h=this._unclampedProject(i,0);for(this._userDrawFunc&&this._userDrawFunc({bounds:a,canvas:o,offset:h,scale:Math.pow(2,r),size:n,zoomScale:s,zoom:r});this._redrawCallbacks.length>0;)this._redrawCallbacks.shift()(this);this._frame=null},n.prototype._animateZoom=function(t){var o=this._map,n=o.getZoomScale(t.zoom,o.getZoom()),a=this._unclampedLatLngBoundsToNewLayerBounds(o.getBounds(),t.zoom,t.center).min;e.DomUtil.setTransform(this.canvas,a,n)},n.prototype._animateZoomNoLayer=function(t){var o=this._map,n=o.getZoomScale(t.zoom,o.getZoom()),a=o._getCenterOffset(t.center)._multiplyBy(-n).subtract(o._getMapPanePos());e.DomUtil.setTransform(this.canvas,a,n)},n.prototype._unclampedProject=function(t,o){var n=this._map.options.crs,a=n.projection.R,s=Math.PI/180,r=t.lat,i=Math.sin(r*s),h=new e.Point(a*t.lng*s,a*Math.log((1+i)/(1-i))/2),c=n.scale(o);return n.transformation._transform(h,c)},n.prototype._unclampedLatLngBoundsToNewLayerBounds=function(t,o,n){var a=this._map._getNewPixelOrigin(n,o);return new e.Bounds([this._unclampedProject(t.getSouthWest(),o).subtract(a),this._unclampedProject(t.getNorthWest(),o).subtract(a),this._unclampedProject(t.getSouthEast(),o).subtract(a),this._unclampedProject(t.getNorthEast(),o).subtract(a)])},n}(e.Layer);exports.CanvasOverlay=o;
},{"./leaflet-bindings":"IxA4"}],"pR9a":[function(require,module,exports) {
"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.Base=void 0;var e=require("./map-matrix"),t=require("./canvas-overlay"),r=function(){function r(r){var a=this;r.pane||(r.pane="overlayPane"),this.pixelsToWebGLMatrix=new Float32Array(16),this.mapMatrix=new e.MapMatrix,this.active=!0,this.vertexShader=null,this.fragmentShader=null,this.program=null,this.matrix=null,this.vertices=null,this.vertsLines=null;var i=Boolean(r.preserveDrawingBuffer),s=this.layer=new t.CanvasOverlay(function(e){return a.drawOnCanvas(e)},r.pane).addTo(r.map),n=this.canvas=s.canvas;n.width=n.clientWidth,n.height=n.clientHeight,n.style.position="absolute",r.className&&(n.className+=" "+r.className),this.gl=n.getContext("webgl2",{preserveDrawingBuffer:i})||n.getContext("webgl",{preserveDrawingBuffer:i})||n.getContext("experimental-webgl",{preserveDrawingBuffer:i})}return r.prototype.attachShaderVariables=function(e){if(!this.settings.shaderVariables)return this;var t=this.gl,r=this.program,a=this.settings.shaderVariables;for(var i in a)if(a.hasOwnProperty(i)){var s=a[i],n=t.getAttribLocation(r,i);if(n<0)throw new Error("shader variable "+i+" not found");t.vertexAttribPointer(n,s.size,t[s.type],!!s.normalize,e*(s.bytes||5),e*s.start),t.enableVertexAttribArray(n)}return this},r.prototype.setData=function(e){return this.settings.data=e,this},r.prototype.setup=function(){var e=this.settings;return e.click&&e.setupClick(e.map),e.hover&&e.setupHover(e.map,e.hoverWait),this.setupVertexShader().setupFragmentShader().setupProgram()},r.prototype.setupVertexShader=function(){var e=this.gl,t=this.settings,r="function"==typeof t.vertexShaderSource?t.vertexShaderSource():t.vertexShaderSource,a=e.createShader(e.VERTEX_SHADER);return e.shaderSource(a,r),e.compileShader(a),this.vertexShader=a,this},r.prototype.setupFragmentShader=function(){var e=this.gl,t=this.settings,r="function"==typeof t.fragmentShaderSource?t.fragmentShaderSource():t.fragmentShaderSource,a=e.createShader(e.FRAGMENT_SHADER);return e.shaderSource(a,r),e.compileShader(a),this.fragmentShader=a,this},r.prototype.setupProgram=function(){var e=this.gl,t=e.createProgram();return e.attachShader(t,this.vertexShader),e.attachShader(t,this.fragmentShader),e.linkProgram(t),e.useProgram(t),e.blendFunc(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA),e.enable(e.BLEND),this.program=t,this},r.prototype.addTo=function(e){return this.layer.addTo(e||this.settings.map),this.active=!0,this.render()},r.prototype.remove=function(){return this.settings.map.removeLayer(this.layer),this.active=!1,this},r}();exports.Base=r;
},{"./map-matrix":"eMRn","./canvas-overlay":"OTlA"}],"lpyx":[function(require,module,exports) {
"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.Color=void 0;var r={r:0,g:1,b:0},e={r:1,g:0,b:0},t={r:0,g:0,b:1},n={r:0,g:1,b:1},o={r:1,g:1,b:0},a={r:1,g:1,b:1},u={r:0,g:0,b:0},s={r:.5,g:.5,b:.5},c=function(){function a(){}return Object.defineProperty(a,"grey",{get:function(){return s},enumerable:!1,configurable:!0}),a.fromHex=function(r){return r.length<6?null:("#"===(r=r.toLowerCase())[0]&&(r=r.substring(1,r.length)),{r:parseInt(r[0]+r[1],16)/255,g:parseInt(r[2]+r[3],16)/255,b:parseInt(r[4]+r[5],16)/255})},a.random=function(){return{r:Math.random(),g:Math.random(),b:Math.random()}},a.pallet=function(){switch(Math.round(4*Math.random())){case 0:return r;case 1:return e;case 2:return t;case 3:return n;case 4:return o}},a}();exports.Color=c;
},{}],"GtdH":[function(require,module,exports) {
"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.LineFeatureVertices=void 0;var t=require("./leaflet-bindings"),e=function(){function e(t){Object.assign(this,t),this.vertexCount=0,this.array=[],this.length=0}return e.prototype.fillFromCoordinates=function(e){for(var r=this.color,i=0;i<e.length;i++)if(Array.isArray(e[i][0]))this.fillFromCoordinates(e[i]);else{var s=this.project(new t.LatLng(e[i][this.latitudeKey],e[i][this.longitudeKey]),0);this.push(s.x,s.y,r.r,r.g,r.b),0!==i&&i!==e.length-1&&(this.vertexCount+=1),this.vertexCount+=1}},e.prototype.push=function(){for(var t,e=[],r=0;r<arguments.length;r++)e[r]=arguments[r];(t=this.array).push.apply(t,e),this.length=this.array.length},e}();exports.LineFeatureVertices=e;
},{"./leaflet-bindings":"IxA4"}],"UnXq":[function(require,module,exports) {
"use strict";function t(t,o){var e={};for(var n in o)o.hasOwnProperty(n)&&(e[n]=t.hasOwnProperty(n)?t[n]:o[n]);return e}function o(t,o){var e=Math.PI/180,n=4*Math.PI,r=Math.sin(t*e);return{x:(o+180)/360*256,y:256*(.5-Math.log((1+r)/(1-r))/n)}}function e(t,o,e){return(t.x-o.x)*(t.x-o.x)+(t.y-o.y)*(t.y-o.y)<=e*e}function n(t,o,e,n,r,a){var s,i,u=r-e,p=a-n,l=u*u+p*p,x=-1;0!==l&&(x=((t-e)*u+(o-n)*p)/l),x<0?(s=e,i=n):x>1?(s=r,i=a):(s=e+x*u,i=n+x*p);var c=t-s,d=o-i;return Math.sqrt(c*c+d*d)}function r(t,o){return Math.sqrt(t*t+o*o)}function a(t,o,e){var n=e.latLngToLayerPoint(t),a=e.latLngToLayerPoint(o);return r(n.x-a.x,n.y-a.y)}function s(t){var o=document.createElement("div"),e=o.style,n=t.x,r=t.y;e.left=n+"px",e.top=r+"px",e.width="10px",e.height="10px",e.position="absolute",e.backgroundColor="#"+(16777215*Math.random()<<0).toString(16),document.body.appendChild(o)}function i(t,o,e){var n;return function(){var r=this,a=arguments,s=e&&!n;clearTimeout(n),n=setTimeout(function(){n=null,e||t.apply(r,a)},o),s&&t.apply(r,a)}}function u(t,o){return o._northEast.lat>t.lat&&t.lat>o._southWest.lat&&o._northEast.lng>t.lng&&t.lng>o._southWest.lng}Object.defineProperty(exports,"__esModule",{value:!0}),exports.inBounds=exports.debounce=exports.debugPoint=exports.locationDistance=exports.vectorDistance=exports.pDistance=exports.pointInCircle=exports.latLonToPixel=exports.defaults=void 0,exports.defaults=t,exports.latLonToPixel=o,exports.pointInCircle=e,exports.pDistance=n,exports.vectorDistance=r,exports.locationDistance=a,exports.debugPoint=s,exports.debounce=i,exports.inBounds=u;
},{}],"ogHp":[function(require,module,exports) {
"use strict";var t=this&&this.__extends||function(){var t=function(e,r){return(t=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var r in e)e.hasOwnProperty(r)&&(t[r]=e[r])})(e,r)};return function(e,r){function i(){this.constructor=e}t(e,r),e.prototype=null===r?Object.create(r):(i.prototype=r.prototype,new i)}}(),e=this&&this.__assign||function(){return(e=Object.assign||function(t){for(var e,r=1,i=arguments.length;r<i;r++)for(var a in e=arguments[r])Object.prototype.hasOwnProperty.call(e,a)&&(t[a]=e[a]);return t}).apply(this,arguments)};Object.defineProperty(exports,"__esModule",{value:!0}),exports.Lines=void 0;var r=require("./base"),i=require("./color"),a=require("./leaflet-bindings"),n=require("./line-feature-vertices"),o=require("./utils"),s={map:null,data:[],longitudeKey:null,latitudeKey:null,setupClick:null,setupHover:null,vertexShaderSource:null,fragmentShaderSource:null,click:null,hover:null,color:i.Color.random,className:"",opacity:.5,weight:2,sensitivity:.1,sensitivityHover:.03,shaderVariables:{color:{type:"FLOAT",start:2,size:3}}},l=function(r){function i(t){var a=r.call(this,t)||this;if(i.instances.push(a),a.settings=e(e({},i.defaults),t),!t.data)throw new Error('no "data" array setting defined');if(!t.map)throw new Error('no leaflet "map" object setting defined');return a.active=!0,a.allVertices=[],a.setup().render(),a}return t(i,r),i.prototype.render=function(){this.resetVertices();var t=this.pixelsToWebGLMatrix,e=this.settings,r=this,i=r.canvas,a=r.gl,n=r.layer,o=r.vertices,s=r.program,l=a.createBuffer(),c=a.getAttribLocation(s,"vertex"),u=a.getUniformLocation(s,"opacity");a.uniform1f(u,e.opacity),a.bindBuffer(a.ARRAY_BUFFER,l);for(var f=o.length,h=[],v=0;v<f;v++)for(var g=o[v].array,p=g.length/5,d=0;d<p;d++){var y=5*d;0!==d&&d!==p-1&&h.push(g[y],g[y+1],g[y+2],g[y+3],g[y+4]),h.push(g[y],g[y+1],g[y+2],g[y+3],g[y+4])}this.allVertices=h;var m=new Float32Array(h);return f=m.BYTES_PER_ELEMENT,a.bufferData(a.ARRAY_BUFFER,m,a.STATIC_DRAW),a.vertexAttribPointer(c,2,a.FLOAT,!1,5*f,0),a.enableVertexAttribArray(c),this.matrix=a.getUniformLocation(s,"matrix"),this.aPointSize=a.getAttribLocation(s,"pointSize"),t.set([2/i.width,0,0,0,0,-2/i.height,0,0,0,0,0,0,-1,1,0,1]),a.viewport(0,0,i.width,i.height),a.uniformMatrix4fv(this.matrix,!1,t),this.attachShaderVariables(f),n.redraw(),this},i.prototype.resetVertices=function(){this.allVertices=[],this.vertices=[];var t,e,r,i=this.vertices,a=this.settings,o=a.data.features,s=a.map,l=a.latitudeKey,c=a.longitudeKey,u=o.length,f=a.color,h=0;if(!f)throw new Error("color is not properly defined");for("function"==typeof f&&(e=f);h<u;h++){t=o[h],r=e?e(h,t):f;var v=new n.LineFeatureVertices({project:s.project.bind(s),latitudeKey:l,longitudeKey:c,color:r});v.fillFromCoordinates(t.geometry.coordinates),i.push(v)}return this},i.prototype.drawOnCanvas=function(t){if(!this.gl)return this;var e=this,r=e.gl,i=e.settings,a=e.canvas,n=e.mapMatrix,o=e.matrix,s=e.pixelsToWebGLMatrix,l=e.allVertices,c=e.vertices,u=i.weight,f=t.scale,h=t.offset,v=t.zoom,g=Math.max(v-4,4);if(r.clear(r.COLOR_BUFFER_BIT),r.viewport(0,0,a.width,a.height),s.set([2/a.width,0,0,0,0,-2/a.height,0,0,0,0,0,0,-1,1,0,1]),r.viewport(0,0,a.width,a.height),r.vertexAttrib1f(this.aPointSize,g),v>18)n.set(s).scaleMatrix(f).translateMatrix(-h.x,-h.y),r.uniformMatrix4fv(o,!1,n.array),r.drawArrays(r.LINES,0,l.length/5);else if("number"==typeof u)for(var p=-u;p<u;p+=.5)for(var d=-u;d<u;d+=.5)n.set(s).scaleMatrix(f).translateMatrix(-h.x+d/f,-h.y+p/f),r.uniformMatrix4fv(o,!1,n.array),r.drawArrays(r.LINES,0,l.length/5);else if("function"==typeof u)for(var y=0,m=i.data.features,x=0;x<c.length;x++){var w=c[x].vertexCount,b=u(x,m[x]);for(p=-b;p<b;p+=.5)for(d=-b;d<b;d+=.5)n.set(s).scaleMatrix(f).translateMatrix(-h.x+d/f,-h.y+p/f),r.uniformMatrix4fv(this.matrix,!1,n.array),r.drawArrays(r.LINES,y,w);y+=w}return this},i.tryClick=function(t,e){var r,a,n=!1,s=null;i.instances.forEach(function(i){a=i.settings,r=a.sensitivity,i.active&&a.map===e&&a.click&&a.data.features.map(function(e){for(var a=1;a<e.geometry.coordinates.length;a++){var l=o.pDistance(t.latlng.lng,t.latlng.lat,e.geometry.coordinates[a-1][0],e.geometry.coordinates[a-1][1],e.geometry.coordinates[a][0],e.geometry.coordinates[a][1]);l<r&&(r=l,n=e,s=i)}})}),s&&s.settings.click(t,n)},i.tryHover=function(t,e){var r,n,s=!1,l=null;i.instances.forEach(function(i){if(r=i.settings,n=r.sensitivityHover,i.active&&r.map===e&&r.hover){var c=a.geoJSON(r.data.features).getBounds();o.inBounds(t.latlng,c)&&r.data.features.map(function(e){for(var r=1;r<e.geometry.coordinates.length;r++){var a=o.pDistance(t.latlng.lng,t.latlng.lat,e.geometry.coordinates[r-1][0],e.geometry.coordinates[r-1][1],e.geometry.coordinates[r][0],e.geometry.coordinates[r][1]);a<n&&(n=a,s=e,l=i)}})}}),l&&l.settings.hover(t,s)},i.defaults=s,i.instances=[],i}(r.Base);exports.Lines=l;
},{"./base":"pR9a","./color":"lpyx","./leaflet-bindings":"IxA4","./line-feature-vertices":"GtdH","./utils":"UnXq"}],"IieH":[function(require,module,exports) {
"use strict";var t=this&&this.__extends||function(){var t=function(e,r){return(t=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var r in e)e.hasOwnProperty(r)&&(t[r]=e[r])})(e,r)};return function(e,r){function n(){this.constructor=e}t(e,r),e.prototype=null===r?Object.create(r):(n.prototype=r.prototype,new n)}}(),e=this&&this.__assign||function(){return(e=Object.assign||function(t){for(var e,r=1,n=arguments.length;r<n;r++)for(var o in e=arguments[r])Object.prototype.hasOwnProperty.call(e,o)&&(t[o]=e[o]);return t}).apply(this,arguments)};Object.defineProperty(exports,"__esModule",{value:!0}),exports.Points=void 0;var r=require("./base"),n=require("./color"),o=require("./leaflet-bindings"),i=require("./utils"),a={map:null,data:[],longitudeKey:null,latitudeKey:null,setupClick:null,setupHover:null,vertexShaderSource:null,fragmentShaderSource:null,eachVertex:null,click:null,hover:null,color:n.Color.random,opacity:.8,size:null,className:"",sensitivity:2,sensitivityHover:.03,shaderVariables:{vertex:{type:"FLOAT",start:0,size:2,bytes:6},color:{type:"FLOAT",start:2,size:3,bytes:6},pointSize:{type:"FLOAT",start:5,size:1,bytes:6}}},s=function(r){function n(t){var i=r.call(this,t)||this;if(n.instances.push(i),i.settings=e(e({},n.defaults),t),!t.data)throw new Error('no "data" array setting defined');if(!t.map)throw new Error('no leaflet "map" object setting defined');i.active=!0;var a=i.settings.data;if(Array.isArray(a))i.dataFormat="Array";else{if("FeatureCollection"!==a.type)throw new Error("unhandled data type. Supported types are Array and GeoJson.FeatureCollection");i.dataFormat="GeoJson.FeatureCollection"}return i.settings.map.options.crs.projection.project!==o.Projection.SphericalMercator.project&&console.warn("layer designed for SphericalMercator, alternate detected"),i.setup().render(),i}return t(n,r),n.prototype.render=function(){this.resetVertices();var t=this,e=t.gl,r=t.settings,n=t.canvas,o=t.program,i=t.layer,a=t.vertices,s=t.pixelsToWebGLMatrix,l=this.matrix=e.getUniformLocation(o,"matrix"),u=e.getUniformLocation(o,"opacity"),c=e.createBuffer(),p=new Float32Array(a),h=p.BYTES_PER_ELEMENT;return s.set([2/n.width,0,0,0,0,-2/n.height,0,0,0,0,0,0,-1,1,0,1]),e.viewport(0,0,n.width,n.height),e.uniformMatrix4fv(l,!1,s),e.uniform1f(u,r.opacity),e.bindBuffer(e.ARRAY_BUFFER,c),e.bufferData(e.ARRAY_BUFFER,p,e.STATIC_DRAW),this.attachShaderVariables(h),i.redraw(),this},n.prototype.resetVertices=function(){this.latLngLookup={},this.allLatLngLookup=[],this.vertices=[];var t,e,r,n,i,a,s,l=this.vertices,u=this.latLngLookup,c=this.settings,p=c.latitudeKey,h=c.longitudeKey,f=c.data,g=c.map,y=c.eachVertex,d=this.settings,v=d.color,L=d.size;if(!v)throw new Error("color is not properly defined");if("function"==typeof v&&(t=v),!L)throw new Error("size is not properly defined");if("function"==typeof L&&(n=L),"Array"===this.dataFormat)for(var x=f.length,m=0;m<x;m++){s=(i=f[m])[p].toFixed(2)+"x"+i[h].toFixed(2),a=g.project(new o.LatLng(i[p],i[h]),0),e=t?t(m,i):v,r=n?n(m,i):L,l.push(a.x,a.y,e.r,e.g,e.b,r);var w={latLng:i,key:s,pixel:a,chosenColor:e,chosenSize:r};(u[s]||(u[s]=[])).push(w),this.allLatLngLookup.push(w),y&&y.call(this,i,a,r)}else if("GeoJson.FeatureCollection"===this.dataFormat)for(x=f.features.length,m=0;m<x;m++){var F=f.features[m];s=(i=F.geometry.coordinates)[p].toFixed(2)+"x"+i[h].toFixed(2),a=g.project(new o.LatLng(i[p],i[h]),0),e=t?t(m,F):v,r=n?n(m,i):L,l.push(a.x,a.y,e.r,e.g,e.b,r);w={latLng:i,key:s,pixel:a,chosenColor:e,chosenSize:r,feature:F};(u[s]||(u[s]=[])).push(w),this.allLatLngLookup.push(w),y&&y.call(this,i,a,r)}return this},n.prototype.pointSize=function(t){var e=this.settings,r=e.map,n=e.size,o="function"==typeof n?n(t,null):n,i=r.getZoom();return null===o?Math.max(i-4,1):o},n.prototype.drawOnCanvas=function(t){if(!this.gl)return this;var e=this,r=e.gl,n=e.canvas,o=e.settings,i=e.mapMatrix,a=e.matrix,s=e.pixelsToWebGLMatrix,l=e.vertices,u=o.map,c=t.offset,p=u.getZoom(),h=Math.pow(2,p);return s.set([2/n.width,0,0,0,0,-2/n.height,0,0,0,0,0,0,-1,1,0,1]),i.set(s).scaleMatrix(h).translateMatrix(-c.x,-c.y),r.clear(r.COLOR_BUFFER_BIT),r.viewport(0,0,n.width,n.height),r.uniformMatrix4fv(a,!1,i.array),r.drawArrays(r.POINTS,0,l.length/6),this},n.prototype.lookup=function(t){for(var e,r,o,i,a,s=t.lat+.03,l=t.lng+.03,u=[],c=t.lat-.03;c<=s;c+=.01)for(e=t.lng-.03;e<=l;e+=.01)if(a=c.toFixed(2)+"x"+e.toFixed(2),i=this.latLngLookup[a])for(r=0,o=i.length;r<o;r++)u.push(i[r]);var p=this.settings.map;return n.closest(t,u.length>0?u:this.allLatLngLookup,p)},n.closest=function(t,e,r){return e.length<1?null:e.reduce(function(e,n){return i.locationDistance(t,e.latLng,r)<i.locationDistance(t,n.latLng,r)?e:n})},n.tryClick=function(t,e){var r,a,s,l,u,c,p,h=[],f={};if(n.instances.forEach(function(r){a=r.settings,r.active&&a.map===e&&a.click&&(l=r.lookup(t.latlng),f[l.key]=r,h.push(l))}),!(h.length<1)&&a&&null!==(c=this.closest(t.latlng,h,e))&&(s=f[c.key])){var g=s.settings,y=g.latitudeKey,d=g.longitudeKey,v=g.sensitivity,L=g.click;return p=new o.LatLng(c.latLng[y],c.latLng[d]),u=e.latLngToLayerPoint(p),i.pointInCircle(u,t.layerPoint,c.chosenSize*v)?void 0===(r=L(t,c.feature||c.latLng,u))||r:void 0}},n.tryHover=function(t,e){var r,a,s,l,u,c,p,h=[],f={};if(n.instances.forEach(function(r){a=r.settings,r.active&&a.map===e&&a.hover&&(l=r.lookup(t.latlng),f[l.key]=r,h.push(l))}),!(h.length<1)&&a&&null!==(c=this.closest(t.latlng,h,e))&&(s=f[c.key])){var g=s.settings,y=g.latitudeKey,d=g.longitudeKey,v=g.sensitivityHover,L=g.hover;return p=new o.LatLng(c.latLng[y],c.latLng[d]),u=e.latLngToLayerPoint(p),i.pointInCircle(u,t.layerPoint,c.chosenSize*v)?void 0===(r=L(t,c.feature||c.latLng,u))||r:void 0}},n.instances=[],n.defaults=a,n.maps=[],n}(r.Base);exports.Points=s;
},{"./base":"pR9a","./color":"lpyx","./leaflet-bindings":"IxA4","./utils":"UnXq"}],"j8I8":[function(require,module,exports) {
"use strict";var t=this&&this.__extends||function(){var t=function(e,r){return(t=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var r in e)e.hasOwnProperty(r)&&(t[r]=e[r])})(e,r)};return function(e,r){function i(){this.constructor=e}t(e,r),e.prototype=null===r?Object.create(r):(i.prototype=r.prototype,new i)}}(),e=this&&this.__assign||function(){return(e=Object.assign||function(t){for(var e,r=1,i=arguments.length;r<i;r++)for(var a in e=arguments[r])Object.prototype.hasOwnProperty.call(e,a)&&(t[a]=e[a]);return t}).apply(this,arguments)},r=this&&this.__importDefault||function(t){return t&&t.__esModule?t:{default:t}};Object.defineProperty(exports,"__esModule",{value:!0}),exports.Shapes=exports.defaults=void 0;var i=r(require("earcut")),a=r(require("geojson-flatten")),o=r(require("polygon-lookup")),n=require("./base"),s=require("./color"),l=require("./leaflet-bindings"),u=require("./utils");exports.defaults={map:null,data:[],longitudeKey:null,latitudeKey:null,setupClick:null,setupHover:null,vertexShaderSource:null,fragmentShaderSource:null,click:null,hover:null,color:s.Color.random,className:"",opacity:.5,shaderVariables:{color:{type:"FLOAT",start:2,size:3}},border:!1};var c=function(r){function n(t){var i=r.call(this,t)||this;if(n.instances.push(i),i.settings=e(e({},n.defaults),t),!t.data)throw new Error('no "data" array setting defined');if(!t.map)throw new Error('no leaflet "map" object setting defined');return i.polygonLookup=null,i.setup().render(),i}return t(n,r),n.prototype.render=function(){this.resetVertices();var t=this,e=t.pixelsToWebGLMatrix,r=t.settings,i=t.canvas,a=t.gl,o=t.layer,n=t.vertices,s=t.program,l=a.createBuffer(),u=new Float32Array(n),c=u.BYTES_PER_ELEMENT,f=a.getAttribLocation(s,"vertex"),h=a.getUniformLocation(s,"opacity");return a.uniform1f(h,r.opacity),a.bindBuffer(a.ARRAY_BUFFER,l),a.bufferData(a.ARRAY_BUFFER,u,a.STATIC_DRAW),a.vertexAttribPointer(f,2,a.FLOAT,!1,5*c,0),a.enableVertexAttribArray(f),this.matrix=a.getUniformLocation(s,"matrix"),e.set([2/i.width,0,0,0,0,-2/i.height,0,0,0,0,0,0,-1,1,0,1]),a.viewport(0,0,i.width,i.height),a.uniformMatrix4fv(this.matrix,!1,e),this.attachShaderVariables(c),o.redraw(),this},n.prototype.resetVertices=function(){this.vertices=[],this.vertsLines=[],this.polygonLookup=new o.default;var t,e,r,n,s,c,f,h,p,d,g,v,y=this.vertices,b=this.vertsLines,A=this.polygonLookup,_=this.settings,E=_.data,x=_.color,R=0;switch(E.type){case"Feature":A.loadFeatureCollection({type:"FeatureCollection",features:[E]}),r=a.default(E);break;case"MultiPolygon":A.loadFeatureCollection({type:"FeatureCollection",features:[{type:"Feature",properties:{id:"bar"},geometry:{coordinates:E.coordinates}}]}),r=a.default(E);break;default:A.loadFeatureCollection(E),r=E.features}if(h=r.length,!x)throw new Error("color is not properly defined");for("function"==typeof x&&(s=x);R<h;R++){n=r[R],p=[],c=s?s(R,n):x,f=(n.geometry||n).coordinates,g=i.default.flatten(f),d=i.default(g.vertices,g.holes,g.dimensions),v=f[0][0].length;for(var F=0,w=d.length;F<w;F++){if(e=d[F],"number"!=typeof g.vertices[0])throw new Error("unhandled polygon");p.push(g.vertices[e*v+_.longitudeKey],g.vertices[e*v+_.latitudeKey])}for(F=0,w=p.length;F<w;F)t=_.map.project(new l.LatLng(p[F++],p[F++]),0),y.push(t.x,t.y,c.r,c.g,c.b);if(_.border){var m=[];for(F=1,w=g.vertices.length;F<w;F+=2)m.push(g.vertices[F],g.vertices[F-1]),m.push(g.vertices[F+2],g.vertices[F+1]);for(F=0,w=m.length;F<w;F)t=u.latLonToPixel(m[F++],m[F++]),b.push(t.x,t.y,c.r,c.g,c.b)}}return this},n.prototype.drawOnCanvas=function(t){if(!this.gl)return this;var e=t.scale,r=t.offset,i=t.canvas,a=this.mapMatrix,o=this.pixelsToWebGLMatrix;o.set([2/i.width,0,0,0,0,-2/i.height,0,0,0,0,0,0,-1,1,0,1]),a.set(o).scaleMatrix(e).translateMatrix(-r.x,-r.y);var n=this.gl;n.clear(n.COLOR_BUFFER_BIT),n.viewport(0,0,i.width,i.height),n.uniformMatrix4fv(this.matrix,!1,a.array);var s=this.vertices;if(this.settings.border){var l=this.vertsLines,u=this.program,c=this.settings,f=n.createBuffer(),h=new Float32Array(l),p=h.BYTES_PER_ELEMENT,d=n.getAttribLocation(u,"vertex"),g=n.getUniformLocation(u,"opacity");n.uniform1f(g,1),n.bindBuffer(n.ARRAY_BUFFER,null),n.bindBuffer(n.ARRAY_BUFFER,f),n.bufferData(n.ARRAY_BUFFER,h,n.STATIC_DRAW),null!==this.settings.shaderVariables&&this.attachShaderVariables(p),n.vertexAttribPointer(d,3,n.FLOAT,!1,5*p,0),n.enableVertexAttribArray(d),n.enable(n.DEPTH_TEST),n.viewport(0,0,i.width,i.height),n.drawArrays(n.LINES,0,l.length/5),f=n.createBuffer(),p=(h=new Float32Array(s)).BYTES_PER_ELEMENT,d=n.getAttribLocation(u,"vertex"),g=n.getUniformLocation(u,"opacity"),n.uniform1f(g,c.opacity),n.bindBuffer(n.ARRAY_BUFFER,null),n.bindBuffer(n.ARRAY_BUFFER,f),n.bufferData(n.ARRAY_BUFFER,h,n.STATIC_DRAW),null!==c.shaderVariables&&this.attachShaderVariables(p),n.vertexAttribPointer(d,2,n.FLOAT,!1,5*p,0),n.enableVertexAttribArray(d),n.enable(n.DEPTH_TEST),n.viewport(0,0,i.width,i.height)}return n.drawArrays(n.TRIANGLES,0,s.length/5),this},n.tryClick=function(t,e){var r,i,a;return n.instances.forEach(function(o){i=o.settings,o.active&&i.map===e&&i.click&&(a=o.polygonLookup.search(t.latlng.lng,t.latlng.lat))&&(r=i.click(t,a))}),void 0===r||r},n.tryHover=function(t,e){var r,i,a;return n.instances.forEach(function(o){i=o.settings,o.active&&i.map===e&&i.hover&&(a=o.polygonLookup.search(t.latlng.lng,t.latlng.lat))&&(r=i.hover(t,a))}),void 0===r||r},n.instances=[],n.defaults=exports.defaults,n}(n.Base);exports.Shapes=c;
},{"./base":"pR9a","./color":"lpyx","./leaflet-bindings":"IxA4","./utils":"UnXq"}],"LmkB":[function(require,module,exports) {
module.exports = `uniform mat4 matrix;
attribute vec4 vertex;
attribute float pointSize;
attribute vec4 color;
varying vec4 _color;

void main() {
  //set the size of the point
  gl_PointSize = pointSize;

  //multiply each vertex by a matrix.
  gl_Position = matrix * vertex;

  //pass the color to the fragment shader
  _color = color;
}`
},{}],"hNM2":[function(require,module,exports) {
module.exports = `precision mediump float;
uniform vec4 color;
uniform float opacity;

void main() {
    float border = 0.05;
    float radius = 0.5;
    vec2 center = vec2(0.5);

    vec4 color0 = vec4(0.0);
    vec4 color1 = vec4(color[0], color[1], color[2], opacity);

    vec2 m = gl_PointCoord.xy - center;
    float dist = radius - sqrt(m.x * m.x + m.y * m.y);

    float t = 0.0;
    if (dist > border) {
        t = 1.0;
    } else if (dist > 0.0) {
        t = dist / border;
    }

    //works for overlapping circles if blending is enabled
    gl_FragColor = mix(color0, color1, t);
}`
},{}],"XGkG":[function(require,module,exports) {
module.exports = `precision mediump float;
varying vec4 _color;
uniform float opacity;

void main() {
  float border = 0.1;
  float radius = 0.5;
  vec2 center = vec2(0.5, 0.5);

  vec4 pointColor = vec4(_color[0], _color[1], _color[2], opacity);

  vec2 m = gl_PointCoord.xy - center;
  float dist1 = radius - sqrt(m.x * m.x + m.y * m.y);

  float t1 = 0.0;
  if (dist1 > border) {
      t1 = 1.0;
  } else if (dist1 > 0.0) {
      t1 = dist1 / border;
  }

  //works for overlapping circles if blending is enabled
  //gl_FragColor = mix(color0, color1, t);

  //border
  float outerBorder = 0.05;
  float innerBorder = 0.8;
  vec4 borderColor = vec4(0, 0, 0, 0.4);
  vec2 uv = gl_PointCoord.xy;
  vec4 clearColor = vec4(0, 0, 0, 0);

  // Offset uv with the center of the circle.
  uv -= center;

  float dist2 =  sqrt(dot(uv, uv));

  float t2 = 1.0 + smoothstep(radius, radius + outerBorder, dist2)
                - smoothstep(radius - innerBorder, radius, dist2);

  gl_FragColor = mix(mix(borderColor, clearColor, t2), pointColor, t1);
}`
},{}],"AY9x":[function(require,module,exports) {
module.exports = `precision mediump float;
varying vec4 _color;
uniform float opacity;

void main() {
  vec2 center = vec2(0.5);
  vec2 uv = gl_PointCoord.xy - center;
  float smoothing = 0.005;
  vec4 _color1 = vec4(_color[0], _color[1], _color[2], opacity);
  float radius1 = 0.3;
  vec4 _color2 = vec4(_color[0], _color[1], _color[2], opacity);
  float radius2 = 0.5;
  float dist = length(uv);

  //SMOOTH
  float gamma = 2.2;
  color1.rgb = pow(_color1.rgb, vec3(gamma));
  color2.rgb = pow(_color2.rgb, vec3(gamma));

  vec4 puck = mix(
    mix(
      _color1,
      _color2,
      smoothstep(
        radius1 - smoothing,
        radius1 + smoothing,
        dist
      )
    ),
    vec4(0,0,0,0),
      smoothstep(
        radius2 - smoothing,
        radius2 + smoothing,
        dist
    )
  );

  //Gamma correction (prevents color fringes)
  puck.rgb = pow(puck.rgb, vec3(1.0 / gamma));
  gl_FragColor = puck;
}`
},{}],"R6F0":[function(require,module,exports) {
module.exports = `precision mediump float;
varying vec4 _color;
uniform float opacity;

void main() {
    vec4 color1 = vec4(_color[0], _color[1], _color[2], opacity);

    //simple circles
    float d = distance (gl_PointCoord, vec2(0.5, 0.5));
    if (d < 0.5 ){
        gl_FragColor = color1;
    } else {
        discard;
    }
}`
},{}],"sqgp":[function(require,module,exports) {
module.exports = `precision mediump float;
varying vec4 _color;
uniform float opacity;

void main() {
    //squares
    gl_FragColor = vec4(_color[0], _color[1], _color[2], opacity);
}`
},{}],"JKQp":[function(require,module,exports) {
module.exports = `precision mediump float;
uniform float opacity;
varying vec4 _color;

void main() {
  gl_FragColor = vec4(_color[0], _color[1], _color[2], opacity);
}`
},{}],"QCba":[function(require,module,exports) {
"use strict";var e=this&&this.__assign||function(){return(e=Object.assign||function(e){for(var t,r=1,i=arguments.length;r<i;r++)for(var n in t=arguments[r])Object.prototype.hasOwnProperty.call(t,n)&&(e[n]=t[n]);return e}).apply(this,arguments)},t=this&&this.__spreadArrays||function(){for(var e=0,t=0,r=arguments.length;t<r;t++)e+=arguments[t].length;var i=Array(e),n=0;for(t=0;t<r;t++)for(var s=arguments[t],o=0,u=s.length;o<u;o++,n++)i[n]=s[o];return i},r=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(exports,"__esModule",{value:!0});var i=require("./lines"),n=require("./points"),s=require("./shapes"),o=require("./utils"),u=r(require("./shader/vertex/default.glsl")),a=r(require("./shader/fragment/dot.glsl")),l=r(require("./shader/fragment/point.glsl")),d=r(require("./shader/fragment/puck.glsl")),h=r(require("./shader/fragment/simple-circle.glsl")),p=r(require("./shader/fragment/square.glsl")),f=r(require("./shader/fragment/polygon.glsl")),c={vertex:u.default,fragment:{dot:a.default,point:l.default,puck:d.default,simpleCircle:h.default,square:p.default,polygon:f.default}},y=function(){function r(){this.longitudeKey=1,this.latitudeKey=0,this.maps=[],this.shader=c,this.Points=n.Points,this.Shapes=s.Shapes,this.Lines=i.Lines}return r.prototype.longitudeFirst=function(){return this.longitudeKey=0,this.latitudeKey=1,this},r.prototype.latitudeFirst=function(){return this.latitudeKey=0,this.longitudeKey=1,this},Object.defineProperty(r.prototype,"instances",{get:function(){return t(n.Points.instances,i.Lines.instances,s.Shapes.instances)},enumerable:!1,configurable:!0}),r.prototype.points=function(t){var r=this;return new this.Points(e({setupClick:g.setupClick.bind(this),setupHover:this.setupHover.bind(this),latitudeKey:g.latitudeKey,longitudeKey:g.longitudeKey,vertexShaderSource:function(){return r.shader.vertex},fragmentShaderSource:function(){return r.shader.fragment.point}},t))},r.prototype.shapes=function(t){var r=this;return new this.Shapes(e({setupClick:this.setupClick.bind(this),setupHover:this.setupHover.bind(this),latitudeKey:this.latitudeKey,longitudeKey:this.longitudeKey,vertexShaderSource:function(){return r.shader.vertex},fragmentShaderSource:function(){return r.shader.fragment.polygon}},t))},r.prototype.lines=function(t){var r=this;return new this.Lines(e({setupClick:this.setupClick.bind(this),setupHover:this.setupHover.bind(this),latitudeKey:this.latitudeKey,longitudeKey:this.longitudeKey,vertexShaderSource:function(){return r.shader.vertex},fragmentShaderSource:function(){return r.shader.fragment.polygon}},t))},r.prototype.setupClick=function(e){this.maps.indexOf(e)<0&&(this.maps.push(e),e.on("click",function(t){var r;return void 0!==(r=n.Points.tryClick(t,e))?r:void 0!==(r=i.Lines.tryClick(t,e))?r:void 0!==(r=s.Shapes.tryClick(t,e))?r:void 0}))},r.prototype.setupHover=function(e,t,r){this.maps.push(e),e.on("mousemove",o.debounce(function(t){var r;return void 0!==(r=n.Points.tryHover(t,e))?r:void 0!==(r=i.Lines.tryHover(t,e))?r:void 0!==(r=s.Shapes.tryHover(t,e))?r:void 0},t,r))},r}(),g=new y;exports.default=module.exports=g,"undefined"!=typeof window&&window.L&&(window.L.glify=g,window.L.Glify=y);
},{"./lines":"ogHp","./points":"IieH","./shapes":"j8I8","./utils":"UnXq","./shader/vertex/default.glsl":"LmkB","./shader/fragment/dot.glsl":"hNM2","./shader/fragment/point.glsl":"XGkG","./shader/fragment/puck.glsl":"AY9x","./shader/fragment/simple-circle.glsl":"R6F0","./shader/fragment/square.glsl":"sqgp","./shader/fragment/polygon.glsl":"JKQp"}]},{},["QCba"], null)
//# sourceMappingURL=/glify.js.map