import { MuseBase } from 'web-muse';
import OSC from 'osc-js';

export class OSCMuse extends MuseBase {
  constructor(options = {}) {
    super();
    this.eegBuffer = [[], [], [], []];
    this.ppgBuffer = [[], [], []];
    
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

  sendOSCMessage(address, args = []) {
    try {
      const message = new OSC.Message(address, ...args);
      this.osc.send(message);
    } catch (error) {
      console.error('Failed to send OSC message:', error);
    }
  }

  batteryData(event) {
    const batteryLevel = this.eventBatteryData(event);
    this.sendOSCMessage('/muse/batt', [batteryLevel]);
  }

  accelerometerData(event) {
    const accelData = this.eventAccelerometerData(event);
    for (let sample = 0; sample < accelData[0].length; sample++) {
      this.sendOSCMessage('/muse/acc', [
        accelData[0][sample],
        accelData[1][sample], 
        accelData[2][sample]
      ]);
    }
  }

  gyroscopeData(event) {
    const gyroData = this.eventGyroscopeData(event);
    for (let sample = 0; sample < gyroData[0].length; sample++) {
      this.sendOSCMessage('/muse/gyro', [
        gyroData[0][sample],
        gyroData[1][sample],
        gyroData[2][sample]
      ]);
    }
  }

  bufferedData(channelIndex, buffer, samples, address) {
    if (channelIndex >= buffer.length) { return; }

    samples.forEach(sample => {
      buffer[channelIndex].push(sample);
    });

    if (buffer.every(channel => channel.length > 0)) {
      const minLength = Math.min(...buffer.map(channel => channel.length));
      
      for (let i = 0; i < minLength; i++) {
        const tuple = buffer.map(channel => channel.shift());
        this.sendOSCMessage(address, tuple);
      }
    }
  }

  eegData(channelIndex, event) {
    const samples = this.eventEEGData(event).map(function (x) {
      return (x - 0x800) / 2048;
    });
    
    // for (let i = 0; i < 12; i++) {
    //   setTimeout(this.sendOSCMessage.bind(this, `/muse/eeg_i${channelIndex+1}`, [samples[i]]),
    //              Math.round(i * 12000 / 256));
    // }
    this.bufferedData(channelIndex, this.eegBuffer,
                      samples, '/muse/eeg');
  }

  ppgData(channelIndex, event) {
    const samples = this.eventPPGData(event)
    
    // for (let i = 0; i < 6; i++) {
    //   setTimeout(this.sendOSCMessage.bind(this, `/muse/ppg_i${channelIndex+1}`, [samples[i]]),
    //              Math.round(i * 6000 / 64));
    // }
    this.bufferedData(channelIndex, this.ppgBuffer,
                      this.eventPPGData(event), '/muse/ppg');
  }

  disconnected() {
    this.sendOSCMessage('/muse/status', ['disconnected']);
    if (this.osc) {
      try {
        this.osc.close();
      } catch (error) {
        console.error('Error closing OSC connection:', error);
      }
    }
  }

  disconnect() {
    super.disconnect();
    if (this.osc) {
      try {
        this.osc.close();
      } catch (error) {
        console.error('Error closing OSC connection:', error);
      }
    }
  }
}