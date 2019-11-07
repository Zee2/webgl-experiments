/**
 * @fileoverview This file contains the 3D terrain demo with blinn-phong shading.
 */

/** @global Toggle for whether to use the sphere visualization option */
var useSphere = false;

/** @global Flag for changed sphere state */
var regenModel = false;

/** @global Constant for terrain tile size (terrain_dim x terrain_dim tiles) */
const terrain_dim = 128;

/** @global Current user/pilot position */
var user_pos = glMatrix.vec3.create();
/** @global Current user/pilot rotation quaternion */
var user_rotation = glMatrix.quat.create();
/** @global Current user/pilot velocity (scalar, units per frame) */
var user_velocity = 0.005;
/** @global Current user/pilot angular velocity */
var user_angular_velocity = glMatrix.vec3.create();

/** @global Skybox mesh data (vertices) */
var skyboxVertexPosArray = [];
/** @global Skybox mesh data (indices) */
var skyboxIndexArray = [];
/** @global Skybox mesh data (normals) */
var skyboxNormalArray = [];
/** @global Skybox WebGL buffer (vertices) */
var skybox_vertexPositionBuffer;
/** @global Skybox WebGL buffer (indices) */
var skybox_vertexIndexBuffer;
/** @global Skybox WebGL buffer (normals) */
var skybox_vertexNormalBuffer




// This is not really a function, it's just the
// mechanism for organizing the terrain demo as a
// separate pseudo-"module".
// The sketchy VanillaJS equivalent of module.exports
envmap_demo = function() {

    /**
     * Runs the environment mapping demo
     * @returns void
     */
    var runDemo = function(){
        
        // Set up WebGL context
        var canvas = document.getElementById("myGLCanvas");
        var gl = WebGLUtils.setupWebGL(canvas);

        // Shader program
        var boxShaderProgram; 
        var boxShaderUniforms = [
            "u_modelview",
            "u_projection",
            "u_normalMatrix",
            "u_shininess",
        ]
        boxShaderProgram = setupShaders(gl, "box-shader-vs", "box-shader-fs", boxShaderUniforms);
        if(boxShaderProgram == null){
            alert("shader program is null");
        }
        
        // WebGL buffer holding vertex positions
        var vertexPositionBuffer;
        // WebGL buffer holding indices
        var vertexIndexBuffer;
        // WebGL buffer holding normals
        var vertexNormalBuffer;
        

        // Setup buffers and extract references
        var bufferResult = setupBuffers(gl.STATIC_DRAW, gl);
        vertexPositionBuffer = bufferResult.positions;
        vertexIndexBuffer = bufferResult.indices;
        vertexNormalBuffer = bufferResult.normals;
        var rotateX = 0;
        var dollyY = 1200;
        function render(now) {


            // Draw scene, pass in buffers
            draw(rotateX, dollyY * 0.001, bufferResult.numIndices, vertexPositionBuffer, vertexIndexBuffer, vertexNormalBuffer, boxShaderProgram, gl);
            
            // Set the uniform value for the shininess based on slider input.
            gl.uniform1f(boxShaderProgram.uniforms["u_shininess"], document.getElementById("shininess").value);

            animationID = requestAnimationFrame(render);
        }
        animationID = requestAnimationFrame(render);
    };


    /**
     * Calculates transformation matrices and applies them to the given
     * shader program.
     * @param {number} x X rotation (used to spin terrain)
     * @param {number} y Y factor (used to dolly-zoom the camera)
     * @param {WebGLProgram} shaderProgram Reference to the shader program it will update uniform matrices for
     * @param {WebGLRenderingContext} gl Reference to the WebGL context
     * @returns void
     */
    var calculate_matrices = function(x, y, shaderProgram, gl){

        // Construct perspective projection matrix.
        var projectionMatrix = glMatrix.mat4.create();
        glMatrix.mat4.perspective(projectionMatrix, Math.PI/3, gl.canvas.width/ gl.canvas.height, 0.01,40);

        // Initialize view matrix.
        var viewMatrix = glMatrix.mat4.create();

        glMatrix.mat4.lookAt(viewMatrix, [4,4,4], [0,0,0], [0,1,0]);

        // Init model matrix (this is just placeholder, not currently used)
        var modelMatrix = glMatrix.mat4.create();

        // Init model-view matrix
        var modelViewMatrix = glMatrix.mat4.create();

        // Construct model-view from model and view (duh)
        glMatrix.mat4.multiply(modelViewMatrix, viewMatrix, modelMatrix);

        // Construct normal matrix, which is simply the inverse transpose of the modelview.
        var normalMatrix = glMatrix.mat3.create();
        glMatrix.mat3.fromMat4(normalMatrix, modelViewMatrix);
        glMatrix.mat3.transpose(normalMatrix, normalMatrix);
        glMatrix.mat3.invert(normalMatrix, normalMatrix);
        
        // Load the matrices into the shader program!
        gl.uniformMatrix4fv(shaderProgram.uniforms["u_modelview"], false, modelViewMatrix);
        gl.uniformMatrix4fv(shaderProgram.uniforms["u_projection"], false, projectionMatrix);
        gl.uniformMatrix3fv(shaderProgram.uniforms["u_normalMatrix"], false, normalMatrix);
    };
    
    
    /**
     * Loads and compiles the shaders specified by vertexShader and fragmentShader,
     * and then links the shader program, and grabs the uniform locations
     * @param {WebGLRenderingContext} gl Reference to the WebGL context
     * @param {string} vertexShader Name of the vertex shader
     * @param {string} fragmentShader Name of the fragment shader
     * @param {Array} uniforms Array of attributes to map
     * @returns {WebGLProgram} The newly created shader program.
     */
    var setupShaders = function(gl, vertexShaderName, fragmentShaderName, uniforms) {
        vertexShader = loadShader(vertexShaderName, gl);
        fragmentShader = loadShader(fragmentShaderName, gl);

        var shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);
    
        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Failed to setup shaders");
        }
    
        gl.useProgram(shaderProgram);

        shaderProgram.uniforms = new Object();

        for(var uniform of uniforms){
            shaderProgram.uniforms[uniform] = gl.getUniformLocation(shaderProgram, uniform);
        }
        return shaderProgram;
    };

        
    /**
     *  Sets up buffers with model data
     *  Much of this is borrowed from the HelloColor/HelloTriangle example.
     * @param {number} drawMode Drawing mode (STATIC_DRAW, DYNAMIC_DRAW)
     * @param {boolean} generateSphere Whether to override the terrain gen and just do a sphere!
     * @param {WebGLRenderingContext} gl Reference to the WebGL context
     * @returns {object} Object with the position and index WebGLBuffers
     */
    var setupBuffers = function(drawMode, gl){
        // Various mesh data we will be generating.
        var vertexNormals = [];
        var modelData = [];
        var modelIndices = [];

        // Generate basic sphere. (Also generates element indices and normals)
        sphereFromSubdivision(4, modelData, modelIndices, vertexNormals);
        console.log(modelData.length/3 + " vertices");
        console.log(modelIndices.length/3 + " triangles");

        for(var i = 0; i < modelData.length; i+=3){
            modelData[i] += terrain_dim*0.05;
            modelData[i+1] += 1.2;
            modelData[i+2] += terrain_dim*0.05;
        }
        
        // Construct the actual WebGL buffers.

        var vertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(modelData), drawMode);

        var vertexIndexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(modelIndices), drawMode);

        var vertexNormalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals), drawMode);
        
        
        return { positions: vertexPositionBuffer,
                 indices: vertexIndexBuffer,
                 normals: vertexNormalBuffer,
                 numIndices: modelIndices.length };
    };


    

    /**
     * Draws the terrain demo.
     * @param {number} x Rotation factor
     * @param {number} y Dolly zoom factor
     * @param {number} num_polys Number of triangles to draw
     * @param {WebGLBuffer} vertexPositionBuffer WebGLBuffer for vertex position data
     * @param {WebGLBuffer} vertexIndexBuffer WebGLBuffer for vertex index data
     * @param {WebGLProgram} shaderProgram Reference to the shader program it will update uniform matrices for
     * @param {WebGLRenderingContext} gl Reference to the WebGL context
     */
    function draw(x, y, num_polys, vertexPositionBuffer, vertexIndexBuffer, vertexNormalBuffer, shaderProgram, gl){

        // Compute the various matrices for this frame
        calculate_matrices(x - 250, y, shaderProgram, gl);

        // Face culling is off by artistic choice, it looks kind of neat
        // to be able to see the underside of the terrain!
        //gl.enable(gl.CULL_FACE);


        // Set all the GL flags we need
        gl.enable(gl.DEPTH_TEST);
        gl.depthRange(-1.0, 1.0);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.clearDepth(1);

        // Configure all our buffers and attributes

        gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexIndexBuffer);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 
                                    3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute)
        
        // Tell the shader we're currently NOT drawing the skybox
        gl.uniform1f(shaderProgram.skyboxDraw, 0.0);
        // Go draw 'em!
        gl.drawElements(gl.TRIANGLES, num_polys, gl.UNSIGNED_SHORT, 0);

        

        // Draw skybox!
        // We re-bind the buffers to the skybox buffers (which are global)
        gl.bindBuffer(gl.ARRAY_BUFFER, skybox_vertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, skybox_vertexIndexBuffer);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, skybox_vertexNormalBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 
                                    3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute)
        
        // Tell the shader program we're currently drawing the skybox
        gl.uniform1f(shaderProgram.skyboxDraw, 1.0);
        // Go draw 'em!
        gl.drawElements(gl.TRIANGLES, skyboxIndexArray.length, gl.UNSIGNED_SHORT, 0);

        

    };

    // The sketchy VanillaJS equivalent of module.exports
    return {
        runDemo: runDemo
    };

}();