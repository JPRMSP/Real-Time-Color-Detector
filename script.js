let videoElement = document.getElementById('videoElement');
let startButton = document.getElementById('startButton');
let stopButton = document.getElementById('stopButton');
let colorNameElement = document.getElementById('colorName');
let colorBar = document.getElementById('colorBar');
let colorGraph = document.getElementById('colorGraph');
let stream = null;
let currentMode = 'normal'; // Default mode is normal

// Start Camera
startButton.addEventListener('click', () => {
    if (stream) {
        return;
    }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then((mediaStream) => {
            stream = mediaStream;
            videoElement.srcObject = mediaStream;
            startButton.disabled = true;
            stopButton.disabled = false;
        })
        .catch((err) => {
            console.error("Error accessing camera: ", err);
        });
});

// Stop Camera
stopButton.addEventListener('click', () => {
    if (stream) {
        let tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
        videoElement.srcObject = null;
        startButton.disabled = false;
        stopButton.disabled = true;
    }
});

// Change Mode
document.getElementById('modeSelect').addEventListener('change', (event) => {
    currentMode = event.target.value;
    colorNameElement.innerText = 'None';
    colorBar.style.backgroundColor = '#f5f5f5'; // Reset color bar
    resetGraph();
});

// Detect Colors
function detectColor(imageData) {
    const data = imageData.data;
    let r = 0, g = 0, b = 0, count = 0;

    for (let i = 0; i < data.length; i += 4) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        count++;
    }

    r = Math.floor(r / count);
    g = Math.floor(g / count);
    b = Math.floor(b / count);

    let color = `rgb(${r}, ${g}, ${b})`;
    let colorName = getColorName(r, g, b);
    
    colorNameElement.innerText = `${colorName} color detected`;
    colorBar.style.backgroundColor = color;
    updateGraph(r, g, b);
    
    speakColor(colorName);
}

function getColorName(r, g, b) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    let color = "Unknown";

    if (diff < 10 && max > 200) {
        color = "White";
    } else if (diff < 10 && max < 50) {
        color = "Black";
    } else if (diff < 10) {
        color = "Gray";
    } else {
        const hue = Math.round((Math.atan2(Math.sqrt(3) * (g - b), 2 * r - g - b) * 180) / Math.PI);
        const correctedHue = (hue + 360) % 360; // Ensure hue is positive

        // Comprehensive color detection based on hue
        if (correctedHue >= 0 && correctedHue < 15) color = "Red";
        else if (correctedHue >= 15 && correctedHue < 45) color = "Orange";
        else if (correctedHue >= 45 && correctedHue < 75) color = "Yellow";
        else if (correctedHue >= 75 && correctedHue < 105) color = "Lime";
        else if (correctedHue >= 105 && correctedHue < 135) color = "Green";
        else if (correctedHue >= 135 && correctedHue < 165) color = "Turquoise";
        else if (correctedHue >= 165 && correctedHue < 195) color = "Cyan";
        else if (correctedHue >= 195 && correctedHue < 225) color = "Sky Blue";
        else if (correctedHue >= 225 && correctedHue < 255) color = "Blue";
        else if (correctedHue >= 255 && correctedHue < 285) color = "Purple";
        else if (correctedHue >= 285 && correctedHue < 315) color = "Magenta";
        else if (correctedHue >= 315 && correctedHue < 345) color = "Pink";
        else if (correctedHue >= 345 && correctedHue <= 360) color = "Red";
    }

    // Driving Mode: Only detect red, green, yellow
    if (currentMode === "driving") {
        if (r > 150 && g < 100 && b < 100) color = "Red";
        else if (g > 150 && r < 100 && b < 100) color = "Green";
        else if (r > 150 && g > 150 && b < 100) color = "Yellow";
        else color = "Unknown";
    }

    return color;
}

let lastSpokenColor = ""; // To prevent repeating the same color announcement

function speakColor(color) {
    if (color !== "Unknown" && color !== lastSpokenColor) { // Avoid announcing "Unknown" and prevent repetition
        const msg = new SpeechSynthesisUtterance(`${color} color detected`);
        window.speechSynthesis.speak(msg);
        lastSpokenColor = color; // Update last spoken color
    }
}

// Update Color Graph
function updateGraph(r, g, b) {
    document.getElementById('redBlock').style.backgroundColor = `rgb(${r}, 0, 0)`;
    document.getElementById('greenBlock').style.backgroundColor = `rgb(0, ${g}, 0)`;
    document.getElementById('blueBlock').style.backgroundColor = `rgb(0, 0, ${b})`;
}

// Reset Color Graph
function resetGraph() {
    document.getElementById('redBlock').style.backgroundColor = 'gray';
    document.getElementById('greenBlock').style.backgroundColor = 'gray';
    document.getElementById('blueBlock').style.backgroundColor = 'gray';
}

// Process Video Feed
function processVideo() {
    if (videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
        let canvas = document.createElement('canvas');
        let ctx = canvas.getContext('2d');
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        detectColor(imageData);
    }
    requestAnimationFrame(processVideo);
}

// Start processing video when camera starts
startButton.addEventListener('click', () => {
    requestAnimationFrame(processVideo);
});
