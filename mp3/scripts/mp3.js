// Model data located in separate files.

/** @global ID of animation currently running */
var animationID;



/**
 * Startup function called on canvas load.
 * @params void
 */
function startup(){
    switchDemo("terrain");
}

/**
 * Runs the selected demo.
 * @param {string} demo Which demo to run.
 * @returns void
 */
function switchDemo(demo){
    if(animationID != null){
        cancelAnimationFrame(animationID);
    }
    if(demo == "terrain"){
        envmap_demo.runDemo();
    } else {
        envmap_demo.runDemo();
    }
}