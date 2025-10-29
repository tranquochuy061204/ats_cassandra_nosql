import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api.jsx';
import { toast } from 'react-hot-toast';
import { Loader2, X, Plus, Pencil, Trash2, Calendar, ChevronDown, ChevronUp } from 'lucide-react';

/* ==================== Validation Schema ==================== */
const schema = z.object({
  round_name: z.string().min(2, 'Chọn vòng phỏng vấn').optional(),
  scheduled_at: z.string().min(1, 'Chọn thời gian'),
  note: z.string().optional(),
  meet_link: z.url('Link Meet không hợp lệ'),
});

export default function ScheduleFormModal({ jobId, candidate, onClose, onSuccess }) {
  const queryClient = useQueryClient();
  const [newRound, setNewRound] = useState('');
  const [expanded, setExpanded] = useState(null); // 👈 dropdown cho từng vòng

  /* ==================== Fetch vòng ==================== */
  const {
    data: rounds,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['interviewRounds', jobId, candidate.candidate_id],
    queryFn: async () => {
      const res = await api.get(`/api/admin/interviews/rounds/${jobId}/${candidate.candidate_id}`);
      return res.data;
    },
  });

  const availableRounds = rounds?.filter((r) => !r.scheduled_at && r.round_name !== 'CV Screening') || [];
  const scheduledRounds = rounds?.filter((r) => r.scheduled_at && r.round_name !== 'CV Screening') || [];

  /* ==================== Form setup ==================== */
  const {
    register,
    handleSubmit,
    reset,

    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { meet_link: 'https://meet.google.com/recruitment-room' },
  });

  /* ==================== Mutation ==================== */
  const createMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.patch('/api/admin/interviews/schedule', {
        job_id: jobId,
        candidate_id: candidate.candidate_id,
        round_order: data.round_order,
        scheduled_at: data.scheduled_at,
        meet_link: data.meet_link,
        note: data.note,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('✅ Đã tạo lịch & gửi email!');
      queryClient.invalidateQueries(['interviewRounds']);
      refetch();
      reset();
      onSuccess();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.patch('/api/admin/interviews/schedule', {
        job_id: jobId,
        candidate_id: candidate.candidate_id,
        round_order: expanded.round_order,
        scheduled_at: data.scheduled_at,
        meet_link: data.meet_link,
        note: data.note,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('✏️ Đã cập nhật lịch phỏng vấn!');
      setExpanded(null);
      queryClient.invalidateQueries(['interviewRounds']);
      refetch();
      reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (r) => {
      const res = await api.delete('/api/admin/interviews/schedule', {
        data: { job_id: jobId, candidate_id: candidate.candidate_id, round_order: r.round_order },
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('🗑️ Đã xoá lịch.');
      refetch();
    },
  });

  const addRoundMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/api/admin/interviews/rounds', {
        job_id: jobId,
        candidate_id: candidate.candidate_id,
        round_name: newRound,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('✅ Đã thêm vòng mới');
      setNewRound('');
      refetch();
    },
  });

  /* ==================== Submit ==================== */
  const onSubmit = (data) => {
    const payload = {
      ...data,
      scheduled_at: new Date(data.scheduled_at).toISOString(),
    };

    if (expanded) updateMutation.mutate(payload);
    else {
      const selectedRound = availableRounds.find((r) => r.round_name === data.round_name);
      if (!selectedRound) return toast.error('Vui lòng chọn vòng hợp lệ.');
      createMutation.mutate({ ...payload, round_order: selectedRound.round_order });
    }
  };

  /* ==================== UI ==================== */
  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white rounded-2xl shadow-lg w-[520px] max-h-[90vh] overflow-y-auto relative p-6">
        {/* Close */}
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-gray-700">
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-semibold mb-4">🗓️ Quản lý lịch phỏng vấn — {candidate.full_name}</h2>

        {/* DANH SÁCH LỊCH */}
        {isLoading ? (
          <p className="text-gray-500 text-sm mb-4">Đang tải...</p>
        ) : scheduledRounds.length ? (
          <div className="space-y-3 mb-6">
            {scheduledRounds.map((r) => (
              <div key={r.round_order} className="border rounded-lg">
                <button
                  type="button"
                  onClick={() => {
                    if (expanded?.round_order === r.round_order) setExpanded(null);
                    else {
                      setExpanded(r);
                      reset({
                        scheduled_at: new Date(r.scheduled_at).toISOString().slice(0, 16),
                        meet_link: r.meet_link || '',
                        note: r.note || '',
                      });
                    }
                  }}
                  className="w-full flex justify-between items-center p-3 text-left hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium">{r.round_name}</p>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Calendar size={14} />
                      {new Date(r.scheduled_at).toLocaleString('vi-VN', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </p>
                  </div>
                  {expanded?.round_order === r.round_order ? (
                    <ChevronUp size={18} className="text-gray-600" />
                  ) : (
                    <ChevronDown size={18} className="text-gray-600" />
                  )}
                </button>

                {/* DROPDOWN EDIT FORM */}
                {expanded?.round_order === r.round_order && (
                  <div className="mx-2 mt-2 mb-3 p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3 shadow-sm transition-all duration-300">
                    <input
                      type="datetime-local"
                      {...register('scheduled_at')}
                      className="w-full border rounded-md p-2 text-sm"
                    />
                    <input type="url" {...register('meet_link')} className="w-full border rounded-md p-2 text-sm" />
                    <textarea
                      {...register('note')}
                      rows="2"
                      className="w-full border rounded-md p-2 text-sm"
                      placeholder="Ghi chú..."
                    ></textarea>

                    <div className="flex justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          setExpanded(null);
                          reset();
                        }}
                        className="text-sm text-gray-500 hover:text-gray-700"
                      >
                        Huỷ
                      </button>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Bạn có chắc muốn xoá vòng "${r.round_name}"?`)) {
                              deleteMutation.mutate(r);
                            }
                          }}
                          className="px-3 py-1 text-sm rounded-md bg-red-100 text-red-700 hover:bg-red-200"
                        >
                          <Trash2 size={14} className="inline mr-1" /> Xoá
                        </button>
                        <button
                          type="button"
                          onClick={handleSubmit(onSubmit)}
                          className="px-3 py-1 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
                        >
                          Lưu
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 italic mb-5">Chưa có lịch phỏng vấn nào.</p>
        )}

        {/* FORM THÊM MỚI */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Vòng phỏng vấn</label>
            {isLoading ? (
              <p className="text-gray-500 text-sm">Đang tải...</p>
            ) : availableRounds.length > 0 ? (
              <select {...register('round_name')} className="w-full border rounded-md p-2 text-sm">
                <option value="">-- Chọn vòng --</option>
                {availableRounds.map((r) => (
                  <option key={r.round_order} value={r.round_name}>
                    {r.round_name}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-gray-400 text-sm italic">Không còn vòng cần lên lịch.</p>
            )}
            {errors.round_name && <p className="text-red-600 text-sm">{errors.round_name.message}</p>}

            {/* Thêm vòng mới */}
            <div className="flex mt-3 gap-2">
              <input
                type="text"
                value={newRound}
                onChange={(e) => setNewRound(e.target.value)}
                placeholder="Thêm vòng mới..."
                className="flex-1 border rounded-md p-2 text-sm"
              />
              <button
                type="button"
                onClick={() => addRoundMutation.mutate()}
                disabled={!newRound}
                className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm"
              >
                <Plus size={14} /> Thêm
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Thời gian phỏng vấn</label>
            <input type="datetime-local" {...register('scheduled_at')} className="w-full border rounded-md p-2" />
            {errors.scheduled_at && <p className="text-red-600 text-sm">{errors.scheduled_at.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Link Google Meet</label>
            <input
              type="url"
              {...register('meet_link')}
              className="w-full border rounded-md p-2"
              placeholder="https://meet.google.com/..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Ghi chú (nếu có)</label>
            <textarea {...register('note')} rows="3" className="w-full border rounded-md p-2"></textarea>
          </div>

          <button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-indigo-500 to-fuchsia-500 hover:from-indigo-600 hover:to-fuchsia-600 text-white py-2 rounded-md font-medium"
          >
            {createMutation.isPending && <Loader2 className="animate-spin w-5 h-5" />}
            Tạo lịch & Gửi Email
          </button>
        </form>
      </div>
    </div>
  );
}
