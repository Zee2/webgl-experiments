
/**
 * @file A simple WebGL example drawing a triangle with colors
 * @author Eric Shaffer <shaffer1@eillinois.edu>  
 */

/** @global The WebGL context */
var gl;

/** @global The HTML5 canvas we draw on */
var canvas;

/** @global A simple GLSL shader program */
var shaderProgram;

/** @global The WebGL buffer holding the triangle */
var vertexPositionBuffer;

var vertexIndexBuffer;

var terrain_dim;

/** @global The WebGL buffer holding the vertex colors */
var vertexColorBuffer;

const triangleVertices = [
  0.0,  0.5,  0.0,
 -0.5, -0.5,  0.0,
  0.5, -0.5,  0.0
];

var modelData = [
  // Front face
  -1.0, -1.0,  1.0,
   1.0, -1.0,  1.0,
   1.0,  1.0,  1.0,
  -1.0,  1.0,  1.0,
  
  // Back face
  -1.0, -1.0, -1.0,
  -1.0,  1.0, -1.0,
   1.0,  1.0, -1.0,
   1.0, -1.0, -1.0,
  
  // Top face
  -1.0,  1.0, -1.0,
  -1.0,  1.0,  1.0,
   1.0,  1.0,  1.0,
   1.0,  1.0, -1.0,
  
  // Bottom face
  -1.0, -1.0, -1.0,
   1.0, -1.0, -1.0,
   1.0, -1.0,  1.0,
  -1.0, -1.0,  1.0,
  
  // Right face
   1.0, -1.0, -1.0,
   1.0,  1.0, -1.0,
   1.0,  1.0,  1.0,
   1.0, -1.0,  1.0,
  
  // Left face
  -1.0, -1.0, -1.0,
  -1.0, -1.0,  1.0,
  -1.0,  1.0,  1.0,
  -1.0,  1.0, -1.0,

  // Ground plane
  -3.0, -1.0, -3.0,
   3.0, -1.0, -3.0,
   3.0, -1.0,  3.0,
  -3.0, -1.0,  3.0,

];

var modelIndices = [
  0,  1,  2,      0,  2,  3,    // front
  4,  5,  6,      4,  6,  7,    // back
  8,  9,  10,     8,  10, 11,   // top
  12, 13, 14,     12, 14, 15,   // bottom
  16, 17, 18,     16, 18, 19,   // right
  20, 21, 22,     20, 22, 23,   // left
  24, 26, 25,     24, 27, 26
];
//
var m4 = {
  translation: function(tx, ty, tz) {
    return [
       1,  0,  0,  0,
       0,  1,  0,  0,
       0,  0,  1,  0,
       tx, ty, tz, 1,
    ];
  },
 
  xRotation: function(angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);
 
    return [
      1, 0, 0, 0,
      0, c, s, 0,
      0, -s, c, 0,
      0, 0, 0, 1,
    ];
  },
 
  yRotation: function(angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);
 
    return [
      c, 0, -s, 0,
      0, 1, 0, 0,
      s, 0, c, 0,
      0, 0, 0, 1,
    ];
  },
 
  zRotation: function(angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);
 
    return [
       c, s, 0, 0,
      -s, c, 0, 0,
       0, 0, 1, 0,
       0, 0, 0, 1,
    ];
  },
 
  scaling: function(sx, sy, sz) {
    return [
      sx, 0,  0,  0,
      0, sy,  0,  0,
      0,  0, sz,  0,
      0,  0,  0,  1,
    ];
  },
};

/**
 * Creates a context for WebGL
 * @param {element} canvas WebGL canvas
 * @return {Object} WebGL context
 */
function createGLContext(canvas) {
  var context = null;
  context = canvas.getContext("webgl");
  if (context) {
    context.viewportWidth = canvas.width;
    context.viewportHeight = canvas.height;
  } else {
    alert("Failed to create WebGL context!");
  }
  return context;
}

/**
 * Loads Shaders
 * @param {string} id ID string for shader to load. Either vertex shader/fragment shader
 */
function loadShaderFromDOM(id) {
  var shaderScript = document.getElementById(id);
  
  // If we don't find an element with the specified id
  // we do an early exit 
  if (!shaderScript) {
    return null;
  }
  
  // Loop through the children for the found DOM element and
  // build up the shader source code as a string
  var shaderSource = "";
  var currentChild = shaderScript.firstChild;
  while (currentChild) {
    if (currentChild.nodeType == 3) { // 3 corresponds to TEXT_NODE
      shaderSource += currentChild.textContent;
      console.log(currentChild.textContent);
    }
    currentChild = currentChild.nextSibling;
  }
 
  var shader;
  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;
  }
 
  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);
 
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  } 
  return shader;
}

/**
 * Setup the fragment and vertex shaders
 */
function setupShaders() {
  vertexShader = loadShaderFromDOM("shader-vs");
  fragmentShader = loadShaderFromDOM("shader-fs");
  
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Failed to setup shaders");
  }

  gl.useProgram(shaderProgram);
  shaderProgram.scaleFactor = gl.getUniformLocation(shaderProgram, "u_scaleFactor");
  shaderProgram.scaleFactor2 = gl.getUniformLocation(shaderProgram, "u_scaleFactor2");
  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  shaderProgram.localTransform = gl.getUniformLocation(shaderProgram, "u_localTransform");
  shaderProgram.modelview = gl.getUniformLocation(shaderProgram, "u_modelview");
  shaderProgram.projection = gl.getUniformLocation(shaderProgram, "u_projection");
  shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor"); 
}

/**
 * Populate buffers with data
 */
function setupBuffers(heightmap_data) {
  vertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);

  var triangleVertices = [
    0.0,  0.5,  0.2,
   -0.5, -0.5,  0.2,
    0.5, -0.5,  0.2
  ];

  terrain_dim = 256;

  modelData = [];
  for(var y = 0; y < terrain_dim; y++){
    for(var x = 0; x < terrain_dim; x++){
      
      modelData.push(x*0.1, 0, y*0.1);
    }
  }
  console.log(modelData.length/3 + " vertices");
  modelIndices = [];
  for(var y = 0; y < terrain_dim-1; y++){
    for(var x = 0; x < terrain_dim-1; x++){
      var index = x + y * terrain_dim;
      modelIndices.push(index, index + terrain_dim, index + 1);
      modelIndices.push(index + terrain_dim, index + 1 + terrain_dim, index + 1);
    }
  }
  console.log(modelIndices.length/3 + " triangles");

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(modelData), gl.STATIC_DRAW);
  //vertexPositionBuffer.itemSize = 3;
  //vertexPositionBuffer.numberOfItems = 3;

  vertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(modelIndices), gl.STATIC_DRAW);
  //vertexIndexBuffer.itemSize = 3;
  //vertexIndexBuffer.numberOfItems = modelIndices/3;

  vertexColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  var colors = [
        1.0, 0.0, 0.0, 1.0,
        0.0, 1.0, 0.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        1.0, 0.0, 0.0, 1.0,
        0.0, 1.0, 0.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        1.0, 0.0, 0.0, 1.0,
        0.0, 1.0, 0.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        1.0, 0.0, 0.0, 1.0,
        0.0, 1.0, 0.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        1.0, 0.0, 0.0, 1.0,
        0.0, 1.0, 0.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        1.0, 0.0, 0.0, 1.0,
        0.0, 1.0, 0.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        1.0, 0.0, 0.0, 1.0,
        0.0, 1.0, 0.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        1.0, 0.0, 0.0, 1.0,
        0.0, 1.0, 0.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
    ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
  vertexColorBuffer.itemSize = 4;
  vertexColorBuffer.numItems = colors.length/4;  


  // Create a texture.
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  
  // Set the parameters so we can render any size image.
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR );
  
  // Upload the image into the texture.
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, heightmap_data);

}

function calculate_matrices(x, y) {
  var modelViewMatrix = glMatrix.mat4.create();

  var projectionMatrix = glMatrix.mat4.create();
  glMatrix.mat4.perspective(projectionMatrix, Math.PI/5, gl.canvas.width/ gl.canvas.height, 15,150);

  var eyePos = glMatrix.vec3.fromValues(0,32,32);
  
  //glMatrix.vec3.scale(eyePos, eyePos, 1.0 + x/100);
  
  //glMatrix.mat4.rotateY(perspective, perspective, x/100);
  //glMatrix.mat4.rotateX(perspective, perspective, y/100);
  
  //alert("eyepos: " + eyePos);

  glMatrix.mat4.lookAt(modelViewMatrix, eyePos, [0,0,0], [0,1,0]);
  //glMatrix.mat4.translate(matrix, matrix, [0, 0, 5]);
  

  var local = glMatrix.mat4.create();
  glMatrix.mat4.rotateX(local, local, y/200);
  glMatrix.mat4.rotateY(local, local, x/200);
  glMatrix.mat4.translate(local, local, [-(terrain_dim * 0.1 * 0.5), 0, -(terrain_dim * 0.1 * 0.5)]);
  //
  
  
  //glMatrix.mat4.scale(local, local, [0.5, 0.5, 0.5]);
  gl.uniformMatrix4fv(shaderProgram.modelview, false, modelViewMatrix);
  gl.uniformMatrix4fv(shaderProgram.projection, false, projectionMatrix);
  gl.uniformMatrix4fv(shaderProgram.localTransform, false, local);

}

/**
 * Draw call that applies matrix transformations to model and draws model in frame
 */
function draw(x, y, factor, factor2) {
  calculate_matrices(x - 250, y - 250, );
  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);
  //gl.depthMask(gl.GL_TRUE);
  gl.depthFunc(gl.LEQUAL);
  gl.depthRange(-1.0, 1.0);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT);
  //gl.clearDepth(1);

  calculate_matrices(x - 250, y - 250, );

  gl.uniform1f(shaderProgram.scaleFactor, factor);
  gl.uniform1f(shaderProgram.scaleFactor2, factor2);

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexIndexBuffer);

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 
                            4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute)


  //gl.drawArrays(gl.TRIANGLES, 0, vertexPositionBuffer.numberOfItems);                        
  gl.drawElements(gl.TRIANGLES, modelIndices.length, gl.UNSIGNED_SHORT, 0);
}


