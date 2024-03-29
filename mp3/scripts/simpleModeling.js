//-------------------------------------------------------------------------
function planeFromIteration(n, minX,maxX,minY,maxY, vertexArray, faceArray)
{
    var deltaX=(maxX-minX)/n;
    var deltaY=(maxY-minY)/n;
    for(var i=0;i<=n;i++)
       for(var j=0;j<=n;j++)
       {
           vertexArray.push(minX+deltaX*j);
           vertexArray.push(maxY-deltaY*i);
           vertexArray.push(0);
       }

    for(var i=0;i<n;i++)
       for(var j=0;j<n;j++)
       {
           var vid = i*(n+1) + j;
           faceArray.push(vid);
           faceArray.push(vid+(n+1));
           faceArray.push(vid+1);
           
           faceArray.push(vid+1);
           faceArray.push(vid+(n+1));
           faceArray.push((vid+1) +(n+1));
       }
    //console.log(vertexArray);
    //console.log(faceArray);
}

//-------------------------------------------------------------------------

function pushVertex(v, vArray)
{
 for(i=0;i<3;i++)
 {
     vArray.push(v[i]);
 }  
}

//-------------------------------------------------------------------------
function divideTriangle(a,b,c,numSubDivs, vertexArray)
{
    if (numSubDivs>0)
    {
        var numT=0;
        var ab =  glMatrix.vec4.create();
        glMatrix.vec4.lerp(ab,a,b,0.5);
        var ac =  glMatrix.vec4.create();
        glMatrix.vec4.lerp(ac,a,c,0.5);
        var bc =  glMatrix.vec4.create();
        glMatrix.vec4.lerp(bc,b,c,0.5);
        
        numT+=divideTriangle(a,ab,ac,numSubDivs-1, vertexArray);
        numT+=divideTriangle(ab,b,bc,numSubDivs-1, vertexArray);
        numT+=divideTriangle(bc,c,ac,numSubDivs-1, vertexArray);
        numT+=divideTriangle(ab,bc,ac,numSubDivs-1, vertexArray);
        return numT;
    }
    else
    {
        // Add 3 vertices to the array
        
        pushVertex(a,vertexArray);
        pushVertex(b,vertexArray);
        pushVertex(c,vertexArray);
        return 1;
        
    }   
}

//-------------------------------------------------------------------------
function planeFromSubdivision(n, minX,maxX,minY,maxY, vertexArray)
{
    var numT=0;
    var va = glMatrix.vec4.fromValues(minX,minY,0,0);
    var vb = glMatrix.vec4.fromValues(maxX,minY,0,0);
    var vc = glMatrix.vec4.fromValues(maxX,maxY,0,0);
    var vd = glMatrix.vec4.fromValues(minX,maxY,0,0);
    
    numT+=divideTriangle(va,vb,vd,n, vertexArray);
    numT+=divideTriangle(vb,vc,vd,n, vertexArray);
    return numT;
    
}

//-----------------------------------------------------------
function sphDivideTriangle(a,b,c,numSubDivs, vertexArray, indexArray, normalArray)
{
    if (numSubDivs>0)
    {
        var numT=0;
        
        var ab =  glMatrix.vec4.create();
        glMatrix.vec4.lerp(ab,a,b,0.5);
        glMatrix.vec4.normalize(ab,ab);
        
        var ac =  glMatrix.vec4.create();
        glMatrix.vec4.lerp(ac,a,c,0.5);
        glMatrix.vec4.normalize(ac,ac);
        
        var bc =  glMatrix.vec4.create();
        glMatrix.vec4.lerp(bc,b,c,0.5);
        glMatrix.vec4.normalize(bc,bc);
        
        numT+=sphDivideTriangle(a,ab,ac,numSubDivs-1, vertexArray, indexArray, normalArray);
        numT+=sphDivideTriangle(ab,b,bc,numSubDivs-1, vertexArray, indexArray, normalArray);
        numT+=sphDivideTriangle(bc,c,ac,numSubDivs-1, vertexArray, indexArray, normalArray);
        numT+=sphDivideTriangle(ab,bc,ac,numSubDivs-1, vertexArray, indexArray, normalArray);
        return numT;
    }
    else
    {
        // Add 3 vertices to the array

        indexArray.push(vertexArray.length/3);
        indexArray.push(vertexArray.length/3 + 1);
        indexArray.push(vertexArray.length/3 + 2);
        
        pushVertex(a,vertexArray);
        pushVertex(b,vertexArray);
        pushVertex(c,vertexArray);
        
        //normals are the same as the vertices for a sphere
        
        pushVertex(a,normalArray);
        pushVertex(b,normalArray);
        pushVertex(c,normalArray);
        
        return 1;
        
    }   
}

//-------------------------------------------------------------------------
function sphereFromSubdivision(numSubDivs, vertexArray, indexArray, normalArray)
{
    var numT=0;
    var a = glMatrix.vec4.fromValues(0.0,0.0,-1.0,0);
    var b = glMatrix.vec4.fromValues(0.0,0.942809,0.333333,0);
    var c = glMatrix.vec4.fromValues(-0.816497,-0.471405,0.333333,0);
    var d = glMatrix.vec4.fromValues(0.816497,-0.471405,0.333333,0);
    
    numT+=sphDivideTriangle(a,b,c,numSubDivs, vertexArray, indexArray, normalArray);
    numT+=sphDivideTriangle(d,c,b,numSubDivs, vertexArray, indexArray, normalArray);
    numT+=sphDivideTriangle(a,d,b,numSubDivs, vertexArray, indexArray, normalArray);
    numT+=sphDivideTriangle(a,c,d,numSubDivs, vertexArray, indexArray, normalArray);
    return numT;
}


    
    
