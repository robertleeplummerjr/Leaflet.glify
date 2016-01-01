precision mediump float;
varying vec4 vColor;
uniform float opacity;

void main (void) {
  float border = 0.1;
  float radius = 0.5;
  vec2 center = vec2(0.5, 0.5);

  vec4 color = vec4(vColor[0], vColor[1], vColor[2], opacity);

  vec2 m = gl_PointCoord.xy - center;
  float dist1 = radius - sqrt(m.x * m.x + m.y * m.y);

  float t1 = 0.0;
  if (dist1 > border) {
      t1 = 1.0;
  } else if (dist1 > 0.0) {
      t1 = dist1 / border;
  }

  //works for overlapping circles if blending is enabled
  //gl_FragColor = mix(color0, color1, t);

  //border
  float outerBorder = 0.05;
  float innerBorder = 0.8;
  vec4 borderColor = vec4(0, 0, 0, 0.4);
  vec2 uv = gl_PointCoord.xy;
  vec4 clearColor = vec4(0, 0, 0, 0);
  
  // Offset uv with the center of the circle.
  uv -= center;
  
  float dist2 =  sqrt(dot(uv, uv));
 
  float t2 = 1.0 + smoothstep(radius, radius + outerBorder, dist2)
                - smoothstep(radius - innerBorder, radius, dist2);
 
  gl_FragColor = mix(mix(borderColor, clearColor, t2), color, t1);
}