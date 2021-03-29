import { Glify } from "./index";
import { Points } from "./points";
import { Lines } from "./lines";
import { Shapes } from "./shapes";
import { Map } from "leaflet";
import {Feature, FeatureCollection, Point as GeoPoint} from "geojson";

jest.mock('./canvas-overlay');

describe('glify', () => {
  describe('longitudeFirst', () => {
    it('sets longitudeKey as 0 and latitudeKey as 1', () => {
      const glify = new Glify().longitudeFirst();
      expect(glify.longitudeKey).toBe(0);
      expect(glify.latitudeKey).toBe(1);
    });
  });
  describe('latitudeFirst', () => {
    it('sets longitudeKey as 1 and latitudeKey as 0', () => {
      const glify = new Glify().latitudeFirst();
      expect(glify.longitudeKey).toBe(1);
      expect(glify.latitudeKey).toBe(0);
    });
  });
  describe('instances', () => {
    it('groups all instances together', () => {
      expect(new Glify().instances).toEqual([...Points.instances, ...Lines.instances, ...Shapes.instances]);
    });
  });
  describe('points', () => {
    it('calls new this.Points with proper properties', () => {
      const glify = new Glify();
      const data: number[][] = [[1,2]];
      const size = 1;
      const map = new Map(document.createElement('div'));
      jest.spyOn(glify, 'Points');
      const points = glify.points({
        size,
        map,
        data,
      });
      expect(glify.points).toHaveBeenCalledWith({
        map,
        size,
        data,
        setupClick: points.settings.setupClick,
        setupHover: points.settings.setupHover,
        latitudeKey: glify.latitudeKey,
        longitudeKey: glify.longitudeKey,
        vertexShaderSource: points.settings.vertexShaderSource,
        fragmentShaderSource: points.settings.fragmentShaderSource,
      });
    });
  });
});
