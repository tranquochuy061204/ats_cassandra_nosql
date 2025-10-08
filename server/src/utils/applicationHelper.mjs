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
