import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../utils/api.jsx';
import toast from 'react-hot-toast';
import { useState } from 'react';
import JobForm from '../../components/JobsForm.jsx';
import { useAdminAuth } from '../../store/useAdminAuth.jsx';
import AssignRecruiterModal from '../../components/AssignRecruiterModal.jsx';
import { PlusCircle, Briefcase, Trash2, Edit3, Users } from 'lucide-react';

export default function AdminJobs() {
  const { admin } = useAdminAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [assignJob, setAssignJob] = useState(null);

  /* ===================== Fetch jobs ===================== */
  const { data, isLoading } = useQuery({
    queryKey: ['admin-jobs'],
    queryFn: async () => {
      const res = await api.get('/api/jobs');
      return res.data.items;
    },
  });

  /* ===================== Delete job ===================== */
  const deleteMutation = useMutation({
    mutationFn: async (job_id) => await api.delete(`/api/admin/jobs/${job_id}`),
    onSuccess: () => {
      toast.success('🗑️ Đã xoá công việc');
      queryClient.invalidateQueries(['admin-jobs']);
    },
  });

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-60 text-gray-600">
        <Briefcase className="animate-pulse w-6 h-6 mr-2" />
        Đang tải danh sách việc làm...
      </div>
    );

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🎯 Quản lý việc làm</h1>
          <p className="text-sm text-gray-500 mt-1">
            Theo dõi, chỉnh sửa và quản lý các vị trí tuyển dụng của hệ thống.
          </p>
        </div>
        {admin && admin.role === 'admin' && (
          <button
            onClick={() => {
              setSelectedJob(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-fuchsia-600 to-pink-500 text-white rounded-lg shadow hover:opacity-90 transition"
          >
            <PlusCircle size={18} /> Thêm việc làm
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-xl shadow-md border border-gray-100">
        <table className="w-full text-sm text-gray-700">
          <thead className="bg-gradient-to-r from-purple-100 to-pink-100 text-gray-800">
            <tr>
              <th className="py-3 px-4 text-left font-semibold">Tiêu đề</th>
              <th className="py-3 px-4 text-center font-semibold">Cấp bậc</th>
              <th className="py-3 px-4 text-center font-semibold">Hình thức</th>
              <th className="py-3 px-4 text-center font-semibold">Trạng thái</th>
              <th className="py-3 px-4 text-center font-semibold">Hiển thị</th>
              <th className="py-3 px-4 text-center font-semibold">Ngày tạo</th>
              <th className="py-3 px-4 text-center font-semibold">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((job, idx) => (
              <tr
                key={job.job_id}
                className={`border-t border-gray-100 hover:bg-purple-50 transition ${
                  idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                }`}
              >
                <td className="py-3 px-4 font-medium">{job.title_vi}</td>
                <td className="py-3 px-4 text-center text-gray-600">{job.level}</td>
                <td className="py-3 px-4 text-center text-gray-600">{job.work_type}</td>
                <td
                  className={`py-3 px-4 text-center font-medium ${
                    job.status === 'OPEN' ? 'text-green-600' : 'text-red-500'
                  }`}
                >
                  {job.status}
                </td>
                <td className="py-3 px-4 text-center">
                  {job.visible ? (
                    <span className="text-green-600 font-semibold">Hiện</span>
                  ) : (
                    <span className="text-gray-400">Ẩn</span>
                  )}
                </td>
                <td className="py-3 px-4 text-center text-gray-500">
                  {new Date(job.created_at).toLocaleDateString('vi-VN')}
                </td>
                <td className="py-3 px-4 text-center">
                  <div className="flex justify-center gap-3">
                    {admin && admin.role === 'admin' && (
                      <button
                        onClick={() => {
                          setSelectedJob(job);
                          setShowForm(true);
                        }}
                        className="flex items-center gap-1 text-blue-600 hover:underline"
                      >
                        <Edit3 size={15} /> Sửa
                      </button>
                    )}
                    {admin && admin.role === 'coordinator' && (
                      <button
                        onClick={() => {
                          setSelectedJob(job);
                          setShowForm(true);
                        }}
                        className="flex items-center gap-1 text-blue-600 hover:underline"
                      >
                        <Edit3 size={15} /> Xem
                      </button>
                    )}
                    {admin?.role === 'coordinator' && (
                      <button
                        onClick={() => setAssignJob(job)}
                        className="flex items-center gap-1 text-pink-500 hover:underline"
                      >
                        <Users size={15} /> Phân công
                      </button>
                    )}

                    <button
                      onClick={() => deleteMutation.mutate(job.job_id)}
                      className="flex items-center gap-1 text-red-500 hover:underline"
                    >
                      <Trash2 size={15} /> Xoá
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {showForm && (
        <JobForm
          job={selectedJob}
          onClose={() => setShowForm(false)}
          onSuccess={() => queryClient.invalidateQueries(['admin-jobs'])}
        />
      )}

      {assignJob && (
        <AssignRecruiterModal
          job={assignJob}
          onClose={() => setAssignJob(null)}
          onSuccess={() => queryClient.invalidateQueries(['admin-jobs'])}
        />
      )}
    </div>
  );
}
