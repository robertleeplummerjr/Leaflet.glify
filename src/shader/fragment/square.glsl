precision mediump float;
uniform float opacity;

void main() {
    float border = 0.05;
    float radius = 0.5;
    vec4 color0 = vec4(0.0, 0.0, 0.0, 0.0);
    vec4 color1 = vec4(color[0], color[1], color[2], opacity);
    vec2 m = gl_PointCoord.xy - vec2(0.5, 0.5);
    float dist = radius - sqrt(m.x * m.x + m.y * m.y);

    float t = 0.0;
    if (dist > border) {
        t = 1.0;
    } else if (dist > 0.0) {
        t = dist / border;
    }

    //squares
    gl_FragColor = vec4(color[0], color[1], color[2], opacity);
}