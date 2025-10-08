// routes/jobs.mjs
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { types } from 'cassandra-driver';

import { CreateJobSchema, UpdateJobSchema } from '../database/schemas/jobValidationSchema.mjs';
import client from '../config/cassandra.mjs';
import {
  buildUpdate,
  shouldAppear,
  publicKey,
  upsertPublicRow,
  deletePublicRow,
  syncPublicView,
  upsertRecruiterRow,
  deleteRecruiterRow,
} from '../utils/jobHelper.mjs';

const router = express.Router();

const toUniqueArray = (a) => (Array.isArray(a) ? [...new Set(a)] : []);
const toSet = (arr) => new Set((arr || []).map((s) => String(s)));

// ---------- CREATE ----------
router.post('/api/jobs', async (req, res) => {
  try {
    const parsed = CreateJobSchema.parse(req.body);

    const job_id_str = uuidv4();
    const job_id = types.Uuid.fromString(job_id_str);
    const now = new Date();

    const questions_json = (() => {
      if (parsed.questions_json != null) {
        return typeof parsed.questions_json === 'string'
          ? parsed.questions_json
          : JSON.stringify(parsed.questions_json);
      }
      if (parsed.questions != null) return JSON.stringify(parsed.questions);
      return '[]';
    })();

    const skillsArr = Array.isArray(parsed.skills) ? [...new Set(parsed.skills)] : [];

    const isOpenNow = String(parsed.status).toUpperCase() === 'OPEN';
    const published_at = isOpenNow && parsed.visible ? now : null;

    // ✅ LƯU Ý: thêm cột recruiter_id vào INSERT
    await client.execute(
      `INSERT INTO jobs_by_id (
    job_id, recruiter_id,
    title_vi, level,
    employment_type, work_type, address_line,
    province_code,                       -- 👈 thêm
    salary_vnd_min, salary_vnd_max, salary_negotiable, salary_gross,
    description_vi, requirements_vi, skills, exp_years_min,
    probation_months, working_hours, benefits,
    deadline, status, visible,
    questions_json, created_at, published_at, updated_at
  ) VALUES (
    ?, ?, ?, ?, ?, ?, ?,
    ?,                                 -- 👈 province_code
    ?, ?, ?, ?,
    ?, ?, ?, ?,
    ?, ?, ?,
    ?, ?, ?,
    ?, ?, ?, ?
  )`,
      [
        job_id,
        types.Uuid.fromString(parsed.recruiter_id),
        parsed.title_vi,
        parsed.level ?? null,
        parsed.employment_type ?? null,
        parsed.work_type ?? null,
        parsed.address_line ?? null,
        parsed.province_code ?? null, // 👈 bind value
        parsed.salary_vnd_min ?? null,
        parsed.salary_vnd_max ?? null,
        parsed.salary_negotiable ?? false,
        parsed.salary_gross ?? true,
        parsed.description_vi ?? null,
        parsed.requirements_vi ?? null,
        skillsArr,
        parsed.exp_years_min ?? null,
        parsed.probation_months ?? null,
        parsed.working_hours ?? null,
        parsed.benefits ?? null,
        parsed.deadline ? new Date(parsed.deadline) : null,
        parsed.status,
        parsed.visible,
        questions_json,
        now,
        published_at,
        now,
      ],
      { prepare: true }
    );

    // ✅ Đồng bộ bảng public (nếu OPEN + visible)
    if (shouldAppear({ status: parsed.status, visible: parsed.visible })) {
      await upsertPublicRow({
        job_id,
        status: parsed.status,
        visible: parsed.visible,
        published_at,
        title_vi: parsed.title_vi,
        level: parsed.level,
        work_type: parsed.work_type,
        employment_type: parsed.employment_type,
        salary_gross: parsed.salary_gross,
        salary_vnd_min: parsed.salary_vnd_min,
        salary_vnd_max: parsed.salary_vnd_max,
        address_line: parsed.address_line,
        province_code: parsed.province_code, // 👈 thêm
      });
    }

    // ✅ Đồng bộ bảng jobs_by_recruiter
    await upsertRecruiterRow({
      recruiter_id: types.Uuid.fromString(parsed.recruiter_id),
      created_at: now,
      job_id,
      status: parsed.status,
      title_vi: parsed.title_vi,
      visible: parsed.visible,
    });

    return res.status(201).json({ job_id: job_id_str, message: 'Job created' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid payload', details: err.flatten() });
    }
    console.error(err);
    return res.status(500).json({ error: 'Internal error' });
  }
});

// ---------- READ ----------
router.get('/api/jobs/:id', async (req, res) => {
  try {
    const id = types.Uuid.fromString(req.params.id);
    const r = await client.execute('SELECT * FROM jobs_by_id WHERE job_id = ?', [id], { prepare: true });
    if (r.rowLength === 0) return res.status(404).json({ error: 'Job not found' });

    const row = r.first();
    const job = {
      ...row,
      job_id: row.job_id.toString(),
      recruiter_id: row.recruiter_id?.toString(),
      skills: Array.from(row.skills || []),
      questions: row.questions_json ? JSON.parse(row.questions_json) : [],
    };
    return res.json(job);
  } catch (err) {
    console.error('Error fetching job:', err);
    return res.status(400).json({ error: 'Invalid job_id' });
  }
});

// GET all jobs (dev/admin) — paging via Cassandra pageState
router.get('/api/jobs', async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);
    const pageState = req.query.pageState || undefined;

    const result = await client.execute('SELECT * FROM jobs_by_id LIMIT ?', [limit], {
      prepare: true,
      fetchSize: limit,
      pageState,
    });

    const items = result.rows.map((r) => ({
      ...r,
      job_id: r.job_id?.toString(),
      recruiter_id: r.recruiter_id?.toString(),
      skills: Array.from(r.skills || []),
      questions: r.questions_json ? JSON.parse(r.questions_json) : [],
    }));

    return res.json({
      items,
      pageState: result.pageState || null, // dùng để gọi trang kế tiếp
    });
  } catch (err) {
    console.error('GET /api/jobs error:', err);
    return res.status(500).json({ error: 'Failed to list jobs' });
  }
});

// GET public jobs (status + visible)
router.get('/api/jobs/public', async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);
    const pageState = req.query.pageState || undefined;

    // mặc định chỉ show OPEN
    const status = (req.query.status || 'OPEN').toString().toUpperCase();
    const visible = true;

    const result = await client.execute(
      `SELECT job_id, title_vi, level, work_type, employment_type,
       salary_gross, salary_vnd_min, salary_vnd_max, address_line,
       published_at
      FROM jobs_by_status_visible   
       WHERE status = ? AND visible = ?
       LIMIT ?`,
      [status, visible, limit],
      { prepare: true, fetchSize: limit, pageState }
    );

    const items = result.rows.map((r) => ({
      ...r,
      job_id: r.job_id?.toString(),
    }));

    return res.json({
      items,
      pageState: result.pageState || null,
      status,
      visible,
    });
  } catch (err) {
    console.error('GET /api/jobs/public error:', err);
    return res.status(500).json({ error: 'Failed to list public jobs' });
  }
});

// ---------- UPDATE (PATCH) ----------
router.patch('/api/jobs/:id', async (req, res) => {
  try {
    const id = types.Uuid.fromString(req.params.id);

    // Lấy row cũ
    const oldRes = await client.execute('SELECT * FROM jobs_by_id WHERE job_id=?', [id], { prepare: true });
    if (oldRes.rowLength === 0) return res.status(404).json({ error: 'Job not found' });
    const oldRow = oldRes.first();

    const parsed = UpdateJobSchema.parse(req.body);
    const fields = { ...parsed };

    if (parsed.skills) fields.skills = Array.from(new Set(parsed.skills.map(String)));
    if (parsed.questions) fields.questions_json = JSON.stringify(parsed.questions);
    fields.updated_at = new Date();

    // Nếu từ NOT OPEN → OPEN && visible=true lần đầu ⇒ set published_at
    if (fields.status || fields.visible) {
      const nextStatus = fields.status ?? oldRow.status;
      const nextVisible = fields.visible ?? oldRow.visible;
      if (!shouldAppear(oldRow) && shouldAppear({ status: nextStatus, visible: nextVisible })) {
        if (!fields.published_at) fields.published_at = new Date();
      }
    }

    // Update bảng chính
    const { setSql, params, keys } = buildUpdate(fields);
    if (!setSql) return res.status(400).json({ error: 'No valid fields to update' });

    await client.execute(`UPDATE jobs_by_id SET ${setSql} WHERE job_id=?`, [...params, id], { prepare: true });

    // Lấy row mới
    const r2 = await client.execute('SELECT * FROM jobs_by_id WHERE job_id=?', [id], { prepare: true });
    const newRow = r2.first();

    // Đồng bộ bảng public
    await syncPublicView(oldRow, newRow);

    // ✅ Đồng bộ bảng jobs_by_recruiter
    const recruiterKeyChanged =
      String(oldRow.recruiter_id) !== String(newRow.recruiter_id) ||
      Number(oldRow.created_at) !== Number(newRow.created_at);

    if (recruiterKeyChanged) {
      await deleteRecruiterRow(oldRow); // đổi key → xoá key cũ
    }
    await upsertRecruiterRow(newRow); // upsert: title_vi/status/visible đổi sẽ được ghi đè

    return res.json({ message: 'Job updated', updated_fields: keys });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid payload', details: err.flatten() });
    }
    console.error('PATCH error:', err);
    return res.status(400).json({ error: 'Invalid request' });
  }
});

// ---------- DELETE ----------
router.delete('/api/jobs/:id', async (req, res) => {
  try {
    const id = types.Uuid.fromString(req.params.id);

    // 1) Lấy row cũ
    const r = await client.execute('SELECT * FROM jobs_by_id WHERE job_id=?', [id], { prepare: true });
    if (r.rowLength === 0) return res.status(404).json({ error: 'Job not found' });
    const row = r.first();

    // 2) Xoá bảng chính
    await client.execute('DELETE FROM jobs_by_id WHERE job_id=?', [id], { prepare: true });

    // 3) Xoá view public nếu đang public
    if (shouldAppear(row)) {
      await deletePublicRow(publicKey(row));
    }

    // 4) ✅ Xoá trong jobs_by_recruiter
    await deleteRecruiterRow(row);

    return res.json({ message: 'Đã xoá một job', job_id: id.toString() });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ error: 'Invalid job_id or request' });
  }
});

export default router;
