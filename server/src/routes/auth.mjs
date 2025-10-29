import express from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

import ensureAdmin from '../middlewares/ensureAdmin.mjs';
import passport from '../strategies/local-strategy.mjs';
import client from '../config/cassandra.mjs';
import { RegisterSchema, LoginSchema } from '../database/schemas/authValidationSchema.mjs';
import ensureAuthenticated from '../middlewares/ensureAuthenticated.mjs';
import { normalizeEmail } from '../utils/helpers.mjs';
import { Q_CREATE_USER, Q_CREATE_USER_BY_EMAIL, Q_CREATE_USER_BY_ROLE } from '../database/query.mjs';

const router = express.Router();

// Route: Register a new user
router.post('/api/register', async (req, res) => {
  try {
    // Parse + validate body
    const { fullName, email, password, role, gender, address, province_code, district_code } = RegisterSchema.parse(
      req.body
    );

    const normEmail = normalizeEmail(email);

    // Check if email exists
    const checkEmailQuery = 'SELECT user_id FROM users_by_email WHERE user_email = ?';
    const emailExists = await client.execute(checkEmailQuery, [normEmail], {
      prepare: true,
    });

    if (emailExists.rowLength > 0) {
      return res.status(400).json({ message: 'Email đã tồn tại trong hệ thống' });
    }

    const userId = uuidv4();
    const passwordHash = bcrypt.hashSync(password, 10);
    const now = new Date();

    // Insert user (2 bảng: users_by_id, users_by_email)
    const queries = [
      {
        query: Q_CREATE_USER,
        params: [
          userId,
          address || null,
          now,
          fullName,
          gender,
          passwordHash,
          role,
          normEmail,
          province_code ? province_code.toString() : null,
          district_code ? district_code.toString() : null,
        ],
      },
      {
        query: Q_CREATE_USER_BY_EMAIL,
        params: [normEmail, userId],
      },
      // ✅ Đồng bộ bảng users_by_role
      {
        query: Q_CREATE_USER_BY_ROLE,
        params: [role, userId, fullName, normEmail],
      },
    ];

    await client.batch(queries, { prepare: true });

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.errors });
    }
    console.error('Error registering user:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Route: Login
router.post('/api/login', async (req, res, next) => {
  try {
    LoginSchema.parse(req.body);
  } catch (err) {
    return res.status(400).json({ error: 'Dữ liệu không hợp lệ' });
  }

  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ error: info?.message || 'Đăng nhập thất bại' });

    req.logIn(user, (err2) => {
      if (err2) return next(err2);
      return res.json({ message: 'Đăng nhập thành công', user });
    });
  })(req, res, next);
});

// Route: Logout
router.post('/api/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
    res.status(200).json({ message: 'Đăng xuất thành công' });
  });
});

// Route: Me (check login session)
router.get('/me', ensureAuthenticated, async (req, res) => {
  try {
    const result = await client.execute(
      'SELECT user_id, full_name, user_email, role, cv_url FROM users_by_id WHERE user_id = ?',
      [req.user.user_id],
      { prepare: true }
    );

    if (result.rowLength === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const row = result.first();
    const user = {
      user_id: row.user_id.toString(),
      full_name: row.full_name,
      user_email: row.user_email,
      role: row.role,
      cv_url: row.cv_url || null,
    };

    res.json({ user });
  } catch (err) {
    console.error('Error fetching /me:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin

router.get('/api/admin/me', ensureAdmin, async (req, res) => {
  try {
    const result = await client.execute(
      'SELECT user_id, full_name, user_email, role, cv_url FROM users_by_id WHERE user_id = ?',
      [req.user.user_id],
      { prepare: true }
    );

    if (result.rowLength === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const row = result.first();
    const user = {
      user_id: row.user_id.toString(),
      full_name: row.full_name,
      user_email: row.user_email,
      role: row.role,
      cv_url: row.cv_url || null,
    };

    res.json({ user });
  } catch (err) {
    console.error('Error fetching /api/admin/me:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/api/admin/login', (req, res, next) => {
  passport.authenticate('local', async (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(400).json({ error: info?.message || 'Sai thông tin đăng nhập' });

    // ✅ Kiểm tra role
    const allowedRoles = ['admin', 'recruiter', 'coordinator'];
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: 'Sai mật khẩu hoặc không có quyền truy cập' });
    }

    req.logIn(user, (err) => {
      if (err) return next(err);
      res.json({
        message: 'Đăng nhập admin thành công',
        user: {
          user_id: user.user_id,
          full_name: user.full_name,
          user_email: user.user_email,
          role: user.role,
        },
      });
    });
  })(req, res, next);
});

router.post('/api/admin/logout', (req, res) => {
  req.logout(() => res.json({ message: 'Admin logged out' }));
});

export default router;
