import { MLMuse, BUFFER_SIZE } from './MLMuse.js';
import { ML } from './ML.js';
import Chart from 'chart.js/auto';

// Global variables for charts and data tracking
let eegChart = null;
let ppg1Chart = null;
let ppg2Chart = null;
let ppg3Chart = null;
let accelChart = null;
let gyroChart = null;
let muse = null;

const maxDataPoints = BUFFER_SIZE; // Use BUFFER_SIZE from MLMuse

// Configuration flags
const enablePPGFiltering = false; // Set to false to disable PPG high-pass filtering

// Data index counters for each chart type and channel
let dataIndexCounters = {
    eeg: [0, 0, 0, 0],
    ppg1: [0],
    ppg2: [0],
    ppg3: [0],
    accel: [0, 0, 0],
    gyro: [0, 0, 0]
};

// Track last update times for each data type
let lastUpdateTimes = { eeg: null, ppg: null, accel: null, gyro: null };

// High-pass filter state for PPG data (one filter per channel)
let ppgFilterState = [
    { prevInput: 0, prevOutput: 0 },
    { prevInput: 0, prevOutput: 0 },
    { prevInput: 0, prevOutput: 0 }
];

const eegChannelColors = [
    'rgb(255, 99, 132)',   // Red - TP9
    'rgb(54, 162, 235)',   // Blue - AF7
    'rgb(255, 205, 86)',   // Yellow - AF8
    'rgb(75, 192, 192)'    // Green - TP10
];
const ppgChannelColors = [
    'rgb(255, 0, 0)',      // Red
    'rgb(0, 255, 0)',      // Green
    'rgb(0, 0, 255)'       // Blue
];
const accelColors = [
    'rgb(255, 99, 132)',   // Red - X
    'rgb(54, 162, 235)',   // Blue - Y
    'rgb(75, 192, 192)'    // Green - Z
];
const gyroColors = [
    'rgb(255, 159, 64)',   // Orange - X
    'rgb(199, 199, 199)',  // Grey - Y
    'rgb(83, 102, 255)'    // Blue - Z
];

const statusBox = document.getElementById('statusBox');
const connectButton = document.getElementById('connectButton');
const disconnectButton = document.getElementById('disconnectButton');

function initCharts() {
    initEEGChart();
    initPPG1Chart();
    initPPG2Chart();
    initPPG3Chart();
    initAccelChart();
    initGyroChart();
}

function initEEGChart() {
    const ctx = document.getElementById('eegChart').getContext('2d');
    const eegLabels = ['TP9', 'AF7', 'AF8', 'TP10'];

    eegChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: eegLabels.map((label, index) => ({
                label: label,
                data: [],
                borderColor: eegChannelColors[index],
                backgroundColor: eegChannelColors[index] + '20',
                tension: 0.1,
                pointRadius: 0
            }))
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    type: 'linear',
                    title: {
                        display: true,
                        text: 'Sample Index'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Amplitude (µV)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: true
                },
                title: {
                    display: true,
                    text: 'Real-time EEG Data'
                }
            },
            animation: false
        }
    });
}

function initPPG1Chart() {
    const ctx = document.getElementById('ppg1Chart').getContext('2d');

    ppg1Chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'PPG1',
                data: [],
                borderColor: 'rgb(255, 0, 0)',
                backgroundColor: 'rgb(255, 0, 0, 0.2)',
                tension: 0.1,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    type: 'linear',
                    display: true
                },
                y: {
                    display: true
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: false
                }
            },
            animation: false
        }
    });
}

function initPPG2Chart() {
    const ctx = document.getElementById('ppg2Chart').getContext('2d');

    ppg2Chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'PPG2',
                data: [],
                borderColor: 'rgb(0, 255, 0)',
                backgroundColor: 'rgb(0, 255, 0, 0.2)',
                tension: 0.1,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    type: 'linear',
                    display: true
                },
                y: {
                    display: true
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: false
                }
            },
            animation: false
        }
    });
}

function initPPG3Chart() {
    const ctx = document.getElementById('ppg3Chart').getContext('2d');

    ppg3Chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'PPG3',
                data: [],
                borderColor: 'rgb(0, 0, 255)',
                backgroundColor: 'rgb(0, 0, 255, 0.2)',
                tension: 0.1,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    type: 'linear',
                    display: true
                },
                y: {
                    display: true
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: false
                }
            },
            animation: false
        }
    });
}

function initAccelChart() {
    const ctx = document.getElementById('accelChart').getContext('2d');
    const accelLabels = ['X', 'Y', 'Z'];

    accelChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: accelLabels.map((label, index) => ({
                label: label,
                data: [],
                borderColor: accelColors[index],
                backgroundColor: accelColors[index] + '20',
                tension: 0.1,
                pointRadius: 0
            }))
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    type: 'linear',
                    title: {
                        display: true,
                        text: 'Sample Index'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Acceleration (g)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: true
                },
                title: {
                    display: true,
                    text: 'Real-time Accelerometer Data'
                }
            },
            animation: false
        }
    });
}

function initGyroChart() {
    const ctx = document.getElementById('gyroChart').getContext('2d');
    const gyroLabels = ['X', 'Y', 'Z'];

    gyroChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: gyroLabels.map((label, index) => ({
                label: label,
                data: [],
                borderColor: gyroColors[index],
                backgroundColor: gyroColors[index] + '20',
                tension: 0.1,
                pointRadius: 0
            }))
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    type: 'linear',
                    title: {
                        display: true,
                        text: 'Sample Index'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Angular Velocity (°/s)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: true
                },
                title: {
                    display: true,
                    text: 'Real-time Gyroscope Data'
                }
            },
            animation: false
        }
    });
}

// High-pass filter function (simple first-order IIR filter)
// Cutoff frequency around 0.5 Hz to remove DC offset
function highPassFilter(input, filterState, alpha = 0.995) {
    const output = alpha * (filterState.prevOutput + input - filterState.prevInput);
    filterState.prevInput = input;
    filterState.prevOutput = output;
    return output;
}

// Apply high-pass filter to PPG data
function filterPPGData(ppgData) {
    return ppgData.map((channelData, channelIndex) => {
        if (!channelData || channelData.length === 0) return channelData;

        return channelData.map(value => {
            if (value !== null && value !== undefined) {
                return highPassFilter(value, ppgFilterState[channelIndex]);
            }
            return value;
        });
    });
}

function updateChartsWithBufferedData(eegData, ppgData, accelData, gyroData) {
    // Apply high-pass filter to PPG data to remove DC offset (if enabled)
    const processedPPGData = enablePPGFiltering ? filterPPGData(ppgData) : ppgData;

    // Only use first 4 EEG channels (exclude AUX)
    const eegDataWithoutAux = eegData.slice(0, 4);

    updateBufferedChart(eegChart, eegDataWithoutAux, 'eeg');

    // Update individual PPG charts
    if (processedPPGData[0]) updateBufferedChart(ppg1Chart, [processedPPGData[0]], 'ppg1');
    if (processedPPGData[1]) updateBufferedChart(ppg2Chart, [processedPPGData[1]], 'ppg2');
    if (processedPPGData[2]) updateBufferedChart(ppg3Chart, [processedPPGData[2]], 'ppg3');

    updateBufferedChart(accelChart, accelData, 'accel');
    updateBufferedChart(gyroChart, gyroData, 'gyro');
}


function updateBufferedChart(chart, data, chartType) {
    if (!chart) return;

    // Replace chart data with buffered data for better synchronization
    data.forEach((channelData, channelIndex) => {
        if (channelData && channelData.length > 0 && chart.data.datasets[channelIndex]) {
            const dataset = chart.data.datasets[channelIndex];
            
            // Clear existing data and replace with buffered data
            dataset.data = [];
            
            // Add buffered data points with proper indexing (newest first in LIFO buffer)
            channelData.forEach((value, dataIndex) => {
                if (value !== null && value !== undefined) {
                    // Since buffer is LIFO, reverse the index for proper time ordering
                    const timeIndex = channelData.length - 1 - dataIndex;
                    dataset.data.push({
                        x: timeIndex,
                        y: value
                    });
                }
            });
            
            // Sort data by x value to ensure proper ordering
            dataset.data.sort((a, b) => a.x - b.x);
        }
    });

    // Update x-axis to show the full buffer range
    if (chart.data.datasets[0] && chart.data.datasets[0].data.length > 0) {
        chart.options.scales.x.min = 0;
        chart.options.scales.x.max = maxDataPoints - 1;
    }

    chart.update('none'); // No animation for real-time updates
}

// Keep the old function for backwards compatibility if needed
function updateArrayChart(chart, data, chartType) {
    updateBufferedChart(chart, data, chartType);
}

async function handleConnect() {
    try {
        connectButton.disabled = true;
        console.log('Connecting to Muse...');

        // Create ML instance and MLMuse instance
        const ml = new ML();
        muse = new MLMuse(ml);
        
        // Connect to the muse
        await muse.connect();

        connectButton.disabled = true;
        disconnectButton.disabled = false;
        console.log('Connected to Muse');

        // Charts are already initialized on page load

        // Start reading data continuously
        startDataCollection();

    } catch (error) {
        console.error('Connection failed:', error);
        connectButton.disabled = false;
    }
}

function startDataCollection() {
    // Update charts at 30Hz for smooth visualization
    const readInterval = setInterval(() => {
        if (!muse || muse.state !== 2) { // Check if still connected
            clearInterval(readInterval);
            return;
        }

        try {
            // Get buffered data from MLMuse (last 256 samples)
            const eegData = muse.eegBuffers;
            const ppgData = muse.ppgBuffers;
            const accelData = muse.accelerometerBuffers;
            const gyroData = muse.gyroscopeBuffers;

            // Update charts with buffered data for better synchronization
            updateChartsWithBufferedData(eegData, ppgData, accelData, gyroData);

            // Update status display
            updateStatus();

        } catch (error) {
            console.error('Error reading data:', error);
        }
    }, 1000 / 30); // 30Hz update rate for smooth visualization
}

function updateStatus() {
    const d = new Date();

    // Update last update times for each data type
    lastUpdateTimes.eeg = d.toLocaleTimeString() + ` (${String(d.getMilliseconds()).padStart(3,'0')}ms)`;
    lastUpdateTimes.ppg = d.toLocaleTimeString() + ` (${String(d.getMilliseconds()).padStart(3,'0')}ms)`;
    lastUpdateTimes.accel = d.toLocaleTimeString() + ` (${String(d.getMilliseconds()).padStart(3,'0')}ms)`;
    lastUpdateTimes.gyro = d.toLocaleTimeString() + ` (${String(d.getMilliseconds()).padStart(3,'0')}ms)`;

    // Update status display
    statusBox.innerHTML = `
        <strong>Status:</strong> Connected<br>
        <strong>Battery:</strong> ${muse?.batteryLevel || 'Unknown'}%<br>
        <strong>EEG Last Update:</strong> ${lastUpdateTimes.eeg || 'No data'}<br>
        <strong>PPG Last Update:</strong> ${lastUpdateTimes.ppg || 'No data'}<br>
        <strong>Accel Last Update:</strong> ${lastUpdateTimes.accel || 'No data'}<br>
        <strong>Gyro Last Update:</strong> ${lastUpdateTimes.gyro || 'No data'}<br>
    `;
}

function disconnect() {
    // Disconnect from muse device
    if (muse) {
        try {
            muse.disconnect();
        } catch (error) {
            console.error('Error disconnecting:', error);
        }
        muse = null;
    }

    connectButton.disabled = false;
    disconnectButton.disabled = true;
    console.log('Disconnected');

    // Update status display
    statusBox.innerHTML = '<strong>Status:</strong> Disconnected';

    // Reset last update times
    lastUpdateTimes = { eeg: null, ppg: null, accel: null, gyro: null };

    // Clear all chart data and reset counters
    [eegChart, ppg1Chart, ppg2Chart, ppg3Chart, accelChart, gyroChart].forEach(chart => {
        if (chart) {
            chart.data.datasets.forEach(dataset => {
                dataset.data = [];
            });
            chart.update();
        }
    });

    // Reset data index counters
    dataIndexCounters = {
        eeg: [0, 0, 0, 0],
        ppg1: [0],
        ppg2: [0],
        ppg3: [0],
        accel: [0, 0, 0],
        gyro: [0, 0, 0]
    };
}

// Event listeners
connectButton.addEventListener('click', handleConnect);
disconnectButton.addEventListener('click', disconnect);

// Initialize status display
statusBox.innerHTML = '<strong>Status:</strong> Disconnected';

// Initialize charts on page load
initCharts();

// Check if Web Bluetooth is supported
if (!navigator.bluetooth) {
    statusBox.innerHTML = '<strong>Status:</strong> Bluetooth not supported in this browser!';
    connectButton.disabled = true;
}