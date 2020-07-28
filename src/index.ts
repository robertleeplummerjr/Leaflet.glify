import { LeafletMouseEvent, Map } from './leaflet-bindings';

import { Lines, ILinesSettings } from './lines';
import { MapMatrix } from './map-matrix';
import { Points, IPointsSettings } from './points';
import { IShapeSettings, Shapes } from './shapes';
import { debounce } from './utils';

// @ts-ignore
import vertex from './shader/vertex/default.glsl';
// @ts-ignore
import dot from './shader/fragment/dot.glsl';
// @ts-ignore
import point from './shader/fragment/point.glsl';
// @ts-ignore
import puck from './shader/fragment/puck.glsl';
// @ts-ignore
import simpleCircle from './shader/fragment/simple-circle.glsl';
// @ts-ignore
import square from './shader/fragment/square.glsl';
// @ts-ignore
import polygon from './shader/fragment/polygon.glsl';

const shader = {
  vertex,
  fragment: {
    dot,
    point,
    puck,
    simpleCircle,
    square,
    polygon,
  }
};

class Glify {
  longitudeKey: number = 1;
  latitudeKey: number = 0;
  maps: Map[] = [];
  shader = shader;

  Points: typeof Points = Points;
  Shapes: typeof Shapes = Shapes;
  Lines: typeof Lines = Lines;

  longitudeFirst(): this {
    this.longitudeKey = 0;
    this.latitudeKey = 1;
    return this;
  }

  latitudeFirst(): this {
    this.latitudeKey = 0;
    this.longitudeKey = 1;
    return this;
  }

  get instances() {
    return [
      ...Points.instances,
      ...Lines.instances,
      ...Shapes.instances,
    ];
  }

  points(settings: IPointsSettings): Points {
    return new this.Points({
      setupClick: glify.setupClick.bind(this),
      setupHover: this.setupHover.bind(this),
      latitudeKey: glify.latitudeKey,
      longitudeKey: glify.longitudeKey,
      vertexShaderSource: () => {
        return this.shader.vertex;
      },
      fragmentShaderSource: () => {
        return this.shader.fragment.point;
      },
      ...settings,
    });
  }

  shapes(settings: IShapeSettings): Shapes {
    return new this.Shapes({
      setupClick: this.setupClick.bind(this),
      setupHover: this.setupHover.bind(this),
      latitudeKey: this.latitudeKey,
      longitudeKey: this.longitudeKey,
      vertexShaderSource: () => {
        return this.shader.vertex;
      },
      fragmentShaderSource: () => {
        return this.shader.fragment.polygon;
      },
      ...settings
    });
  }

  lines(settings: ILinesSettings): Lines {
    return new this.Lines({
      setupClick: this.setupClick.bind(this),
      setupHover: this.setupHover.bind(this),
      latitudeKey: this.latitudeKey,
      longitudeKey: this.longitudeKey,
      vertexShaderSource: () => {
        return this.shader.vertex;
      },
      fragmentShaderSource: () => {
        return this.shader.fragment.polygon;
      },
      ...settings
    });
  }

  setupClick(map?: Map): void {
    if (this.maps.indexOf(map) < 0) {
      this.maps.push(map);
      map.on('click', (e: LeafletMouseEvent) => {
        let hit;
        hit = Points.tryClick(e, map);
        if (hit !== undefined) return hit;

        hit = Lines.tryClick(e, map);
        if (hit !== undefined) return hit;

        hit = Shapes.tryClick(e, map);
        if (hit !== undefined) return hit;
      });
    }
  }

  setupHover(map?: Map, hoverWait?: 500, immediate?: true): void {
    this.maps.push(map);
    map.on('mousemove', debounce((e: LeafletMouseEvent) => {
      let hit;
      hit = Points.tryHover(e, map);
      if (hit !== undefined) return hit;

      hit = Lines.tryHover(e, map);
      if (hit !== undefined) return hit;

      hit = Shapes.tryHover(e, map);
      if (hit !== undefined) return hit;
    }, hoverWait, immediate));
  }
}

const glify = new Glify();
export default module.exports = glify;
if (typeof window !== 'undefined' && window.L) {
  // @ts-ignore
  window['L'].glify = glify;
  // @ts-ignore
  window['L'].Glify = Glify;
}