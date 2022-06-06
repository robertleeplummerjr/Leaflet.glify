precision mediump float;
varying vec4 _color;

void main(){
  vec2 m = gl_PointCoord.xy;
  if(m.x < (0.5*m.y + 0.5) && m.x > (-0.5*m.y + 0.5)) {
    gl_FragColor = _color;
  } else {
    gl_FragColor = vec4(0.0);
  }
}
