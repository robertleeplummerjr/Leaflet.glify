parcelRequire=function(e,r,t,n){var i,o="function"==typeof parcelRequire&&parcelRequire,u="function"==typeof require&&require;function f(t,n){if(!r[t]){if(!e[t]){var i="function"==typeof parcelRequire&&parcelRequire;if(!n&&i)return i(t,!0);if(o)return o(t,!0);if(u&&"string"==typeof t)return u(t);var c=new Error("Cannot find module '"+t+"'");throw c.code="MODULE_NOT_FOUND",c}p.resolve=function(r){return e[t][1][r]||r},p.cache={};var l=r[t]=new f.Module(t);e[t][0].call(l.exports,p,l,l.exports,this)}return r[t].exports;function p(e){return f(p.resolve(e))}}f.isParcelRequire=!0,f.Module=function(e){this.id=e,this.bundle=f,this.exports={}},f.modules=e,f.cache=r,f.parent=o,f.register=function(r,t){e[r]=[function(e,r){r.exports=t},{}]};for(var c=0;c<t.length;c++)try{f(t[c])}catch(e){i||(i=e)}if(t.length){var l=f(t[t.length-1]);"object"==typeof exports&&"undefined"!=typeof module?module.exports=l:"function"==typeof define&&define.amd?define(function(){return l}):n&&(this[n]=l)}if(parcelRequire=f,i)throw i;return f}({"eMRn":[function(require,module,exports) {
"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.MapMatrix=void 0;var t=function(){function t(){this.array=new Float32Array(16)}return t.prototype.set=function(t,r){return this.array.set(t,r),this},t.prototype.translateMatrix=function(t,r){var a=this.array;return a[12]+=a[0]*t+a[4]*r,a[13]+=a[1]*t+a[5]*r,a[14]+=a[2]*t+a[6]*r,a[15]+=a[3]*t+a[7]*r,this},t.prototype.scaleMatrix=function(t){var r=this.array;return r[0]*=t,r[1]*=t,r[2]*=t,r[3]*=t,r[4]*=t,r[5]*=t,r[6]*=t,r[7]*=t,this},t}();exports.MapMatrix=t;
},{}],"IxA4":[function(require,module,exports) {
"use strict";var e=r(require("leaflet"));function t(){if("function"!=typeof WeakMap)return null;var e=new WeakMap;return t=function(){return e},e}function r(e){if(e&&e.__esModule)return e;if(null===e||"object"!=typeof e&&"function"!=typeof e)return{default:e};var r=t();if(r&&r.has(e))return r.get(e);var n={},o=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var u in e)if(Object.prototype.hasOwnProperty.call(e,u)){var i=o?Object.getOwnPropertyDescriptor(e,u):null;i&&(i.get||i.set)?Object.defineProperty(n,u,i):n[u]=e[u]}return n.default=e,r&&r.set(e,n),n}let n=e;window&&window.L&&(n=window.L),module.exports=n;
},{}],"OTlA":[function(require,module,exports) {
"use strict";var t=this&&this.__extends||function(){var t=function(e,o){return(t=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var o in e)e.hasOwnProperty(o)&&(t[o]=e[o])})(e,o)};return function(e,o){function n(){this.constructor=e}t(e,o),e.prototype=null===o?Object.create(o):(n.prototype=o.prototype,new n)}}();Object.defineProperty(exports,"__esModule",{value:!0}),exports.CanvasOverlay=void 0;var e=require("./leaflet-bindings"),o=function(o){function n(t){var e=o.call(this)||this;return e._userDrawFunc=t,e._frame=null,e._redrawCallbacks=[],e}return t(n,o),n.prototype.drawing=function(t){return this._userDrawFunc=t,this},n.prototype.params=function(t){return e.Util.setOptions(this,t),this},n.prototype.redraw=function(t){return"function"==typeof t&&this._redrawCallbacks.push(t),null===this._frame&&(this._frame=e.Util.requestAnimFrame(this._redraw,this)),this},n.prototype.onAdd=function(t){this._map=t,this.canvas=this.canvas||document.createElement("canvas");var o=t.getSize(),n=t.options.zoomAnimation&&e.Browser.any3d;return this.canvas.width=o.x,this.canvas.height=o.y,this.canvas.className="leaflet-zoom-"+(n?"animated":"hide"),t._panes.overlayPane.appendChild(this.canvas),t.on("moveend",this._reset,this),t.on("resize",this._resize,this),n&&t.on("zoomanim",e.Layer?this._animateZoom:this._animateZoomNoLayer,this),this._reset(),this},n.prototype.onRemove=function(t){return t.getPanes().overlayPane.removeChild(this.canvas),t.off("moveend",this._reset,this),t.off("resize",this._resize,this),t.options.zoomAnimation&&e.Browser.any3d&&t.off("zoomanim",e.Layer?this._animateZoom:this._animateZoomNoLayer,this),this},n.prototype.addTo=function(t){return t.addLayer(this),this},n.prototype._resize=function(t){this.canvas.width=t.newSize.x,this.canvas.height=t.newSize.y},n.prototype._reset=function(){var t=this._map.containerPointToLayerPoint([0,0]);e.DomUtil.setPosition(this.canvas,t),this._redraw()},n.prototype._redraw=function(){var t=this._map,o=this.canvas,n=t.getSize(),a=t.getBounds(),s=180*n.x/(20037508.34*(a.getEast()-a.getWest())),r=t.getZoom(),i=new e.LatLng(a.getNorth(),a.getWest()),h=this._unclampedProject(i,0);for(this._userDrawFunc&&this._userDrawFunc({bounds:a,canvas:o,offset:h,scale:Math.pow(2,r),size:n,zoomScale:s,zoom:r});this._redrawCallbacks.length>0;)this._redrawCallbacks.shift()(this);this._frame=null},n.prototype._animateZoom=function(t){var o=this._map,n=o.getZoomScale(t.zoom,o.getZoom()),a=this._unclampedLatLngBoundsToNewLayerBounds(o.getBounds(),t.zoom,t.center).min;e.DomUtil.setTransform(this.canvas,a,n)},n.prototype._animateZoomNoLayer=function(t){var o=this._map,n=o.getZoomScale(t.zoom,o.getZoom()),a=o._getCenterOffset(t.center)._multiplyBy(-n).subtract(o._getMapPanePos());e.DomUtil.setTransform(this.canvas,a,n)},n.prototype._unclampedProject=function(t,o){var n=this._map.options.crs,a=n.projection.R,s=Math.PI/180,r=t.lat,i=Math.sin(r*s),h=new e.Point(a*t.lng*s,a*Math.log((1+i)/(1-i))/2),c=n.scale(o);return n.transformation._transform(h,c)},n.prototype._unclampedLatLngBoundsToNewLayerBounds=function(t,o,n){var a=this._map._getNewPixelOrigin(n,o);return new e.Bounds([this._unclampedProject(t.getSouthWest(),o).subtract(a),this._unclampedProject(t.getNorthWest(),o).subtract(a),this._unclampedProject(t.getSouthEast(),o).subtract(a),this._unclampedProject(t.getNorthEast(),o).subtract(a)])},n}(e.Layer);exports.CanvasOverlay=o;
},{"./leaflet-bindings":"IxA4"}],"pR9a":[function(require,module,exports) {
"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.Base=void 0;var e=require("./map-matrix"),t=require("./canvas-overlay"),r=function(){function r(r){var a=this;this.pixelsToWebGLMatrix=new Float32Array(16),this.mapMatrix=new e.MapMatrix,this.active=!0,this.vertexShader=null,this.fragmentShader=null,this.program=null,this.matrix=null,this.vertices=null;var i=Boolean(r.preserveDrawingBuffer),s=this.layer=new t.CanvasOverlay(function(e){return a.drawOnCanvas(e)}).addTo(r.map),n=this.canvas=s.canvas;n.width=n.clientWidth,n.height=n.clientHeight,n.style.position="absolute",r.className&&(n.className+=" "+r.className),this.gl=n.getContext("webgl2",{preserveDrawingBuffer:i})||n.getContext("webgl",{preserveDrawingBuffer:i})||n.getContext("experimental-webgl",{preserveDrawingBuffer:i})}return r.prototype.attachShaderVariables=function(e){if(!this.settings.shaderVariables)return this;var t=this.gl,r=this.program,a=this.settings.shaderVariables;for(var i in a)if(a.hasOwnProperty(i)){var s=a[i],n=t.getAttribLocation(r,i);if(n<0)throw new Error("shader variable "+i+" not found");t.vertexAttribPointer(n,s.size,t[s.type],!!s.normalize,e*(s.bytes||5),e*s.start),t.enableVertexAttribArray(n)}return this},r.prototype.setData=function(e){return this.settings.data=e,this},r.prototype.setup=function(){var e=this.settings;return e.click&&e.setupClick(e.map),e.hover&&e.setupHover(e.map,e.hoverWait),this.setupVertexShader().setupFragmentShader().setupProgram()},r.prototype.setupVertexShader=function(){var e=this.gl,t=this.settings,r="function"==typeof t.vertexShaderSource?t.vertexShaderSource():t.vertexShaderSource,a=e.createShader(e.VERTEX_SHADER);return e.shaderSource(a,r),e.compileShader(a),this.vertexShader=a,this},r.prototype.setupFragmentShader=function(){var e=this.gl,t=this.settings,r="function"==typeof t.fragmentShaderSource?t.fragmentShaderSource():t.fragmentShaderSource,a=e.createShader(e.FRAGMENT_SHADER);return e.shaderSource(a,r),e.compileShader(a),this.fragmentShader=a,this},r.prototype.setupProgram=function(){var e=this.gl,t=e.createProgram();return e.attachShader(t,this.vertexShader),e.attachShader(t,this.fragmentShader),e.linkProgram(t),e.useProgram(t),e.blendFunc(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA),e.enable(e.BLEND),this.program=t,this},r.prototype.addTo=function(e){return this.layer.addTo(e||this.settings.map),this.active=!0,this.render()},r.prototype.remove=function(){return this.settings.map.removeLayer(this.layer),this.active=!1,this},r}();exports.Base=r;
},{"./map-matrix":"eMRn","./canvas-overlay":"OTlA"}],"lpyx":[function(require,module,exports) {
"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.Color=void 0;var r={r:0,g:1,b:0},e={r:1,g:0,b:0},t={r:0,g:0,b:1},n={r:0,g:1,b:1},o={r:1,g:1,b:0},a={r:1,g:1,b:1},u={r:0,g:0,b:0},s={r:.5,g:.5,b:.5},c=function(){function a(){}return Object.defineProperty(a,"grey",{get:function(){return s},enumerable:!1,configurable:!0}),a.fromHex=function(r){return r.length<6?null:("#"===(r=r.toLowerCase())[0]&&(r=r.substring(1,r.length)),{r:parseInt(r[0]+r[1],16)/255,g:parseInt(r[2]+r[3],16)/255,b:parseInt(r[4]+r[5],16)/255})},a.random=function(){return{r:Math.random(),g:Math.random(),b:Math.random()}},a.pallet=function(){switch(Math.round(4*Math.random())){case 0:return r;case 1:return e;case 2:return t;case 3:return n;case 4:return o}},a}();exports.Color=c;
},{}],"GtdH":[function(require,module,exports) {
"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.LineFeatureVertices=void 0;var t=require("./leaflet-bindings"),e=function(){function e(t){Object.assign(this,t),this.vertexCount=0,this.array=[],this.length=0}return e.prototype.fillFromCoordinates=function(e){for(var r=this.color,i=0;i<e.length;i++)if(Array.isArray(e[i][0]))this.fillFromCoordinates(e[i]);else{var s=this.project(new t.LatLng(e[i][this.latitudeKey],e[i][this.longitudeKey]),0);this.push(s.x,s.y,r.r,r.g,r.b),0!==i&&i!==e.length-1&&(this.vertexCount+=1),this.vertexCount+=1}},e.prototype.push=function(){for(var t,e=[],r=0;r<arguments.length;r++)e[r]=arguments[r];(t=this.array).push.apply(t,e),this.length=this.array.length},e}();exports.LineFeatureVertices=e;
},{"./leaflet-bindings":"IxA4"}],"UnXq":[function(require,module,exports) {
"use strict";function t(t,e){var o={};for(var r in e)e.hasOwnProperty(r)&&(o[r]=t.hasOwnProperty(r)?t[r]:e[r]);return o}function e(t,e){var o=Math.PI/180,r=4*Math.PI,n=Math.sin(t*o);return{x:(e+180)/360*256,y:256*(.5-Math.log((1+n)/(1-n))/r)}}function o(t,e,o){return(t.x-e.x)*(t.x-e.x)+(t.y-e.y)*(t.y-e.y)<=o*o}function r(t,e,o,r,n,a){var i,s,p=n-o,x=a-r,c=p*p+x*x,u=-1;0!==c&&(u=((t-o)*p+(e-r)*x)/c),u<0?(i=o,s=r):u>1?(i=n,s=a):(i=o+u*p,s=r+u*x);var l=t-i,d=e-s;return Math.sqrt(l*l+d*d)}function n(t,e){return Math.sqrt(t*t+e*e)}function a(t,e,o){var r=o.latLngToLayerPoint(t),a=o.latLngToLayerPoint(e);return n(r.x-a.x,r.y-a.y)}function i(t){var e=document.createElement("div"),o=e.style,r=t.x,n=t.y;o.left=r+"px",o.top=n+"px",o.width="10px",o.height="10px",o.position="absolute",o.backgroundColor="#"+(16777215*Math.random()<<0).toString(16),document.body.appendChild(e)}Object.defineProperty(exports,"__esModule",{value:!0}),exports.debugPoint=exports.locationDistance=exports.vectorDistance=exports.pDistance=exports.pointInCircle=exports.latLonToPixel=exports.defaults=void 0,exports.defaults=t,exports.latLonToPixel=e,exports.pointInCircle=o,exports.pDistance=r,exports.vectorDistance=n,exports.locationDistance=a,exports.debugPoint=i;
},{}],"ogHp":[function(require,module,exports) {
"use strict";var t=this&&this.__extends||function(){var t=function(e,r){return(t=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var r in e)e.hasOwnProperty(r)&&(t[r]=e[r])})(e,r)};return function(e,r){function i(){this.constructor=e}t(e,r),e.prototype=null===r?Object.create(r):(i.prototype=r.prototype,new i)}}(),e=this&&this.__assign||function(){return(e=Object.assign||function(t){for(var e,r=1,i=arguments.length;r<i;r++)for(var o in e=arguments[r])Object.prototype.hasOwnProperty.call(e,o)&&(t[o]=e[o]);return t}).apply(this,arguments)};Object.defineProperty(exports,"__esModule",{value:!0}),exports.Lines=void 0;var r=require("./base"),i=require("./color"),o=require("./leaflet-bindings"),a=require("./line-feature-vertices"),n=require("./utils"),s={map:null,data:[],longitudeKey:null,latitudeKey:null,setupClick:null,setupHover:null,vertexShaderSource:null,fragmentShaderSource:null,click:null,hover:null,color:i.Color.random,className:"",opacity:.5,weight:2,sensitivity:.1,sensitivityHover:.03,hoverWait:150,highlight:null,shaderVariables:{color:{type:"FLOAT",start:2,size:3}}},l=function(r){function i(t){var o=r.call(this,t)||this;if(i.instances.push(o),o.settings=e(e({},i.defaults),t),!t.data)throw new Error('no "data" array setting defined');if(!t.map)throw new Error('no leaflet "map" object setting defined');return o.active=!0,o.allVertices=[],o.setup().render(),o}return t(i,r),i.prototype.render=function(){this.resetVertices();var t=this.pixelsToWebGLMatrix,e=this.settings,r=this,i=r.canvas,o=r.gl,a=r.layer,n=r.vertices,s=r.program,l=o.createBuffer(),c=o.getAttribLocation(s,"vertex"),h=o.getUniformLocation(s,"opacity");o.uniform1f(h,e.opacity),o.bindBuffer(o.ARRAY_BUFFER,l);for(var u=n.length,g=[],f=0;f<u;f++)for(var v=n[f].array,d=v.length/5,y=0;y<d;y++){var p=5*y;0!==y&&y!==d-1&&g.push(v[p],v[p+1],v[p+2],v[p+3],v[p+4]),g.push(v[p],v[p+1],v[p+2],v[p+3],v[p+4])}this.allVertices=g;var m=new Float32Array(g);return u=m.BYTES_PER_ELEMENT,o.bufferData(o.ARRAY_BUFFER,m,o.STATIC_DRAW),o.vertexAttribPointer(c,2,o.FLOAT,!1,5*u,0),o.enableVertexAttribArray(c),this.matrix=o.getUniformLocation(s,"matrix"),this.aPointSize=o.getAttribLocation(s,"pointSize"),t.set([2/i.width,0,0,0,0,-2/i.height,0,0,0,0,0,0,-1,1,0,1]),o.viewport(0,0,i.width,i.height),o.uniformMatrix4fv(this.matrix,!1,t),this.attachShaderVariables(u),a.redraw(),this},i.prototype.resetVertices=function(){this.allVertices=[],this.vertices=[];var t,e,r,i=this.vertices,o=this.settings,n=o.data.features,s=o.map,l=o.latitudeKey,c=o.longitudeKey,h=n.length,u=o.color,g=0;if(!u)throw new Error("color is not properly defined");for("function"==typeof u&&(e=u);g<h;g++){t=n[g],r=e?e(g,t):u;var f=new a.LineFeatureVertices({project:s.project.bind(s),latitudeKey:l,longitudeKey:c,color:r});f.fillFromCoordinates(t.geometry.coordinates),i.push(f)}return this},i.prototype.drawOnCanvas=function(t){if(!this.gl)return this;var e=this,r=e.gl,i=e.settings,o=e.canvas,a=e.mapMatrix,n=e.matrix,s=e.pixelsToWebGLMatrix,l=e.allVertices,c=e.vertices,h=i.weight,u=t.scale,g=t.offset,f=t.zoom,v=Math.max(f-4,4);if(r.clear(r.COLOR_BUFFER_BIT),r.viewport(0,0,o.width,o.height),s.set([2/o.width,0,0,0,0,-2/o.height,0,0,0,0,0,0,-1,1,0,1]),r.viewport(0,0,o.width,o.height),r.vertexAttrib1f(this.aPointSize,v),f>18)a.set(s).scaleMatrix(u).translateMatrix(-g.x,-g.y),r.uniformMatrix4fv(n,!1,a.array),r.drawArrays(r.LINES,0,l.length/5);else if("number"==typeof h)for(var d=-h;d<h;d+=.5)for(var y=-h;y<h;y+=.5)a.set(s).scaleMatrix(u).translateMatrix(-g.x+y/u,-g.y+d/u),r.uniformMatrix4fv(n,!1,a.array),r.drawArrays(r.LINES,0,l.length/5);else if("function"==typeof h)for(var p=0,m=i.data.features,x=0;x<c.length;x++){var L=c[x].vertexCount,w=h(x,m[x]);for(d=-w;d<w;d+=.5)for(y=-w;y<w;y+=.5)a.set(s).scaleMatrix(u).translateMatrix(-g.x+y/u,-g.y+d/u),r.uniformMatrix4fv(this.matrix,!1,a.array),r.drawArrays(r.LINES,p,L);p+=L}return this},i.tryClick=function(t,e){var r,o=!1,a=null,s=.1;console.log("tryClick Lines forEach"),i.instances.forEach(function(i){r=i.settings,i.active&&r.map===e&&r.click&&r.data.features.map(function(e){for(var r=1;r<e.geometry.coordinates.length;r++){var l=n.pDistance(t.latlng.lng,t.latlng.lat,e.geometry.coordinates[r-1][0],e.geometry.coordinates[r-1][1],e.geometry.coordinates[r][0],e.geometry.coordinates[r][1]);l<s&&(s=l,o=e,a=i)}})}),a&&a.settings.click(t,o)},i.inBounds=function(t,e){return e._northEast.lat>t.lat&&t.lat>e._southWest.lat&&e._northEast.lng>t.lng&&t.lng>e._southWest.lng},i.tryHover=function(t,e){var r,a,s=!1,l=null;console.log("tryHover Lines forEach"),i.instances.forEach(function(c){if(r=c.settings,a=r.sensitivityHover,c.active&&r.map===e&&r.hover){var h=o.geoJSON(r.data.features).getBounds();i.inBounds(t.latlng,h)&&r.data.features.map(function(e){for(var r=1;r<e.geometry.coordinates.length;r++){var i=n.pDistance(t.latlng.lng,t.latlng.lat,e.geometry.coordinates[r-1][0],e.geometry.coordinates[r-1][1],e.geometry.coordinates[r][0],e.geometry.coordinates[r][1]);i<a&&(a=i,s=e,l=c)}})}});var c=r.highlight;l?(null!==c&&(e.highlightLines&&(e.removeLayer(e.highlightLines),e.highlightLines.remove()),e.highlightLines=o.polyline(o.GeoJSON.coordsToLatLngs(s.geometry.coordinates),{color:c.color?c.color:"red",weight:c.weight?c.weight:3,opacity:c.opacity?c.opacity:1}),e.highlightLines.addTo(e)),l.settings.hover(t,s)):null!==c&&e.highlightLines&&(e.removeLayer(e.highlightLines),e.highlightLines.remove())},i.defaults=s,i.instances=[],i}(r.Base);exports.Lines=l;
},{"./base":"pR9a","./color":"lpyx","./leaflet-bindings":"IxA4","./line-feature-vertices":"GtdH","./utils":"UnXq"}],"IieH":[function(require,module,exports) {
"use strict";var t=this&&this.__extends||function(){var t=function(e,r){return(t=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var r in e)e.hasOwnProperty(r)&&(t[r]=e[r])})(e,r)};return function(e,r){function i(){this.constructor=e}t(e,r),e.prototype=null===r?Object.create(r):(i.prototype=r.prototype,new i)}}(),e=this&&this.__assign||function(){return(e=Object.assign||function(t){for(var e,r=1,i=arguments.length;r<i;r++)for(var o in e=arguments[r])Object.prototype.hasOwnProperty.call(e,o)&&(t[o]=e[o]);return t}).apply(this,arguments)};Object.defineProperty(exports,"__esModule",{value:!0}),exports.Points=void 0;var r=require("./base"),i=require("./color"),o=require("./leaflet-bindings"),n=require("./utils"),a={map:null,data:[],longitudeKey:null,latitudeKey:null,setupClick:null,setupHover:null,vertexShaderSource:null,fragmentShaderSource:null,eachVertex:null,click:null,hover:null,color:i.Color.random,opacity:.8,size:null,className:"",sensitivity:2,shaderVariables:{vertex:{type:"FLOAT",start:0,size:2,bytes:6},color:{type:"FLOAT",start:2,size:3,bytes:6},pointSize:{type:"FLOAT",start:5,size:1,bytes:6}}},s=function(r){function i(t){var n=r.call(this,t)||this;if(i.instances.push(n),n.settings=e(e({},i.defaults),t),!t.data)throw new Error('no "data" array setting defined');if(!t.map)throw new Error('no leaflet "map" object setting defined');n.active=!0;var a=n.settings.data;if(Array.isArray(a))n.dataFormat="Array";else{if("FeatureCollection"!==a.type)throw new Error("unhandled data type. Supported types are Array and GeoJson.FeatureCollection");n.dataFormat="GeoJson.FeatureCollection"}return n.settings.map.options.crs.projection.project!==o.Projection.SphericalMercator.project&&console.warn("layer designed for SphericalMercator, alternate detected"),n.setup().render(),n}return t(i,r),i.prototype.render=function(){this.resetVertices();var t=this,e=t.gl,r=t.settings,i=t.canvas,o=t.program,n=t.layer,a=t.vertices,s=t.pixelsToWebGLMatrix,l=this.matrix=e.getUniformLocation(o,"matrix"),c=e.getUniformLocation(o,"opacity"),u=e.createBuffer(),h=new Float32Array(a),p=h.BYTES_PER_ELEMENT;return s.set([2/i.width,0,0,0,0,-2/i.height,0,0,0,0,0,0,-1,1,0,1]),e.viewport(0,0,i.width,i.height),e.uniformMatrix4fv(l,!1,s),e.uniform1f(c,r.opacity),e.bindBuffer(e.ARRAY_BUFFER,u),e.bufferData(e.ARRAY_BUFFER,h,e.STATIC_DRAW),this.attachShaderVariables(p),n.redraw(),this},i.prototype.resetVertices=function(){this.latLngLookup={},this.allLatLngLookup=[],this.vertices=[];var t,e,r,i,n,a,s,l=this.vertices,c=this.latLngLookup,u=this.settings,h=u.latitudeKey,p=u.longitudeKey,g=u.data,f=u.map,d=u.eachVertex,y=this.settings,v=y.color,L=y.size;if(!v)throw new Error("color is not properly defined");if("function"==typeof v&&(t=v),!L)throw new Error("size is not properly defined");if("function"==typeof L&&(i=L),"Array"===this.dataFormat)for(var m=g.length,x=0;x<m;x++){s=(n=g[x])[h].toFixed(2)+"x"+n[p].toFixed(2),a=f.project(new o.LatLng(n[h],n[p]),0),e=t?t(x,n):v,r=i?i(x,n):L,l.push(a.x,a.y,e.r,e.g,e.b,r);var w={latLng:n,key:s,pixel:a,chosenColor:e,chosenSize:r};(c[s]||(c[s]=[])).push(w),this.allLatLngLookup.push(w),d&&d.call(this,n,a,r)}else if("GeoJson.FeatureCollection"===this.dataFormat)for(m=g.features.length,x=0;x<m;x++){var F=g.features[x];s=(n=F.geometry.coordinates)[h].toFixed(2)+"x"+n[p].toFixed(2),a=f.project(new o.LatLng(n[h],n[p]),0),e=t?t(x,F):v,r=i?i(x,n):L,l.push(a.x,a.y,e.r,e.g,e.b,r);w={latLng:n,key:s,pixel:a,chosenColor:e,chosenSize:r,feature:F};(c[s]||(c[s]=[])).push(w),this.allLatLngLookup.push(w),d&&d.call(this,n,a,r)}return this},i.prototype.pointSize=function(t){var e=this.settings,r=e.map,i=e.size,o="function"==typeof i?i(t,null):i,n=r.getZoom();return null===o?Math.max(n-4,1):o},i.prototype.drawOnCanvas=function(t){if(!this.gl)return this;var e=this,r=e.gl,i=e.canvas,o=e.settings,n=e.mapMatrix,a=e.matrix,s=e.pixelsToWebGLMatrix,l=e.vertices,c=o.map,u=t.offset,h=c.getZoom(),p=Math.pow(2,h);return s.set([2/i.width,0,0,0,0,-2/i.height,0,0,0,0,0,0,-1,1,0,1]),n.set(s).scaleMatrix(p).translateMatrix(-u.x,-u.y),r.clear(r.COLOR_BUFFER_BIT),r.viewport(0,0,i.width,i.height),r.uniformMatrix4fv(a,!1,n.array),r.drawArrays(r.POINTS,0,l.length/6),this},i.prototype.lookup=function(t){for(var e,r,o,n,a,s=t.lat+.03,l=t.lng+.03,c=[],u=t.lat-.03;u<=s;u+=.01)for(e=t.lng-.03;e<=l;e+=.01)if(a=u.toFixed(2)+"x"+e.toFixed(2),n=this.latLngLookup[a])for(r=0,o=n.length;r<o;r++)c.push(n[r]);var h=this.settings.map;return i.closest(t,c.length>0?c:this.allLatLngLookup,h)},i.closest=function(t,e,r){return e.length<1?null:e.reduce(function(e,i){return n.locationDistance(t,e.latLng,r)<n.locationDistance(t,i.latLng,r)?e:i})},i.tryClick=function(t,e){var r,a,s,l,c,u,h,p=[],g={};if(i.instances.forEach(function(r){a=r.settings,r.active&&a.map===e&&a.click&&(l=r.lookup(t.latlng),g[l.key]=r,p.push(l))}),!(p.length<1)&&a&&null!==(u=this.closest(t.latlng,p,e))&&(s=g[u.key])){var f=s.settings,d=f.latitudeKey,y=f.longitudeKey,v=f.sensitivity,L=f.click;return h=new o.LatLng(u.latLng[d],u.latLng[y]),c=e.latLngToLayerPoint(h),n.pointInCircle(c,t.layerPoint,u.chosenSize*v)?void 0===(r=L(t,u.feature||u.latLng,c))||r:void 0}},i.tryHover=function(t,e){var r,a,s,l,c,u,h,p=[],g={};if(i.instances.forEach(function(r){a=r.settings,r.active&&a.map===e&&a.hover&&(l=r.lookup(t.latlng),g[l.key]=r,p.push(l))}),!(p.length<1)&&a&&null!==(u=this.closest(t.latlng,p,e))&&(s=g[u.key])){var f=s.settings,d=f.latitudeKey,y=f.longitudeKey,v=f.sensitivity,L=f.hover;if(h=new o.LatLng(u.latLng[d],u.latLng[y]),c=e.latLngToLayerPoint(h),n.pointInCircle(c,t.layerPoint,u.chosenSize*v)){r=L(t,u.feature||u.latLng,c),console.log("Hovered Point found"),console.log("found"),console.log(u);var m=s.settings.highlight;return null!==m?(e.highlightPoints&&(e.removeLayer(e.highlightPoints),e.highlightPoints.remove()),e.highlightPoints=o.circle(u.latLng,{color:m.color?m.color:"red",fillColor:m.fillColor?m.fillColor:"red",radius:m.radius?m.radius:1e4/e._zoom,fillOpacity:m.fillOpacity?m.fillOpacity:1}),e.highlightPoints.addTo(e),void 0===r||r):void(null!==m&&e.highlightPoints&&(e.removeLayer(e.highlightPoints),e.highlightPoints.remove()))}}},i.instances=[],i.defaults=a,i.maps=[],i}(r.Base);exports.Points=s;
},{"./base":"pR9a","./color":"lpyx","./leaflet-bindings":"IxA4","./utils":"UnXq"}],"j8I8":[function(require,module,exports) {
"use strict";var t=this&&this.__extends||function(){var t=function(e,r){return(t=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var r in e)e.hasOwnProperty(r)&&(t[r]=e[r])})(e,r)};return function(e,r){function o(){this.constructor=e}t(e,r),e.prototype=null===r?Object.create(r):(o.prototype=r.prototype,new o)}}(),e=this&&this.__assign||function(){return(e=Object.assign||function(t){for(var e,r=1,o=arguments.length;r<o;r++)for(var i in e=arguments[r])Object.prototype.hasOwnProperty.call(e,i)&&(t[i]=e[i]);return t}).apply(this,arguments)},r=this&&this.__importDefault||function(t){return t&&t.__esModule?t:{default:t}};Object.defineProperty(exports,"__esModule",{value:!0}),exports.Shapes=exports.defaults=void 0;var o=r(require("earcut")),i=r(require("geojson-flatten")),n=r(require("polygon-lookup")),a=require("./base"),l=require("./color"),s=require("./leaflet-bindings");exports.defaults={map:null,data:[],longitudeKey:null,latitudeKey:null,setupClick:null,setupHover:null,vertexShaderSource:null,fragmentShaderSource:null,click:null,hover:null,color:l.Color.random,className:"",opacity:.5,shaderVariables:{color:{type:"FLOAT",start:2,size:3}}};var u=function(r){function a(t){var o=r.call(this,t)||this;if(a.instances.push(o),o.settings=e(e({},a.defaults),t),!t.data)throw new Error('no "data" array setting defined');if(!t.map)throw new Error('no leaflet "map" object setting defined');return o.polygonLookup=null,o.setup().render(),o}return t(a,r),a.prototype.render=function(){this.resetVertices();var t=this,e=t.pixelsToWebGLMatrix,r=t.settings,o=t.canvas,i=t.gl,n=t.layer,a=t.vertices,l=t.program,s=i.createBuffer(),u=new Float32Array(a),h=u.BYTES_PER_ELEMENT,c=i.getAttribLocation(l,"vertex"),g=i.getUniformLocation(l,"opacity");return i.uniform1f(g,r.opacity),i.bindBuffer(i.ARRAY_BUFFER,s),i.bufferData(i.ARRAY_BUFFER,u,i.STATIC_DRAW),i.vertexAttribPointer(c,2,i.FLOAT,!1,5*h,0),i.enableVertexAttribArray(c),this.matrix=i.getUniformLocation(l,"matrix"),e.set([2/o.width,0,0,0,0,-2/o.height,0,0,0,0,0,0,-1,1,0,1]),i.viewport(0,0,o.width,o.height),i.uniformMatrix4fv(this.matrix,!1,e),this.attachShaderVariables(h),n.redraw(),this},a.prototype.resetVertices=function(){this.vertices=[],this.polygonLookup=new n.default;var t,e,r,a,l,u,h,c,g,f,p,d,y=this.vertices,v=this.polygonLookup,m=this.settings,x=m.data,w=m.color,_=0;switch(x.type){case"Feature":v.loadFeatureCollection({type:"FeatureCollection",features:[x]}),r=i.default(x);break;case"MultiPolygon":v.loadFeatureCollection({type:"FeatureCollection",features:[{type:"Feature",properties:{id:"bar"},geometry:{coordinates:x.coordinates}}]}),r=i.default(x);break;default:v.loadFeatureCollection(x),r=x.features}if(c=r.length,!w)throw new Error("color is not properly defined");for("function"==typeof w&&(l=w);_<c;_++){a=r[_],g=[],u=l?l(_,a):w,h=(a.geometry||a).coordinates,p=o.default.flatten(h),f=o.default(p.vertices,p.holes,p.dimensions),d=h[0][0].length;for(var b=0,L=f.length;b<L;b++){if(e=f[b],"number"!=typeof p.vertices[0])throw new Error("unhandled polygon");g.push(p.vertices[e*d+m.longitudeKey],p.vertices[e*d+m.latitudeKey])}for(b=0,L=g.length;b<L;b)t=m.map.project(new s.LatLng(g[b++],g[b++]),0),y.push(t.x,t.y,u.r,u.g,u.b)}return this},a.prototype.drawOnCanvas=function(t){if(!this.gl)return this;var e=t.scale,r=t.offset,o=t.canvas,i=this.mapMatrix,n=this.pixelsToWebGLMatrix;n.set([2/o.width,0,0,0,0,-2/o.height,0,0,0,0,0,0,-1,1,0,1]),i.set(n).scaleMatrix(e).translateMatrix(-r.x,-r.y);var a=this.gl;return a.clear(a.COLOR_BUFFER_BIT),a.viewport(0,0,o.width,o.height),a.uniformMatrix4fv(this.matrix,!1,i.array),a.drawArrays(a.TRIANGLES,0,this.vertices.length/5),this},a.tryClick=function(t,e){var r,o,i;return a.instances.forEach(function(n){o=n.settings,n.active&&o.map===e&&o.click&&(i=n.polygonLookup.search(t.latlng.lng,t.latlng.lat))&&(r=o.click(t,i))}),void 0===r||r},a.tryHover=function(t,e){var r,o,i;return a.instances.forEach(function(n){if(o=n.settings,n.active&&o.map===e&&o.hover){i=n.polygonLookup.search(t.latlng.lng,t.latlng.lat);var a=o.highlight;i?(null!==a&&(e.highlightPolygon&&(e.removeLayer(e.highlightPolygon),e.highlightPolygon.remove()),console.log("Add highlighted Polygon"),e.highlightPolygon=s.geoJSON(i,{style:{color:"red",fill:!0,fillColor:"red",stroke:!0,opacity:1,weight:3}}),e.highlightPolygon.addTo(e)),r=o.hover(t,i)):null!==a&&e.highlightPolygon&&(e.removeLayer(e.highlightPolygon),e.highlightPolygon.remove())}}),void 0===r||r},a.instances=[],a.defaults=exports.defaults,a}(a.Base);exports.Shapes=u;
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
"use strict";var e=this&&this.__assign||function(){return(e=Object.assign||function(e){for(var t,r=1,i=arguments.length;r<i;r++)for(var n in t=arguments[r])Object.prototype.hasOwnProperty.call(t,n)&&(e[n]=t[n]);return e}).apply(this,arguments)},t=this&&this.__spreadArrays||function(){for(var e=0,t=0,r=arguments.length;t<r;t++)e+=arguments[t].length;var i=Array(e),n=0;for(t=0;t<r;t++)for(var s=arguments[t],o=0,u=s.length;o<u;o++,n++)i[n]=s[o];return i},r=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(exports,"__esModule",{value:!0});var i=require("./lines"),n=require("./points"),s=require("./shapes"),o=r(require("./shader/vertex/default.glsl")),u=r(require("./shader/fragment/dot.glsl")),a=r(require("./shader/fragment/point.glsl")),l=r(require("./shader/fragment/puck.glsl")),d=r(require("./shader/fragment/simple-circle.glsl")),h=r(require("./shader/fragment/square.glsl")),p=r(require("./shader/fragment/polygon.glsl")),c={vertex:o.default,fragment:{dot:u.default,point:a.default,puck:l.default,simpleCircle:d.default,square:h.default,polygon:p.default}},f=function(){function r(){this.longitudeKey=1,this.latitudeKey=0,this.maps=[],this.shader=c,this.Points=n.Points,this.Shapes=s.Shapes,this.Lines=i.Lines}return r.prototype.longitudeFirst=function(){return this.longitudeKey=0,this.latitudeKey=1,this},r.prototype.latitudeFirst=function(){return this.latitudeKey=0,this.longitudeKey=1,this},Object.defineProperty(r.prototype,"instances",{get:function(){return t(n.Points.instances,i.Lines.instances,s.Shapes.instances)},enumerable:!1,configurable:!0}),r.debounce=function(e,t,r){var i;return function(){var n=this,s=arguments,o=r&&!i;clearTimeout(i),i=setTimeout(function(){i=null,r||e.apply(n,s)},t),o&&e.apply(n,s)}},r.prototype.points=function(t){var r=this;return new this.Points(e({setupClick:y.setupClick.bind(this),setupHover:this.setupHover.bind(this),latitudeKey:y.latitudeKey,longitudeKey:y.longitudeKey,vertexShaderSource:function(){return r.shader.vertex},fragmentShaderSource:function(){return r.shader.fragment.point}},t))},r.prototype.shapes=function(t){var r=this;return new this.Shapes(e({setupClick:this.setupClick.bind(this),setupHover:this.setupHover.bind(this),latitudeKey:this.latitudeKey,longitudeKey:this.longitudeKey,vertexShaderSource:function(){return r.shader.vertex},fragmentShaderSource:function(){return r.shader.fragment.polygon}},t))},r.prototype.lines=function(t){var r=this;return new this.Lines(e({setupClick:this.setupClick.bind(this),setupHover:this.setupHover.bind(this),latitudeKey:this.latitudeKey,longitudeKey:this.longitudeKey,vertexShaderSource:function(){return r.shader.vertex},fragmentShaderSource:function(){return r.shader.fragment.polygon}},t))},r.prototype.setupClick=function(e){this.maps.indexOf(e)<0&&(this.maps.push(e),e.on("click",function(t){var r;return void 0!==(r=n.Points.tryClick(t,e))?r:void 0!==(r=i.Lines.tryClick(t,e))?r:void 0!==(r=s.Shapes.tryClick(t,e))?r:void 0}))},r.prototype.setupHover=function(e,t){console.log("setupHover start - index.ts"),this.maps.push(e),e.on("mousemove",r.debounce(function(t){var r;return void 0!==(r=n.Points.tryHover(t,e))?r:void 0!==(r=i.Lines.tryHover(t,e))?r:void 0!==(r=s.Shapes.tryHover(t,e))?r:void 0},t,!1))},r}(),y=new f;exports.default=module.exports=y,"undefined"!=typeof window&&window.L&&(window.L.glify=y,window.L.Glify=f);
},{"./lines":"ogHp","./points":"IieH","./shapes":"j8I8","./shader/vertex/default.glsl":"LmkB","./shader/fragment/dot.glsl":"hNM2","./shader/fragment/point.glsl":"XGkG","./shader/fragment/puck.glsl":"AY9x","./shader/fragment/simple-circle.glsl":"R6F0","./shader/fragment/square.glsl":"sqgp","./shader/fragment/polygon.glsl":"JKQp"}]},{},["QCba"], null)
//# sourceMappingURL=/glify.js.map