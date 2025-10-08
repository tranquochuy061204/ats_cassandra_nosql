import client from '../config/cassandra.mjs';
import { types } from 'cassandra-driver';

// ---------- Helpers cho bảng view public ----------
export function shouldAppear(row) {
  if (!row) return false;
  const status = String(row.status || '').toUpperCase();
  return status === 'OPEN' && row.visible === true;
}

export function publicKey(row) {
  // Lấy key cho bảng view (phải có đúng 4 field này)
  return {
    status: row.status,
    visible: row.visible,
    published_at: row.published_at, // TIMESTAMP
    job_id: row.job_id, // UUID (driver type)
  };
}

export async function upsertPublicRow(row) {
  // row là object lấy từ jobs_by_id hoặc payload đã chuẩn hoá
  const sql = `
  INSERT INTO jobs_by_status_visible (
    status, visible, published_at, job_id,
    title_vi, level, work_type, employment_type,
    salary_gross, salary_vnd_min, salary_vnd_max, address_line,
    province_code                          
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;
  const p = [
    row.status,
    row.visible,
    row.published_at,
    row.job_id,
    row.title_vi ?? null,
    row.level ?? null,
    row.work_type ?? null,
    row.employment_type ?? null,
    row.salary_gross ?? true,
    row.salary_vnd_min ?? null,
    row.salary_vnd_max ?? null,
    row.address_line ?? null,
    row.province_code ?? null, // 👈 thêm
  ];
  await client.execute(sql, p, { prepare: true });
}

export async function deletePublicRow(key) {
  console.log('DELETE jobs_by_status_visible key=', key);

  const sql = `DELETE FROM jobs_by_status_visible
               WHERE status=? AND visible=? AND published_at=? AND job_id=?`;
  const p = [key.status, key.visible, key.published_at, key.job_id];
  await client.execute(sql, p, { prepare: true });
}

// Dùng cho PATCH: quyết định insert/update/delete view khi trước/sau thay đổi
export async function syncPublicView(oldRow, newRow) {
  const before = oldRow && shouldAppear(oldRow);
  const after = newRow && shouldAppear(newRow);

  if (before && after) {
    // Nếu vẫn còn trong list nhưng có thay đổi các field hiển thị → upsert
    // Lưu ý: nếu đổi published_at/status/visible thì KEY đổi → cần xoá key cũ, chèn key mới
    const keyChanged =
      String(oldRow.status) !== String(newRow.status) ||
      Boolean(oldRow.visible) !== Boolean(newRow.visible) ||
      Number(newRow.published_at?.getTime?.() ?? newRow.published_at) !==
        Number(oldRow.published_at?.getTime?.() ?? oldRow.published_at);

    if (keyChanged) {
      await deletePublicRow(publicKey(oldRow));
    }
    await upsertPublicRow(newRow);
  } else if (before && !after) {
    await deletePublicRow(publicKey(oldRow));
  } else if (!before && after) {
    await upsertPublicRow(newRow);
  }
}

// ---------- Build dynamic UPDATE ----------
export function buildUpdate(fields) {
  const allowed = [
    'title_vi',
    'level',
    'employment_type',
    'work_type',
    'address_line',
    'province_code', // 👈 thêm
    'salary_vnd_min',
    'salary_vnd_max',
    'salary_negotiable',
    'salary_gross',
    'description_vi',
    'requirements_vi',
    'skills',
    'exp_years_min',
    'probation_months',
    'working_hours',
    'benefits',
    'deadline',
    'status',
    'visible',
    'questions_json',
    'published_at',
    'updated_at',
  ];

  const keys = Object.keys(fields).filter((k) => allowed.includes(k));
  const setSql = keys.map((k) => `${k} = ?`).join(', ');
  const params = keys.map((k) => fields[k]);
  return { setSql, params, keys };
}

// Recruiter
export async function upsertRecruiterRow(row) {
  const sql = `
    INSERT INTO jobs_by_recruiter (
      recruiter_id, created_at, job_id,
      title_vi, status, visible
    ) VALUES (?, ?, ?, ?, ?, ?)
  `;
  const p = [
    row.recruiter_id,
    row.created_at,
    row.job_id,
    row.title_vi ?? null,
    row.status ?? null,
    row.visible ?? null,
  ];
  await client.execute(sql, p, { prepare: true });
}

export async function deleteRecruiterRow(row) {
  const sql = `
    DELETE FROM jobs_by_recruiter
    WHERE recruiter_id=? AND created_at=? AND job_id=?
  `;
  const p = [row.recruiter_id, row.created_at, row.job_id];
  await client.execute(sql, p, { prepare: true });
}
