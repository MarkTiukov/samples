class RnnoiseProcessor extends AudioWorkletProcessor {

    myIndex = 0;

    constructor() {
        super();
        this.myIndex = Math.random();
        console.log("regestring/creating rnnoise module");
        console.log(`index == ${this.myIndex}`);
    }
    
    process(inputs, outputs, parameters) {
        console.log(`hello from rnnoise: ${inputs.length}, ${outputs.length}`);
        const input = inputs[0];
        const output = outputs[0];

        /// WHITE NOISE
        // output.forEach((channel) => {
        //   for (let i = 0; i < channel.length; i++) {
        //     channel[i] = Math.random() * 2 - 1;
        //   }
        // });

        /// DO NOTHING
        for (let i = 0; i < output[0].length; i++) {
          output[0][i] = input[0][i];
        }
        return true; // everything is ok, keep alive
    }

    
}

registerProcessor('rnnoise-processor', RnnoiseProcessor)