import { LeafletMouseEvent, Map } from "leaflet";

import { Lines, ILinesSettings } from "./lines";
import { Points, IPointsSettings } from "./points";
import { Shapes, IShapeSettings } from "./shapes";
import { debounce } from "./utils";

// @ts-expect-error import string
import vertex from "./shader/vertex/default.glsl";
// @ts-expect-error import string
import dot from "./shader/fragment/dot.glsl";
// @ts-expect-error import string
import point from "./shader/fragment/point.glsl";
// @ts-expect-error import string
import puck from "./shader/fragment/puck.glsl";
// @ts-expect-error import string
import simpleCircle from "./shader/fragment/simple-circle.glsl";
// @ts-expect-error import string
import square from "./shader/fragment/square.glsl";
// @ts-expect-error import string
import polygon from "./shader/fragment/polygon.glsl";

const shader = {
  vertex,
  fragment: {
    dot,
    point,
    puck,
    simpleCircle,
    square,
    polygon,
  },
};

class Glify {
  longitudeKey = 1;
  latitudeKey = 0;
  maps: Map[] = [];
  clickSetupMaps: Map[] = [];
  hoverSetupMaps: Map[] = [];
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

  get instances(): Array<Points | Lines | Shapes> {
    return [...Points.instances, ...Lines.instances, ...Shapes.instances];
  }

  points(settings: Partial<IPointsSettings>): Points {
    return new this.Points({
      ...settings,
      setupClick: this.setupClick.bind(this),
      setupHover: this.setupHover.bind(this),
      latitudeKey: glify.latitudeKey,
      longitudeKey: glify.longitudeKey,
      vertexShaderSource: () => {
        return this.shader.vertex;
      },
      fragmentShaderSource: () => {
        return this.shader.fragment.point;
      },
    });
  }

  shapes(settings: Partial<IShapeSettings>): Shapes {
    return new this.Shapes({
      ...settings,
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
    });
  }

  lines(settings: Partial<ILinesSettings>): Lines {
    return new this.Lines({
      ...settings,
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
    });
  }

  setupClick(map: Map): void {
    if (this.clickSetupMaps.includes(map)) return;
    this.clickSetupMaps.push(map);
    map.on("click", (e: LeafletMouseEvent) => {
      let hit;
      hit = Points.tryClick(e, map);
      if (hit !== undefined) return hit;

      hit = Lines.tryClick(e, map);
      if (hit !== undefined) return hit;

      hit = Shapes.tryClick(e, map);
      if (hit !== undefined) return hit;
    });
  }

  setupHover(map: Map, hoverWait?: number, immediate?: false): void {
    if (this.hoverSetupMaps.includes(map)) return;
    this.hoverSetupMaps.push(map);
    map.on(
      "mousemove",
      debounce(
        (e: LeafletMouseEvent) => {
          Points.tryHover(e, map);
          Lines.tryHover(e, map);
          Shapes.tryHover(e, map);
        },
        hoverWait ?? 0,
        immediate
      )
    );
  }
}

export const glify = new Glify();
export default glify;
if (typeof window !== "undefined" && window.L) {
  // @ts-expect-error exporting it to window
  window.L.glify = glify;
  // @ts-expect-error exporting it to window
  window.L.Glify = Glify;
}
