import * as L from 'leaflet';
import { FeatureCollection } from 'geojson';
import glify from './src/index';

const map = L.map('map')
  .setView([50.00, 14.44], 7);

L.tileLayer('http://{s}.sm.mapstack.stamen.com/(toner-background,$fff[difference],$fff[@23],$fff[hsl-saturation@20],toner-lines[destination-in])/{z}/{x}/{y}.png')
  .addTo(map);

Promise.all([
  wget<number[][]>('data/86T.json'),
  wget<FeatureCollection>('data/CZDistricts.json'),
  wget<FeatureCollection>('data/rivers.json')
])
  .then(([points, districts, rivers]) => {
    glify.shapes({
      map: map,
      click: (e, feature): void => {
        L.popup()
          .setLatLng(e.latlng)
          .setContent('You clicked on ' + feature.properties.NAZKR_ENG)
          .openOn(map);

        console.log(feature);
        console.log(e);
      },
      data: districts,
      border: true,
    });

    glify.lines({
      map: map,
      latitudeKey: 1,
      longitudeKey: 0,
      weight: 5,
      click: (e, feature) => {
        L.popup()
          .setLatLng(e.latlng)
          .setContent('You clicked on ' + feature.properties.name)
          .openOn(map);

        console.log(feature);
        console.log(e);
      },
      data: rivers
    });

    glify.points({
      map: map,
      size: function(i) {
        return (Math.random() * 17) + 3;
      },
      click: (e, point, xy) => {
        //set up a standalone popup (use a popup as a layer)
        L.popup()
          .setLatLng(point)
          .setContent('You clicked the point at longitude:' + point[glify.longitudeKey] + ', latitude:' + point[glify.latitudeKey])
          .openOn(map);

        console.log(point);
      },
      data: points
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
      click: (e, point) => {
        //set up a standalone popup (use a popup as a layer)
        L.popup()
          .setLatLng(point)
          .setContent('You clicked the point at longitude:' + point[glify.longitudeKey] + ', latitude:' + point[glify.latitudeKey])
          .openOn(map);

        console.log(point);
      },
      data: [[50.10164799,14.5]]
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
      click: (e, feature) => {
        //set up a standalone popup (use a popup as a layer)
        L.popup()
          .setLatLng(feature.geometry.coordinates)
          .setContent('You clicked on:' + feature.properties.name)
          .openOn(map);

        console.log(feature);
      },
      data: { //geojson
        'type': 'FeatureCollection',
        'features':[
          {
            'type':'Feature',
            'geometry': {
              'type': 'Point',
              'coordinates': [90, 135]
            },
            'properties': {
              'name': 'North Pole',
              'color': 'red'
            }
          },
          {
            'type':'Feature',
            'geometry': {
              'type': 'Point',
              'coordinates': [90, 45]
            },
            'properties': {
              'name': 'South Pole',
              'color': 'blue'
            }
          }
        ],
      }
    });
  });

function wget<T>(url): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.onload = () => {
      if (request.status < 200 && request.status > 400) {
        return reject(new Error('failure'));
      }
      resolve(JSON.parse(request.responseText) as T);
    };
    request.send();
  });
}
