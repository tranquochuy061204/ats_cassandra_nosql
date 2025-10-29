import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
dotenv.config();

import sessionUser from './config/session-user.mjs';
import sessionAdmin from './config/session-admin.mjs';
import routes from './routes/index.mjs';
import client, { connectDB } from './config/cassandra.mjs';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

await connectDB();

// ======================================================
// 🧠 Cấu hình bảo mật & middleware cơ bản
// ======================================================
app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
);
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());

// ======================================================
// 🧠 1️⃣ PHÂN NHÓM SESSION CHÍNH XÁC
// ======================================================

// 👉 Admin session (dành cho /api/admin/...)
// phải đặt TRƯỚC passport để Passport biết sử dụng admin.sid
app.use('/api/admin', sessionAdmin);
app.use('/api/admin', passport.initialize());
app.use('/api/admin', passport.session());

// 👉 User session (cho toàn bộ route khác /api/admin)
app.use(sessionUser);
app.use(passport.initialize());
app.use(passport.session());

// ======================================================
// 🧠 3️⃣ Các route chính (auth + jobs + applications)
// ======================================================
app.use(routes);

// ======================================================
// 🧠 2️⃣ Serve file uploads
// ======================================================

app.get('/uploads/:filename', (req, res, next) => {
  const filePath = path.join(process.cwd(), 'uploads', req.params.filename);

  if (!fs.existsSync(filePath)) return res.status(404).send('File not found');

  // Nếu là PDF → xem trực tiếp
  if (filePath.endsWith('.pdf')) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${req.params.filename}"`);
    return res.sendFile(filePath);
  }

  // Còn lại (ảnh, zip, docx...) → Express serve bình thường
  res.sendFile(filePath);
});

// ======================================================
// 🧠 4️⃣ Health check
// ======================================================
app.get('/health', async (_req, res) => {
  try {
    const result = await client.execute('SELECT release_version FROM system.local');
    res.json({ ok: true, cassandra: result.rows[0].release_version });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ======================================================
// 🚀 5️⃣ Start server
// ======================================================
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
