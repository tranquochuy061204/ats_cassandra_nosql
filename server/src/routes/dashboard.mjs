import express from 'express';
import { types } from 'cassandra-driver';
import client from '../config/cassandra.mjs';

const router = express.Router();

/* ============================================================
 * GET /api/admin/dashboard
 * ============================================================ */
router.get('/api/admin/dashboard', async (req, res) => {
  try {
    // --- 1️⃣ Đếm tổng số job (visible=true)
    const jobsRes = await client.execute(
      `SELECT COUNT(*) FROM jobs_by_status_visible WHERE status='approved' AND visible=true ALLOW FILTERING`
    );

    // --- 2️⃣ Đếm tổng ứng viên / recruiter
    const candRes = await client.execute(`SELECT COUNT(*) FROM users_by_role WHERE role='candidate' ALLOW FILTERING`);
    const recRes = await client.execute(`SELECT COUNT(*) FROM users_by_role WHERE role='recruiter' ALLOW FILTERING`);

    // --- 3️⃣ Lấy danh sách application để thống kê
    const appsRes = await client.execute(`SELECT job_id, status, applied_at FROM applications_by_job`);

    const totalApplications = appsRes.rowLength;
    const apps = appsRes.rows;

    // --- 4️⃣ Phân tích status
    const statusCount = {};
    const jobCount = {};
    const dailyCount = {};

    for (const a of apps) {
      // status
      const st = a.status || 'UNKNOWN';
      statusCount[st] = (statusCount[st] || 0) + 1;

      // per job
      const job = a.job_id.toString();
      jobCount[job] = (jobCount[job] || 0) + 1;

      // per day
      const date = a.applied_at.toISOString().split('T')[0];
      dailyCount[date] = (dailyCount[date] || 0) + 1;
    }

    const jobRanking = Object.entries(jobCount)
      .map(([job_id, count]) => ({ job_id, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    res.json({
      stats: {
        totalJobs: parseInt(jobsRes.first()?.count || 0),
        totalCandidates: parseInt(candRes.first()?.count || 0),
        totalRecruiters: parseInt(recRes.first()?.count || 0),
        totalApplications,
      },
      statusCount,
      jobRanking,
      dailyCount,
    });
  } catch (err) {
    console.error('❌ Error fetching dashboard:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
