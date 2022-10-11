'use strict';

import createRNNWasmModuleSync from "/node_modules/@jitsi/rnnoise-wasm/dist/rnnoise-sync.js";

const RNNOISE_SAMPLE_LENGTH = 480;

const RNNOISE_BUFFER_SIZE = RNNOISE_SAMPLE_LENGTH * 4;

const SHIFT_16_BIT_NR = 32768;

class RnnoiseProcessor extends AudioWorkletProcessor {

    whatToDo = 'rnnoise';

    rnnoise;
    denoisedState;

    inputBuffer;
    inputBufferF32Index;

    is_destroyed;

    rnnModule;

    constructor() {
        super();
        console.log("creating rnnoise module");
        this.is_destroyed = false;  
        this.rnnModule = createRNNWasmModuleSync();
        this.inputBuffer = this.rnnModule._malloc(RNNOISE_BUFFER_SIZE);
        this.inputBufferF32Index = this.inputBuffer >> 2;
        if (!this.inputBuffer) {
            console.log("Failed to create wasm input memory buffer!");
            throw Error('Failed to create wasm input memory buffer!');
        }
        this.denoise_state = this.rnnModule._rnnoise_create();
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

    passNothing(output) {
        for (let i = 0; i < output[0].length; i++) {
            output[0][i] = input[0][i];
        }
    }

    processWithRnnoise(input, output) {
        console.log("processing");
        for (let i = 0; i < input[0].length; i++) {
            this.rnnModule.HEAPF32[this.inputBufferF32Index + i] = input[0][i];
        }

        for (let i = input[0].length; i < RNNOISE_SAMPLE_LENGTH; i++) {
            this.rnnModule.HEAPF32[this.inputBufferF32Index + i] = 0;
        }

        this.rnnModule._rnnoise_process_frame(
            this.denoise_state,
            this.inputBuffer,
            this.inputBuffer
        );

        for (let i = 0; i < input[0].length; i++) {
            output[0][i] = this.rnnModule.HEAPF32[this.inputBufferF32Index + i];
        }
    }
    
    process(inputs, outputs, parameters) {
        const input = inputs[0];
        const output = outputs[0];

        switch (this.whatToDo) {
            case 'rnnoise':
                this.processWithRnnoise(input, output);
                break;
            case 'do nothing':
                this.letThrough(input, output);
                break;
            case 'nothing':
                this.passNothing(output);
                break;
            case 'white noise':    
                this.generateWhiteNoise(output);
                break;
            default:
                // throw exception
                break;
        }
        console.log(`${output}`)
        return true; // everything is ok, keep alive
    }

}

registerProcessor('rnnoise-processor', RnnoiseProcessor)