/*This is a simple Pseudo-Random Number Generator inspired by an example xorshift32 implementation found on Wikipedia.

No rights are claimed (or infringed, I think).

Todo:
- Switch to 64 bit internal state, so that an extracted 32 bit component is not 2^32 periodic. This will require some tricks, as bitwise operations in javascript work on 32 bits only, natively.
*/

var Random = function() {
	var state = 123456789;

	var seed = function(s) {
		if (s === 0 || isNaN(s)) {
			console.log("Invalid seed (" + s + "). Using time instead.");
			s = Date.now();
		}
		state = s;
	};

	//Source: https://en.wikipedia.org/wiki/Xorshift
	var rInt32 = function() {
		state ^= (state << 13);
		state ^= (state >>> 17);
		state ^= (state << 5);
		return state;
	};

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