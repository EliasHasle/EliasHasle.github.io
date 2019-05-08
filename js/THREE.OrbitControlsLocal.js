THREE.OrbitControlsLocal = function ( realObject, domElement ) {
	this.realObject = realObject;
	//Camera and Object3D have different forward direction:
	let placeholderObject = realObject.isCamera ? new THREE.PerspectiveCamera() : new THREE.Object3D;
	this.placeholderObject = placeholderObject;
	
	THREE.OrbitControls.call( this, placeholderObject, domElement );
		
	let globalUpdate = this.update;
	this.globalUpdate = globalUpdate;
	this.update = function() {

		//This responds to changes made to realObject from outside the controls:
		placeholderObject.position.copy( realObject.position );
		placeholderObject.quaternion.copy( realObject.quaternion);
		placeholderObject.scale.copy( realObject.scale );
		placeholderObject.up.copy( realObject.up );
		
		var retval = globalUpdate();
		realObject.position.copy( placeholderObject.position );
		realObject.quaternion.copy( placeholderObject.quaternion);
		realObject.scale.copy( placeholderObject.scale );
		return retval ;

	};
	
	this.update();
};

THREE.OrbitControlsLocal.prototype = Object.create(THREE.OrbitControls.prototype);
THREE.OrbitControlsLocal.prototype.constructor = THREE.OrbitControlsLocal;

Object.defineProperties(THREE.OrbitControlsLocal.prototype, {
	localTarget: {
		get: ()=>this.target,
		set: v=>this.target=v
	}
});