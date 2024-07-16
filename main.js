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
          const pitch = getPitch(dataArray);
          console.log(pitch.toString() + " Hz")
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

      // Function for pitch detection
      function getPitch(array) {
        let maxIndex = 0;
        let max = array[0];
        for (let i = 1; i < array.length; i++) {
            if (array[i] > max) {
                max = array[i];
                maxIndex = i;
            }
        }
        let frequencyResolution = audioContext.sampleRate / analyser.fftSize
        let pitch = maxIndex * frequencyResolution;
        return pitch;
      }

  } catch (error) {
      console.error('Error accessing microphone:', error);
  }
});
