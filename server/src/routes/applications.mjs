// routes/applications.mjs
import express from 'express';
import { z } from 'zod';
import { types } from 'cassandra-driver';

import client from '../config/cassandra.mjs';
import {
  CreateApplicationSchema,
  GetOneSchema,
  ListQuerySchema,
  PatchSchema,
} from '../database/schemas/applicationValidationSchema.mjs';
import { toJsonString, rowToAppByJob, rowToAppByCandidate } from '../utils/applicationHelper.mjs';

const router = express.Router();

/* =========================
 * POST /api/applications
 *  - Tạo application và ghi vào 2 bảng
 * ========================= */
router.post('/api/applications', async (req, res) => {
  try {
    const parsed = CreateApplicationSchema.parse(req.body);

    const jobId = types.Uuid.fromString(parsed.job_id);
    const candidateId = types.Uuid.fromString(parsed.candidate_id);
    const appliedAt = new Date(); // thời điểm nộp
    const now = new Date();

    const answers_json = toJsonString(parsed.answers) ?? '[]';
    const feedback_json = toJsonString(parsed.feedback); // thường null khi tạo
    const status = parsed.status ?? 'active';

    const queries = [
      {
        query: `
          INSERT INTO applications_by_job
          (job_id, candidate_id, applied_at, status, answers_json, feedback_json, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        params: [jobId, candidateId, appliedAt, status, answers_json, feedback_json, now],
      },
      {
        query: `
          INSERT INTO applications_by_candidate
          (candidate_id, applied_at, job_id, status, answers_json, feedback_json, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        params: [candidateId, appliedAt, jobId, status, answers_json, feedback_json, now],
      },
    ];

    await client.batch(queries, { prepare: true });

    return res.status(201).json({
      message: 'Application created',
      job_id: parsed.job_id,
      candidate_id: parsed.candidate_id,
      applied_at: appliedAt.toISOString(),
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid payload', details: err.flatten() });
    }
    console.error('Error creating application:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/* =========================
 * GET /api/applications (list)
 *  - ?job_id=...   → list theo job
 *  - ?candidate_id=... → list theo candidate
 * ========================= */
router.get('/api/applications', async (req, res) => {
  try {
    const q = ListQuerySchema.parse(req.query);

    if (q.job_id) {
      const jobId = types.Uuid.fromString(q.job_id);
      const r = await client.execute(
        `SELECT job_id, candidate_id, applied_at, status, answers_json, feedback_json, updated_at
         FROM applications_by_job
         WHERE job_id = ?`,
        [jobId],
        { prepare: true }
      );
      return res.json(r.rows.map(rowToAppByJob));
    }

    if (q.candidate_id) {
      const candId = types.Uuid.fromString(q.candidate_id);
      const r = await client.execute(
        `SELECT candidate_id, applied_at, job_id, status, answers_json, feedback_json, updated_at
         FROM applications_by_candidate
         WHERE candidate_id = ?`,
        [candId],
        { prepare: true }
      );
      return res.json(r.rows.map(rowToAppByCandidate));
    }

    // Không vào được đây vì schema đã refine, nhưng để chắc chắn:
    return res.status(400).json({ error: 'Provide job_id or candidate_id' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid query', details: err.prettifyError() });
    }
    console.error('Error listing applications:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/* =========================
  * GET /api/applications/one
  *  - Lấy đúng 1 application theo composite key
  *  - query: job_id, candidate_id, applied_at
 * ========================= */
router.get('/api/applications/one', async (req, res) => {
  try {
    const { job_id, candidate_id, applied_at } = GetOneSchema.parse(req.query);

    const jobId = types.Uuid.fromString(job_id);
    const candId = types.Uuid.fromString(candidate_id);
    const appliedAt = new Date(applied_at);

    // Lấy từ bảng by_job
    const r = await client.execute(
      `SELECT job_id, candidate_id, applied_at, status, answers_json, feedback_json, updated_at
       FROM applications_by_job
       WHERE job_id = ? AND applied_at = ? AND candidate_id = ?`,
      [jobId, appliedAt, candId],
      { prepare: true }
    );

    if (r.rowLength === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    return res.json(rowToAppByJob(r.first()));
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid key', details: err.prettifyError() });
    }
    console.error('Error fetching application:', err);
    return res.status(400).json({ error: 'Invalid request' });
  }
});

/* =========================
 * PATCH /api/applications
 *  - Update status/feedback cho 1 application (đồng bộ 2 bảng)
 * ========================= */
router.patch('/api/applications', async (req, res) => {
  try {
    const parsed = PatchSchema.parse(req.body);

    const jobId = types.Uuid.fromString(parsed.job_id);
    const candId = types.Uuid.fromString(parsed.candidate_id);
    const appliedAt = new Date(parsed.applied_at);
    const now = new Date();

    const sets = [];
    const paramsJob = [];
    const paramsCand = [];

    if (parsed.status) {
      sets.push('status = ?');
      paramsJob.push(parsed.status);
      paramsCand.push(parsed.status);
    }
    if (parsed.feedback !== undefined) {
      sets.push('feedback_json = ?');
      const fj = toJsonString(parsed.feedback);
      paramsJob.push(fj);
      paramsCand.push(fj);
    }

    // luôn cập nhật updated_at
    sets.push('updated_at = ?');
    paramsJob.push(now);
    paramsCand.push(now);

    if (sets.length === 1) {
      return res.status(400).json({ error: 'No updatable fields provided' });
    }
    const setSql = sets.join(', ');

    const queries = [
      {
        query: `
          UPDATE applications_by_job
          SET ${setSql}
          WHERE job_id = ? AND applied_at = ? AND candidate_id = ?
        `,
        params: [...paramsJob, jobId, appliedAt, candId],
      },
      {
        query: `
          UPDATE applications_by_candidate
          SET ${setSql}
          WHERE candidate_id = ? AND applied_at = ? AND job_id = ?
        `,
        params: [...paramsCand, candId, appliedAt, jobId],
      },
    ];

    await client.batch(queries, { prepare: true });

    return res.json({
      message: 'Application updated',
      job_id: parsed.job_id,
      candidate_id: parsed.candidate_id,
      applied_at: appliedAt.toISOString(),
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid payload', details: err.prettifyError() });
    }
    console.error('Error updating application:', err);
    return res.status(400).json({ error: 'Invalid request' });
  }
});

export default router;
