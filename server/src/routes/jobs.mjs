// server/src/routes/jobs.mjs
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { types } from 'cassandra-driver';

import { CreateJobSchema, UpdateJobSchema } from '../database/schemas/jobValidationSchema.mjs';
import client from '../config/cassandra.mjs';
import {
  buildUpdateWithRecruiter,
  shouldAppear,
  publicKey,
  upsertPublicRow,
  deletePublicRow,
  syncPublicView,
  upsertRecruiterRow,
  deleteRecruiterRow,
} from '../utils/jobHelper.mjs';

const DEFAULT_RECRUITER_ID = '00000000-0000-0000-0000-000000000001';
// ================================================
// 🧩 ROUTER SETUP
// ================================================
const router = express.Router();

// ---------- CREATE ----------
router.post('/api/admin/jobs', async (req, res) => {
  try {
    const parsed = CreateJobSchema.parse(req.body);

    const job_id_str = uuidv4();
    const job_id = types.Uuid.fromString(job_id_str);
    const now = new Date();

    // ✅ Gán recruiter mặc định nếu FE chưa truyền recruiter_id
    const recruiter_id = parsed.recruiter_id
      ? types.Uuid.fromString(parsed.recruiter_id)
      : types.Uuid.fromString(DEFAULT_RECRUITER_ID);

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

    await client.execute(
      `INSERT INTO jobs_by_id (
        job_id, recruiter_id,
        title_vi, level,
        employment_type, work_type, address_line,
        province_code,
        salary_vnd_min, salary_vnd_max, salary_negotiable, salary_gross,
        description_vi, requirements_vi, skills, exp_years_min,
        probation_months, working_hours, benefits,
        deadline, status, visible,
        questions_json, created_at, published_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?
      )`,
      [
        job_id,
        recruiter_id, // ✅ luôn có recruiter_id (mock nếu cần)
        parsed.title_vi,
        parsed.level ?? null,
        parsed.employment_type ?? null,
        parsed.work_type ?? null,
        parsed.address_line ?? null,
        parsed.province_code ?? null,
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
        province_code: parsed.province_code,
      });
    }

    // ✅ Ghi vào jobs_by_recruiter với recruiter mặc định
    await upsertRecruiterRow({
      recruiter_id,
      created_at: now,
      job_id,
      status: parsed.status,
      title_vi: parsed.title_vi,
      visible: parsed.visible,
    });

    return res.status(201).json({ job_id: job_id_str, message: 'Job created' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      console.error('❌ Zod validation:', err);
      return res.status(400).json({ error: 'Invalid payload', details: err.errors });
    }
    console.error('❌ Internal error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
});

router.post('/api/jobs', async (req, res) => {
  try {
    const parsed = CreateJobSchema.parse(req.body);

    const job_id_str = uuidv4();
    const job_id = types.Uuid.fromString(job_id_str);
    const now = new Date();

    // ✅ Cho phép recruiter_id = null
    const recruiter_id =
      parsed.recruiter_id && typeof parsed.recruiter_id === 'string'
        ? types.Uuid.fromString(parsed.recruiter_id)
        : null;

    // ✅ Convert và chuẩn hóa questions
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

    // ✅ deadline: convert an toàn
    const deadlineDate = parsed.deadline ? new Date(parsed.deadline) : null;

    // ✅ Thêm vào bảng chính
    await client.execute(
      `INSERT INTO jobs_by_id (
        job_id, recruiter_id,
        title_vi, level,
        employment_type, work_type, address_line,
        province_code,
        salary_vnd_min, salary_vnd_max, salary_negotiable, salary_gross,
        description_vi, requirements_vi, skills, exp_years_min,
        probation_months, working_hours, benefits,
        deadline, status, visible,
        questions_json, created_at, published_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?
      )`,
      [
        job_id,
        recruiter_id, // ✅ có thể là null
        parsed.title_vi,
        parsed.level ?? null,
        parsed.employment_type ?? null,
        parsed.work_type ?? null,
        parsed.address_line ?? null,
        parsed.province_code ?? null,
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
        deadlineDate,
        parsed.status,
        parsed.visible,
        questions_json,
        now,
        published_at,
        now,
      ],
      { prepare: true }
    );

    // ✅ Nếu job đã OPEN & visible thì đưa vào view public
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
        province_code: parsed.province_code,
      });
    }

    // ✅ recruiter_id có thể null → chỉ upsert recruiter row nếu có
    if (recruiter_id) {
      await upsertRecruiterRow({
        recruiter_id,
        created_at: now,
        job_id,
        status: parsed.status,
        title_vi: parsed.title_vi,
        visible: parsed.visible,
      });
    }

    return res.status(201).json({ job_id: job_id_str, message: 'Job created' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      console.log('❌ ZodError:', err.errors);
      return res.status(400).json({ error: 'Invalid payload', details: err.errors });
    }
    console.error('❌ Internal Error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
});

// ---------- READ ----------
// ---------- PUBLIC LIST ----------
router.get('/api/jobs/public', async (req, res) => {
  try {
    const { province } = req.query;

    let query = `
      SELECT status, visible, published_at, job_id,
             title_vi, level, work_type, employment_type,
             salary_vnd_min, salary_vnd_max, salary_gross,
             address_line, province_code
      FROM jobs_by_status_visible
      WHERE status = ? AND visible = ?`;
    const params = ['OPEN', true];

    // 👇 Nếu có lọc theo tỉnh/thành phố
    if (province) {
      query += ' ALLOW FILTERING'; // chỉ tạm dùng cho filter đơn giản
    }

    const result = await client.execute(query, params, { prepare: true });

    // 🧩 Sắp xếp theo thời gian đăng mới nhất
    const jobs = result.rows
      .filter((row) => !province || String(row.province_code) === String(province))
      .sort((a, b) => b.published_at - a.published_at)
      .map((r) => ({
        job_id: r.job_id.toString(),
        title_vi: r.title_vi,
        level: r.level,
        work_type: r.work_type,
        employment_type: r.employment_type,
        salary: r.salary_vnd_min
          ? r.salary_vnd_max
            ? `${r.salary_vnd_min.toLocaleString()} - ${r.salary_vnd_max.toLocaleString()} VND`
            : `${r.salary_vnd_min.toLocaleString()}+ VND`
          : 'Thỏa thuận',
        salary_gross: r.salary_gross,
        address_line: r.address_line,
        province_code: r.province_code,
        published_at: r.published_at,
      }));

    return res.json(jobs);
  } catch (err) {
    console.error('❌ Lỗi khi lấy jobs public:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

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
    return res.status(400).json({ error: 'Invalid job_id' });
  }
});

// ---------- LIST (admin/dev) ----------
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
      pageState: result.pageState || null,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to list jobs' });
  }
});



// ---------- LIST BY RECRUITER (Admin & Recruiter Dashboard) ----------
router.get('/api/admin/jobs', async (req, res) => {
  try {
    const { recruiter_id } = req.query;

    if (!recruiter_id) {
      return res.status(400).json({ error: 'Thiếu recruiter_id' });
    }

    const recruiterUuid = types.Uuid.fromString(recruiter_id);

    // 🔍 Lấy danh sách job theo recruiter (bảng jobs_by_id)
    const query = 'SELECT * FROM jobs_by_id WHERE recruiter_id = ? ALLOW FILTERING';
    const result = await client.execute(query, [recruiterUuid], { prepare: true });

    if (result.rowLength === 0) {
      return res.json([]); // Không có job nào
    }

    // 🧩 Map kết quả trả về
    const jobs = result.rows.map((r) => ({
      job_id: r.job_id.toString(),
      title_vi: r.title_vi,
      level: r.level,
      employment_type: r.employment_type,
      work_type: r.work_type,
      address_line: r.address_line,
      province_code: r.province_code,
      salary_vnd_min: r.salary_vnd_min,
      salary_vnd_max: r.salary_vnd_max,
      salary_negotiable: r.salary_negotiable,
      salary_gross: r.salary_gross,
      status: r.status,
      visible: r.visible,
      deadline: r.deadline,
      published_at: r.published_at,
      updated_at: r.updated_at,
    }));

    // 🔁 Sắp xếp theo thời gian cập nhật gần nhất
    jobs.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

    return res.json(jobs);
  } catch (err) {
    console.error('❌ Error fetching jobs by recruiter:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------- UPDATE (Admin + Coordinator) ----------
router.patch('/api/admin/jobs/:id', async (req, res) => {
  try {
    console.log('👤 Current user:', req.user);
    console.log('📝 Payload:', req.body);

    const id = types.Uuid.fromString(req.params.id);

    // 🧩 Cho phép cả admin và coordinator chỉnh recruiter_id
    const allowedToAssign = ['admin', 'coordinator'];
    if (req.body.recruiter_id !== undefined && !allowedToAssign.includes(req.user?.role)) {
      return res.status(403).json({ error: 'Chỉ admin hoặc coordinator mới được phân công recruiter' });
    }

    // 🧩 Lấy dữ liệu cũ
    const oldRes = await client.execute('SELECT * FROM jobs_by_id WHERE job_id=?', [id], { prepare: true });
    if (oldRes.rowLength === 0) return res.status(404).json({ error: 'Job not found' });
    const oldRow = oldRes.first();

    // 🧩 Parse payload (cho phép recruiter_id nullable)
    const parsed = UpdateJobSchema.partial().parse(req.body);
    const fields = { ...parsed };

    // 🧩 Chỉ admin/coordinator mới được thay recruiter_id
    if (req.body.recruiter_id !== undefined) {
      const oldRecruiterId = oldRow.recruiter_id?.toString();
      const newRecruiterId = req.body.recruiter_id;

      // ⚠️ Nếu recruiter đang PATCH và recruiter_id = default => bỏ qua, không update
      const DEFAULT_RECRUITER_ID = '00000000-0000-0000-0000-000000000001';
      const isRecruiter = req.user?.role === 'recruiter';

      if (isRecruiter && newRecruiterId === DEFAULT_RECRUITER_ID) {
        console.log('⏩ Bỏ qua recruiter_id mặc định khi recruiter patch job');
        delete req.body.recruiter_id;
      } else if (!['admin', 'coordinator'].includes(req.user?.role)) {
        // Nếu không phải admin/coordinator → không cho đổi recruiter khác
        const isSame = newRecruiterId === oldRecruiterId;
        if (!isSame) {
          return res.status(403).json({ error: 'Chỉ admin hoặc coordinator mới được thay đổi recruiter_id' });
        }
      }

      // Nếu còn recruiter_id sau lọc → xử lý validate
      if (req.body.recruiter_id !== undefined) {
        try {
          const recruiterUuid = types.Uuid.fromString(req.body.recruiter_id);
          fields.recruiter_id = recruiterUuid;
        } catch {
          return res.status(400).json({ error: 'recruiter_id không hợp lệ' });
        }
      }
    }

    // 🧩 Chuẩn hoá skills
    if (parsed.skills !== undefined) {
      if (Array.isArray(parsed.skills)) {
        fields.skills = Array.from(new Set(parsed.skills.map(String)));
      } else if (typeof parsed.skills === 'string') {
        fields.skills = parsed.skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      } else {
        fields.skills = [];
      }
    }

    // 🧩 Chuẩn hoá câu hỏi JSON
    if (parsed.questions || parsed.questions_json) {
      fields.questions_json = JSON.stringify(parsed.questions || parsed.questions_json || []);
    }

    // 🧩 Convert deadline (nếu có)
    if (parsed.deadline) {
      fields.deadline = new Date(parsed.deadline);
    }

    fields.updated_at = new Date();

    // 🧩 Nếu status/visible đổi → cập nhật published_at
    if (fields.status || fields.visible) {
      const nextStatus = fields.status ?? oldRow.status;
      const nextVisible = fields.visible ?? oldRow.visible;
      if (!shouldAppear(oldRow) && shouldAppear({ status: nextStatus, visible: nextVisible })) {
        fields.published_at = new Date();
      }
    }

    // 🧩 Bổ sung recruiter_id vào danh sách allowed để UPDATE
    const { setSql, params, keys } = buildUpdateWithRecruiter(fields);
    if (!setSql) return res.status(400).json({ error: 'Không có trường hợp lệ để cập nhật' });

    console.log('🧱 SQL UPDATE:', setSql);
    console.log('🧾 Params:', params);

    await client.execute(`UPDATE jobs_by_id SET ${setSql} WHERE job_id=?`, [...params, id], { prepare: true });

    // 🧩 Lấy lại bản ghi mới nhất
    const r2 = await client.execute('SELECT * FROM jobs_by_id WHERE job_id=?', [id], { prepare: true });
    const newRow = r2.first();

    // 🧩 Đồng bộ view public
    await syncPublicView(oldRow, newRow);

    // 🧩 Đồng bộ bảng jobs_by_recruiter
    const oldRecruiter = oldRow.recruiter_id ? String(oldRow.recruiter_id) : null;
    const newRecruiter = newRow.recruiter_id ? String(newRow.recruiter_id) : null;

    if (oldRecruiter && oldRecruiter !== newRecruiter) {
      await deleteRecruiterRow(oldRow).catch((err) => console.error('⚠️ deleteRecruiterRow error:', err));
    }

    if (newRecruiter) {
      await upsertRecruiterRow(newRow).catch((err) => console.error('⚠️ upsertRecruiterRow error:', err));
    }

    if (!newRecruiter && oldRecruiter) {
      await deleteRecruiterRow(oldRow).catch((err) =>
        console.error('⚠️ deleteRecruiterRow (null recruiter) error:', err)
      );
    }

    return res.json({
      message: 'Job updated thành công',
      updated_fields: keys,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      console.error('❌ ZOD validation error:', err.errors);
      return res.status(400).json({ error: 'Payload không hợp lệ', details: err.errors });
    }
    console.error('❌ JOB PATCH error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
});

// ---------- DELETE ----------
router.delete('/api/admin/jobs/:id', async (req, res) => {
  try {
    const id = types.Uuid.fromString(req.params.id);

    const r = await client.execute('SELECT * FROM jobs_by_id WHERE job_id=?', [id], { prepare: true });
    if (r.rowLength === 0) return res.status(404).json({ error: 'Job not found' });
    const row = r.first();

    await client.execute('DELETE FROM jobs_by_id WHERE job_id=?', [id], { prepare: true });

    if (shouldAppear(row)) await deletePublicRow(publicKey(row));
    await deleteRecruiterRow(row);

    return res.json({ message: 'Đã xoá một job', job_id: id.toString() });
  } catch (err) {
    return res.status(400).json({ error: 'Invalid job_id or request' });
  }
});

export default router;
