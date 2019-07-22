"use strict";

//Helper function for making a sample from (possibly infinite) bounds mi, ma.
function randomPosition(mi,ma) {
	let infMin = false;
	if (mi === -Infinity)
		infMin = true;
	let infMax = false;
	if (ma === Infinity)
		infMax = true;

	let U = Math.random();
	//Uniform distribution
	if (!infMin && !infMax) return mi+(ma-mi)*U;
	let L = Math.log(U);
	//Normal distribution (Box-Muller, check formula)
	if (infMin && infMax) {
		let V = Math.random();
		return (-2*L)**0.5*Math.cos(2*Math.PI*V);
	}
	//Exponential distributions
	return (infMin ? (ma+L) : (mi-L));
}

function randomVelocity(pmi,pma) {
	let p = randomPosition(pmi,pma);
	let s = Math.random() < 0.5 ? -1 : 1;
	return 0.5*p*s;
}

//Perform a full PSO within a single function call:
function PSO(parNames, parMins, parMaxes, filter, costFun, inertiaFun=function(i,iterations) {return (1/3)*(1-i/iterations)}, cognitive=1/3, social=1/3, numParticles=1000, numIterations=1000) {
	let numParams = parNames.length;
	let global_best = new Array(numParams).fill(0);
	let global_best_value = Infinity;
	let local_bests = new Array(numParticles);
	let local_best_values = new Array(numParticles).fill(global_best_value);
	let positions = new Array(numParticles);
	let velocities = new Array(numParticles);
	for (let j = 0; j < numParticles; j++) {
		local_bests[j] = new Array(numParams).fill(0);
		positions[j] = new Array(numParams);
		velocities[j] = new Array(numParams).fill(0);
		for (let k = 0; k < numParams; k++) {
			let mi = parMins[k];
			let ma = parMaxes[k]
			positions[j][k] = randomPosition(mi,ma);
			velosicites[j][k] = randomVelocity(mi,ma);
		}
		if (!filter(positions[j])) {
			j--;
			continue;
		}
	}
	
	console.log("Done with initialization.");
	//return [0,0]; //Debug
	
	for (let i = 0; i < numIterations; i++) {
		let inertia = inertiaFun(i,numIterations);
		for (let j = 0; j < numParticles; j++) {
			let po = positions[j];
			let vo = velocities[j];
			let pn = new Array(numParams);
			let vn = new Array(numParams);
			while (true) {
				for (let k = 0; k < numParams; k++) {
					let r1 = Math.random();
					let r2 = Math.random();
					vn[k] = inertia*vo[k] 
							+ r1*cognitive*(local_bests[j][k]-po[k]) 
							+ r2*social*(global_best[k]-po[k]);
					pn[k] = po[k] + vn[k];
					//Clamp position:
					pn[k] = Math.min(parMaxes[k],Math.max(parMins[k],pn[k]));
				}
				if (filter(pn)) break;
			}
			//console.log("Broke out of while (true).");
			positions[j] = pn;
			velocities[j] = vn;
			let evaluation = costFun(pn);
			if (evaluation < local_best_values[j]) {
					local_bests[j] = pn.slice();
					local_best_values[j] = evaluation;
					if (evaluation < global_best_value) {
						global_best = pn.slice();
						global_best_value = evaluation;
					}
			}
		}
	}
	return global_best;
}

//Object-oriented 2D PSO for visualization, 
//based on Swarm class. Depends on Swarm.js and 
//Vector2D_operations.js
function PSO2D(names, mins, maxes, filterFun, costFun, inertia, cognitive, social, number=1000, pointRadius=1, verbose=false, epsilon=0.0001) {
	this.names = names;
	this.mins = mins;
	this.maxes = maxes;
	this.filterFun = filterFun;
	this.costFun = costFun;
	this.inertia = inertia;
	this.cognitive = cognitive;
	this.social = social;
	this.verbose = verbose;
	this.epsilon = epsilon; //zero threshold for respawning
	let scope = this;
	Swarm.call(this, {
		number,
		pointRadius,
		activeColor: 0x00ff00,
		passiveColor: 0xff0000,
		initProc: function(pa,va,aa,ud) {
			scope.iteration = 0;
			scope.global_best = new Array(2).fill(0);
			scope.global_best_value = Infinity;
			scope.local_bests = new Array(number);
			scope.local_best_values = new Array(number).fill(Infinity);
			for (let j = 0; j < number; j++) {
				scope.local_bests[j] = new Array(2).fill(0);
				for (let k = 0; k < 2; k++) {
					pa[j][k] = randomPosition(scope.mins[k],scope.maxes[k]);
				}
				if (scope.filterFun && !scope.filterFun(pa[j])) {
					j--;
					continue;
				}
			}
			if (scope.verbose) console.log("Done with initialization.");
		},
		updateProc: function(pa,va,aa,t,dt) {
			for (let j = 0; j < number; j++) {
				let po = pa[j];
				let vo = va[j];
				let pn = new Float32Array(2);
				let vn = new Float32Array(2);
				while (true) {
					let allZero = true;
					for (let k = 0; k < 2; k++) {
						let r1 = Math.random();
						let r2 = Math.random();
						vn[k] = scope.inertia*vo[k] 
								+ r1*scope.cognitive*(scope.local_bests[j][k]-po[k]) 
								+ r2*scope.social*(scope.global_best[k]-po[k]);
						if (Math.abs(vn[k]) > scope.epsilon) 
							allZero = false;
						pn[k] = po[k] + vn[k];
						//Clamp position:
						pn[k] = Math.min(scope.maxes[k],Math.max(scope.mins[k],pn[k]));
						if (Math.abs(scope.global_best[k]-pn[k]) > scope.epsilon) allZero = false;
					}
					//Prevent idle particles:
					if (allZero) {
						//console.log("Respawning particle.");
						scope.local_best_values[j] = Infinity;
						for (let k = 0; k < 2; k++) {
							let mi = scope.mins[k];
							let ma = scope.maxes[k];
							pn[k] = randomPosition(mi,ma);
							vn[k] = randomVelocity(mi,ma);
						}
					}
					if (!scope.filterFun || scope.filterFun(pn)) break;
				}
				//console.log("Broke out of while (true).");
				pa[j].set(pn);
				va[j].set(vn);
				let L = length(vn);
				aa[j] = 1/(0.5+0.5*L);
				let evaluation = costFun(pn);
				if (evaluation < scope.local_best_values[j]) {
						scope.local_bests[j] = pn;
						scope.local_best_values[j] = evaluation;
						if (evaluation < scope.global_best_value) {
							scope.global_best = pn;
							scope.global_best_value = evaluation;
							if (scope.verbose) scope.logBest();
						}
				}
			}
			scope.iteration++;
		}
	});
}
PSO2D.prototype = Object.create(Swarm.prototype);
Object.assign(PSO2D.prototype, {
	constructor: PSO2D,
	logBest: function() {
		console.log("Iteration "+this.iteration+": Global best = ["+this.names[0]+", "+this.names[1]+"] = ["+this.global_best[0]+", "+this.global_best[1]+", value = "+this.global_best_value);
	}
});