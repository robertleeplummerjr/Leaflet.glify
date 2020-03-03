precision mediump float;
varying vec4 _color;
uniform float opacity;

void main() {
    vec4 color1 = vec4(_color[0], _color[1], _color[2], opacity);

    //simple circles
    float d = distance (gl_PointCoord, vec2(0.5, 0.5));
    if (d < 0.5 ){
        gl_FragColor = color1;
    } else {
        discard;
    }
}