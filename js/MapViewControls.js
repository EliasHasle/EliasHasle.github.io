"use strict";

//By Elias Hasle. Adapted from https://shiplab.github.io/vesseljs/examples/Ship3D_GA.html (also by Elias Hasle)

//The argument is a THREE.OrthographicCamera
function MapViewControls(oCamera, domElement, renderer, preset) {
	Object.assign(this, {
		HMAX: 200,
		minX: -50,
		maxX: 850,
		minY: -50,
		maxY: 650,
		mouseX: 0,
		mouseY: 0,
		scale: 1.0,
		offsetX: 0,
		offsetY: 0,
	}, preset || {});
	
	this.oCamera = oCamera;
	this.domElement = domElement;
	this.renderer = renderer;
	
	oCamera.position.set(0,0,this.HMAX);
	
	//Read mouse wheel input:
	let scope = this;
	
	this.updateFun = function(e) {
		scope.update.call(scope);
	}
	
	this.onWheel = function(e) {
		e.preventDefault();
		//console.log("Wheel event.");
		scope.mouseX = e.offsetX;//e.clientX;
		scope.mouseY = e.offsetY;//e.clientY;
		scope.update.call(scope, e.deltaY>0 ? 1 : e.deltaY<0 ? -1 : 0);
	}
	
	this.enable();
}
MapViewControls.prototype = Object.create(Object.prototype);

Object.assign(MapViewControls.prototype, {
	constructor: MapViewControls,
	//This function updates the orthographic camera
						//optional parameters
						//wheel is wheel rotation direction, -1,0 or 1.
	update: function(wheel=0) {
		let width = this.domElement.clientWidth;
		let height = this.domElement.clientHeight;
		this.renderer.setSize(width,height);
		let aspect = width/height;
		
		//apply wheel scroll
		let base = 1.1;
		let factor = Math.min(2/this.scale, Math.max(0.001/this.scale,base**wheel));
		let oScale = this.scale;
		let conv = (this.maxX-this.minX)/width;
		let relMouseX = conv*(this.mouseX);
		let relMouseY = conv*(this.mouseY-0.5*height);
		if (wheel != 0) {
			this.offsetX += relMouseX*oScale*(1-factor);
			this.offsetY -= relMouseY*oScale*(1-factor);
		}
		this.offsetX = Math.min(this.maxX, Math.max(this.minX, this.offsetX));
		this.offsetY = Math.min(this.maxY, Math.max(this.minY, this.offsetY));
		this.scale *= factor;
		
		//Configure camera here!
		let maxWidth = (this.maxX-this.minX);
		Object.assign(this.oCamera, {
			left: this.offsetX,
			right: maxWidth*this.scale +this.offsetX,
			top: (0.5*maxWidth/aspect)*this.scale +this.offsetY,
			bottom: (-0.5*maxWidth/aspect)*this.scale +this.offsetY
		});
		
		this.oCamera.updateProjectionMatrix();
	},
	enable() {
		window.addEventListener("resize", this.updateFun);
		this.domElement.addEventListener("wheel", this.onWheel);
		this.update();
	},
	disable() {
		window.removeEventListener("resize", this.updateFun);
		this.domElement.removeEventListener("wheel", this.onWheel);
	}
});