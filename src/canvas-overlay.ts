/*
originally taken from: http://www.sumbera.com/gist/js/leaflet/canvas/L.CanvasOverlay.js, added and customized as part of this lib because of need from library
 Generic  Canvas Overlay for leaflet,
 Stanislav Sumbera, April , 2014

 - added userDrawFunc that is called when Canvas need to be redrawn
 - added few useful params fro userDrawFunc callback
 - fixed resize map bug
 inspired & portions taken from  :   https://github.com/Leaflet/Leaflet.heat
 */

import {
  // @ts-ignore
  LatLngBounds,
  // @ts-ignore
  Map,
  // @ts-ignore
  Point,
  // @ts-ignore
  Layer,
  // @ts-ignore
  Util,
  // @ts-ignore
  Browser,
  // @ts-ignore
  DomUtil
} from './leaflet-bindings';

export interface IUserDrawFuncContext {
  canvas: HTMLCanvasElement;
  bounds: LatLngBounds;
  size: Point;
  offset: Point;
  zoomScale: number;
  zoom: number;
}

export interface IUserDrawFunc {
  (context: IUserDrawFuncContext): void
}

export class CanvasOverlay extends Layer {
  _userDrawFunc: IUserDrawFunc;
  _map: Map;
  _redrawCallbacks: Function[];
  canvas: HTMLCanvasElement;

  _frame?: number;
  _offset?: Point;

  constructor(
    userDrawFunc: IUserDrawFunc, options
  ) {
    super();
    this._userDrawFunc = userDrawFunc;
    this._frame = null;
    this._offset = null;
    this._redrawCallbacks = [];
  }

  drawing(userDrawFunc): this {
    this._userDrawFunc = userDrawFunc;
    return this;
  }

  params(options): this {
    Util.setOptions(this, options);
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

  onAdd(map): this {
    this._map = map;
    this.canvas = this.canvas || document.createElement('canvas');

    const size = map.getSize()
      , animated = map.options.zoomAnimation && Browser.any3d
      ;

    this.canvas.width = size.x;
    this.canvas.height = size.y;

    this.canvas.className = 'leaflet-zoom-' + (animated ? 'animated' : 'hide');

    map._panes.overlayPane.appendChild(this.canvas);

    map.on('moveend', this._reset, this);
    map.on('resize',  this._resize, this);

    if (animated) {
      map.on('zoomanim', this._animateZoom, this);
    }

    this._reset();
    return this;
  }

  onRemove(map): this {
    map.getPanes().overlayPane.removeChild(this.canvas);

    map.off('moveend', this._reset, this);
    map.off('resize', this._resize, this);

    if (map.options.zoomAnimation && Browser.any3d) {
      map.off('zoomanim', this._animateZoom, this);
    }
    return this;
  }

  addTo(map): this {
    map.addLayer(this);
    return this;
  }

  _resize(resizeEvent): void {
    this.canvas.width  = resizeEvent.newSize.x;
    this.canvas.height = resizeEvent.newSize.y;
  }

  _reset(): void {
    const topLeft = this._map.containerPointToLayerPoint([0, 0]);
    DomUtil.setPosition(this.canvas, topLeft);
    this._redraw();
  }

  _redraw(): void {
    const { _map } = this
      , size = _map.getSize()
      , bounds = _map.getBounds()
      , zoomScale = (size.x * 180) / (20037508.34  * (bounds.getEast() - bounds.getWest())) // resolution = 1/zoomScale
      , zoom = _map.getZoom()
      ;

    if (this._userDrawFunc) {
      this._userDrawFunc({
        canvas: this.canvas,
        offset: this._offset,
        bounds: bounds,
        size: size,
        zoomScale: zoomScale,
        zoom: zoom,
      });
    }

    while (this._redrawCallbacks.length > 0) {
      this._redrawCallbacks.shift()(this);
    }

    this._frame = null;
  }

  _animateZoom(e): void {
    const { _map } = this
      , scale = _map.getZoomScale(e.zoom, _map.getZoom())
      , offset = Layer
        // @ts-ignore
        ? _map._latLngBoundsToNewLayerBounds(_map.getBounds(), e.zoom, e.center).min
        // @ts-ignore
        : _map._getCenterOffset(e.center)
            ._multiplyBy(-scale)
            // @ts-ignore
            .subtract(_map._getMapPanePos())
      ;

    DomUtil.setTransform(this.canvas, this._offset = offset, scale);
  }
}
