precision mediump float;
varying vec4 vColor;

void main() {

    float border = 0.05;
    float radius = 0.5;
    vec4 color0 = vec4(0.0, 0.0, 0.0, 0.0);
    vec4 color1 = vec4(vColor[0], vColor[1], vColor[2], 0.2);

    vec2 m = gl_PointCoord.xy - vec2(0.5, 0.5);
    float dist = radius - sqrt(m.x * m.x + m.y * m.y);

    float t = 0.0;
    if (dist > border) {
        t = 1.0;
    } else if (dist > 0.0) {
        t = dist / border;
    }

    //simple circles
    float d = distance (gl_PointCoord, vec2(0.5,0.5));
    if (d < 0.5 ){
        gl_FragColor = vec4(vColor[0], vColor[1], vColor[2], 0.2);
    } else {
        discard;
    }
}