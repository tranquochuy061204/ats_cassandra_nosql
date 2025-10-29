import crypto from 'crypto';
import { types } from 'cassandra-driver';
import client from '../config/cassandra.mjs';

export const toJsonString = (v) => (v == null ? null : typeof v === 'string' ? v : JSON.stringify(v));

export const rowToAppByJob = (row) => ({
  job_id: row.job_id.toString(),
  candidate_id: row.candidate_id.toString(),
  applied_at: row.applied_at.toISOString(),
  status: row.status,
  answers: row.answers_json ? JSON.parse(row.answers_json) : [],
  feedback: row.feedback_json ? JSON.parse(row.feedback_json) : null,
  updated_at: row.updated_at ? row.updated_at.toISOString() : null,
});

export const rowToAppByCandidate = (row) => ({
  candidate_id: row.candidate_id.toString(),
  job_id: row.job_id.toString(),
  applied_at: row.applied_at.toISOString(),
  status: row.status,
  answers: row.answers_json ? JSON.parse(row.answers_json) : [],
  feedback: row.feedback_json ? JSON.parse(row.feedback_json) : null,
  updated_at: row.updated_at ? row.updated_at.toISOString() : null,
});

/** 🔹 Sinh application_id ảo từ job_id + candidate_id + applied_at */
export function generateApplicationId(jobId, candidateId, appliedAt) {
  const str = `${jobId}-${candidateId}-${appliedAt.toISOString?.() || appliedAt}`;
  const hash = crypto.createHash('sha1').update(str).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
}

/** 🔹 Tìm bản ghi ứng tuyển dựa trên 3 trường */
export async function findApplicationByCompositeKeys(jobId, candidateId, appliedAt) {
  const r = await client.execute(
    `SELECT job_id, candidate_id, applied_at, recruiter_id, status, answers_json
     FROM applications_by_job
     WHERE job_id = ? AND applied_at = ? AND candidate_id = ? LIMIT 1`,
    [types.Uuid.fromString(jobId), appliedAt, types.Uuid.fromString(candidateId)],
    { prepare: true }
  );
  return r.rowLength ? r.first() : null;
}
