'use strict';

// import { Rnnoise } from "/@shiguredo/rnnoise-wasm";
import { Rnnoise } from "/node_modules/@shiguredo/rnnoise-wasm/dist/rnnoise.mjs";

class RnnoiseProcessor extends AudioWorkletProcessor {

    whatToDo = 'rnnoise';

    rnnoise;
    denoisedState;


    constructor() {
        super();
        console.log("creating rnnoise module");  
        
        Rnnoise.load().then((rnnoise) => {
            console.log("callback");
            this.rnnoise = rnnoise;
            this.denoisedState = this.rnnoise.createDenoiseState();
        });
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
        // for (let i = 0; i < output[0].length; i++) {
        //     output[0][i] = input[0][i];
        //     this.rnnoise.processFrame(output[0][i]);
        // }
        console.log(`done`);
    }
    
    process(inputs, outputs, parameters) {
        console.log(`hello from rnnoise: ${inputs.length}, ${outputs.length}`);
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