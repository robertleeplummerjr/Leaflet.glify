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

readFiles([
    'src/js/glify.js',
    'src/js/canvasoverlay.js',
    'src/js/glify/points.js',
    'src/js/glify/shapes.js',
    'src/js/glify/map-matrix.js',
    'src/shader/fragment/dot.glsl',
    'src/shader/fragment/polygon.glsl',
    'src/shader/vertex.glsl'
  ],
  function(
    glifySrc,
    canvasoverlaySrc,
    pointsSrc,
    shapesSrc,
    mapMatrixSrc,
    dotSrc,
    polygonSrc,
    vertexSrc) {

    glifySrc = glifySrc
      .replace('//top-message', '//this file was auto generated, any edits to it will be lost when you run `node build.js`')
      .replace('Points: null' , 'Points: ' + pointsSrc)
      .replace('Shapes: null' , 'Shapes: ' + shapesSrc)
      .replace('mapMatrix: null' , 'mapMatrix: ' + mapMatrixSrc)
      .replace('vertex: null' , 'vertex: '  + glslMin(vertexSrc))
      .replace('dot: null'    , 'dot: '     + glslMin(dotSrc))
      .replace('polygon: null', 'polygon: ' + glslMin(polygonSrc));

    fs.writeFile('glify.js', glifySrc + canvasoverlaySrc, function(err) {
      if (err) throw err;

      console.log('done');
    })
});