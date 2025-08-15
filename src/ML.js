import ml5 from 'ml5';

const MODEL_DIR = "Muse-ML-MIDI/model";

// ===========================================
//  Source: Muse-ML-MIDI/muse/utils-json.js
// ===========================================

//utils for json files

// Function to fetch a JSON file and parse its content
export const fetchAndParseJSON = async (filePath) => {
    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`Error fetching ${filePath}: ${response.status} ${response.statusText}`);
        }
        const jsonData = await response.json();
        return jsonData.data || []; // Return the "data" array or an empty array
    } catch (error) {
        console.error(error);
        return [];
    }
};

// Function to load and combine multiple JSON files
//add callback function to this

export function loadAndCombineJSONFiles(jsonFilePaths, callback) {

    // Array to hold all the fetch promises
    const jsonFetchPromises = jsonFilePaths.map(filePath => fetchAndParseJSON(filePath));

    // Wait for all promises to resolve using Promise.all
    Promise.all(jsonFetchPromises)
        .then(dataArrays => {

            // Combine the arrays from all "data" objects into a single array
            const combinedDataArray = [].concat(...dataArrays);

            // Create the final combined JSON object
            const _combinedJSON = { data: combinedDataArray };

            //call the callback function with the combinedJSON
            callback(_combinedJSON);

        })
        .catch(error => console.error('Error loading or combining JSON files:', error));

}

// ===========================================
//  Adapted from: Muse-ML-MIDI/muse/museML.js
// ===========================================

//how many data points are in the JSON?
//hz bins
//cut off everything above 50 to avoid 50 hz wall outlet noise in EU
const INPUTS_TOTAL = 48;

//how many outputted classifications are in the JSON?
const brainwaveDataSets = [
  "JSON-data/c-clear-mind.json",
  "JSON-data/d-dream-theta.json",
  "JSON-data/e-eye-movement.json",
  "JSON-data/f-resting-focus.json",
  "JSON-data/b-blink.json",
  "JSON-data/j-jaw-clench.json",
  "JSON-data/l-loose-connection.json",
  "JSON-data/m-muscle-tension.json",
  "JSON-data/n-noise-disconnection.json",
  "JSON-data/o-overstimulation.json",
];

//how many times does the model get analyzed?
//this can be reduced to the number where the loss drops and stays low in the Training Performance chart (which is visible when debug is TRUE)
const EPOCHS = 105;

//classification (specific outputs with %)
//or regression (a percentage fade between specific points)
const MODEL_TYPE = "classification"; //or "regression"

export class ML {
    constructor() {
        this.neuralNetwork = null;
        this.initializeML();
    }

    async initializeML() {
        try {
            // Wait for ml5 to be ready (which includes TensorFlow initialization)
            await ml5.tf.ready();
            
            // Try to set a more compatible backend (webgl is more widely supported)
            try {
                await ml5.tf.setBackend('webgl');
            } catch (e) {
                console.warn('WebGL backend not available, falling back to CPU');
                await ml5.tf.setBackend('cpu');
            }
            
            //setup NN
            let options = {
              inputs: INPUTS_TOTAL,
              outputs: brainwaveDataSets.length,
              task: MODEL_TYPE,
              debug: true,
            };
            this.neuralNetwork = ml5.neuralNetwork(options);

            //note: only run loadAndCombineJSONFiles or loadTrainingModel
            //running back at the same time can produce an error if there are differences between them

            //TO TRAIN MODEL
            //load in data that has already been recorded
            //do this if you want to add more data to the existing data
            // loadAndCombineJSONFiles(
            //   brainwaveDataSets,
            //   combinedJSONFilesLoaded
            // );

            //or

            //TO ANALYZE LIVE DATA FROM TRAINED MODEL
            //load this when testing live data against the ML model
            this.loadTrainingModel();

        } catch (error) {
            console.error('Failed to initialize ML:', error);
        }
    }

    //LOAD JSON DATA OF MENTAL STATES
    combinedJSONFilesLoaded(combinedJSON) {
      // Use the combinedJSON variable for further processing
      console.log("Combined JSON data loaded:", combinedJSON.data);

      //loop through loaded JSON and add inputs and outputs
      for (const item of combinedJSON.data) {
        this.neuralNetwork.addData(item.xs, item.ys);
      }

      //when you want to create a train model...
      this.trainModel();
    }

    //TRAINS NN ON JSON DATA (TRAINING)
    trainModel() {
      console.log("start training model");
    
      //convert all data to be between 0.0 and 1.0
      this.neuralNetwork.normalizeData();
    
      //train the neural network
      this.neuralNetwork.train(
        {
          epochs: EPOCHS,
        },
        this.trainingComplete.bind(this)
      );
    }
    
    trainingComplete() {
      console.log("training complete");
    
      //when happy with loss value
      //and num of epochs tests
      //and ready to download model
      this.neuralNetwork.save();
    }
    
    //MODEL TO CLASSIFY INCOMING EEG DATA (POST TRAINING)
    loadTrainingModel() {
      const modelInfo = {
        model: `${MODEL_DIR}/model.json`,
        metadata: `${MODEL_DIR}/model_meta.json`,
        weights: `${MODEL_DIR}/model.weights.bin`,
      };
    
      this.neuralNetwork.load(modelInfo, this.trainingModelLoaded.bind(this));
    }
    
    trainingModelLoaded() {
      console.log("Training model is loaded");
    
      //start interval for how frequent the live EEG data is examined
      //setInterval(classifyLiveEEG, 50);
    }
    
    classifyLiveEEG(eeg, state) {
      //only classify if live data is coming from the headset
      if (eeg.eegSpectrum[0] > 0) {
        let hzBins = eeg.eegSpectrum.slice(0, 48);
        this.neuralNetwork.classify(hzBins, this.stateDetected.bind(this, eeg, state));
      }
    }
    
    stateDetected(eeg, state, results) {
        //noise values
        let _noise = 0;
        let _loose = 0;
        let _muscle = 0;
        let _jaw = 0;
        let _blink = 0;
    
        //both noise and focus
        let _eye = 0;
    
        //brain states
        let _clear = 0;
        let _focus = 0;
        let _dream = 0;
    
        //loop through results
        for (let i = 0; i < results.length; i++) {
          let result = results[i];
          let label = result.label;
          let confidence = result.confidence;//.toFixed(4);
    
          //populate vars if they have signifant value
    
          switch (label) {
            case "n":
              _noise = confidence;
              break;
            case "l":
              _loose = confidence;
              break;
            case "m":
              _muscle = confidence;
              break;
            case "b":
              _blink = confidence;
              break;
            case "e":
              _eye = confidence;
              break;
            case "j":
              _jaw = confidence;
              break;
            case "f":
              _focus = confidence;
              break;
            case "c":
              _clear = confidence;
              break;
            case "d":
              _dream = confidence;
              break;
            default:
            //console.log(`Unknown ${label}.`);
          }
        }
    
        //concat some values
    
        //noise
        if (_noise < _loose) {
          _noise = _loose;
        }
        state.noise = _noise;
    
        //muscle tension
        if (_muscle < _jaw) {
          _muscle = _jaw;
        }
        if (_muscle < _blink) {
          _muscle = _blink;
        }
    
        state.muscle = _muscle;
    
        if (_focus < _eye) {
          _focus = _eye;
        }
    
        state.focus = _focus;
        state.clear = _clear;
        state.dream = _dream;
    
        //calculate alpha if there is low noise, low muscle, and low focus
    
        
        //init as 0
        state.meditation = 0.0;
        
        if (state.noise < 0.1 && state.muscle < 0.1 && state.focus < 0.5) {
          
          //if state is somewhat in clear or dream...
          //if (state.clear > 0.5 || state.dream > 0.5) {
            
            //calc alpha
            //sum all
            let eegSum = eeg.delta + eeg.theta + eeg.alpha + eeg.beta + eeg.gamma;
            state.meditation = eeg.alpha / eegSum;
    
            if (state.meditation < 0.0) {
              state.meditation = 0.0;
            } else if (state.meditation > 1.0) {
              state.meditation = 1.0
            } 
          //}
        }
    
      //print results
      /*if (error) {
            console.log("stateDetected error:", error);
            return;
        } else {
            //minimum confidence
            const minConf = 0.3;

            let topResult = results[0];
            let label = topResult.label;
            let confidence = topResult.confidence.toFixed(4);
    
            //check for noise states first
            //noise, loose, muscle tension, jaw clench, blink
            if (label == "n" && confidence > minConf) {
                console.log("X X X X noise:", confidence);
            } else if (label == "l" && confidence > minConf) {
                console.log("X X X X loose:", confidence);
            } else if (label == "m" || label == "b") {
                if (confidence > minConf) {
                    console.log("X X X X muscle tension:", confidence);
                }
            } else if (label == "j" && confidence > minConf) {
                console.log("X X X X jaw clench:", confidence);
            } else if (label == "e") {
                console.log("X X X X eye movement:", confidence);
            } else {
                //if the headset is one and the noise states are not detected
                //these are the mental states
                // console.log(" ")
    
                if (
                    eeg.alpha > eeg.delta &&
                    eeg.alpha > eeg.theta &&
                    eeg.alpha > eeg.beta &&
                    eeg.alpha > eeg.gamma
                ) {
                    console.log("/ / / / alpha:", eeg.alpha);
                } else if (label == "f" && confidence > minConf) {
                    console.log("+ + + + resting focus:", confidence)
                } else if (label == "c" && confidence > minConf) {
                    console.log("* * * * clear:", confidence)
                } else if (label == "t") {
                    console.log("~ ~ ~ ~ theta:", confidence);
                } else if (label == "o" && confidence > minConf) {
                    console.log("/ / / / overstimulation:", confidence)
                } else {
                    let printStr = ""
                    for (const result of results) {
                        printStr += result.label + " ";
                    }
                    console.log(printStr)
                }
            }
        }*/
    }
    
    //KEY COMMANDS
    //used to trigger a snapshot for the JSON data
    keyPressed() {
      if (key == "S") {
        this.neuralNetwork.saveData();
      } else {
        let hzBins = eegSpectrum.slice(0, 48);
    
        let target = [key];
        console.log("Store EEG for", key);
    
        this.neuralNetwork.addData(hzBins, target);
      }
    }
}