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
  Point,
  Layer,
  Util,
  Browser,
  Bounds,
  DomUtil,
  LatLng,
  ZoomAnimEvent,
  Map,
  ResizeEvent,
  LayerOptions,
} from "leaflet";

export interface ICanvasOverlayDrawEvent {
  canvas: HTMLCanvasElement;
  bounds: LatLngBounds;
  offset: Point;
  scale: number;
  size: Point;
  zoomScale: number;
  zoom: number;
}

export type IUserDrawFunc = (event: ICanvasOverlayDrawEvent) => void;

export type RedrawCallback = (instance: CanvasOverlay) => void;

export class CanvasOverlay extends Layer {
  _userDrawFunc: IUserDrawFunc;
  _redrawCallbacks: RedrawCallback[];
  canvas?: HTMLCanvasElement;
  _pane: string;

  _frame?: number | null;
  _leaflet_id?: number;
  options: LayerOptions;

  constructor(userDrawFunc: IUserDrawFunc, pane: string) {
    super();
    this._userDrawFunc = userDrawFunc;
    this._frame = null;
    this._redrawCallbacks = [];
    this._pane = pane;
    this.options = {};
  }

  drawing(userDrawFunc: IUserDrawFunc): this {
    this._userDrawFunc = userDrawFunc;
    return this;
  }

  params(options: any): this {
    Util.setOptions(this, options);
    return this;
  }

  redraw(callback?: RedrawCallback) {
    if (typeof callback === "function") {
      this._redrawCallbacks.push(callback);
    }
    if (this._frame === null) {
      this._frame = Util.requestAnimFrame(this._redraw, this);
    }
    return this;
  }

  isAnimated(): boolean {
    return Boolean(this._map.options.zoomAnimation && Browser.any3d);
  }

  onAdd(map: Map): this {
    this._map = map;
    const canvas = (this.canvas =
      this.canvas ?? document.createElement("canvas"));

    const size = map.getSize();
    const animated = this.isAnimated();
    canvas.width = size.x;
    canvas.height = size.y;
    canvas.className = `leaflet-zoom-${animated ? "animated" : "hide"}`;

    const pane = map.getPane(this._pane);
    if (!pane) {
      throw new Error("unable to find pane");
    }
    pane.appendChild(this.canvas);

    map.on("moveend", this._reset, this);
    map.on("resize", this._resize, this);

    if (animated) {
      map.on(
        "zoomanim",
        Layer ? this._animateZoom : this._animateZoomNoLayer,
        this
      );
    }

    this._reset();
    return this;
  }

  onRemove(map: Map): this {
    if (this.canvas) {
      const pane = map.getPane(this._pane);
      if (!pane) {
        throw new Error("unable to find pane");
      }
      pane.removeChild(this.canvas);
    }

    map.off("moveend", this._reset, this);
    map.off("resize", this._resize, this);

    if (this.isAnimated()) {
      map.off(
        "zoomanim",
        Layer ? this._animateZoom : this._animateZoomNoLayer,
        this
      );
    }
    return this;
  }

  addTo(map: Map): this {
    map.addLayer(this);
    return this;
  }

  get map(): Map {
    return this._map;
  }

  set map(map: Map) {
    this._map = map;
  }

  _resize(resizeEvent: ResizeEvent): void {
    if (this.canvas) {
      this.canvas.width = resizeEvent.newSize.x;
      this.canvas.height = resizeEvent.newSize.y;
    }
  }

  _reset(): void {
    if (this.canvas) {
      const topLeft = this._map.containerPointToLayerPoint([0, 0]);
      DomUtil.setPosition(this.canvas, topLeft);
    }
    this._redraw();
  }

  _redraw(): void {
    const { _map, canvas } = this;
    const size = _map.getSize();
    const bounds = _map.getBounds();
    const zoomScale =
      (size.x * 180) / (20037508.34 * (bounds.getEast() - bounds.getWest())); // resolution = 1/zoomScale
    const zoom = _map.getZoom();
    const topLeft = new LatLng(bounds.getNorth(), bounds.getWest());
    const offset = this._unclampedProject(topLeft, 0);
    if (canvas) {
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
      const callback = this._redrawCallbacks.shift();
      if (callback) {
        callback(this);
      }
    }

    this._frame = null;
  }

  _animateZoom(e: ZoomAnimEvent): void {
    const { _map, canvas } = this;
    const scale = _map.getZoomScale(e.zoom, _map.getZoom());
    const offset = this._unclampedLatLngBoundsToNewLayerBounds(
      _map.getBounds(),
      e.zoom,
      e.center
    ).min;
    if (canvas && offset) {
      DomUtil.setTransform(canvas, offset, scale);
    }
  }

  _animateZoomNoLayer(e: ZoomAnimEvent): void {
    const { _map, canvas } = this;
    if (canvas) {
      const scale = _map.getZoomScale(e.zoom, _map.getZoom());
      const offset = _map
        // @ts-expect-error experimental
        ._getCenterOffset(e.center)
        ._multiplyBy(-scale)
        // @ts-expect-error  experimental
        .subtract(_map._getMapPanePos());
      DomUtil.setTransform(canvas, offset, scale);
    }
  }

  _unclampedProject(latlng: LatLng, zoom: number): Point {
    // imported partly from https://github.com/Leaflet/Leaflet/blob/1ae785b73092fdb4b97e30f8789345e9f7c7c912/src/geo/projection/Projection.SphericalMercator.js#L21
    // used because they clamp the latitude
    const { crs } = this._map.options;
    // @ts-expect-error experimental
    const { R } = crs.projection;
    const d = Math.PI / 180;
    const lat = latlng.lat;
    const sin = Math.sin(lat * d);
    const projectedPoint = new Point(
      R * latlng.lng * d,
      (R * Math.log((1 + sin) / (1 - sin))) / 2
    );
    const scale = crs?.scale(zoom) ?? 0;
    // @ts-expect-error experimental
    return crs.transformation._transform(projectedPoint, scale);
  }

  _unclampedLatLngBoundsToNewLayerBounds(
    latLngBounds: LatLngBounds,
    zoom: number,
    center: LatLng
  ): Bounds {
    // imported party from https://github.com/Leaflet/Leaflet/blob/84bc05bbb6e4acc41e6f89ff7421dd7c6520d256/src/map/Map.js#L1500
    // used because it uses crs.projection.project, which clamp the latitude
    // @ts-expect-error experimental
    const topLeft = this._map._getNewPixelOrigin(center, zoom);
    return new Bounds([
      this._unclampedProject(latLngBounds.getSouthWest(), zoom).subtract(
        topLeft
      ),
      this._unclampedProject(latLngBounds.getNorthWest(), zoom).subtract(
        topLeft
      ),
      this._unclampedProject(latLngBounds.getSouthEast(), zoom).subtract(
        topLeft
      ),
      this._unclampedProject(latLngBounds.getNorthEast(), zoom).subtract(
        topLeft
      ),
    ]);
  }
}
