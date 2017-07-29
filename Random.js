/*This is a simple Pseudo-Random Number Generator inspired by an example xorshift32 implementation found on Wikipedia.

No rights are claimed (or infringed, I think).

Todo:
- Switch to 64 bit internal state, so that an extracted 32 bit component is not 2^32 periodic. This will require some tricks, as bitwise operations in javascript work on 32 bits only, natively.
*/

var Random = function() {
	var state = 123456789;
	var stateHI = 153453643; //experimental

	var seed = function(s, hi) {
		if (s === 0 || isNaN(s)) {
			console.log("Invalid seed (" + s + "). Using time instead.");
			s = Date.now();
		}
		state = s;
		//experimental:
		if (hi !== undefined) {
			if (isNaN(hi)) {
				console.log("Invalid hi seed (" + hi + "). Using value from time instead.");
				hi = 153453643^Date.now();
			}
			stateHI = hi;
		}
	};

	//Source: https://en.wikipedia.org/wiki/Xorshift
	var rInt32 = function() {
		state ^= (state << 13);
		state ^= (state >>> 17);
		state ^= (state << 5);
		return state;
	};
	
	//Experimental:
	var xorshift64 = function() {
		//x ^= x >> 12 :
		let hi = stateHI^(stateHI>>>12);
		let lo = state^((state>>>12)|((stateHI&0xFFF)<<20));
		stateHI = hi;
		state = lo;
		
		//x ^= x << 25 :
		hi = stateHI^((stateHI<<25)|(state>>>7));
		lo = state^(state<<25);
		stateHI = hi;
		state = lo;
		
		//x ^= x >> 27 :
		hi = stateHI^(stateHI>>>27);
		lo = state^((state>>>27)|((stateHI&0x7FFFFFF)<<5));
		stateHI = hi;
		state = lo;
	}
	
	//experimental
	var rand53 = function() {
		xorshift64();
		return ((stateHI&0x1fffff)*0x100000000+state)/0x20000000000000;
	}
	
	//experimental
	var rInt32_from64 = function() {
		xorshift64();
		return state;
	}

	//TODO: Improve this to generate 53 bits instead of 32:
	var rand = function() {
		return (rInt32()+0x80000001)/0x100000000;
	};

	return {
		seed: seed,
		rInt32: rInt32,
		rand: rand,
		rBit: function() {
			return rInt32()&1;
		},
		//"coin flip" boolean
		rCoin: function() {
			return (rInt32()&1) === 1;
		}
	};
}();