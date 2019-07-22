//source is typically a rendertarget
//refresh fades in a new value.
//remember should be <= 1.
//refresh should normally be <= 1-remember.
//refresh=0 makes a pure decay.
function Smoother(source, remember, refresh, renderer) {
	this.source = source;
	this.remember = typeof remember !== "undefined" ? remember : 0.5;
	this.refresh = typeof refresh !== "undefined" ? refresh : 1-this.remember;
	this.renderer = renderer;
	this.ready = false;

	if (!(this.source.image instanceof HTMLVideoElement)) this.init();
	else {
		console.log("Source is video texture.");
		let scope = this;
		this.source.image.addEventListener("playing", function() {scope.init.call(scope);});
	}
}
Smoother.prototype = Object.create(Object.prototype);
Object.assign(Smoother.prototype, {
	constructor: Smoother,
	init: function() {
		let w = this.source.width || this.source.image.videoWidth;
		let h = this.source.height || this.source.image.videoHeight;
		console.log("Smoother: w=%d, h=%d", w,h);
		this.targets = [new THREE.WebGLRenderTarget(w, h),
		new THREE.WebGLRenderTarget(w, h)];
		this.flipflop = 0;
		this.camera = new THREE.OrthographicCamera();
		this.camera.position.z = 2;
		this.scene = new THREE.Scene();
		let geom = new THREE.PlaneBufferGeometry(2,2);
		this.mat = new THREE.ShaderMaterial({
			uniforms: {
				source: new THREE.Uniform(this.source.texture || this.source),
				state: new THREE.Uniform(this.source.texture || this.source),
				remember: new THREE.Uniform(this.remember),
				refresh: new THREE.Uniform(this.refresh),
			},
			vertexShader: `
			varying vec2 vUV;
			void main() {
				vUV = uv;
				gl_Position = vec4(position,1);
			}
			`,
			fragmentShader: `
			uniform sampler2D source;
			uniform sampler2D state;
			uniform float remember;
			uniform float refresh;
			varying vec2 vUV;
			void main() {
				//gl_FragColor = texture2D(source,vUV);
				gl_FragColor = vec4(remember*texture2D(state,vUV).rgb+refresh*texture2D(source,vUV).rgb,1.0);
			}
			`
		});
		let display = new THREE.Mesh(geom,this.mat);
		this.scene.add(display);
		this.ready = true;
	},
	update: function() {
		if (!this.ready) return;
		this.mat.uniforms.remember.value = this.remember;
		this.mat.uniforms.refresh.value = this.refresh;

		this.renderer.setRenderTarget(this.targets[this.flipflop]);
		this.renderer.render(this.scene,this.camera);
		this.renderer.setRenderTarget(null);
		this.renderer.render(this.scene,this.camera); //DEBUG
		this.mat.uniforms.state.value = this.targets[this.flipflop].texture;
		this.flipflop = 1-this.flipflop;
	},
	getTex: function() {
		return this.targets[1-this.flipflop].texture;
	}
});