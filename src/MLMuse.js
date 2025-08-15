import { OSCMuse } from './OSCMuse.js';
import { PPG } from './PPG.js';
import { EEG } from './EEG.js';

export const BUFFER_SIZE = 256;

export class MLMuse extends OSCMuse {

    constructor(ml) {
        super();
        this.ml = ml;
        this.batteryLevel = 0;
        this.gyro = { x: 0, y: 0, z: 0 };
        this.accel = { x: 0, y: 0, z: 0 };
        this.ppg = new PPG();
        this.eeg = new EEG();
        this.mlState = { noise: 0, muscle: 0, focus: 0, clear: 0, meditation: 0, dream: 0 };

        this.eegBuffers = [ [], [], [], [], [] ];
        this.accelerometerBuffers = [ [], [], [] ];
        this.gyroscopeBuffers = [ [], [], [] ];
        this.ppgBuffers = [ [], [], [] ];
    }

    addToBuffer(buffer, value) {
        buffer.unshift(value);
        if (buffer.length > BUFFER_SIZE) {
            buffer.length = BUFFER_SIZE;
        }
    }

    batteryData(batteryData) {
        super.batteryData(batteryData);
        this.batteryLevel = batteryData;
    }

    accelerometerData(data) {
        super.accelerometerData(data);

        // Average the 3-axis values
        this.accel.x = (data[0][0] + data[0][1] + data[0][2]) / 3;
        this.accel.y = (data[1][0] + data[1][1] + data[1][2]) / 3;
        this.accel.z = (data[2][0] + data[2][1] + data[2][2]) / 3;
        
        for (let i = 0; i < data[0].length; i++) {
            this.addToBuffer(this.accelerometerBuffers[0], data[0][i]);
            this.addToBuffer(this.accelerometerBuffers[1], data[1][i]);
            this.addToBuffer(this.accelerometerBuffers[2], data[2][i]);
        }
    }

    gyroscopeData(data) {
        super.gyroscopeData(data);

        // Average the 3-axis values
        this.gyro.x = (data[0][0] + data[0][1] + data[0][2]) / 3;
        this.gyro.y = (data[1][0] + data[1][1] + data[1][2]) / 3;
        this.gyro.z = (data[2][0] + data[2][1] + data[2][2]) / 3;
        
        for (let i = 0; i < data[0].length; i++) {
            this.addToBuffer(this.gyroscopeBuffers[0], data[0][i]);
            this.addToBuffer(this.gyroscopeBuffers[1], data[1][i]);
            this.addToBuffer(this.gyroscopeBuffers[2], data[2][i]);
        }
    }

    eegData(n, samples) {
        super.eegData(n, samples);

        if (n+1 == 3) {
            this.eeg.process(1, samples);
        }
        else if (n+1 == 2) {
            this.eeg.process(0, samples);
            // Only do this once per update (every 1000/(256/12) = 46.875ms)
            this.sendOSCMessage('spectrum', ...this.eeg.eegSpectrum.slice(0, 48));
            // this.mlState = this.ml.classifyLiveEEG(this.eeg);
            // for (const st in this.mlState) {
            //     this.sendOSCMessage(`mlState/${st}`, this.mlState[st]);
            // }
            // this.eeg.runEEGPeakDetectors(this.mlState);
        }
        
        samples.forEach(sample => {
          this.addToBuffer(this.eegBuffers[n], sample);
        });
    }

    ppgData(n, samples) {
        super.ppgData(n, samples);

        if (n+1 == 2) {
            this.ppg.process(samples);
            this.sendOSCMessage('heartbeat', this.ppg.heartbeat ? 1 : 0);
            if (isFinite(this.ppg.bpm)) {
                this.sendOSCMessage('bpm', this.ppg.bpm);
            }
        }
        
        samples.forEach(sample => {
            this.addToBuffer(this.ppgBuffers[n], sample);
        });
    }
}