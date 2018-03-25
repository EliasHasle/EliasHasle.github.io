function MonoPlot2D(W,H,f) {
	this.W = W;
	this.H = H;
	this.texData = new Uint8Array(W*H);
	for (let y = 0; y < H; y++) {
		for (let x = 0; x < W; x++) {
			let z = f([x,y]);
			this.texData[y*W+x] = Math.round(255*Math.max(0,Math.min(z)));
		}
	}
	this.dataTexture = new THREE.DataTexture(
		this.texData, W, H,
	THREE.LuminanceFormat,
	undefined, undefined,
	THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping,
	THREE.LinearFilter,
	THREE.LinearFilter,
	1);
	this.dataTexture.needsUpdate = true;
	
	let geometry = new THREE.PlaneBufferGeometry(1,1,1,1);
	geometry.translate(0.5,0.5,0);
	geometry.scale(W,H,1);
	
	let material = new THREE.MeshBasicMaterial({map:this.dataTexture});
	
	THREE.Mesh.call(this, geometry, material);
}
MonoPlot2D.prototype = Object.create(THREE.Mesh.prototype);
Object.assign(MonoPlot2D.prototype, {
	constructor: MonoPlot2D
});