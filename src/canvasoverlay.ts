/*
originally taken from: http://www.sumbera.com/gist/js/leaflet/canvas/L.CanvasOverlay.js, added and customized as part of this lib because of need from library
 Generic  Canvas Overlay for leaflet,
 Stanislav Sumbera, April , 2014

 - added userDrawFunc that is called when Canvas need to be redrawn
 - added few useful params fro userDrawFunc callback
 - fixed resize map bug
 inspired & portions taken from  :   https://github.com/Leaflet/Leaflet.heat
 */
import { LatLngBounds, Map, Point as PointReference } from 'leaflet';
import { Layer, Point, setOptions, Browser, DomUtil, Util } from './leaflet-bindings';

interface IUserDrawFuncContext {
  canvas   : HTMLCanvasElement;
  bounds   : LatLngBounds;
  size     : PointReference;
  zoomScale: number;
  zoom     : number;
  options  : any;
}

export class CanvasOverlay extends Layer {
  _userDrawFunc: (overlayInstance: CanvasOverlay, context: IUserDrawFuncContext) => void;
  _map: Map;
  _frame?: AnimationFrameProvider;
  _redrawCallbacks: Function[];
  canvas: HTMLCanvasElement;
  options: any;

  constructor(userDrawFunc: (overlayInstance: CanvasOverlay, context: IUserDrawFuncContext) => void, options = {}) {
    super();
    this._userDrawFunc = userDrawFunc;
    this._frame = null;
    this._redrawCallbacks = [];
    this.options = options;
    setOptions(this, options);
  }

  drawing(userDrawFunc) {
    this._userDrawFunc = userDrawFunc;
    return this;
  }

  params(options){
    setOptions(this, options);
    return this;
  }

  redraw(callback?) {
    if (typeof callback === 'function') {
      this._redrawCallbacks.push(callback);
    }
    if (this._frame === null) {
      this._frame = Util.requestAnimFrame(this._redraw, this);
    }
    return this;
  }

  onAdd(map) {
    this._map = map;
    this.canvas = this.canvas || document.createElement('canvas');

    const size = this._map.getSize()
      , animated = this._map.options.zoomAnimation && Browser.any3d
      ;

    this.canvas.width = size.x;
    this.canvas.height = size.y;

    this.canvas.className = 'leaflet-zoom-' + (animated ? 'animated' : 'hide');

    map._panes.overlayPane.appendChild(this.canvas);

    map.on('moveend', this._reset, this);
    map.on('resize',  this._resize, this);

    if (map.options.zoomAnimation && Browser.any3d) {
      map.on('zoomanim', this._animateZoom, this);
    }

    this._reset();
  }

  onRemove(map) {
    map.getPanes().overlayPane.removeChild(this.canvas);

    map.off('moveend', this._reset, this);
    map.off('resize', this._resize, this);

    if (map.options.zoomAnimation) {
      map.off('zoomanim', this._animateZoom, this);
    }
  }

  addTo(map) {
    map.addLayer(this);
    return this;
  }

  _resize(resizeEvent) {
    this.canvas.width  = resizeEvent.newSize.x;
    this.canvas.height = resizeEvent.newSize.y;
  }

  _reset() {
    const topLeft = this._map.containerPointToLayerPoint([0, 0]);
    DomUtil.setPosition(this.canvas, topLeft);
    this._redraw();
  }

  _redraw() {
    const size    = this._map.getSize()
      , bounds    = this._map.getBounds()
      , zoomScale = (size.x * 180) / (20037508.34  * (bounds.getEast() - bounds.getWest())) // resolution = 1/zoomScale
      , zoom      = this._map.getZoom()
      ;

    if (this._userDrawFunc) {
      this._userDrawFunc(this, {
        canvas   :this.canvas,
        bounds   : bounds,
        size     : size,
        zoomScale: zoomScale,
        zoom     : zoom,
        options  : this.options
      });
    }

    while (this._redrawCallbacks.length > 0) {
      this._redrawCallbacks.shift()(this);
    }

    this._frame = null;
  }

  _animateZoom(e) {
    // @ts-ignore
    const scale = this._map.getZoomScale(e.zoom)
        , offset = Layer
          // @ts-ignore
          ? this._map._latLngBoundsToNewLayerBounds(this._map.getBounds(), e.zoom, e.center).min
          // @ts-ignore
          : this._map._getCenterOffset(e.center)
              ._multiplyBy(-scale)
              // @ts-ignore
              .subtract(this._map._getMapPanePos())
      ;

    DomUtil.setTransform(this.canvas, offset, scale);
  }

  setTransform(el, offset, scale) {
    var pos = offset || new Point(0, 0);
    el.style[DomUtil.TRANSFORM] =
      (Browser.ie3d ?
        'translate(' + pos.x + 'px,' + pos.y + 'px)' :
        'translate3d(' + pos.x + 'px,' + pos.y + 'px,0)') +
      (scale ? ' scale(' + scale + ')' : '');
  }
}

export function canvasOverlay(userDrawFunc, options?) {
  return new CanvasOverlay(userDrawFunc, options);
}
