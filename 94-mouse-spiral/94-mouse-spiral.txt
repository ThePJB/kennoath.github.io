#version 300 es
precision mediump float;

in vec2 uv;

out vec4 frag_colour;

#define PI 3.1415926535897932384626433832795
#define ROOT2INV 0.70710678118654752440084436210484903928

uniform float time;
uniform vec2 dimensions;
uniform sampler2D prev;
uniform vec2 resolution;
uniform vec2 mouse;

void main() {
  // is there a value for n_turns such that its yin yang? I think is generated other way
  // cause its like 2 circles right
    float n_turns = max(floor(mouse.x * 12.0), 1.0);
    float n_arms = max(floor(mouse.y * 8.0), 1.0);

    vec2 uv_screen = (2.0 * (uv - vec2(0.5, 0.5))) / resolution.yy * resolution;

    float x = uv_screen.x;
    float y = uv_screen.y;
    float r = sqrt(x*x+y*y);
    float theta = atan(y,x);
    float thetat = mod(theta + 2.0*time + r*n_turns*PI, 2.0*PI);
    if (r > 0.5) {
      frag_colour = vec4(0, 0, 0, 1);
    } else if (mod(thetat * n_arms, 2.0*PI) < PI) {
      frag_colour = vec4(1, 1, 1, 1);
    } else {
      frag_colour = vec4(0, 0, 1, 1);
    }
}

