# Multi Muse ML
Analyze multiple Muse headbands using [Jason Snell's ML model](https://github.com/jasonjsnell/Muse-ML-MIDI), powered by [web-muse](https://github.com/itayinbarr/web-muse).

## OSC Data Specification

Wherever possible, this is compatible with the [Mind Monitor](https://mind-monitor.com/FAQ.php) specification.

| Item               | OSC Path                        | Values    | Description                        | Data Rate                           |
|--------------------|---------------------------------|-----------|------------------------------------|-------------------------------------|
| **Raw EEG**        | `/muse/eeg`                     | `f f f f` | TP9, AF7, AF8, TP10                | 256Hz (in packets of 12 at 21.33Hz) |
| **Delta Absolute** | `/muse/elements/delta_absolute` | `f`       | Average delta wave power (1-3Hz)   | 21.33Hz                             |
| **Theta Absolute** | `/muse/elements/theta_absolute` | `f`       | Average theta wave power (4-7Hz)   | 21.33Hz                             |
| **Alpha Absolute** | `/muse/elements/alpha_absolute` | `f`       | Average alpha wave power (8-12Hz)  | 21.33Hz                             |
| **Beta Absolute**  | `/muse/elements/beta_absolute`  | `f`       | Average beta wave power (13-30Hz)  | 21.33Hz                             |
| **Gamma Absolute** | `/muse/elements/gamma_absolute` | `f`       | Average gamma wave power (31-40Hz) | 21.33Hz                             |
| **Full Spectrum**  | `/muse/elements/spectrum`       | `f[48]`   | Full frequency spectrum (0-47Hz)   | 21.33Hz                             |
| **ML: Noise**      | `/muse/elements/noise`          | `f`       | Probability of state: noise        | 21.33Hz                             |
| **ML: Muscle**     | `/muse/elements/muscle`         | `f`       | Probability of state: muscle       | 21.33Hz                             |
| **ML: Focus**      | `/muse/elements/focus`          | `f`       | Probability of state: focus        | 21.33Hz                             |
| **ML: Clear**      | `/muse/elements/clear`          | `f`       | Probability of state: clear        | 21.33Hz                             |
| **ML: Meditation** | `/muse/elements/meditation`     | `f`       | Probability of state: meditation   | 21.33Hz                             |
| **ML: Dream**      | `/muse/elements/dream`          | `f`       | Probability of state: dream        | 21.33Hz                             |
| **PPG**            | `/muse/ppg`                     | `f f f`   | PPG1, PPG2, PPG3 channels          | 64Hz (in packets of 6 at 10.67Hz)   |
| **Heart Beat**     | `/muse/heartbeat`               | `i`       | Heartbeat detection                | 10.67Hz                             |
| **BPM**            | `/muse/bpm`                     | `f`       | Heart rate (beats per minute)      | 10.67Hz                             |
| **Battery Level**  | `/muse/batt`                    | `f`       | Battery percentage                 | 0.1Hz                               |
| **Accelerometer**  | `/muse/acc`                     | `f f f`   | X, Y, Z acceleration               | 52Hz (in packets of 3 at 17.33Hz)   |
| **Gyroscope**      | `/muse/gyro`                    | `f f f`   | X, Y, Z rotation                   | 52Hz (in packets of 3 at 17.33Hz)   |
