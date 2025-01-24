import { Feature, FeatureCollection, Polygon } from "geojson";
import { LatLng, LeafletMouseEvent, Map, Point } from "leaflet";
import { IShapesSettings, Shapes } from "../shapes";

jest.mock("../canvas-overlay");

const mockFeatureCollection: FeatureCollection<Polygon> = {
  type: "FeatureCollection",
  features: [
    {
        type: "Feature",
        properties: {},
        geometry: {
          type: "Polygon",
          coordinates: 
            [
              [
                [2.0, 2.0],
                [3.0, 2.0],
                [3.0, 3.0],
                [2.0, 3.0],
                [2.0, 2.0],
              ],
            ]
        }
      }
  ],
};

function getShapesMock(settings?: Partial<IShapesSettings>) {
  const element = document.createElement("div");
  const map = new Map(element);
  return {
    map,
    data: mockFeatureCollection,
    vertexShaderSource: " ",
    fragmentShaderSource: " ",
    latitudeKey: 0,
    longitudeKey: 1,
    ...settings,
  };
}

describe("Shapes Mouse interaction", () => {
  describe("tryClick", () => {
    let shapes: Shapes;
    let settings: Partial<IShapesSettings>;
    let map: Map;
    let mockClick: LeafletMouseEvent;
    let forEachSpy: jest.SpyInstance;
    beforeEach(() => {
      settings = getShapesMock({
        click: jest.fn(() => {
          return true;
        }),
      });
      shapes = new Shapes(settings);
      map = shapes.map;
      forEachSpy = jest.spyOn(shapes.data.features, "forEach");
      // const latlngArray =
      //   mockFeatureCollection.features[0].geometry.coordinates[0][0];
      // const latlng = new LatLng(latlngArray[1], latlngArray[0]); // LatLng takes [latitude, longitude]
      const latlng = new LatLng(2, 2); // LatLng takes [latitude, longitude]

      mockClick = {
        type: "click",
        target: map,
        sourceTarget: map,
        propagatedFrom: "mock",
        layer: shapes,
        latlng,
        layerPoint: new Point(1, 1),
        containerPoint: new Point(1, 1),
        originalEvent: new MouseEvent("click"),
        popup: "",
      };
    });
    afterEach(() => {
      forEachSpy.mockRestore();
    });
    describe("when layer has been removed", () => {
      it("is not checked for click", () => {
        shapes.remove();
        Shapes.tryClick(mockClick, map, [shapes]);
        expect(forEachSpy).not.toHaveBeenCalled();
      });
    });
    describe("when map is not same as instance.map", () => {
      it("is not checked for click", () => {
        Shapes.tryClick(mockClick, new Map(document.createElement("div")), [
          shapes,
        ]);
        expect(forEachSpy).not.toHaveBeenCalled();
      });
    });
    describe("when map is same", () => {
      describe("when a feature is near point", () => {
        it("calls settings.click", () => {
          Shapes.tryClick(mockClick, shapes.map, [shapes]);
          expect(shapes.settings.click).toHaveBeenCalledWith(
            mockClick,
            shapes.data.features[0]
          );
        });
        it("returns the response from settings.click", () => {
          const result = Shapes.tryClick(mockClick, shapes.map, [shapes]);
          expect(result).toBe(true);
        });
      });
    });
  });


 describe("tryHover", () => {
   let shapes: Shapes;
   let settings: Partial<IShapesSettings>;
   let map: Map;
   let mockHover: LeafletMouseEvent;
   let forEachSpy: jest.SpyInstance;
   let hoverMock: jest.Mock;

   beforeEach(() => {
     hoverMock = jest.fn(() => {
       return true;
     });
     settings = getShapesMock({
       hover: hoverMock,
     });
     shapes = new Shapes(settings);
     map = shapes.map;
     forEachSpy = jest.spyOn(shapes.data.features, "forEach");

     const latlng = new LatLng(2.5, 2.5); // Inside one of the polygons
     mockHover = {
       type: "mousemove",
       target: map,
       sourceTarget: map,
       propagatedFrom: "mock",
       layer: shapes,
       latlng,
       layerPoint: new Point(1, 1),
       containerPoint: new Point(1, 1),
       originalEvent: new MouseEvent("mousemove"),
       popup: "",
     };
   });

   afterEach(() => {
     forEachSpy.mockRestore();
   });

   describe("when layer has been removed", () => {
     it("is not checked for hover", () => {
       shapes.remove();
       Shapes.tryHover(mockHover, map, [shapes]);
       expect(forEachSpy).not.toHaveBeenCalled();
     });
   });

   describe("when map is not same as instance.map", () => {
     it("is not checked for hover", () => {
       Shapes.tryHover(mockHover, new Map(document.createElement("div")), [
         shapes,
       ]);
       expect(forEachSpy).not.toHaveBeenCalled();
     });
   });

   describe("when map is same", () => {
    //  it("is checked for hover", () => {
    //    Shapes.tryHover(mockHover, shapes.map, [shapes]);
    //    expect(forEachSpy).toHaveBeenCalled();
    //  });

     describe("when a feature is near point", () => {
       describe("when shapes.hoveringFeatures does not contain the feature being hovered", () => {
         it("adds the feature to shapes.hoveringFeatures", () => {
           const oldHoveringFeatures = shapes.hoveringFeatures;
           expect(oldHoveringFeatures).toEqual([]);
           Shapes.tryHover(mockHover, shapes.map, [shapes]);
           const newHoveringFeatures = shapes.hoveringFeatures;
           expect(oldHoveringFeatures).not.toBe(newHoveringFeatures);
           expect(newHoveringFeatures).toEqual([shapes.data.features[0]]);
         });

         it("calls settings.hover", () => {
           Shapes.tryHover(mockHover, shapes.map, [shapes]);
           expect(hoverMock).toHaveBeenCalledWith(
             mockHover,
             shapes.data.features[0]
           );
         });
       });

      //  describe("when shapes.hoveringFeatures contains the feature being hovered", () => {
      //    it("does not call settings.hover again", () => {
      //      Shapes.tryHover(mockHover, shapes.map, [shapes]);
      //      hoverMock.mockReset();
      //      Shapes.tryHover(mockHover, shapes.map, [shapes]);
      //      expect(hoverMock).not.toHaveBeenCalled();
      //    });
      //  });

       it("returns the responses from settings.hover", () => {
         const result = Shapes.tryHover(mockHover, shapes.map, [shapes]);
         expect(result).toEqual([true]);
       });
     });

     describe("when a feature is no longer hovered", () => {
       it("calls hoverOff with event and feature", () => {
         const fakeFeature: Feature<Polygon> = {
           type: "Feature",
           properties: {},
           geometry: {
             type: "Polygon",
             coordinates: [
               [
                 [5, 5],
                 [6, 5],
                 [6, 6],
                 [5, 6],
                 [5, 5],
               ],
             ],
           },
         };
         shapes.hoveringFeatures.push(fakeFeature);
         const hoverOff = (shapes.settings.hoverOff = jest.fn(() => {}));
         Shapes.tryHover(mockHover, shapes.map, [shapes]);
         expect(hoverOff).toHaveBeenCalledWith(mockHover, fakeFeature);
       });
     });
   });
 });
});
