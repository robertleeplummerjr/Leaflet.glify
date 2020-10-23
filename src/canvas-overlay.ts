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
  LatLngBounds,
  Map,
  Point,
  Layer,
  Util,
  Browser,
  Bounds,
  DomUtil,
  LatLng,
  ZoomAnimEvent,
} from './leaflet-bindings';

export interface ICanvasOverlayDrawEvent {
  canvas: HTMLCanvasElement;
  bounds: LatLngBounds;
  offset: Point;
  scale: number;
  size: Point;
  zoomScale: number;
  zoom: number;
}

export interface IUserDrawFunc {
  (event: ICanvasOverlayDrawEvent): void
}

export class CanvasOverlay extends Layer {
  _userDrawFunc: IUserDrawFunc;
  _map: Map;
  _redrawCallbacks: Function[];
  canvas: HTMLCanvasElement;
  _pane: string;

  _frame?: number;

  constructor(
    userDrawFunc: IUserDrawFunc,
    pane: string
  ) {
    super();
    this._userDrawFunc = userDrawFunc;
    this._frame = null;
    this._redrawCallbacks = [];
    this._pane = pane;
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

    map._panes[this._pane].appendChild(this.canvas);

    map.on('moveend', this._reset, this);
    map.on('resize',  this._resize, this);

    if (animated) {
      map.on('zoomanim', Layer ? this._animateZoom : this._animateZoomNoLayer, this);
    }

    this._reset();
    return this;
  }

  onRemove(map): this {
    map.getPanes()[this._pane].removeChild(this.canvas);

    map.off('moveend', this._reset, this);
    map.off('resize', this._resize, this);

    if (map.options.zoomAnimation && Browser.any3d) {
      map.off('zoomanim', Layer ? this._animateZoom : this._animateZoomNoLayer, this);
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
    const { _map, canvas } = this
      , size = _map.getSize()
      , bounds = _map.getBounds()
      , zoomScale = (size.x * 180) / (20037508.34  * (bounds.getEast() - bounds.getWest())) // resolution = 1/zoomScale
      , zoom = _map.getZoom()
      , topLeft = new LatLng(bounds.getNorth(), bounds.getWest())
      , offset = this._unclampedProject(topLeft, 0)
      ;

    if (this._userDrawFunc) {
      this._userDrawFunc({
        bounds,
        canvas,
        offset,
        scale: Math.pow(2, zoom),
        size,
        zoomScale,
        zoom,
      });
    }

    while (this._redrawCallbacks.length > 0) {
      this._redrawCallbacks.shift()(this);
    }

    this._frame = null;
  }

  _animateZoom(e: ZoomAnimEvent): void {
    const { _map } = this
      , scale = _map.getZoomScale(e.zoom, _map.getZoom())
      // @ts-ignore
      , offset = this._unclampedLatLngBoundsToNewLayerBounds(_map.getBounds(), e.zoom, e.center).min
      ;
    DomUtil.setTransform(this.canvas, offset, scale);
  }

  _animateZoomNoLayer(e: ZoomAnimEvent): void {
    const { _map } = this
      , scale = _map.getZoomScale(e.zoom, _map.getZoom())
      // @ts-ignore
      , offset = _map._getCenterOffset(e.center)
        ._multiplyBy(-scale)
        // @ts-ignore
        .subtract(_map._getMapPanePos())
      ;
    DomUtil.setTransform(this.canvas, offset, scale);
  }

  _unclampedProject(latlng: LatLng, zoom: number): Point {
    // imported partly from https://github.com/Leaflet/Leaflet/blob/1ae785b73092fdb4b97e30f8789345e9f7c7c912/src/geo/projection/Projection.SphericalMercator.js#L21
    // used because they clamp the latitude
    const { crs } = this._map.options
      // @ts-ignore
      , { R } = crs.projection
      , d = Math.PI / 180
      , lat = latlng.lat
      , sin = Math.sin(lat * d)
      , projectedPoint = new Point(
          // @ts-ignore
          R * latlng.lng * d,
          // @ts-ignore
          R * Math.log((1 + sin) / (1 - sin)) / 2
        )
      , scale = crs.scale(zoom)
      ;
    // @ts-ignore
    return crs.transformation._transform(projectedPoint, scale);
  }

  _unclampedLatLngBoundsToNewLayerBounds(latLngBounds: LatLngBounds, zoom: number, center: LatLng): Bounds {
    // imported party from https://github.com/Leaflet/Leaflet/blob/84bc05bbb6e4acc41e6f89ff7421dd7c6520d256/src/map/Map.js#L1500
    // used because it uses crs.projection.project, which clamp the latitude
    // @ts-ignore
    const topLeft = this._map._getNewPixelOrigin(center, zoom);
    return new Bounds([
      this._unclampedProject(latLngBounds.getSouthWest(), zoom).subtract(topLeft),
      this._unclampedProject(latLngBounds.getNorthWest(), zoom).subtract(topLeft),
      this._unclampedProject(latLngBounds.getSouthEast(), zoom).subtract(topLeft),
      this._unclampedProject(latLngBounds.getNorthEast(), zoom).subtract(topLeft)
    ]);
  }
}
