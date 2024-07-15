document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Request microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        // Create a new AudioContext
        const audioContext = new AudioContext();

        // Create a MediaStreamSource from the stream
        const mediaStreamSource = audioContext.createMediaStreamSource(stream);

        // Create an AnalyserNode
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048; // Set the FFT size to control the frequency resolution

        // Connect the mediaStreamSource to the analyser
        mediaStreamSource.connect(analyser);

        // Create a buffer to store the frequency data
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        // Function to update the data
        const updateData = () => {
            analyser.getByteFrequencyData(dataArray);
            
            // Perform pitch detection
            const pitch = autoCorrelate(dataArray, audioContext.sampleRate);
            console.log('Detected pitch:', pitch);
        };

        // Start updating the data every 100ms
        setInterval(updateData, 100);

        // Setup MediaRecorder to record audio
        const mediaRecorder = new MediaRecorder(stream);
        const audioChunks = [];
        mediaRecorder.ondataavailable = event => {
            audioChunks.push(event.data);
        };

        // Start recording
        mediaRecorder.start();

        // Function to perform auto-correlation pitch detection
        function autoCorrelate(buf, sampleRate) {
            const SIZE = buf.length;
            const MAX_SAMPLES = Math.floor(SIZE / 2);
            const MIN_SAMPLES = 0;
            
            let bestOffset = -1;
            let bestCorrelation = 0;
            let rms = 0;
            let foundGoodCorrelation = false;
            const correlations = new Array(MAX_SAMPLES);

            for (let i = 0; i < SIZE; i++) {
                let val = (buf[i] - 128) / 128;
                rms += val * val;
            }
            rms = Math.sqrt(rms / SIZE);

            if (rms < 0.01) {
                // not enough signal
                return -1;
            }

            let lastCorrelation = 1;
            for (let offset = MIN_SAMPLES; offset < MAX_SAMPLES; offset++) {
                let correlation = 0;

                for (let i = 0; i < MAX_SAMPLES; i++) {
                    correlation += Math.abs((buf[i] - 128) / 128 - (buf[i + offset] - 128) / 128);
                }
                correlation = 1 - correlation / MAX_SAMPLES;
                correlations[offset] = correlation; // store it, for the tweaking we need to do below.
                if ((correlation > 0.9) && (correlation > lastCorrelation)) {
                    foundGoodCorrelation = true;
                    if (correlation > bestCorrelation) {
                        bestCorrelation = correlation;
                        bestOffset = offset;
                    }
                } else if (foundGoodCorrelation) {
                    // short-circuit - we found a good correlation, then a bad one, so we'd better output the best we have
                    let shift = (correlations[bestOffset + 1] - correlations[bestOffset - 1]) / correlations[bestOffset];
                    return sampleRate / (bestOffset + (8 * shift));
                }
                lastCorrelation = correlation;
            }
            if (bestCorrelation > 0.01) {
                // console.log('f = ' + sampleRate/bestOffset + 'Hz (rms: ' + rms + ' confidence: ' + bestCorrelation + ')')
                return sampleRate / bestOffset;
            }
            return -1;
        }

    } catch (error) {
        console.error('Error accessing microphone:', error);
    }
});
