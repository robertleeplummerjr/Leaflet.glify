precision mediump float;
  varying vec4 v_color;

  void main() {

  // -- squares
  gl_FragColor = v_color;
  gl_FragColor.a = 0.8;
  //   gl_FragColor =vec4(0.8, 0.1,0.1, 0.9); // v_color;
}