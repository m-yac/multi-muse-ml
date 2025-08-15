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

## TouchDesigner Integration

To integrate with TouchDesigner, first make a **Web Server DAT** on **Port 8080** with the following for its callback:
```python
import socket

OSC_HOST = '127.0.0.1'
OSC_PORT = 9000

def onWebSocketReceiveBinary(webServerDAT, client, data):
	try:
		sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
		sock.sendto(bytes(data), (OSC_HOST, OSC_PORT))
		sock.close()
		# print(f"Forwarded {len(osc_data)} bytes of OSC data to {OSC_HOST}:{OSC_PORT}")
	except Exception as e:
		print(f"Error forwarding OSC data: {e}")
	return

def onHTTPRequest(webServerDAT, request, response):
	response['statusCode'] = 200 # OK
	response['statusReason'] = 'OK'
	response['data'] = '<b>TouchDesigner: </b>' + webServerDAT.name
	return response

def onWebSocketReceivePing(webServerDAT, client, data):
	webServerDAT.webSocketSendPong(client, data=data);
	return
```
If this Web Server DAT is **Active** when the headband is connected,
then the OSC data will be available via **UDP** on **Port 9000** (or whatever was set for `OSC_PORT`).
This data can then be received using an **OSC In CHOP** in the usual way.
