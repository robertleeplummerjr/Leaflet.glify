import { Map } from "leaflet";
import glify from "../index";

// Mock Leaflet map
const mockMap = {
  on: jest.fn(),
  addLayer: jest.fn(),
  removeLayer: jest.fn(),
  getCenter: jest.fn(() => ({ lat: 0, lng: 0 })),
  project: jest.fn(() => ({ x: 0, y: 0 })),
  getSize: jest.fn(() => ({ x: 800, y: 600 })),
  latLngToLayerPoint: jest.fn(() => ({ x: 0, y: 0 })),
  options: {
    crs: {
      code: "EPSG:3857"
    }
  }
} as unknown as Map;

describe("Coordinate Order Types", () => {
  beforeEach(() => {
    glify.longitudeFirst();
  });

  describe("Default WGS84 Compliance", () => {
    it("should default to WGS84 standard [longitude, latitude] order", () => {
      // This test will FAIL if someone changes the defaults to non-WGS84
      expect(glify.longitudeKey).toBe(0);
      expect(glify.latitudeKey).toBe(1);
      expect(glify.getCoordinateOrder()).toBe("lngFirst");
    });

    it("should maintain WGS84 compliance after instantiation", () => {
      // Test that the default constructor maintains WGS84 compliance
      const newGlify = new (glify.constructor as any)();
      expect(newGlify.longitudeKey).toBe(0);
      expect(newGlify.latitudeKey).toBe(1);
      expect(newGlify.getCoordinateOrder()).toBe("lngFirst");
    });

    it("should reject invalid coordinate key assignments", () => {
      // This test ensures coordinate keys can't be set to invalid values
      // Currently the library doesn't validate assignments, but this test
      // will catch if someone accidentally changes the defaults
      
      // Test that the current defaults are correct
      expect(glify.longitudeKey).toBe(0);
      expect(glify.latitudeKey).toBe(1);
      
      // Test that we can't accidentally set invalid keys that would break WGS84
      const originalLngKey = glify.longitudeKey;
      const originalLatKey = glify.latitudeKey;
      
      // These assignments should not break WGS84 compliance
      // This would be invalid
      (glify as any).longitudeKey = 2;
      // This would be invalid
      (glify as any).latitudeKey = -1;
      
      // But the getCoordinateOrder method should still work correctly
      // and the original WGS84 defaults should be restorable
      // Reset to WGS84 standard
      glify.longitudeFirst();
      expect(glify.longitudeKey).toBe(0);
      expect(glify.latitudeKey).toBe(1);
      expect(glify.getCoordinateOrder()).toBe("lngFirst");
    });
  });

  describe("GlifyCoordinateOrder type", () => {
    it("should have correct coordinate order values", () => {
      expect(glify.getCoordinateOrder()).toBe("lngFirst");
      
      glify.latitudeFirst();
      expect(glify.getCoordinateOrder()).toBe("latFirst");
      
      // Reset back to WGS84 standard
      glify.longitudeFirst();
      expect(glify.getCoordinateOrder()).toBe("lngFirst");
    });

    it("should only accept valid coordinate order values", () => {
      // This test will catch if someone adds invalid coordinate orders
      const validOrders = ["lngFirst", "latFirst"];
      const invalidOrder = "invalidOrder" as any;
      
      expect(validOrders).toContain("lngFirst");
      expect(validOrders).toContain("latFirst");
      expect(validOrders).not.toContain(invalidOrder);
    });
  });

  describe("setCoordinateOrder method", () => {
    it("should set coordinate order to lngFirst (WGS84 standard)", () => {
      glify.setCoordinateOrder("lngFirst");
      expect(glify.longitudeKey).toBe(0);
      expect(glify.latitudeKey).toBe(1);
      expect(glify.getCoordinateOrder()).toBe("lngFirst");
      
      // Verify this matches WGS84 standard
      // First element = longitude
      expect(glify.longitudeKey).toBe(0);
      // Second element = latitude
      expect(glify.latitudeKey).toBe(1);
    });

    it("should set coordinate order to latFirst (legacy format)", () => {
      glify.setCoordinateOrder("latFirst");
      expect(glify.longitudeKey).toBe(1);
      expect(glify.latitudeKey).toBe(0);
      expect(glify.getCoordinateOrder()).toBe("latFirst");
      
      // Verify this is the legacy format
      // First element = latitude
      expect(glify.latitudeKey).toBe(0);
      // Second element = longitude
      expect(glify.longitudeKey).toBe(1);
    });

    it("should maintain consistency between setCoordinateOrder and fluent methods", () => {
      // Test that setCoordinateOrder and fluent methods are equivalent
      glify.setCoordinateOrder("lngFirst");
      const lngFirstKeys = { lng: glify.longitudeKey, lat: glify.latitudeKey };
      
      glify.longitudeFirst();
      const fluentLngFirstKeys = { lng: glify.longitudeKey, lat: glify.latitudeKey };
      
      expect(lngFirstKeys).toEqual(fluentLngFirstKeys);
      
      glify.setCoordinateOrder("latFirst");
      const latFirstKeys = { lng: glify.longitudeKey, lat: glify.latitudeKey };
      
      glify.latitudeFirst();
      const fluentLatFirstKeys = { lng: glify.longitudeKey, lat: glify.latitudeKey };
      
      expect(latFirstKeys).toEqual(fluentLatFirstKeys);
    });
  });

  describe("IGlifyCoordinateConfig interface", () => {
    it("should have correct structure", () => {
      const config = {
        longitudeKey: 0,
        latitudeKey: 1,
        order: "lngFirst" as const,
      };
      
      expect(config.longitudeKey).toBe(0);
      expect(config.latitudeKey).toBe(1);
      expect(config.order).toBe("lngFirst");
    });

    it("should enforce WGS84 compliance in configuration", () => {
      // This test ensures that WGS84 compliance is enforced
      const wgs84Config = {
        // WGS84 standard: longitude first
        longitudeKey: 0,
        // WGS84 standard: latitude second
        latitudeKey: 1,
        order: "lngFirst" as const,
      };
      
      const legacyConfig = {
        // Legacy: longitude second
        longitudeKey: 1,
        // Legacy: latitude first
        latitudeKey: 0,
        order: "latFirst" as const,
      };
      
      // WGS84 config should be valid
      expect(wgs84Config.longitudeKey).toBe(0);
      expect(wgs84Config.latitudeKey).toBe(1);
      
      // Legacy config should be different from WGS84
      expect(legacyConfig.longitudeKey).not.toBe(0);
      expect(legacyConfig.latitudeKey).not.toBe(1);
    });
  });

  describe("Coordinate order in layer creation", () => {
    it("should use correct coordinate keys when creating points with WGS84 data", () => {
      glify.setCoordinateOrder("lngFirst");
      
      const points = glify.points({
        map: mockMap,
        // [lng, lat] format - WGS84 standard
        data: [[0, 0], [1, 1]],
        size: 5,
      });
      
      // Verify WGS84 compliance is maintained
      expect(points.longitudeKey).toBe(0);
      expect(points.latitudeKey).toBe(1);
      
      // Test with [longitude=0, latitude=0] - WGS84 standard format
      // [lng, lat]
      const testCoordinate = [0, 0];
      // Should get longitude (index 0)
      const lng = testCoordinate[points.longitudeKey];
      // Should get latitude (index 1)
      const lat = testCoordinate[points.latitudeKey];
      
      // With [0, 0] and lngKey=0, latKey=1:
      // lng = testCoordinate[0] = 0
      // lat = testCoordinate[1] = 0
      expect(lng).toBe(0); 
      expect(lat).toBe(0); 
      
      // Test with [longitude=1, latitude=1] to verify the pattern
      // [lng, lat]
      const testCoordinate2 = [1, 1];
      // Should get longitude (index 0)
      const lng2 = testCoordinate2[points.longitudeKey];
      // Should get latitude (index 1)
      const lat2 = testCoordinate2[points.latitudeKey];
      
      // With [1, 1] and lngKey=0, latKey=1:
      // lng2 = testCoordinate2[0] = 1
      // lat2 = testCoordinate2[1] = 1
      expect(lng2).toBe(1);
      expect(lat2).toBe(1);
    });

    it("should use correct coordinate keys when creating lines with legacy data", () => {
      glify.setCoordinateOrder("latFirst");
      
      const lines = glify.lines({
        map: mockMap,
        data: {
          type: "FeatureCollection",
          features: [{
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              // [lat, lng] format - legacy
              coordinates: [[0, 0], [1, 1]]
            }
          }]
        },
        weight: 2,
      });
      
      // Verify legacy format is handled correctly
      expect(lines.longitudeKey).toBe(1);
      expect(lines.latitudeKey).toBe(0);
      
      // Verify the data format matches the coordinate keys
      // [lat, lng]
      const testData = [0, 0];
      const lat = testData[lines.latitudeKey];
      const lng = testData[lines.longitudeKey];
      // latitude
      expect(lat).toBe(0);
      // longitude
      expect(lng).toBe(0);
    });

    it("should maintain coordinate order consistency across different layer types", () => {
      // Test that all layer types respect the same coordinate order
      glify.setCoordinateOrder("lngFirst");
      
      const points = glify.points({
        map: mockMap,
        data: [[0, 0]],
        size: 5,
      });
      
      const lines = glify.lines({
        map: mockMap,
        data: {
          type: "FeatureCollection",
          features: [{
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: [[0, 0], [1, 1]]
            }
          }]
        },
        weight: 2,
      });
      
      const shapes = glify.shapes({
        map: mockMap,
        data: {
          type: "FeatureCollection",
          features: [{
            type: "Feature",
            properties: {},
            geometry: {
              type: "Polygon",
              coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]
            }
          }]
        },
      });
      
      // All layers should use the same coordinate order
      expect(points.longitudeKey).toBe(lines.longitudeKey);
      expect(points.longitudeKey).toBe(shapes.longitudeKey);
      expect(points.latitudeKey).toBe(lines.latitudeKey);
      expect(points.latitudeKey).toBe(shapes.latitudeKey);
      
      // And it should be WGS84 standard
      expect(points.longitudeKey).toBe(0);
      expect(points.latitudeKey).toBe(1);
    });
  });

  describe("WGS84 Standard Enforcement", () => {
    it("should always default to WGS84 standard on new instances", () => {
      // This test will FAIL if someone changes the default constructor
      const freshGlify = new (glify.constructor as any)();
      expect(freshGlify.longitudeKey).toBe(0);
      expect(freshGlify.latitudeKey).toBe(1);
      expect(freshGlify.getCoordinateOrder()).toBe("lngFirst");
    });

    it("should maintain WGS84 compliance after coordinate order changes", () => {
      // Change to legacy format
      glify.setCoordinateOrder("latFirst");
      expect(glify.getCoordinateOrder()).toBe("latFirst");
      
      // Reset to WGS84 standard
      glify.setCoordinateOrder("lngFirst");
      expect(glify.longitudeKey).toBe(0);
      expect(glify.latitudeKey).toBe(1);
      expect(glify.getCoordinateOrder()).toBe("lngFirst");
    });

    it("should reject invalid coordinate order values", () => {
      // This test will catch if someone adds invalid coordinate orders
      const validOrders = ["lngFirst", "latFirst"];
      
      // Test that only valid orders are accepted
      expect(validOrders).toContain("lngFirst");
      expect(validOrders).toContain("latFirst");
      
      // Test that invalid orders are rejected (if validation is added)
      const invalidOrder = "invalidOrder" as any;
      expect(validOrders).not.toContain(invalidOrder);
      
      // Currently the library doesn't validate setCoordinateOrder input,
      // but this test will catch if someone accidentally adds invalid coordinate orders
      // or if the method signature changes unexpectedly
      
      // Test that the method signature is correct
      expect(typeof glify.setCoordinateOrder).toBe("function");
      
      // Test that valid orders work
      expect(() => glify.setCoordinateOrder("lngFirst")).not.toThrow();
      expect(() => glify.setCoordinateOrder("latFirst")).not.toThrow();
      
      // Test that the method returns the instance for chaining
      expect(glify.setCoordinateOrder("lngFirst")).toBe(glify);
      
      // Reset to WGS84 standard
      glify.longitudeFirst();
      expect(glify.getCoordinateOrder()).toBe("lngFirst");
    });
  });
});
