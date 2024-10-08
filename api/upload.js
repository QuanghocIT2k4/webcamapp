const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { poolPromise } = require('./config/database');  // Kết nối tới SQL Server
const { verifyToken } = require('./auth');  // Import middleware xác thực người dùng

const app = express();

// Cấu hình lưu trữ file với Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads');
        
        // Kiểm tra nếu thư mục uploads chưa tồn tại thì tạo mới
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });  // Tạo thư mục nếu cần
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));  // Tạo tên file mới với timestamp
    }
});

const upload = multer({ storage: storage });

// Route xử lý upload ảnh
app.post('/api/upload', upload.single('image'), async (req, res) => {
    console.log('Request Body:', req.body);  // Kiểm tra body của request
    console.log('File:', req.file);  // Kiểm tra thông tin file đã được upload
    
    try {
        const username = req.body.username;  // Lấy username từ request (phải truyền vào từ phía client)
        if (!req.file) {
            return res.status(400).json({ message: 'Không có tệp nào được tải lên.' });
        }
        // In ra console để kiểm tra
        console.log('Username:', username);
        console.log('File path:', `/uploads/${req.file.filename}`);
        // Lưu thông tin file vào database
        const pool = await poolPromise;
        await pool.request()
            .input('username', sql.NVarChar, username)
            .input('file_path', sql.NVarChar, `/uploads/${req.file.filename}`)
            .input('upload_time', sql.DateTime, new Date())
            .input('file_type', sql.NVarChar, req.file.mimetype)
            .query('INSERT INTO Files (username, file_path, upload_time, file_type) VALUES (@username, @file_path, @upload_time, @file_type)');
        
        res.status(200).json({
            message: 'Tệp đã được upload thành công!',
            file: { path: `/uploads/${req.file.filename}` }
        });
    } catch (err) {
        console.error('Lỗi khi upload file:', err);
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
});


module.exports = app;
