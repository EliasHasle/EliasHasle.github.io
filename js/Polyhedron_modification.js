/**
 * @author clockworkgeek / https://github.com/clockworkgeek
 * @author timothypratley / https://github.com/timothypratley
 * @author WestLangley / http://github.com/WestLangley
 * @author Mugen87 / https://github.com/Mugen87
 */

/*import { Geometry } from '../core/Geometry.js';
import { BufferGeometry } from '../core/BufferGeometry.js';
import { Float32BufferAttribute } from '../core/BufferAttribute.js';
import { Vector3 } from '../math/Vector3.js';
import { Vector2 } from '../math/Vector2.js';*/
let {Geometry, BufferGeometry, Float32BufferAttribute, Vector3, Vector2} = THREE;

// PolyhedronGeometry

function PolyhedronGeometry( vertices, indices, radius, detail, buildIndexed ) {

	Geometry.call( this );

	this.type = 'PolyhedronGeometry';

	this.parameters = {
		vertices: vertices,
		indices: indices,
		radius: radius,
		detail: detail
	};

	this.fromBufferGeometry( new PolyhedronBufferGeometry( vertices, indices, radius, detail, buildIndexed ) );
	this.mergeVertices();

}

PolyhedronGeometry.prototype = Object.create( Geometry.prototype );
PolyhedronGeometry.prototype.constructor = PolyhedronGeometry;

// PolyhedronBufferGeometry

function PolyhedronBufferGeometry( vertices, indices, radius, detail, buildIndexed ) {

	BufferGeometry.call( this );

	//Build without index by default
	buildIndexed = buildIndexed || false;

	this.type = 'PolyhedronBufferGeometry';

	this.parameters = {
		vertices: vertices,
		indices: indices,
		radius: radius,
		detail: detail
	};

	radius = radius || 1;
	detail = detail || 0;

	// default buffer data

	var vertexBuffer = [];
	var uvBuffer = [];

	// the subdivision creates the vertex buffer data

	subdivide( detail );

	// all vertices should lie on a conceptual sphere with a given radius

	applyRadius( radius );

	// finally, create the uv data

	generateUVs();

	//buildIndexed defaults to undefined (falsy)
	console.log("buildIndexed = ", buildIndexed);
	if (buildIndexed) {
		//Merge vertices before creating attributes from them
		
		let snapTolerance = 0.001*Math.sqrt(4*Math.PI*radius**2/vertexBuffer.length);
		let sparseGrid = {};
		let cellSize = 4*radius/snapTolerance;
		let side = Math.floor((2*radius+2*cellSize)/cellSize);
		let centerOffset = radius+cellSize;
		let V = vertexBuffer.length/3;
		
		let v = new THREE.Vector3();
		let v_key = new THREE.Vector3(side*side, side, 1);
		
		for (let iv = 0; iv < V; iv++) {
			v.fromArray(vertexBuffer, 3*iv);
			v.addScalar(centerOffset);
			v.divideScalar(cellSize);
			
			let key = v.dot(v_key);

			if (sparseGrid[key] === undefined) {
				sparseGrid[key] = [];
			}
			sparseGrid[key].push(iv);
		}
		
		let canonVertexBuffer = [];
		let canonUvBuffer = [];
		let canonCounter = 0;
		
		let canonDict = {};
		let uv1 = new THREE.Vector2();
		for (let key in sparseGrid) {
			let ivs = sparseGrid[key];
			let iv_canon = ivs[0];
			v.fromArray(vertexBuffer, 3*iv_canon);
			canonVertexBuffer.push(v.x,v.y,v.z);
			uv1.fromArray(uvBuffer, 2*iv_canon);
			canonUvBuffer.push(uv1.x, uv1.y);
			for (let iv of ivs) {
				canonDict[iv] = canonCounter;
			}
			canonCounter++;
		}
		
		let F = V/3;
		let indexBuffer = [];
		for (let iv = 0; iv < V; iv++) {
			indexBuffer.push(canonDict[iv]);
		}
		
		this.addAttribute( 'position', new Float32BufferAttribute( canonVertexBuffer, 3 ) );
		this.addAttribute( 'normal', new Float32BufferAttribute( canonVertexBuffer.slice(), 3 ) );
		this.addAttribute( 'uv', new Float32BufferAttribute( canonUvBuffer, 2 ) );
		this.setIndex(indexBuffer, 3);
		
	} else {
		// build non-indexed geometry (default)

		this.addAttribute( 'position', new Float32BufferAttribute( vertexBuffer, 3 ) );
		this.addAttribute( 'normal', new Float32BufferAttribute( vertexBuffer.slice(), 3 ) );
		this.addAttribute( 'uv', new Float32BufferAttribute( uvBuffer, 2 ) );

	}
	
	if ( detail === 0 ) {

		this.computeVertexNormals(); // flat normals

	} else {

		this.normalizeNormals(); // smooth normals

	}

	// helper functions

	function subdivide( detail ) {

		var a = new Vector3();
		var b = new Vector3();
		var c = new Vector3();

		// iterate over all faces and apply a subdivison with the given detail value

		for ( var i = 0; i < indices.length; i += 3 ) {

			// get the vertices of the face

			getVertexByIndex( indices[ i + 0 ], a );
			getVertexByIndex( indices[ i + 1 ], b );
			getVertexByIndex( indices[ i + 2 ], c );

			// perform subdivision

			subdivideFace( a, b, c, detail );

		}

	}

	function subdivideFace( a, b, c, detail ) {

		var cols = Math.pow( 2, detail );

		// we use this multidimensional array as a data structure for creating the subdivision

		var v = [];

		var i, j;

		// construct all of the vertices for this subdivision

		for ( i = 0; i <= cols; i ++ ) {

			v[ i ] = [];

			var aj = a.clone().lerp( c, i / cols );
			var bj = b.clone().lerp( c, i / cols );

			var rows = cols - i;

			for ( j = 0; j <= rows; j ++ ) {

				if ( j === 0 && i === cols ) {

					v[ i ][ j ] = aj;

				} else {

					v[ i ][ j ] = aj.clone().lerp( bj, j / rows );

				}

			}

		}

		// construct all of the faces

		for ( i = 0; i < cols; i ++ ) {

			for ( j = 0; j < 2 * ( cols - i ) - 1; j ++ ) {

				var k = Math.floor( j / 2 );

				if ( j % 2 === 0 ) {

					pushVertex( v[ i ][ k + 1 ] );
					pushVertex( v[ i + 1 ][ k ] );
					pushVertex( v[ i ][ k ] );

				} else {

					pushVertex( v[ i ][ k + 1 ] );
					pushVertex( v[ i + 1 ][ k + 1 ] );
					pushVertex( v[ i + 1 ][ k ] );

				}

			}

		}

	}

	function applyRadius( radius ) {

		var vertex = new Vector3();

		// iterate over the entire buffer and apply the radius to each vertex

		for ( var i = 0; i < vertexBuffer.length; i += 3 ) {

			vertex.x = vertexBuffer[ i + 0 ];
			vertex.y = vertexBuffer[ i + 1 ];
			vertex.z = vertexBuffer[ i + 2 ];

			vertex.normalize().multiplyScalar( radius );

			vertexBuffer[ i + 0 ] = vertex.x;
			vertexBuffer[ i + 1 ] = vertex.y;
			vertexBuffer[ i + 2 ] = vertex.z;

		}

	}

	function generateUVs() {

		var vertex = new Vector3();

		for ( var i = 0; i < vertexBuffer.length; i += 3 ) {

			vertex.x = vertexBuffer[ i + 0 ];
			vertex.y = vertexBuffer[ i + 1 ];
			vertex.z = vertexBuffer[ i + 2 ];

			var u = azimuth( vertex ) / 2 / Math.PI + 0.5;
			var v = inclination( vertex ) / Math.PI + 0.5;
			uvBuffer.push( u, 1 - v );

		}

		correctUVs();

		correctSeam();

	}

	function correctSeam() {

		// handle case when face straddles the seam, see #3269

		for ( var i = 0; i < uvBuffer.length; i += 6 ) {

			// uv data of a single face

			var x0 = uvBuffer[ i + 0 ];
			var x1 = uvBuffer[ i + 2 ];
			var x2 = uvBuffer[ i + 4 ];

			var max = Math.max( x0, x1, x2 );
			var min = Math.min( x0, x1, x2 );

			// 0.9 is somewhat arbitrary

			if ( max > 0.9 && min < 0.1 ) {

				if ( x0 < 0.2 ) uvBuffer[ i + 0 ] += 1;
				if ( x1 < 0.2 ) uvBuffer[ i + 2 ] += 1;
				if ( x2 < 0.2 ) uvBuffer[ i + 4 ] += 1;

			}

		}

	}

	function pushVertex( vertex ) {

		vertexBuffer.push( vertex.x, vertex.y, vertex.z );

	}

	function getVertexByIndex( index, vertex ) {

		var stride = index * 3;

		vertex.x = vertices[ stride + 0 ];
		vertex.y = vertices[ stride + 1 ];
		vertex.z = vertices[ stride + 2 ];

	}

	function correctUVs() {

		var a = new Vector3();
		var b = new Vector3();
		var c = new Vector3();

		var centroid = new Vector3();

		var uvA = new Vector2();
		var uvB = new Vector2();
		var uvC = new Vector2();

		for ( var i = 0, j = 0; i < vertexBuffer.length; i += 9, j += 6 ) {

			a.set( vertexBuffer[ i + 0 ], vertexBuffer[ i + 1 ], vertexBuffer[ i + 2 ] );
			b.set( vertexBuffer[ i + 3 ], vertexBuffer[ i + 4 ], vertexBuffer[ i + 5 ] );
			c.set( vertexBuffer[ i + 6 ], vertexBuffer[ i + 7 ], vertexBuffer[ i + 8 ] );

			uvA.set( uvBuffer[ j + 0 ], uvBuffer[ j + 1 ] );
			uvB.set( uvBuffer[ j + 2 ], uvBuffer[ j + 3 ] );
			uvC.set( uvBuffer[ j + 4 ], uvBuffer[ j + 5 ] );

			centroid.copy( a ).add( b ).add( c ).divideScalar( 3 );

			var azi = azimuth( centroid );

			correctUV( uvA, j + 0, a, azi );
			correctUV( uvB, j + 2, b, azi );
			correctUV( uvC, j + 4, c, azi );

		}

	}

	function correctUV( uv, stride, vector, azimuth ) {

		if ( ( azimuth < 0 ) && ( uv.x === 1 ) ) {

			uvBuffer[ stride ] = uv.x - 1;

		}

		if ( ( vector.x === 0 ) && ( vector.z === 0 ) ) {

			uvBuffer[ stride ] = azimuth / 2 / Math.PI + 0.5;

		}

	}

	// Angle around the Y axis, counter-clockwise when looking from above.

	function azimuth( vector ) {

		return Math.atan2( vector.z, - vector.x );

	}


	// Angle above the XZ plane.

	function inclination( vector ) {

		return Math.atan2( - vector.y, Math.sqrt( ( vector.x * vector.x ) + ( vector.z * vector.z ) ) );

	}

}

PolyhedronBufferGeometry.prototype = Object.create( BufferGeometry.prototype );
PolyhedronBufferGeometry.prototype.constructor = PolyhedronBufferGeometry;

// IcosahedronGeometry

function IcosahedronGeometry( radius, detail, buildIndexed ) {

	Geometry.call( this );

	this.type = 'IcosahedronGeometry';

	this.parameters = {
		radius: radius,
		detail: detail
	};

	this.fromBufferGeometry( new IcosahedronBufferGeometry( radius, detail, buildIndexed ) );
	this.mergeVertices();

}

IcosahedronGeometry.prototype = Object.create( Geometry.prototype );
IcosahedronGeometry.prototype.constructor = IcosahedronGeometry;

// IcosahedronBufferGeometry

function IcosahedronBufferGeometry( radius, detail, buildIndexed ) {

	var t = ( 1 + Math.sqrt( 5 ) ) / 2;

	var vertices = [
		- 1, t, 0, 	1, t, 0, 	- 1, - t, 0, 	1, - t, 0,
		 0, - 1, t, 	0, 1, t,	0, - 1, - t, 	0, 1, - t,
		 t, 0, - 1, 	t, 0, 1, 	- t, 0, - 1, 	- t, 0, 1
	];

	var indices = [
		 0, 11, 5, 	0, 5, 1, 	0, 1, 7, 	0, 7, 10, 	0, 10, 11,
		 1, 5, 9, 	5, 11, 4,	11, 10, 2,	10, 7, 6,	7, 1, 8,
		 3, 9, 4, 	3, 4, 2,	3, 2, 6,	3, 6, 8,	3, 8, 9,
		 4, 9, 5, 	2, 4, 11,	6, 2, 10,	8, 6, 7,	9, 8, 1
	];

	PolyhedronBufferGeometry.call( this, vertices, indices, radius, detail, buildIndexed );

	this.type = 'IcosahedronBufferGeometry';

	this.parameters = {
		radius: radius,
		detail: detail
	};

}

IcosahedronBufferGeometry.prototype = Object.create( PolyhedronBufferGeometry.prototype );
IcosahedronBufferGeometry.prototype.constructor = IcosahedronBufferGeometry;

// DodecahedronGeometry

function DodecahedronGeometry( radius, detail, buildIndexed ) {

	Geometry.call( this );

	this.type = 'DodecahedronGeometry';

	this.parameters = {
		radius: radius,
		detail: detail
	};

	this.fromBufferGeometry( new DodecahedronBufferGeometry( radius, detail, buildIndexed ) );
	this.mergeVertices();

}

DodecahedronGeometry.prototype = Object.create( Geometry.prototype );
DodecahedronGeometry.prototype.constructor = DodecahedronGeometry;

// DodecahedronBufferGeometry

function DodecahedronBufferGeometry( radius, detail, buildIndexed ) {

	var t = ( 1 + Math.sqrt( 5 ) ) / 2;
	var r = 1 / t;

	var vertices = [

		// (±1, ±1, ±1)
		- 1, - 1, - 1,	- 1, - 1, 1,
		- 1, 1, - 1, - 1, 1, 1,
		1, - 1, - 1, 1, - 1, 1,
		1, 1, - 1, 1, 1, 1,

		// (0, ±1/φ, ±φ)
		 0, - r, - t, 0, - r, t,
		 0, r, - t, 0, r, t,

		// (±1/φ, ±φ, 0)
		- r, - t, 0, - r, t, 0,
		 r, - t, 0, r, t, 0,

		// (±φ, 0, ±1/φ)
		- t, 0, - r, t, 0, - r,
		- t, 0, r, t, 0, r
	];

	var indices = [
		3, 11, 7, 	3, 7, 15, 	3, 15, 13,
		7, 19, 17, 	7, 17, 6, 	7, 6, 15,
		17, 4, 8, 	17, 8, 10, 	17, 10, 6,
		8, 0, 16, 	8, 16, 2, 	8, 2, 10,
		0, 12, 1, 	0, 1, 18, 	0, 18, 16,
		6, 10, 2, 	6, 2, 13, 	6, 13, 15,
		2, 16, 18, 	2, 18, 3, 	2, 3, 13,
		18, 1, 9, 	18, 9, 11, 	18, 11, 3,
		4, 14, 12, 	4, 12, 0, 	4, 0, 8,
		11, 9, 5, 	11, 5, 19, 	11, 19, 7,
		19, 5, 14, 	19, 14, 4, 	19, 4, 17,
		1, 12, 14, 	1, 14, 5, 	1, 5, 9
	];

	PolyhedronBufferGeometry.call( this, vertices, indices, radius, detail, buildIndexed );

	this.type = 'DodecahedronBufferGeometry';

	this.parameters = {
		radius: radius,
		detail: detail
	};

}

DodecahedronBufferGeometry.prototype = Object.create( PolyhedronBufferGeometry.prototype );
DodecahedronBufferGeometry.prototype.constructor = DodecahedronBufferGeometry;

// OctahedronGeometry

function OctahedronGeometry( radius, detail, buildIndexed ) {

	Geometry.call( this );

	this.type = 'OctahedronGeometry';

	this.parameters = {
		radius: radius,
		detail: detail
	};

	this.fromBufferGeometry( new OctahedronBufferGeometry( radius, detail, buildIndexed ) );
	this.mergeVertices();

}

OctahedronGeometry.prototype = Object.create( Geometry.prototype );
OctahedronGeometry.prototype.constructor = OctahedronGeometry;

// OctahedronBufferGeometry

function OctahedronBufferGeometry( radius, detail, buildIndexed ) {

	var vertices = [
		1, 0, 0, 	- 1, 0, 0,	0, 1, 0,
		0, - 1, 0, 	0, 0, 1,	0, 0, - 1
	];

	var indices = [
		0, 2, 4,	0, 4, 3,	0, 3, 5,
		0, 5, 2,	1, 2, 5,	1, 5, 3,
		1, 3, 4,	1, 4, 2
	];

	PolyhedronBufferGeometry.call( this, vertices, indices, radius, detail, buildIndexed );

	this.type = 'OctahedronBufferGeometry';

	this.parameters = {
		radius: radius,
		detail: detail
	};

}

OctahedronBufferGeometry.prototype = Object.create( PolyhedronBufferGeometry.prototype );
OctahedronBufferGeometry.prototype.constructor = OctahedronBufferGeometry;

THREE.PolyhedronBufferGeometry = PolyhedronBufferGeometry;
THREE.IcosahedronBufferGeometry = IcosahedronBufferGeometry;
THREE.DodecahedronBufferGeometry = DodecahedronBufferGeometry;
THREE.OctahedronBufferGeometry = OctahedronBufferGeometry;
//export { PolyhedronGeometry, PolyhedronBufferGeometry };