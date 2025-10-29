import express from 'express';
import { types } from 'cassandra-driver';

import client from '../config/cassandra.mjs';
import { sendPassCvEmail } from '../utils/emailHelper.mjs';

const router = express.Router();

/* ============================================================================
 *  POST /api/application-rounds
 * ============================================================================ */
router.post('/api/application-rounds', async (req, res) => {
  try {
    const { job_id, candidate_id, round_name, round_order, scheduled_at, interviewer_id, interviewer_name } = req.body;
    if (!job_id || !candidate_id) return res.status(400).json({ error: 'Thiếu job_id hoặc candidate_id' });

    const insertQuery = `
      INSERT INTO application_rounds_by_application
      (job_id, candidate_id, round_name, round_order, scheduled_at,
       interviewer_id, interviewer_name, status, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await client.execute(
      insertQuery,
      [
        types.Uuid.fromString(job_id),
        types.Uuid.fromString(candidate_id),
        round_name,
        round_order,
        scheduled_at ? new Date(scheduled_at) : null,
        interviewer_id ? types.Uuid.fromString(interviewer_id) : null,
        interviewer_name || null,
        'SCHEDULED',
        new Date(),
      ],
      { prepare: true }
    );

    const rounds = await client.execute(
      `SELECT round_name, status, score FROM application_rounds_by_application 
       WHERE job_id = ? AND candidate_id = ?`,
      [types.Uuid.fromString(job_id), types.Uuid.fromString(candidate_id)],
      { prepare: true }
    );

    const summary = {
      rounds_summary: rounds.rows.map((r) => ({
        name: r.round_name,
        status: r.status,
        score: r.score,
      })),
      final_status: 'SCHEDULED',
      last_feedback_at: new Date().toISOString(),
    };

    const appliedRes = await client.execute(
      `SELECT applied_at FROM applications_by_candidate_job
       WHERE candidate_id = ? AND job_id = ? LIMIT 1`,
      [types.Uuid.fromString(candidate_id), types.Uuid.fromString(job_id)],
      { prepare: true }
    );
    const applied_at = appliedRes.first()?.applied_at;
    if (!applied_at) throw new Error('Không tìm thấy applied_at cho ứng viên này');

    await client.execute(
      `UPDATE applications_by_job
       SET feedback_json = ?
       WHERE job_id = ? AND applied_at = ? AND candidate_id = ?`,
      [JSON.stringify(summary), types.Uuid.fromString(job_id), applied_at, types.Uuid.fromString(candidate_id)],
      { prepare: true }
    );

    res.json({ message: '✅ Round created & feedback summary updated.' });
  } catch (err) {
    console.error('❌ Lỗi khi tạo vòng:', err.message, err.stack);
    res.status(500).json({ error: err.message });
  }
});

/* ============================================================================
 *  PATCH /api/application-rounds
 * ============================================================================ */
router.patch('/api/application-rounds', async (req, res) => {
  try {
    const { job_id, candidate_id, round_name, status, score, feedback_html, round_order } = req.body;
    if (!job_id || !candidate_id) return res.status(400).json({ error: 'Thiếu job_id hoặc candidate_id' });

    const jobUuid = types.Uuid.fromString(job_id);
    const candidateUuid = types.Uuid.fromString(candidate_id);

    // ✅ 1. Update hoặc Insert vòng hiện tại
    const updateQuery = `
      UPDATE application_rounds_by_application
      SET status = ?, score = ?, feedback_html = ?, updated_at = ?
      WHERE job_id = ? AND candidate_id = ? AND round_order = ?
    `;
    await client.execute(
      updateQuery,
      [status, score, feedback_html || null, new Date(), jobUuid, candidateUuid, round_order],
      { prepare: true }
    );

    // ✅ 2. Xử lý đặc biệt cho vòng CV Screening
    const appliedRes = await client.execute(
      `SELECT applied_at FROM applications_by_candidate_job
       WHERE candidate_id = ? AND job_id = ? LIMIT 1`,
      [candidateUuid, jobUuid],
      { prepare: true }
    );
    const applied_at = appliedRes.first()?.applied_at;
    if (!applied_at) throw new Error('Không tìm thấy applied_at cho ứng viên này');
    console.log('Thông tin vòng phỏng vấn:', { round_name, status });
    if (round_name === 'CV Screening') {
      if (status === 'PASSED') {
        // ➕ Tạo Technical Interview tiếp theo
        await client.execute(
          `INSERT INTO application_rounds_by_application
       (job_id, candidate_id, round_name, round_order, status, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
          [jobUuid, candidateUuid, 'Technical Interview', round_order + 1, 'SCHEDULED', new Date()],
          { prepare: true }
        );

        // 🔄 Update application status
        await client.execute(
          `UPDATE applications_by_job
       SET status = 'shortlisted'
       WHERE job_id = ? AND applied_at = ? AND candidate_id = ?`,
          [jobUuid, applied_at, candidateUuid],
          { prepare: true }
        );

        // ✉️ Gửi mail thông báo pass CV
        try {
          const candidateRes = await client.execute(
            `SELECT full_name, user_email FROM users_by_id WHERE user_id = ? LIMIT 1`,
            [candidateUuid],
            { prepare: true }
          );
          const candidate = candidateRes.first();

          const jobRes = await client.execute(
            `SELECT title_vi, recruiter_id FROM jobs_by_id WHERE job_id = ? LIMIT 1`,
            [jobUuid],
            { prepare: true }
          );
          const job = jobRes.first();

          const recruiterRes = await client.execute(
            `SELECT user_email FROM users_by_id WHERE user_id = ? LIMIT 1`,
            [job.recruiter_id],
            { prepare: true }
          );
          const recruiter = recruiterRes.first();
          job.recruiter_email = recruiter?.user_email;

          if (candidate?.user_email && job?.recruiter_email) {
            console.log(`✉️ Gửi mail PASS CV tới ${candidate.user_email}...`);
            await sendPassCvEmail(candidate.user_email, candidate.full_name, job.title_vi, job.recruiter_email);
            console.log(`📧 Đã gửi mail PASS CV tới ${candidate.user_email}`);
          } else {
            console.log('⚠️ Không thể gửi mail: thiếu user_email hoặc recruiter_email');
          }
        } catch (mailErr) {
          console.error('❌ Lỗi khi gửi mail thông báo pass CV:', mailErr);
        }
      } else if (status === 'REJECTED') {
        await client.execute(
          `UPDATE applications_by_job
       SET status = 'rejected'
       WHERE job_id = ? AND applied_at = ? AND candidate_id = ?`,
          [jobUuid, applied_at, candidateUuid],
          { prepare: true }
        );
      }
    }

    // ✅ 3. Load lại rounds để cập nhật summary
    const rounds = await client.execute(
      `SELECT round_name, status, score FROM application_rounds_by_application 
       WHERE job_id = ? AND candidate_id = ?`,
      [jobUuid, candidateUuid],
      { prepare: true }
    );

    const summary = {
      rounds_summary: rounds.rows.map((r) => ({
        name: r.round_name,
        status: r.status,
        score: r.score,
      })),
      final_status: status,
      last_feedback_at: new Date().toISOString(),
    };

    await client.execute(
      `UPDATE applications_by_job
       SET feedback_json = ?
       WHERE job_id = ? AND applied_at = ? AND candidate_id = ?`,
      [JSON.stringify(summary), jobUuid, applied_at, candidateUuid],
      { prepare: true }
    );

    res.json({ message: '✅ Round updated & summary refreshed', summary });
  } catch (err) {
    console.error('❌ Error updating round:', err.message, err.stack);
    res.status(500).json({ error: err.message });
  }
});

/* ============================================================================
 *  GET /api/application-rounds
 * ============================================================================ */
router.get('/api/application-rounds', async (req, res) => {
  try {
    const { job_id, candidate_id } = req.query;
    if (!job_id || !candidate_id) return res.status(400).json({ error: 'Thiếu job_id hoặc candidate_id' });

    const query = `
      SELECT * FROM application_rounds_by_application
      WHERE job_id = ? AND candidate_id = ?
      ORDER BY round_order ASC
    `;

    const result = await client.execute(query, [types.Uuid.fromString(job_id), types.Uuid.fromString(candidate_id)], {
      prepare: true,
    });

    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching rounds:', err.message, err.stack);
    res.status(500).json({ error: 'Không thể lấy danh sách vòng phỏng vấn.' });
  }
});

/* ============================================================================
 *  GET /api/application-rounds/summary
 * ============================================================================ */
router.get('/api/application-rounds/summary', async (req, res) => {
  try {
    const { job_id, candidate_id } = req.query;
    if (!job_id || !candidate_id) return res.status(400).json({ error: 'Thiếu job_id hoặc candidate_id' });

    const appliedRes = await client.execute(
      `SELECT applied_at FROM applications_by_candidate_job
       WHERE candidate_id = ? AND job_id = ? LIMIT 1`,
      [types.Uuid.fromString(candidate_id), types.Uuid.fromString(job_id)],
      { prepare: true }
    );
    const applied_at = appliedRes.first()?.applied_at;
    if (!applied_at) return res.status(404).json({ error: 'Không tìm thấy applied_at cho ứng viên này.' });

    const result = await client.execute(
      `SELECT feedback_json FROM applications_by_job
       WHERE job_id = ? AND applied_at = ? AND candidate_id = ? LIMIT 1`,
      [types.Uuid.fromString(job_id), applied_at, types.Uuid.fromString(candidate_id)],
      { prepare: true }
    );

    if (result.rowLength === 0) return res.status(404).json({ error: 'Không tìm thấy feedback cho ứng viên này.' });

    const feedbackJson = result.first()?.feedback_json;
    let feedback;
    try {
      feedback = JSON.parse(feedbackJson);
    } catch {
      feedback = null;
    }

    return res.json({
      job_id,
      candidate_id,
      summary: feedback || {
        rounds_summary: [],
        final_status: 'PENDING',
        last_feedback_at: null,
      },
    });
  } catch (err) {
    console.error('❌ Lỗi khi lấy feedback summary:', err.message, err.stack);
    res.status(500).json({ error: err.message });
  }
});

export default router;
