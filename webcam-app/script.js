// DOM elements
const video = document.getElementById('webcam');
const canvas = document.getElementById('snapCanvas');
const capBtn = document.getElementById('capBtn');
const onoffBtn = document.getElementById('onoffBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const fullscreenSection = document.getElementById('fullscreenSection');
const captureSection = document.getElementById('captureSection');
const capturedImageSection = document.getElementById('capturedImageSection');
const capturedImage = document.getElementById('capturedImage');
const downloadBtn = document.getElementById('downloadBtn');
const clearBtn = document.getElementById('clearBtn');
const startRecBtn = document.getElementById('startRecBtn');
const stopRecBtn = document.getElementById('stopRecBtn');
const videoSection = document.getElementById('videoSection');
const capturedVideoSection = document.getElementById('capturedVideoSection');
const recordedVideo = document.getElementById('recordedVideo');
const downloadVideoBtn = document.getElementById('downloadVideoBtn');
const clearVideoBtn = document.getElementById('clearVideoBtn');

let stream = null;
let mediaRecorder;
let recordedChunks = [];
let isWebcamOn = false;

// Bật/tắt webcam
onoffBtn.addEventListener('click', () => {
    if (isWebcamOn) {
        // Tắt webcam
        stream.getTracks().forEach(track => track.stop());
        video.srcObject = null;
        onoffBtn.innerHTML = '<i class="fas fa-video"></i> Bật webcam';
        onoffBtn.classList.remove('active');
        captureSection.style.display = 'none';
        capturedImageSection.style.display = 'none';
        capturedVideoSection.style.display = 'none';
        fullscreenSection.style.display = 'none';
        videoSection.style.display = 'none';
    } else {
        // Bật webcam
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(s => {
                stream = s;
                video.srcObject = stream;
                onoffBtn.innerHTML = '<i class="fas fa-video-slash"></i> Tắt webcam';
                onoffBtn.classList.add('active');
                captureSection.style.display = 'block';
                fullscreenSection.style.display = 'block';
                videoSection.style.display = 'block';
            })
            .catch(err => {
                console.error("Lỗi khi truy cập webcam: ", err);
            });
    }
    isWebcamOn = !isWebcamOn;
});

// Phóng to toàn màn hình
fullscreenBtn.addEventListener('click', () => {
    if (video.requestFullscreen) {
        video.requestFullscreen();
    } else if (video.mozRequestFullScreen) { // Firefox
        video.mozRequestFullScreen();
    } else if (video.webkitRequestFullscreen) { // Chrome, Safari và Opera
        video.webkitRequestFullscreen();
    } else if (video.msRequestFullscreen) { // IE/Edge
        video.msRequestFullscreen();
    }
});

// Chụp ảnh từ webcam
capBtn.addEventListener('click', () => {
    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageDataURL = canvas.toDataURL('image/png');
    capturedImage.src = imageDataURL;
    capturedImageSection.style.display = 'block';

    // Gửi ảnh lên server
    uploadImage(imageDataURL);
});

// Tải ảnh xuống
downloadBtn.addEventListener('click', () => {
    const imageURL = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = imageURL;
    link.download = 'captured_image.png';
    link.click();
});

// Hủy ảnh đã chụp
clearBtn.addEventListener('click', () => {
    capturedImage.src = '';
    capturedImageSection.style.display = 'none';
});

// Bắt đầu quay video
startRecBtn.addEventListener('click', () => {
    recordedChunks = [];
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = function(e) {
        if (e.data.size > 0) {
            recordedChunks.push(e.data);
        }
    };
    mediaRecorder.start();
    startRecBtn.style.display = 'none';
    stopRecBtn.style.display = 'block';
});

// Dừng quay video và tải xuống
stopRecBtn.addEventListener('click', () => {
    mediaRecorder.stop();
    startRecBtn.style.display = 'block';
    stopRecBtn.style.display = 'none';

    mediaRecorder.onstop = function() {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        recordedVideo.src = url;
        capturedVideoSection.style.display = 'block';
    };
});

// Tải xuống video
downloadVideoBtn.addEventListener('click', () => {
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'recorded_video.webm';
    link.click();
    URL.revokeObjectURL(url);
});

// Hủy video đã quay
clearVideoBtn.addEventListener('click', () => {
    recordedVideo.src = '';
    capturedVideoSection.style.display = 'none';
});

// Upload ảnh lên server
function uploadImage(imageData) {
    const formData = new FormData();
    formData.append('image', dataURItoBlob(imageData), 'captured_image.png');

    // Sử dụng đúng cổng và địa chỉ backend (thay thế localhost:3000 nếu server đang chạy trên cổng 3000)
    fetch('http://localhost:3000/upload', { 
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Lỗi khi upload ảnh: ' + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        if (data && data.file && data.file.path) {
            alert('Upload thành công! Đường dẫn ảnh: ' + data.file.path);
        } else {
            alert('Upload thành công nhưng không có đường dẫn ảnh được trả về.');
        }
    })
    .catch(error => {
        console.error('Lỗi khi upload ảnh:', error);
        alert('Đã xảy ra lỗi khi upload ảnh. Vui lòng thử lại.');
    });
}



// Chuyển đổi từ dataURL (Base64) thành Blob
function dataURItoBlob(dataURI) {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
}

// Upload video lên server
function uploadVideo(blob) {
    const formData = new FormData();
    formData.append('video', blob, 'recorded_video.webm'); // Gửi video với tên 'recorded_video.webm'

    fetch('/upload-video', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        alert('Upload video thành công! Đường dẫn video: ' + data.file.path);
    })
    .catch(error => {
        console.error('Lỗi khi upload video:', error);
    });
}

// Dừng quay video và tải lên server
stopRecBtn.addEventListener('click', () => {
    mediaRecorder.stop();
    startRecBtn.style.display = 'block';
    stopRecBtn.style.display = 'none';

    mediaRecorder.onstop = function() {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        recordedVideo.src = url;
        capturedVideoSection.style.display = 'block';

        // Gửi video lên server
        uploadVideo(blob);
    };
});
