import express from 'express';
import { types } from 'cassandra-driver';
import client from '../config/cassandra.mjs';
import bcrypt from 'bcrypt';

const router = express.Router();

/* ============================================================
 * GET /api/admin/users
 * - Liệt kê tất cả user (phân trang nếu cần)
 * ============================================================ */
router.get('/api/admin/users', async (req, res) => {
  try {
    const result = await client.execute(
      `SELECT user_id, full_name, user_email, role, province_code, district_code, created_at 
       FROM users_by_id`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching users:', err);
    res.status(500).json({ error: err.message });
  }
});

/* ============================================================
 * POST /api/admin/users
 * - Tạo user mới
 * ============================================================ */

router.post('/api/admin/users', async (req, res) => {
  try {
    const { full_name, user_email, password, role } = req.body;

    if (!full_name || !user_email || !password || !role)
      return res.status(400).json({ error: 'Thiếu dữ liệu bắt buộc' });

    // 🔒 Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    const user_id = types.Uuid.random();
    const created_at = new Date();

    // 1️⃣ Lưu vào bảng chính
    await client.execute(
      `INSERT INTO users_by_id (user_id, full_name, user_email, password_hash, role, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [user_id, full_name, user_email, password_hash, role, created_at],
      { prepare: true }
    );

    // 2️⃣ Bảng phụ
    await client.execute(`INSERT INTO users_by_email (user_email, user_id) VALUES (?, ?)`, [user_email, user_id], {
      prepare: true,
    });

    await client.execute(
      `INSERT INTO users_by_role (role, user_id, email, full_name) VALUES (?, ?, ?, ?)`,
      [role, user_id, user_email, full_name],
      { prepare: true }
    );

    res.json({ message: '✅ Tạo user thành công', user_id });
  } catch (err) {
    console.error('❌ Error creating user:', err);
    res.status(500).json({ error: err.message });
  }
});

/* ============================================================
 * PATCH /api/admin/users/:id
 * - Cập nhật thông tin user
 * ============================================================ */
router.patch('/api/admin/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const userUuid = types.Uuid.fromString(id);

    let updateSet = [];
    let values = [];

    for (const [key, val] of Object.entries(updates)) {
      updateSet.push(`${key} = ?`);
      values.push(val);
    }
    values.push(userUuid);

    const query = `UPDATE users_by_id SET ${updateSet.join(', ')} WHERE user_id = ?`;
    await client.execute(query, values, { prepare: true });

    res.json({ message: '✏️ Cập nhật user thành công' });
  } catch (err) {
    console.error('❌ Error updating user:', err);
    res.status(500).json({ error: err.message });
  }
});

/* ============================================================
 * DELETE /api/admin/users/:id
 * ============================================================ */
router.delete('/api/admin/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userUuid = types.Uuid.fromString(id);

    const user = await client.execute(
      `SELECT user_email, role FROM users_by_id WHERE user_id = ? LIMIT 1`,
      [userUuid],
      { prepare: true }
    );
    if (!user.rowLength) return res.status(404).json({ error: 'User không tồn tại' });

    const { user_email, role } = user.first();

    await client.execute(`DELETE FROM users_by_id WHERE user_id = ?`, [userUuid], { prepare: true });
    await client.execute(`DELETE FROM users_by_email WHERE user_email = ?`, [user_email], { prepare: true });
    await client.execute(`DELETE FROM users_by_role WHERE role = ? AND user_id = ?`, [role, userUuid], {
      prepare: true,
    });

    res.json({ message: '🗑️ Xóa user thành công' });
  } catch (err) {
    console.error('❌ Error deleting user:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
