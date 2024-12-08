import * as L from "leaflet";
import { LeafletMouseEvent } from "leaflet";
import { Feature, FeatureCollection, LineString, MultiPolygon } from "geojson";
import glify from "./src/index";

const map = L.map("map").setView([50.0, 14.44], 6);

L.tileLayer(
  "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
).addTo(map);

Promise.all([
  wget<number[][]>("data/86T.json"),
  wget<FeatureCollection>("data/CZDistricts.json"),
  wget<FeatureCollection<LineString>>("data/rivers.json"),
  wget<Feature<MultiPolygon>>("data/antarctica.geojson"),
]).then(([points, districts, rivers, antarctica]) => {


  if (false) {

    glify.shapes({
      map: map,
      click: (e, feature): void => {
        L.popup()
          .setLatLng(e.latlng)
          .setContent(`You clicked on ${feature.properties.NAZKR_ENG}`)
          .openOn(map);

        console.log("clicked on Shape", feature, e);
      },
      hover: (e: LeafletMouseEvent, feature) => {
        console.log("hovered on Shape", feature, e);
      },
      data: districts,
      // color: [0.1, 0.4, 0.8, 0.2],
      // color: [140, 90, 255],        // gray - outisde of 0-1 range
      // color: [0.9921568627450981, 0.9058823529411765, 0.1450980392156863],
      color: {
        r: 0.9921568627450981,
        g: 0.9058823529411765,
        b: 0.1450980392156863,
        a: 0.2,
      }, //yellow
      // color: {"r":0.26666666666666669,"g":0.00392156862745098,"b":0.32941176470588237},   // purple
      // color: "#b22121", //red
      // color: "#ff57332e", //red
      // color: '#ff5733',            //red
      // color: hexToRgb("#ff5733"),  //red
      // color: "#5aaf21",               //green
      // color: "#ff5733a3",               //green
      // color: hexToRgb("#5aaf21"),  //green
      // color: "#212daf",            //blue
      // color: hexToRgb("#212daf"),  //blue
      // color: hexToRgb("12345"), // error: gray
      // color: function (index, point) {return color_min[index];},
      border: true,
    });
    glify.lines({
      map,
      latitudeKey: 1,
      longitudeKey: 0,
      weight: 2,
      // color: [0.1, 0.4, 0.8, 0.3],
      // color: [140, 90, 255],        // gray - outisde of 0-1 range
      // color: [0.9921568627450981, 0.9058823529411765, 0.1450980392156863],
      // color: {"r":0.9921568627450981,"g":0.9058823529411765,"b":0.1450980392156863},   //yellow
      color: {
        r: 0.9921568627450981,
        g: 0.9058823529411765,
        b: 0.1450980392156863,
        a: 0.1,
      }, //yellow
      // color: {"r":0.26666666666666669,"g":0.00392156862745098,"b":0.32941176470588237},   // purple
      // color: "#b22121", //red
      // color: "#ff5733", //red
      // color: "#ff5733a3", //red with opacity?
      // color: hexToRgb("#ff5733"),  //red
      // color: "#5aaf21",               //green
      // color: hexToRgb("#5aaf21"),  //green
      // color: "#212daf",            //blue
      // color: hexToRgb("#212daf"),  //blue
      // color: hexToRgb("12345"), // error: gray
      click: (e: LeafletMouseEvent, feature) => {
        L.popup()
          .setLatLng(e.latlng)
          .setContent(`clicked on Line ${feature.properties.name}`)
          .openOn(map);

        console.log("clicked on Line", feature, e);
      },
      hover: (e: LeafletMouseEvent, feature) => {
        console.log("hovered on Line", feature, e);
      },
      hoverOff: (e: LeafletMouseEvent, feature) => {
        console.log("hovered off Line", feature, e);
      },
      data: rivers,
    });
  }

  const colors = points.map((_, index) => {
    if (index % 2 === 0) {
      // Every even index gets a color with opacity
      return `#ff5733a3`; // Example: Red with opacity
    } else {
      // Every odd index gets a solid color
      return `#33ff57`; // Example: Green without opacity
    }
  });
  console.log("points");console.log(points);
var color_min = [
  [0.462745098039216, 0.129411764705882, 0.505882352941176],
  [0.431372549019608, 0.117647058823529, 0.505882352941176],
  [0.0901960784313725, 0.0588235294117647, 0.235294117647059],
]; 
var arr_min = [
  [0.462745098039216, 0.129411764705882, 0.505882352941176],
  [0.462745098039216, 0.129411764705882, 0.505882352941176],
  [0.431372549019608, 0.117647058823529, 0.505882352941176],
];
  var clrs;
  if (color_min.length === 1) {
    clrs = color_min[0];
  } else {
    clrs = function (index: number, point: any) {
      return color_min[index];
    };
  }
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
    // color: [0.1, 0.4, 0.8, 0.3],
    // color: [140, 90, 255],        // gray - outisde of 0-1 range
    // color: [0.9921568627450981, 0.9058823529411765, 0.1450980392156863],
    // color: {"r":0.9921568627450981,"g":0.9058823529411765,"b":0.1450980392156863},   //yellow
    // color: {"r":0.26666666666666669,"g":0.00392156862745098,"b":0.32941176470588237},   // purple
    // color: "#b22121",   //red
    // color: "#ff5733",   //red
    // color: "#ff5733a3", //red with opacity?
    // color: "#5aaf21",   //green
    // color: "#212daf",   //blue
    // color: colors,
    color: clrs,
    // color: function(index, point) { return colors[index]; },
    data: points,
  });
if (false) {


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
    hover: (e, feature) => {
      console.log("hovered on Shape", feature, e);
    },
  });
}

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
