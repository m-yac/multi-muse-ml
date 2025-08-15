import { STATE_MUSCLE, STATE_DREAM, STATE_MEDIT, STATE_FOCUS } from './Constants.js';
import { MuseDataBuffer } from './MuseDataBuffer.js';
import { EEGPeakDetector } from './EEGPeakDetector.js';
import { FFT } from './FFT.js';

// ============================================
//  Adapted from: Muse-ML-MIDI/muse/museEEG.js
// ============================================

export class EEGWave {

    //create wave with the low and high end of the wave, in Hz
    //for example, alpha is 8Hz - 12 Hz
    //so binLow = 8, binHigh = 12
    constructor(binLow, binHigh) {
        
        this.binLow = binLow;
        this.binHigh = binHigh
        this.spectrum = []
        this.average = 0;
    }

    //receive frequency spectrum for just this wave from FFT
    //for example, alpha would just receive the 8 - 12 Hz slices of the frequency spectrum
    update(withSpectrum) {

        //average out each slice to one, averaged value for the whole brainwave
        //for example, alpha would take the values from 8Hz, 9Hz, 10Hz, and 11Hz
        //and average them into one value
        this.spectrum = withSpectrum;
        this.average = withSpectrum.reduce((a, b) => a + b) / withSpectrum.length
    }
}

export class EEGSensor {

    constructor() {

        //data buffer
        this.EEG_BUFFER_SIZE = 256;
        this.buffer = new MuseDataBuffer(this.EEG_BUFFER_SIZE);

        //fft to process time based samples in buffer into a frequency based spectrum
        let MUSE_SAMPLE_RATE = 220;
        this.fft = new FFT(this.EEG_BUFFER_SIZE, MUSE_SAMPLE_RATE);
        
        //divide the sample rate by the buffer size to get how many frequencies are covered per fft bin
        let freqInc = (MUSE_SAMPLE_RATE / this.EEG_BUFFER_SIZE)

        //create and store an array to store what frequency is at what bin
        //only is the sample rate and the buffer size were exactly the same
        //(like 256 sample rate / 256 buffer size)
        //would each bin be 1 Hz
        //since they aren't, we need to calculate which bin corresponds with which Hz
        
        //start with an array of 0's
        this.frequencies = new Array(this.EEG_BUFFER_SIZE/2).fill(0);
        //loop through
        for (let i = 0; i < this.frequencies.length; i++) {
            //each slot is the slot num x the incrementation
            //for example, if the sample rate is 220 and buffer is 246  
            //then the frequencies in the bins are:
            //0, 0.859375, 1.71875, 2.578125, 3.4375, etc...
            //not 0, 1, 2, 3, 4, etc...
            this.frequencies[i] = i * freqInc; 
        }

        //calc the high and low bin for each brainwave
        //pass in the Hz (like alpha is 8-12)
        //get back the bins (alpha bins are 9-14)

        let deltaLow = this._getPositionForFrequency(1, this.frequencies);
        let deltaHigh = this._getPositionForFrequency(3, this.frequencies);
        this.delta = new EEGWave(deltaLow, deltaHigh);
        
        let thetaLow = this._getPositionForFrequency(4, this.frequencies);
        let thetaHigh = this._getPositionForFrequency(7, this.frequencies);
        this.theta = new EEGWave(thetaLow, thetaHigh);
        
        let alphaLow = this._getPositionForFrequency(8, this.frequencies);
        let alphaHigh = this._getPositionForFrequency(12, this.frequencies);
        this.alpha = new EEGWave(alphaLow, alphaHigh);
        
        let betaLow = this._getPositionForFrequency(13, this.frequencies);
        let betaHigh = this._getPositionForFrequency(30, this.frequencies);
        this.beta = new EEGWave(betaLow, betaHigh);
        
        let gammaLow = this._getPositionForFrequency(31, this.frequencies);
        let gammaHigh = this._getPositionForFrequency(40, this.frequencies);
        this.gamma = new EEGWave(gammaLow, gammaHigh);
        
        //store all the new waves in an array for access
        this.waves = [
            this.delta,
            this.theta,
            this.alpha,
            this.beta,
            this.gamma,
        ]

        //and store the whole spectrum var for screen printing, etc...
        this.spectrum = new Array(this.EEG_BUFFER_SIZE/2).fill(0);
    }

    //update from sensor
    update(withSamples) {
        
        //add new samples to buffer
        let sensorBuffer = this.buffer.update(withSamples)

        //turn samples into a frequency spectrum using FFT
        this.spectrum = this.fft.forward(sensorBuffer);
        //console.log("spectrum", this.spectrum);

        for (let i = 0; i < this.waves.length; i++) {
            let wave = this.waves[i];
            wave.update(this.spectrum.slice(wave.binLow, wave.binHigh));
        }
    }
  
    //helpers
    _findClosestValue(searchValue, inArray) {

        return inArray.reduce((a, b) => {
            let aDiff = Math.abs(a - searchValue);
            let bDiff = Math.abs(b - searchValue);
    
            if (aDiff == bDiff) {
                return a > b ? a : b;
            } else {
                return bDiff < aDiff ? b : a;
            }
        });
    }

    _getPositionForFrequency(frequency, inArray){
        let exactFrequency = this._findClosestValue(frequency, inArray)
        let exactFrequencyPosition = inArray.indexOf(exactFrequency, 0);
         return exactFrequencyPosition;
    }

}

// ========================================================================
//  Note: The rest of this file was combined with `eeg` from Muse-ML-MIDI/
//  /muse/muse.js to form a class, instead of using global scope.
// ========================================================================

export class EEG {
    delta = 0
    theta = 0
    alpha = 0
    beta = 0
    gamma = 0
    sensors = []
    deltaHistory = []
    thetaHistory = []
    alphaHistory = []
    betaHistory = []
    gammaHistory = []

    constructor() {
        // this.leftEar = new EEGSensor();
        this.leftForehead = new EEGSensor();
        this.rightForehead = new EEGSensor();
        // this.rightEar = new EEGSensor();

        this.sensors = [
            // this.leftEar,
            this.leftForehead,
            this.rightForehead,
            // this.rightEar
        ]
        this.sensorTotal = this.sensors.length;

        this.eegSpectrum = new Array(this.leftForehead.EEG_BUFFER_SIZE/2).fill(0);

        //peak detection
        //TODO: test these values
        this.deltaPeakDetector = new EEGPeakDetector(STATE_MUSCLE, 0.99, 25);
        this.thetaPeakDetector = new EEGPeakDetector(STATE_DREAM,  0.30, 250);
        this.alphaPeakDetector = new EEGPeakDetector(STATE_MEDIT,  0.30, 250);
        this.betaPeakDetector  = new EEGPeakDetector(STATE_FOCUS,  0.99, 10);
        this.gammaPeakDetector = new EEGPeakDetector(STATE_FOCUS,  0.90, 10);
    }

    //func to process EEG data per sensor
    process(sensor, eegSamples) {
    
        //pass into the specified sensor
        this.sensors[sensor].update(eegSamples);
    
        //get the post-fft frequency spectrum from each sensor
        let sensorSpectrums = []
        for (let i = 0; i < this.sensorTotal; i++) {
            sensorSpectrums.push(this.sensors[i].spectrum);
        }
        //average the spectrums from all the this.sensors into one spectrum 
        this.eegSpectrum = this._getAverageByIndex(sensorSpectrums);
    
        //init vars for the total of each brainwave across all this.sensors
        //for example, what is the average alpha across all 4 this.sensors
        let deltaTotal = 0;
        let thetaTotal = 0;
        let alphaTotal = 0;
        let betaTotal = 0;
        let gammaTotal = 0;
        
        //loop through each sensor
        for (let i = 0; i < this.sensorTotal; i++) {
    
            //target each sensor
            let sensor = this.sensors[i];
    
            //add brainwave average from each sensor to the total
            deltaTotal += sensor.delta.average;
            thetaTotal += sensor.theta.average;
            alphaTotal += sensor.alpha.average;
            betaTotal += sensor.beta.average;
            gammaTotal += sensor.gamma.average;
        }
    
        //then average out the totals by 4 (sensor total)
        //resulting in the average brainwave strength across the entire headband
        this.delta = deltaTotal / this.sensorTotal;
        this.theta = thetaTotal / this.sensorTotal;
        this.alpha = alphaTotal / this.sensorTotal;
        this.beta = betaTotal / this.sensorTotal;
        this.gamma = gammaTotal / this.sensorTotal;
    
        //update histories
        this.updateEEGHistories();
    
        //update peak detectors
        // this.runEEGPeakDetectors(state);
    
    }
    
    //EEG histories
    updateEEGHistories() {
    
        //push the most recent value into the history
        this.deltaHistory.push(this.delta);
        this.thetaHistory.push(this.theta);
        this.alphaHistory.push(this.alpha);
        this.betaHistory.push(this.beta);
        this.gammaHistory.push(this.gamma);
    
        // trim the histories to a max length
        const maxLength = 75;
        if (this.deltaHistory.length > maxLength) this.deltaHistory.shift();
        if (this.thetaHistory.length > maxLength) this.thetaHistory.shift();
        if (this.alphaHistory.length > maxLength) this.alphaHistory.shift();
        if (this.betaHistory.length  > maxLength) this.betaHistory.shift();
        if (this.gammaHistory.length > maxLength) this.gammaHistory.shift();
    }
    
    runEEGPeakDetectors(state) {
        let peakDetectionOK = true;
    
        // If noise is too high, skip all peak detection
        if (state.noise > 0.1) {
            peakDetectionOK = false;
        }
    
        // If muscle is too high, allow only delta detection
        const allowNonDelta = state.muscle >= 0.1;
      
        if (peakDetectionOK) {
            // Delta is allowed no matter what
            this.deltaPeakDetector.detectPeak(this.deltaHistory);
    
            // Others only if muscle isn't too high
            if (allowNonDelta) {
                this.thetaPeakDetector.detectPeak(this.thetaHistory);
                this.alphaPeakDetector.detectPeak(this.alphaHistory);
                this.betaPeakDetector.detectPeak(this.betaHistory);
                this.gammaPeakDetector.detectPeak(this.gammaHistory);
            }
        }
    }
    
    //helper
    _getAverageByIndex(arrays) {
    
        //create blank array to store the averages
        let avgArr = new Array(arrays[0].length).fill(0);
    
        let arraysLength = arrays.length;
        
        //step through each empty slot in averaged array
        for (let s = 0; s < avgArr.length; s++) {
    
            //loop throgh the values in this position
            let positionAvg = 0;
            for (let a = 0; a < arraysLength; a++) {
                positionAvg += arrays[a][s]; //add them up
            }
            //divide to get average
            positionAvg /= arraysLength;
    
            //store in slot
            avgArr[s] = positionAvg;
        }
    
        return avgArr;
    }

}
