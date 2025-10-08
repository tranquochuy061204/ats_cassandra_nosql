import express from 'express';
import client from '../config/cassandra.mjs';

const router = express.Router();

/**
 * GET /api/provinces
 * Trả về toàn bộ danh sách tỉnh/thành trong bảng vn_provinces
 */
router.get('/api/provinces', async (_req, res) => {
  try {
    const result = await client.execute('SELECT code, name FROM vn_provinces');
    // Sắp xếp theo tên cho dễ nhìn
    const provinces = result.rows.sort((a, b) => a.name.localeCompare(b.name));
    res.json(provinces);
  } catch (err) {
    console.error('❌ Lỗi khi lấy danh sách provinces:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/districts?province_code=xx
 * Trả về danh sách quận/huyện thuộc tỉnh/thành cụ thể
 */
router.get('/api/districts', async (req, res) => {
  try {
    const { province_code } = req.query;
    if (!province_code) {
      return res.status(400).json({ error: 'Thiếu province_code' });
    }

    const result = await client.execute('SELECT code, name FROM districts WHERE province_code = ?', [province_code], {
      prepare: true,
    });

    // Sắp xếp theo tên
    const districts = result.rows.sort((a, b) => a.name.localeCompare(b.name));
    res.json(districts);
  } catch (err) {
    console.error('❌ Lỗi khi lấy danh sách districts:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
