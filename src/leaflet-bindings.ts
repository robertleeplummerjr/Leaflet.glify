import {
  latLng as _latLng,
  LatLng as _LatLng,
  Layer as _Layer,
} from 'leaflet/src/layer/Layer';
import {
  Point as _Point,
} from 'leaflet/src/geometry/Point';
import {
  Browser as _Browser,
  setOptions as _setOptions,
  requestAnimFrame as _requestAnimFrame
} from 'leaflet/src/core/Util';
import * as _DomUtil from 'leaflet/src/dom/DomUtil';

export const latLng: _LatLng = window['L'] ? window['L'].latLng : _latLng;

export const LatLng: _LatLng = window['L'] ? window['L'].LatLng : _LatLng;

export const Layer: _Layer = window['L'] ? window['L'].Layer : _Layer;

export const Point: _Point = window['L'] ? window['L'].Point : _Point;

export const setOptions: _setOptions = window['L'] ? window['L'].Util.setOptions : _setOptions;

export const Browser: _Browser = window['L'] ? window['L'].Browser : _Browser;

export const DomUtil: _DomUtil = window['L'] ? window['L'].DomUtil : _DomUtil;

const requestAnimFrame: _requestAnimFrame = window['L'] ? window['L'].Util.requestAnimFrame : _requestAnimFrame;
export const Util = {
  requestAnimFrame
};
