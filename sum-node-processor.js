class SumNodeProcessor extends AudioWorkletProcessor {
	process(inputs, outputs, parameters) {
		//Sum all axes into a single, single-channel output:
		const output = outputs[0];
		const channel = output[0];
		for (let i = 0; i < channel.length; i++) {
			for (let input of inputs) {
				for (let j = 0; j < input.length; j++) {
					channel[i] += input[j][i];
				}
			}
		}
		
		return true;
	}
}

registerProcessor("sum-node-processor", SumNodeProcessor);
