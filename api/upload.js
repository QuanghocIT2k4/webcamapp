const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

// Cấu hình lưu trữ file với Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads');  // Đảm bảo đường dẫn đúng đến thư mục 'uploads'
        
        // Kiểm tra nếu thư mục uploads chưa tồn tại thì tạo mới
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });  // Thêm 'recursive' để tạo thư mục nếu cần
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));  // Tạo tên file mới với timestamp
    }
});

const upload = multer({ storage: storage });

// Route xử lý upload ảnh
app.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Không có tệp nào được tải lên.' });
    }
    res.status(200).json({
        message: 'Tệp đã được upload thành công!',
        file: { path: `/uploads/${req.file.filename}` }  // Trả về đường dẫn của file đã upload
    });
});

module.exports = app;  // Đảm bảo module được export để server.js có thể sử dụng
