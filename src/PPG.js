import { MuseDataBuffer } from './MuseDataBuffer.js';

// ============================================
//  Adapted from: Muse-ML-MIDI/muse/musePPG.js
// ============================================

const PPG_SAMPLES_MAX = 80;
const BEAT_DETECTION_THRESHOLD = 0.6 //0.996 //0.9982 //0.998
const BPM_SAMPLES_MAX = 10;

export class PPG {
    bpm = 0
    heartbeat = false
    amplitude = 0
    buffer = []
    max = 0
    min = 0

    constructor() {
        this.ppgBuffer = new MuseDataBuffer(PPG_SAMPLES_MAX);
        this.heartbeatTimestamps = []
    }
    
    process(ppgSamples) {

        //add decoded samples to the buffer
        this.buffer = this.ppgBuffer.update(ppgSamples);
        this.buffer = this.movingAverageSmooth(this.buffer, 10);
    
        //calc the high and low value of the buffer
        this.max = Math.max(...this.buffer);
        this.min = Math.min(...this.buffer);
    
        //grab most recent value in ppg array
        this.amplitude = this.buffer[this.buffer.length - 1];
    
        //what percentage is it of the max?
        let ppgPercent = (this.amplitude-this.min) / (this.max-this.min);
        
        //console.log("ppgPercent: " + (ppgPercent * 100).toFixed(0));
        //if recent value is near the max value, it's a heartbeat
        if (ppgPercent > BEAT_DETECTION_THRESHOLD) { //threshold for a beat detection
    
            //if previously false...
            if (this.heartbeat == false) {
    
                //record the timestamp of this heartbeat
                this.heartbeatTimestamps.push(new Date().getTime());
    
                //keep timestamps array from growing too long
                if (this.heartbeatTimestamps.length > BPM_SAMPLES_MAX) { 
                    let diff = this.heartbeatTimestamps.length - BPM_SAMPLES_MAX;
                    this.heartbeatTimestamps.splice(0, diff); 
                }
    
                let durationsBetweenBeats = []
    
                //if there are enough samples...
                if (this.heartbeatTimestamps.length > 1) {
    
                    //loop through each timestamp
                    for (var i = this.heartbeatTimestamps.length-1; i > 1; i--) {
    
                        //get this and the next timestamp
                        let currTimestamp = this.heartbeatTimestamps[i];
                        let prevTimestamp = this.heartbeatTimestamps[i - 1];
                    
                        //calculate time between beats and save it
                        let durationBetweenBeats = currTimestamp - prevTimestamp;
                        durationsBetweenBeats.push(durationBetweenBeats);
                    }
    
                    //calc durations between the beats
                    let durationsTotal = 0;
                    for (var i = 0; i < durationsBetweenBeats.length; i++) {
    
                        //add up the durations
                        durationsTotal += durationsBetweenBeats[i];
                    }
                    //calc average in milliseconds
                    let durationAverage = durationsTotal / durationsBetweenBeats.length;
                    
                    //bpm = 60000 / ms duration of quarter note
                    this.bpm = Math.round(60000 / durationAverage);
    
                    //keep bpm above 50
                    if (this.bpm < 50) {
                        this.bpm = 50;
                    }
            
                }
            }
    
            //when heart beat is occurring
            this.heartbeat = true;
    
        } else {
            //else off
            this.heartbeat = false;
        }
          
    }
    
    movingAverageSmooth(arr, windowSize) {
        if(windowSize <= 1) {
          return arr.slice();
        }
        
        const result = [];
        for(let i = 0; i < arr.length; i++) {
          let sum = 0;
          let count = 0;
          for(let j = -Math.floor(windowSize / 2); j <= Math.floor(windowSize / 2); j++) {
            const index = i + j;
            if(index >= 0 && index < arr.length) {
              sum += arr[index];
              count++;
            }
          }
          result[i] = sum / count;
        }
        return result;
      }
}