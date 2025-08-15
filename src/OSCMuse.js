import { MuseBase } from 'web-muse';
import OSC, { STATUS } from 'osc-js';

export class OSCMuse extends MuseBase {
    constructor(addressBase = 'muse', options = {}) {
        super();
        this.eegBuffer = [[], [], [], []];
        this.ppgBuffer = [[], [], []];
        
        this.addressBase = addressBase;
        this.oscHost = options.host || '127.0.0.1';
        this.oscPort = options.port || 8080;
        
        this.osc = new OSC({ plugin: new OSC.WebsocketClientPlugin(options) });
        
        this.info = {};
        this.lastHorseshoeTime = 0;
        
        try {
            this.osc.open();
            console.log(`OSC WebSocket client connected to ws://${this.oscHost}:${this.oscPort}`);
        } catch (error) {
            console.error('Failed to open OSC WebSocket connection:', error);
        }
    }

    sendOSCMessage(address, ...args) {
        if (!this.osc || this.osc.status() != STATUS.IS_OPEN) { return; }
        try {
            const message = new OSC.Message(`/${this.addressBase}/${address}`, ...args);
            this.osc.send(message);
        } catch (error) {
            console.error(`Failed sendOSCMessage(${address}, ${args}):`, error);
        }
    }

    batteryData(batteryLevel) {
        this.sendOSCMessage('batt', batteryLevel);
    }

    accelerometerData(data) {
        for (let i = 0; i < data[0].length; i++) {
            this.sendOSCMessage('acc', data[0][i], data[1][i], data[2][i]);
        }
    }

    gyroscopeData(data) {
        for (let i = 0; i < data[0].length; i++) {
            this.sendOSCMessage('gyro', data[0][i], data[1][i], data[2][i]);
        }
    }

    sendBufferedData(address, channelIndex, buffer, samples) {
        if (channelIndex >= buffer.length) { return; }

        samples.forEach(sample => {
            buffer[channelIndex].push(sample);
        });

        if (buffer.every(channel => channel.length > 0)) {
            const minLength = Math.min(...buffer.map(channel => channel.length));
            
            for (let i = 0; i < minLength; i++) {
                const tuple = buffer.map(channel => channel.shift());
                this.sendOSCMessage(address, ...tuple);
            }
        }
    }

    eegData(channelIndex, samples) {
        this.sendBufferedData('eeg', channelIndex, this.eegBuffer, samples);
    }

    ppgData(channelIndex, samples) {
        this.sendBufferedData('ppg', channelIndex, this.ppgBuffer, samples);
    }

    disconnected() {
        if (this.osc) {
            try {
                this.osc.close();
            } catch (error) {
                console.error('Error closing OSC connection:', error);
            }
        }
    }
}