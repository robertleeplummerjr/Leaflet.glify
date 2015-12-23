precision mediump float;
  varying vec4 vColor;

  void main() {

  // -- squares
  gl_FragColor = vColor;
  gl_FragColor.a = 0.8;
  //   gl_FragColor =vec4(0.8, 0.1,0.1, 0.9); // v_color;
}