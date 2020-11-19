import { Base, IBaseSettings } from './base';
import { ICanvasOverlayDrawEvent } from './canvas-overlay';
import { Color, IColor } from './color';
import { Map, LeafletMouseEvent, geoJSON } from 'leaflet';
import { LineFeatureVertices } from './line-feature-vertices';
import { pDistance, inBounds } from './utils';

export interface ILinesSettings extends IBaseSettings {
  weight: ((i: number, feature: any) => number) | number;
  sensitivity?: number;
  sensitivityHover?: number;
}

const defaults: ILinesSettings = {
  map: null,
  data: [],
  longitudeKey: null,
  latitudeKey: null,
  setupClick: null,
  setupHover: null,
  vertexShaderSource: null,
  fragmentShaderSource: null,
  click: null,
  hover: null,
  color: Color.random,
  className: '',
  opacity: 0.5,
  weight: 2,
  sensitivity: 0.1,
  sensitivityHover: 0.03,
  shaderVariables: {
    color: {
      type: 'FLOAT',
      start: 2,
      size: 3
    }
  }
};

export class Lines extends Base<ILinesSettings> {
  static defaults = defaults;
  static instances: Lines[] = [];

  allVertices: number[];
  vertices: LineFeatureVertices[];
  aPointSize: number;

  constructor(settings: ILinesSettings) {
    super(settings);
    Lines.instances.push(this);
    this.settings = { ...Lines.defaults, ...settings };

    if (!settings.data) throw new Error('no "data" array setting defined');
    if (!settings.map) throw new Error('no leaflet "map" object setting defined');

    this.active = true;
    this.allVertices = [];

    this
      .setup()
      .render();
  }

  render(): this {
    this.resetVertices();

    const pixelsToWebGLMatrix = this.pixelsToWebGLMatrix
      , settings = this.settings
      , { canvas, gl, layer, vertices, program } = this
      , vertexBuffer = gl.createBuffer()
      , vertex = gl.getAttribLocation(program, 'vertex')
      , opacity = gl.getUniformLocation(program, 'opacity')
      ;

    gl.uniform1f(opacity, settings.opacity);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

    /*
    Transforming lines according to the rule:
    1. Take one line (single feature)
    [[0,0],[1,1],[2,2]]
    2. Split the line in segments, duplicating all coordinates except first and last one
    [[0,0],[1,1],[2,2]] => [[0,0],[1,1],[1,1],[2,2]]
    3. Do this for all lines and put all coordinates in array
    */
    let size = vertices.length;
    const allVertices = [];
    for (let i = 0; i < size; i++) {
      const vertexArray = vertices[i].array;
      const length = vertexArray.length / 5;
      for (let j = 0; j < length; j++) {
        const vertexIndex = j * 5;
        if (j !== 0 && j !== (length - 1)) {
          allVertices.push(
            vertexArray[vertexIndex],
            vertexArray[vertexIndex + 1],
            vertexArray[vertexIndex + 2],
            vertexArray[vertexIndex + 3],
            vertexArray[vertexIndex + 4]
          );
        }
        allVertices.push(
          vertexArray[vertexIndex],
          vertexArray[vertexIndex + 1],
          vertexArray[vertexIndex + 2],
          vertexArray[vertexIndex + 3],
          vertexArray[vertexIndex + 4]
        );
      }
    }

    this.allVertices = allVertices;

    const vertArray = new Float32Array(allVertices);
    size = vertArray.BYTES_PER_ELEMENT;
    gl.bufferData(gl.ARRAY_BUFFER, vertArray, gl.STATIC_DRAW);
    gl.vertexAttribPointer(vertex, 2, gl.FLOAT, false, size * 5, 0);
    gl.enableVertexAttribArray(vertex);

    //  gl.disable(gl.DEPTH_TEST);
    // ----------------------------
    // look up the locations for the inputs to our shaders.
    this.matrix = gl.getUniformLocation(program, 'matrix');
    this.aPointSize = gl.getAttribLocation(program, 'pointSize');

    // Set the matrix to some that makes 1 unit 1 pixel.
    pixelsToWebGLMatrix.set([2 / canvas.width, 0, 0, 0, 0, -2 / canvas.height, 0, 0, 0, 0, 0, 0, -1, 1, 0, 1]);
    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.uniformMatrix4fv(this.matrix, false, pixelsToWebGLMatrix);

    this.attachShaderVariables(size);

    layer.redraw();

    return this;
  }

  resetVertices(): this {
    this.allVertices = [];
    this.vertices = [];

    const vertices = this.vertices
      , settings = this.settings
      , data = settings.data
      , features = data.features
      , map = settings.map
      , latitudeKey = settings.latitudeKey
      , longitudeKey = settings.longitudeKey
      , featureMax = features.length
      ;

    let feature
      , { color } = settings
      , colorFn: (i: number, feature: any) => IColor
      , chosenColor
      , featureIndex = 0
      ;

    if (!color) {
      throw new Error('color is not properly defined');
    } else if (typeof color === 'function') {
      colorFn = color;
    }

    // -- data
    for (; featureIndex < featureMax; featureIndex++) {
      feature = features[featureIndex];
      //use colorFn function here if it exists
      if (colorFn) {
        chosenColor = colorFn(featureIndex, feature);
      } else {
        chosenColor = color as IColor;
      }

      const featureVertices = new LineFeatureVertices({
        project: map.project.bind(map),
        latitudeKey,
        longitudeKey,
        color: chosenColor,
      });
      featureVertices.fillFromCoordinates(feature.geometry.coordinates);
      vertices.push(featureVertices);
    }

    return this;
  }

  drawOnCanvas(e: ICanvasOverlayDrawEvent): this {
    if (!this.gl) return this;

    const { gl, settings, canvas, mapMatrix, matrix, pixelsToWebGLMatrix, allVertices, vertices } = this
      , weight = settings.weight
      , { scale, offset, zoom } = e
      , pointSize = Math.max(zoom - 4.0, 4.0)
      ;

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.viewport(0, 0, canvas.width, canvas.height);
    pixelsToWebGLMatrix.set([2 / canvas.width, 0, 0, 0, 0, -2 / canvas.height, 0, 0, 0, 0, 0, 0, -1, 1, 0, 1]);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.vertexAttrib1f(this.aPointSize, pointSize);
    if (zoom > 18) {
      mapMatrix
        .set(pixelsToWebGLMatrix)
        .scaleMatrix(scale)
        .translateMatrix(-offset.x, -offset.y);
      // -- attach matrix value to 'mapMatrix' uniform in shader
      gl.uniformMatrix4fv(matrix, false, mapMatrix.array);

      gl.drawArrays(gl.LINES, 0, allVertices.length / 5);
    } else if (typeof weight === 'number') {
      // Now draw the lines several times, but like a brush, taking advantage of the half pixel line generally used by cards
      for (let yOffset = -weight; yOffset < weight; yOffset += 0.5) {
        for (let xOffset = -weight; xOffset < weight; xOffset += 0.5) {
          // -- set base matrix to translate canvas pixel coordinates -> webgl coordinates
          mapMatrix
            .set(pixelsToWebGLMatrix)
            .scaleMatrix(scale)
            .translateMatrix(-offset.x + (xOffset / scale), -offset.y + (yOffset / scale));
          // -- attach matrix value to 'mapMatrix' uniform in shader
          gl.uniformMatrix4fv(matrix, false, mapMatrix.array);

          gl.drawArrays(gl.LINES, 0, allVertices.length / 5);
        }
      }
    } else if (typeof weight === 'function') {
      let allVertexCount = 0;
      const features = settings.data.features;
      for (let i = 0; i < vertices.length; i++) {
        const featureVertices = vertices[i];
        const vertexCount = featureVertices.vertexCount;
        const weightValue = weight(i, features[i]);
        // Now draw the lines several times, but like a brush, taking advantage of the half pixel line generally used by cards
        for (let yOffset = -weightValue; yOffset < weightValue; yOffset += 0.5) {
          for (let xOffset = -weightValue; xOffset < weightValue; xOffset += 0.5) {
            // -- set base matrix to translate canvas pixel coordinates -> webgl coordinates
            mapMatrix
              .set(pixelsToWebGLMatrix)
              .scaleMatrix(scale)
              .translateMatrix(-offset.x + (xOffset / scale), -offset.y + (yOffset / scale));
            // -- attach matrix value to 'mapMatrix' uniform in shader
            gl.uniformMatrix4fv(this.matrix, false, mapMatrix.array);

            gl.drawArrays(gl.LINES, allVertexCount, vertexCount);
          }
        }
        allVertexCount += vertexCount;
      }
    }
    return this;
  }

  static tryClick(e: LeafletMouseEvent, map: Map): void {
    let foundFeature = false
      , instance = null
      , sensitivity
      , settings
      ;
    Lines.instances.forEach(function (_instance) {
      settings = _instance.settings;
      sensitivity = settings.sensitivity;
      if (!_instance.active) return;
      if (settings.map !== map) return;
      if (!settings.click) return;

      settings.data.features.map(feature => {
        for (let i = 1; i < feature.geometry.coordinates.length; i++) {
          let distance = pDistance(e.latlng.lng, e.latlng.lat,
            feature.geometry.coordinates[i - 1][0], feature.geometry.coordinates[i - 1][1],
            feature.geometry.coordinates[i][0], feature.geometry.coordinates[i][1]);
          if (distance < sensitivity) {
            sensitivity = distance;
            foundFeature = feature;
            instance = _instance;
          }
        }
      });
    });

    if (instance) {
      instance.settings.click(e, foundFeature);
    } else {
      return;
    }
  }

  static tryHover(e: LeafletMouseEvent, map: Map): void {
    let foundFeature = false
      , instance = null
      , settings
      , sensitivityHover
      ;
    Lines.instances.forEach(function (_instance) {
      settings = _instance.settings;
      sensitivityHover = settings.sensitivityHover;
      if (!_instance.active) return;
      if (settings.map !== map) return;
      if (!settings.hover) return;
      // Check if e.latlng is inside the bbox of the features
      let bounds = geoJSON(settings.data.features).getBounds();
      
      if (inBounds(e.latlng, bounds)) {
        settings.data.features.map(feature => {
          for (let i = 1; i < feature.geometry.coordinates.length; i++) {
            let distance = pDistance(e.latlng.lng,
                                    e.latlng.lat,
                                    feature.geometry.coordinates[i - 1][0],
                                    feature.geometry.coordinates[i - 1][1],
                                    feature.geometry.coordinates[i][0],
                                    feature.geometry.coordinates[i][1]);

            if (distance < sensitivityHover) {
              sensitivityHover = distance;
              foundFeature = feature;
              instance = _instance;
            }
          }
        });
      }
    })

    if (instance) {
      instance.settings.hover(e, foundFeature);
    } else {
      return;
    }
  }
}
