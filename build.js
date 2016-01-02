var fs = require('fs');

function readFiles(files, then) {
  var counter = files.length
    , results = []
    ;
  files.forEach(function(file, i) {
    fs.readFile(file, function(err, data) {
      if (err) throw err;
      results[i] = data + '';
      counter--;
      if (counter === 0) then.apply(null, results);
    });
  });
}

function glslMin(src) {
  return '"' +
      src
        //remove possible pointless windows character
        .replace(/\r/g, '')
        //remove comments
        .replace(/[/][/].*\n/g, '')
        //remove line breaks
        .replace(/\n/g, '')
        //remove tabs
        .replace(/\t+/g, ' ')
        //remove big spaces
        .replace(/\s\s+|\t/g, ' ')

    + '"';
}

//because I didn't want to include the whole of node or of browserify just to get a few tiny scripts...
function deNodeify(rawSrc, name) {
  var src = rawSrc
    //get rid of require, they will be included globally
    .replace(/[\n]*var[ ]+\w+[ ]+[=][ ]+require[ ]*[(].+;/g, '')

    //make module.exports a return, to protect scope
    .replace(/module[.]exports[ ]+[=]/, 'return');

  if (name) {
    return '\nwindow.' + name + ' = (function() {\n' + ( src ) + '\n})();';
  } else {
    return src;
  }
}

readFiles([
    //src files
    'src/js/glify.js',
    'src/js/canvasoverlay.js',
    'src/js/glify/points.js',
    'src/js/glify/shapes.js',
    'src/js/glify/map-matrix.js',

    'src/shader/fragment/dot.glsl',
    'src/shader/fragment/point.glsl',
    'src/shader/fragment/simple-circle.glsl',
    'src/shader/fragment/square.glsl',

    'src/shader/fragment/polygon.glsl',

    'src/shader/vertex.glsl',

    //node dependencies
    'bower_components/rbush/rbush.js',
    'bower_components/point-in-polygon/index.js',
    'bower_components/polygon-lookup/lib/polygon_utils.js',
    'bower_components/polygon-lookup/index.js'
  ],
  function(
    glifySrc,
    canvasoverlaySrc,
    pointsSrc,
    shapesSrc,
    mapMatrixSrc,

    dotSrc,
    pointSrc,
    simpleCircleSrc,
    squareSrc,

    polygonSrc,

    vertexSrc,

    rbush,
    pointInPolygon,
    polygonUtils,
    PolygonLookup
  ) {

    glifySrc = glifySrc
      .replace('//top-message', '/*this file was auto generated, any edits to it will be lost when you run `node build.js`\n\
please submit pull requests by first editing src/* and then running `node build.js`*/')
      .replace('Points: null' , 'Points: ' + pointsSrc)
      .replace('Shapes: null' , 'Shapes: ' + shapesSrc)
      .replace('mapMatrix: null', 'mapMatrix: ' + mapMatrixSrc)

      .replace('vertex: null' , 'vertex: '  + glslMin(vertexSrc))

      .replace('dot: null'         , 'dot: '          + glslMin(dotSrc))
      .replace('point: null'       , 'point: '        + glslMin(pointSrc))
      .replace('simpleCircle: null', 'simpleCircle: ' + glslMin(simpleCircleSrc))
      .replace('square: null'      , 'square: '       + glslMin(squareSrc))

      .replace('polygon: null', 'polygon: ' + glslMin(polygonSrc))

      + canvasoverlaySrc

      + '\n\n//third party libraries\n\n'
      + deNodeify(rbush)
      + deNodeify(pointInPolygon, 'pointInPolygon')
      + deNodeify(polygonUtils, 'polygonUtils')
      + deNodeify(PolygonLookup, 'PolygonLookup');

    fs.writeFile('glify.js', glifySrc, function(err) {
      if (err) throw err;

      console.log('done');
    })
});