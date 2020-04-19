parcelRequire=function(e,r,t,n){var i,o="function"==typeof parcelRequire&&parcelRequire,u="function"==typeof require&&require;function f(t,n){if(!r[t]){if(!e[t]){var i="function"==typeof parcelRequire&&parcelRequire;if(!n&&i)return i(t,!0);if(o)return o(t,!0);if(u&&"string"==typeof t)return u(t);var c=new Error("Cannot find module '"+t+"'");throw c.code="MODULE_NOT_FOUND",c}p.resolve=function(r){return e[t][1][r]||r},p.cache={};var l=r[t]=new f.Module(t);e[t][0].call(l.exports,p,l,l.exports,this)}return r[t].exports;function p(e){return f(p.resolve(e))}}f.isParcelRequire=!0,f.Module=function(e){this.id=e,this.bundle=f,this.exports={}},f.modules=e,f.cache=r,f.parent=o,f.register=function(r,t){e[r]=[function(e,r){r.exports=t},{}]};for(var c=0;c<t.length;c++)try{f(t[c])}catch(e){i||(i=e)}if(t.length){var l=f(t[t.length-1]);"object"==typeof exports&&"undefined"!=typeof module?module.exports=l:"function"==typeof define&&define.amd?define(function(){return l}):n&&(this[n]=l)}if(parcelRequire=f,i)throw i;return f}({"eMRn":[function(require,module,exports) {
"use strict";Object.defineProperty(exports,"__esModule",{value:!0});var t=function(){function t(){this.array=new Float32Array(16)}return t.prototype.set=function(t,r){return this.array.set(t,r),this},t.prototype.translateMatrix=function(t,r){var e=this.array;return e[12]+=e[0]*t+e[4]*r,e[13]+=e[1]*t+e[5]*r,e[14]+=e[2]*t+e[6]*r,e[15]+=e[3]*t+e[7]*r,this},t.prototype.scaleMatrix=function(t){var r=this.array;return r[0]*=t,r[1]*=t,r[2]*=t,r[3]*=t,r[4]*=t,r[5]*=t,r[6]*=t,r[7]*=t,this},t}();exports.MapMatrix=t;
},{}],"IxA4":[function(require,module,exports) {
"use strict";var e=r(require("leaflet"));function t(){if("function"!=typeof WeakMap)return null;var e=new WeakMap;return t=function(){return e},e}function r(e){if(e&&e.__esModule)return e;if(null===e||"object"!=typeof e&&"function"!=typeof e)return{default:e};var r=t();if(r&&r.has(e))return r.get(e);var n={},o=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var u in e)if(Object.prototype.hasOwnProperty.call(e,u)){var i=o?Object.getOwnPropertyDescriptor(e,u):null;i&&(i.get||i.set)?Object.defineProperty(n,u,i):n[u]=e[u]}return n.default=e,r&&r.set(e,n),n}let n=e;window&&window.L&&(n=window.L),module.exports=n;
},{}],"OTlA":[function(require,module,exports) {
"use strict";var t=this&&this.__extends||function(){var t=function(e,o){return(t=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var o in e)e.hasOwnProperty(o)&&(t[o]=e[o])})(e,o)};return function(e,o){function n(){this.constructor=e}t(e,o),e.prototype=null===o?Object.create(o):(n.prototype=o.prototype,new n)}}();Object.defineProperty(exports,"__esModule",{value:!0});var e=require("./leaflet-bindings"),o=function(o){function n(t){var e=o.call(this)||this;return e._userDrawFunc=t,e._frame=null,e._redrawCallbacks=[],e}return t(n,o),n.prototype.drawing=function(t){return this._userDrawFunc=t,this},n.prototype.params=function(t){return e.Util.setOptions(this,t),this},n.prototype.redraw=function(t){return"function"==typeof t&&this._redrawCallbacks.push(t),null===this._frame&&(this._frame=e.Util.requestAnimFrame(this._redraw,this)),this},n.prototype.onAdd=function(t){this._map=t,this.canvas=this.canvas||document.createElement("canvas");var o=t.getSize(),n=t.options.zoomAnimation&&e.Browser.any3d;return this.canvas.width=o.x,this.canvas.height=o.y,this.canvas.className="leaflet-zoom-"+(n?"animated":"hide"),t._panes.overlayPane.appendChild(this.canvas),t.on("moveend",this._reset,this),t.on("resize",this._resize,this),n&&t.on("zoomanim",e.Layer?this._animateZoom:this._animateZoomNoLayer,this),this._reset(),this},n.prototype.onRemove=function(t){return t.getPanes().overlayPane.removeChild(this.canvas),t.off("moveend",this._reset,this),t.off("resize",this._resize,this),t.options.zoomAnimation&&e.Browser.any3d&&t.off("zoomanim",e.Layer?this._animateZoom:this._animateZoomNoLayer,this),this},n.prototype.addTo=function(t){return t.addLayer(this),this},n.prototype._resize=function(t){this.canvas.width=t.newSize.x,this.canvas.height=t.newSize.y},n.prototype._reset=function(){var t=this._map.containerPointToLayerPoint([0,0]);e.DomUtil.setPosition(this.canvas,t),this._redraw()},n.prototype._redraw=function(){var t=this._map,o=this.canvas,n=t.getSize(),a=t.getBounds(),s=180*n.x/(20037508.34*(a.getEast()-a.getWest())),r=t.getZoom(),i=new e.LatLng(a.getNorth(),a.getWest()),h=this._unclampedProject(i,0);for(this._userDrawFunc&&this._userDrawFunc({bounds:a,canvas:o,offset:h,scale:Math.pow(2,r),size:n,zoomScale:s,zoom:r});this._redrawCallbacks.length>0;)this._redrawCallbacks.shift()(this);this._frame=null},n.prototype._animateZoom=function(t){var o=this._map,n=o.getZoomScale(t.zoom,o.getZoom()),a=this._unclampedLatLngBoundsToNewLayerBounds(o.getBounds(),t.zoom,t.center).min;e.DomUtil.setTransform(this.canvas,a,n)},n.prototype._animateZoomNoLayer=function(t){var o=this._map,n=o.getZoomScale(t.zoom,o.getZoom()),a=o._getCenterOffset(t.center)._multiplyBy(-n).subtract(o._getMapPanePos());e.DomUtil.setTransform(this.canvas,a,n)},n.prototype._unclampedProject=function(t,o){var n=this._map.options.crs,a=n.projection.R,s=Math.PI/180,r=t.lat,i=Math.sin(r*s),h=new e.Point(a*t.lng*s,a*Math.log((1+i)/(1-i))/2),c=n.scale(o);return n.transformation._transform(h,c)},n.prototype._unclampedLatLngBoundsToNewLayerBounds=function(t,o,n){var a=this._map._getNewPixelOrigin(n,o);return new e.Bounds([this._unclampedProject(t.getSouthWest(),o).subtract(a),this._unclampedProject(t.getNorthWest(),o).subtract(a),this._unclampedProject(t.getSouthEast(),o).subtract(a),this._unclampedProject(t.getNorthEast(),o).subtract(a)])},n}(e.Layer);exports.CanvasOverlay=o;
},{"./leaflet-bindings":"IxA4"}],"pR9a":[function(require,module,exports) {
"use strict";Object.defineProperty(exports,"__esModule",{value:!0});var e=require("./map-matrix"),t=require("./canvas-overlay"),r=function(){function r(r){var a=this;this.pixelsToWebGLMatrix=new Float32Array(16),this.mapMatrix=new e.MapMatrix,this.active=!0,this.vertexShader=null,this.fragmentShader=null,this.program=null,this.matrix=null,this.vertices=null;var i=Boolean(r.preserveDrawingBuffer),s=this.layer=new t.CanvasOverlay(function(e){return a.drawOnCanvas(e)}).addTo(r.map),n=this.canvas=s.canvas;n.width=n.clientWidth,n.height=n.clientHeight,n.style.position="absolute",r.className&&(n.className+=" "+r.className),this.gl=n.getContext("webgl2",{preserveDrawingBuffer:i})||n.getContext("webgl",{preserveDrawingBuffer:i})||n.getContext("experimental-webgl",{preserveDrawingBuffer:i})}return r.prototype.attachShaderVariables=function(e){if(!this.settings.shaderVariables)return this;var t=this.gl,r=this.program,a=this.settings.shaderVariables;for(var i in a)if(a.hasOwnProperty(i)){var s=a[i],n=t.getAttribLocation(r,i);if(n<0)throw new Error("shader variable "+i+" not found");t.vertexAttribPointer(n,s.size,t[s.type],!!s.normalize,e*(s.bytes||5),e*s.start),t.enableVertexAttribArray(n)}return this},r.prototype.setData=function(e){return this.settings.data=e,this},r.prototype.setup=function(){var e=this.settings;return e.click&&e.setupClick(e.map),this.setupVertexShader().setupFragmentShader().setupProgram()},r.prototype.setupVertexShader=function(){var e=this.gl,t=this.settings,r="function"==typeof t.vertexShaderSource?t.vertexShaderSource():t.vertexShaderSource,a=e.createShader(e.VERTEX_SHADER);return e.shaderSource(a,r),e.compileShader(a),this.vertexShader=a,this},r.prototype.setupFragmentShader=function(){var e=this.gl,t=this.settings,r="function"==typeof t.fragmentShaderSource?t.fragmentShaderSource():t.fragmentShaderSource,a=e.createShader(e.FRAGMENT_SHADER);return e.shaderSource(a,r),e.compileShader(a),this.fragmentShader=a,this},r.prototype.setupProgram=function(){var e=this.gl,t=e.createProgram();return e.attachShader(t,this.vertexShader),e.attachShader(t,this.fragmentShader),e.linkProgram(t),e.useProgram(t),e.blendFunc(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA),e.enable(e.BLEND),this.program=t,this},r.prototype.addTo=function(e){return this.layer.addTo(e||this.settings.map),this.active=!0,this.render()},r.prototype.remove=function(){return this.settings.map.removeLayer(this.layer),this.active=!1,this},r}();exports.Base=r;
},{"./map-matrix":"eMRn","./canvas-overlay":"OTlA"}],"lpyx":[function(require,module,exports) {
"use strict";Object.defineProperty(exports,"__esModule",{value:!0});var r={r:0,g:1,b:0},e={r:1,g:0,b:0},n={r:0,g:0,b:1},t={r:0,g:1,b:1},a={r:1,g:1,b:0},o={r:1,g:1,b:1},u={r:0,g:0,b:0},s={r:.5,g:.5,b:.5},c=function(){function o(){}return Object.defineProperty(o,"grey",{get:function(){return s},enumerable:!0,configurable:!0}),o.fromHex=function(r){return r.length<6?null:("#"===(r=r.toLowerCase())[0]&&(r=r.substring(1,r.length)),{r:parseInt(r[0]+r[1],16)/255,g:parseInt(r[2]+r[3],16)/255,b:parseInt(r[4]+r[5],16)/255})},o.random=function(){return{r:Math.random(),g:Math.random(),b:Math.random()}},o.pallet=function(){switch(Math.round(4*Math.random())){case 0:return r;case 1:return e;case 2:return n;case 3:return t;case 4:return a}},o}();exports.Color=c;
},{}],"GtdH":[function(require,module,exports) {
"use strict";Object.defineProperty(exports,"__esModule",{value:!0});var t=require("./leaflet-bindings"),e=function(){function e(t){Object.assign(this,t),this.vertexCount=0,this.array=[],this.length=0}return e.prototype.fillFromCoordinates=function(e){for(var r=this.color,i=0;i<e.length;i++)if(Array.isArray(e[i][0]))this.fillFromCoordinates(e[i]);else{var s=this.project(new t.LatLng(e[i][this.latitudeKey],e[i][this.longitudeKey]),0);this.push(s.x,s.y,r.r,r.g,r.b),0!==i&&i!==e.length-1&&(this.vertexCount+=1),this.vertexCount+=1}},e.prototype.push=function(){for(var t,e=[],r=0;r<arguments.length;r++)e[r]=arguments[r];(t=this.array).push.apply(t,e),this.length=this.array.length},e}();exports.LineFeatureVertices=e;
},{"./leaflet-bindings":"IxA4"}],"UnXq":[function(require,module,exports) {
"use strict";function t(t,r){var e={};for(var n in r)r.hasOwnProperty(n)&&(e[n]=t.hasOwnProperty(n)?t[n]:r[n]);return e}function r(t,r){var e=Math.PI/180,n=4*Math.PI,o=Math.sin(t*e);return{x:(r+180)/360*256,y:256*(.5-Math.log((1+o)/(1-o))/n)}}function e(t,r,e){return(t.x-r.x)*(t.x-r.x)+(t.y-r.y)*(t.y-r.y)<=e*e}function n(t,r,e,n,o,a){var i,s,u=o-e,p=a-n,x=u*u+p*p,c=-1;0!==x&&(c=((t-e)*u+(r-n)*p)/x),c<0?(i=e,s=n):c>1?(i=o,s=a):(i=e+c*u,s=n+c*p);var l=t-i,y=r-s;return Math.sqrt(l*l+y*y)}function o(t,r){return Math.sqrt(t*t+r*r)}function a(t,r,e){var n=e.latLngToLayerPoint(t),a=e.latLngToLayerPoint(r);return o(n.x-a.x,n.y-a.y)}function i(t){var r=document.createElement("div"),e=r.style,n=t.x,o=t.y;e.left=n+"px",e.top=o+"px",e.width="10px",e.height="10px",e.position="absolute",e.backgroundColor="#"+(16777215*Math.random()<<0).toString(16),document.body.appendChild(r)}Object.defineProperty(exports,"__esModule",{value:!0}),exports.defaults=t,exports.latLonToPixel=r,exports.pointInCircle=e,exports.pDistance=n,exports.vectorDistance=o,exports.locationDistance=a,exports.debugPoint=i;
},{}],"ogHp":[function(require,module,exports) {
"use strict";var t=this&&this.__extends||function(){var t=function(e,r){return(t=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var r in e)e.hasOwnProperty(r)&&(t[r]=e[r])})(e,r)};return function(e,r){function i(){this.constructor=e}t(e,r),e.prototype=null===r?Object.create(r):(i.prototype=r.prototype,new i)}}(),e=this&&this.__assign||function(){return(e=Object.assign||function(t){for(var e,r=1,i=arguments.length;r<i;r++)for(var a in e=arguments[r])Object.prototype.hasOwnProperty.call(e,a)&&(t[a]=e[a]);return t}).apply(this,arguments)};Object.defineProperty(exports,"__esModule",{value:!0});var r=require("./base"),i=require("./color"),a=require("./line-feature-vertices"),o=require("./utils"),n={map:null,data:[],longitudeKey:null,latitudeKey:null,setupClick:null,vertexShaderSource:null,fragmentShaderSource:null,click:null,color:i.Color.random,className:"",opacity:.5,weight:2,shaderVariables:{color:{type:"FLOAT",start:2,size:3}}},s=function(r){function i(t){var a=r.call(this,t)||this;if(i.instances.push(a),a.settings=e(e({},i.defaults),t),!t.data)throw new Error('no "data" array setting defined');if(!t.map)throw new Error('no leaflet "map" object setting defined');return a.active=!0,a.allVertices=[],a.setup().render(),a}return t(i,r),i.prototype.render=function(){this.resetVertices();var t=this.pixelsToWebGLMatrix,e=this.settings,r=this,i=r.canvas,a=r.gl,o=r.layer,n=r.vertices,s=r.program,l=a.createBuffer(),c=a.getAttribLocation(s,"vertex"),f=a.getUniformLocation(s,"opacity");a.uniform1f(f,e.opacity),a.bindBuffer(a.ARRAY_BUFFER,l);for(var u=n.length,h=[],p=0;p<u;p++)for(var d=n[p].array,y=d.length/5,g=0;g<y;g++){var v=5*g;0!==g&&g!==y-1&&h.push(d[v],d[v+1],d[v+2],d[v+3],d[v+4]),h.push(d[v],d[v+1],d[v+2],d[v+3],d[v+4])}this.allVertices=h;var m=new Float32Array(h);return u=m.BYTES_PER_ELEMENT,a.bufferData(a.ARRAY_BUFFER,m,a.STATIC_DRAW),a.vertexAttribPointer(c,2,a.FLOAT,!1,5*u,0),a.enableVertexAttribArray(c),this.matrix=a.getUniformLocation(s,"matrix"),this.aPointSize=a.getAttribLocation(s,"pointSize"),t.set([2/i.width,0,0,0,0,-2/i.height,0,0,0,0,0,0,-1,1,0,1]),a.viewport(0,0,i.width,i.height),a.uniformMatrix4fv(this.matrix,!1,t),this.attachShaderVariables(u),o.redraw(),this},i.prototype.resetVertices=function(){this.allVertices=[],this.vertices=[];var t,e,r,i=this.vertices,o=this.settings,n=o.data.features,s=o.map,l=o.latitudeKey,c=o.longitudeKey,f=n.length,u=o.color,h=0;if(!u)throw new Error("color is not properly defined");for("function"==typeof u&&(e=u);h<f;h++){t=n[h],r=e?e(h,t):u;var p=new a.LineFeatureVertices({project:s.project.bind(s),latitudeKey:l,longitudeKey:c,color:r});p.fillFromCoordinates(t.geometry.coordinates),i.push(p)}return this},i.prototype.drawOnCanvas=function(t){if(!this.gl)return this;var e=this,r=e.gl,i=e.settings,a=e.canvas,o=e.mapMatrix,n=e.matrix,s=e.pixelsToWebGLMatrix,l=e.allVertices,c=e.vertices,f=i.weight,u=t.scale,h=t.offset,p=t.zoom,d=Math.max(p-4,4);if(r.clear(r.COLOR_BUFFER_BIT),r.viewport(0,0,a.width,a.height),s.set([2/a.width,0,0,0,0,-2/a.height,0,0,0,0,0,0,-1,1,0,1]),r.viewport(0,0,a.width,a.height),r.vertexAttrib1f(this.aPointSize,d),p>18)o.set(s).scaleMatrix(u).translateMatrix(-h.x,-h.y),r.uniformMatrix4fv(n,!1,o.array),r.drawArrays(r.LINES,0,l.length/5);else if("number"==typeof f)for(var y=-f;y<f;y+=.5)for(var g=-f;g<f;g+=.5)o.set(s).scaleMatrix(u).translateMatrix(-h.x+g/u,-h.y+y/u),r.uniformMatrix4fv(n,!1,o.array),r.drawArrays(r.LINES,0,l.length/5);else if("function"==typeof f)for(var v=0,m=i.data.features,x=0;x<c.length;x++){var w=c[x].vertexCount,b=f(x,m[x]);for(y=-b;y<b;y+=.5)for(g=-b;g<b;g+=.5)o.set(s).scaleMatrix(u).translateMatrix(-h.x+g/u,-h.y+y/u),r.uniformMatrix4fv(this.matrix,!1,o.array),r.drawArrays(r.LINES,v,w);v+=w}return this},i.tryClick=function(t,e){var r,a=!1,n=null,s=.1;i.instances.forEach(function(i){r=i.settings,i.active&&r.map===e&&r.click&&r.data.features.map(function(e){for(var r=1;r<e.geometry.coordinates.length;r++){var l=o.pDistance(t.latlng.lng,t.latlng.lat,e.geometry.coordinates[r-1][0],e.geometry.coordinates[r-1][1],e.geometry.coordinates[r][0],e.geometry.coordinates[r][1]);l<s&&(s=l,a=e,n=i)}})}),n&&n.settings.click(t,a)},i.defaults=n,i.instances=[],i}(r.Base);exports.Lines=s;
},{"./base":"pR9a","./color":"lpyx","./line-feature-vertices":"GtdH","./utils":"UnXq"}],"IieH":[function(require,module,exports) {
"use strict";var t=this&&this.__extends||function(){var t=function(e,r){return(t=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var r in e)e.hasOwnProperty(r)&&(t[r]=e[r])})(e,r)};return function(e,r){function o(){this.constructor=e}t(e,r),e.prototype=null===r?Object.create(r):(o.prototype=r.prototype,new o)}}(),e=this&&this.__assign||function(){return(e=Object.assign||function(t){for(var e,r=1,o=arguments.length;r<o;r++)for(var i in e=arguments[r])Object.prototype.hasOwnProperty.call(e,i)&&(t[i]=e[i]);return t}).apply(this,arguments)};Object.defineProperty(exports,"__esModule",{value:!0});var r=require("./base"),o=require("./color"),i=require("./leaflet-bindings"),n=require("./utils"),a={map:null,data:[],longitudeKey:null,latitudeKey:null,setupClick:null,vertexShaderSource:null,fragmentShaderSource:null,eachVertex:null,click:null,color:o.Color.random,opacity:.8,size:null,className:"",sensitivity:2,shaderVariables:{vertex:{type:"FLOAT",start:0,size:2,bytes:6},color:{type:"FLOAT",start:2,size:3,bytes:6},pointSize:{type:"FLOAT",start:5,size:1,bytes:6}}},s=function(r){function o(t){var n=r.call(this,t)||this;if(o.instances.push(n),n.settings=e(e({},o.defaults),t),!t.data)throw new Error('no "data" array setting defined');if(!t.map)throw new Error('no leaflet "map" object setting defined');n.active=!0;var a=n.settings.data;if(Array.isArray(a))n.dataFormat="Array";else{if("FeatureCollection"!==a.type)throw new Error("unhandled data type. Supported types are Array and GeoJson.FeatureCollection");n.dataFormat="GeoJson.FeatureCollection"}return n.settings.map.options.crs.projection.project!==i.Projection.SphericalMercator.project&&console.warn("layer designed for SphericalMercator, alternate detected"),n.setup().render(),n}return t(o,r),o.prototype.render=function(){this.resetVertices();var t=this,e=t.gl,r=t.settings,o=t.canvas,i=t.program,n=t.layer,a=t.vertices,s=t.pixelsToWebGLMatrix,l=this.matrix=e.getUniformLocation(i,"matrix"),c=e.getUniformLocation(i,"opacity"),u=e.createBuffer(),p=new Float32Array(a),h=p.BYTES_PER_ELEMENT;return s.set([2/o.width,0,0,0,0,-2/o.height,0,0,0,0,0,0,-1,1,0,1]),e.viewport(0,0,o.width,o.height),e.uniformMatrix4fv(l,!1,s),e.uniform1f(c,r.opacity),e.bindBuffer(e.ARRAY_BUFFER,u),e.bufferData(e.ARRAY_BUFFER,p,e.STATIC_DRAW),this.attachShaderVariables(h),n.redraw(),this},o.prototype.resetVertices=function(){this.latLngLookup={},this.allLatLngLookup=[],this.vertices=[];var t,e,r,o,n,a,s,l=this.vertices,c=this.latLngLookup,u=this.settings,p=u.latitudeKey,h=u.longitudeKey,f=u.data,g=u.map,d=u.eachVertex,y=this.settings,L=y.color,v=y.size;if(!L)throw new Error("color is not properly defined");if("function"==typeof L&&(t=L),!v)throw new Error("size is not properly defined");if("function"==typeof v&&(o=v),"Array"===this.dataFormat)for(var x=f.length,m=0;m<x;m++){s=(n=f[m])[p].toFixed(2)+"x"+n[h].toFixed(2),a=g.project(new i.LatLng(n[p],n[h]),0),e=t?t(m,n):L,r=o?o(m,n):v,l.push(a.x,a.y,e.r,e.g,e.b,r);var w={latLng:n,key:s,pixel:a,chosenColor:e,chosenSize:r};(c[s]||(c[s]=[])).push(w),this.allLatLngLookup.push(w),d&&d.call(this,n,a,r)}else if("GeoJson.FeatureCollection"===this.dataFormat)for(x=f.features.length,m=0;m<x;m++){var F=f.features[m];s=(n=F.geometry.coordinates)[p].toFixed(2)+"x"+n[h].toFixed(2),a=g.project(new i.LatLng(n[p],n[h]),0),e=t?t(m,F):L,r=o?o(m,n):v,l.push(a.x,a.y,e.r,e.g,e.b,r);w={latLng:n,key:s,pixel:a,chosenColor:e,chosenSize:r,feature:F};(c[s]||(c[s]=[])).push(w),this.allLatLngLookup.push(w),d&&d.call(this,n,a,r)}return this},o.prototype.pointSize=function(t){var e=this.settings,r=e.map,o=e.size,i="function"==typeof o?o(t,null):o,n=r.getZoom();return null===i?Math.max(n-4,1):i},o.prototype.drawOnCanvas=function(t){if(!this.gl)return this;var e=this,r=e.gl,o=e.canvas,i=e.settings,n=e.mapMatrix,a=e.matrix,s=e.pixelsToWebGLMatrix,l=e.vertices,c=i.map,u=t.offset,p=c.getZoom(),h=Math.pow(2,p);return s.set([2/o.width,0,0,0,0,-2/o.height,0,0,0,0,0,0,-1,1,0,1]),n.set(s).scaleMatrix(h).translateMatrix(-u.x,-u.y),r.clear(r.COLOR_BUFFER_BIT),r.viewport(0,0,o.width,o.height),r.uniformMatrix4fv(a,!1,n.array),r.drawArrays(r.POINTS,0,l.length/6),this},o.prototype.lookup=function(t){for(var e,r,i,n,a,s=t.lat+.03,l=t.lng+.03,c=[],u=t.lat-.03;u<=s;u+=.01)for(e=t.lng-.03;e<=l;e+=.01)if(a=u.toFixed(2)+"x"+e.toFixed(2),n=this.latLngLookup[a])for(r=0,i=n.length;r<i;r++)c.push(n[r]);var p=this.settings.map;return o.closest(t,c.length>0?c:this.allLatLngLookup,p)},o.closest=function(t,e,r){return e.length<1?null:e.reduce(function(e,o){return n.locationDistance(t,e.latLng,r)<n.locationDistance(t,o.latLng,r)?e:o})},o.tryClick=function(t,e){var r,a,s,l,c,u,p,h=[],f={};if(o.instances.forEach(function(r){a=r.settings,r.active&&a.map===e&&a.click&&(l=r.lookup(t.latlng),f[l.key]=r,h.push(l))}),!(h.length<1)&&a&&null!==(u=this.closest(t.latlng,h,e))&&(s=f[u.key])){var g=s.settings,d=g.latitudeKey,y=g.longitudeKey,L=g.sensitivity,v=g.click;return p=new i.LatLng(u.latLng[d],u.latLng[y]),c=e.latLngToLayerPoint(p),n.pointInCircle(c,t.layerPoint,u.chosenSize*L)?void 0===(r=v(t,u.feature||u.latLng,c))||r:void 0}},o.instances=[],o.defaults=a,o.maps=[],o}(r.Base);exports.Points=s;
},{"./base":"pR9a","./color":"lpyx","./leaflet-bindings":"IxA4","./utils":"UnXq"}],"j8I8":[function(require,module,exports) {
"use strict";var t=this&&this.__extends||function(){var t=function(e,r){return(t=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var r in e)e.hasOwnProperty(r)&&(t[r]=e[r])})(e,r)};return function(e,r){function o(){this.constructor=e}t(e,r),e.prototype=null===r?Object.create(r):(o.prototype=r.prototype,new o)}}(),e=this&&this.__assign||function(){return(e=Object.assign||function(t){for(var e,r=1,o=arguments.length;r<o;r++)for(var i in e=arguments[r])Object.prototype.hasOwnProperty.call(e,i)&&(t[i]=e[i]);return t}).apply(this,arguments)},r=this&&this.__importDefault||function(t){return t&&t.__esModule?t:{default:t}};Object.defineProperty(exports,"__esModule",{value:!0});var o=r(require("earcut")),i=r(require("geojson-flatten")),a=r(require("polygon-lookup")),n=require("./base"),s=require("./color"),l=require("./leaflet-bindings");exports.defaults={map:null,data:[],longitudeKey:null,latitudeKey:null,setupClick:null,vertexShaderSource:null,fragmentShaderSource:null,click:null,color:s.Color.random,className:"",opacity:.5,shaderVariables:{color:{type:"FLOAT",start:2,size:3}}};var u=function(r){function n(t){var o=r.call(this,t)||this;if(n.instances.push(o),o.settings=e(e({},n.defaults),t),!t.data)throw new Error('no "data" array setting defined');if(!t.map)throw new Error('no leaflet "map" object setting defined');return o.polygonLookup=null,o.setup().render(),o}return t(n,r),n.prototype.render=function(){this.resetVertices();var t=this,e=t.pixelsToWebGLMatrix,r=t.settings,o=t.canvas,i=t.gl,a=t.layer,n=t.vertices,s=t.program,l=i.createBuffer(),u=new Float32Array(n),c=u.BYTES_PER_ELEMENT,f=i.getAttribLocation(s,"vertex"),p=i.getUniformLocation(s,"opacity");return i.uniform1f(p,r.opacity),i.bindBuffer(i.ARRAY_BUFFER,l),i.bufferData(i.ARRAY_BUFFER,u,i.STATIC_DRAW),i.vertexAttribPointer(f,2,i.FLOAT,!1,5*c,0),i.enableVertexAttribArray(f),this.matrix=i.getUniformLocation(s,"matrix"),e.set([2/o.width,0,0,0,0,-2/o.height,0,0,0,0,0,0,-1,1,0,1]),i.viewport(0,0,o.width,o.height),i.uniformMatrix4fv(this.matrix,!1,e),this.attachShaderVariables(c),a.redraw(),this},n.prototype.resetVertices=function(){this.vertices=[],this.polygonLookup=new a.default;var t,e,r,n,s,u,c,f,p,h,d,y,g=this.vertices,v=this.polygonLookup,_=this.settings,m=_.data,w=_.color,x=0;switch(m.type){case"Feature":v.loadFeatureCollection({type:"FeatureCollection",features:[m]}),r=i.default(m);break;case"MultiPolygon":v.loadFeatureCollection({type:"FeatureCollection",features:[{type:"Feature",properties:{id:"bar"},geometry:{coordinates:m.coordinates}}]}),r=i.default(m);break;default:v.loadFeatureCollection(m),r=m.features}if(f=r.length,!w)throw new Error("color is not properly defined");for("function"==typeof w&&(s=w);x<f;x++){n=r[x],p=[],u=s?s(x,n):w,c=(n.geometry||n).coordinates,d=o.default.flatten(c),h=o.default(d.vertices,d.holes,d.dimensions),y=c[0][0].length;for(var b=0,A=h.length;b<A;b++){if(e=h[b],"number"!=typeof d.vertices[0])throw new Error("unhandled polygon");p.push(d.vertices[e*y+_.longitudeKey],d.vertices[e*y+_.latitudeKey])}for(b=0,A=p.length;b<A;b)t=_.map.project(new l.LatLng(p[b++],p[b++]),0),g.push(t.x,t.y,u.r,u.g,u.b)}return this},n.prototype.drawOnCanvas=function(t){if(!this.gl)return this;var e=t.scale,r=t.offset,o=t.canvas,i=this.mapMatrix,a=this.pixelsToWebGLMatrix;a.set([2/o.width,0,0,0,0,-2/o.height,0,0,0,0,0,0,-1,1,0,1]),i.set(a).scaleMatrix(e).translateMatrix(-r.x,-r.y);var n=this.gl;return n.clear(n.COLOR_BUFFER_BIT),n.viewport(0,0,o.width,o.height),n.uniformMatrix4fv(this.matrix,!1,i.array),n.drawArrays(n.TRIANGLES,0,this.vertices.length/5),this},n.tryClick=function(t,e){var r,o,i;return n.instances.forEach(function(a){o=a.settings,a.active&&o.map===e&&o.click&&(i=a.polygonLookup.search(t.latlng.lng,t.latlng.lat))&&(r=o.click(t,i))}),void 0===r||r},n.instances=[],n.defaults=exports.defaults,n}(n.Base);exports.Shapes=u;
},{"./base":"pR9a","./color":"lpyx","./leaflet-bindings":"IxA4"}],"LmkB":[function(require,module,exports) {
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
"use strict";var e=this&&this.__assign||function(){return(e=Object.assign||function(e){for(var t,r=1,i=arguments.length;r<i;r++)for(var n in t=arguments[r])Object.prototype.hasOwnProperty.call(t,n)&&(e[n]=t[n]);return e}).apply(this,arguments)},t=this&&this.__spreadArrays||function(){for(var e=0,t=0,r=arguments.length;t<r;t++)e+=arguments[t].length;var i=Array(e),n=0;for(t=0;t<r;t++)for(var s=arguments[t],u=0,o=s.length;u<o;u++,n++)i[n]=s[u];return i},r=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(exports,"__esModule",{value:!0});var i=require("./lines"),n=require("./points"),s=require("./shapes"),u=r(require("./shader/vertex/default.glsl")),o=r(require("./shader/fragment/dot.glsl")),a=r(require("./shader/fragment/point.glsl")),l=r(require("./shader/fragment/puck.glsl")),d=r(require("./shader/fragment/simple-circle.glsl")),h=r(require("./shader/fragment/square.glsl")),p=r(require("./shader/fragment/polygon.glsl")),f={vertex:u.default,fragment:{dot:o.default,point:a.default,puck:l.default,simpleCircle:d.default,square:h.default,polygon:p.default}},c=function(){function r(){this.longitudeKey=1,this.latitudeKey=0,this.maps=[],this.shader=f,this.Points=n.Points,this.Shapes=s.Shapes,this.Lines=i.Lines}return r.prototype.longitudeFirst=function(){return this.longitudeKey=0,this.latitudeKey=1,this},r.prototype.latitudeFirst=function(){return this.latitudeKey=0,this.longitudeKey=1,this},Object.defineProperty(r.prototype,"instances",{get:function(){return t(n.Points.instances,i.Lines.instances,s.Shapes.instances)},enumerable:!0,configurable:!0}),r.prototype.points=function(t){var r=this;return new this.Points(e({setupClick:g.setupClick.bind(this),latitudeKey:g.latitudeKey,longitudeKey:g.longitudeKey,vertexShaderSource:function(){return r.shader.vertex},fragmentShaderSource:function(){return r.shader.fragment.point}},t))},r.prototype.shapes=function(t){var r=this;return new this.Shapes(e({setupClick:this.setupClick.bind(this),latitudeKey:this.latitudeKey,longitudeKey:this.longitudeKey,vertexShaderSource:function(){return r.shader.vertex},fragmentShaderSource:function(){return r.shader.fragment.polygon}},t))},r.prototype.lines=function(t){var r=this;return new this.Lines(e({setupClick:this.setupClick.bind(this),latitudeKey:this.latitudeKey,longitudeKey:this.longitudeKey,vertexShaderSource:function(){return r.shader.vertex},fragmentShaderSource:function(){return r.shader.fragment.polygon}},t))},r.prototype.setupClick=function(e){this.maps.indexOf(e)<0&&(this.maps.push(e),e.on("click",function(t){var r;return void 0!==(r=n.Points.tryClick(t,e))?r:void 0!==(r=i.Lines.tryClick(t,e))?r:void 0!==(r=s.Shapes.tryClick(t,e))?r:void 0}))},r}(),g=new c;exports.default=module.exports=g,"undefined"!=typeof window&&window.L&&(window.L.glify=g,window.L.Glify=c);
},{"./lines":"ogHp","./points":"IieH","./shapes":"j8I8","./shader/vertex/default.glsl":"LmkB","./shader/fragment/dot.glsl":"hNM2","./shader/fragment/point.glsl":"XGkG","./shader/fragment/puck.glsl":"AY9x","./shader/fragment/simple-circle.glsl":"R6F0","./shader/fragment/square.glsl":"sqgp","./shader/fragment/polygon.glsl":"JKQp"}]},{},["QCba"], null)
//# sourceMappingURL=/glify.js.map