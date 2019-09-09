// Model data located in separate files.

var selectedDemo = "teapot";


var animationID;
/**
 * Startup function called on canvas load.
 */
function startup(){
    var radiobuttons = document.getElementsByTagName("input");
    for(let button of radiobuttons){
        button.onclick = function() {
            selectedDemo = button.value;
            if(animationID != null){
                cancelAnimationFrame(animationID);
                runDemo();
            }
        };
    }

    runDemo();

}


function runDemo(){
    var currentDemo = selectedDemo;
    var vertex_data, poly_data;
    if(currentDemo == "teapot"){
        vertex_data = teapot_vertex_data;
        poly_data = teapot_poly_data;
    } else if(currentDemo == "3dlogo"){
        vertex_data = logo3d_vertex_data;
        poly_data = logo3d_poly_data;
    } else {
        vertex_data = logo3d_vertex_data;
        poly_data = logo3d_poly_data;
    }


    var logoCanvas = document.getElementById("myGLCanvas");
    var logoGL = WebGLUtils.setupWebGL(logoCanvas);
    logoGL.clearColor(0.8, 0.8, 0.8, 1.0);

    var logoShaderProgram; // block-I shader program
    var vertexPositionBuffer; // WebGL buffer holding vertex positions
    var vertexIndexBuffer; // WebGL buffer holding indices

    logoShaderProgram = setupShaders(logoGL);
    if(logoShaderProgram == null){
        alert("shader program is null");
    }

    // Setup buffers and extract references
    var bufferResult = setupBuffers(vertex_data, poly_data, logoGL);
    vertexPositionBuffer = bufferResult.positions;
    vertexIndexBuffer = bufferResult.indices;

    function render(now) {
        draw_logo(now/200, poly_data.length, vertexPositionBuffer, vertexIndexBuffer, logoShaderProgram, logoGL);
        animationID = requestAnimationFrame(render);
    }
    animationID = requestAnimationFrame(render);
}


/**
 * Loads and compiles the shaders, as well as attaching them to a new shader program.
 * Much of this is borrowed from the HelloColor/HelloTriangle example.
 * @param {WebGLRenderingContext} gl Reference to the WebGL context
 * @returns {WebGLProgram} The newly created shader program.
 */
function setupShaders(gl) {
    vertexShader = loadShader("basic-shader-vs", gl);
    fragmentShader = loadShader("basic-shader-fs", gl);
    
    if(vertexShader == null || fragmentShader == null){
        alert("wtf");
    }

    var shaderProgram = gl.createProgram();
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
    shaderProgram.logoColor1 = gl.getUniformLocation(shaderProgram, "u_logo_color1");
    shaderProgram.logoColor2 = gl.getUniformLocation(shaderProgram, "u_logo_color2");

    return shaderProgram;
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
 * @param {WebGLRenderingContext} gl Reference to the WebGL context
 * @returns {object} Object with the position and index WebGLBuffers
 */
function setupBuffers(positionDataArray, indexDataArray, gl){

    // Setup the position buffer.
    var vertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positionDataArray), gl.STATIC_DRAW);

    // Setup the index buffer.
    var vertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexDataArray), gl.STATIC_DRAW);

    return {positions: vertexPositionBuffer, indices: vertexIndexBuffer};
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
    glMatrix.mat4.perspective(projectionMatrix, Math.PI/5, gl.canvas.width/ gl.canvas.height, 5,25);

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

/**
 * Draws the logo.
 * @param {number} time Current time variable used for animation
 * @param {number} num_polys Number of triangles to draw
 * @param {WebGLBuffer} vertexPositionBuffer WebGLBuffer for vertex position data
 * @param {WebGLBuffer} vertexIndexBuffer WebGLBuffer for vertex index data
 * @param {WebGLProgram} shaderProgram Reference to the shader program it will update uniform matrices for
 * @param {WebGLRenderingContext} gl Reference to the WebGL context
 */
function draw_logo(time, num_polys, vertexPositionBuffer, vertexIndexBuffer, shaderProgram, gl){
    calculateMatrices(time/10, shaderProgram, gl);
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.depthRange(0, 1.0);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.clearDepth(1);

    // Set some fun colors!
    gl.uniform4fv(shaderProgram.logoColor1, [1.0, 0.4, 0.0, 1.0]);
    gl.uniform4fv(shaderProgram.logoColor2, [0.0, 0.7, 1.0, 1.0]);

    // Bind the vertex position buffer and enable the attrib array with the correct pointer settings
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

    // Bind the index buffer (wow, that's easy!)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexIndexBuffer);
    gl.drawElements(gl.TRIANGLES, num_polys, gl.UNSIGNED_SHORT, 0);
    
}

