import express from 'express';
import { types } from 'cassandra-driver';
import client from '../config/cassandra.mjs';
import { sendOfferEmail } from '../utils/emailHelper.mjs';
const router = express.Router();

/* ============================================================
 * GET /api/admin/shortlist?job_id=uuid
 * -> Lấy danh sách ứng viên có status = 'SHORTLIST' của job đó
 * ============================================================ */
router.get('/api/admin/shortlist', async (req, res) => {
  try {
    const { job_id } = req.query;
    console.log('Fetching shortlist for job_id:', job_id);
    if (!job_id) return res.status(400).json({ error: 'Thiếu job_id' });

    // Truy vấn tất cả đơn có trạng thái SHORTLIST của job này
    const appsRes = await client.execute(
      `SELECT candidate_id, applied_at, status
       FROM applications_by_job
       WHERE job_id = ? AND status = ?`,
      [job_id, 'shortlisted'],
      { prepare: true }
    );

    const shortlist = [];

    for (const app of appsRes.rows) {
      // Lấy thông tin ứng viên
      const userRes = await client.execute(
        `SELECT full_name, user_email FROM users_by_id WHERE user_id = ? LIMIT 1`,
        [app.candidate_id],
        { prepare: true }
      );
      const user = userRes.first();

      let matchScore = null;
      try {
        if (app.ai_match_result) {
          const parsed = JSON.parse(app.ai_match_result);
          matchScore = parsed.match_score || null;
        }
      } catch (_) {}

      shortlist.push({
        job_id,
        candidate_id: app.candidate_id,
        full_name: user?.full_name || 'N/A',
        user_email: user?.user_email || 'N/A',
        match_score: matchScore,
        applied_at: app.applied_at,
        status: app.status,
      });
    }

    res.json(shortlist);
  } catch (err) {
    console.error('❌ Error fetching shortlist:', err);
    res.status(500).json({ error: err.message });
  }
});

/* ============================================================
 * PATCH /api/admin/shortlist/decision
 * -> Admin ra quyết định (ACCEPTED / REJECTED)
 * -> Cập nhật status trong applications_by_job
 * ============================================================ */
router.patch('/api/admin/shortlist/decision', async (req, res) => {
  try {
    const { job_id, candidate_id, decision, applied_at } = req.body;
    if (!job_id || !candidate_id || !decision || !applied_at) {
      console.error('❌ Missing parameters in shortlist decision:', req.body);
      return res.status(400).json({ error: 'Thiếu dữ liệu bắt buộc (job_id, candidate_id, applied_at, decision)' });
    }

    const jobUuid = types.Uuid.fromString(job_id);
    const candidateUuid = types.Uuid.fromString(candidate_id);
    const updatedAt = new Date();
    const appliedAt = new Date(applied_at); // 🧠 parse timestamp

    await client.execute(
      `UPDATE applications_by_job
       SET status = ?, updated_at = ?
       WHERE job_id = ? AND applied_at = ? AND candidate_id = ?`,
      [decision, updatedAt, jobUuid, appliedAt, candidateUuid],
      { prepare: true }
    );

    // Gửi mail nếu ACCEPTED
    if (decision === 'hired' || decision === 'ACCEPTED') {
      const userRes = await client.execute(
        `SELECT full_name, user_email FROM users_by_id WHERE user_id = ? LIMIT 1`,
        [candidateUuid],
        { prepare: true }
      );
      const jobRes = await client.execute(`SELECT title_vi FROM jobs_by_id WHERE job_id = ? LIMIT 1`, [jobUuid], {
        prepare: true,
      });

      const user = userRes.first();
      const job = jobRes.first();

      if (user && job) {
        await sendOfferEmail(user.user_email, user.full_name, job.title_vi, process.env.MAIL_USER);
        console.log(`📧 Offer email sent to ${user.user_email}`);
      }
    }

    res.json({ message: '✅ Quyết định đã được ghi nhận', decision });
  } catch (err) {
    console.error('❌ Error updating shortlist decision:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
