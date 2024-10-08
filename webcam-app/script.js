document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('webcam');
    const canvas = document.getElementById('snapCanvas');
    const capBtn = document.getElementById('capBtn');
    const onoffBtn = document.getElementById('onoffBtn');
    const qrCodeImage = document.getElementById('qrCodeImage');
    const capturedImageSection = document.getElementById('capturedImageSection');
    const capturedImage = document.getElementById('capturedImage');
    const qrCodeSection = document.getElementById('qrCodeSection');
    const capturedVideoSection = document.getElementById('capturedVideoSection');
    const recordedVideo = document.getElementById('recordedVideo');
    const downloadVideoBtn = document.getElementById('downloadVideoBtn');
    const clearVideoBtn = document.getElementById('clearVideoBtn');
    const startRecBtn = document.getElementById('startRecBtn');
    const stopRecBtn = document.getElementById('stopRecBtn');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const webcamApp = document.getElementById('webcamApp');
    const authSection = document.getElementById('authSection');

    let stream = null;
    let mediaRecorder;
    let recordedChunks = [];
    let isWebcamOn = false;

    // Ẩn các phần tử chức năng như "Toàn màn hình", "Chụp ảnh", và "Quay video" khi trang vừa tải lên
    capBtn.style.display = 'none';
    fullscreenBtn.style.display = 'none';
    startRecBtn.style.display = 'none';

    // Đăng ký
    document.getElementById('registerForm').addEventListener('submit', function (e) {
        e.preventDefault();
        const username = document.getElementById('registerUsername').value;
        const password = document.getElementById('registerPassword').value;

        fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        })
        .then(response => response.json())
        .then(data => alert(data.message))
        .catch(err => console.error('Lỗi:', err));
    });

    // Đăng nhập
    document.getElementById('loginForm').addEventListener('submit', function (e) {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;

        fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        })
        .then(response => response.json())
        .then(data => {
            if (data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('username', data.username); // Lưu username
                alert('Đăng nhập thành công');
                
                // Ẩn phần đăng nhập và hiển thị ứng dụng webcam
                authSection.style.display = 'none';
                webcamApp.style.display = 'block'; // Hiển thị ứng dụng webcam
                onoffBtn.style.display = 'block'; // Chỉ hiển thị nút "Bật webcam"
            } else {
                alert(data.message);
            }
        })
        .catch(err => console.error('Lỗi:', err));
    });

    // Bật/tắt webcam
    onoffBtn.addEventListener('click', () => {
        if (isWebcamOn) {
            stream.getTracks().forEach(track => track.stop());
            video.srcObject = null;
            onoffBtn.innerHTML = '<i class="fas fa-video"></i> Bật webcam';
            onoffBtn.classList.remove('active');
            onoffBtn.style.backgroundColor = 'green';
            
            // Ẩn các nút chức năng và phần thông tin khi webcam tắt
            capBtn.style.display = 'none';
            fullscreenBtn.style.display = 'none';
            startRecBtn.style.display= 'none';
            // Ẩn chi tiết hình ảnh và video đã quay
            capturedImageSection.style.display = 'none';
            capturedImage.style.display = 'none';
            capturedVideoSection.style.display = 'none';
            recordedVideo.style.display = 'none';
            qrCodeSection.style.display = 'none';
            document.getElementById('fileInfoSection').innerHTML = ''; // Xóa nội dung thông tin file
        } else {
            navigator.mediaDevices.getUserMedia({ video: true })
            .then(s => {
                stream = s;
                video.srcObject = stream;
                onoffBtn.innerHTML = '<i class="fas fa-video-slash"></i> Tắt webcam';
                onoffBtn.classList.add('active');
                onoffBtn.style.backgroundColor = 'red';
    
                // Hiển thị các nút chức năng khi webcam bật
                capBtn.style.display = 'block';
                fullscreenBtn.style.display = 'block';
                startRecBtn.style.display= 'block';
            })
            .catch(err => console.error("Lỗi khi truy cập webcam: ", err));
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
        capturedImage.style.display = 'block'; 
        capturedImageSection.style.display = 'block';

        // Gửi ảnh lên server
        uploadImage(imageDataURL);
    });

    // Tải ảnh xuống
    document.getElementById('downloadBtn').addEventListener('click', () => {
        const imageURL = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = imageURL;
        link.download = 'captured_image.png';
        link.click();
    });

    // Hủy ảnh đã chụp
    document.getElementById('clearBtn').addEventListener('click', () => {
    capturedImage.src = '';
    capturedImageSection.style.display = 'none'; // Ẩn phần hiển thị ảnh đã chụp
    qrCodeSection.style.display = 'none'; // Ẩn phần mã QR (nếu có)
    document.getElementById('fileInfoSection').innerHTML = ''; // Xóa thông tin file (nếu có)
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
            recordedVideo.style.display = 'block'; 
            capturedVideoSection.style.display = 'block';

            // Gửi video lên server
            uploadVideo(blob);
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

    // Upload ảnh lên server và nhận mã QR, thông tin tệp
    function uploadImage(imageData) {
        const formData = new FormData();
        formData.append('image', dataURItoBlob(imageData), 'captured_image.png');
        formData.append('username', localStorage.getItem('username'));  // Gửi username từ localStorage

        fetch('/api/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Lỗi khi upload ảnh: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            alert('Upload thành công! Đường dẫn ảnh: ' + data.file.path);

            // Hiển thị mã QR và thông tin file
            qrCodeImage.src = data.qrCode;
            qrCodeSection.style.display = 'block';
            document.getElementById('fileInfoSection').innerHTML = `Kích thước: ${data.file.size}, Thời gian tải lên: ${data.file.uploadTime}`;
        })
        .catch(error => {
            console.error('Lỗi khi upload ảnh:', error);
            alert('Đã xảy ra lỗi khi upload ảnh. Vui lòng thử lại.');
        });
    }

    // Upload video lên server và nhận mã QR, thông tin tệp
    function uploadVideo(blob) {
        const formData = new FormData();
        formData.append('video', blob, 'recorded_video.webm');

        fetch('/api/upload-video', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            alert('Upload video thành công! Đường dẫn video: ' + data.file.path);

            // Hiển thị mã QR và thông tin file
            qrCodeImage.src = data.qrCode;
            qrCodeSection.style.display = 'block';
            document.getElementById('fileInfoSection').innerHTML = `Kích thước: ${data.file.size}, Thời gian tải lên: ${data.file.uploadTime}`;
        })
        .catch(error => {
            console.error('Lỗi khi upload video:', error);
            alert('Đã xảy ra lỗi khi upload video. Vui lòng thử lại.');
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
});
