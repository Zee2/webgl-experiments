

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
 *  Computes normals of mesh given vertices and indices
 * @returns array of normals
 */
function compute_normals(vertices, indices){

    // Calculate vertex normals
    normals = Array.from(Array(vertices.length), () => glMatrix.vec3.create());

    // Iterate through all triangles
    for(var tri_idx = 0; tri_idx < indices.length; tri_idx += 3){

        // Compute face/triangle normal
        var tri_norm = compute_tri_normal(
            vertices.slice(indices[tri_idx] * 3, indices[tri_idx] * 3 + 3),
            vertices.slice(indices[tri_idx+1] * 3, indices[tri_idx+1] * 3 + 3),
            vertices.slice(indices[tri_idx+2] * 3, indices[tri_idx+2] * 3 + 3))
        
        // Add the tri_norm to each of the connected vertices

        glMatrix.vec3.add(normals[indices[tri_idx]], normals[indices[tri_idx]], tri_norm);
        result = glMatrix.vec3.create();
        glMatrix.vec3.add(normals[indices[tri_idx+1]], normals[indices[tri_idx+1]], tri_norm);
        result = glMatrix.vec3.create();
        glMatrix.vec3.add(normals[indices[tri_idx+2]], normals[indices[tri_idx+2]], tri_norm);
    }

    for(var i = 0; i < vertices.length; i++){
        let result = glMatrix.vec3.create();
        glMatrix.vec3.normalize(result, normals[i]);
        normals[i] = result;
    }

    var flattened = [];

    normals.forEach((normal) => {
        flattened.push(normal[0], normal[1], normal[2]);
    });

    return flattened;
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