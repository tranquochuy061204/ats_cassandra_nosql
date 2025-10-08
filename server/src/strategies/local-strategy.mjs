import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';
import client from '../config/cassandra.mjs';

const Q_GET_UID_BY_EMAIL = 'SELECT user_id FROM users_by_email WHERE user_email = ?';
const Q_GET_USER_BY_ID = 'SELECT * FROM users_by_id WHERE user_id = ?';

function normalizeEmail(email) {
  return String(email).trim().toLowerCase();
}

passport.use(
  new LocalStrategy(
    { usernameField: 'email', passwordField: 'password', session: true },
    async (email, password, done) => {
      try {
        const normEmail = normalizeEmail(email);

        // 1) tra user_id theo email
        const r1 = await client.execute(Q_GET_UID_BY_EMAIL, [normEmail], { prepare: true });
        if (r1.rowLength === 0) {
          // không tiết lộ “email không tồn tại” để tránh dò tài khoản
          return done(null, false, { message: 'Invalid credentials' });
        }

        const userId = r1.rows[0].user_id;

        // 2) lấy user theo id
        const r2 = await client.execute(Q_GET_USER_BY_ID, [userId], { prepare: true });
        if (r2.rowLength === 0) {
          return done(null, false, { message: 'Invalid credentials' });
        }

        const user = r2.first(); // { user_id, full_name, user_email, password_hash, ... }
        const ok = await bcrypt.compare(password, user.password_hash);
        if (!ok) {
          // TODO: tăng đếm failed login / rate-limit (nếu muốn)
          return done(null, false, { message: 'Invalid credentials' });
        }

        // Không trả password_hash ra ngoài session
        const safeUser = {
          user_id: user.user_id,
          full_name: user.full_name,
          user_email: user.user_email,
          role: user.role,
          cv_url: user.cv_url || null,
        };

        return done(null, safeUser);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// Session: lưu userId vào session cookie
passport.serializeUser((user, done) => {
  // Ở đây user.user_id là cassandra Uuid => convert string để serializable
  done(null, user.user_id.toString());
});

passport.deserializeUser(async (id, done) => {
  try {
    // Lấy lại user từ Cassandra
    const r = await client.execute(
      'SELECT user_id, full_name, user_email, role, cv_url FROM users_by_id WHERE user_id = ?',
      [id], // driver tự convert từ string sang uuid
      { prepare: true }
    );
    if (r.rowLength === 0) return done(null, false);
    done(null, r.first());
  } catch (err) {
    done(err, null);
  }
});

export default passport;
