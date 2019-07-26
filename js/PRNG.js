//Own xorshift64 implementation (where are the parameters from?)

function PRNG(seed) {
	this.state = new Uint32Array(2).fill(0);
	if (seed !== undefined && isNaN(seed)) {
		console.log("Invalid seed " + seed + ". Using time instead.");
		seed = undefined;
	}
	
	if (seed === undefined) {
		seed = Date.now();
	}
	
	this.seed(seed);
}

PRNG.prototype = Object.create(Object.prototype);

Object.assign(PRNG.prototype, {
	constructor: PRNG,
	seed: function(s) {
		this.state[0] = 0xFFFFFFFF-s; //ensures not all zero initial state
		this.state[1] = s;
		//Burn-in:
		for (let i = 0; i < 20; i++) {
			this.xorshift64();
		}
	},
	xorshift64: function() {
		let [hi,lo] = this.state;
		
		//x ^= x >> 12 :
		hi = hi^(hi>>>12);
		lo = lo^((lo>>>12)|((hi&0xFFF)<<20));
		
		//x ^= x << 25 :
		hi = hi^((hi<<25)|(lo>>>7));
		lo = lo^(lo<<25);
		
		//x ^= x >> 27 :
		hi = hi^(hi>>>27);
		lo = lo^((lo>>>27)|((hi&0x7FFFFFF)<<5));

		this.state[0] = hi;
		this.state[1] = lo;
	},
	randInt32: function() {
		//Update state
		this.xorshift64();
		//Return middle 32 bits of state as a SIGNED integer
		return ((this.state[0]&0xFFFF)<<16)|(this.state[1]>>16);
	},
	rand: function() {
		this.xorshift64();
		//Generate float in [0,1) from middle 52 bits (ignoring sign bit)
		return (this.state[0]&0x3FFFFFF)/0x4000000 + (this.state[0]>>6)/0x10000000000000;
	}
});

PRNG.prototype.next = function() {
	let res = this.rand();
	if (isNaN(res) || res<0 || res>=1) {
		console.error("PRNG: Invalid output "+res+".");
	}
	return res;
}