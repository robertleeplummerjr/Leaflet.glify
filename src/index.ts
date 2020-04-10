import { Map } from 'leaflet';
import { Points, IPointsSettings } from './points';
import { IShapeSettings, Shapes} from './shapes';
import { Lines, ILinesSettings } from './lines';
import { MapMatrix } from './map-matrix';
import { Color } from './color';

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
  color: Color = new Color();
  longitudeKey: number = 1;
  latitudeKey: number = 0;
  maps: Map[] = [];
  shader = shader;

  Points: typeof Points = Points;
  Shapes: typeof Shapes = Shapes;
  Lines: typeof Lines = Lines;
  mapMatrix: MapMatrix;

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
      ...Shapes.instances,
      ...Lines.instances
    ];
  }

  points(settings: IPointsSettings): Points {
    return new Points({
      setupClick: glify.setupClick.bind(this),
      attachShaderVars: glify.attachShaderVars.bind(this),
      latitudeKey: glify.latitudeKey,
      longitudeKey: glify.longitudeKey,
      vertexShaderSource: () => {
        return this.shader.vertex;
      },
      fragmentShaderSource: () => {
        return this.shader.fragment.point;
      },
      color: this.color.random,
      closest: this.closest.bind(this),
      ...settings,
    });
  }

  shapes(settings: IShapeSettings): Shapes {
    return new Shapes({
      setupClick: this.setupClick.bind(this),
      attachShaderVars: this.attachShaderVars.bind(this),
      latitudeKey: this.latitudeKey,
      longitudeKey: this.longitudeKey,
      vertexShaderSource: () => {
        return this.shader.vertex;
      },
      fragmentShaderSource: () => {
        return this.shader.fragment.polygon;
      },
      color: this.color.random,
      ...settings
    });
  }

  lines(settings: ILinesSettings): Lines {
    return new Lines({
      setupClick: this.setupClick.bind(this),
      attachShaderVars: this.attachShaderVars.bind(this),
      latitudeKey: this.latitudeKey,
      longitudeKey: this.longitudeKey,
      vertexShaderSource: () => {
        return this.shader.vertex;
      },
      fragmentShaderSource: () => {
        return this.shader.fragment.polygon;
      },
      color: this.color.random,
      ...settings
    });
  }

  setupClick(map?: Map): void {
    if (this.maps.indexOf(map) < 0) {
      this.maps.push(map);
      map.on('click', function (e) {
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

  pointInCircle(centerPoint, checkPoint, radius): boolean {
    const distanceSquared = (centerPoint.x - checkPoint.x) * (centerPoint.x - checkPoint.x) + (centerPoint.y - checkPoint.y) * (centerPoint.y - checkPoint.y);
    return distanceSquared <= radius * radius;
  }

  attachShaderVars(byteCount, gl, program, attributes): this {
    const bytes = 5;

    for (const name in attributes) if (attributes.hasOwnProperty(name)) {
      const attribute = attributes[name];
      const loc = gl.getAttribLocation(program, name);
      if (loc < 0) {
        console.log(name, attribute);
        throw new Error('shader variable ' + name + ' not found');
      }
      gl.vertexAttribPointer(
        loc,
        attribute.size,
        gl[attribute.type],
        !!attribute.normalize,
        byteCount * (attribute.bytes || bytes),
        byteCount * attribute.start);
      gl.enableVertexAttribArray(loc);
    }

    return this;
  }

  debugPoint(containerPoint): this {
    const el = document.createElement('div')
      , s = el.style
      , x = containerPoint.x
      , y = containerPoint.y
      ;

    s.left = x + 'px';
    s.top = y + 'px';
    s.width = '10px';
    s.height = '10px';
    s.position = 'absolute';
    s.backgroundColor = '#' + (Math.random() * 0xFFFFFF << 0).toString(16);

    document.body.appendChild(el);

    return this;
  }

  closest(targetLocation, points, map): Points {
    if (points.length < 1) return null;
    return points.reduce((prev, curr) => {
      const prevDistance = this.locationDistance(targetLocation, prev, map)
        , currDistance = this.locationDistance(targetLocation, curr, map)
        ;
      return (prevDistance < currDistance) ? prev : curr;
    });
  }

  vectorDistance(dx, dy): number {
    return Math.sqrt(dx * dx + dy * dy);
  }

  locationDistance(location1, location2, map): number {
    const point1 = map.latLngToLayerPoint(location1)
      , point2 = map.latLngToLayerPoint(location2)
      , dx = point1.x - point2.x
      , dy = point1.y - point2.y
      ;
    return this.vectorDistance(dx, dy);
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