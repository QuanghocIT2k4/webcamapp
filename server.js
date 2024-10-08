const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sql, poolPromise } = require('./config/database'); // Kết nối tới database.js

const app = express();
const PORT = 3000;
const SECRET_KEY = 'mysecretkey';

// Cấu hình CORS để cho phép cả localhost và Vercel
app.use(cors());
app.use(express.json());

// Cấu hình phục vụ tệp tĩnh từ thư mục 'webcam-app'
app.use(express.static(path.join(__dirname, 'webcam-app')));

// Cấu hình Multer cho ảnh và video
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 500 * 1024 * 1024 }
});

// Route cho trang chính để tải trang index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'webcam-app', 'index.html'));
});

// Đăng ký
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        const pool = await poolPromise;

        // Kiểm tra xem username đã tồn tại chưa
        const result = await pool.request()
            .input('username', sql.VarChar, username)
            .query('SELECT * FROM Users WHERE username = @username');
        
        if (result.recordset.length > 0) {
            return res.status(400).json({ message: 'Tên người dùng đã tồn tại' });
        }

        // Lưu mật khẩu trực tiếp vào DB mà không mã hóa
        await pool.request()
            .input('username', sql.VarChar, username)
            .input('password', sql.VarChar, password) // Lưu mật khẩu nguyên gốc
            .query('INSERT INTO Users (username, password) VALUES (@username, @password)');

        res.status(201).json({ message: 'Đăng ký thành công' });
    } catch (error) {
        console.error('Lỗi khi đăng ký:', error);
        res.status(500).json({ message: 'Đã xảy ra lỗi khi đăng ký' });
    }
});

// Đăng nhập
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const pool = await poolPromise;

        // Tìm người dùng trong DB
        const result = await pool.request()
            .input('username', sql.VarChar, username)
            .query('SELECT * FROM Users WHERE username = @username');
        
        if (result.recordset.length === 0) {
            return res.status(400).json({ message: 'Tên người dùng hoặc mật khẩu không đúng' });
        }

        const user = result.recordset[0];

        // So sánh trực tiếp mật khẩu
        if (password !== user.password) {
            return res.status(400).json({ message: 'Tên người dùng hoặc mật khẩu không đúng' });
        }

        // Tạo token JWT
        const token = jwt.sign({ username: user.username }, SECRET_KEY, { expiresIn: '1h' });
        res.status(200).json({ message: 'Đăng nhập thành công', token });
    } catch (error) {
        console.error('Lỗi khi đăng nhập:', error);
        res.status(500).json({ message: 'Đã xảy ra lỗi khi đăng nhập' });
    }
});

// Middleware xác thực JWT
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Chưa đăng nhập' });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ message: 'Token không hợp lệ' });
        req.user = user;
        next();
    });
}

// Upload ảnh
app.post('/api/upload', authenticateToken, upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Không có tệp nào được tải lên.' });
    }

    const filePath = `/uploads/${req.file.filename}`;
    const fileSize = Math.round(req.file.size / 1024) + ' KB';
    const uploadTime = new Date().toLocaleString();

    QRCode.toDataURL(filePath, (err, qrCode) => {
        if (err) {
            return res.status(500).json({ message: 'Lỗi khi tạo mã QR.' });
        }

        res.status(200).json({
            message: 'Tệp ảnh đã được upload thành công!',
            file: { path: filePath, size: fileSize, uploadTime: uploadTime },
            qrCode: qrCode
        });
    });
});

// Upload video
app.post('/api/upload-video', authenticateToken, upload.single('video'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Không có tệp nào được tải lên.' });
    }

    const filePath = `/uploads/${req.file.filename}`;
    const fileSize = Math.round(req.file.size / 1024) + ' KB';
    const uploadTime = new Date().toLocaleString();

    QRCode.toDataURL(filePath, (err, qrCode) => {
        if (err) {
            return res.status(500).json({ message: 'Lỗi khi tạo mã QR cho video.' });
        }

        res.status(200).json({
            message: 'Tệp video đã được upload thành công!',
            file: { path: filePath, size: fileSize, uploadTime: uploadTime },
            qrCode: qrCode
        });
    });
});

// Khởi chạy server
app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
