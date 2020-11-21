precision mediump float;
varying vec4 _color;

void main() {
  gl_FragColor = vec4(
    _color[0],
    _color[1],
    _color[2],
    _color[3]
  );
}
