{
    let gl;
    let canvas;
    let timeUniformLocation;
    let resolutionUniformLocation;
    let mouseUniformLocation;
    let joyUniformLocation;

    let fbTexture = new Array(2);
    let fb = new Array(2);
    let texUnit = new Array(2);
    let texUnitUf = new Array(2);
    let textureUniformLocation;
    let curr_fb = 0;

    let lmb = false;

    let pgm;

    // maybe the association of framebuffers and textures needs to be reversed

    async function init() {
        canvas = document.getElementById("canvas-06-gol");
        gl = canvas.getContext("webgl2", { antialias: false });
        if (!gl) {
            alert("Unable to initialize WebGL. Your browser may not support it.");
            return;
        }

        texUnit = [gl.TEXTURE0, gl.TEXTURE1];
        texUnitUf = [0, 1];

        window.addEventListener("resize", resizeCanvas);
        canvas.addEventListener("mousemove", mouseMove);
        window.addEventListener("mousedown", lmbdown);

        window.addEventListener("mouseup", function (event) {
            if (event.button === 0) {
                lmb = false;
            }
        });
        window.addEventListener("mouseleave", function (event) {
            if (event.button === 0) {
                lmb = false;
            }
        });
        // js bug reading canvas width canvas height from wrong thing?
        console.log("making canvas with width" + canvas.width + "and height" + canvas.height);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(1.0, 0.0, 0.0, 1.0);
        gl.disable(gl.BLEND);

        {
            const vertexShaderSource = `#version 300 es

in vec3 in_pos;
in vec2 in_uv;

out vec2 uv;

void main() {
    uv = in_uv;
    gl_Position = vec4(in_pos, 1.0);
}`;
            const vertexShader = compileShader(vertexShaderSource, gl.VERTEX_SHADER);
            const fragmentShaderSource = `#version 300 es
precision mediump float;

#define M_PI 3.1415926535897932384626433832795


uniform float time;
uniform vec2 dimensions;
uniform sampler2D prev;
uniform vec2 resolution;

in vec2 uv;
out vec4 frag_colour;



//	Classic Perlin 3D Noise 
//	by Stefan Gustavson
//
vec4 permutesg(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
vec3 fade(vec3 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}

float cnoise(vec3 P){
  vec3 Pi0 = floor(P); // Integer part for indexing
  vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
  Pi0 = mod(Pi0, 289.0);
  Pi1 = mod(Pi1, 289.0);
  vec3 Pf0 = fract(P); // Fractional part for interpolation
  vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;

  vec4 ixy = permutesg(permutesg(ix) + iy);
  vec4 ixy0 = permutesg(ixy + iz0);
  vec4 ixy1 = permutesg(ixy + iz1);

  vec4 gx0 = ixy0 / 7.0;
  vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);

  vec4 gx1 = ixy1 / 7.0;
  vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);

  vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
  vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
  vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
  vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
  vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
  vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
  vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

  vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 *= norm0.x;
  g010 *= norm0.y;
  g100 *= norm0.z;
  g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 *= norm1.x;
  g011 *= norm1.y;
  g101 *= norm1.z;
  g111 *= norm1.w;

  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
  float n111 = dot(g111, Pf1);

  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
  return 2.2 * n_xyz;
}

//
// Description : Array and textureless GLSL 2D simplex noise function.
//      Author : Ian McEwan, Ashima Arts.
//  Maintainer : stegu
//     Lastmod : 20110822 (ijm)
//     License : Copyright (C) 2011 Ashima Arts. All rights reserved.
//               Distributed under the MIT License. See LICENSE file.
//               https://github.com/ashima/webgl-noise
//               https://github.com/stegu/webgl-noise
// 

vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec2 mod289(vec2 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec3 permute(vec3 x) {
  return mod289(((x*34.0)+10.0)*x);
}

float snoise(vec2 v)
  {
  const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
                      0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
                     -0.577350269189626,  // -1.0 + 2.0 * C.x
                      0.024390243902439); // 1.0 / 41.0
// First corner
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);

// Other corners
  vec2 i1;
  //i1.x = step( x0.y, x0.x ); // x0.x > x0.y ? 1.0 : 0.0
  //i1.y = 1.0 - i1.x;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  // x0 = x0 - 0.0 + 0.0 * C.xx ;
  // x1 = x0 - i1 + 1.0 * C.xx ;
  // x2 = x0 - 1.0 + 2.0 * C.xx ;
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;

// Permutations
  i = mod289(i); // Avoid truncation effects in permutation
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
		+ i.x + vec3(0.0, i1.x, 1.0 ));

  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;

// Gradients: 41 points uniformly over a line, mapped onto a diamond.
// The ring size 17*17 = 289 is close to a multiple of 41 (41*7 = 287)

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;

// Normalise gradients implicitly by scaling m
// Approximation of: m *= inversesqrt( a0*a0 + h*h );
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );

// Compute final noise value at P
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

vec3 hsv2rgb(vec3 c)
{
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec4 acolour(float t) {
  return vec4(hsv2rgb(vec3(t, 1, 1)), 1);
}

float sdSegment( in vec2 p, in vec2 a, in vec2 b )
{
    vec2 pa = p-a, ba = b-a;
    float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
    return length( pa - ba*h );
}

float dPlanet(vec2 p, float t, float orbit_radius, float planet_radius) {
  return length(p - orbit_radius*vec2(cos(t), sin(t)))-planet_radius;
}

float sdBox( in vec2 p, in vec2 b )
{
    vec2 d = abs(p)-b;
    return length(max(d,0.0)) + min(max(d.x,d.y),0.0);
}

float dBox(vec2 p, float t) {
  vec2 center = vec2(0.5 * sin(t), 0.5);
  vec2 pt = p - center;
  return sdBox(pt, vec2(0.1, 0.1));
}

float dCircles(vec2 p, float t) {
  float r_spread = 0.25;
  float r_circ = 0.03;

  float t1 = t;
  float t2 = t1 + (2.0*M_PI)/3.0;
  float t3 = t2 + (2.0*M_PI)/3.0;

  vec2 p1 = r_spread*vec2(cos(t1), sin(t1));
  vec2 p2 = r_spread*vec2(cos(t2), sin(t2));
  vec2 p3 = r_spread*vec2(cos(t3), sin(t3));

  float d1 = length(p-p1) - r_circ;
  float d2 = length(p-p2) - r_circ;
  float d3 = length(p-p3) - r_circ;

  return min(min(d1, d2), d3);
}

float dSystem(vec2 p, float t) {
  return 
    min(dPlanet(p, t*0.1, 0.35, 0.05),
    min(dPlanet(p, t*0.2, 0.15, 0.03),
    min(dPlanet(p, t*0.7, 0.85, 0.03),
    dPlanet(p, M_PI + t*0.05, 0.55, 0.07)
  )));
}

void main() {
  vec2 uv_rnd = (uv*round(resolution))/resolution;
  uv_rnd = uv;
  vec2 dx = vec2(1.0/resolution.x, 0);
  vec2 dy = vec2(0, 1.0/resolution.y);

  dx *= 1.0;
  dy *= 1.0;

  vec3 me = texture(prev, uv + dx).xyz;
  vec4 acc = 
    round(texture(prev, uv_rnd + dx)) +
    round(texture(prev, uv_rnd + dy)) +
    round(texture(prev, uv_rnd + dx + dy)) +
    round(texture(prev, uv_rnd + dx - dy)) +
    round(texture(prev, uv_rnd - dx - dy)) +
    round(texture(prev, uv_rnd - dx + dy)) +
    round(texture(prev, uv_rnd - dx)) +
    round(texture(prev, uv_rnd - dy));


  vec4 old = texture(prev, uv_rnd);
  frag_colour.x = acc.x == 3.0 ? 1.0 : acc.x == 2.0 ? old.x : 0.0;
  frag_colour.y = acc.y == 3.0 ? 1.0 : acc.y == 2.0 ? old.y : 0.0;
  frag_colour.z = acc.z == 3.0 ? 1.0 : acc.z == 2.0 ? old.z : 0.0;
  frag_colour.w = 1.0;
  // frag_colour.w = acc.w == 3.0 ? 1.0 : acc.w == 2.0 ? old.w : 0.0;

  // frag_colour = vec4(0.0, 0.0, 0.0, 1.0);
  // if (acc.x == 3.0) {
  //   frag_colour = vec4(1.0, 1.0, 1.0, 1.0);
  // } else if (acc.x == 2.0) {
  //   frag_colour = texture(prev, uv_rnd);
  // }

  vec2 uv_screen = (2.0 * (uv - vec2(0.5, 0.5))) / resolution.yy * resolution;


  // if (dCircles(uv_screen, time*0.1) <= 0.0) {
  if (dPlanet(uv_screen, time*0.1, 0.35, 0.05) <= 0.0) {

  // if (dSystem(uv_screen, time) <= 0.0) {
    frag_colour = vec4(1.0, 1.0, 1.0, 1.0);
  }

}`;
            const fragmentShader = compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER);
            pgm = linkProgram(vertexShader, fragmentShader);
        }
        gl.useProgram(pgm);

        const positionAttributeLocation = gl.getAttribLocation(pgm, "in_pos");
        const uvAttributeLocation = gl.getAttribLocation(pgm, "in_uv");
        timeUniformLocation = gl.getUniformLocation(pgm, 'time');
        textureUniformLocation = gl.getUniformLocation(pgm, 'prev');
        resolutionUniformLocation = gl.getUniformLocation(pgm, 'resolution');
        mouseUniformLocation = gl.getUniformLocation(pgm, 'mouse');
        joyUniformLocation = gl.getUniformLocation(pgm, 'joy');


        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        // const positions = [    0.0, 0.5, 0.0,    -0.5, -0.5, 0.0,    0.5, -0.5, 0.0  ];
        // const positions = [    -1.0, -1.0, 0.0, 0.0, 0.0,    1.0, -1.0, 0.0, 1.0, 0.0,    1.0, 1.0, 0.0, 1.0, 1.0,   -1.0, 1.0, 0.0, 0.0, 1.0  ];
        const vertex_data = [
            // position     // texture coordinates
            -1.0, -1.0, 0.0, 0.0, 0.0,
            1.0, -1.0, 0.0, 1.0, 0.0,
            -1.0, 1.0, 0.0, 0.0, 1.0,
            1.0, 1.0, 0.0, 1.0, 1.0,
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertex_data), gl.STATIC_DRAW);
        gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 4 * 5, 0);
        gl.vertexAttribPointer(uvAttributeLocation, 2, gl.FLOAT, false, 4 * 5, 4 * 3);
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.enableVertexAttribArray(uvAttributeLocation);

        resizeCanvas();

        // Render the scene
        render();
    }

    function render() {
        const time = performance.now() / 1000;

        gl.useProgram(pgm);
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb[curr_fb]);
        gl.activeTexture(texUnit[1 - curr_fb]);
        gl.bindTexture(gl.TEXTURE_2D, fbTexture[1 - curr_fb]);
        gl.uniform1f(timeUniformLocation, time);
        gl.uniform1i(textureUniformLocation, texUnitUf[1 - curr_fb]);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, fb[curr_fb]);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
        gl.blitFramebuffer(0, 0, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height, gl.COLOR_BUFFER_BIT, gl.NEAREST);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        const error = gl.getError();
        if (gl.getError() !== gl.NO_ERROR) {
            console.error(`OpenGL error: ${error}`);
        }

        curr_fb = 1 - curr_fb;

        requestAnimationFrame(render);
    }

    function lmbdown(event) {
        if (event.button === 0) {
            lmb = true;
            var rect = canvas.getBoundingClientRect();
            var offsetX = event.clientX - rect.left;
            var offsetY = event.clientY - rect.top;
          
            // Check if the event coordinates are within the canvas boundaries
            if (offsetX >= 0 && offsetX < canvas.width && offsetY >= 0 && offsetY < canvas.height) {
                var x = (event.clientX - rect.left) / rect.width;
                var y = (event.clientY - rect.top) / rect.height;
                gl.uniform2f(mouseUniformLocation, x, y);
            }
        }
    }

    function mouseMove(event) {
        if (!lmb) {
            return;
        }
        var rect = canvas.getBoundingClientRect();
        var x = (event.clientX - rect.left) / rect.width;
        var y = (event.clientY - rect.top) / rect.height;
        gl.uniform2f(mouseUniformLocation, x, y);
    }

    function resizeCanvas() {
        const canvas = document.getElementById("canvas-06-gol");
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);
        gl.viewport(0, 0, canvas.width, canvas.height);
        fbTexture[0] = gl.createTexture();
        gl.activeTexture(texUnit[0]);
        gl.bindTexture(gl.TEXTURE_2D, fbTexture[0]);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

        // set up framebuffer
        fb[0] = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb[0]);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fbTexture[0], 0);
        console.assert(gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, null);

        fbTexture[1] = gl.createTexture();
        gl.activeTexture(texUnit[1]);
        gl.bindTexture(gl.TEXTURE_2D, fbTexture[1]);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

        // set up framebuffer
        fb[1] = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb[1]);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fbTexture[1], 0);
        console.assert(gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    init();
    // Helper function to compile a shader
    function compileShader(source, type) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error("An error occurred compiling the shaders:", gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    // Helper function to link a program
    function linkProgram(vertexShader, fragmentShader) {
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error("Unable to link the program:", gl.getProgramInfoLog(program));
            gl.deleteProgram(program);
            return null;
        }
        return program;
    }
}
