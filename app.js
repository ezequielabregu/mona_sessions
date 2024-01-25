let audioPlayer;
let isPlaying = false;
let waveformCanvas1, waveformCanvas2;
let canvasContext1, canvasContext2;

document.addEventListener('DOMContentLoaded', () => {
    audioPlayer = new AudioPlayer();
    waveformCanvas1 = document.getElementById('waveformCanvas1');
    canvasContext1 = waveformCanvas1.getContext('2d');

    waveformCanvas2 = document.getElementById('waveformCanvas2');
    canvasContext2 = waveformCanvas2.getContext('2d');

    document.getElementById('playButton').addEventListener('click', () => {
        if (!isPlaying) {
            audioPlayer.play();
            isPlaying = true;
            visualizeAudio();
        }
    });

    document.getElementById('stopButton').addEventListener('click', () => {
        if (isPlaying) {
            audioPlayer.stop();
            isPlaying = false;
            clearCanvas();
        }
    });

    function visualizeAudio() {
        const analyser1 = createAnalyser(audioPlayer.currentAudio1);
        const analyser2 = createAnalyser(audioPlayer.currentAudio2);

        const bufferLength1 = analyser1.frequencyBinCount;
        const bufferLength2 = analyser2.frequencyBinCount;
        const dataArray1 = new Uint8Array(bufferLength1);
        const dataArray2 = new Uint8Array(bufferLength2);

        function draw() {
            canvasContext1.clearRect(0, 0, waveformCanvas1.width, waveformCanvas1.height);
            canvasContext2.clearRect(0, 0, waveformCanvas2.width, waveformCanvas2.height);

            drawWaveform(canvasContext1, analyser1, bufferLength1, dataArray1, 1);
            drawWaveform(canvasContext2, analyser2, bufferLength2, dataArray2, -1);

            requestAnimationFrame(draw);
        }

        draw();
    }

    function drawWaveform(context, analyser, bufferLength, dataArray, scaleY) {
        context.fillStyle = 'white';
        context.beginPath();

        analyser.getByteTimeDomainData(dataArray);

        // Normalize the waveform data
        const normalizedData = Array.from(dataArray, value => (value - 128) / 128.0);

        // Set the line width
        context.lineWidth = 7; // Adjust this value to make the line thicker or thinner

        for (let i = 0; i < bufferLength; i++) {
            const x = i / bufferLength * context.canvas.width;
            const y = normalizedData[i] * context.canvas.height / 2;

            context.lineTo(x, context.canvas.height / 2 + scaleY * y);
        }

        context.stroke();
    }

    function createAnalyser(audio) {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaElementSource(audio);

        source.connect(analyser);
        analyser.connect(audioContext.destination);

        analyser.fftSize = 2048;

        return analyser;
    }

    function clearCanvas() {
        canvasContext1.clearRect(0, 0, waveformCanvas1.width, waveformCanvas1.height);
        canvasContext2.clearRect(0, 0, waveformCanvas2.width, waveformCanvas2.height);
    }
});

class AudioPlayer {
    constructor() {
        this.folder1 = 'audio/eze';
        this.folder2 = 'audio/gus';
        this.audioList1 = [];
        this.audioList2 = [];
        this.currentAudio1 = null;
        this.currentAudio2 = null;

        this.loadAudioList(this.folder1, this.audioList1);
        this.loadAudioList(this.folder2, this.audioList2);
    }

    loadAudioList(folder, audioList) {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', `${folder}/audioList.json`, false);
        xhr.send();

        if (xhr.status === 200) {
            const data = JSON.parse(xhr.responseText);
            audioList.push(...data.files.map(file => `${folder}/${file}`));
        }
    }

    play() {
        const playNextAudio = (folder, audioList, audioElement) => {
            const randomIndex = Math.floor(Math.random() * audioList.length);
            audioElement.src = audioList[randomIndex];
            audioElement.play();
        };

        this.currentAudio1 = new Audio();
        this.currentAudio2 = new Audio();

        this.currentAudio1.addEventListener('ended', () => {
            playNextAudio(this.folder1, this.audioList1, this.currentAudio1);
        });

        this.currentAudio2.addEventListener('ended', () => {
            playNextAudio(this.folder2, this.audioList2, this.currentAudio2);
        });

        playNextAudio(this.folder1, this.audioList1, this.currentAudio1);
        playNextAudio(this.folder2, this.audioList2, this.currentAudio2);
    }

    stop() {
        if (this.currentAudio1) {
            this.currentAudio1.pause();
            this.currentAudio1.currentTime = 0;
        }

        if (this.currentAudio2) {
            this.currentAudio2.pause();
            this.currentAudio2.currentTime = 0;
        }
    }
}
