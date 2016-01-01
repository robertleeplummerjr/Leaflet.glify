# Leaflet.glify
web gl renderer plugin for leaflet


inspired by http://bl.ocks.org/Sumbera/c6fed35c377a46ff74c3 & need


## Polygon Usage
```javascript
L.glify.shapes({
  map: map,
  data: geoJson,
  click: function(shape, detail, e) {
    //do something when a shape is clicked
  }
});
```

## Points Usage
```javascript
L.glify.points({
  map: map,
  data: points,
  click: function(point, detail, e) {
    //do something when a point is clicked
  }
});
```

more to come