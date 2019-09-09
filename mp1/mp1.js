
/** @global Array of block I vertex position data */
var vertex_data = [
	0.96784, 0.0, 1.137038,
	-0.96784, 0.0, 1.137038,
	0.96784, 0.0, -1.152229,
	-0.96784, 0.0, -1.152229,
	0.96784, 0.0, -2.494854,
	-0.96784, 0.0, -2.494854,
	0.96784, 0.0, 2.494854,
	-0.96784, 0.0, 2.494854,
	1.719309, 0.0, 1.137038,
	-1.719309, 0.0, 1.137038,
	1.719309, 0.0, -1.152229,
	-1.719309, 0.0, -1.152229,
	1.719309, 0.0, -2.494854,
	-1.719309, 0.0, -2.494854,
	1.719309, 0.0, 2.494854,
	-1.719309, 0.0, 2.494854,
	-0.96784, 1.026238, 2.494854,
	0.96784, 1.026238, 2.494854,
	0.96784, 1.026238, 1.137038,
	-1.719309, 1.026238, 1.137038,
	-1.719309, 1.026238, 2.494854,
	-0.96784, 1.026238, 1.137038,
	0.96784, 1.026238, -1.152229,
	-0.96784, 1.026238, -1.152229,
	0.96784, 1.026238, -2.494854,
	-0.96784, 1.026238, -2.494854,
	1.719309, 1.026238, 2.494854,
	1.719309, 1.026238, 1.137038,
	-1.719309, 1.026238, -2.494854,
	-1.719309, 1.026238, -1.152229,
	1.719309, 1.026238, -1.152229,
	1.719309, 1.026238, -2.494854
];

/** @global Array of block I polygon index data */
var poly_data = [
	4, 12, 10,
	1, 3, 2,
	3, 5, 4,
	7, 1, 0,
	7, 15, 9,
	0, 8, 14,
	3, 11, 13,
	24, 22, 30,
	21, 18, 22,
	23, 22, 24,
	16, 17, 18,
	16, 21, 19,
	18, 17, 26,
	23, 25, 28,
	8, 0, 18,
	3, 1, 21,
	6, 14, 26,
	13, 11, 29,
	4, 5, 25,
	11, 3, 23,
	10, 12, 31,
	0, 2, 22,
	5, 13, 28,
	12, 4, 24,
	14, 8, 27,
	7, 6, 17,
	2, 10, 30,
	15, 7, 16,
	9, 15, 20,
	1, 9, 19
];

/** @global The WebGL buffer holding the vertex positions */
var vertexPositionBuffer;
/** @global The WebGL buffer holding the vertex indices */
var vertexIndexBuffer;


/**
 * Startup function called on canvas load.
 */
function startup(){
    var logoCanvas = document.getElementById("myGLCanvas");
    var logoGL = WebGLUtils.setupWebGL(logoCanvas);

    var logoShaderProgram; // block-I shader program

    setupShaders(logoShaderProgram, logoGL);



}



/**
 * Loads and compiles the shaders, as well as attaching them to a new shader program.
 * Much of this is borrowed from the HelloColor/HelloTriangle example.
 * @param {WebGLProgram} shaderProgram Reference to the program it will add the shaders to.
 * @param {WebGLRenderingContext} gl Reference to the WebGL context
 */
function setupShaders(shaderProgram, gl) {
    vertexShader = loadShader("basic-shader-vs", gl);
    fragmentShader = loadShader("basic-shader-fs", gl);
    
    if(vertexShader == null || fragmentShader == null){
        alert("wtf");
    }

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
  
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      alert("Failed to setup shaders");
    }
  
    gl.useProgram(shaderProgram);
    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    shaderProgram.localTransform = gl.getUniformLocation(shaderProgram, "u_localTransform");
    shaderProgram.modelview = gl.getUniformLocation(shaderProgram, "u_modelview");
    shaderProgram.projection = gl.getUniformLocation(shaderProgram, "u_projection");
}

/**
 *  Loads Shaders from the DOM, given a DOM id
 *  Much of this is borrowed from the HelloColor/HelloTriangle example.
 * @param {string} id ID string of the DOM element containing the shader.
 * @param {WebGLRenderingContext} gl Reference to the WebGL context
 * @returns {WebGLShader} Compiled shader
 */
function loadShader(id, gl){
    var shaderScript = document.getElementById(id);
    if(!shaderScript){ return null; }

    // Large string containing all the shader source code we will
    // build from the various DOM scripts
    var shaderSource = "";

    // Traverse the element's children and collect all the related scripts
    var currentChild = shaderScript.firstChild;
    while (currentChild) {
        if (currentChild.nodeType == 3) { // 3 corresponds to TEXT_NODE
        shaderSource += currentChild.textContent;
        console.log(currentChild.textContent);
        }
        currentChild = currentChild.nextSibling;
    }

    // Create either vertex or fragment shader depending on script type
    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    // Set our large shader string as the source of the shaders
    gl.shaderSource(shader, shaderSource);

    // Let WebGL compile our shaders from source
    gl.compileShader(shader);

    // Verify that the shader compiled correctly.
    // If not, alert the programmer
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }
    return shader;
}

/**
 *  Sets up buffers with provided data
 *  Much of this is borrowed from the HelloColor/HelloTriangle example.
 * @param {array} positionDataArray Array of vertices (positions)
 * @param {array} indexDataArray Array of indices for faces
 * @param {WebGLBuffer} vertexPositionBuffer WebGLBuffer for vertex position data
 * @param {WebGLBuffer} vertexIndexBuffer WebGLBuffer for vertex index data
 * @param {WebGLRenderingContext} gl Reference to the WebGL context
 */
function setupBuffers(positionDataArray, indexDataArray, vertexPositionBuffer, vertexIndexBuffer, gl){

    // Setup the position buffer.
    vertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positionDataArray), gl.DYNAMIC_DRAW);

    // Setup the index buffer.
    vertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(modelIndices), gl.DYNAMIC_DRAW);
}


/**
 * Calculates transformation matrices and applies them to the given
 * shader program.
 * @param {number} angle Rotation angle
 * @param {WebGLProgram} shaderProgram Reference to the shader program it will update uniform matrices for
 * @param {WebGLRenderingContext} gl Reference to the WebGL context
 */
function calculateMatrices(angle, shaderProgram, gl){
    // Create the modelview matrix
    var modelViewMatrix = glMatrix.mat4.create();

    // Create projection matrix
    var projectionMatrix = glMatrix.mat4.create();
    // Calculate perspective matrix with FOV, aspect ratio, and near/far clipping
    glMatrix.mat4.perspective(projectionMatrix, Math.PI/5, gl.canvas.width/ gl.canvas.height, 15,150);

    // Viewing position
    var eyePos = glMatrix.vec3.fromValues(10,10,10);
    glMatrix.mat4.lookAt(modelViewMatrix, eyePos, [0,0,0], [0,1,0]);

    // Calculate some fun local transforms
    var localTransforms = glMatrix.mat4.create();
    glMatrix.mat4.rotateY(localTransforms, localTransforms, angle);
    glMatrix.mat4.rotateX(localTransforms, localTransforms, angle + Math.PI/2);

    // Update uniform matrices
    gl.uniformMatrix4fv(shaderProgram.modelview, false, modelViewMatrix);
    gl.uniformMatrix4fv(shaderProgram.projection, false, projectionMatrix);
    gl.uniformMatrix4fv(shaderProgram.localTransform, false, localTransforms);
}

