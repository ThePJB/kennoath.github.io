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
        canvas = document.getElementById("canvas-03-gridflow orthog-norm");
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

#define M_PI 3.1415926535897932384626433832795

precision mediump float;

uniform float time;
uniform sampler2D prev;
uniform vec2 resolution;

in vec2 uv;
out vec4 frag_colour;


float sdSegment( in vec2 p, in vec2 a, in vec2 b )
{
    vec2 pa = p-a, ba = b-a;
    float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
    return length( pa - ba*h );
}


float dLine(vec2 p, float t) {
  float x = mod(t, 1.0);
  return sdSegment(p, vec2(x, 0.0), vec2(x, 1.0));
}

// Hash function
float hash(float n) {
    return fract(sin(n) * 43758.5453123);
}

// Random unit length vector generator
vec2 hash(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.3183099 + vec3(0.1, 0.1, 0.1));
    p3 += dot(p3, p3.yzx + 19.19);
    return (fract(vec2((p3.x + p3.y) * p3.z, (p3.x + p3.z) * p3.y)) - 0.5) * 2.0;
}

vec2 f(vec2 p, vec2 targ) {
  // return orthogonal vector
  vec2 u = normalize(targ - p);
  return vec2(-u.y, u.x);
}

// interpolates between grid points
// perlin noise is this but then sum of dot products of those vectors or something? idk
vec2 flow(vec2 p) {
  vec2 ix = vec2(1.0, 0.0);
  vec2 iy = vec2(0.0, 1.0);
  vec2 p1 = floor(p);

  vec2 frac = fract(p);

  // the best part is that this is like the grid of perlin noise

  return normalize(mix(mix(f(p, p1), f(p, p1 + ix), frac.x), mix(f(p, p1 + iy), f(p, p1 + iy + ix), frac.x), frac.y));
}

void main() {
  vec2 uv_rnd = (uv*round(resolution))/resolution;
  uv_rnd = uv;
  vec2 dx = vec2(1.0/resolution.x, 0);
  vec2 dy = vec2(0, 1.0/resolution.y);

  vec2 uv_screen = (2.0 * (uv - vec2(0.5, 0.5))) / resolution.yy * resolution;

  vec2 v = flow(uv_screen*4.0);

  vec4 c1 = vec4(0.78, 0.69, 0.1, 1.0);
  vec4 c2 = vec4(0.31, 0.99, 0.47, 1.0);

  float across = mod(time*0.1, 1.0);
  if (dLine(uv, across) <= 0.004) {
    // frag_colour = vec4(1.0, 1.0, 1.0, 1.0);
    frag_colour = mix(c1, c2, across);
  } else {
    vec4 final_colour = texture(prev, uv-v*0.001)*0.99;
    final_colour.w = 1.0;
    frag_colour = final_colour;
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
        const canvas = document.getElementById("canvas-03-gridflow orthog-norm");
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
