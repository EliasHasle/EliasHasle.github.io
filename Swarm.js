function SwarmMaterial(activeColor, passiveColor, pointRadius) {
	THREE.ShaderMaterial.call(this, {
		uniforms: {
			activeColor: new THREE.Uniform(new THREE.Color(activeColor||0xffffff)),
			passiveColor: new THREE.Uniform(new THREE.Color(passiveColor||0x000000))			
		},
		vertexShader: `
//attribute vec3 position;
attribute float active;
varying float isActive;

void main(void) {
	isActive = active;
	gl_PointSize = `+(2*pointRadius).toFixed(4)+";"+`
	vec3 posWithDepth = vec3(position.xy, isActive);
	gl_Position = projectionMatrix*modelViewMatrix*vec4(posWithDepth,1);
}
`,
		fragmentShader: `
//precision highp float;
uniform vec3 activeColor;
uniform vec3 passiveColor;
varying float isActive;
void main(void) {
	if (length(gl_PointCoord.xy-vec2(0.5)) > 0.5) discard;
	gl_FragColor = vec4(isActive>0.5 ? activeColor : passiveColor, 1);
}
`
	});
}
SwarmMaterial.prototype = Object.create(THREE.ShaderMaterial.prototype);
SwarmMaterial.prototype.constructor = SwarmMaterial;

function Swarm({number, activeColor, passiveColor, pointRadius, initProc, updateProc}) {
	this.number = number;
	
	let geometry = new THREE.BufferGeometry();
	//position attribute
	geometry.addAttribute("position", new THREE.BufferAttribute(new Float32Array(3*number).fill(0),3));
	let posAttr = geometry.getAttribute("position");
	posAttr.setDynamic(true);
	
	//active attribute
	geometry.addAttribute("active", new THREE.BufferAttribute(new Float32Array(this.number).fill(1),1));
	let activeAttr = geometry.getAttribute("active");
	activeAttr.setDynamic(true);
	
	//User-friendly accessors:
	let pa = posAttr.array;
	this.positions = new Array(this.number);
	for (let i = 0; i < this.number; i++) {
		this.positions[i] = pa.subarray(3*i,3*i+2);
	}

	this.active = activeAttr.array;
	
	//Velocities is not an attribute:
	let velocities = new Float32Array(3*this.number).fill(0);
	this.velocities = new Array(this.number);
	for (let i = 0; i < this.number; i++) {
		this.velocities[i] = velocities.subarray(3*i,3*i+2);
	}
	this.userData = {};
	if (typeof initProc !== "undefined")
		initProc(this.positions, this.velocities, this.active, this.userData);
	
	posAttr.needsUpdate = true;
	activeAttr.needsUpdate = true;
	
	let material = new SwarmMaterial(activeColor, passiveColor, pointRadius);
	
	THREE.Points.call(this, geometry, material);
	
	this.updateProc = updateProc;
}
Swarm.prototype = Object.create(THREE.Points.prototype);
Object.assign(Swarm.prototype, {
	constructor: Swarm,
	update: function(t, dt) {
		if (!this.updateProc) return;
		
		this.updateProc(this.positions, this.velocities, this.active, t, dt); //Important!
		this.geometry.getAttribute("position").needsUpdate = true;
		this.geometry.getAttribute("active").needsUpdate = true;
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