import { z } from 'zod';

export const CreateApplicationSchema = z.object({
  job_id: z.uuid(),
  candidate_id: z.uuid(),
  // R1 answers - object/array/string đều chấp nhận, lưu xuống JSON string
  answers: z.any().optional(),
  // status mặc định active
  status: z.enum(['active', 'shortlisted', 'rejected', 'hired']).optional().default('active'),
  // (tuỳ) recruiter feedback R2 - để null khi tạo
  feedback: z.any().optional(),
});

// Lấy 1 application phải đủ 3 khóa (PK/CK)
export const GetOneSchema = z.object({
  job_id: z.string().uuid(),
  candidate_id: z.string().uuid(),
  applied_at: z.string().datetime(), // ISO string
});

// Query list theo job hoặc theo candidate
export const ListQuerySchema = z
  .object({
    job_id: z.string().uuid().optional(),
    candidate_id: z.string().uuid().optional(),
  })
  .refine((v) => v.job_id || v.candidate_id, { message: 'Provide job_id or candidate_id' });

// Update status/feedback cho 1 application
export const PatchSchema = z.object({
  job_id: z.string().uuid(),
  candidate_id: z.string().uuid(),
  applied_at: z.string().datetime(),
  status: z.enum(['active', 'shortlist', 'rejected', 'hired']).optional(),
  feedback: z.any().optional(),
});
