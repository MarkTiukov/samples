'use strict';

import createRNNWasmModuleSync from "/node_modules/@jitsi/rnnoise-wasm/dist/rnnoise-sync.js";

class RnnoiseProcessor extends AudioWorkletProcessor {

    whatToDo = 'rnnoise';

    rnnoise;
    denoisedState;

    rnnoiseWasmModule;

    constructor() {
        super();
        console.log("creating rnnoise module");  
        this.rnnoiseWasmModule = createRNNWasmModuleSync();
        this.denoise_state = this.rnnoiseWasmModule._rnnoise_create();
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

    processWithRnnoise(input, output) {
        for (let i = 0; i < input[0].length; i++) {
            // output[0][i] = input[0][i];
            output[1][i] = 0;    
        }
        let bufferIn = new Float32Array(480);
        let bufferOut = new Float32Array(480);
        bufferIn.set(input[0]);
        this.rnnoiseWasmModule._rnnoise_process_frame(this.denoise_state, bufferOut, bufferIn);
        console.log(`buffer output length == ${bufferOut.length}, output length == ${output[0].length}`);
        output[0].set(bufferOut.slice(0, 128));
    }
    
    process(inputs, outputs, parameters) {
        // console.log(`hello from rnnoise: ${inputs.length}, ${outputs.length}`);
        const input = inputs[0];
        const output = outputs[0];

        switch (this.whatToDo) {
            case 'rnnoise':
                this.processWithRnnoise(input, output);
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