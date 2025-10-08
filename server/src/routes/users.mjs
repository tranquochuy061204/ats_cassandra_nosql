import express from 'express';
import { types } from 'cassandra-driver';
import client from '../config/cassandra.mjs';
import ensureAuthenticated from '../middlewares/ensureAuthenticated.mjs';

const router = express.Router();

// Lấy thông tin user
router.get('/api/users/:id', async (req, res) => {
  try {
    const user_id = types.Uuid.fromString(req.params.id);
    const result = await client.execute(
      'SELECT user_id, full_name, gender, address, province_code, district_code, cv_url FROM users_by_id WHERE user_id = ?',
      [user_id],
      { prepare: true }
    );

    if (result.rowLength === 0) return res.status(404).json({ error: 'User not found' });

    res.json(result.first());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 🧠 Cập nhật thông tin user
router.patch('/api/users/:id', async (req, res) => {
  try {
    const user_id = types.Uuid.fromString(req.params.id);
    const { full_name, gender, address_line, province_code, district_code } = req.body;

    await client.execute(
      `UPDATE users_by_id
       SET full_name = ?, gender = ?, address = ?, province_code = ?, district_code = ?
       WHERE user_id = ?`,
      [full_name, gender, address_line, province_code, district_code, user_id],
      { prepare: true }
    );

    res.json({ full_name, gender, address_line, province_code, district_code });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Invalid request' });
  }
});

export default router;
