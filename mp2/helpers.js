

/**
 * @fileoverview This file contains additional helper functions.
 */

 
/**
 * Helper function that performs basic clamping operations
 * @param {number} x Value to be clamped
 * @param {number} a Minimum clamp value
 * @param {number} b Maximum clamp value
 * @returns clamped number
 */
function clamp(x, a, b){
    return Math.max(a, Math.min(x, b));
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
 * Takes an initially flat terrain mesh and deforms it
 * using a hand-tuned version of the bisection-offset terrain generation algorithm.
 * This is similar to the version recommended in the MP doc, but instead of using
 * an unsmoothed step function to apply an offset to the terrain, it uses
 * a "smoothsign" function (in this case, arctan)
 * @param {Array} mesh WebGL-format array of vertices that constitute the flat terrain mesh
 * @param {number} dim The dimension of the terrain (number of vertices on one edge)
 * @param {number} iter The number of iterations to use when generating the deformed terrain.
 * @returns void
 */
function deform_terrain(mesh, dim, iter){

    // Iterate exactly {iter} times
    for(var i = 0; i < iter; i++){
        // Generate random point, normalized on [[0,1],[0,1]]
        var rand_point = glMatrix.vec2.fromValues(Math.random(), Math.random());
        // Generate random angle
        var theta = Math.random() * Math.PI * 2;
        // Calculate random vector equivalent of the angle we just generated
        var rand_vec = glMatrix.vec2.fromValues(Math.cos(theta), Math.sin(theta));
        
        // Iterate over all vertices in mesh
        for(var idx = 0; idx < mesh.length; idx += 3){

            // Calculate the position of the current vertex, based on various index and
            // dimensionality information
            var vertex = glMatrix.vec2.fromValues(mesh[idx] / (dim * 0.1), mesh[idx+2] / (dim * 0.1));
            var subbed = glMatrix.vec2.create();

            // Calculate the subtraction vector
            glMatrix.vec2.sub(subbed, vertex, rand_point)

            // Calculate the dot product (to see what side of the random line we are on)
            var dotFactor = glMatrix.vec2.dot(subbed, rand_vec)

            // Offset the pixel using a hand-tuned formula.
            // This uses arctan() as a smoothsign function to smooth out the terrain deformation
            // This uses a variable-frequency "noise" system: as the iterations progress, the arctan
            // becomes "sharper", and the per-iteration offset magnitude decreases.
            mesh[idx+1] += 0.1 * ((iter - i) / iter) * Math.atan((i / iter)**2 * 400.0 * dotFactor);
        }
    }
}

/**
 * Takes three vertices and computes the normal vector of the triangle constructed from these
 * three vertices. Assumes CCW winding order.
 * @param {Array} a Vertex 0
 * @param {Array} b Vertex 1
 * @param {Array} c Vertex 2
 * @returns {WebGLShader} Compiled shader
 */
function compute_tri_normal(a, b, c){
    var p1 = glMatrix.vec3.fromValues(a[0], a[1], a[2]);
    var p2 = glMatrix.vec3.fromValues(b[0], b[1], b[2]);
    var p3 = glMatrix.vec3.fromValues(c[0], c[1], c[2]);

    var v1 = glMatrix.vec3.create();
    glMatrix.vec3.sub(v1, p2, p1);
    var v2 = glMatrix.vec3.create();
    glMatrix.vec3.sub(v2, p3, p1);
    
    var result = glMatrix.vec3.create();
    glMatrix.vec3.cross(result, v1, v2);
    return result;
}

/**
 * Takes a flattened, WebGL-style vertex array and calculates the min/max,
 * and re-scales the entire model to fit between [0,1], between min/max.
 * Makes altitude coloring code much easier on the ol' brain cells.
 * @param {Array} mesh Some mesh
 * @returns void
 */
function normalize_mesh_height(mesh){
    var min = 100000, max = -100000;
    for(var i = 0; i < mesh.length; i+=3){
        if(mesh[i+1] > max) max = mesh[i+1]
        if(mesh[i+1] < min) min = mesh[i+1]
    }
    for(var i = 0; i < mesh.length; i+=3){
        mesh[i+1] = ((mesh[i+1] - min) / (max-min)) * 3.0;
    }
}
