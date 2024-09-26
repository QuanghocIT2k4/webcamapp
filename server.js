const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();

// Cấu hình CORS để cho phép cả localhost và Vercel
app.use(cors({
    origin: ['http://127.0.0.1:5500', 'https://webcamapp-iota.vercel.app'],  // Thêm miền của Vercel
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Cấu hình Multer cho ảnh và video
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, 'uploads');
        // Kiểm tra nếu thư mục uploads chưa tồn tại thì tạo mới
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Tạo tên file với timestamp
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 500 * 1024 * 1024 }  // Giới hạn kích thước video lớn (500MB)
});

// Endpoint xử lý upload ảnh
app.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Không có tệp nào được tải lên.' });
    }
    res.status(200).json({
        message: 'Tệp ảnh đã được upload thành công!',
        file: { path: `/uploads/${req.file.filename}` }
    });
});

// Endpoint xử lý upload video
app.post('/api/upload-video', upload.single('video'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Không có tệp nào được tải lên.' });
    }
    res.status(200).json({
        message: 'Tệp video đã được upload thành công!',
        file: { path: `/uploads/${req.file.filename}` }
    });
});

// Phục vụ tệp tĩnh (CSS, JS, ảnh) từ thư mục 'webcam-app'
app.use(express.static(path.join(__dirname, 'webcam-app')));

// Xử lý lỗi cho các request không tồn tại
app.use((req, res, next) => {
    res.status(404).send("Không tìm thấy trang!");
});

// Khởi chạy server trên cổng 3000
const port = 3000;
app.listen(port, () => {
    console.log(`Server đang chạy tại http://localhost:${port}`);
});
