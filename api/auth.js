const jwt = require('jsonwebtoken');
const sql = require('mssql');
const { poolPromise } = require('./config/database');  // Kết nối tới SQL Server

// Middleware xác thực token
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(403).json({ message: 'Token không được cung cấp' });
    }

    jwt.verify(token, 'your_secret_key', (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Token không hợp lệ' });
        }

        req.userId = decoded.userId;  // Lưu userId vào request để sử dụng sau
        next();
    });
};

// Đăng nhập
const login = (req, res) => {
    const { username, password } = req.body;

    poolPromise.then(pool => {
        return pool.request()
            .input('username', sql.NVarChar, username)
            .input('password', sql.NVarChar, password)
            .query('SELECT * FROM Users WHERE username = @username AND password = @password');
    })
    .then(result => {
        if (result.recordset.length > 0) {
            const user = result.recordset[0];
            // Tạo token JWT
            const token = jwt.sign({ userId: user.id, username: user.username }, 'your_secret_key', { expiresIn: '1h' });

            res.status(200).json({
                message: 'Đăng nhập thành công',
                token: token
            });
        } else {
            res.status(401).json({ message: 'Đăng nhập thất bại' });
        }
    })
    .catch(err => {
        console.error('Lỗi đăng nhập:', err);
        res.status(500).send('Lỗi server');
    });
};

module.exports = { verifyToken, login };
