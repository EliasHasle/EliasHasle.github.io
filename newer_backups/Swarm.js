/*By Elias Hasle. Adapted from script published at 
https://github.com/EliasHasle/EliasHasle.github.io/blob/master/Swarm.js
and applied in
https://eliashasle.github.io/PSO_with_parameters_oscillating_in_dissonance.html
both by Elias Hasle.
*/

"use strict";

function SwarmMaterial() {
	THREE.ShaderMaterial.call(this, {
		vertexShader: `
//attribute vec3 position;
attribute vec3 color;
attribute float pointRadius;
varying vec3 vColor;

void main(void) {
	vColor = color;
	gl_PointSize = 2.0*pointRadius;
	gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1);
}
`,
		fragmentShader: `
//precision highp float;
varying vec3 vColor;
void main(void) {
	if (length(gl_PointCoord.xy-vec2(0.5)) > 0.5) discard;
	gl_FragColor = vec4(vColor, 1);
}
`
	});
}
SwarmMaterial.prototype = Object.create(THREE.ShaderMaterial.prototype);
SwarmMaterial.prototype.constructor = SwarmMaterial;

function Swarm({number, initProc, updateProc, userData}) {
	this.number = number;
	
	let geometry = new THREE.BufferGeometry();
	//position attribute
	geometry.addAttribute("position", new THREE.BufferAttribute(new Float32Array(3*this.number).fill(0),3));
	let posAttr = geometry.getAttribute("position");
	posAttr.setDynamic(true);
	
	//Color attribute
	geometry.addAttribute("color", new THREE.BufferAttribute(new Float32Array(3*this.number).fill(1),3));
	let colorAttr = geometry.getAttribute("color");
	colorAttr.setDynamic(true);
		
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
	
	let ca = colorAttr.array;
	this.colors = new Array(this.number);
	for (let i = 0; i < this.number; i++) {
		this.colors[i] = ca.subarray(3*i,3*i+2);
	}
	
	this.userData = userData || {};
	if (typeof initProc !== "undefined")
		initProc(this.positions, this.velocities, this.colors, this.pointRadius, this.userData);
	
	posAttr.needsUpdate = true;
	colorAttr.needsUpdate = true;
	pointRadiusAttr.needsUpdate = true;
	
	let material = new SwarmMaterial();
	
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
		
		this.updateProc(this.positions, this.velocities, this.colors, this.pointRadius, t, dt, this.userData); //Important!
		this.geometry.getAttribute("position").needsUpdate = true;
		this.geometry.getAttribute("color").needsUpdate = true;
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