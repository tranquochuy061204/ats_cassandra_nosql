import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { types } from 'cassandra-driver';
import client from '../config/cassandra.mjs';

const router = express.Router();

// 🗂️ Thư mục lưu file
const uploadDir = path.resolve('uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// ⚙️ Cấu hình Multer
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const unique = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
    cb(null, unique);
  },
});
const upload = multer({ storage });

/**
 * ✅ POST /api/upload/cv
 * Upload CV và cập nhật vào bảng users_by_id.cv_url
 * → KHÔNG dùng session (ensureAuthenticated) để tương thích frontend hiện tại
 */
router.post('/api/upload/cv', upload.single('cv'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Thiếu file CV' });

    // 🧠 Lấy user_id từ form-data (frontend gửi thêm user_id)
    const { user_id } = req.body;
    if (!user_id) {
      return res.status(400).json({ error: 'Thiếu user_id trong form-data' });
    }

    // Kiểm tra UUID hợp lệ
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(user_id)) {
      return res.status(400).json({ error: 'user_id không hợp lệ' });
    }

    const filePath = `/uploads/${req.file.filename}`;
    const userId = types.Uuid.fromString(user_id);

    // ⚡ Cập nhật vào Cassandra
    await client.execute('UPDATE users_by_id SET cv_url = ? WHERE user_id = ?', [filePath, userId], { prepare: true });

    console.log('✅ CV uploaded successfully for user:', user_id);

    return res.status(200).json({
      message: 'Upload CV thành công!',
      cv_url: filePath,
    });
  } catch (err) {
    console.error('❌ Upload CV error:', err);
    return res.status(500).json({ error: 'Lỗi khi upload CV', details: err.message });
  }
});

export default router;
