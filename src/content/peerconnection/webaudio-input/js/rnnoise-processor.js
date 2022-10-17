'use strict';

import createRNNWasmModuleSync from "/node_modules/@jitsi/rnnoise-wasm/dist/rnnoise-sync.js";

const RNNOISE_SAMPLE_LENGTH = 480;

const RNNOISE_BUFFER_SIZE = RNNOISE_SAMPLE_LENGTH * 4;

const SHIFT_16_BIT_NR = 32768;

class RnnoiseProcessor extends AudioWorkletProcessor {

    denoisedState;

    inputBuffer;
    inputBufferF32Index;

    rnnModule;

    constructor() {
        super();
        console.log("creating rnnoise module");
        this.rnnModule = createRNNWasmModuleSync();
        this.inputBuffer = this.rnnModule._malloc(RNNOISE_BUFFER_SIZE);
        this.inputBufferF32Index = this.inputBuffer >> 2;
        if (!this.inputBuffer) {
            console.log("Failed to create wasm input memory buffer!");
            throw Error('Failed to create wasm input memory buffer!');
        }
        this.denoisedState = this.rnnModule._rnnoise_create();
    }

    processWithRnnoise(input, output) {
        for (let i = 0; i < input[0].length; i++) {
            this.rnnModule.HEAPF32[this.inputBufferF32Index + i] = input[0][i];
        }

        for (let i = input[0].length; i < RNNOISE_SAMPLE_LENGTH; i++) {
            this.rnnModule.HEAPF32[this.inputBufferF32Index + i] = 0;
        }

        this.rnnModule._rnnoise_process_frame(
            this.denoisedState,
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

        this.processWithRnnoise(input, output);

        return true; // everything is ok, keep alive
    }

}

registerProcessor('rnnoise-processor', RnnoiseProcessor)