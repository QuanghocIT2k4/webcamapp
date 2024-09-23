const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

// Thiết lập thư mục tĩnh để phục vụ các tệp HTML, CSS, JS
app.use(express.static(path.join(__dirname)));

// Thiết lập nơi lưu trữ ảnh
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = './uploads';
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath);
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

// Cấu hình Multer với giới hạn kích thước tệp (ví dụ 100MB)
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 100000000 } // 100MB
});

// Xử lý upload ảnh/video
app.post('/upload', (req, res) => {
    upload.single('image')(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).send('Tệp quá lớn. Giới hạn tối đa là 100MB.');
            }
        } else if (err) {
            return res.status(500).send('Đã xảy ra lỗi khi upload tệp.');
        }
        res.status(200).json({
            message: 'Tệp đã được upload thành công!',
            file: req.file
        });
    });
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server đang chạy tại http://localhost:${port}`);
});
