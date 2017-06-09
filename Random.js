/*This is a simple Pseudo-Random Number Generator inspired by an example xorshift32 implementation found on Wikipedia.

No rights are claimed (or infringed, I think).*/

var Random = function() {
	var state = 123456789;

	var seed = function(s=Date.now()) {
		if (s === 0 || isNaN(s)) {
			console.warn("Invalid seed ignored.");
			return;
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