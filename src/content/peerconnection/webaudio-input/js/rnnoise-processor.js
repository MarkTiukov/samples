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
            throw Error('');
        }
        this.denoise_state = this.rnnModule._rnnoise_create();
        console.log("created rnnoise module");
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

        console.log(output[0]);

        // let inArray = this.rnnModule._malloc(RNNOISE_BUFFER_SIZE);
        // if (this.rnnModule.wasmMemory == undefined) {
        //     console.log(`wasm memorry is undefinied`);
        // }
        // let wasmMem = new Float32Array(this.rnnModule.wasmMemory.buffer, inArray, RNNOISE_SAMPLE_LENGTH);
        // wasmMem.set(input[0]);

        // let bufferIn = new Float32Array(480);
        // let bufferOut = new Float32Array(480);
        // bufferIn.set(input[0]);

        // this.rnnoiseWasmModule._rnnoise_process_frame(
        //     this.denoise_state, bufferOut, bufferIn);
        // console.log(`buffer output length == ${bufferOut.length}, output length == ${output[0].length}`);
        // output[0].set(bufferOut.slice(0, 128));
        // console.log(bufferOut);
        // output[0].set(input[0], 0, 128);

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