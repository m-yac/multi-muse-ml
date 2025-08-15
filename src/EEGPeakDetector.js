// ========================================================
//  Adapted from: Muse-ML-MIDI/muse/museEEGPeakDetector.js
// ========================================================

import { STATE_NONE } from './Constants.js';

export class EEGPeakDetector {
    
    constructor(targetState = STATE_NONE, threshold = 0.8, spacingBetweenTriggers = 10) {
        
        this.targetState = targetState;
        this.threshold = threshold;
        this.spacingBetweenTriggers = spacingBetweenTriggers;

        this.timeSinceLastTrigger = 0;
        this.on = false;

    }

    detectPeak(history) {

        if (history.length < 10) return;
    
        const currentValue = history[history.length - 1];
        const min = Math.min(...history);
        const max = Math.max(...history);
        const range = max - min;
    
        if (range === 0) return;
    
        const currPct = (currentValue - min) / range;
        if (!isFinite(currPct)) return;
    
        // Time since last trigger increases every call
        this.timeSinceLastTrigger++;
    
        if (currPct > this.threshold) {

            if (!this.on && this.timeSinceLastTrigger > this.spacingBetweenTriggers) {
                
                this.on = true;
                this.timeSinceLastTrigger = 0;

            } else {
                // Holding or still within cooldown
                return;
            }
        } else {
            if (this.on) {
              
                this.on = false;

            }
        }
    }
    
    
}