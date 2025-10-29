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
import ensureAuthenticated from '../middlewares/ensureAuthenticated.mjs';
import { getProvinceName, getDistrictName } from '../utils/locationHelper.mjs';
import { callAiMatchCV } from '../utils/aiHelper.mjs'; // file này sẽ gọi OpenAI hoặc local model

const router = express.Router();

/* ============================================================
 * POST /api/applications
 * - Tạo mới application (đồng bộ 3 bảng + bảng feed recent)
 * ============================================================ */
router.post('/api/applications', ensureAuthenticated, async (req, res) => {
  try {
    if (!req.user?.user_id) {
      return res.status(401).json({ error: 'Unauthorized: Missing session user' });
    }

    const parsed = CreateApplicationSchema.omit({ candidate_id: true }).parse(req.body);

    const jobId = types.Uuid.fromString(parsed.job_id);
    const candidateId = req.user.user_id; // Cassandra UUID
    const appliedAt = new Date();
    const now = new Date();

    // ✅ Kiểm tra ứng tuyển trùng
    const check = await client.execute(
      `SELECT job_id FROM applications_by_candidate_job WHERE candidate_id = ? AND job_id = ? LIMIT 1`,
      [candidateId, jobId],
      { prepare: true }
    );

    if (check.rowLength > 0) {
      return res.status(409).json({ error: 'Bạn đã ứng tuyển công việc này rồi' });
    }

    // ✅ Chuẩn bị dữ liệu
    const answers_json = toJsonString(parsed.answers) ?? '[]';
    const feedback_json = toJsonString(parsed.feedback);
    const status = parsed.status ?? 'PENDING';

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
      {
        query: `
          INSERT INTO applications_by_candidate_job
          (candidate_id, job_id, applied_at)
          VALUES (?, ?, ?)
        `,
        params: [candidateId, jobId, appliedAt],
      },
    ];

    // ✅ Lấy recruiter_id để insert vào bảng recent
    const jobResult = await client.execute(`SELECT recruiter_id FROM jobs_by_id WHERE job_id = ? LIMIT 1`, [jobId], {
      prepare: true,
    });
    const recruiterId = jobResult.first()?.recruiter_id;
    if (recruiterId) {
      queries.push({
        query: `
          INSERT INTO applications_recent
          (recruiter_id, applied_at, job_id, candidate_id, status, answers_json)
          VALUES (?, ?, ?, ?, ?, ?)
        `,
        params: [recruiterId, appliedAt, jobId, candidateId, status, answers_json],
      });
    }

    await client.batch(queries, { prepare: true });

    return res.status(201).json({
      message: 'Application created successfully',
      job_id: parsed.job_id,
      candidate_id: candidateId.toString(),
      applied_at: appliedAt.toISOString(),
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid payload', details: err.flatten() });
    }
    console.error('❌ Error creating application:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/* ============================================================
 * GET /api/applications
 * - List theo job_id hoặc candidate_id
 * ============================================================ */
router.get('/api/applications', async (req, res) => {
  try {
    const { job_id, candidate_id } = req.query;

    // --- Truy vấn theo job_id ---
    if (job_id) {
      const results = await client.execute(
        'SELECT * FROM applications_by_job WHERE job_id = ?',
        [types.Uuid.fromString(job_id)],
        { prepare: true }
      );

      const rows = await Promise.all(
        results.rows.map(async (app) => {
          try {
            const userRes = await client.execute(
              'SELECT full_name, address, district_code, province_code FROM users_by_id WHERE user_id = ?',
              [app.candidate_id],
              { prepare: true }
            );

            const user = userRes.rows[0] || {};
            const provinceName = await getProvinceName(user.province_code);
            const districtName = await getDistrictName(user.district_code);

            return {
              ...app,
              candidate_full_name: user.full_name || 'Không rõ',
              candidate_address_line: user.address || null,
              candidate_district: districtName || null,
              candidate_province: provinceName || null,
            };
          } catch {
            return { ...app, candidate_full_name: 'Không rõ' };
          }
        })
      );

      return res.json(rows);
    }

    // --- Truy vấn theo candidate_id ---
    if (candidate_id) {
      const results = await client.execute(
        'SELECT * FROM applications_by_candidate WHERE candidate_id = ?',
        [types.Uuid.fromString(candidate_id)],
        { prepare: true }
      );

      if (results.rowLength === 0) return res.json([]);

      const rows = await Promise.all(
        results.rows.map(async (app) => {
          try {
            const jobRes = await client.execute(
              'SELECT title_vi, province_code, district_code FROM jobs_by_id WHERE job_id = ?',
              [app.job_id],
              { prepare: true }
            );
            const job = jobRes.rows[0] || {};
            const provinceName = await getProvinceName(job.province_code);
            const districtName = await getDistrictName(job.district_code);

            return {
              ...app,
              job_title: job.title_vi || 'Không rõ',
              job_province: provinceName || null,
              job_district: districtName || null,
            };
          } catch {
            return { ...app, job_title: 'Không rõ' };
          }
        })
      );

      return res.json(rows);
    }

    // --- Nếu không có cả job_id lẫn candidate_id ---
    return res.status(400).json({ error: 'Missing job_id hoặc candidate_id' });
  } catch (err) {
    console.error('❌ Lỗi khi lấy danh sách applications:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ============================================================
 * GET /api/applications/one
 * ============================================================ */
router.get('/api/applications/one', async (req, res) => {
  try {
    const { job_id, candidate_id, applied_at } = GetOneSchema.parse(req.query);

    const jobId = types.Uuid.fromString(job_id);
    const candId = types.Uuid.fromString(candidate_id);
    const appliedAt = new Date(applied_at);

    const r = await client.execute(
      `SELECT job_id, candidate_id, applied_at, status, answers_json, feedback_json, updated_at
       FROM applications_by_job
       WHERE job_id = ? AND applied_at = ? AND candidate_id = ?`,
      [jobId, appliedAt, candId],
      { prepare: true }
    );

    if (r.rowLength === 0) return res.status(404).json({ error: 'Application not found' });

    return res.json(rowToAppByJob(r.first()));
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid key', details: err.flatten() });
    }
    console.error('❌ Error fetching application:', err);
    return res.status(400).json({ error: 'Invalid request' });
  }
});

// --- GET ứng viên chi tiết ---
router.get('/api/admin/candidates/:id', async (req, res) => {
  try {
    const userId = types.Uuid.fromString(req.params.id);
    const result = await client.execute(
      `SELECT user_id, full_name, user_email, gender, address, province_code, district_code, cv_url
       FROM users_by_id WHERE user_id = ?`,
      [userId],
      { prepare: true }
    );

    if (result.rowLength === 0) return res.status(404).json({ error: 'Candidate not found' });

    const u = result.first();
    res.json({
      user_id: u.user_id.toString(),
      full_name: u.full_name,
      user_email: u.user_email,
      gender: u.gender,
      address: u.address,
      province_code: u.province_code,
      district_code: u.district_code,
      cv_url: u.cv_url,
    });
  } catch (err) {
    res.status(400).json({ error: 'Invalid candidate ID' });
  }
});

// --- GET công việc chi tiết ---
router.get('/api/admin/jobs/:id', async (req, res) => {
  try {
    const jobId = types.Uuid.fromString(req.params.id);
    const r = await client.execute('SELECT * FROM jobs_by_id WHERE job_id = ?', [jobId], { prepare: true });
    if (r.rowLength === 0) return res.status(404).json({ error: 'Job not found' });

    const r2 = await client.execute('SELECT * FROM applications_by_job WHERE job_id = ?', [jobId], { prepare: true });
    if (r2.rowLength === 0) return res.status(404).json({ error: 'No applications found for this job' });

    const j = r.first();
    const j2 = r2.first();
    res.json({
      job_id: j.job_id.toString(),
      title_vi: j.title_vi,
      level: j.level,
      work_type: j.work_type,
      employment_type: j.employment_type,
      salary_vnd_min: j.salary_vnd_min,
      salary_vnd_max: j.salary_vnd_max,
      salary_gross: j.salary_gross,
      description_vi: j.description_vi,
      requirements_vi: j.requirements_vi,
      skills: Array.from(j.skills || []),
      address_line: j.address_line,
      province_code: j.province_code,
      questions_json: j.questions_json,
      answers: j2.answers_json,
    });
  } catch {
    res.status(400).json({ error: 'Invalid job ID' });
  }
});

router.get('/api/admin/applications', async (req, res) => {
  try {
    const { job_id } = req.query;
    if (!job_id) {
      return res.status(400).json({ error: 'Missing job_id' });
    }

    const result = await client.execute(
      'SELECT * FROM applications_by_job WHERE job_id = ?',
      [types.Uuid.fromString(job_id)],
      { prepare: true }
    );

    if (result.rowLength === 0) return res.json([]);

    // --- Fetch thông tin ứng viên ---
    const rows = await Promise.all(
      result.rows.map(async (app) => {
        const userRes = await client.execute(
          'SELECT full_name FROM users_by_id WHERE user_id = ?',
          [app.candidate_id],
          { prepare: true }
        );
        const fullName = userRes.rows[0]?.full_name || '(Ứng viên ẩn danh)';
        return { ...app, candidate_full_name: fullName };
      })
    );

    // --- Sắp xếp theo applied_at DESC ---
    rows.sort((a, b) => b.applied_at - a.applied_at);

    res.json(rows);
  } catch (err) {
    console.error('❌ Error fetching admin applications:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ============================================================
 * PATCH /api/applications
 * - Update status / feedback (đồng bộ 3 bảng + recent)
 * ============================================================ */
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
      {
        query: `
          UPDATE applications_by_candidate_job
          SET applied_at = ?
          WHERE candidate_id = ? AND job_id = ?
        `,
        params: [appliedAt, candId, jobId],
      },
    ];

    // ✅ Cập nhật bảng recent
    const jobResult = await client.execute(`SELECT recruiter_id FROM jobs_by_id WHERE job_id = ? LIMIT 1`, [jobId], {
      prepare: true,
    });
    const recruiterId = jobResult.first()?.recruiter_id;

    if (recruiterId && parsed.status) {
      queries.push({
        query: `
          UPDATE applications_recent
          SET status = ?
          WHERE recruiter_id = ? AND applied_at = ? AND job_id = ? AND candidate_id = ?
        `,
        params: [parsed.status, recruiterId, appliedAt, jobId, candId],
      });
    }

    await client.batch(queries, { prepare: true });

    return res.json({
      message: 'Application updated successfully',
      job_id: parsed.job_id,
      candidate_id: parsed.candidate_id,
      applied_at: appliedAt.toISOString(),
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid payload', details: err.flatten() });
    }
    console.error('❌ Error updating application:', err);
    return res.status(400).json({ error: 'Invalid request' });
  }
});

/* ============================================================
 * GET /api/applications/recent
 * - Feed view: lấy danh sách ứng tuyển mới nhất
 * ============================================================ */
router.get('/api/admin/applications/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const recruiterId = req.query.recruiter_id;

    if (!recruiterId) {
      return res.status(400).json({ error: 'Missing recruiter_id' });
    }

    // --- 1️⃣ Lấy danh sách đơn ứng tuyển mới nhất ---
    const r = await client.execute(
      `SELECT recruiter_id, applied_at, job_id, candidate_id, status, answers_json
       FROM applications_recent
       WHERE recruiter_id = ?
       LIMIT ?`,
      [types.Uuid.fromString(recruiterId), limit],
      { prepare: true }
    );

    if (r.rowLength === 0) {
      return res.json([]);
    }

    const rows = r.rows;

    // --- 2️⃣ Lấy danh sách job_id và candidate_id duy nhất ---
    const jobIds = [...new Set(rows.map((row) => row.job_id.toString()))];
    const candidateIds = [...new Set(rows.map((row) => row.candidate_id.toString()))];

    // --- 3️⃣ Fetch thông tin công việc ---
    const jobMap = new Map();
    if (jobIds.length > 0) {
      const jobResults = await Promise.all(
        jobIds.map((id) =>
          client.execute(
            `SELECT job_id, title_vi FROM jobs_by_id WHERE job_id = ? LIMIT 1`,
            [types.Uuid.fromString(id)],
            { prepare: true }
          )
        )
      );
      for (const jr of jobResults) {
        if (jr.rowLength > 0) {
          const j = jr.first();
          jobMap.set(j.job_id.toString(), j.title_vi);
        }
      }
    }

    // --- 4️⃣ Fetch thông tin ứng viên ---
    const candidateMap = new Map();
    if (candidateIds.length > 0) {
      const userResults = await Promise.all(
        candidateIds.map((id) =>
          client.execute(
            `SELECT user_id, full_name FROM users_by_id WHERE user_id = ? LIMIT 1`,
            [types.Uuid.fromString(id)],
            { prepare: true }
          )
        )
      );
      for (const ur of userResults) {
        if (ur.rowLength > 0) {
          const u = ur.first();
          candidateMap.set(u.user_id.toString(), u.full_name);
        }
      }
    }

    // --- 5️⃣ Gộp dữ liệu ---
    const enriched = rows.map((row) => ({
      recruiter_id: row.recruiter_id.toString(),
      applied_at: row.applied_at,
      candidate_id: row.candidate_id.toString(),
      candidate_name: candidateMap.get(row.candidate_id.toString()) || '(Ứng viên ẩn danh)',
      job_id: row.job_id.toString(),
      job_title: jobMap.get(row.job_id.toString()) || '(Công việc đã xóa)',
      status: row.status,
      answers_json: row.answers_json,
      application_id: `${row.job_id}_${row.candidate_id}_${row.applied_at.getTime()}`,
    }));

    // --- 6️⃣ Sắp xếp theo applied_at DESC ---
    enriched.sort((a, b) => b.applied_at - a.applied_at);

    return res.json(enriched);
  } catch (err) {
    console.error('❌ Error fetching recent applications:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// utils
// 🎯 AI đánh giá độ match giữa job và CV
// 🎯 AI đánh giá độ match giữa job và CV + cache kết quả
router.get('/api/applications/ai-match', async (req, res) => {
  try {
    const { job_id, candidate_id, applied_at } = req.query;
    if (!job_id || !candidate_id || !applied_at) {
      return res.status(400).json({ error: 'Thiếu job_id, candidate_id hoặc applied_at' });
    }

    const jobId = types.Uuid.fromString(job_id);
    const candId = types.Uuid.fromString(candidate_id);
    const appliedAt = new Date(applied_at);

    // 🔹 1️⃣ Kiểm tra cache trong applications_by_job
    const cacheCheck = await client.execute(
      `SELECT ai_match_result FROM applications_by_job 
       WHERE job_id = ? AND candidate_id = ? AND applied_at = ? LIMIT 1`,
      [jobId, candId, appliedAt],
      { prepare: true }
    );

    const cached = cacheCheck.rows[0]?.ai_match_result;
    if (cached) {
      console.log('💾 Dùng lại cache AI match từ DB');
      const parsed = JSON.parse(cached);
      return res.json({
        candidate_id,
        job_id,
        applied_at,
        cached: true,
        match_score: parsed.score,
        analysis: parsed.analysis,
      });
    }

    // 🔹 2️⃣ Lấy job info
    const jobRes = await client.execute(
      `SELECT title_vi, description_vi, requirements_vi, skills 
       FROM jobs_by_id WHERE job_id = ? LIMIT 1`,
      [jobId],
      { prepare: true }
    );
    if (jobRes.rowLength === 0) return res.status(404).json({ error: 'Không tìm thấy công việc' });
    const job = jobRes.first();

    // 🔹 3️⃣ Lấy candidate info
    const userRes = await client.execute(
      `SELECT full_name, cv_url FROM users_by_id WHERE user_id = ? LIMIT 1`,
      [candId],
      { prepare: true }
    );
    if (userRes.rowLength === 0) return res.status(404).json({ error: 'Không tìm thấy ứng viên' });
    const user = userRes.first();

    // 🔹 4️⃣ Gọi AI
    console.log(`🤖 Gọi Gemini để phân tích CV cho ${user.full_name}...`);
    const aiResult = await callAiMatchCV({
      cvUrl: user.cv_url,
      jobTitle: job.title_vi,
      jobRequirements: job.requirements_vi || job.description_vi,
      jobSkills: Array.from(job.skills || []),
    });

    // 🔹 5️⃣ Lưu cache lại
    const aiJson = JSON.stringify(aiResult);
    await client.execute(
      `UPDATE applications_by_job 
       SET ai_match_result = ? 
       WHERE job_id = ? AND candidate_id = ? AND applied_at = ?`,
      [aiJson, jobId, candId, appliedAt],
      { prepare: true }
    );
    console.log('✅ Lưu cache AI match vào DB thành công');

    // 🔹 6️⃣ Trả kết quả
    return res.json({
      candidate_id,
      candidate_name: user.full_name,
      job_id,
      job_title: job.title_vi,
      match_score: aiResult.score,
      analysis: aiResult.analysis,
      cached: false,
    });
  } catch (err) {
    console.error('❌ Lỗi khi phân tích AI match CV:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ============================================================
 * GET /api/admin/applications/shortlisted/:job_id
 * - Lấy danh sách ứng viên shortlisted theo job
 * ============================================================ */
router.get('/api/admin/applications/shortlisted/:job_id', async (req, res) => {
  try {
    const { job_id } = req.params;
    const jobUuid = types.Uuid.fromString(job_id);

    // Lấy toàn bộ ứng tuyển theo job_id
    const result = await client.execute(
      `SELECT candidate_id, applied_at, status
       FROM applications_by_job
       WHERE job_id = ?`,
      [jobUuid],
      { prepare: true }
    );

    if (result.rowLength === 0) return res.json([]);

    // Lọc shortlist
    const shortlisted = result.rows.filter((r) => r.status === 'shortlisted');

    // Lấy thông tin ứng viên tương ứng
    const users = await Promise.all(
      shortlisted.map(async (app) => {
        const userRes = await client.execute(
          `SELECT full_name, user_email FROM users_by_id WHERE user_id = ? LIMIT 1`,
          [app.candidate_id],
          { prepare: true }
        );
        const u = userRes.first() || {};
        return {
          candidate_id: app.candidate_id.toString(),
          full_name: u.full_name || 'Không rõ',
          user_email: u.user_email || 'N/A',
          applied_at: app.applied_at,
          status: app.status,
        };
      })
    );

    res.json(users);
  } catch (err) {
    console.error('❌ Error fetching shortlisted candidates:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ============================================================
 * DELETE /api/applications
 * - Xoá toàn bộ dữ liệu liên quan đến 1 application
 * ============================================================ */
router.delete('/api/applications', async (req, res) => {
  try {
    const { job_id, candidate_id, applied_at } = req.query;
    if (!job_id || !candidate_id || !applied_at) {
      return res.status(400).json({ error: 'Thiếu job_id, candidate_id hoặc applied_at' });
    }

    const jobUuid = types.Uuid.fromString(job_id);
    const candidateUuid = types.Uuid.fromString(candidate_id);
    const appliedAt = new Date(applied_at);

    // 🔍 Xác thực có tồn tại
    const check = await client.execute(
      `SELECT * FROM applications_by_job 
       WHERE job_id = ? AND candidate_id = ? AND applied_at = ? LIMIT 1`,
      [jobUuid, candidateUuid, appliedAt],
      { prepare: true }
    );
    if (check.rowLength === 0) return res.status(404).json({ error: 'Không tìm thấy đơn ứng tuyển này' });

    // 🧩 Xoá khỏi các bảng chính
    const queries = [
      {
        query: `DELETE FROM applications_by_job WHERE job_id = ? AND applied_at = ? AND candidate_id = ?`,
        params: [jobUuid, appliedAt, candidateUuid],
      },
      {
        query: `DELETE FROM applications_by_candidate WHERE candidate_id = ? AND applied_at = ? AND job_id = ?`,
        params: [candidateUuid, appliedAt, jobUuid],
      },
      {
        query: `DELETE FROM applications_by_candidate_job WHERE candidate_id = ? AND job_id = ?`,
        params: [candidateUuid, jobUuid],
      },
      {
        query: `DELETE FROM application_rounds_by_application WHERE job_id = ? AND candidate_id = ?`,
        params: [jobUuid, candidateUuid],
      },
    ];

    // 🧠 Xoá thêm trong bảng recent nếu có recruiter_id
    const jobRes = await client.execute(`SELECT recruiter_id FROM jobs_by_id WHERE job_id = ? LIMIT 1`, [jobUuid], {
      prepare: true,
    });
    const recruiterId = jobRes.first()?.recruiter_id;
    if (recruiterId) {
      queries.push({
        query: `DELETE FROM applications_recent 
                 WHERE recruiter_id = ? AND applied_at = ? AND job_id = ? AND candidate_id = ?`,
        params: [recruiterId, appliedAt, jobUuid, candidateUuid],
      });
    }

    await client.batch(queries, { prepare: true });
    console.log(`🗑️ Đã xoá application của candidate ${candidate_id} khỏi job ${job_id}`);

    return res.json({ message: 'Đã xoá đơn ứng tuyển và dữ liệu liên quan thành công' });
  } catch (err) {
    console.error('❌ Lỗi khi xoá application:', err);
    res.status(500).json({ error: 'Lỗi khi xoá đơn ứng tuyển' });
  }
});

export default router;
