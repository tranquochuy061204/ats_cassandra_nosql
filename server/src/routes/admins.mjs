import express from 'express';
import { z } from 'zod';
import client from '../config/cassandra.mjs';

const router = express.Router();

/* =========================
 * GET /api/admins
 * ?role=recruiter&search=anh
 * ========================= */
router.get('/api/admins', async (req, res) => {
  try {
    const schema = z.object({
      role: z.string().optional(),
      search: z.string().optional(),
    });
    const { role, search } = schema.parse(req.query);

    // ✅ Query: lấy theo role (nếu có)
    let query = 'SELECT role, user_id, full_name, email FROM users_by_role';
    const params = [];

    if (role) {
      query += ' WHERE role = ?';
      params.push(role);
    }

    const result = await client.execute(query, params, { prepare: true });
    let users = result.rows;

    // ✅ Nếu có search, lọc tiếp
    if (search) {
      const lower = search.toLowerCase();
      users = users.filter((u) => u.full_name?.toLowerCase().includes(lower) || u.email?.toLowerCase().includes(lower));
    }

    const items = users.slice(0, 100).map((u) => ({
      user_id: u.user_id.toString(),
      full_name: u.full_name,
      email: u.email,
      role: u.role,
    }));

    return res.json({ items });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid query' });
    }
    console.error('❌ GET /api/admins error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
});

export default router;
