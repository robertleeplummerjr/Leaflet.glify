parcelRequire=function(e,r,t,n){var i,o="function"==typeof parcelRequire&&parcelRequire,u="function"==typeof require&&require;function f(t,n){if(!r[t]){if(!e[t]){var i="function"==typeof parcelRequire&&parcelRequire;if(!n&&i)return i(t,!0);if(o)return o(t,!0);if(u&&"string"==typeof t)return u(t);var c=new Error("Cannot find module '"+t+"'");throw c.code="MODULE_NOT_FOUND",c}p.resolve=function(r){return e[t][1][r]||r},p.cache={};var l=r[t]=new f.Module(t);e[t][0].call(l.exports,p,l,l.exports,this)}return r[t].exports;function p(e){return f(p.resolve(e))}}f.isParcelRequire=!0,f.Module=function(e){this.id=e,this.bundle=f,this.exports={}},f.modules=e,f.cache=r,f.parent=o,f.register=function(r,t){e[r]=[function(e,r){r.exports=t},{}]};for(var c=0;c<t.length;c++)try{f(t[c])}catch(e){i||(i=e)}if(t.length){var l=f(t[t.length-1]);"object"==typeof exports&&"undefined"!=typeof module?module.exports=l:"function"==typeof define&&define.amd?define(function(){return l}):n&&(this[n]=l)}if(parcelRequire=f,i)throw i;return f}({"UnXq":[function(require,module,exports) {
"use strict";function t(t,r){var e={};for(var n in r)r.hasOwnProperty(n)&&(e[n]=t.hasOwnProperty(n)?t[n]:r[n]);return e}function r(t,r){var e=Math.PI/180,n=4*Math.PI,o=Math.sin(t*e);return{x:(r+180)/360*256,y:256*(.5-Math.log((1+o)/(1-o))/n)}}function e(t,r,e){return(t.x-r.x)*(t.x-r.x)+(t.y-r.y)*(t.y-r.y)<=e*e}Object.defineProperty(exports,"__esModule",{value:!0}),exports.defaults=t,exports.latLonToPixel=r,exports.pointInCircle=e;
},{}],"EE0H":[function(require,module,exports) {
"use strict";var e=this&&this.__importStar||function(e){if(e&&e.__esModule)return e;var r={};if(null!=e)for(var t in e)Object.hasOwnProperty.call(e,t)&&(r[t]=e[t]);return r.default=e,r};Object.defineProperty(exports,"__esModule",{value:!0});var r=require("leaflet/src/layer/Layer"),t=require("leaflet/src/geometry/Point"),o=require("leaflet/src/core/Util"),i=e(require("leaflet/src/dom/DomUtil"));exports.latLng=window.L?window.L.latLng:r.latLng,exports.LatLng=window.L?window.L.LatLng:r.LatLng,exports.Layer=window.L?window.L.Layer:r.Layer,exports.Point=window.L?window.L.Point:t.Point,exports.setOptions=window.L?window.L.Util.setOptions:o.setOptions,exports.Browser=window.L?window.L.Browser:o.Browser,exports.DomUtil=window.L?window.L.DomUtil:i;var n=window.L?window.L.Util.requestAnimFrame:o.requestAnimFrame;exports.Util={requestAnimFrame:n};
},{}],"ls3R":[function(require,module,exports) {
"use strict";var t=this&&this.__extends||function(){var t=function(e,o){return(t=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var o in e)e.hasOwnProperty(o)&&(t[o]=e[o])})(e,o)};return function(e,o){function s(){this.constructor=e}t(e,o),e.prototype=null===o?Object.create(o):(s.prototype=o.prototype,new s)}}();Object.defineProperty(exports,"__esModule",{value:!0});var e=require("./leaflet-bindings"),o=function(o){function s(t,s){void 0===s&&(s={});var n=o.call(this)||this;return n._userDrawFunc=t,n._frame=null,n._redrawCallbacks=[],n.options=s,e.setOptions(n,s),n}return t(s,o),s.prototype.drawing=function(t){return this._userDrawFunc=t,this},s.prototype.params=function(t){return e.setOptions(this,t),this},s.prototype.redraw=function(t){return"function"==typeof t&&this._redrawCallbacks.push(t),null===this._frame&&(this._frame=e.Util.requestAnimFrame(this._redraw,this)),this},s.prototype.onAdd=function(t){this._map=t,this.canvas=this.canvas||document.createElement("canvas");var o=this._map.getSize(),s=this._map.options.zoomAnimation&&e.Browser.any3d;this.canvas.width=o.x,this.canvas.height=o.y,this.canvas.className="leaflet-zoom-"+(s?"animated":"hide"),t._panes.overlayPane.appendChild(this.canvas),t.on("moveend",this._reset,this),t.on("resize",this._resize,this),t.options.zoomAnimation&&e.Browser.any3d&&t.on("zoomanim",this._animateZoom,this),this._reset()},s.prototype.onRemove=function(t){t.getPanes().overlayPane.removeChild(this.canvas),t.off("moveend",this._reset,this),t.off("resize",this._resize,this),t.options.zoomAnimation&&t.off("zoomanim",this._animateZoom,this)},s.prototype.addTo=function(t){return t.addLayer(this),this},s.prototype._resize=function(t){this.canvas.width=t.newSize.x,this.canvas.height=t.newSize.y},s.prototype._reset=function(){var t=this._map.containerPointToLayerPoint([0,0]);e.DomUtil.setPosition(this.canvas,t),this._redraw()},s.prototype._redraw=function(){var t=this._map.getSize(),e=this._map.getBounds(),o=180*t.x/(20037508.34*(e.getEast()-e.getWest())),s=this._map.getZoom();for(this._userDrawFunc&&this._userDrawFunc(this,{canvas:this.canvas,bounds:e,size:t,zoomScale:o,zoom:s,options:this.options});this._redrawCallbacks.length>0;)this._redrawCallbacks.shift()(this);this._frame=null},s.prototype._animateZoom=function(t){var o=this._map.getZoomScale(t.zoom),s=e.Layer?this._map._latLngBoundsToNewLayerBounds(this._map.getBounds(),t.zoom,t.center).min:this._map._getCenterOffset(t.center)._multiplyBy(-o).subtract(this._map._getMapPanePos());e.DomUtil.setTransform(this.canvas,s,o)},s.prototype.setTransform=function(t,o,s){var n=o||new e.Point(0,0);t.style[e.DomUtil.TRANSFORM]=(e.Browser.ie3d?"translate("+n.x+"px,"+n.y+"px)":"translate3d("+n.x+"px,"+n.y+"px,0)")+(s?" scale("+s+")":"")},s}(e.Layer);function s(t,e){return new o(t,e)}exports.CanvasOverlay=o,exports.canvasOverlay=s;
},{"./leaflet-bindings":"EE0H"}],"eMRn":[function(require,module,exports) {
"use strict";Object.defineProperty(exports,"__esModule",{value:!0});var t=function(){function t(){this.array=new Float32Array(16)}return t.prototype.set=function(t,r){return this.array.set(t,r),this},t.prototype.translateMatrix=function(t,r){var e=this.array;return e[12]+=e[0]*t+e[4]*r,e[13]+=e[1]*t+e[5]*r,e[14]+=e[2]*t+e[6]*r,e[15]+=e[3]*t+e[7]*r,this},t.prototype.scaleMatrix=function(t){var r=this.array;return r[0]*=t,r[1]*=t,r[2]*=t,r[3]*=t,r[4]*=t,r[5]*=t,r[6]*=t,r[7]*=t,this},t}();exports.MapMatrix=t;
},{}],"pR9a":[function(require,module,exports) {
"use strict";Object.defineProperty(exports,"__esModule",{value:!0});var e=require("./canvasoverlay"),t=require("./map-matrix"),r=function(){function r(r){var a=this;this.pixelsToWebGLMatrix=new Float32Array(16),this.mapMatrix=new t.MapMatrix,this.active=!0,this.vertexShader=null,this.fragmentShader=null,this.program=null,this.matrix=null,this.verts=null;var s=Boolean(r.preserveDrawingBuffer),i=this.glLayer=new e.CanvasOverlay(function(){a.drawOnCanvas()}).addTo(r.map),n=this.canvas=i.canvas;n.width=n.clientWidth,n.height=n.clientHeight,n.style.position="absolute",r.className&&(n.className+=" "+r.className),this.gl=n.getContext("webgl",{preserveDrawingBuffer:s})||n.getContext("experimental-webgl",{preserveDrawingBuffer:s})}return r.prototype.setData=function(e){return this.settings.data=e,this},r.prototype.setup=function(){var e=this.settings;return e.click&&e.setupClick(e.map),this.setupVertexShader().setupFragmentShader().setupProgram()},r.prototype.setupVertexShader=function(){var e=this.gl,t=this.settings,r="function"==typeof t.vertexShaderSource?t.vertexShaderSource():t.vertexShaderSource,a=e.createShader(e.VERTEX_SHADER);return e.shaderSource(a,r),e.compileShader(a),this.vertexShader=a,this},r.prototype.setupFragmentShader=function(){var e=this.gl,t=this.settings,r="function"==typeof t.fragmentShaderSource?t.fragmentShaderSource():t.fragmentShaderSource,a=e.createShader(e.FRAGMENT_SHADER);return e.shaderSource(a,r),e.compileShader(a),this.fragmentShader=a,this},r.prototype.setupProgram=function(){var e=this.gl,t=e.createProgram();return e.attachShader(t,this.vertexShader),e.attachShader(t,this.fragmentShader),e.linkProgram(t),e.useProgram(t),e.blendFunc(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA),e.enable(e.BLEND),this.program=t,this},r.prototype.addTo=function(e){return this.glLayer.addTo(e||this.settings.map),this.active=!0,this.render()},r.prototype.remove=function(){return this.settings.map.removeLayer(this.glLayer),this.active=!1,this},r}();exports.Base=r;
},{"./canvasoverlay":"ls3R","./map-matrix":"eMRn"}],"IieH":[function(require,module,exports) {
"use strict";var t=this&&this.__extends||function(){var t=function(e,i){return(t=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var i in e)e.hasOwnProperty(i)&&(t[i]=e[i])})(e,i)};return function(e,i){function r(){this.constructor=e}t(e,i),e.prototype=null===i?Object.create(i):(r.prototype=i.prototype,new r)}}(),e=this&&this.__assign||function(){return(e=Object.assign||function(t){for(var e,i=1,r=arguments.length;i<r;i++)for(var n in e=arguments[i])Object.prototype.hasOwnProperty.call(e,n)&&(t[n]=e[n]);return t}).apply(this,arguments)};Object.defineProperty(exports,"__esModule",{value:!0});var i=require("./utils"),r=require("./leaflet-bindings"),n=require("./base"),s={map:null,data:[],longitudeKey:null,latitudeKey:null,closest:null,attachShaderVars:null,setupClick:null,vertexShaderSource:null,fragmentShaderSource:null,eachVertex:null,click:null,color:"random",opacity:.8,size:null,className:"",sensitivity:2,shaderVars:{vertex:{type:"FLOAT",start:0,size:2,bytes:6},color:{type:"FLOAT",start:2,size:3,bytes:6},pointSize:{type:"FLOAT",start:5,size:1,bytes:6}}},o=function(n){function o(t){var i=n.call(this,t)||this;if(o.instances.push(i),i.settings=e(e({},o.defaults),t),!t.data)throw new Error('no "data" array setting defined');if(!t.map)throw new Error('no leaflet "map" object setting defined');return i.active=!0,i.setup().render(),i}return t(o,n),o.prototype.render=function(){this.resetVertices();var t=this.gl,e=this.settings,i=this.canvas,r=this.program,n=this.glLayer,s=this.matrix=t.getUniformLocation(r,"matrix"),o=t.getUniformLocation(r,"opacity"),a=t.createBuffer(),l=new Float32Array(this.verts),u=l.BYTES_PER_ELEMENT;return this.pixelsToWebGLMatrix.set([2/i.width,0,0,0,0,-2/i.height,0,0,0,0,0,0,-1,1,0,1]),t.viewport(0,0,i.width,i.height),t.uniformMatrix4fv(s,!1,this.pixelsToWebGLMatrix),t.uniform1f(o,this.settings.opacity),t.bindBuffer(t.ARRAY_BUFFER,a),t.bufferData(t.ARRAY_BUFFER,l,t.STATIC_DRAW),null!==e.shaderVars&&this.settings.attachShaderVars(u,t,r,e.shaderVars),n.redraw(),this},o.prototype.resetVertices=function(){this.latLngLookup={},this.verts=[];var t,e,i,n,s,o,a=this.verts,l=this.settings,u=l.data,h=u.length,c=this.latLngLookup,p=l.latitudeKey,f=l.longitudeKey,g=l.color,d=l.size,y=0;if(null===g)throw new Error("color is not properly defined");if("function"==typeof g&&(t=g,g=void 0),null===d)throw new Error("size is not properly defined");for("function"==typeof d&&(e=d,d=void 0);y<h;y++)s=c[o=(i=u[y])[p].toFixed(2)+"x"+i[f].toFixed(2)],n=l.map.project(r.latLng(i[p],i[f]),0),void 0===s&&(s=c[o]=[]),s.push(i),t&&(g=t(y,i)),e&&(d=e(y,i)),a.push(n.x,n.y,g.r,g.g,g.b,d),null!==l.eachVertex&&l.eachVertex.call(this,i,n,g);return this},o.prototype.pointSize=function(t){var e=this.settings,i=e.map,r=e.size,n="function"==typeof r?r(t,null):r,s=i.getZoom();return null===n?Math.max(s-4,1):n},o.prototype.drawOnCanvas=function(){if(null==this.gl)return this;var t=this.gl,e=this.canvas,i=this.settings,n=i.map,s=n.getBounds(),o=new r.LatLng(s.getNorth(),s.getWest()),a=n.project(o,0),l=n.getZoom(),u=Math.pow(2,l),h=this.mapMatrix,c=this.pixelsToWebGLMatrix;return c.set([2/e.width,0,0,0,0,-2/e.height,0,0,0,0,0,0,-1,1,0,1]),h.set(c).scaleMatrix(u).translateMatrix(-a.x,-a.y),t.clear(t.COLOR_BUFFER_BIT),t.viewport(0,0,e.width,e.height),t.uniformMatrix4fv(this.matrix,!1,h.array),t.drawArrays(t.POINTS,0,i.data.length),this},o.prototype.lookup=function(t){for(var e,i,r,n,s,o=t.lat+.03,a=t.lng+.03,l=[],u=t.lat-.03;u<=o;u+=.01)for(e=t.lng-.03;e<=a;e+=.01)if(s=u.toFixed(2)+"x"+e.toFixed(2),n=this.latLngLookup[s])for(i=0,r=n.length;i<r;i++)l.push(n[i]);return this.settings.closest(t,0===l.length?this.settings.data.slice(0):l,this.settings.map)},o.tryClick=function(t,e){var n,s,a,l,u,h,c,p=[],f={};if(o.instances.forEach(function(i){s=i.settings,i.active&&s.map===e&&s.click&&(l=i.lookup(t.latlng),f[l]=i,p.push(l))}),!(p.length<1)&&s&&null!==(h=s.closest(t.latlng,p,e))&&(a=f[h])){c=r.latLng(h[s.latitudeKey],h[s.longitudeKey]),u=e.latLngToLayerPoint(c);var g="function"==typeof a.settings.size?a.settings.data.indexOf(h):null;return i.pointInCircle(u,t.layerPoint,a.pointSize(g)*a.settings.sensitivity)?void 0===(n=a.settings.click(t,h,u))||n:void 0}},o.instances=[],o.defaults=s,o.maps=[],o}(n.Base);exports.Points=o;
},{"./utils":"UnXq","./leaflet-bindings":"EE0H","./base":"pR9a"}],"j8I8":[function(require,module,exports) {
"use strict";var t=this&&this.__extends||function(){var t=function(e,r){return(t=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var r in e)e.hasOwnProperty(r)&&(t[r]=e[r])})(e,r)};return function(e,r){function o(){this.constructor=e}t(e,r),e.prototype=null===r?Object.create(r):(o.prototype=r.prototype,new o)}}(),e=this&&this.__assign||function(){return(e=Object.assign||function(t){for(var e,r=1,o=arguments.length;r<o;r++)for(var i in e=arguments[r])Object.prototype.hasOwnProperty.call(e,i)&&(t[i]=e[i]);return t}).apply(this,arguments)},r=this&&this.__importDefault||function(t){return t&&t.__esModule?t:{default:t}};Object.defineProperty(exports,"__esModule",{value:!0});var o=r(require("earcut")),i=r(require("polygon-lookup")),a=r(require("geojson-flatten")),n=require("./leaflet-bindings"),s=require("./base"),l={map:null,data:[],longitudeKey:null,latitudeKey:null,attachShaderVars:null,setupClick:null,vertexShaderSource:null,fragmentShaderSource:null,click:null,color:"random",className:"",opacity:.5,shaderVars:{color:{type:"FLOAT",start:2,size:3}}},u=function(r){function s(t){var o=r.call(this,t)||this;if(s.instances.push(o),o.settings=e(e({},s.defaults),t),!t.data)throw new Error('no "data" array setting defined');if(!t.map)throw new Error('no leaflet "map" object setting defined');return o.polygonLookup=null,o.setup().render(),o}return t(s,r),s.prototype.render=function(){this.resetVertices();var t=this.pixelsToWebGLMatrix,e=this.settings,r=this.canvas,o=this.gl,i=this.glLayer,a=this.verts,n=o.createBuffer(),s=new Float32Array(a),l=s.BYTES_PER_ELEMENT,u=this.program,c=o.getAttribLocation(u,"vertex"),h=o.getUniformLocation(u,"opacity");return o.uniform1f(h,this.settings.opacity),o.bindBuffer(o.ARRAY_BUFFER,n),o.bufferData(o.ARRAY_BUFFER,s,o.STATIC_DRAW),o.vertexAttribPointer(c,2,o.FLOAT,!1,5*l,0),o.enableVertexAttribArray(c),this.matrix=o.getUniformLocation(u,"matrix"),this.aPointSize=o.getAttribLocation(u,"pointSize"),t.set([2/r.width,0,0,0,0,-2/r.height,0,0,0,0,0,0,-1,1,0,1]),o.viewport(0,0,r.width,r.height),o.uniformMatrix4fv(this.matrix,!1,t),null!==e.shaderVars&&e.attachShaderVars(l,o,u,e.shaderVars),i.redraw(),this},s.prototype.resetVertices=function(){this.verts=[],this.polygonLookup=new i.default;var t,e,r,s,l,u,c,h,p,f,d,g=this.verts,y=this.polygonLookup,v=this.settings,m=v.data,w=v.color,_=0;switch(m.type){case"Feature":y.loadFeatureCollection({type:"FeatureCollection",features:[m]}),r=a.default(m);break;case"MultiPolygon":y.loadFeatureCollection({type:"FeatureCollection",features:[{type:"Feature",properties:{id:"bar"},geometry:{coordinates:m.coordinates}}]}),r=a.default(m);break;default:y.loadFeatureCollection(m),r=m.features}if(console.log(r,y),c=r.length,null===w)throw new Error("color is not properly defined");for("function"==typeof w&&(l=w,w=void 0);_<c;_++){s=r[_],h=[],l&&(w=l(_,s)),u=(s.geometry||s).coordinates,f=o.default.flatten(u),p=o.default(f.vertices,f.holes,f.dimensions),console.log(f,p),d=u[0][0].length;for(var x=0,b=p.length;x<b;x++){if(e=p[x],"number"!=typeof f.vertices[0])throw new Error("unhandled polygon");h.push(f.vertices[e*d+v.longitudeKey],f.vertices[e*d+v.latitudeKey])}for(x=0,b=h.length;x<b;x)t=v.map.project(n.latLng(h[x++],h[x++]),0),g.push(t.x,t.y,w.r,w.g,w.b)}return this},s.prototype.drawOnCanvas=function(){if(!this.gl)return this;var t=this.settings,e=this.canvas,r=t.map,o=Math.max(r.getZoom()-4,1),i=r.getBounds(),a=new n.LatLng(i.getNorth(),i.getWest()),s=Math.pow(2,r.getZoom()),l=r.project(a,0),u=this.mapMatrix,c=this.pixelsToWebGLMatrix;c.set([2/e.width,0,0,0,0,-2/e.height,0,0,0,0,0,0,-1,1,0,1]),u.set(c).scaleMatrix(s).translateMatrix(-l.x,-l.y);var h=this.gl;return h.clear(h.COLOR_BUFFER_BIT),h.viewport(0,0,e.width,e.height),h.vertexAttrib1f(this.aPointSize,o),h.uniformMatrix4fv(this.matrix,!1,u.array),h.drawArrays(h.TRIANGLES,0,this.verts.length/5),this},s.tryClick=function(t,e){var r,o,i;return s.instances.forEach(function(a){o=a.settings,a.active&&o.map===e&&o.click&&void 0!==(i=a.polygonLookup.search(t.latlng.lng,t.latlng.lat))&&(r=o.click(t,i))}),void 0===r||r},s.instances=[],s.defaults=l,s}(s.Base);exports.Shapes=u;
},{"./leaflet-bindings":"EE0H","./base":"pR9a"}],"GtdH":[function(require,module,exports) {
"use strict";Object.defineProperty(exports,"__esModule",{value:!0});var t=require("./leaflet-bindings"),e=function(){function e(t){Object.assign(this,t),this.vertexCount=0,this.array=[],this.length=0}return e.prototype.fillFromCoordinates=function(e){for(var r=this.color,i=0;i<e.length;i++)if(Array.isArray(e[i][0]))this.fillFromCoordinates(e[i]);else{var s=this.project(t.latLng(e[i][this.latitudeKey],e[i][this.longitudeKey]),0);this.push(s.x,s.y,r.r,r.g,r.b),0!==i&&i!==e.length-1&&(this.vertexCount+=1),this.vertexCount+=1}},e.prototype.push=function(){for(var t,e=[],r=0;r<arguments.length;r++)e[r]=arguments[r];(t=this.array).push.apply(t,e),this.length=this.array.length},e}();exports.LineFeatureVertices=e;
},{"./leaflet-bindings":"EE0H"}],"ogHp":[function(require,module,exports) {
"use strict";var t=this&&this.__extends||function(){var t=function(e,r){return(t=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var r in e)e.hasOwnProperty(r)&&(t[r]=e[r])})(e,r)};return function(e,r){function i(){this.constructor=e}t(e,r),e.prototype=null===r?Object.create(r):(i.prototype=r.prototype,new i)}}(),e=this&&this.__assign||function(){return(e=Object.assign||function(t){for(var e,r=1,i=arguments.length;r<i;r++)for(var a in e=arguments[r])Object.prototype.hasOwnProperty.call(e,a)&&(t[a]=e[a]);return t}).apply(this,arguments)};Object.defineProperty(exports,"__esModule",{value:!0});var r=require("./leaflet-bindings"),i=require("./base"),a=require("./line-feature-vertices"),n={map:null,data:[],longitudeKey:null,latitudeKey:null,attachShaderVars:null,setupClick:null,vertexShaderSource:null,fragmentShaderSource:null,click:null,color:"random",className:"",opacity:.5,weight:2,shaderVars:{color:{type:"FLOAT",start:2,size:3}}},s=function(i){function s(t){var r=i.call(this,t)||this;if(s.instances.push(r),r.settings=e(e({},s.defaults),t),!t.data)throw new Error('no "data" array setting defined');if(!t.map)throw new Error('no leaflet "map" object setting defined');return r.active=!0,r.allVertices=[],r.setup().render(),r}return t(s,i),s.prototype.render=function(){this.resetVertices();var t=this.pixelsToWebGLMatrix,e=this.settings,r=this.canvas,i=this.gl,a=this.glLayer,n=this.verts,s=i.createBuffer(),o=this.program,l=i.getAttribLocation(o,"vertex"),h=i.getUniformLocation(o,"opacity");i.uniform1f(h,this.settings.opacity),i.bindBuffer(i.ARRAY_BUFFER,s);for(var c=n.length,u=[],f=0;f<c;f++)for(var p=n[f].array,d=p.length/5,g=0;g<d;g++){var v=5*g;0!==g&&g!==d-1&&u.push(p[v],p[v+1],p[v+2],p[v+3],p[v+4]),u.push(p[v],p[v+1],p[v+2],p[v+3],p[v+4])}this.allVertices=u;var y=new Float32Array(u);return c=y.BYTES_PER_ELEMENT,i.bufferData(i.ARRAY_BUFFER,y,i.STATIC_DRAW),i.vertexAttribPointer(l,2,i.FLOAT,!1,5*c,0),i.enableVertexAttribArray(l),this.matrix=i.getUniformLocation(o,"matrix"),this.aPointSize=i.getAttribLocation(o,"pointSize"),t.set([2/r.width,0,0,0,0,-2/r.height,0,0,0,0,0,0,-1,1,0,1]),i.viewport(0,0,r.width,r.height),i.uniformMatrix4fv(this.matrix,!1,t),null!==e.shaderVars&&e.attachShaderVars(c,i,o,e.shaderVars),a.redraw(),this},s.prototype.resetVertices=function(){this.allVertices=[],this.verts=[];var t,e,r=this.verts,i=this.settings,n=i.data.features,s=i.map,o=i.latitudeKey,l=i.longitudeKey,h=n.length,c=i.color,u=0;if(null===c)throw new Error("color is not properly defined");for("function"==typeof c&&(e=c,c=void 0);u<h;u++){t=n[u],e&&(c=e(u,t));var f=new a.LineFeatureVertices({project:s.project.bind(s),latitudeKey:o,longitudeKey:l,color:c});f.fillFromCoordinates(t.geometry.coordinates),r.push(f)}return this},s.prototype.drawOnCanvas=function(){if(null==this.gl)return this;var t=this.gl,e=this.settings,i=this.canvas,a=e.map,n=e.weight,s=a.getZoom(),o=Math.max(s-4,4),l=a.getBounds(),h=new r.LatLng(l.getNorth(),l.getWest()),c=Math.pow(2,s),u=a.project(h,0),f=this.mapMatrix,p=this.pixelsToWebGLMatrix;if(t.clear(t.COLOR_BUFFER_BIT),t.viewport(0,0,i.width,i.height),p.set([2/i.width,0,0,0,0,-2/i.height,0,0,0,0,0,0,-1,1,0,1]),t.viewport(0,0,i.width,i.height),t.vertexAttrib1f(this.aPointSize,o),s>18)f.set(p).scaleMatrix(c).translateMatrix(-u.x,-u.y),t.uniformMatrix4fv(this.matrix,!1,f.array),t.drawArrays(t.LINES,0,this.allVertices.length/5);else if("number"==typeof n)for(var d=-n;d<n;d+=.5)for(var g=-n;g<n;g+=.5)f.set(p).scaleMatrix(c).translateMatrix(-u.x+g/c,-u.y+d/c),t.uniformMatrix4fv(this.matrix,!1,f.array),t.drawArrays(t.LINES,0,this.allVertices.length/5);else if("function"==typeof n)for(var v=0,y=this.settings.data.features,m=this.verts,x=0;x<m.length;x++){var w=m[x].vertexCount,_=n(x,y[x]);for(d=-_;d<_;d+=.5)for(g=-_;g<_;g+=.5)f.set(p).scaleMatrix(c).translateMatrix(-u.x+g/c,-u.y+d/c),t.uniformMatrix4fv(this.matrix,!1,f.array),t.drawArrays(t.LINES,v,w);v+=w}return this},s.tryClick=function(t,e){var r,i=!1,a=null,n=.1;s.instances.forEach(function(s){r=s.settings,s.active&&r.map===e&&r.click&&r.data.features.map(function(e){for(var r=1;r<e.geometry.coordinates.length;r++){var l=o(t.latlng.lng,t.latlng.lat,e.geometry.coordinates[r-1][0],e.geometry.coordinates[r-1][1],e.geometry.coordinates[r][0],e.geometry.coordinates[r][1]);l<n&&(n=l,i=e,a=s)}})}),a&&a.settings.click(t,i)},s.defaults=n,s.instances=[],s}(i.Base);function o(t,e,r,i,a,n){var s,o,l=a-r,h=n-i,c=l*l+h*h,u=-1;0!==c&&(u=((t-r)*l+(e-i)*h)/c),u<0?(s=r,o=i):u>1?(s=a,o=n):(s=r+u*l,o=i+u*h);var f=t-s,p=e-o;return Math.sqrt(f*f+p*p)}exports.Lines=s;
},{"./leaflet-bindings":"EE0H","./base":"pR9a","./line-feature-vertices":"GtdH"}],"lpyx":[function(require,module,exports) {
"use strict";Object.defineProperty(exports,"__esModule",{value:!0});var r={r:0,g:1,b:0},e={r:1,g:0,b:0},t={r:0,g:0,b:1},n={r:0,g:1,b:1},o={r:1,g:1,b:0},a={r:1,g:1,b:1},u={r:0,g:0,b:0},s={r:.5,g:.5,b:.5},c=function(){function a(){}return Object.defineProperty(a,"grey",{get:function(){return s},enumerable:!0,configurable:!0}),a.fromHex=function(r){return r.length<6?null:("#"===(r=r.toLowerCase())[0]&&(r=r.substring(1,r.length)),{r:parseInt(r[0]+r[1],16)/255,g:parseInt(r[2]+r[3],16)/255,b:parseInt(r[4]+r[5],16)/255})},a.prototype.random=function(){return{r:Math.random(),g:Math.random(),b:Math.random()}},a.prototype.pallet=function(){switch(Math.round(4*Math.random())){case 0:return r;case 1:return e;case 2:return t;case 3:return n;case 4:return o}},a}();exports.Color=c;
},{}],"LmkB":[function(require,module,exports) {
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
"use strict";var t=this&&this.__assign||function(){return(t=Object.assign||function(t){for(var e,r=1,i=arguments.length;r<i;r++)for(var n in e=arguments[r])Object.prototype.hasOwnProperty.call(e,n)&&(t[n]=e[n]);return t}).apply(this,arguments)},e=this&&this.__spreadArrays||function(){for(var t=0,e=0,r=arguments.length;e<r;e++)t+=arguments[e].length;var i=Array(t),n=0;for(e=0;e<r;e++)for(var o=arguments[e],s=0,a=o.length;s<a;s++,n++)i[n]=o[s];return i},r=this&&this.__importDefault||function(t){return t&&t.__esModule?t:{default:t}};Object.defineProperty(exports,"__esModule",{value:!0});var i=require("./points"),n=require("./shapes"),o=require("./lines"),s=require("./color"),a=r(require("./shader/vertex/default.glsl")),u=r(require("./shader/fragment/dot.glsl")),l=r(require("./shader/fragment/point.glsl")),h=r(require("./shader/fragment/puck.glsl")),d=r(require("./shader/fragment/simple-circle.glsl")),c=r(require("./shader/fragment/square.glsl")),p=r(require("./shader/fragment/polygon.glsl")),f={vertex:a.default,fragment:{dot:u.default,point:l.default,puck:h.default,simpleCircle:d.default,square:c.default,polygon:p.default}},y=function(){function r(){this.color=new s.Color,this.longitudeKey=1,this.latitudeKey=0,this.maps=[],this.shader=f,this.Points=i.Points,this.Shapes=n.Shapes,this.Lines=o.Lines}return r.prototype.longitudeFirst=function(){return this.longitudeKey=0,this.latitudeKey=1,this},r.prototype.latitudeFirst=function(){return this.latitudeKey=0,this.longitudeKey=1,this},Object.defineProperty(r.prototype,"instances",{get:function(){return e(i.Points.instances,n.Shapes.instances,o.Lines.instances)},enumerable:!0,configurable:!0}),r.prototype.points=function(e){var r=this;return new i.Points(t({setupClick:g.setupClick.bind(this),attachShaderVars:g.attachShaderVars.bind(this),latitudeKey:g.latitudeKey,longitudeKey:g.longitudeKey,vertexShaderSource:function(){return r.shader.vertex},fragmentShaderSource:function(){return r.shader.fragment.point},color:this.color.random,closest:this.closest.bind(this)},e))},r.prototype.shapes=function(e){var r=this;return new n.Shapes(t({setupClick:this.setupClick.bind(this),attachShaderVars:this.attachShaderVars.bind(this),latitudeKey:this.latitudeKey,longitudeKey:this.longitudeKey,vertexShaderSource:function(){return r.shader.vertex},fragmentShaderSource:function(){return r.shader.fragment.polygon},color:this.color.random},e))},r.prototype.lines=function(e){var r=this;return new o.Lines(t({setupClick:this.setupClick.bind(this),attachShaderVars:this.attachShaderVars.bind(this),latitudeKey:this.latitudeKey,longitudeKey:this.longitudeKey,vertexShaderSource:function(){return r.shader.vertex},fragmentShaderSource:function(){return r.shader.fragment.polygon},color:this.color.random},e))},r.prototype.setupClick=function(t){this.maps.indexOf(t)<0&&(this.maps.push(t),t.on("click",function(e){var r;return void 0!==(r=i.Points.tryClick(e,t))?r:void 0!==(r=o.Lines.tryClick(e,t))?r:void 0!==(r=n.Shapes.tryClick(e,t))?r:void 0}))},r.prototype.pointInCircle=function(t,e,r){return(t.x-e.x)*(t.x-e.x)+(t.y-e.y)*(t.y-e.y)<=r*r},r.prototype.attachShaderVars=function(t,e,r,i){for(var n in i)if(i.hasOwnProperty(n)){var o=i[n],s=e.getAttribLocation(r,n);if(s<0)throw console.log(n,o),new Error("shader variable "+n+" not found");e.vertexAttribPointer(s,o.size,e[o.type],!!o.normalize,t*(o.bytes||5),t*o.start),e.enableVertexAttribArray(s)}return this},r.prototype.debugPoint=function(t){var e=document.createElement("div"),r=e.style,i=t.x,n=t.y;return r.left=i+"px",r.top=n+"px",r.width="10px",r.height="10px",r.position="absolute",r.backgroundColor="#"+(16777215*Math.random()<<0).toString(16),document.body.appendChild(e),this},r.prototype.closest=function(t,e,r){var i=this;return e.length<1?null:e.reduce(function(e,n){return i.locationDistance(t,e,r)<i.locationDistance(t,n,r)?e:n})},r.prototype.vectorDistance=function(t,e){return Math.sqrt(t*t+e*e)},r.prototype.locationDistance=function(t,e,r){var i=r.latLngToLayerPoint(t),n=r.latLngToLayerPoint(e),o=i.x-n.x,s=i.y-n.y;return this.vectorDistance(o,s)},r}(),g=new y;exports.default=module.exports=g,"undefined"!=typeof window&&window.L&&(window.L.glify=g,window.L.Glify=y);
},{"./points":"IieH","./shapes":"j8I8","./lines":"ogHp","./color":"lpyx","./shader/vertex/default.glsl":"LmkB","./shader/fragment/dot.glsl":"hNM2","./shader/fragment/point.glsl":"XGkG","./shader/fragment/puck.glsl":"AY9x","./shader/fragment/simple-circle.glsl":"R6F0","./shader/fragment/square.glsl":"sqgp","./shader/fragment/polygon.glsl":"JKQp"}]},{},["QCba"], null)
//# sourceMappingURL=/glify.js.map