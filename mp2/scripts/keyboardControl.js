/**
 * @fileoverview This file supports keyboard input.
 */


var x_input = 0.0;
var y_input = 0.0;
var yaw_input = 0.0;
var throttle = 0.0;

// Dictionary that keeps track of all pressed keys.
var pressed_keys = {};


document.onkeydown = (e) => {
    pressed_keys[e.code] = true;
}

document.onkeyup = (e) => {
    pressed_keys[e.code] = false;
}

function compute_keyboard_input() {
    let modified = {};

    if(pressed_keys["ArrowLeft"]){
        x_input += (-1.0 - x_input) * 0.1;
        modified["x"] = true;
    }
    if(pressed_keys["ArrowRight"]){
        x_input += (1.0 - x_input) * 0.1;
        modified["x"] = true;
    }
    if(pressed_keys["ArrowUp"]){
        y_input += (1.0 - y_input) * 0.1;
        modified["y"] = true;
    }
    if(pressed_keys["ArrowDown"]){
        y_input += (-1.0 - y_input) * 0.1;
        modified["y"] = true;
    }
    if(pressed_keys["KeyE"]){
        yaw_input += (1.0 - yaw_input) * 0.1;
        modified["yaw"] = true;
    }
    if(pressed_keys["KeyQ"]){
        yaw_input += (-1.0 - yaw_input) * 0.1;
        modified["yaw"] = true;
    }
    if(pressed_keys["Equal"]){
        throttle += (1.0 - throttle) * 0.1;
        modified["throttle"] = true;
    }
    if(pressed_keys["Minus"]){
        throttle += (-1.0 - throttle) * 0.1;
        modified["throttle"] = true;
    }

    if(!modified["x"])        { x_input   *= 0.9; }
    if(!modified["y"])        { y_input   *= 0.9; }
    if(!modified["yaw"])      { yaw_input *= 0.9; }
    if(!modified["throttle"]) { throttle  *= 0.9; }
    
}