/**
 * @fileoverview This file contains the 3D logo demo.
 */


// This is not really a function, it's just the
// mechanism for organizing the 3d logo demo as a
// separate module.
logo3d_demo = function() {


    /**
     * Runs the 3D logo demo.
     * @param {bool} useTeapot Whether we should render the teapot instead (lol)
     * @returns void
     */
    var runDemo = function(useTeapot){

        var vertices = useTeapot ? teapot_vertex_data : logo3d_vertex_data;
        var indices = useTeapot ? teapot_poly_data : logo3d_poly_data;


        var logoCanvas = document.getElementById("myGLCanvas");
        var logoGL = WebGLUtils.setupWebGL(logoCanvas);
        logoGL.clearColor(0.265, 0.265, 0.265, 1.0);

        var logoShaderProgram; // block-I shader program
        var vertexPositionBuffer; // WebGL buffer holding vertex positions
        var vertexIndexBuffer; // WebGL buffer holding indices

        logoShaderProgram = setupShaders(logoGL);
        if(logoShaderProgram == null){
            alert("shader program is null");
        }

        // Setup buffers and extract references
        var bufferResult = setupBuffers(vertices, indices, logoGL.STATIC_DRAW, logoGL);
        vertexPositionBuffer = bufferResult.positions;
        vertexIndexBuffer = bufferResult.indices;

        function render(now) {
            draw_logo(now/200, indices.length, vertexPositionBuffer, vertexIndexBuffer, logoShaderProgram, logoGL);
            animationID = requestAnimationFrame(render);
        }
        animationID = requestAnimationFrame(render);
    };


    /**
     * Calculates transformation matrices and applies them to the given
     * shader program.
     * @param {number} angle Rotation angle
     * @param {WebGLProgram} shaderProgram Reference to the shader program it will update uniform matrices for
     * @param {WebGLRenderingContext} gl Reference to the WebGL context
     */
    var calculateMatrices = function(angle, shaderProgram, gl){
        // Create the modelview matrix
        var modelViewMatrix = glMatrix.mat4.create();

        // Create projection matrix
        var projectionMatrix = glMatrix.mat4.create();
        // Calculate perspective matrix with FOV, aspect ratio, and near/far clipping
        glMatrix.mat4.perspective(projectionMatrix, Math.PI/5, gl.canvas.width/ gl.canvas.height, 5,25);

        // Viewing position
        var eyePos = glMatrix.vec3.fromValues(7,7,7);
        glMatrix.mat4.lookAt(modelViewMatrix, eyePos, [0,0,0], [0,1,0]);

        // Calculate some fun local transforms
        var localTransforms = glMatrix.mat4.create();
        glMatrix.mat4.rotateY(localTransforms, localTransforms, angle);
        glMatrix.mat4.rotateX(localTransforms, localTransforms, angle + Math.PI/2);

        // Update uniform matrices
        gl.uniformMatrix4fv(shaderProgram.modelview, false, modelViewMatrix);
        gl.uniformMatrix4fv(shaderProgram.projection, false, projectionMatrix);
        gl.uniformMatrix4fv(shaderProgram.localTransform, false, localTransforms);
    };
    
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
    };
    
    /**
     * Loads and compiles the shaders, as well as attaching them to a new shader program.
     * Much of this is borrowed from the HelloColor/HelloTriangle example.
     * @param {WebGLRenderingContext} gl Reference to the WebGL context
     * @returns {WebGLProgram} The newly created shader program.
     */
    var setupShaders = function(gl) {
        vertexShader = loadShader("basic-shader-vs", gl);
        fragmentShader = loadShader("basic-shader-fs", gl);

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
    };


    return {
        runDemo: runDemo
    };

}();