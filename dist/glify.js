parcelRequire=function(e,r,t,n){var i,o="function"==typeof parcelRequire&&parcelRequire,u="function"==typeof require&&require;function f(t,n){if(!r[t]){if(!e[t]){var i="function"==typeof parcelRequire&&parcelRequire;if(!n&&i)return i(t,!0);if(o)return o(t,!0);if(u&&"string"==typeof t)return u(t);var c=new Error("Cannot find module '"+t+"'");throw c.code="MODULE_NOT_FOUND",c}p.resolve=function(r){return e[t][1][r]||r},p.cache={};var l=r[t]=new f.Module(t);e[t][0].call(l.exports,p,l,l.exports,this)}return r[t].exports;function p(e){return f(p.resolve(e))}}f.isParcelRequire=!0,f.Module=function(e){this.id=e,this.bundle=f,this.exports={}},f.modules=e,f.cache=r,f.parent=o,f.register=function(r,t){e[r]=[function(e,r){r.exports=t},{}]};for(var c=0;c<t.length;c++)try{f(t[c])}catch(e){i||(i=e)}if(t.length){var l=f(t[t.length-1]);"object"==typeof exports&&"undefined"!=typeof module?module.exports=l:"function"==typeof define&&define.amd?define(function(){return l}):n&&(this[n]=l)}if(parcelRequire=f,i)throw i;return f}({"eMRn":[function(require,module,exports) {
"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.MapMatrix=void 0;class t{constructor(){this.array=new Float32Array(16)}setSize(t,r,s){return this.array.set([2/t,0,0,0,0,-2/r,0,0,0,0,0,0,-1,1,0,1]),this}translateMatrix(t,r){const{array:s}=this;return s[12]+=s[0]*t+s[4]*r,s[13]+=s[1]*t+s[5]*r,s[14]+=s[2]*t+s[6]*r,s[15]+=s[3]*t+s[7]*r,this}scaleMatrix(t){const{array:r}=this;return r[0]*=t,r[1]*=t,r[2]*=t,r[3]*=t,r[4]*=t,r[5]*=t,r[6]*=t,r[7]*=t,this}}exports.MapMatrix=t;
},{}],"OTlA":[function(require,module,exports) {
"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.CanvasOverlay=void 0;var t=require("leaflet");class e extends t.Layer{constructor(t,e){super(),this._userDrawFunc=t,this._frame=null,this._redrawCallbacks=[],this._pane=e}drawing(t){return this._userDrawFunc=t,this}params(e){return t.Util.setOptions(this,e),this}redraw(e){return"function"==typeof e&&this._redrawCallbacks.push(e),null===this._frame&&(this._frame=t.Util.requestAnimFrame(this._redraw,this)),this}onAdd(e){this._map=e,this.canvas=this.canvas||document.createElement("canvas");const s=e.getSize(),a=e.options.zoomAnimation&&t.Browser.any3d;return this.canvas.width=s.x,this.canvas.height=s.y,this.canvas.className="leaflet-zoom-"+(a?"animated":"hide"),e._panes[this._pane].appendChild(this.canvas),e.on("moveend",this._reset,this),e.on("resize",this._resize,this),a&&e.on("zoomanim",t.Layer?this._animateZoom:this._animateZoomNoLayer,this),this._reset(),this}onRemove(e){return e.getPanes()[this._pane].removeChild(this.canvas),e.off("moveend",this._reset,this),e.off("resize",this._resize,this),e.options.zoomAnimation&&t.Browser.any3d&&e.off("zoomanim",t.Layer?this._animateZoom:this._animateZoomNoLayer,this),this}addTo(t){return t.addLayer(this),this}_resize(t){this.canvas.width=t.newSize.x,this.canvas.height=t.newSize.y}_reset(){const e=this._map.containerPointToLayerPoint([0,0]);t.DomUtil.setPosition(this.canvas,e),this._redraw()}_redraw(){const{_map:e,canvas:s}=this,a=e.getSize(),o=e.getBounds(),i=180*a.x/(20037508.34*(o.getEast()-o.getWest())),n=e.getZoom(),r=new t.LatLng(o.getNorth(),o.getWest()),h=this._unclampedProject(r,0);for(this._userDrawFunc&&this._userDrawFunc({bounds:o,canvas:s,offset:h,scale:Math.pow(2,n),size:a,zoomScale:i,zoom:n});this._redrawCallbacks.length>0;)this._redrawCallbacks.shift()(this);this._frame=null}_animateZoom(e){const{_map:s}=this,a=s.getZoomScale(e.zoom,s.getZoom()),o=this._unclampedLatLngBoundsToNewLayerBounds(s.getBounds(),e.zoom,e.center).min;t.DomUtil.setTransform(this.canvas,o,a)}_animateZoomNoLayer(e){const{_map:s}=this,a=s.getZoomScale(e.zoom,s.getZoom()),o=s._getCenterOffset(e.center)._multiplyBy(-a).subtract(s._getMapPanePos());t.DomUtil.setTransform(this.canvas,o,a)}_unclampedProject(e,s){const{crs:a}=this._map.options,{R:o}=a.projection,i=Math.PI/180,n=e.lat,r=Math.sin(n*i),h=new t.Point(o*e.lng*i,o*Math.log((1+r)/(1-r))/2),m=a.scale(s);return a.transformation._transform(h,m)}_unclampedLatLngBoundsToNewLayerBounds(e,s,a){const o=this._map._getNewPixelOrigin(a,s);return new t.Bounds([this._unclampedProject(e.getSouthWest(),s).subtract(o),this._unclampedProject(e.getNorthWest(),s).subtract(o),this._unclampedProject(e.getSouthEast(),s).subtract(o),this._unclampedProject(e.getNorthEast(),s).subtract(o)])}}exports.CanvasOverlay=e;
},{}],"pR9a":[function(require,module,exports) {
"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.Base=void 0;var t=require("./map-matrix"),e=require("./canvas-overlay");class r{constructor(r){this.buffers={},this.attributeLocations={},this.uniformLocations={},r.pane||(r.pane="overlayPane"),this.mapMatrix=new t.MapMatrix,this.active=!0,this.vertexShader=null,this.fragmentShader=null,this.program=null,this.matrix=null,this.vertices=null,this.vertexLines=null;const s=Boolean(r.preserveDrawingBuffer),a=this.layer=new e.CanvasOverlay(t=>this.drawOnCanvas(t),r.pane).addTo(r.map),i=this.canvas=a.canvas;i.width=i.clientWidth,i.height=i.clientHeight,i.style.position="absolute",r.className&&(i.className+=" "+r.className),this.gl=i.getContext("webgl2",{preserveDrawingBuffer:s})||i.getContext("webgl",{preserveDrawingBuffer:s})||i.getContext("experimental-webgl",{preserveDrawingBuffer:s})}attachShaderVariables(t){if(0===this.getShaderVariableCount())return this;const{gl:e,settings:r}=this,{shaderVariables:s}=r;let a=0;for(const i in s){if(!s.hasOwnProperty(i))continue;const r=s[i],n=this.getAttributeLocation(i);if(n<0)throw new Error("shader variable "+i+" not found");e.vertexAttribPointer(n,r.size,e[r.type],!!r.normalize,this.bytes*t,a*t),a+=r.size,e.enableVertexAttribArray(n)}return this}getShaderVariableCount(){return Object.keys(this.settings.shaderVariables).length}setData(t){return this.settings.data=t,this}setup(){const t=this.settings;return t.click&&t.setupClick(t.map),t.hover&&t.setupHover(t.map,t.hoverWait),this.setupVertexShader().setupFragmentShader().setupProgram()}setupVertexShader(){const t=this.gl,e=this.settings,r="function"==typeof e.vertexShaderSource?e.vertexShaderSource():e.vertexShaderSource,s=t.createShader(t.VERTEX_SHADER);return t.shaderSource(s,r),t.compileShader(s),this.vertexShader=s,this}setupFragmentShader(){const t=this.gl,e=this.settings,r="function"==typeof e.fragmentShaderSource?e.fragmentShaderSource():e.fragmentShaderSource,s=t.createShader(t.FRAGMENT_SHADER);return t.shaderSource(s,r),t.compileShader(s),this.fragmentShader=s,this}setupProgram(){const t=this.gl,e=t.createProgram();return t.attachShader(e,this.vertexShader),t.attachShader(e,this.fragmentShader),t.linkProgram(e),t.useProgram(e),t.blendFunc(t.SRC_ALPHA,t.ONE_MINUS_SRC_ALPHA),t.enable(t.BLEND),this.program=e,this}addTo(t){return this.layer.addTo(t||this.settings.map),this.active=!0,this.render()}remove(t){if(void 0===t)this.settings.map.removeLayer(this.layer),this.active=!1;else{const e=this.settings.data.features||this.settings.data;"number"==typeof(t=t instanceof Array?t:[t])&&(t=[t]),t.sort().reverse(),t.forEach(t=>{e.splice(t,1)}),this.render()}return this}update(t,e){return(this.settings.data.features||this.settings.data)[e]=t,this.render(),this}getBuffer(t){return this.buffers[t]||(this.buffers[t]=this.gl.createBuffer()),this.buffers[t]}getAttributeLocation(t){return void 0!==this.attributeLocations[t]?this.attributeLocations[t]:this.attributeLocations[t]=this.gl.getAttribLocation(this.program,t)}getUniformLocation(t){return void 0!==this.uniformLocations[t]?this.uniformLocations[t]:this.uniformLocations[t]=this.gl.getUniformLocation(this.program,t)}}exports.Base=r;
},{"./map-matrix":"eMRn","./canvas-overlay":"OTlA"}],"lpyx":[function(require,module,exports) {
"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.Color=void 0;const r={r:0,g:1,b:0,a:1},t={r:1,g:0,b:0,a:1},a={r:0,g:0,b:1,a:1},e={r:0,g:1,b:1,a:1},n={r:1,g:1,b:0,a:1},s={r:1,g:1,b:1,a:1},o={r:0,g:0,b:0,a:1},g={r:.5,g:.5,b:.5,a:1};class u{static get grey(){return g}static fromHex(r){if(r.length<6)return null;return"#"===(r=r.toLowerCase())[0]&&(r=r.substring(1,r.length)),{r:parseInt(r[0]+r[1],16)/255,g:parseInt(r[2]+r[3],16)/255,b:parseInt(r[4]+r[5],16)/255,a:1}}static random(){return{r:Math.random(),g:Math.random(),b:Math.random(),a:Math.random()}}static pallet(){switch(Math.round(4*Math.random())){case 0:return r;case 1:return t;case 2:return a;case 3:return e;case 4:return n}}}exports.Color=u;
},{}],"GtdH":[function(require,module,exports) {
"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.LineFeatureVertices=void 0;var t=require("leaflet");class e{constructor(t){this.settings=t,this.vertexCount=0,this.array=[],this.length=0}fillFromCoordinates(e){const{color:r,opacity:s,project:i,latitudeKey:o,longitudeKey:n}=this.settings;for(let a=0;a<e.length;a++){if(Array.isArray(e[a][0])){this.fillFromCoordinates(e[a]);continue}const h=i(new t.LatLng(e[a][o],e[a][n]),0);this.push(h.x,h.y,r.r,r.g,r.b,r.a||s),0!==a&&a!==e.length-1&&(this.vertexCount+=1),this.vertexCount+=1}}push(...t){this.array.push(...t),this.length=this.array.length}}exports.LineFeatureVertices=e;
},{}],"UnXq":[function(require,module,exports) {
"use strict";function t(t,n){const o={};for(const e in n)n.hasOwnProperty(e)&&(o[e]=t.hasOwnProperty(e)?t[e]:n[e]);return o}function n(t,n){const o=Math.PI/180,e=4*Math.PI,r=Math.sin(t*o);return{x:(n+180)/360*256,y:256*(.5-Math.log((1+r)/(1-r))/e)}}function o(t,n,o){return(t.x-n.x)*(t.x-n.x)+(t.y-n.y)*(t.y-n.y)<=o*o}function e(t,n,o,e,r,s){const i=r-o,u=s-e,a=i*i+u*u;let l,c,p=-1;0!==a&&(p=((t-o)*i+(n-e)*u)/a),p<0?(l=o,c=e):p>1?(l=r,c=s):(l=o+p*i,c=e+p*u);let x=t-l,h=n-c;return Math.sqrt(x*x+h*h)}function r(t,n){return Math.sqrt(t*t+n*n)}function s(t,n,o){const e=o.latLngToLayerPoint(t),s=o.latLngToLayerPoint(n);return r(e.x-s.x,e.y-s.y)}function i(t){const n=document.createElement("div"),o=n.style,e=t.x,r=t.y;o.left=e+"px",o.top=r+"px",o.width="10px",o.height="10px",o.position="absolute",o.backgroundColor="#"+(16777215*Math.random()<<0).toString(16),document.body.appendChild(n)}function u(t,n,o){let e;return function(){let r=this,s=arguments,i=o&&!e;clearTimeout(e),e=setTimeout(function(){e=null,o||t.apply(r,s)},n),i&&t.apply(r,s)}}function a(t,n){return n._northEast.lat>t.lat&&t.lat>n._southWest.lat&&n._northEast.lng>t.lng&&t.lng>n._southWest.lng}Object.defineProperty(exports,"__esModule",{value:!0}),exports.defaults=t,exports.latLonToPixel=n,exports.pointInCircle=o,exports.pDistance=e,exports.vectorDistance=r,exports.locationDistance=s,exports.debugPoint=i,exports.debounce=u,exports.inBounds=a;
},{}],"ogHp":[function(require,module,exports) {
"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.Lines=void 0;var t=require("./base"),e=require("./color"),r=require("leaflet"),i=require("./line-feature-vertices"),s=require("./utils");const a={map:null,data:[],longitudeKey:null,latitudeKey:null,setupClick:null,setupHover:null,vertexShaderSource:null,fragmentShaderSource:null,click:null,hover:null,color:e.Color.random,className:"",opacity:.5,weight:2,sensitivity:.1,sensitivityHover:.03,shaderVariables:{color:{type:"FLOAT",start:2,size:4}}};class o extends t.Base{constructor(t){if(super(t),this.bytes=6,o.instances.push(this),this.settings=Object.assign(Object.assign({},o.defaults),t),!t.data)throw new Error('no "data" array setting defined');if(!t.map)throw new Error('no leaflet "map" object setting defined');this.active=!0,this.allVertices=[],this.setup().render()}render(){this.resetVertices();const{canvas:t,gl:e,layer:r,vertices:i,settings:s,mapMatrix:a}=this,o=this.getBuffer("vertex"),n=this.getAttributeLocation("vertex"),l=this.getUniformLocation("opacity");e.uniform1f(l,s.opacity),e.bindBuffer(e.ARRAY_BUFFER,o);let c=i.length;const h=[];for(let f=0;f<c;f++){const t=i[f].array,e=t.length/this.bytes;for(let r=0;r<e;r++){const i=r*this.bytes;0!==r&&r!==e-1&&h.push(t[i],t[i+1],t[i+2],t[i+3],t[i+4],t[i+5]),h.push(t[i],t[i+1],t[i+2],t[i+3],t[i+4],t[i+5])}}this.allVertices=h;const u=new Float32Array(h);return c=u.BYTES_PER_ELEMENT,e.bufferData(e.ARRAY_BUFFER,u,e.STATIC_DRAW),e.vertexAttribPointer(n,2,e.FLOAT,!1,c*this.bytes,0),e.enableVertexAttribArray(n),this.matrix=this.getUniformLocation("matrix"),this.aPointSize=this.getAttributeLocation("pointSize"),a.setSize(t.width,t.height),e.viewport(0,0,t.width,t.height),e.uniformMatrix4fv(this.matrix,!1,a.array),this.attachShaderVariables(c),r.redraw(),this}resetVertices(){this.allVertices=[],this.vertices=[];const t=this.vertices,e=this.settings,r=e.data.features,s=e.map,a=e.latitudeKey,o=e.longitudeKey,n=r.length;let l,c,h,{color:u,opacity:f}=e,d=0;if(!u)throw new Error("color is not properly defined");for("function"==typeof u&&(c=u);d<n;d++){l=r[d],h=c?c(d,l):u;const e=new i.LineFeatureVertices({project:s.project.bind(s),latitudeKey:a,longitudeKey:o,color:h,opacity:f});e.fillFromCoordinates(l.geometry.coordinates),t.push(e)}return this}drawOnCanvas(t){if(!this.gl)return this;const{gl:e,settings:r,canvas:i,mapMatrix:s,matrix:a,allVertices:o,vertices:n}=this,{weight:l}=r,{scale:c,offset:h,zoom:u}=t,f=Math.max(u-4,4);if(e.clear(e.COLOR_BUFFER_BIT),e.viewport(0,0,i.width,i.height),e.viewport(0,0,i.width,i.height),e.vertexAttrib1f(this.aPointSize,f),s.setSize(i.width,i.height).scaleMatrix(c),u>18)s.translateMatrix(-h.x,-h.y),e.uniformMatrix4fv(a,!1,s.array),e.drawArrays(e.LINES,0,o.length/this.bytes);else if("number"==typeof l)for(let d=-l;d<l;d+=.5)for(let t=-l;t<l;t+=.5)s.translateMatrix(-h.x+t/c,-h.y+d/c),e.uniformMatrix4fv(a,!1,s.array),e.drawArrays(e.LINES,0,o.length/this.bytes);else if("function"==typeof l){let t=0;const i=r.data.features;for(let r=0;r<n.length;r++){const a=n[r].vertexCount,o=l(r,i[r]);for(let r=-o;r<o;r+=.5)for(let i=-o;i<o;i+=.5)s.translateMatrix(-h.x+i/c,-h.y+r/c),e.uniformMatrix4fv(this.matrix,!1,s.array),e.drawArrays(e.LINES,t,a);t+=a}}return this}static tryClick(t,e){let r,i,a=!1,n=null;o.instances.forEach(function(o){i=o.settings,r=i.sensitivity;const{latitudeKey:l,longitudeKey:c}=i;o.active&&i.map===e&&i.click&&i.data.features.map(e=>{for(let i=1;i<e.geometry.coordinates.length;i++){let h=(0,s.pDistance)(t.latlng.lng,t.latlng.lat,e.geometry.coordinates[i-1][c],e.geometry.coordinates[i-1][l],e.geometry.coordinates[i][c],e.geometry.coordinates[i][l]);h<r&&(r=h,a=e,n=o)}})}),n&&n.settings.click(t,a)}static tryHover(t,e){let i,a,n=!1,l=null;o.instances.forEach(function(o){i=o.settings,a=i.sensitivityHover;const{latitudeKey:c,longitudeKey:h}=i;if(!o.active)return;if(i.map!==e)return;if(!i.hover)return;let u=(0,r.geoJSON)(i.data.features).getBounds();(0,s.inBounds)(t.latlng,u)&&i.data.features.map(e=>{for(let r=1;r<e.geometry.coordinates.length;r++){let i=(0,s.pDistance)(t.latlng.lng,t.latlng.lat,e.geometry.coordinates[r-1][h],e.geometry.coordinates[r-1][c],e.geometry.coordinates[r][h],e.geometry.coordinates[r][c]);i<a&&(a=i,n=e,l=o)}})}),l&&l.settings.hover(t,n)}}exports.Lines=o,o.defaults=a,o.instances=[];
},{"./base":"pR9a","./color":"lpyx","./line-feature-vertices":"GtdH","./utils":"UnXq"}],"IieH":[function(require,module,exports) {
"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.Points=void 0;var t=require("./base"),e=require("./color"),i=require("leaflet"),r=require("./utils");const s={map:null,data:[],longitudeKey:null,latitudeKey:null,setupClick:null,setupHover:null,vertexShaderSource:null,fragmentShaderSource:null,eachVertex:null,click:null,hover:null,color:e.Color.random,opacity:.8,size:null,className:"",sensitivity:2,sensitivityHover:.03,shaderVariables:{vertex:{type:"FLOAT",start:0,size:2},color:{type:"FLOAT",start:2,size:4},pointSize:{type:"FLOAT",start:6,size:1}}};class n extends t.Base{constructor(t){if(super(t),this.bytes=7,n.instances.push(this),this.settings=Object.assign(Object.assign({},n.defaults),t),!t.data)throw new Error('no "data" array setting defined');if(!t.map)throw new Error('no leaflet "map" object setting defined');this.active=!0;const{data:e}=this.settings;if(Array.isArray(e))this.dataFormat="Array";else{if("FeatureCollection"!==e.type)throw new Error("unhandled data type. Supported types are Array and GeoJson.FeatureCollection");this.dataFormat="GeoJson.FeatureCollection"}this.settings.map.options.crs.projection.project!==i.Projection.SphericalMercator.project&&console.warn("layer designed for SphericalMercator, alternate detected"),this.setup().render()}render(){this.resetVertices();const{gl:t,canvas:e,layer:i,vertices:r,mapMatrix:s}=this,n=this.matrix=this.getUniformLocation("matrix"),a=this.getBuffer("vertices"),o=this.typedVertices=new Float32Array(r),l=o.BYTES_PER_ELEMENT;return s.setSize(e.width,e.height),t.viewport(0,0,e.width,e.height),t.uniformMatrix4fv(n,!1,s.array),t.bindBuffer(t.ARRAY_BUFFER,a),t.bufferData(t.ARRAY_BUFFER,o,t.STATIC_DRAW),this.attachShaderVariables(l),i.redraw(),this}getPointLookup(t){return this.latLngLookup[t]||(this.latLngLookup[t]=[])}addLookup(t){return this.getPointLookup(t.key).push(t),this.allLatLngLookup.push(t),this}resetVertices(){this.latLngLookup={},this.allLatLngLookup=[],this.vertices=[];const{vertices:t,settings:e}=this,{latitudeKey:r,longitudeKey:s,data:n,map:a,eachVertex:o,color:l,size:c,opacity:u}=e;let h,p,g,d,f,y,L;if(!l)throw new Error("color is not properly defined");if("function"==typeof l&&(h=l),!c)throw new Error("size is not properly defined");if("function"==typeof c&&(d=c),"Array"===this.dataFormat){const e=n.length;for(let v=0;v<e;v++)L=(f=n[v])[r].toFixed(2)+"x"+f[s].toFixed(2),y=a.project(new i.LatLng(f[r],f[s]),0),p=h?h(v,f):l,p=Object.assign(Object.assign({},p),{a:p.a||u}),g=d?d(v,f):c,t.push(y.x,y.y,p.r,p.g,p.b,p.a,g),this.addLookup({latLng:f,key:L,pixel:y,chosenColor:p,chosenSize:g}),o&&o.call(this,f,y,g)}else if("GeoJson.FeatureCollection"===this.dataFormat){const e=n.features.length;for(let v=0;v<e;v++){const e=n.features[v];L=(f=e.geometry.coordinates)[r].toFixed(2)+"x"+f[s].toFixed(2),y=a.project(new i.LatLng(f[r],f[s]),0),p=h?h(v,e):l,p=Object.assign(Object.assign({},p),{a:p.a||u}),g=d?d(v,f):c,t.push(y.x,y.y,p.r,p.g,p.b,p.a,g),this.addLookup({latLng:f,key:L,pixel:y,chosenColor:p,chosenSize:g,feature:e}),o&&o.call(this,f,y,g)}}return this}pointSize(t){const{map:e,size:i}=this.settings,r="function"==typeof i?i(t,null):i,s=e.getZoom();return null===r?Math.max(s-4,1):r}drawOnCanvas(t){if(!this.gl)return this;const{gl:e,canvas:i,settings:r,mapMatrix:s,matrix:n}=this,{map:a}=r,{offset:o}=t,l=a.getZoom(),c=Math.pow(2,l);return s.setSize(i.width,i.height).scaleMatrix(c).translateMatrix(-o.x,-o.y),e.clear(e.COLOR_BUFFER_BIT),e.viewport(0,0,i.width,i.height),e.uniformMatrix4fv(n,!1,s.array),e.drawArrays(e.POINTS,0,this.allLatLngLookup.length),this}lookup(t){const e=t.lat+.03,i=t.lng+.03,r=[];let s,a,o,l,c,u=t.lat-.03;for(;u<=e;u+=.01)for(s=t.lng-.03;s<=i;s+=.01)if(c=u.toFixed(2)+"x"+s.toFixed(2),l=this.latLngLookup[c])for(a=0,o=l.length;a<o;a++)r.push(l[a]);const{map:h}=this.settings;return n.closest(t,r.length>0?r:this.allLatLngLookup,h)}static closest(t,e,i){return e.length<1?null:e.reduce((e,s)=>{return(0,r.locationDistance)(t,e.latLng,i)<(0,r.locationDistance)(t,s.latLng,i)?e:s})}static tryClick(t,e){const s=[],a={};let o,l,c,u,h,p,g;if(n.instances.forEach(i=>{l=i.settings,i.active&&l.map===e&&l.click&&(u=i.lookup(t.latlng),a[u.key]=i,s.push(u))}),s.length<1)return;if(!l)return;if(null===(p=this.closest(t.latlng,s,e)))return;if(!(c=a[p.key]))return;const{latitudeKey:d,longitudeKey:f,sensitivity:y,click:L}=c.settings;return g=new i.LatLng(p.latLng[d],p.latLng[f]),h=e.latLngToLayerPoint(g),(0,r.pointInCircle)(h,t.layerPoint,p.chosenSize*y)?void 0===(o=L(t,p.feature||p.latLng,h))||o:void 0}static tryHover(t,e){const s=[],a={};let o,l,c,u,h,p,g;if(n.instances.forEach(i=>{l=i.settings,i.active&&l.map===e&&l.hover&&(u=i.lookup(t.latlng),a[u.key]=i,s.push(u))}),s.length<1)return;if(!l)return;if(null===(p=this.closest(t.latlng,s,e)))return;if(!(c=a[p.key]))return;const{latitudeKey:d,longitudeKey:f,sensitivityHover:y,hover:L}=c.settings;return g=new i.LatLng(p.latLng[d],p.latLng[f]),h=e.latLngToLayerPoint(g),(0,r.pointInCircle)(h,t.layerPoint,p.chosenSize*y)?void 0===(o=L(t,p.feature||p.latLng,h))||o:void 0}}exports.Points=n,n.instances=[],n.defaults=s,n.maps=[];
},{"./base":"pR9a","./color":"lpyx","./utils":"UnXq"}],"j8I8":[function(require,module,exports) {
"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.Shapes=exports.defaults=void 0;var e=n(require("earcut")),t=n(require("geojson-flatten")),r=n(require("polygon-lookup")),i=require("./base"),a=require("./color"),s=require("leaflet"),o=require("./utils");function n(e){return e&&e.__esModule?e:{default:e}}const l={map:null,data:[],longitudeKey:null,latitudeKey:null,setupClick:null,setupHover:null,vertexShaderSource:null,fragmentShaderSource:null,click:null,hover:null,color:a.Color.random,className:"",opacity:.5,shaderVariables:{color:{type:"FLOAT",start:2,size:4}},border:!1};exports.defaults=l;class u extends i.Base{constructor(e){if(super(e),this.bytes=6,u.instances.push(this),this.settings=Object.assign(Object.assign({},u.defaults),e),!e.data)throw new Error('no "data" array setting defined');if(!e.map)throw new Error('no leaflet "map" object setting defined');this.polygonLookup=null,this.setup().render()}render(){this.resetVertices();const{canvas:e,gl:t,layer:r,vertices:i,mapMatrix:a}=this,s=this.getBuffer("vertex"),o=new Float32Array(i),n=o.BYTES_PER_ELEMENT,l=this.getAttributeLocation("vertex");return t.bindBuffer(t.ARRAY_BUFFER,s),t.bufferData(t.ARRAY_BUFFER,o,t.STATIC_DRAW),t.vertexAttribPointer(l,2,t.FLOAT,!1,n*this.bytes,0),t.enableVertexAttribArray(l),this.matrix=this.getUniformLocation("matrix"),t.viewport(0,0,e.width,e.height),a.setSize(e.width,e.height),t.uniformMatrix4fv(this.matrix,!1,a.array),this.attachShaderVariables(n),r.redraw(),this}resetVertices(){this.vertices=[],this.vertexLines=[],this.polygonLookup=new r.default;const{vertices:i,vertexLines:a,polygonLookup:n,settings:l}=this,u=l.data;let h,c,f,d,p,g,y,b,v,A,x,F,{color:R,opacity:E}=l,w=0;switch(u.type){case"Feature":n.loadFeatureCollection({type:"FeatureCollection",features:[u]}),f=(0,t.default)(u);break;case"MultiPolygon":n.loadFeatureCollection({type:"FeatureCollection",features:[{type:"Feature",properties:{id:"bar"},geometry:{coordinates:u.coordinates}}]}),f=(0,t.default)(u);break;default:n.loadFeatureCollection(u),f=u.features}if(b=f.length,!R)throw new Error("color is not properly defined");for("function"==typeof R&&(p=R);w<b;w++){d=f[w],v=[],g=p?p(w,d):R,y=(d.geometry||d).coordinates,x=e.default.flatten(y),A=(0,e.default)(x.vertices,x.holes,x.dimensions),F=y[0][0].length;for(let e=0,t=A.length;e<t;e++){if(c=A[e],"number"!=typeof x.vertices[0])throw new Error("unhandled polygon");v.push(x.vertices[c*F+l.longitudeKey],x.vertices[c*F+l.latitudeKey])}for(let e=0,t=v.length;e<t;e)h=l.map.project(new s.LatLng(v[e++],v[e++]),0),i.push(h.x,h.y,g.r,g.g,g.b,g.a||E);if(l.border){let e=[];for(let t=1,r=x.vertices.length;t<r;t+=2)e.push(x.vertices[t],x.vertices[t-1]),e.push(x.vertices[t+2],x.vertices[t+1]);for(let t=0,r=e.length;t<r;t)h=(0,o.latLonToPixel)(e[t++],e[t++]),a.push(h.x,h.y,g.r,g.g,g.b,g.a||E)}}return this}drawOnCanvas(e){if(!this.gl)return this;const{scale:t,offset:r,canvas:i}=e,{mapMatrix:a,gl:s,vertices:o,settings:n,vertexLines:l}=this;if(a.setSize(i.width,i.height).scaleMatrix(t).translateMatrix(-r.x,-r.y),s.clear(s.COLOR_BUFFER_BIT),s.viewport(0,0,i.width,i.height),s.uniformMatrix4fv(this.matrix,!1,a.array),n.border){const e=this.getBuffer("vertexLines"),t=new Float32Array(l),r=t.BYTES_PER_ELEMENT,a=this.getAttributeLocation("vertex");s.bindBuffer(s.ARRAY_BUFFER,null),s.bindBuffer(s.ARRAY_BUFFER,e),s.bufferData(s.ARRAY_BUFFER,t,s.STATIC_DRAW),null!==this.settings.shaderVariables&&this.attachShaderVariables(r),s.vertexAttribPointer(a,3,s.FLOAT,!1,r*this.bytes,0),s.enableVertexAttribArray(a),s.enable(s.DEPTH_TEST),s.viewport(0,0,i.width,i.height),s.drawArrays(s.LINES,0,l.length/this.bytes);const u=this.getBuffer("vertex"),h=new Float32Array(o);s.bindBuffer(s.ARRAY_BUFFER,null),s.bindBuffer(s.ARRAY_BUFFER,u),s.bufferData(s.ARRAY_BUFFER,h,s.STATIC_DRAW),null!==n.shaderVariables&&this.attachShaderVariables(r),s.vertexAttribPointer(a,2,s.FLOAT,!1,r*this.bytes,0),s.enableVertexAttribArray(a),s.enable(s.DEPTH_TEST),s.viewport(0,0,i.width,i.height)}return s.drawArrays(s.TRIANGLES,0,o.length/this.bytes),this}static tryClick(e,t){let r,i,a;return u.instances.forEach(function(s){i=s.settings,s.active&&i.map===t&&i.click&&(a=s.polygonLookup.search(e.latlng.lng,e.latlng.lat))&&(r=i.click(e,a))}),void 0===r||r}static tryHover(e,t){let r,i,a;return u.instances.forEach(function(s){i=s.settings,s.active&&i.map===t&&i.hover&&(a=s.polygonLookup.search(e.latlng.lng,e.latlng.lat))&&(r=i.hover(e,a))}),void 0===r||r}}exports.Shapes=u,u.instances=[],u.defaults=l;
},{"./base":"pR9a","./color":"lpyx","./utils":"UnXq"}],"LmkB":[function(require,module,exports) {
module.exports = `uniform mat4 matrix;
attribute vec4 vertex;
attribute vec4 color;
attribute float pointSize;
varying vec4 _color;

void main() {
  //set the size of the point
  gl_PointSize = pointSize;

  //multiply each vertex by a matrix.
  gl_Position = matrix * vertex;

  //pass the color to the fragment shader
  _color = color;
}
`
},{}],"hNM2":[function(require,module,exports) {
module.exports = `precision mediump float;
uniform vec4 color;

void main() {
    float border = 0.05;
    float radius = 0.5;
    vec2 center = vec2(0.5);

    vec4 color0 = vec4(0.0);
    vec4 color1 = vec4(color[0], color[1], color[2], color[3]);

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
}
`
},{}],"XGkG":[function(require,module,exports) {
module.exports = `precision mediump float;
varying vec4 _color;

void main() {
  float border = 0.1;
  float radius = 0.5;
  vec2 center = vec2(0.5, 0.5);

  vec4 pointColor = vec4(
    _color[0],
    _color[1],
    _color[2],
    _color[3]
  );

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
}
`
},{}],"AY9x":[function(require,module,exports) {
module.exports = `precision mediump float;
varying vec4 _color;

void main() {
  vec2 center = vec2(0.5);
  vec2 uv = gl_PointCoord.xy - center;
  float smoothing = 0.005;
  vec4 _color1 = vec4(_color[0], _color[1], _color[2], _color[3]);
  float radius1 = 0.3;
  vec4 _color2 = vec4(_color[0], _color[1], _color[2], _color[3]);
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
}
`
},{}],"R6F0":[function(require,module,exports) {
module.exports = `precision mediump float;
varying vec4 _color;

void main() {
    vec4 color1 = vec4(_color[0], _color[1], _color[2], _color[3]);

    //simple circles
    float d = distance (gl_PointCoord, vec2(0.5, 0.5));
    if (d < 0.5 ){
        gl_FragColor = color1;
    } else {
        discard;
    }
}
`
},{}],"sqgp":[function(require,module,exports) {
module.exports = `precision mediump float;
varying vec4 _color;

void main() {
    //squares
    gl_FragColor = vec4(_color[0], _color[1], _color[2], _color[3]);
}
`
},{}],"JKQp":[function(require,module,exports) {
module.exports = `precision mediump float;
varying vec4 _color;

void main() {
  gl_FragColor = vec4(
    _color[0],
    _color[1],
    _color[2],
    _color[3]
  );
}
`
},{}],"QCba":[function(require,module,exports) {
"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.default=exports.glify=void 0;var e=require("./lines"),t=require("./points"),i=require("./shapes"),s=require("./utils"),r=h(require("./shader/vertex/default.glsl")),n=h(require("./shader/fragment/dot.glsl")),u=h(require("./shader/fragment/point.glsl")),a=h(require("./shader/fragment/puck.glsl")),d=h(require("./shader/fragment/simple-circle.glsl")),o=h(require("./shader/fragment/square.glsl")),l=h(require("./shader/fragment/polygon.glsl"));function h(e){return e&&e.__esModule?e:{default:e}}const p={vertex:r.default,fragment:{dot:n.default,point:u.default,puck:a.default,simpleCircle:d.default,square:o.default,polygon:l.default}};class g{constructor(){this.longitudeKey=1,this.latitudeKey=0,this.maps=[],this.shader=p,this.Points=t.Points,this.Shapes=i.Shapes,this.Lines=e.Lines}longitudeFirst(){return this.longitudeKey=0,this.latitudeKey=1,this}latitudeFirst(){return this.latitudeKey=0,this.longitudeKey=1,this}get instances(){return[...t.Points.instances,...e.Lines.instances,...i.Shapes.instances]}points(e){return new this.Points(Object.assign({setupClick:c.setupClick.bind(this),setupHover:this.setupHover.bind(this),latitudeKey:c.latitudeKey,longitudeKey:c.longitudeKey,vertexShaderSource:()=>this.shader.vertex,fragmentShaderSource:()=>this.shader.fragment.point},e))}shapes(e){return new this.Shapes(Object.assign({setupClick:this.setupClick.bind(this),setupHover:this.setupHover.bind(this),latitudeKey:this.latitudeKey,longitudeKey:this.longitudeKey,vertexShaderSource:()=>this.shader.vertex,fragmentShaderSource:()=>this.shader.fragment.polygon},e))}lines(e){return new this.Lines(Object.assign({setupClick:this.setupClick.bind(this),setupHover:this.setupHover.bind(this),latitudeKey:this.latitudeKey,longitudeKey:this.longitudeKey,vertexShaderSource:()=>this.shader.vertex,fragmentShaderSource:()=>this.shader.fragment.polygon},e))}setupClick(s){this.maps.indexOf(s)<0&&(this.maps.push(s),s.on("click",r=>{let n;return void 0!==(n=t.Points.tryClick(r,s))?n:void 0!==(n=e.Lines.tryClick(r,s))?n:void 0!==(n=i.Shapes.tryClick(r,s))?n:void 0}))}setupHover(r,n,u){this.maps.push(r),r.on("mousemove",(0,s.debounce)(s=>{let n;return void 0!==(n=t.Points.tryHover(s,r))?n:void 0!==(n=e.Lines.tryHover(s,r))?n:void 0!==(n=i.Shapes.tryHover(s,r))?n:void 0},n,u))}}const c=new g;exports.glify=c;var y=c;exports.default=y,"undefined"!=typeof window&&window.L&&(window.L.glify=c,window.L.Glify=g);
},{"./lines":"ogHp","./points":"IieH","./shapes":"j8I8","./utils":"UnXq","./shader/vertex/default.glsl":"LmkB","./shader/fragment/dot.glsl":"hNM2","./shader/fragment/point.glsl":"XGkG","./shader/fragment/puck.glsl":"AY9x","./shader/fragment/simple-circle.glsl":"R6F0","./shader/fragment/square.glsl":"sqgp","./shader/fragment/polygon.glsl":"JKQp"}]},{},["QCba"], null)
//# sourceMappingURL=/glify.js.map