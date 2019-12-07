/**
 * @fileoverview OBJ loader
 */

 obj_loader = function() {
    var load_model = async function(url){
        file = await load_file(url);

        lines = file.split("\n");
        
        var vertices = [];
        var normals = [];
        var faces = [];

        lines.forEach((line) => {
            let elements = line.trim().replace("  ", " ").split(" ");

            if (elements[0] == "v"){
                vertices.push(parseFloat(elements[1]),
                                parseFloat(elements[2]),
                                parseFloat(elements[3]));
            }
            if (elements[0] == "vn"){
                normals.push(parseFloat(elements[1]),
                                parseFloat(elements[2]),
                                parseFloat(elements[3]));
            }
            if (elements[0] == "f"){
                let v0 = parseInt(elements[1].split('/')[0])-1;
                let v1 = parseInt(elements[2].split('/')[0])-1;
                let v2 = parseInt(elements[3].split('/')[0])-1;

                faces.push(v0, v1, v2);
            }
        });
        
        return {
            vertices: vertices,
            normals: normals,
            indices: faces
        }
        
    };

    var load_file = async function(url){

        // Use fancy promises
        return new Promise(function (resolve, reject) {
            // Create and configure request
            let request = new XMLHttpRequest();
            request.open("GET", url);

            console.log("Making request");

            // Setup onload callback
            request.onload = () => {
                if(request.status >= 200 && request.status < 300)
                    resolve(request.response);
                else
                    reject({status: request.status, statusText: request.statusText});
            }

            // Setup error callback
            request.onerror = () => {
                reject({status: request.status, statusText: request.statusText});
            }

            // Fire request
            request.send();
        });
    };

    return {
        load_model: load_model
    };
 }();