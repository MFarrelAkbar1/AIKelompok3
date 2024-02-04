// static/js/script.js
document.getElementById('uploadForm').onsubmit = function(event) {
    event.preventDefault();

    var formData = new FormData(this);
    fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        // Tampilkan hasil OCR di halaman
        document.getElementById('result').textContent = data.text; // Pastikan ini 'data.text'

        // Mainkan file audio jika ada
        if (data.audioPath) {
            var audioPlayer = document.getElementById('audioPlayer');
            // Asumsi bahwa file disimpan di '/static/output/'
            audioPlayer.src = '/static/output/' + data.audioPath.split('/').pop(); 
            audioPlayer.load(); // Penting untuk memuat ulang sumber audio
            audioPlayer.play().catch(error => {
                console.error('Playback failed:', error);
                // Tampilkan kontrol audio sehingga pengguna dapat memutar audio secara manual
                audioPlayer.controls = true;
            });
        }
    })
    .catch(error => console.error('Error:', error));
};

// Variabel global untuk menyimpan stream video
let videoStream;

// Fungsi untuk memulai kamera
function startCamera() {
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(function(stream) {
            videoStream = stream;
            var video = document.getElementById('video');
            video.srcObject = stream;
            video.play();
            document.getElementById('snap').style.display = 'block';
        })
        .catch(function(err) {
            console.log("An error occurred: " + err);
        });
}

// Fungsi untuk menghentikan kamera
function stopCamera() {
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
    }
    document.getElementById('video').pause();
    document.getElementById('video').srcObject = null;
    document.getElementById('snap').style.display = 'none';
}

// Fungsi untuk mengambil gambar dari video stream
function takePicture() {
    var canvas = document.getElementById('canvas');
    var video = document.getElementById('video');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert canvas to data URL
    var dataURL = canvas.toDataURL('image/jpeg');

    // Kirim data URL sebagai file Blob ke server
    var blob = dataURItoBlob(dataURL);
    var formData = new FormData();
    formData.append('file', blob, 'capture.jpg');

    fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        // Sama seperti di atas
        document.getElementById('result').textContent = data.text; // Pastikan ini 'data.text'
        if (data.audioPath) {
            var audioPlayer = document.getElementById('audioPlayer');
            audioPlayer.src = '/static/output/' + data.audioPath.split('/').pop();
            audioPlayer.load();
            audioPlayer.play().catch(error => {
                console.error('Playback failed:', error);
                audioPlayer.controls = true;
            });
        }
    })
    .catch(error => console.error('Error:', error));
}

// Helper function to convert data URI to Blob
function dataURItoBlob(dataURI) {
    var byteString = atob(dataURI.split(',')[1]);
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], {type: mimeString});
}

// Event listener untuk tombol 'Take a Picture!'
document.getElementById('startCamera').addEventListener('click', startCamera);

// Event listener untuk tombol 'Stop Camera'
document.getElementById('stopCamera').addEventListener('click', stopCamera);

// Event listener untuk tombol 'Capture'
document.getElementById('snap').addEventListener('click', function() {
    takePicture();
    stopCamera(); // Optional: Stop the camera after taking the picture
});

// Sembunyikan tombol snap hingga kamera diaktifkan
document.getElementById('snap').style.display = 'none';
