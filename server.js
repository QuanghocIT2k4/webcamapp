const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(cors()); // Cho phép CORS để frontend có thể gửi yêu cầu từ cổng khác

// Cấu hình lưu trữ file với Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath);
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

// Thiết lập multer với giới hạn kích thước file là 100MB
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 100000000 } // 100MB
});

// Endpoint xử lý upload ảnh
app.post('/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Không có tệp nào được tải lên.' });
    }
    res.status(200).json({
        message: 'Tệp đã được upload thành công!',
        file: { path: `/uploads/${req.file.filename}` }
    });
});

// Phục vụ tệp tĩnh (CSS, JS, ảnh) từ thư mục 'webcam-app'
app.use(express.static(path.join(__dirname, 'webcam-app')));

// Thêm route cho GET request tại đường dẫn gốc "/"
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'webcam-app', 'index.html')); // Trả về file HTML chính của ứng dụng
});

// Khởi chạy server trên cổng 3000
const port = 3000;
app.listen(port, () => {
    console.log(`Server đang chạy tại http://localhost:${port}`);
});
