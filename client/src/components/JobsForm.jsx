import { useMutation } from '@tanstack/react-query';
import { api } from '../utils/api.jsx';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

// ✨ cấu hình thanh công cụ Rich Text
const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link'],
    ['clean'],
  ],
};
const quillFormats = ['header', 'bold', 'italic', 'underline', 'strike', 'list', 'bullet', 'link'];

export default function JobForm({ job, onClose, onSuccess }) {
  const [form, setForm] = useState(
    job || {
      title_vi: '',
      description_vi: '',
      requirements_vi: '',
      address_line: '',
      province_code: '',
      employment_type: 'Full-time',
      work_type: 'ONSITE',
      level: 'Intern',
      salary_vnd_min: '',
      salary_vnd_max: '',
      salary_negotiable: false,
      salary_gross: true,
      exp_years_min: 0,
      probation_months: 2,
      working_hours: '',
      benefits: '',
      deadline: '',
      status: 'DRAFT',
      visible: true,
      skills: '',
      questions: [],
    }
  );

  const [provinces, setProvinces] = useState([]);
  const isEditing = Boolean(job);

  // ====== Load tỉnh / thành ======
  useEffect(() => {
    api.get('/api/provinces').then((res) => setProvinces(res.data));
  }, []);

  // ====== Khi edit thì load job ======
  useEffect(() => {
    if (job) {
      setForm({
        ...job,
        skills: Array.isArray(job.skills) ? job.skills.join(', ') : job.skills || '',
        questions: job.questions || [],
      });
    }
  }, [job]);

  // ====== Câu hỏi tuyển dụng ======
  const handleAddQuestion = () => {
    setForm({
      ...form,
      questions: [
        ...form.questions,
        {
          question_id: crypto.randomUUID(),
          label: '',
          type: 'boolean',
          preferred_answer: false,
          knockout: false,
        },
      ],
    });
  };

  const handleRemoveQuestion = (index) => {
    const updated = [...form.questions];
    updated.splice(index, 1);
    setForm({ ...form, questions: updated });
  };

  const handleUpdateQuestion = (index, key, value) => {
    const updated = [...form.questions];
    updated[index][key] = value;
    setForm({ ...form, questions: updated });
  };

  // ====== Submit mutation ======
  const mutation = useMutation({
    mutationFn: async (currentForm) => {
      const parseNum = (v) => (v === '' || v === null || v === undefined ? null : Number(v));
      const DEFAULT_RECRUITER_ID = '00000000-0000-0000-0000-000000000001';

      // 🧩 Chuẩn hóa payload
      const payload = {
        ...currentForm,
        salary_vnd_min: parseNum(currentForm.salary_vnd_min),
        salary_vnd_max: parseNum(currentForm.salary_vnd_max),
        exp_years_min: parseNum(currentForm.exp_years_min) ?? 0,
        probation_months: parseNum(currentForm.probation_months) ?? 0,
        skills: String(currentForm.skills || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        questions_json: JSON.stringify(currentForm.questions),
      };

      if (currentForm.deadline) {
        payload.deadline = new Date(currentForm.deadline).toISOString().split('T')[0];
      }

      // 🧩 Nếu là tạo mới → gán recruiter mặc định
      if (!isEditing) {
        payload.recruiter_id = DEFAULT_RECRUITER_ID;
        await api.post('/api/admin/jobs', payload);
      } else {
        // 🧩 Nếu là chỉnh sửa → không gửi recruiter_id
        delete payload.recruiter_id;
        await api.patch(`/api/admin/jobs/${job.job_id}`, payload);
      }
    },
    onSuccess: () => {
      toast.success(isEditing ? 'Cập nhật thành công' : 'Tạo mới thành công');
      onSuccess();
      onClose();
    },
    onError: (err) => {
      console.error('❌ Lỗi khi lưu job:', err);
      toast.error('Lỗi khi lưu job');
    },
  });

  // ==================== Render ====================
  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50" onClick={onClose}>
      <div
        className="bg-white p-6 rounded-lg w-[750px] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold mb-4 text-center">{isEditing ? 'Chỉnh sửa Job' : 'Tạo Job mới'}</h2>

        <div className="grid grid-cols-2 gap-4 text-sm">
          {/* --- THÔNG TIN CƠ BẢN --- */}
          <div className="col-span-2">
            <label className="font-bold">Tiêu đề việc làm</label>
            <input
              value={form.title_vi}
              onChange={(e) => setForm({ ...form, title_vi: e.target.value })}
              className="border rounded px-3 py-2 w-full mt-1"
            />
          </div>

          {/* --- MÔ TẢ (Rich Text) --- */}
          <div className="col-span-2">
            <label className="font-bold">Mô tả công việc</label>
            <ReactQuill
              theme="snow"
              value={form.description_vi}
              onChange={(v) => setForm({ ...form, description_vi: v })}
              modules={quillModules}
              formats={quillFormats}
              className="mt-1 bg-white"
              placeholder="Nhập mô tả công việc (gạch đầu dòng, in đậm, xuống dòng...)"
            />
          </div>
          {/* --- PHÚC LỢI (Rich Text) --- */}
          <div className="col-span-2">
            <label className="font-bold">Phúc lợi</label>
            <ReactQuill
              theme="snow"
              value={form.benefits}
              onChange={(v) => setForm({ ...form, benefits: v })}
              modules={quillModules}
              formats={quillFormats}
              className="mt-1 bg-white"
              placeholder="Nhập danh sách phúc lợi (thưởng, nghỉ phép, bảo hiểm...)"
            />
          </div>

          <div className="col-span-2">
            <label className="font-bold">Yêu cầu ứng viên</label>
            <ReactQuill
              theme="snow"
              value={form.requirements_vi}
              onChange={(v) => setForm({ ...form, requirements_vi: v })}
              modules={quillModules}
              formats={quillFormats}
              className="mt-1 bg-white"
              placeholder="Nhập yêu cầu kỹ năng, kinh nghiệm..."
            />
          </div>

          {/* --- ĐỊA CHỈ & CẤP BẬC --- */}
          <div className="col-span-2">
            <label className="font-bold">Địa chỉ làm việc</label>
            <input
              value={form.address_line}
              onChange={(e) => setForm({ ...form, address_line: e.target.value })}
              className="border rounded px-3 py-2 w-full mt-1"
              placeholder="VD: 123 Nguyễn Văn Cừ, Quận 5, TP.HCM"
            />
          </div>

          <div className="col-span-2">
            <label className="font-bold">Tỉnh / Thành phố</label>
            <select
              value={form.province_code}
              onChange={(e) => setForm({ ...form, province_code: e.target.value })}
              className="border rounded px-3 py-2 w-full mt-1"
            >
              <option value="">-- Chọn tỉnh/thành --</option>
              {provinces.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-bold">Loại hình làm việc</label>
            <select
              value={form.employment_type}
              onChange={(e) => setForm({ ...form, employment_type: e.target.value })}
              className="border rounded px-3 py-2 w-full mt-1"
            >
              <option>Full-time</option>
              <option>Part-time</option>
              <option>Internship</option>
              <option>Contract</option>
            </select>
          </div>

          <div>
            <label className="font-bold">Hình thức làm việc</label>
            <select
              value={form.work_type}
              onChange={(e) => setForm({ ...form, work_type: e.target.value })}
              className="border rounded px-3 py-2 w-full mt-1"
            >
              <option>ONSITE</option>
              <option>REMOTE</option>
              <option>HYBRID</option>
            </select>
          </div>

          <div>
            <label className="font-bold">Cấp bậc</label>
            <select
              value={form.level}
              onChange={(e) => setForm({ ...form, level: e.target.value })}
              className="border rounded px-3 py-2 w-full mt-1"
            >
              <option>Intern</option>
              <option>Fresher</option>
              <option>Junior</option>
              <option>Middle</option>
              <option>Senior</option>
              <option>Lead</option>
              <option>Manager</option>
            </select>
          </div>

          {/* --- LƯƠNG --- */}
          <div>
            <label className="font-bold">Lương tối thiểu (VND)</label>
            <input
              type="number"
              value={form.salary_vnd_min}
              onChange={(e) => setForm({ ...form, salary_vnd_min: e.target.value })}
              className="border rounded px-3 py-2 w-full mt-1"
            />
          </div>
          <div>
            <label className="font-bold">Lương tối đa (VND)</label>
            <input
              type="number"
              value={form.salary_vnd_max}
              onChange={(e) => setForm({ ...form, salary_vnd_max: e.target.value })}
              className="border rounded px-3 py-2 w-full mt-1"
            />
          </div>

          {/* --- GIỜ LÀM, DEADLINE, TRẠNG THÁI --- */}
          <div className="col-span-2">
            <label className="font-bold">Giờ làm việc</label>
            <input
              value={form.working_hours}
              onChange={(e) => setForm({ ...form, working_hours: e.target.value })}
              className="border rounded px-3 py-2 w-full mt-1"
              placeholder="VD: 8h30 - 17h30 (T2 - T6)"
            />
          </div>

          <div>
            <label className="font-bold">Hạn nộp hồ sơ</label>
            <input
              type="date"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              className="border rounded px-3 py-2 w-full mt-1"
            />
          </div>

          <div>
            <label className="font-bold">Trạng thái việc làm</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="border rounded px-3 py-2 w-full mt-1"
            >
              <option value="DRAFT">Bản nháp</option>
              <option value="OPEN">Đang mở tuyển</option>
              <option value="CLOSED">Đã đóng</option>
            </select>
          </div>

          {/* --- KỸ NĂNG --- */}
          <div className="col-span-2">
            <label className="font-bold">Kỹ năng (phân tách bằng dấu phẩy)</label>
            <input
              value={form.skills}
              onChange={(e) => setForm({ ...form, skills: e.target.value })}
              className="border rounded px-3 py-2 w-full mt-1"
              placeholder="VD: ReactJS, Tailwind, REST API"
            />
          </div>

          {/* --- CÂU HỎI YES/NO --- */}
          <div className="col-span-2 border-t pt-4 mt-3">
            <div className="flex justify-between items-center mb-2">
              <label className="font-bold text-gray-700">Câu hỏi tuyển dụng (Yes/No)</label>
              <button
                onClick={handleAddQuestion}
                type="button"
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                + Thêm câu hỏi
              </button>
            </div>

            {form.questions.length === 0 && <p className="text-gray-500 text-sm">Chưa có câu hỏi nào.</p>}

            {form.questions.map((q, idx) => (
              <div key={q.question_id} className="flex items-center gap-2 mb-2 border p-2 rounded bg-gray-50">
                <input
                  type="text"
                  value={q.label}
                  onChange={(e) => handleUpdateQuestion(idx, 'label', e.target.value)}
                  placeholder={`Câu hỏi #${idx + 1}`}
                  className="flex-1 border rounded px-2 py-1"
                />
                <select
                  value={q.preferred_answer ? 'có' : 'không'}
                  onChange={(e) => handleUpdateQuestion(idx, 'preferred_answer', e.target.value === 'có')}
                  className="border rounded px-2 py-1"
                >
                  <option value="có">Có</option>
                  <option value="không">Không</option>
                </select>
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={q.knockout}
                    onChange={(e) => handleUpdateQuestion(idx, 'knockout', e.target.checked)}
                  />
                  Knockout
                </label>
                <button
                  onClick={() => handleRemoveQuestion(idx)}
                  type="button"
                  className="text-red-600 hover:text-red-800 font-bold px-2"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* --- HIỂN THỊ --- */}
          <div className="flex items-center gap-2 col-span-2">
            <input
              type="checkbox"
              checked={form.visible}
              onChange={(e) => setForm({ ...form, visible: e.target.checked })}
            />
            <label>Hiển thị công khai</label>
          </div>
        </div>

        {/* BUTTONS */}
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded border">
            Hủy
          </button>
          <button
            onClick={() => mutation.mutate(form)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {isEditing ? 'Lưu thay đổi' : 'Tạo mới'}
          </button>
        </div>
      </div>
    </div>
  );
}
