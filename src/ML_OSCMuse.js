import { OSCMuse } from './OSCMuse.js';

const BUFFER_SIZE = 256;

export class ML_OSCMuse extends OSCMuse {
  constructor(options = {}) {
    super(options);
    
    this.eegSamples = [
      0, 0, 0, 0, 0
    ];
    this.eegMessages = [
      0, 0, 0, 0, 0
    ];
    this.eegBuffers = [
      [], // TP9
      [], // AF7
      [], // AF8
      [], // TP10
      []  // AUX
    ];
    
    this.accelerometerBuffers = [
      [], // X axis
      [], // Y axis
      []  // Z axis
    ];
    
    this.gyroscopeBuffers = [
      [], // X axis
      [], // Y axis
      []  // Z axis
    ];

    this.ppgSamples = [
      0, 0, 0
    ];
    this.ppgMessages = [
      0, 0, 0, 0, 0
    ];
    this.ppgBuffers = [
      [], // PPG1
      [], // PPG2
      []  // PPG3
    ];
    
    this.batteryBuffer = [];
  }

  addToBuffer(buffer, value) {
    buffer.unshift(value);
    if (buffer.length > BUFFER_SIZE) {
      buffer.length = BUFFER_SIZE;
    }
  }

  batteryData(event) {
    super.batteryData(event);
    const batteryLevel = this.eventBatteryData(event);
    this.addToBuffer(this.batteryBuffer, batteryLevel);
  }

  accelerometerData(event) {
    super.accelerometerData(event);
    const accelData = this.eventAccelerometerData(event);
    
    for (let sample = 0; sample < accelData[0].length; sample++) {
      this.addToBuffer(this.accelerometerBuffers[0], accelData[0][sample]);
      this.addToBuffer(this.accelerometerBuffers[1], accelData[1][sample]);
      this.addToBuffer(this.accelerometerBuffers[2], accelData[2][sample]);
    }
  }

  gyroscopeData(event) {
    super.gyroscopeData(event);
    const gyroData = this.eventGyroscopeData(event);
    
    for (let sample = 0; sample < gyroData[0].length; sample++) {
      this.addToBuffer(this.gyroscopeBuffers[0], gyroData[0][sample]);
      this.addToBuffer(this.gyroscopeBuffers[1], gyroData[1][sample]);
      this.addToBuffer(this.gyroscopeBuffers[2], gyroData[2][sample]);
    }
  }

  eegData(channelIndex, event) {
    super.eegData(channelIndex, event);
    let samples = this.eventEEGData(event);

    samples = samples.map(function (x) {
      return (x - 0x800) / 2048;
    });

    samples.forEach(sample => {
      this.eegSamples[channelIndex]++;
      this.addToBuffer(this.eegBuffers[channelIndex], sample);
    });
    this.eegMessages[channelIndex]++;

    if (channelIndex == 1) {
      if (!this.timestamp) { this.timestamp = new Date().getTime(); }
      const diff_s = (new Date().getTime() - this.timestamp) / 1000.0;
      console.log(this.eegSamples.map(s => s / diff_s), this.eegMessages.map(s => s / diff_s),
                  this.ppgSamples.map(s => s / diff_s), this.ppgMessages.map(s => s / diff_s));
    }
  }

  ppgData(channelIndex, event) {
    super.ppgData(channelIndex, event);
    const samples = this.eventPPGData(event);
    
    samples.forEach(sample => {
      this.ppgSamples[channelIndex]++;
      this.addToBuffer(this.ppgBuffers[channelIndex], sample);
    });
    this.ppgMessages[channelIndex]++;
  }

  getEEGBuffer(channelIndex) {
    return [...this.eegBuffers[channelIndex]];
  }

  getAccelerometerBuffer(axis) {
    return [...this.accelerometerBuffers[axis]];
  }

  getGyroscopeBuffer(axis) {
    return [...this.gyroscopeBuffers[axis]];
  }

  getPPGBuffer(channelIndex) {
    return [...this.ppgBuffers[channelIndex]];
  }

  getBatteryBuffer() {
    return [...this.batteryBuffer];
  }

  getAllEEGBuffers() {
    return this.eegBuffers.map(buffer => [...buffer]);
  }

  getAllAccelerometerBuffers() {
    return this.accelerometerBuffers.map(buffer => [...buffer]);
  }

  getAllGyroscopeBuffers() {
    return this.gyroscopeBuffers.map(buffer => [...buffer]);
  }

  getAllPPGBuffers() {
    return this.ppgBuffers.map(buffer => [...buffer]);
  }
}

export { BUFFER_SIZE };