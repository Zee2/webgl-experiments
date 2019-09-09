# Hacked together obj parser


import sys

triangles = []
mats = []
result = ""
triangles.append([(0,0,0),(0,0,0),(0,0,0),(0,0,0)])
#triangles.append([(100,100,800),(80,150,200),(200,200,1),(255,255,255)]);


vertices = []
normals = []
faces = []
with open(sys.argv[1], 'r') as f:
    print("// Parsing " + sys.argv[1] + " for obj data")
    currentMat = ""
    for line in f:
        splitLine = line.rstrip().replace("  ", " ").split(' ')
        
        if splitLine[0] == 'usemtl':
            currentMat = splitLine[1]
        if splitLine[0] == 'v':
            for member in splitLine:
                if member.isspace():
                    splitLine.remove(member)
            vertices.append((float(splitLine[1]),float(splitLine[2]), float(splitLine[3])))
        if splitLine[0] == 'vn':
            normals.append((float(splitLine[1]),float(splitLine[2]), float(splitLine[3])))
        if splitLine[0] == 'f':
            
            v0 = int(splitLine[1].split('/')[0])-1
            v1 = int(splitLine[2].split('/')[0])-1
            v2 = int(splitLine[3].split('/')[0])-1

            faces.append((v0, v1, v2))
            # n0 = int(splitLine[1].split('/')[2])-1
            # n1 = int(splitLine[2].split('/')[2])-1
            # n2 = int(splitLine[3].split('/')[2])-1
            #print(str(len(normals)) + ", " + str(v0));
            # n0 = normals[n0]
            # n1 = normals[n1]
            
            # n2 = normals[n2]
            # n_avg = ((n0[0] + n1[0] + n2[0])/3,(n0[1] + n1[1] + n2[1])/3,(n0[2] + n1[2] + n2[2])/3)

            # triangles.append((vertices[v0],
            #                     vertices[v1],
            #                     vertices[v2],
            #                     n_avg))
            # mats.append(currentMat)

print("// Autogenerated by parser.py, scanning included obj file\n")
print("/** @global Array of vertex position data, " + str(len(vertices)) + " vertices */")
print("var vertex_data = [")
for vert in vertices[:-1]:
    print("\t" + str(vert).strip("()") + ",")
print("\t" + str(vertices[-1]).strip("()"))
print("];" + "\n")
print("/** @global Array of vertex index data */")
print("var poly_data = [")
for face in faces[:-1]:
    print("\t" + str(face).strip("()") + ",")
print("\t" + str(faces[-1]).strip("()"))
print("];\n")

print("// Parsed " + str(len(faces)) + " triangles, end autogenerated section")