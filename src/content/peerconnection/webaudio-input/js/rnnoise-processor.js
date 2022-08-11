class RnnoiseProcessor extends AudioWorkletProcessor {

    whatToDo = 'white noise';

    constructor() {
        super();
        console.log("creating rnnoise module");  
    }

    generateWhiteNoise(output) {
        output.forEach((channel) => {
            for (let i = 0; i < channel.length; i++) {
                channel[i] = Math.random() * 2 - 1;
            }
        }); 
    }

    letThrough(input, output) {
        for (let i = 0; i < output[0].length; i++) {
            output[0][i] = input[0][i];
        }
    }
    
    process(inputs, outputs, parameters) {
        console.log(`hello from rnnoise: ${inputs.length}, ${outputs.length}`);
        const input = inputs[0];
        const output = outputs[0];

        switch (this.whatToDo) {
            case 'rnnoise':
                // pass through rnnoise
                break;
            case 'nothing':
                this.letThrough(input, output);
                break;
            case 'white noise':    
                this.generateWhiteNoise(output);
                break;
            default:
                // throw exception
                break;
        }

        return true; // everything is ok, keep alive
    }

}

registerProcessor('rnnoise-processor', RnnoiseProcessor)