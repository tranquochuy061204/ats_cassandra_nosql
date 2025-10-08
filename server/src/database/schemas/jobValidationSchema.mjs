import { z } from 'zod';

export const QuestionBool = z.object({
  question_id: z.string(),
  label: z.string().min(1),
  type: z.literal('boolean'),
  preferred_answer: z.boolean(),
  knockout: z.boolean(),
});

export const CreateJobSchema = z.object({
  recruiter_id: z.uuid().default(''),
  title_vi: z.string().min(2),
  level: z.enum(['Intern', 'Fresher', 'Junior', 'Middle', 'Senior', 'Lead', 'Manager']),
  employment_type: z.enum(['Full-time', 'Part-time', 'Internship', 'Contract']),
  work_type: z.enum(['ONSITE', 'REMOTE', 'HYBRID']),
  address_line: z.string().min(1),
  province_code: z.string().optional(),
  salary_vnd_min: z.number().int().nonnegative().optional(),
  salary_vnd_max: z.number().int().nonnegative().optional(),
  salary_negotiable: z.boolean().default(false),
  salary_gross: z.boolean().default(true),

  description_vi: z.string().min(1),
  requirements_vi: z.string().default(''),
  skills: z.array(z.string()).default([]),
  exp_years_min: z.number().int().min(0).max(50).default(0),

  probation_months: z.number().int().min(0).max(6).default(2),
  working_hours: z.string().default(''),
  benefits: z.string().default(''), // bạn đang dùng TEXT; có thể lưu JSON string

  deadline: z.string().date().optional(), // 'YYYY-MM-DD'
  status: z.enum(['DRAFT', 'OPEN', 'CLOSED']).default('DRAFT'),
  visible: z.boolean().default(true),

  questions_json: z
    .union([z.string(), z.array(QuestionBool), z.record(z.any())])
    .transform((v) => (typeof v === 'string' ? v : JSON.stringify(v)))
    .optional(),

  questions: z.array(QuestionBool).default([]), // sẽ stringify sang questions_json
});

export const UpdateJobSchema = z.object({
  title_vi: z.string().min(2).optional(),
  level: z.enum(['Intern', 'Fresher', 'Junior', 'Middle', 'Senior', 'Lead', 'Manager']).optional(),
  employment_type: z.enum(['Full-time', 'Part-time', 'Internship', 'Contract']).optional(),
  work_type: z.enum(['ONSITE', 'REMOTE', 'HYBRID']).optional(),
  address_line: z.string().min(1).optional(),

  salary_vnd_min: z.number().int().nonnegative().optional(),
  salary_vnd_max: z.number().int().nonnegative().optional(),
  salary_negotiable: z.boolean().optional(),
  salary_gross: z.boolean().optional(),

  description_vi: z.string().min(1).optional(),
  requirements_vi: z.string().optional(),
  skills: z.array(z.string()).optional(),
  exp_years_min: z.number().int().min(0).max(50).optional(),

  probation_months: z.number().int().min(0).max(6).optional(),
  working_hours: z.string().optional(),
  benefits: z.string().optional(),

  deadline: z.iso.date().optional(), // 'YYYY-MM-DD'
  status: z.enum(['DRAFT', 'OPEN', 'CLOSED']).optional(),
  visible: z.boolean().optional(),

  questions_json: z
    .union([z.string(), z.array(QuestionBool), z.record(z.any())])
    .transform((v) => (typeof v === 'string' ? v : JSON.stringify(v)))
    .optional(),

  questions: z.array(QuestionBool).optional(), // sẽ stringify sang questions_json
});
