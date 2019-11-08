/**
 * @fileoverview This file contains the 3D terrain demo with blinn-phong shading.
 */

/** @global Toggle for whether to use the sphere visualization option */
var useSphere = false;





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

        const faceInfos = [
            {
              target: gl.TEXTURE_CUBE_MAP_POSITIVE_X, 
              url: 'envmap/pos-x.jpg',
            },
            {
              target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 
              url: 'envmap/neg-x.jpg',
            },
            {
              target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 
              url: 'envmap/pos-y.jpg',
            },
            {
              target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 
              url: 'envmap/neg-y.jpg',
            },
            {
              target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 
              url: 'envmap/pos-z.jpg',
            },
            {
              target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 
              url: 'envmap/neg-z.jpg',
            },
        ];

        // Box shader program
        var boxShaderProgram; 
        var boxShaderUniforms = [
            "u_modelview",
            "u_projection",
            "u_normalMatrix",
            "u_shininess",
            "u_baseColor",
            "u_cubemap",
            "u_worldCameraPosition",
            "u_time"
        ]
        var boxShaderAttributes = [
            "aVertexPosition",
            "aVertexNormal"
        ];
        boxShaderProgram = setupShaders(gl, "box-shader-vs", "box-shader-fs", boxShaderUniforms, boxShaderAttributes);
        if(boxShaderProgram == null){
            alert("shader program is null");
        }

        // Sky shader program
        var skyShaderProgram; 
        var skyShaderUniforms = [
            "u_vpInverse",
            "u_cubemap"
        ]
        var skyShaderAttributes = [
            "aVertexPosition",
            "aVertexNormal"
        ];
        skyShaderProgram = setupShaders(gl, "sky-shader-vs", "sky-shader-fs", skyShaderUniforms, skyShaderAttributes);
        if(skyShaderProgram == null){
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
        var rotateY = 0;
        
        setupCubemap(faceInfos, gl);
        
        gl.useProgram(boxShaderProgram);
        gl.uniform1i(boxShaderProgram.uniforms["u_cubemap"], 0);
        gl.useProgram(skyShaderProgram);
        gl.uniform1i(skyShaderProgram.uniforms["u_cubemap"], 0);

        function render(now) {


            // Draw scene, pass in buffers
            //draw(rotateX, dollyY * 0.001, bufferResult, boxShaderProgram, gl);
            
            draw_sky(rotateX * 0.01, rotateY * 0.01, bufferResult, skyShaderProgram, gl);
            draw_model(rotateX * 0.01, rotateY * 0.01, bufferResult, boxShaderProgram, gl);

            gl.uniform1f(boxShaderProgram.uniforms["u_time"], now);

            // Set the uniform value for the shininess based on slider input.
            gl.uniform1f(boxShaderProgram.uniforms["u_shininess"], document.getElementById("shininess").value);

            gl.uniform4fv(boxShaderProgram.uniforms["u_baseColor"], [0.0, 1.0, 1.0, 1.0]);

            rotateX += mouseVelX;
            rotateX *= 0.9
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
     * @returns set of matrices
     */
    var calculate_matrices = function(x, y, shaderProgram, gl){

        // Construct perspective projection matrix.
        var projectionMatrix = glMatrix.mat4.create();
        glMatrix.mat4.perspective(projectionMatrix, Math.PI/3, gl.canvas.width/ gl.canvas.height, 0.01,40);

        // Initialize view matrix.
        var viewMatrix = glMatrix.mat4.create();

        var eyePos = [2*Math.cos(x),2*Math.cos(x + Math.PI),2*Math.sin(x)];

        glMatrix.mat4.lookAt(viewMatrix, eyePos, [0,0,0], [0,1,0]);


        gl.uniform3fv(shaderProgram.uniforms["u_worldCameraPosition"], eyePos);

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

        var newViewMatrix = glMatrix.mat4.create();
        glMatrix.mat4.lookAt(newViewMatrix, [0,0,0], [-2*Math.cos(x),-2*Math.cos(x + Math.PI), -2*Math.sin(x)], [0,1,0]);

        var invViewProjMatrix = glMatrix.mat4.create();

        glMatrix.mat4.multiply(invViewProjMatrix, projectionMatrix, newViewMatrix);
        glMatrix.mat4.invert(invViewProjMatrix, invViewProjMatrix);

        return {
            modelview: modelViewMatrix,
            invViewProj: invViewProjMatrix,
            projection: projectionMatrix,
            normal: normalMatrix
        }
    };
    
    
    /**
     * Loads and compiles the shaders specified by vertexShader and fragmentShader,
     * and then links the shader program, and grabs the uniform locations
     * @param {WebGLRenderingContext} gl Reference to the WebGL context
     * @param {string} vertexShader Name of the vertex shader
     * @param {string} fragmentShader Name of the fragment shader
     * @param {Array} uniforms Array of uniforms to map
     * @param {Array} attributes Array of attributes to map
     * @returns {WebGLProgram} The newly created shader program.
     */
    var setupShaders = function(gl, vertexShaderName, fragmentShaderName, uniforms, attributes) {
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

        shaderProgram.uniforms = {};

        for(var uniform of uniforms){
            shaderProgram.uniforms[uniform] = gl.getUniformLocation(shaderProgram, uniform);
        }

        shaderProgram.attributes = {};

        for(var attr of attributes){
            shaderProgram.attributes[attr] = gl.getAttribLocation(shaderProgram, attr);
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
     *  Sets up cubemap texture.
     * @param {number} faces Collection of cubemap face data
     * @param {WebGLRenderingContext} gl Reference to the WebGL context
     */
    var setupCubemap = function(faces, gl) {
        var texture = gl.createTexture();

        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);

        faces.forEach((info) => {

            const level = 0;
            const internalFormat = gl.RGBA;
            const width = 512;
            const height = 512;
            const format = gl.RGBA;
            const type = gl.UNSIGNED_BYTE;

            gl.texImage2D(info.target, level, internalFormat, width, height, 0, format, type, null);

            const image = new Image();
            image.src = info.url;
            image.onload = () => {
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
                gl.texImage2D(info.target, level, internalFormat, format, type, image);
                gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
            };

        });

        gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    }
    

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
    function draw_model(x, y, buffers, shaderProgram, gl){

        gl.useProgram(shaderProgram);

        // Compute the various matrices for this frame
        var matResult = calculate_matrices(x, y, shaderProgram, gl);

        gl.uniformMatrix4fv(shaderProgram.uniforms["u_modelview"], false, matResult.modelview);
        gl.uniformMatrix4fv(shaderProgram.uniforms["u_projection"], false, matResult.projection);
        gl.uniformMatrix3fv(shaderProgram.uniforms["u_normalMatrix"], false, matResult.normal);

        // Face culling is off by artistic choice, it looks kind of neat
        // to be able to see the underside of the terrain!
        //gl.enable(gl.CULL_FACE);



        // Configure all our buffers and attributes

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.positions);
        gl.vertexAttribPointer(shaderProgram.attributes["aVertexPosition"], 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shaderProgram.attributes["aVertexPosition"]);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normals);
        gl.vertexAttribPointer(shaderProgram.attributes["aVertexNormal"], 
                                    3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shaderProgram.attributes["aVertexNormal"])
        // Go draw 'em!
        gl.drawElements(gl.TRIANGLES, buffers.numIndices, gl.UNSIGNED_SHORT, 0);


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
    function draw_sky(x, y, buffers, shaderProgram, gl){

        gl.useProgram(shaderProgram);

        var matResult = calculate_matrices(x, y, shaderProgram, gl);

        gl.uniformMatrix4fv(shaderProgram.uniforms["u_vpInverse"], false, matResult.invViewProj);

        // Set all the GL flags we need
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.clearDepth(1.);
        gl.enable(gl.DEPTH_TEST);
        gl.depthRange(0.0, 1.0);

        // Construct skybox plane
        var plane = new Float32Array(
        [
            -1, -1, 
            1, -1, 
            -1,  1, 
            -1,  1,
            1, -1,
            1,  1,
        ]);
        gl.bufferData(gl.ARRAY_BUFFER, plane, gl.STATIC_DRAW);
        gl.vertexAttribPointer(shaderProgram.attributes["aVertexPosition"],
                                2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shaderProgram.attributes["aVertexPosition"]);

        gl.drawArrays(gl.TRIANGLES, 0, 6);

        


    };

    // The sketchy VanillaJS equivalent of module.exports
    return {
        runDemo: runDemo
    };

}();