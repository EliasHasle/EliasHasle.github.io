/*TODO:
First step is to render circles instead of squares.

Make shadermaterial that renders each particle perfectly as a lit, transparent sphere. (one material for front, one for back, maybe using instancing/multimaterial)

Easiest to keep uniforms for points, but use my own in the shaders. The reason is that the renderer will update some uniforms automatically according to aspect ratio etc.

*/

var SpherePoints = function(maxN=10000, r=1) {
	this.maxN = maxN;
	this.r = r;

	//Add particles
	let geometry = new THREE.BufferGeometry();
	geometry.addAttribute("position",
						new THREE.Float32BufferAttribute(
							new Float32Array(3*maxN).fill(0),
                                   3));
	let material = new THREE.ShaderMaterial({
		uniforms: THREE.ShaderLib["points"].uniforms,
		vertexShader: THREE.ShaderChunk["points_vert"],
		fragmentShader: THREE.ShaderChunk["points_frag"].replace("outgoingLight = diffuseColor.rgb;", "outgoingLight = diffuseColor.rgb;\n\tfloat radius = length(gl_PointCoord-vec2(0.5));if (radius > 0.5) discard;\n\tfloat r = 2.0*radius;\n\tdiffuseColor.a = sqrt(1.0-r*r);")
	});
	Object.assign(material, THREE.PointsMaterial.prototype);
	Object.assign(material, {
		type: 'ParticlesMaterial',
		color: new THREE.Color( 0x0055ff ),
		map: null,
		size: 2*Math.sqrt(2)*this.r,
		sizeAttenuation: true,
		transparent: true,
		opacity: 0.3,
		lights: false,
		map: null
	});

	THREE.Points.call(this, geometry, material);
}
SpherePoints.prototype = Object.create(THREE.Points.prototype);
SpherePoints.prototype.constructor = SpherePoints;