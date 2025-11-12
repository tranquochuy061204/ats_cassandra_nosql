import express from 'express';
import { types } from 'cassandra-driver';
import client from '../config/cassandra.mjs';

const router = express.Router();

/* ============================================================
 * GET /api/admin/dashboard
 * Enhanced dashboard with comprehensive statistics
 * ============================================================ */
router.get('/api/admin/dashboard', async (req, res) => {
  try {
    const { recruiter_id } = req.query;

    // --- 1️⃣ Thống kê tổng quan ---
    const [jobsRes, candRes, recRes, coordRes] = await Promise.all([
      client.execute(`SELECT COUNT(*) as count FROM jobs_by_id`),
      client.execute(`SELECT COUNT(*) as count FROM users_by_role WHERE role='candidate' ALLOW FILTERING`),
      client.execute(`SELECT COUNT(*) as count FROM users_by_role WHERE role='recruiter' ALLOW FILTERING`),
      client.execute(`SELECT COUNT(*) as count FROM users_by_role WHERE role='coordinator' ALLOW FILTERING`),
    ]);

    // --- 2️⃣ Lấy applications (filter theo recruiter nếu có) ---
    let appsQuery = `SELECT job_id, candidate_id, status, applied_at FROM applications_by_job`;
    let appsParams = [];

    if (recruiter_id) {
      // Lấy danh sách job_id của recruiter
      const recruiterJobs = await client.execute(
        `SELECT job_id FROM jobs_by_id WHERE recruiter_id = ? ALLOW FILTERING`,
        [types.Uuid.fromString(recruiter_id)],
        { prepare: true }
      );

      if (recruiterJobs.rowLength === 0) {
        return res.json({
          stats: {
            totalJobs: 0,
            totalCandidates: parseInt(candRes.first()?.count || 0),
            totalRecruiters: parseInt(recRes.first()?.count || 0),
            totalCoordinators: parseInt(coordRes.first()?.count || 0),
            totalApplications: 0,
            activeApplications: 0,
            shortlistedApplications: 0,
            rejectedApplications: 0,
            hiredApplications: 0,
          },
          recentActivity: [],
          topJobs: [],
          applicationTrend: [],
          statusDistribution: [],
          jobStatusDistribution: [],
          conversionRate: 0,
        });
      }
    }

    const appsRes = await client.execute(appsQuery, appsParams);
    const apps = appsRes.rows;

    // --- 3️⃣ Phân tích dữ liệu ---
    const statusCount = {
      PENDING: 0,
      active: 0,
      shortlisted: 0,
      rejected: 0,
      hired: 0,
    };

    const jobCount = {};
    const dailyCount = {};
    const monthlyCount = {};

    for (const app of apps) {
      // Filter theo recruiter nếu có
      if (recruiter_id) {
        const jobCheck = await client.execute(
          `SELECT recruiter_id FROM jobs_by_id WHERE job_id = ? LIMIT 1`,
          [app.job_id],
          { prepare: true }
        );
        if (jobCheck.rowLength === 0 || jobCheck.first().recruiter_id?.toString() !== recruiter_id) {
          continue;
        }
      }

      // Status count
      const status = app.status || 'PENDING';
      statusCount[status] = (statusCount[status] || 0) + 1;

      // Job count
      const jobId = app.job_id.toString();
      jobCount[jobId] = (jobCount[jobId] || 0) + 1;

      // Daily trend (last 30 days)
      const date = app.applied_at.toISOString().split('T')[0];
      dailyCount[date] = (dailyCount[date] || 0) + 1;

      // Monthly trend
      const month = app.applied_at.toISOString().slice(0, 7);
      monthlyCount[month] = (monthlyCount[month] || 0) + 1;
    }

    // --- 4️⃣ Top 5 jobs ---
    const topJobIds = Object.entries(jobCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([job_id]) => job_id);

    const topJobs = await Promise.all(
      topJobIds.map(async (job_id) => {
        try {
          const jobRes = await client.execute(
            `SELECT job_id, title_vi, status FROM jobs_by_id WHERE job_id = ? LIMIT 1`,
            [types.Uuid.fromString(job_id)],
            { prepare: true }
          );
          const job = jobRes.first();
          return {
            job_id,
            title: job?.title_vi || 'Unknown Job',
            status: job?.status || 'UNKNOWN',
            applications: jobCount[job_id],
          };
        } catch {
          return {
            job_id,
            title: 'Unknown Job',
            status: 'UNKNOWN',
            applications: jobCount[job_id],
          };
        }
      })
    );

    // --- 5️⃣ Recent activity (last 10 applications) ---
    const recentApps = apps.sort((a, b) => b.applied_at - a.applied_at).slice(0, 10);

    const recentActivity = await Promise.all(
      recentApps.map(async (app) => {
        try {
          const [candidateRes, jobRes] = await Promise.all([
            client.execute(`SELECT full_name FROM users_by_id WHERE user_id = ? LIMIT 1`, [app.candidate_id], {
              prepare: true,
            }),
            client.execute(`SELECT title_vi FROM jobs_by_id WHERE job_id = ? LIMIT 1`, [app.job_id], { prepare: true }),
          ]);

          return {
            candidate_name: candidateRes.first()?.full_name || 'Unknown',
            job_title: jobRes.first()?.title_vi || 'Unknown Job',
            status: app.status,
            applied_at: app.applied_at,
          };
        } catch {
          return {
            candidate_name: 'Unknown',
            job_title: 'Unknown Job',
            status: app.status,
            applied_at: app.applied_at,
          };
        }
      })
    );

    // --- 6️⃣ Application trend (last 30 days) ---
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date.toISOString().split('T')[0];
    });

    const applicationTrend = last30Days.map((date) => ({
      date,
      count: dailyCount[date] || 0,
    }));

    // --- 7️⃣ Status distribution for charts ---
    const statusDistribution = Object.entries(statusCount).map(([status, count]) => ({
      status,
      count,
      percentage: apps.length > 0 ? ((count / apps.length) * 100).toFixed(1) : 0,
    }));

    // --- 8️⃣ Job status distribution ---
    const allJobs = await client.execute(
      recruiter_id
        ? `SELECT status FROM jobs_by_id WHERE recruiter_id = ? ALLOW FILTERING`
        : `SELECT status FROM jobs_by_id`,
      recruiter_id ? [types.Uuid.fromString(recruiter_id)] : []
    );

    const jobStatusCount = {};
    allJobs.rows.forEach((job) => {
      const status = job.status || 'DRAFT';
      jobStatusCount[status] = (jobStatusCount[status] || 0) + 1;
    });

    const jobStatusDistribution = Object.entries(jobStatusCount).map(([status, count]) => ({
      status,
      count,
    }));

    // --- 9️⃣ Conversion rate (shortlisted/hired vs total) ---
    const totalApps = apps.length;
    const convertedApps = (statusCount.shortlisted || 0) + (statusCount.hired || 0);
    const conversionRate = totalApps > 0 ? ((convertedApps / totalApps) * 100).toFixed(1) : 0;

    // --- 🔟 Response ---
    res.json({
      stats: {
        totalJobs: recruiter_id ? allJobs.rowLength : parseInt(jobsRes.first()?.count || 0),
        totalCandidates: parseInt(candRes.first()?.count || 0),
        totalRecruiters: parseInt(recRes.first()?.count || 0),
        totalCoordinators: parseInt(coordRes.first()?.count || 0),
        totalApplications: totalApps,
        activeApplications: (statusCount.PENDING || 0) + (statusCount.active || 0),
        shortlistedApplications: statusCount.shortlisted || 0,
        rejectedApplications: statusCount.rejected || 0,
        hiredApplications: statusCount.hired || 0,
      },
      recentActivity,
      topJobs,
      applicationTrend,
      statusDistribution,
      jobStatusDistribution,
      conversionRate: parseFloat(conversionRate),
    });
  } catch (err) {
    console.error('❌ Error fetching dashboard:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ============================================================
 * GET /api/admin/dashboard/analytics
 * Advanced analytics endpoint
 * ============================================================ */
router.get('/api/admin/dashboard/analytics', async (req, res) => {
  try {
    const { recruiter_id, start_date, end_date } = req.query;

    let query = `SELECT job_id, candidate_id, status, applied_at FROM applications_by_job`;
    const params = [];

    const apps = await client.execute(query, params);

    // Filter by date range if provided
    let filteredApps = apps.rows;
    if (start_date && end_date) {
      const start = new Date(start_date);
      const end = new Date(end_date);
      filteredApps = apps.rows.filter((app) => {
        const appDate = new Date(app.applied_at);
        return appDate >= start && appDate <= end;
      });
    }

    // Filter by recruiter if provided
    if (recruiter_id) {
      const recruiterJobIds = await client.execute(
        `SELECT job_id FROM jobs_by_id WHERE recruiter_id = ? ALLOW FILTERING`,
        [types.Uuid.fromString(recruiter_id)],
        { prepare: true }
      );
      const jobIds = new Set(recruiterJobIds.rows.map((r) => r.job_id.toString()));
      filteredApps = filteredApps.filter((app) => jobIds.has(app.job_id.toString()));
    }

    // Calculate metrics
    const avgTimeToShortlist = await calculateAvgTimeToStatus(filteredApps, 'shortlisted');
    const avgTimeToHire = await calculateAvgTimeToStatus(filteredApps, 'hired');

    res.json({
      totalApplications: filteredApps.length,
      avgTimeToShortlist,
      avgTimeToHire,
      periodStart: start_date,
      periodEnd: end_date,
    });
  } catch (err) {
    console.error('❌ Error fetching analytics:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function
async function calculateAvgTimeToStatus(apps, targetStatus) {
  const relevantApps = apps.filter((app) => app.status === targetStatus);
  if (relevantApps.length === 0) return 0;

  const times = relevantApps.map((app) => {
    const applied = new Date(app.applied_at);
    const now = new Date();
    return Math.floor((now - applied) / (1000 * 60 * 60 * 24)); // days
  });

  return Math.floor(times.reduce((a, b) => a + b, 0) / times.length);
}

export default router;
