"use strict";

//2D Vector operations:
function scale([x,y],s) {
	return [s*x, s*y];
}
function negate(v) {
	return scale(v,-1);
}
function add([ax,ay], [bx,by]) {
	return [ax+bx, ay+by];
}
function sub(a, b) {
	return add(a,negate(b));
}
function delta(a, b) {
	return sub(b,a);
}
function equalVec([ax,ay],[bx,by]) {
	return ax===bx && ay===by;
}
function lengthSq([x,y]) {
	return x**2 + y**2;
}
function length(v) {
	return lengthSq(v)**0.5;
}
function normalize(v) {
	let l = length(v);
	if (l===0) return [0,0];
	return scale(v, 1/l);
}
function clampLength(v, lMax) {
	let l = length(v);
	if (l <= lMax) return v;
	return scale(v, lMax/l);
}
function angle([x,y]) {
	return Math.atan2(y,x);
}
function dot([ax,ay], [bx,by]) {
	return ax*bx + ay*by;
}
function rotate([x,y], theta) {
	let c = Math.cos(theta);
	let s = Math.sin(theta);
	return [x*c-y*s, y*c+x*s];
}

//The following functions, that work on many points and edges, have no built-in optimization, but the array inputs can be generated from optimizing data structures (e.g. by merging sorted cell lists.)

//Typically to select a goal, hence names "gs" and "g".
function nearestPointIndex(p, gs, ignoreIndex, cutoff=Infinity) {
	let minDistance = Infinity;
	let nearest = null;
	//First consider vertices:
	for (let i = 0; i < gs.length; i++) {
		if (i === ignoreIndex) continue;
		let g = gs[i];
		let d = length(delta(p,g));
		if (d < minDistance) {
			minDistance = d;
			nearest = i;
		}
	}
	return nearest; //not a copy
}

function nearestPoint(pos, gs, ignoreIndex, cutoff=Infinity) {
	return gs[nearestPointIndex(pos, gs, ignoreIndex, cutoff)];
}

function averageVector(vectors, weights) {
	let A = [0,0];
	let W = 0;
	for (let i = 0; i < vectors.length; i++) {
		if (vectors[i] === null) continue;
		let w = weights[i];
		A = add(A, scale(vectors[i], w));
		W += w;
	}
	if (W===0) return null;
	A = scale(A, 1/W);
	return A;
}

//Ray functions:

/*Solve set of two linear equations to find the intersection between the ray line and the tangent line, and then check if the found coefficients are valid: distance>0 and 0<=mu<=1.

Equations:
ox + distance*dx = v0x + mu*tx
oy + distance*dy = v0y + mu*ty
<==>
a*distance + b*mu = p
c*distance + d*mu = q
where
a = dx, b = -tx, c = dy, d = -ty
and
p = v0x-ox, q = v0y-oy
Then:
det = a*b-c*d = -dx*ty+dy*tx
and
distance = (d*p-b*q)/det = (-ty*p +tx*q)/det
mu = (-c*p +a*q)/det = (-dy*p +dx*q)/det
*/ 
function intersect(origin, direction, v0,v1) {
	let tangent = delta(v0,v1);
	let [dx,dy] = direction;
	let [tx,ty] = tangent;
	let [v0x,v0y] = v0;
	let [ox,oy] = origin;
	
	let det = -dx*ty+tx*dy;
	if (det === 0) {
		//console.log("det=0");
		return null; //parallel lines
	}
	let p = v0x-ox;
	let q = v0y-oy;
	
	//Find the intersection point, and check if it is in the forward direction of the ray and within the specified segment:
	let distance = (-ty*p + tx*q)/det;
	if (distance<=0) {
		//console.log("Intersection is behind (or at) ray source.");
		return null;
	}
	let mu = (dx*q-dy*p)/det;
	if (mu<0 || mu>1) {
		//console.log("Intersection is outside line segment.");
		return null;
	}
	
	let point = add(origin, scale(direction, distance));
	
	let normal = normalize(rotate(tangent, 0.5*Math.PI));
	if (dot(normal, direction) > 0) {
		normal = negate(normal);
	}
	
	return {distance, point, normal, mu, fromPoint: v0, toPoint: v1, type: "intersection"};
}

/*Intersect a ray against a set of line segments, and return the relevant information about all intersections, sorted by increasing distance. Direction is assumed to be normalized.
vertices is an array of 2D vectors, and edges is an array of 2D integer vectors.
*/
function intersectAll(origin,direction, vertices,edges) {
	let intersections = [];
	for (let i = 0; i<edges.length; i++) {
		let [fromVertex, toVertex] = edges[i];
		let intersection = intersect(origin,direction, vertices[fromVertex], vertices[toVertex]);
		if (intersection !== null) {
			intersection.fromIndex = fromIndex;
			intersection.toIndex = toIndex;
			intersections.push(intersection);
		}
	}
	intersections.sort((i1,i2)=>(i1.distance-i2.distance)); //right?
	return intersections;
}

/*Intersect a ray against a set of line segments, and return the relevant information about the first intersection. Direction is assumed to be normalized.*/
function intersectNearest(origin,direction, vertices,edges) {
	let minDistance = Infinity;
	let nearest = null;
	for (let i = 0; i<edges.length; i++) {
		let [fromIndex, toIndex] = edges[i];
		let intersection = intersect(origin,direction, vertices[fromIndex], vertices[toIndex]);
		if (intersection === null) continue;
		
		if (intersection.distance < minDistance) {
			intersection.fromIndex = fromIndex;
			intersection.toIndex = toIndex;
			minDistance = intersection.distance;
			nearest = intersection;
		}
	}
	if (nearest === null) return null;
	nearest.type = "orthogonal";
	return nearest;
}

function projectPositionToLineSegment(p, v0,v1) {
	let tangent = delta(v0,v1);
	let negnormal = rotate(tangent, 0.5*Math.PI);
	if (dot(delta(v0,p), negnormal) > 0) {
		negnormal = negate(negnormal);
	}
	negnormal = normalize(negnormal);
	//Throw ray down normal from p to the line segment:
	return intersect(p, negnormal, v0,v1);
}

/*Find the nearest point on any line segment, and return relevant information. The nearest point either is a vertex or is found by projecting down the normal of a line segment.*/
function nearestLinePoint(pos, vertices,edges) {
	let minDistance = Infinity;
	let nearest = null;
	//First consider vertices:
	for (let i = 0; i < vertices.length; i++) {
		let v = vertices[i];
		let d = length(delta(pos,v));
		if (d < minDistance) {
			minDistance = d;
			nearest = {type: "vertex", point: v, distance: d};
		}
	}
	
	for (let i = 0; i < edges.length; i++) {
		let [fromIndex, toIndex] = edges[i];
		let projection = projectPositionToLineSegment(pos, vertices[fromIndex], vertices[toIndex]);
		if (projection === null) continue;
		if (projection.distance < minDistance) {
			minDistance = projection.distance;
			projection.fromIndex = fromIndex;
			projection.toIndex = toIndex;
			nearest = projection;
		}
	}
	
	return nearest;
}