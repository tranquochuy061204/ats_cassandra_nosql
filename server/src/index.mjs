import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import passport from 'passport';
import cookieParser from 'cookie-parser';

import sessionUser from './config/session-user.mjs';
import sessionAdmin from './config/session-admin.mjs';
import routes from './routes/index.mjs';
import client, { connectDB } from './config/cassandra.mjs';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

await connectDB();

// ====== CORS ======
app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
);

app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());

// ======================================================
// 🧠 1️⃣ Gắn session TƯƠNG ỨNG cho từng nhóm route
// ======================================================
app.use('/api/admin', sessionAdmin);
app.use(sessionUser);
// ======================================================
// 🧠 2️⃣ Gắn passport (chung, nhưng sau session)
// ======================================================
app.use(passport.initialize());
app.use(passport.session());

// ======================================================
// 🧠 3️⃣ Serve file uploads
// ======================================================
app.use('/uploads', async (req, res, next) => {
  const filePath = path.join(__dirname, '../uploads', req.path);

  if (!fs.existsSync(filePath)) return next();

  if (filePath.endsWith('.pdf')) {
    console.log('📄 Serving PDF inline:', filePath);
    res.removeHeader('Content-Disposition');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${path.basename(filePath)}"`);
    return res.sendFile(filePath);
  }

  return res.sendFile(filePath);
});

// ======================================================
// 🧠 4️⃣ Các route chính
// ======================================================
app.use(routes);

// ======================================================
app.get('/health', async (_req, res) => {
  try {
    const result = await client.execute('SELECT release_version FROM system.local');
    res.json({ ok: true, cassandra: result.rows[0].release_version, env: process.env.SESSION_SECRET });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
