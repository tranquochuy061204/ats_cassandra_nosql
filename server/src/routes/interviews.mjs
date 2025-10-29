import express from 'express';
import { types } from 'cassandra-driver';
import client from '../config/cassandra.mjs';
import { sendInterviewNotificationEmail } from '../utils/emailHelper.mjs';

const router = express.Router();

/* ============================================================================
 *  POST /api/admin/interviews/schedule
 * ============================================================================
 *  - Dùng cho coordinator / recruiter lên lịch phỏng vấn.
 *  - Lưu record vào application_rounds_by_application
 *  - Cập nhật feedback_json trong applications_by_job
 *  - Gửi email tự động cho ứng viên
 * ============================================================================
 */
router.post('/api/admin/interviews/schedule', async (req, res) => {
  try {
    const {
      job_id,
      candidate_id,
      round_name,
      scheduled_at,
      interviewer_id,
      interviewer_name,
      meet_link,
      note,
      recruiter_email, // để gửi email từ ai
    } = req.body;

    if (!job_id || !candidate_id || !round_name || !scheduled_at)
      return res.status(400).json({ error: 'Thiếu dữ liệu bắt buộc.' });

    const jobUuid = types.Uuid.fromString(job_id);
    const candidateUuid = types.Uuid.fromString(candidate_id);

    /* ==================== 1️⃣ Ghi vào bảng vòng phỏng vấn ==================== */
    const insertQuery = `
      INSERT INTO application_rounds_by_application
      (job_id, candidate_id, round_name, round_order, scheduled_at, interviewer_id,
       interviewer_name, status, updated_at, meet_link, note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // lấy thứ tự vòng hiện tại
    const existingRounds = await client.execute(
      `SELECT round_order FROM application_rounds_by_application 
       WHERE job_id = ? AND candidate_id = ?`,
      [jobUuid, candidateUuid],
      { prepare: true }
    );
    const round_order = existingRounds.rowLength + 1;

    await client.execute(
      insertQuery,
      [
        jobUuid,
        candidateUuid,
        round_name,
        round_order,
        new Date(scheduled_at),
        interviewer_id ? types.Uuid.fromString(interviewer_id) : null,
        interviewer_name || null,
        'SCHEDULED',
        new Date(),
        meet_link || null,
        note || null,
      ],
      { prepare: true }
    );

    /* ==================== 2️⃣ Lấy applied_at ==================== */
    const appliedRes = await client.execute(
      `SELECT applied_at FROM applications_by_candidate_job 
       WHERE candidate_id = ? AND job_id = ? LIMIT 1`,
      [candidateUuid, jobUuid],
      { prepare: true }
    );

    const applied_at = appliedRes.first()?.applied_at;
    if (!applied_at) return res.status(404).json({ error: 'Không tìm thấy applied_at cho ứng viên.' });

    /* ==================== 3️⃣ Cập nhật feedback summary ==================== */
    const rounds = await client.execute(
      `SELECT round_name, status, score, scheduled_at 
       FROM application_rounds_by_application 
       WHERE job_id = ? AND candidate_id = ?`,
      [jobUuid, candidateUuid],
      { prepare: true }
    );

    const summary = {
      rounds_summary: rounds.rows.map((r) => ({
        name: r.round_name,
        status: r.status,
        score: r.score,
        scheduled_at: r.scheduled_at,
      })),
      final_status: 'SCHEDULED',
      last_feedback_at: new Date().toISOString(),
    };

    await client.execute(
      `UPDATE applications_by_job 
       SET feedback_json = ? 
       WHERE job_id = ? AND applied_at = ? AND candidate_id = ?`,
      [JSON.stringify(summary), jobUuid, applied_at, candidateUuid],
      { prepare: true }
    );

    /* ==================== 4️⃣ Lấy email ứng viên ==================== */
    const candidateRes = await client.execute(
      `SELECT full_name, user_email FROM users_by_id WHERE user_id = ? LIMIT 1`,
      [candidateUuid],
      { prepare: true }
    );

    if (candidateRes.rowLength === 0) return res.status(404).json({ error: 'Không tìm thấy thông tin ứng viên.' });

    const candidate = candidateRes.first();

    /* ==================== 5️⃣ Gửi email thông báo ==================== */
    await sendInterviewNotificationEmail(
      candidate.user_email,
      candidate.full_name,
      round_name,
      scheduled_at,
      interviewer_name,
      meet_link,
      recruiter_email
    );

    res.json({
      message: '✅ Lịch phỏng vấn đã được tạo và email thông báo đã gửi.',
      round_order,
      scheduled_at,
    });
  } catch (err) {
    console.error('❌ Lỗi khi tạo lịch phỏng vấn:', err);
    res.status(500).json({ error: err.message });
  }
});

/* ============================================================
 * GET /api/admin/interviews/rounds/:job_id/:candidate_id
 * Lấy danh sách vòng phỏng vấn (để hiển thị trong dropdown)
 * ============================================================ */
router.get('/api/admin/interviews/rounds/:job_id/:candidate_id', async (req, res) => {
  try {
    const { job_id, candidate_id } = req.params;
    const jobUuid = types.Uuid.fromString(job_id);
    const candidateUuid = types.Uuid.fromString(candidate_id);

    const result = await client.execute(
      `SELECT round_name, scheduled_at, interviewer_name, meet_link, note, status, round_order
       FROM application_rounds_by_application
       WHERE job_id = ? AND candidate_id = ?`,
      [jobUuid, candidateUuid],
      { prepare: true }
    );

    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching interview rounds:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
router.get('/api/admin/interviews/rounds/:job_id/:candidate_id', async (req, res) => {
  try {
    const { job_id, candidate_id } = req.params;
    const jobUuid = types.Uuid.fromString(job_id);
    const candidateUuid = types.Uuid.fromString(candidate_id);

    const result = await client.execute(
      `SELECT round_order, round_name, scheduled_at, interviewer_name, status
       FROM application_rounds_by_application
       WHERE job_id = ? AND candidate_id = ?`,
      [jobUuid, candidateUuid],
      { prepare: true }
    );

    // Trả về chỉ các vòng chưa được lên lịch
    const unscheduled = result.rows.filter((r) => !r.scheduled_at);
    res.json(unscheduled);
  } catch (err) {
    console.error('❌ Error fetching interview rounds:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ============================================================
 * POST /api/admin/interviews/rounds
 * Thêm vòng mới cho ứng viên
 * ============================================================ */
router.post('/api/admin/interviews/rounds', async (req, res) => {
  try {
    const { job_id, candidate_id, round_name } = req.body;
    if (!job_id || !candidate_id || !round_name)
      return res.status(400).json({ error: 'Thiếu job_id, candidate_id hoặc round_name' });

    const jobUuid = types.Uuid.fromString(job_id);
    const candidateUuid = types.Uuid.fromString(candidate_id);

    // Lấy round_order tiếp theo
    const existing = await client.execute(
      `SELECT round_order FROM application_rounds_by_application 
       WHERE job_id = ? AND candidate_id = ?`,
      [jobUuid, candidateUuid],
      { prepare: true }
    );
    const nextOrder = existing.rowLength + 1;

    await client.execute(
      `INSERT INTO application_rounds_by_application 
       (job_id, candidate_id, round_order, round_name, status, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [jobUuid, candidateUuid, nextOrder, round_name, 'PENDING', new Date()],
      { prepare: true }
    );

    res.json({ message: '✅ Đã thêm vòng phỏng vấn mới', round_name, round_order: nextOrder });
  } catch (err) {
    console.error('❌ Error creating interview round:', err);
    res.status(500).json({ error: err.message });
  }
});

router.patch('/api/admin/interviews/schedule', async (req, res) => {
  try {
    const { job_id, candidate_id, round_order, scheduled_at, interviewer_name, meet_link, note } = req.body;

    if (!job_id || !candidate_id || !round_order || !scheduled_at) {
      return res.status(400).json({ error: 'Thiếu dữ liệu bắt buộc' });
    }

    const jobUuid = types.Uuid.fromString(job_id);
    const candidateUuid = types.Uuid.fromString(candidate_id);
    const roundOrder = parseInt(round_order);
    const now = new Date();

    const query = `
      UPDATE application_rounds_by_application
      SET scheduled_at = ?, interviewer_name = ?, meet_link = ?, note = ?, status = ?, updated_at = ?
      WHERE job_id = ? AND candidate_id = ? AND round_order = ?
    `;

    await client.execute(
      query,
      [
        new Date(scheduled_at),
        interviewer_name,
        meet_link,
        note || null,
        'SCHEDULED',
        now,
        jobUuid,
        candidateUuid,
        roundOrder,
      ],
      { prepare: true }
    );

    res.json({ message: '✅ Đã lên lịch phỏng vấn thành công' });
  } catch (err) {
    console.error('❌ Error scheduling interview:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/api/admin/interviews/scheduled', async (req, res) => {
  try {
    const result = await client.execute(
      `SELECT job_id, candidate_id, round_name, scheduled_at, meet_link, note, status 
       FROM application_rounds_by_application 
       WHERE status = 'SCHEDULED' ALLOW FILTERING`
    );

    const detailed = await Promise.all(
      result.rows.map(async (r) => {
        const userRes = await client.execute(
          `SELECT full_name, user_email FROM users_by_id WHERE user_id = ? LIMIT 1`,
          [r.candidate_id],
          { prepare: true }
        );
        const jobRes = await client.execute(`SELECT title_vi FROM jobs_by_id WHERE job_id = ? LIMIT 1`, [r.job_id], {
          prepare: true,
        });

        return {
          candidate_name: userRes.first()?.full_name || 'N/A',
          candidate_email: userRes.first()?.user_email || 'N/A',
          job_title: jobRes.first()?.title_vi || 'N/A',
          scheduled_at: r.scheduled_at,
          meet_link: r.meet_link,
          note: r.note,
          status: r.status,
        };
      })
    );

    res.json(detailed);
  } catch (err) {
    console.error('❌ Error fetching scheduled interviews:', err);
    res.status(500).json({ error: err.message });
  }
});

/* ============================================================
 * DELETE /api/admin/interviews/schedule
 * Xóa lịch phỏng vấn của 1 vòng
 * ============================================================ */
router.delete('/api/admin/interviews/schedule', async (req, res) => {
  try {
    const { job_id, candidate_id, round_order } = req.body;

    if (!job_id || !candidate_id || round_order === undefined) {
      return res.status(400).json({ error: 'Thiếu job_id, candidate_id hoặc round_order' });
    }

    const jobUuid = types.Uuid.fromString(job_id);
    const candidateUuid = types.Uuid.fromString(candidate_id);

    // 1️⃣ Xóa vòng phỏng vấn
    await client.execute(
      `DELETE FROM application_rounds_by_application
       WHERE job_id = ? AND candidate_id = ? AND round_order = ?`,
      [jobUuid, candidateUuid, parseInt(round_order)],
      { prepare: true }
    );

    // 2️⃣ Lấy lại danh sách vòng còn lại để cập nhật feedback_json
    const remainingRounds = await client.execute(
      `SELECT round_name, status, score, scheduled_at
       FROM application_rounds_by_application
       WHERE job_id = ? AND candidate_id = ?`,
      [jobUuid, candidateUuid],
      { prepare: true }
    );

    // 3️⃣ Lấy applied_at để cập nhật bảng applications_by_job
    const appliedRes = await client.execute(
      `SELECT applied_at FROM applications_by_candidate_job
       WHERE candidate_id = ? AND job_id = ? LIMIT 1`,
      [candidateUuid, jobUuid],
      { prepare: true }
    );

    const applied_at = appliedRes.first()?.applied_at;
    if (applied_at) {
      const summary = {
        rounds_summary: remainingRounds.rows.map((r) => ({
          name: r.round_name,
          status: r.status,
          score: r.score,
          scheduled_at: r.scheduled_at,
        })),
        final_status: 'UPDATED_AFTER_DELETE',
        last_feedback_at: new Date().toISOString(),
      };

      await client.execute(
        `UPDATE applications_by_job
         SET feedback_json = ?
         WHERE job_id = ? AND applied_at = ? AND candidate_id = ?`,
        [JSON.stringify(summary), jobUuid, applied_at, candidateUuid],
        { prepare: true }
      );
    }

    res.json({ message: '🗑️ Đã xóa lịch phỏng vấn thành công' });
  } catch (err) {
    console.error('❌ Error deleting interview schedule:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
