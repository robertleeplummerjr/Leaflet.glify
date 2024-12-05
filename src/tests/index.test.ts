import { Glify } from "../index";
import { IPointsSettings, Points } from "../points";
import { ILinesSettings, Lines } from "../lines";
import { IShapesSettings, Shapes } from "../shapes";
import { LatLng, LeafletMouseEvent, Map, Point } from "leaflet";
import { FeatureCollection, LineString, MultiPolygon } from "geojson";

jest.mock("../canvas-overlay");
type mouseEventFunction = (e: LeafletMouseEvent) => void;
jest.mock("../utils", () => {
  return {
    debounce: (fn: mouseEventFunction) => {
      return (e: LeafletMouseEvent) => fn(e);
    },
  };
});

describe("glify", () => {
  describe("longitudeFirst", () => {
    it("sets longitudeKey as 0 and latitudeKey as 1", () => {
      const glify = new Glify().longitudeFirst();
      expect(glify.longitudeKey).toBe(0);
      expect(glify.latitudeKey).toBe(1);
    });
  });
  describe("latitudeFirst", () => {
    it("sets longitudeKey as 1 and latitudeKey as 0", () => {
      const glify = new Glify().latitudeFirst();
      expect(glify.longitudeKey).toBe(1);
      expect(glify.latitudeKey).toBe(0);
    });
  });
  describe("instances", () => {
    it("groups all instances together", () => {
      const glify = new Glify();
      const data: number[][] = [[1, 2]];
      const size = 1;
      const map = new Map(document.createElement("div"));
      const points = glify.points({
        data,
        size,
        map,
      });
      const lines = glify.lines({
        data: {
          type: "FeatureCollection",
          features: [],
        },
        weight: size,
        map,
      });
      const shapes = glify.shapes({
        data: {
          type: "FeatureCollection",
          features: [],
        },
        map,
      });
      expect(glify.instances).toEqual([points, lines, shapes]);
      expect(new Glify().instances).toEqual([]);
    });
  });
  describe("points", () => {
    let glify: Glify;
    let constructorSpy: jest.Mock;
    beforeEach(() => {
      glify = new Glify();
      constructorSpy = jest.fn((settings: Partial<IPointsSettings>) => {});
      glify.Points = class SpyPoints extends Points {
        constructor(settings: Partial<IPointsSettings>) {
          super(settings);
          constructorSpy(settings);
        }
      };
    });
    it("calls new this.Points with proper properties and pushes to pointsInstances", () => {
      const data: number[][] = [[1, 2]];
      const size = 1;
      const map = new Map(document.createElement("div"));
      expect(glify.pointsInstances.length).toBe(0);
      const points = glify.points({
        data,
        size,
        map,
        latitudeKey: 1,
        longitudeKey: 1,
      });
      expect(glify.pointsInstances.length).toBe(1);
      expect(constructorSpy).toHaveBeenCalledWith({
        map,
        size,
        data,
        setupClick: points.settings.setupClick,
        setupContextMenu: points.settings.setupContextMenu,
        setupHover: points.settings.setupHover,
        latitudeKey: 1,
        longitudeKey: 1,
        vertexShaderSource: points.settings.vertexShaderSource,
        fragmentShaderSource: points.settings.fragmentShaderSource,
      });
    });
  });
  describe("lines", () => {
    let glify: Glify;
    let constructorSpy: jest.Mock;
    beforeEach(() => {
      glify = new Glify();
      constructorSpy = jest.fn((settings: Partial<ILinesSettings>) => {});
      glify.Lines = class SpyPoints extends Lines {
        constructor(settings: Partial<ILinesSettings>) {
          super(settings);
          constructorSpy(settings);
        }
      };
    });
    it("calls new this.Lines with proper properties and pushes to linesInstances", () => {
      const data: FeatureCollection<LineString> = {
        type: "FeatureCollection",
        features: [],
      };
      const weight = 1;
      const map = new Map(document.createElement("div"));
      expect(glify.linesInstances.length).toBe(0);
      const lines = glify.lines({
        data,
        weight,
        map,
        latitudeKey: 1,
        longitudeKey: 1,
      });
      expect(glify.linesInstances.length).toBe(1);
      expect(constructorSpy).toHaveBeenCalledWith({
        map,
        weight,
        data,
        setupClick: lines.settings.setupClick,
        setupContextMenu: lines.settings.setupContextMenu,
        setupHover: lines.settings.setupHover,
        latitudeKey: 1,
        longitudeKey: 1,
        vertexShaderSource: lines.settings.vertexShaderSource,
        fragmentShaderSource: lines.settings.fragmentShaderSource,
      });
    });
  });
  describe("shapes", () => {
    let glify: Glify;
    let constructorSpy: jest.Mock;
    beforeEach(() => {
      glify = new Glify();
      constructorSpy = jest.fn((settings: Partial<IShapesSettings>) => {});
      glify.Shapes = class SpyPoints extends Shapes {
        constructor(settings: Partial<IShapesSettings>) {
          super(settings);
          constructorSpy(settings);
        }
      };
    });
    it("calls new this.Shapes with proper properties and pushes to shapesInstances", () => {
      const data: FeatureCollection<MultiPolygon> = {
        type: "FeatureCollection",
        features: [],
      };
      const map = new Map(document.createElement("div"));
      expect(glify.shapesInstances.length).toBe(0);
      const shapes = glify.shapes({
        data,
        map,
        latitudeKey: 2,
        longitudeKey: 3,
      });
      expect(glify.shapesInstances.length).toBe(1);
      expect(constructorSpy).toHaveBeenCalledWith({
        map,
        data,
        setupClick: shapes.settings.setupClick,
        setupContextMenu: shapes.settings.setupContextMenu,
        setupHover: shapes.settings.setupHover,
        latitudeKey: 2,
        longitudeKey: 3,
        vertexShaderSource: shapes.settings.vertexShaderSource,
        fragmentShaderSource: shapes.settings.fragmentShaderSource,
      });
    });
  });
  describe("setupClick", () => {
    describe("when this.clickSetupMaps does not include map", () => {
      it("pushes it to glify.maps", () => {
        const glify = new Glify();
        const element = document.createElement("div");
        const map = new Map(element);
        expect(glify.clickSetupMaps.length).toBe(0);
        glify.setupClick(map);
        expect(glify.clickSetupMaps.length).toBe(1);
      });
    });
    describe("when this.clickSetupMaps includes map", () => {
      it("returns early", () => {
        const glify = new Glify();
        const element = document.createElement("div");
        const map = new Map(element);
        glify.clickSetupMaps.push(map);
        expect(glify.clickSetupMaps.length).toBe(1);
        glify.setupClick(map);
        expect(glify.clickSetupMaps.length).toBe(1);
      });
    });
    it('calls map.on("click") correctly', () => {
      const glify = new Glify();
      const element = document.createElement("div");
      const map = new Map(element);
      jest.spyOn(map, "on");
      glify.setupClick(map);
      expect(map.on).toHaveBeenCalled();
    });
    describe("when a click occurs", () => {
      let glify: Glify;
      let map: Map;
      let element: HTMLElement;
      let pointsTryClickSpy: jest.SpyInstance;
      let linesTryClickSpy: jest.SpyInstance;
      let shapesTryClickSpy: jest.SpyInstance;
      let latlng: LatLng;
      let layerPoint: Point;
      let containerPoint: Point;
      beforeEach(() => {
        glify = new Glify();
        glify.Points = PointsSpy;
        glify.Lines = LinesSpy;
        glify.Shapes = ShapesSpy;
        pointsTryClickSpy = jest.spyOn(glify.Points, "tryClick");
        linesTryClickSpy = jest.spyOn(glify.Lines, "tryClick");
        shapesTryClickSpy = jest.spyOn(glify.Shapes, "tryClick");
        element = document.createElement("div");
        map = new Map(element);
        glify.setupClick(map);
        map.setView([10, 10], 7);
        latlng = new LatLng(1, 1);
        layerPoint = map.latLngToLayerPoint(latlng);
        containerPoint = map.latLngToContainerPoint(latlng);
      });
      afterEach(() => {
        pointsTryClickSpy.mockRestore();
        linesTryClickSpy.mockRestore();
        shapesTryClickSpy.mockRestore();
      });
      describe("calling Points.tryClick", () => {
        describe("when Points.tryClick returns undefined", () => {
          it("continues on to Lines", () => {
            map.fireEvent("click", {
              latlng,
              layerPoint,
              containerPoint,
            });
            expect(pointsTryClickSpy.mock.calls[0][0]).toEqual({
              containerPoint,
              latlng,
              layerPoint,
              sourceTarget: map,
              target: map,
              type: "click",
            });
            expect(linesTryClickSpy.mock.calls[0][0]).toEqual({
              containerPoint,
              latlng,
              layerPoint,
              sourceTarget: map,
              target: map,
              type: "click",
            });
          });
        });
        describe("when Points.tryClick returns a value", () => {
          beforeEach(() => {
            PointsSpy.tryClickResult = false;
          });
          afterEach(() => {
            delete PointsSpy.tryClickResult;
          });
          it("returns early", () => {
            map.fireEvent("click", {
              latlng,
              layerPoint,
              containerPoint,
            });
            expect(pointsTryClickSpy.mock.calls[0][0]).toEqual({
              containerPoint,
              latlng,
              layerPoint,
              sourceTarget: map,
              target: map,
              type: "click",
            });
            expect(linesTryClickSpy).not.toHaveBeenCalled();
          });
        });
      });
      describe("calling Lines.tryClick", () => {
        describe("when Lines.tryClick returns undefined", () => {
          it("continues on to Shapes", () => {
            map.fireEvent("click", {
              latlng,
              layerPoint,
              containerPoint,
            });
            expect(linesTryClickSpy.mock.calls[0][0]).toEqual({
              containerPoint,
              latlng,
              layerPoint,
              sourceTarget: map,
              target: map,
              type: "click",
            });
            expect(shapesTryClickSpy.mock.calls[0][0]).toEqual({
              containerPoint,
              latlng,
              layerPoint,
              sourceTarget: map,
              target: map,
              type: "click",
            });
          });
        });
        describe("when Lines.tryClick returns a value", () => {
          beforeEach(() => {
            LinesSpy.tryClickResult = false;
          });
          afterEach(() => {
            delete LinesSpy.tryClickResult;
          });
          it("returns early", () => {
            map.fireEvent("click", {
              latlng,
              layerPoint,
              containerPoint,
            });
            expect(linesTryClickSpy.mock.calls[0][0]).toEqual({
              containerPoint,
              latlng,
              layerPoint,
              sourceTarget: map,
              target: map,
              type: "click",
            });
            expect(shapesTryClickSpy).not.toHaveBeenCalled();
          });
        });
      });
    });
  });
  describe.skip("setupContextMenu", () => {
    describe("when this.contextMenuSetupMaps does not include map", () => {
      it("pushes it to glify.maps", () => {
        const glify = new Glify();
        const element = document.createElement("div");
        const map = new Map(element);
        expect(glify.contextMenuSetupMaps.length).toBe(0);
        glify.setupContextMenu(map);
        expect(glify.contextMenuSetupMaps.length).toBe(1);
      });
    });
    describe("when this.contextMenuSetupMaps includes map", () => {
      it("returns early", () => {
        const glify = new Glify();
        const element = document.createElement("div");
        const map = new Map(element);
        glify.contextMenuSetupMaps.push(map);
        expect(glify.contextMenuSetupMaps.length).toBe(1);
        glify.setupContextMenu(map);
        expect(glify.contextMenuSetupMaps.length).toBe(1);
      });
    });
    it('calls map.on("contextMenu") correctly', () => {
      const glify = new Glify();
      const element = document.createElement("div");
      const map = new Map(element);
      jest.spyOn(map, "on");
      glify.setupContextMenu(map);
      expect(map.on).toHaveBeenCalled();
    });
    describe("when a contextMenu occurs", () => {
      let glify: Glify;
      let map: Map;
      let element: HTMLElement;
      let pointsTryContextMenuSpy: jest.SpyInstance;
      let linesTryContextMenuSpy: jest.SpyInstance;
      let shapesTryContextMenuSpy: jest.SpyInstance;
      let latlng: LatLng;
      let layerPoint: Point;
      let containerPoint: Point;

      beforeEach(() => {
        glify = new Glify();
        glify.Points = PointsSpy;
        glify.Lines = LinesSpy;
        glify.Shapes = ShapesSpy;
        pointsTryContextMenuSpy = jest.spyOn(glify.Points, "tryContextMenu");
        linesTryContextMenuSpy = jest.spyOn(glify.Lines, "tryContextMenu");
        shapesTryContextMenuSpy = jest.spyOn(glify.Shapes, "tryContextMenu");
        element = document.createElement("div");
        map = new Map(element);
        glify.setupContextMenu(map);
        map.setView([10, 10], 7);
        latlng = new LatLng(1, 1);
        layerPoint = map.latLngToLayerPoint(latlng);
        containerPoint = map.latLngToContainerPoint(latlng);
      });
      afterEach(() => {
        pointsTryContextMenuSpy.mockRestore();
        linesTryContextMenuSpy.mockRestore();
        shapesTryContextMenuSpy.mockRestore();
      });
      describe("calling Points.tryContextMenu", () => {
        describe("when Points.tryContextMenu returns undefined", () => {
          it("continues on to Lines", () => {
            //TODO: TypeError: Cannot read properties of undefined (reading 'preventDefault')
            map.fireEvent("contextmenu", {
              latlng,
              layerPoint,
              containerPoint,
            });
            expect(pointsTryContextMenuSpy.mock.calls[0][0]).toEqual({
              containerPoint,
              latlng,
              layerPoint,
              sourceTarget: map,
              target: map,
              type: "contextmenu",
            });
            expect(linesTryContextMenuSpy.mock.calls[0][0]).toEqual({
              containerPoint,
              latlng,
              layerPoint,
              sourceTarget: map,
              target: map,
              type: "contextmenu",
            });
          });
        });
        describe("when Points.tryContextMenu returns a value", () => {
          beforeEach(() => {
            PointsSpy.tryContextMenuResult = false;
          });
          afterEach(() => {
            delete PointsSpy.tryContextMenuResult;
          });
          it("returns early", () => {
            //TODO: TypeError: Cannot read properties of undefined (reading 'preventDefault')
            map.fireEvent("contextmenu", {
              latlng,
              layerPoint,
              containerPoint,
            });
            expect(pointsTryContextMenuSpy.mock.calls[0][0]).toEqual({
              containerPoint,
              latlng,
              layerPoint,
              sourceTarget: map,
              target: map,
              type: "click",
            });
            expect(linesTryContextMenuSpy).not.toHaveBeenCalled();
          });
        });
      });
      describe("calling Lines.tryContextMenu", () => {
        describe("when Lines.tryContextMenu returns undefined", () => {
          it("continues on to Shapes", () => {
            //TODO: TypeError: Cannot read properties of undefined (reading 'preventDefault')
            map.fireEvent("contextmenu", {
              latlng,
              layerPoint,
              containerPoint,
            });
            expect(linesTryContextMenuSpy.mock.calls[0][0]).toEqual({
              containerPoint,
              latlng,
              layerPoint,
              sourceTarget: map,
              target: map,
              type: "contextmenu",
            });
            expect(shapesTryContextMenuSpy.mock.calls[0][0]).toEqual({
              containerPoint,
              latlng,
              layerPoint,
              sourceTarget: map,
              target: map,
              type: "contextmenu",
            });
          });
        });
        describe("when Lines.tryContextMenu returns a value", () => {
          beforeEach(() => {
            LinesSpy.tryContextMenuResult = false;
          });
          afterEach(() => {
            delete LinesSpy.tryContextMenuResult;
          });
          it("returns early", () => {
            //TODO: TypeError: Cannot read properties of undefined (reading 'preventDefault')
            map.fireEvent("contextmenu", {
              latlng,
              layerPoint,
              containerPoint,
            });
            expect(linesTryContextMenuSpy.mock.calls[0][0]).toEqual({
              containerPoint,
              latlng,
              layerPoint,
              sourceTarget: map,
              target: map,
              type: "contextmenu",
            });
            expect(shapesTryContextMenuSpy).not.toHaveBeenCalled();
          });
        });
      });
    });
  });
  describe("setupHover", () => {
    describe("when this.clickSetupMaps does not include map", () => {
      it("pushes it to glify.maps", () => {
        const glify = new Glify();
        const element = document.createElement("div");
        const map = new Map(element);
        expect(glify.hoverSetupMaps.length).toBe(0);
        glify.setupHover(map);
        expect(glify.hoverSetupMaps.length).toBe(1);
      });
    });
    describe("when this.clickSetupMaps includes map", () => {
      it("returns early", () => {
        const glify = new Glify();
        const element = document.createElement("div");
        const map = new Map(element);
        glify.hoverSetupMaps.push(map);
        expect(glify.hoverSetupMaps.length).toBe(1);
        glify.setupHover(map);
        expect(glify.hoverSetupMaps.length).toBe(1);
      });
    });
    describe("when a hover occurs", () => {
      let glify: Glify;
      let map: Map;
      let element: HTMLElement;
      let latlng: LatLng;
      let layerPoint: Point;
      let containerPoint: Point;
      let pointsTryHoverSpy: jest.SpyInstance;
      let linesTryHoverSpy: jest.SpyInstance;
      let shapesTryHoverSpy: jest.SpyInstance;
      beforeEach(() => {
        glify = new Glify();
        glify.Points = PointsSpy;
        glify.Lines = LinesSpy;
        glify.Shapes = ShapesSpy;
        pointsTryHoverSpy = jest.spyOn(glify.Points, "tryHover");
        linesTryHoverSpy = jest.spyOn(glify.Lines, "tryHover");
        shapesTryHoverSpy = jest.spyOn(glify.Shapes, "tryHover");
        element = document.createElement("div");
        map = new Map(element);
        glify.setupHover(map);
        map.setView([10, 10], 7);
        latlng = new LatLng(1, 1);
        layerPoint = map.latLngToLayerPoint(latlng);
        containerPoint = map.latLngToContainerPoint(latlng);
      });
      afterEach(() => {
        pointsTryHoverSpy.mockRestore();
        linesTryHoverSpy.mockRestore();
        shapesTryHoverSpy.mockRestore();
      });
      it("calls tryHover on Points, Lines, and Shapes", () => {
        map.fireEvent("mousemove", {
          latlng,
          layerPoint,
          containerPoint,
        });
        const expected = {
          containerPoint,
          latlng,
          layerPoint,
          sourceTarget: map,
          target: map,
          type: "mousemove",
        };
        expect(pointsTryHoverSpy).toHaveBeenCalledWith(
          expected,
          map,
          glify.pointsInstances
        );
        expect(linesTryHoverSpy).toHaveBeenCalledWith(
          expected,
          map,
          glify.linesInstances
        );
        expect(shapesTryHoverSpy).toHaveBeenCalledWith(
          expected,
          map,
          glify.shapesInstances
        );
      });
    });
  });
});

class PointsSpy extends Points {
  static tryClickResult: boolean | undefined;
  static tryContextMenuResult: boolean | undefined;

  static tryClick(
    e: LeafletMouseEvent,
    map: Map,
    instances: Points[]
  ): boolean | undefined {
    return this.tryClickResult;
  }

  static tryContextMenu(
    e: LeafletMouseEvent,
    map: Map,
    instances: Points[]
  ): boolean | undefined {
    return this.tryContextMenuResult;
  }

  static tryHover(
    e: LeafletMouseEvent,
    map: Map,
    instances: Points[]
  ): boolean[] {
    return [];
  }
}
class LinesSpy extends Lines {
  static tryClickResult: boolean | undefined;
  static tryContextMenuResult: boolean | undefined;
  static tryClick(
    e: LeafletMouseEvent,
    map: Map,
    instances: Lines[]
  ): boolean | undefined {
    return this.tryClickResult;
  }

  static tryContextMenu(
    e: LeafletMouseEvent,
    map: Map,
    instances: Lines[]
  ): boolean | undefined {
    return this.tryContextMenuResult;
  }

  static tryHover(
    e: LeafletMouseEvent,
    map: Map,
    instances: Lines[]
  ): boolean[] {
    return [];
  }
}
class ShapesSpy extends Shapes {
  static tryClickResult: boolean | undefined;
  static tryContextMenuResult: boolean | undefined;
  static tryClick(
    e: LeafletMouseEvent,
    map: Map,
    instances: Shapes[]
  ): boolean | undefined {
    return this.tryClickResult;
  }

  static tryContextMenu(
    e: LeafletMouseEvent,
    map: Map,
    instances: Shapes[]
  ): boolean | undefined {
    return this.tryContextMenuResult;
  }

  static tryHover(
    e: LeafletMouseEvent,
    map: Map,
    instances: Shapes[]
  ): boolean[] {
    return [];
  }
}
