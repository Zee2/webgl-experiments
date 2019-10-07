/**
 * @fileoverview This file supports basic touchscreen and mouse input.
 */

/** @global X and Y mouse/touchscreen input coordinates */
var mouseX = 0;
var mouseY = 150;

/** @global X and Y mouse/touchscreen velocity */
var mouseVelX = 0;
var mouseVelY = 0;

/** @global State of the input control state machine */
var mouseState = 0;

/** @global Cached "last seen" mouse/touch location */
var lastMouse = [0,0]

/** @global Canvas object for getting input events */
var canvas = document.getElementById("myGLCanvas");

/** OnMouseUp callback lambda */
document.body.onmouseup = () => {
    mouseState--
}
/** OnTouchUp callback lambda */
document.body.ontouchend = () => {
    mouseState--
}
/** OnMouseDown callback lambda */
document.body.onmousedown = (e) => {
    mouseState++
}
/** OnTouchStart callback lambda */
document.body.ontouchstart = (e) => {
    lastMouse = [e.touches[0].clientX, e.touches[0].clientY];
    mouseState++
}
/** OnMouseMove callback lambda */
document.onmousemove = function(e){
    updateMouse(e);
}

/** OnTouchMove callback lambda */
document.ontouchmove = function(e){
    updateTouch(e);
}

/**
 * Updates input FSM and data for touchscreen events
 * @param {object} e Touch input event data
 * @returns void
 */
function updateTouch(e){
    if(mouseState){
        mouseX += e.touches[0].clientX - lastMouse[0];
        mouseY += e.touches[0].clientY - lastMouse[1];
        mouseVelX += (e.touches[0].clientX - lastMouse[0]) * 0.1;
        mouseVelY += (e.touches[0].clientY - lastMouse[1]) * -0.4;
    }
    lastMouse = [e.touches[0].clientX, e.touches[0].clientY];
}

/**
 * Updates input FSM and data for mouse events
 * @param {object} e Mouse input event data
 * @returns void
 */
function updateMouse(e){
    if(mouseState){
        mouseX += e.clientX - lastMouse[0];
        mouseY += e.clientY - lastMouse[1];
        mouseVelX += (e.clientX - lastMouse[0]) * 0.1;
        mouseVelY += (e.clientY - lastMouse[1]) * -0.4;
    }
    lastMouse = [e.clientX, e.clientY];
}