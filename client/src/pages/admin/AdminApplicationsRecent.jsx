import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Loader2, Inbox, User, Briefcase } from 'lucide-react';
import { api } from '../../utils/api.jsx';
import { useAdminAuth } from '../../store/useAdminAuth.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import CandidateDetailModal from '../../components/CandidateDetailModal.jsx';
import JobDetailModal from '../../components/JobDetailModal.jsx';

export default function AdminApplicationsRecent() {
  const { admin } = useAdminAuth();
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['recentApplications', admin?.user_id],
    queryFn: async () => {
      const res = await api.get(`/api/admin/applications/recent?recruiter_id=${admin?.user_id}&limit=50`);
      return res.data;
    },
    enabled: !!admin?.user_id,
  });

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-64 text-gray-600">
        <Loader2 className="animate-spin w-6 h-6 text-indigo-600 mr-2" />
        Đang tải danh sách đơn ứng tuyển...
      </div>
    );

  if (isError)
    return (
      <div className="text-center text-red-600 mt-10">❌ Lỗi khi tải danh sách đơn ứng tuyển. Vui lòng thử lại.</div>
    );

  const apps = data || [];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">📋 Đơn ứng tuyển gần đây</h1>
          <p className="text-sm text-gray-500 mt-1">
            Danh sách các ứng viên mới nộp trong hệ thống — bấm vào tên để xem chi tiết.
          </p>
        </div>
      </div>

      {/* Table container */}
      <div className="rounded-2xl overflow-hidden shadow-md border border-gray-100 bg-white">
        {/* Header row riêng, không gradient trực tiếp lên table */}
        <div className="bg-gradient-to-r from-purple-100 to-pink-100 text-gray-800 font-semibold grid grid-cols-4 text-sm">
          <div className="px-5 py-3 text-left">Ứng viên</div>
          <div className="px-5 py-3 text-left">Công việc</div>
          <div className="px-5 py-3 text-center">Trạng thái</div>
          <div className="px-5 py-3 text-center">Ngày nộp</div>
        </div>

        {/* Dữ liệu */}
        {apps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Inbox className="w-10 h-10 mb-3 opacity-60" />
            <p>Chưa có đơn ứng tuyển nào gần đây.</p>
          </div>
        ) : (
          <div>
            {apps.map((app, i) => (
              <div
                key={`${app.job_id}-${app.candidate_id}-${i}`}
                className={`grid grid-cols-4 text-sm transition border-t border-gray-100 ${
                  i % 2 === 0 ? 'bg-white' : 'bg-purple-50/40'
                } hover:bg-purple-50`}
              >
                {/* Ứng viên */}
                <div
                  onClick={() => {
                    setSelectedCandidate(app.candidate_id);
                    setSelectedApplication({
                      job_id: app.job_id,
                      applied_at: app.applied_at,
                    });
                  }}
                  className="px-5 py-4 flex items-center gap-2 text-indigo-600 hover:underline cursor-pointer font-medium"
                >
                  <User size={16} />
                  {app.candidate_name || app.candidate_id}
                </div>

                {/* Công việc */}
                <div
                  onClick={() => setSelectedJob(app.job_id)}
                  className="px-5 py-4 flex items-center gap-2 text-pink-600 hover:underline cursor-pointer"
                >
                  <Briefcase size={16} />
                  {app.job_title || app.job_id}
                </div>

                {/* Trạng thái */}
                <div className="px-5 py-4 text-center">
                  <StatusBadge status={app.status} />
                </div>

                {/* Ngày nộp */}
                <div className="px-5 py-4 text-center text-gray-600">
                  {format(new Date(app.applied_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal chi tiết ứng viên */}
      {selectedCandidate && (
        <CandidateDetailModal
          candidateId={selectedCandidate}
          jobId={selectedApplication?.job_id}
          appliedAt={selectedApplication?.applied_at}
          onClose={() => {
            setSelectedCandidate(null);
            setSelectedApplication(null);
          }}
        />
      )}

      {/* Modal chi tiết job */}
      {selectedJob && <JobDetailModal jobId={selectedJob} onClose={() => setSelectedJob(null)} />}
    </div>
  );
}
