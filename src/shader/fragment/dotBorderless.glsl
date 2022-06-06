precision mediump float;
verying vec4 _color;
void main() {
  float radius = 0.5;
  vec2 center = vec2(0.5);
  vec4 color0 = vec4(0.0);
  vec2 m = gl_PointCoord.xy - center;
  float dist = radius - sqrt(m.x * m.x + m.y * m.y);
  if(dist > 0.0) {
    gl_FragColor = _color;
  else {
    gl_FragColor = color0;
  }
}
