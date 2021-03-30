import { ILinesSettings, Lines } from "./lines";
import { featureGroup, LatLng, LatLngBounds, Map, Point } from "leaflet";
import { FeatureCollection, LineString } from "geojson";
import { MapMatrix } from "./map-matrix";
import { LineFeatureVertices } from "./line-feature-vertices";
import { ICanvasOverlayDrawEvent } from "./canvas-overlay";

jest.mock("./canvas-overlay");

const mockFeatureCollection: FeatureCollection<LineString> = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: [
          [1, 2],
          [3, 4],
          [5, 6],
        ],
      },
    },
  ],
};
describe("Lines", () => {
  describe("constructor", () => {
    let element: HTMLElement;
    let map: Map;
    let data: FeatureCollection<LineString>;
    let settings: Partial<ILinesSettings>;
    let setupSpy: jest.SpyInstance;
    let renderSpy: jest.SpyInstance;
    beforeEach(() => {
      element = document.createElement("div");
      map = new Map(element);
      data = {
        type: "FeatureCollection",
        features: [],
      };
      settings = {
        className: "lines-class",
        map,
        data,
        vertexShaderSource: " ",
        fragmentShaderSource: " ",
        latitudeKey: 0,
        longitudeKey: 1,
      };
      setupSpy = jest.spyOn(Lines.prototype, "setup");
      renderSpy = jest.spyOn(Lines.prototype, "render");
    });
    afterEach(() => {
      setupSpy.mockRestore();
      renderSpy.mockRestore();
    });
    it("sets this.settings", () => {
      const lines = new Lines(settings);
      expect(lines.settings).toEqual({ ...Lines.defaults, ...settings });
    });
    describe("when missing settings.data", () => {
      it("throws", () => {
        delete settings.data;
        expect(() => {
          new Lines(settings);
        }).toThrow('"data" is missing');
      });
    });
    it("sets this.active to true", () => {
      const lines = new Lines(settings);
      expect(lines.active).toBe(true);
    });
    it("calls this.setup and this.render", () => {
      new Lines(settings);
      expect(setupSpy).toHaveBeenCalled();
      expect(renderSpy).toHaveBeenCalled();
    });
  });
  describe("render", () => {
    let element: HTMLElement;
    let map: Map;
    let data: FeatureCollection<LineString>;
    let settings: Partial<ILinesSettings>;
    let resetVerticesSpy: jest.SpyInstance;
    let getBufferSpy: jest.SpyInstance;
    let getAttributeLocationSpy: jest.SpyInstance;
    beforeEach(() => {
      element = document.createElement("div");
      map = new Map(element);
      data = {
        type: "FeatureCollection",
        features: [],
      };
      settings = {
        className: "lines-class",
        color: { r: 3, g: 4, b: 5, a: 6 }, // these should be between 0 and 1, but for the same of the test
        map,
        data,
        vertexShaderSource: " ",
        fragmentShaderSource: " ",
        latitudeKey: 0,
        longitudeKey: 1,
      };
      resetVerticesSpy = jest.spyOn(Lines.prototype, "resetVertices");
      getBufferSpy = jest.spyOn(Lines.prototype, "getBuffer");
      getAttributeLocationSpy = jest.spyOn(
        Lines.prototype,
        "getAttributeLocation"
      );
    });
    afterEach(() => {
      resetVerticesSpy.mockRestore();
      getBufferSpy.mockRestore();
      getAttributeLocationSpy.mockRestore();
    });
    it("calls this.resetVertices()", () => {
      const lines = new Lines(settings);
      resetVerticesSpy.mockReset();
      lines.render();
      expect(resetVerticesSpy).toHaveBeenCalled();
    });
    it("calls gl.bindBuffer correctly", () => {
      const lines = new Lines(settings);
      const vertexBuffer = new WebGLBuffer();
      getBufferSpy.mockReturnValue(vertexBuffer);
      const bindBufferSpy = jest.spyOn(lines.gl, "bindBuffer");
      lines.render();
      expect(bindBufferSpy).toHaveBeenCalledWith(
        lines.gl.ARRAY_BUFFER,
        vertexBuffer
      );
    });
    it("calls gl.bufferData correctly", () => {
      const lines = new Lines({
        ...settings,
        data: mockFeatureCollection,
      });
      const { gl } = lines;
      const bufferDataSpy = jest.spyOn(gl, "bufferData");
      lines.render();
      expect(bufferDataSpy).toHaveBeenCalledWith(
        gl.ARRAY_BUFFER,
        lines.allVerticesTyped,
        gl.STATIC_DRAW
      );
    });
    it("calls gl.vertexAttribPointer correctly", () => {
      const lines = new Lines(settings);
      const { gl } = lines;
      jest.spyOn(lines, "getAttributeLocation").mockReturnValue(42);
      const vertexAttribPointerSpy = jest.spyOn(gl, "vertexAttribPointer");
      lines.render();
      expect(vertexAttribPointerSpy).toHaveBeenCalledWith(
        42,
        2,
        gl.FLOAT,
        false,
        24,
        0
      );
    });
    it("calls gl.enableVertexAttribArray correctly", () => {
      const lines = new Lines(settings);
      getAttributeLocationSpy.mockReturnValue(42);
      const enableVertexAttribArraySpy = jest.spyOn(
        lines.gl,
        "enableVertexAttribArray"
      );
      lines.render();
      expect(enableVertexAttribArraySpy).toHaveBeenCalledWith(42);
    });
    it("calls mapMatrix.setSize() correctly", () => {
      const lines = new Lines(settings);
      const mapMatrix = (lines.mapMatrix = new MapMatrix());
      const setSizeSpy = jest.spyOn(mapMatrix, "setSize");
      lines.render();
      expect(setSizeSpy).toHaveBeenCalledWith(
        lines.canvas.width,
        lines.canvas.height
      );
    });
    it("calls gl.viewport() correctly", () => {
      const lines = new Lines(settings);
      const { gl } = lines;
      const viewportSpy = jest.spyOn(gl, "viewport");
      lines.render();
      expect(viewportSpy).toHaveBeenCalledWith(
        0,
        0,
        lines.canvas.width,
        lines.canvas.height
      );
    });
    it("calls gl.uniformMatrix4fv() correctly", () => {
      const lines = new Lines(settings);
      const { gl } = lines;
      const uniformMatrix4fvSpy = jest.spyOn(gl, "uniformMatrix4fv");
      lines.render();
      expect(uniformMatrix4fvSpy).toHaveBeenCalledWith(
        lines.matrix,
        false,
        lines.mapMatrix.array
      );
    });
    it("calls this.attachShaderVariables() correctly", () => {
      const lines = new Lines(settings);
      const attachShaderVariablesSpy = jest.spyOn(
        lines,
        "attachShaderVariables"
      );
      lines.render();
      expect(attachShaderVariablesSpy).toHaveBeenCalledWith(4);
    });
    it("calls layer.redraw()", () => {
      const lines = new Lines(settings);
      const redrawSpy = jest.spyOn(lines.layer, "redraw");
      lines.render();
      expect(redrawSpy).toHaveBeenCalled();
    });
  });
  describe("resetVertices", () => {
    let element: HTMLElement;
    let map: Map;
    let settings: Partial<ILinesSettings>;
    beforeEach(() => {
      element = document.createElement("div");
      map = new Map(element);
      settings = {
        map,
        data: mockFeatureCollection,
        vertexShaderSource: " ",
        fragmentShaderSource: " ",
        latitudeKey: 0,
        longitudeKey: 1,
        color: { r: 3, g: 4, b: 5, a: 6 },
      };
    });
    it("accumulates this.vertices, this.allVertices and this.allVerticesTyped correctly", () => {
      const lines = new Lines(settings);
      jest.spyOn(lines.map, "project").mockReturnValue(new Point(1, 2));
      lines.resetVertices();
      const expected = [
        1,
        2,
        3,
        4,
        5,
        6,
        1,
        2,
        3,
        4,
        5,
        6,
        1,
        2,
        3,
        4,
        5,
        6,
        1,
        2,
        3,
        4,
        5,
        6,
      ];
      const expectedVerticesArray = [
        1,
        2,
        3,
        4,
        5,
        6,
        1,
        2,
        3,
        4,
        5,
        6,
        1,
        2,
        3,
        4,
        5,
        6,
      ];
      expect(lines.vertices.length).toBe(1);
      expect(lines.vertices[0].array).toEqual(expectedVerticesArray);
      expect(lines.vertices[0].settings.longitudeKey).toEqual(
        lines.longitudeKey
      );
      expect(lines.vertices[0].settings.latitudeKey).toEqual(lines.latitudeKey);
      expect(lines.vertices[0].settings.color).toEqual(lines.settings.color);
      expect(lines.vertices[0].settings.opacity).toEqual(
        lines.settings.opacity
      );
      expect(lines.allVertices).toEqual(expected);
      expect(lines.allVerticesTyped).toEqual(new Float32Array(expected));
    });
  });
  describe("drawOnCanvas", () => {
    let element: HTMLElement;
    let map: Map;
    let settings: Partial<ILinesSettings>;
    function callDrawOnCanvas(
      lines: Lines,
      event?: Partial<ICanvasOverlayDrawEvent>
    ): void {
      lines.drawOnCanvas({
        canvas: lines.canvas,
        bounds: new LatLngBounds(new LatLng(1, 1), new LatLng(2, 2)),
        offset: new Point(1, 1),
        scale: 1,
        size: new Point(10, 10),
        zoomScale: 1,
        zoom: 1,
        ...event,
      });
    }
    const event: ICanvasOverlayDrawEvent = beforeEach(() => {
      element = document.createElement("div");
      map = new Map(element);
      settings = {
        map,
        data: mockFeatureCollection,
        vertexShaderSource: " ",
        fragmentShaderSource: " ",
        latitudeKey: 0,
        longitudeKey: 1,
        color: { r: 3, g: 4, b: 5, a: 6 },
      };
    });
    it("calls gl.clear() correctly", () => {
      const lines = new Lines(settings);
      const { gl } = lines;
      const clearSpy = jest.spyOn(gl, "clear");
      callDrawOnCanvas(lines);
      expect(clearSpy).toHaveBeenCalledWith(gl.COLOR_BUFFER_BIT);
    });
    it("calls gl.viewport() correctly", () => {
      const lines = new Lines(settings);
      const { gl } = lines;
      const viewportSpy = jest.spyOn(gl, "viewport");
      callDrawOnCanvas(lines);
      expect(viewportSpy).toHaveBeenCalledWith(
        0,
        0,
        lines.canvas.width,
        lines.canvas.height
      );
    });
    it("calls gl.vertexAttrib1f() correctly", () => {
      const lines = new Lines(settings);
      const { gl } = lines;
      const vertexAttrib1fSpy = jest.spyOn(gl, "vertexAttrib1f");
      callDrawOnCanvas(lines);
      expect(vertexAttrib1fSpy).toHaveBeenCalledWith(lines.aPointSize, 4);
    });
    it("calls mapMatrix.setSize and mapMatrix.scaleMatrix correctly", () => {
      const lines = new Lines(settings);
      const setSizeSpy = jest.spyOn(lines.mapMatrix, "setSize");
      const scaleMatrixSpy = jest.spyOn(lines.mapMatrix, "scaleMatrix");
      callDrawOnCanvas(lines);
      expect(setSizeSpy).toHaveBeenCalledWith(
        lines.canvas.width,
        lines.canvas.height
      );
      expect(scaleMatrixSpy).toHaveBeenCalledWith(1);
    });
    describe("when zoom is greater than 18", () => {
      it("draws arrays once", () => {
        const lines = new Lines(settings);
        const translateMatrixSpy = jest.spyOn(
          lines.mapMatrix,
          "translateMatrix"
        );
        const uniformMatrix4fvSpy = jest.spyOn(lines.gl, "uniformMatrix4fv");
        const drawArraysSpy = jest.spyOn(lines.gl, "drawArrays");
        const offset = new Point(5, 5);
        const zoom = 19;
        callDrawOnCanvas(lines, { zoom, offset });
        expect(translateMatrixSpy).toHaveBeenCalledTimes(1);
        expect(translateMatrixSpy).toHaveBeenCalledWith(-offset.x, -offset.y);
        expect(uniformMatrix4fvSpy).toHaveBeenCalledWith(
          lines.matrix,
          false,
          lines.mapMatrix.array
        );
        expect(drawArraysSpy).toHaveBeenCalledWith(lines.gl.LINES, 0, 4);
      });
    });
    describe("when zoom is less than 19", () => {
      describe("when weight is a number", () => {
        it("draws arrays using weight", () => {
          const lines = new Lines({ ...settings, weight: 1 });
          const translateMatrixSpy = jest.spyOn(
            lines.mapMatrix,
            "translateMatrix"
          );
          const uniformMatrix4fvSpy = jest.spyOn(lines.gl, "uniformMatrix4fv");
          const drawArraysSpy = jest.spyOn(lines.gl, "drawArrays");
          const offset = new Point(5, 5);
          const zoom = 18;
          callDrawOnCanvas(lines, { zoom, offset });
          expect(translateMatrixSpy).toHaveBeenCalledTimes(25);
          expect(translateMatrixSpy).toHaveBeenCalledWith(-offset.x, -offset.y);
          expect(uniformMatrix4fvSpy).toHaveBeenCalledWith(
            lines.matrix,
            false,
            lines.mapMatrix.array
          );
          expect(drawArraysSpy).toHaveBeenCalledWith(lines.gl.LINES, 0, 4);
        });
      });
      describe("when weight is a function", () => {
        it("draws arrays using weight function", () => {
          const lines = new Lines({
            ...settings,
            weight: (i: number, feature: LineString): number => {
              return 2;
            },
          });
          const translateMatrixSpy = jest.spyOn(
            lines.mapMatrix,
            "translateMatrix"
          );
          const uniformMatrix4fvSpy = jest.spyOn(lines.gl, "uniformMatrix4fv");
          const drawArraysSpy = jest.spyOn(lines.gl, "drawArrays");
          const offset = new Point(5, 5);
          const zoom = 18;
          callDrawOnCanvas(lines, { zoom, offset });
          expect(translateMatrixSpy).toHaveBeenCalledTimes(81);
          expect(translateMatrixSpy).toHaveBeenCalledWith(-offset.x, -offset.y);
          expect(uniformMatrix4fvSpy).toHaveBeenCalledWith(
            lines.matrix,
            false,
            lines.mapMatrix.array
          );
          expect(drawArraysSpy).toHaveBeenCalledWith(lines.gl.LINES, 0, 4);
        });
      });
    });
  });
});
