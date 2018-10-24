/*By Elias Hasle. Adapted from script published at 
https://github.com/EliasHasle/EliasHasle.github.io/blob/master/Swarm.js
and applied in
https://eliashasle.github.io/PSO_with_parameters_oscillating_in_dissonance.html
both by Elias Hasle.
*/

"use strict";

function SwarmMaterial(frontColor, backColor) {
	THREE.ShaderMaterial.call(this, {
		uniforms: {
			frontColor: new THREE.Uniform(new THREE.Color(typeof frontColor!=="undefined" ? frontColor : 0xffffff)),
			backColor: new THREE.Uniform(new THREE.Color(backColor||0x000000))			
		},
		vertexShader: `
//attribute vec3 position;
attribute float inFront;
attribute float pointRadius;
varying float isInFront;

void main(void) {
	isInFront = inFront;
	gl_PointSize = 2.0*pointRadius;
	vec3 posWithDepth = vec3(position.xy, isInFront);
	gl_Position = projectionMatrix*modelViewMatrix*vec4(posWithDepth,1);
}
`,
		fragmentShader: `
//precision highp float;
uniform vec3 frontColor;
uniform vec3 backColor;
varying float isInFront;
void main(void) {
	if (length(gl_PointCoord.xy-vec2(0.5)) > 0.5) discard;
	gl_FragColor = vec4(isInFront*frontColor +(1.0-isInFront)*backColor, 1);
}
`
	});
}
SwarmMaterial.prototype = Object.create(THREE.ShaderMaterial.prototype);
SwarmMaterial.prototype.constructor = SwarmMaterial;

function Swarm({number, frontColor, backColor, initProc, updateProc}) {
	this.number = number;
	
	let geometry = new THREE.BufferGeometry();
	//position attribute
	geometry.addAttribute("position", new THREE.BufferAttribute(new Float32Array(3*number).fill(0),3));
	let posAttr = geometry.getAttribute("position");
	posAttr.setDynamic(true);
	
	//Color/inFront attribute
	geometry.addAttribute("inFront", new THREE.BufferAttribute(new Float32Array(this.number).fill(1),1));
	let inFrontAttr = geometry.getAttribute("inFront");
	inFrontAttr.setDynamic(true);
	
	this.inFront = inFrontAttr.array;
		
	//pointRadius attribute
	geometry.addAttribute("pointRadius", new THREE.BufferAttribute(new Float32Array(this.number).fill(1),1));
	let pointRadiusAttr = geometry.getAttribute("pointRadius");
	pointRadiusAttr.setDynamic(true);
	
	this.pointRadius = pointRadiusAttr.array;
	
	//User-friendly accessors:
	let pa = posAttr.array;
	this.positions = new Array(this.number);
	for (let i = 0; i < this.number; i++) {
		this.positions[i] = pa.subarray(3*i,3*i+2);
	}
	
	//Velocities is not an attribute:
	let velocities = new Float32Array(3*this.number).fill(0);
	this.velocities = new Array(this.number);
	for (let i = 0; i < this.number; i++) {
		this.velocities[i] = velocities.subarray(3*i,3*i+2);
	}
	this.userData = {};
	if (typeof initProc !== "undefined")
		initProc(this.positions, this.velocities, this.inFront, this.pointRadius, this.userData);
	
	posAttr.needsUpdate = true;
	inFrontAttr.needsUpdate = true;
	pointRadiusAttr.needsUpdate = true;
	
	let material = new SwarmMaterial(frontColor, backColor);
	
	THREE.Points.call(this, geometry, material);
	
	Object.defineProperty(this, "activeParticles", {
		get: function() {return this.geometry.drawRange.count;},
		set: function(value) {this.geometry.drawRange.count = value;}
	});
	this.activeParticles = number;
	
	this.initProc = initProc;
	this.updateProc = updateProc;
}
Swarm.prototype = Object.create(THREE.Points.prototype);
Object.assign(Swarm.prototype, {
	constructor: Swarm,
	update: function(t, dt) {
		if (!this.updateProc) return;
		
		this.updateProc(this.positions, this.velocities, this.inFront, this.pointRadius, t, dt); //Important!
		this.geometry.getAttribute("position").needsUpdate = true;
		this.geometry.getAttribute("inFront").needsUpdate = true;
		this.geometry.getAttribute("pointRadius").needsUpdate = true;
	},
	applyAccelerations: function(accelerations, dt) {
		let dt2 = dt**2;
		
		for (let i = 0; i < accelerations.length; i++) {
			let a = accelerations[i];
			if (a === null) {
				console.log("null acc received.");
				continue;
			} else if (isNaN(a[0]) || isNaN(a[1])) {
				console.error("acc contains NaN: ",a);
				continue;
			}
			

			let p = this.positions[i];
			let v = this.velocities[i];
			
			//Add contribution from old velocity
			p[0] += v[0]*dt;
			p[1] += v[1]*dt;
			
			//And from new acceleration
			v[0] += a[0]*dt;
			v[1] += a[1]*dt;
			p[0] += 0.5*a[0]*dt2;
			p[1] += 0.5*a[1]*dt2;
		}
	}
});