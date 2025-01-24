import * as L from "leaflet";
import { LeafletMouseEvent } from "leaflet";
import { Feature, FeatureCollection, LineString, MultiPolygon } from "geojson";
import glify from "./src/index";

const map = L.map("map").setView([50.0, 14.44], 7);

L.tileLayer(
  "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
).addTo(map);

Promise.all([
  wget<number[][]>("data/86T.json"),
  wget<FeatureCollection>("data/CZDistricts.json"),
  wget<FeatureCollection<LineString>>("data/rivers.json"),
  wget<Feature<MultiPolygon>>("data/antarctica.geojson"),
]).then(([points, districts, rivers, antarctica]) => {
  glify.shapes({
    map: map,
    click: (e, feature): void => {
      L.popup()
        .setLatLng(e.latlng)
        .setContent(`You clicked on ${feature.properties.NAZKR_ENG}`)
        .openOn(map);

      console.log("clicked on Shape", feature, e);
    },
    contextMenu: (e, feature): void => {
      e.originalEvent.preventDefault(); // Prevent the default context menu from showing
      L.popup()
        .setLatLng(e.latlng)
        .setContent(`You right clicked on ${feature.properties.NAZKR_ENG}`)
        .openOn(map);

      console.log("clicked on Shape", feature, e);
    },
    hover: (e: LeafletMouseEvent, feature) => {
      console.log("hovered on Shape", feature, e);
    },
    data: districts,
    border: true,
  });

  glify.lines({
    map,
    latitudeKey: 1,
    longitudeKey: 0,
    weight: 2,
    click: (e: LeafletMouseEvent, feature) => {
      L.popup()
        .setLatLng(e.latlng)
        .setContent(`clicked on Line ${feature.properties.name}`)
        .openOn(map);

      console.log("clicked on Line", feature, e);
    },
    contextMenu: (e: LeafletMouseEvent, feature) => {
      e.originalEvent.preventDefault(); // Prevent the default context menu from showing
      //set up a standalone popup (use a popup as a layer)
      L.popup()
        .setLatLng(e.latlng)
        .setContent(`right clicked on Line ${feature.properties.name}`)
        .openOn(map);
    },
    hover: (e: LeafletMouseEvent, feature) => {
      console.log("hovered on Line", feature, e);
    },
    hoverOff: (e: LeafletMouseEvent, feature) => {
      console.log("hovered off Line", feature, e);
    },
    data: rivers,
  });

  glify.points({
    map: map,
    size: function (i) {
      return Math.random() * 17 + 3;
    },
    hover: (e: LeafletMouseEvent, feature) => {
      console.log("hovered on Point", feature, e);
    },
    click: (e: LeafletMouseEvent, feature) => {
      //set up a standalone popup (use a popup as a layer)
      L.popup()
        .setLatLng(feature)
        .setContent(
          `You clicked the point at longitude:${e.latlng.lng}, latitude:${e.latlng.lat}`
        )
        .openOn(map);

      console.log("clicked on Point", feature, e);
    },
    contextMenu: (e: LeafletMouseEvent, feature) => {
      e.originalEvent.preventDefault(); // Prevent the default context menu from showing
      //set up a standalone popup (use a popup as a layer)
      L.popup()
        .setLatLng(feature)
        .setContent(
          `You right clicked the point at longitude:${e.latlng.lng}, latitude:${e.latlng.lat}`
        )
        .openOn(map);
    },
    data: points,
  });

  glify.points({
    map,
    size: (i) => {
      return 20;
    },
    color: () => {
      return {
        r: 1,
        g: 0,
        b: 0,
      };
    },
    click: (e: LeafletMouseEvent, feature) => {
      //set up a standalone popup (use a popup as a layer)
      L.popup()
        .setLatLng(feature)
        .setContent(
          `You clicked the point at longitude:${e.latlng.lng}, latitude:${e.latlng.lat}`
        )
        .openOn(map);

      console.log("clicked on Point", feature, e);
    },
    contextMenu: (e: LeafletMouseEvent, feature) => {
      e.originalEvent.preventDefault(); // Prevent the default context menu from showing
      //set up a standalone popup (use a popup as a layer)
      L.popup()
        .setLatLng(feature)
        .setContent(
          `You right clicked the point at longitude:${e.latlng.lng}, latitude:${e.latlng.lat}`
        )
        .openOn(map);

      console.log("clicked on Point", feature, e);
    },
    hover: (e: LeafletMouseEvent, feature) => {
      console.log("hovered on Point", feature, e);
    },
    data: [[50.10164799, 14.5]],
  });

  glify.points({
    map,
    size: (i) => {
      return 20;
    },
    color: () => {
      return {
        r: 0,
        g: 0,
        b: 1,
      };
    },
    hover: (e: LeafletMouseEvent, feature) => {
      console.log("hovered on Point", feature, e);
    },
    hoverOff: (e: LeafletMouseEvent, feature) => {},
    click: (e, feature) => {
      //set up a standalone popup (use a popup as a layer)
      L.popup()
        .setLatLng(feature.geometry.coordinates)
        .setContent("You clicked on:" + feature.properties.name)
        .openOn(map);

      console.log("clicked on Point", feature, e);
    },
    contextMenu: (e, feature) => {
      e.originalEvent.preventDefault(); // Prevent the default context menu from showing
      //set up a standalone popup (use a popup as a layer)
      L.popup()
        .setLatLng(feature.geometry.coordinates)
        .setContent("You right clicked on:" + feature.properties.name)
        .openOn(map);

      console.log("clicked on Point", feature, e);
    },
    data: {
      //geojson
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [90, 135],
          },
          properties: {
            name: "North Pole",
            color: "red",
          },
        },
        {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [90, 45],
          },
          properties: {
            name: "South Pole",
            color: "blue",
          },
        },
      ],
    },
  });

  glify.shapes({
    map,
    data: antarctica,
    border: true,
    click: (e, feature) => {
      L.popup()
        .setLatLng(e.latlng)
        .setContent(`You clicked on ${feature.properties.name}`)
        .openOn(map);

      console.log("clicked on Shape", feature, e);
    },
    contextMenu: (e, feature) => {
      e.originalEvent.preventDefault(); // Prevent the default context menu from showing
      L.popup()
        .setLatLng(e.latlng)
        .setContent(`You right clicked on ${feature.properties.name}`)
        .openOn(map);

      console.log("clicked on Shape", feature, e);
    },
    hover: (e, feature) => {
      console.log("hovered on Shape", feature, e);
    },
  });
});

function wget<T>(url: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.onload = () => {
      if (request.status < 200 && request.status > 400) {
        return reject(new Error("failure"));
      }
      resolve(JSON.parse(request.responseText) as T);
    };
    request.send();
  });
}
