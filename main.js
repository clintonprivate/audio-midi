document.addEventListener('DOMContentLoaded', async () => {
    // Check for the availability of media devices
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('Media Devices API not supported.');
        return;
    }

    try {
        // Request microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        const audioChunks = [];

        mediaRecorder.ondataavailable = event => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = document.getElementById('audioPlayback');
            audio.src = audioUrl;
        };

        // Start recording
        mediaRecorder.start();

        // Stop recording after a fixed duration (e.g., 10 seconds)
        setTimeout(() => {
            mediaRecorder.stop();
        }, 10000); // 10 seconds

    } catch (error) {
        console.error('Error accessing microphone:', error);
    }
});
