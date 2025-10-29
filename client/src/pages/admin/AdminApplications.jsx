import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, FolderOpen, UserCircle, ChevronLeft, MessageSquareText } from 'lucide-react';
import { vi } from 'date-fns/locale';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

import StatusBadge from '../../components/StatusBadge.jsx';
import { api } from '../../utils/api.jsx';
import { useAdminAuth } from '../../store/useAdminAuth.jsx';
import CandidateDetailModal from '../../components/CandidateDetailModal.jsx';
import JobDetailModal from '../../components/JobDetailModal.jsx';
import JobCard from '../../components/JobCard.jsx';
import FeedbackModal from '../../components/Feedback/FeedbackModal.jsx';

export default function AdminApplications() {
  const { admin } = useAdminAuth();
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [selectedJobDetailId, setSelectedJobDetailId] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(null);

  /* =========================
   * Fetch jobs
   * ========================= */
  const jobsQuery = useQuery({
    queryKey: ['recruiterJobs', admin?.user_id],
    queryFn: async () => {
      const res = await api.get(`/api/admin/jobs?recruiter_id=${admin?.user_id}`);
      return res.data;
    },
    enabled: !!admin?.user_id,
  });

  /* =========================
   * Fetch applications
   * ========================= */
  const appsQuery = useQuery({
    queryKey: ['applicationsByJob', selectedJob?.job_id],
    queryFn: async () => {
      const res = await api.get(`/api/applications?job_id=${selectedJob.job_id}`);
      return res.data;
    },
    enabled: !!selectedJob,
  });

  /* =========================
   * Loading & Error
   * ========================= */
  if (jobsQuery.isLoading)
    return (
      <div className="flex justify-center items-center h-64 text-gray-600">
        <Loader2 className="animate-spin w-8 h-8 text-indigo-600 mr-2" />
        Đang tải danh sách công việc...
      </div>
    );

  if (jobsQuery.isError)
    return <div className="text-center text-red-600 mt-10">❌ Lỗi khi tải danh sách công việc. Vui lòng thử lại.</div>;

  const jobs = jobsQuery.data || [];

  return (
    <div className="p-8 flex flex-col lg:flex-row gap-6">
      {/* ========== Cột trái: Job List ========== */}
      <div className="lg:w-1/3 bg-white rounded-2xl shadow-md border border-gray-100 flex flex-col">
        <div className="bg-gradient-to-r from-purple-100 to-pink-100 px-5 py-3 font-semibold text-gray-800 rounded-t-2xl border-b">
          Danh sách công việc
        </div>

        <div className="overflow-y-auto divide-y max-h-[80vh]">
          {jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-500">
              <FolderOpen className="w-8 h-8 mb-2 opacity-60" />
              <p>Chưa có công việc nào được đăng tuyển.</p>
            </div>
          ) : (
            jobs.map((job) => (
              <JobCard
                key={job.job_id}
                job={job}
                selected={selectedJob?.job_id === job.job_id}
                onSelect={() => setSelectedJob(job)}
                onViewDetail={() => setSelectedJobDetailId(job.job_id)}
              />
            ))
          )}
        </div>
      </div>

      {/* ========== Cột phải: Applications ========== */}
      <div className="flex-1 bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
        {!selectedJob ? (
          <div className="flex flex-col items-center justify-center h-full py-20 text-gray-500">
            <ChevronLeft className="w-8 h-8 mb-2 opacity-50" />
            <p>Chọn một công việc để xem danh sách ứng tuyển.</p>
          </div>
        ) : appsQuery.isLoading ? (
          <div className="flex justify-center items-center h-64 text-gray-600">
            <Loader2 className="animate-spin w-8 h-8 text-indigo-600 mr-2" />
            Đang tải danh sách ứng tuyển...
          </div>
        ) : (
          <div className="p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-800">
                Ứng viên cho: <span className="text-fuchsia-600">{selectedJob.title_vi}</span>
              </h2>
              <button
                onClick={() => setSelectedJob(null)}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition"
              >
                <ChevronLeft size={16} /> Quay lại
              </button>
            </div>

            {/* Table */}
            {appsQuery.data?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-500">
                <UserCircle className="w-10 h-10 mb-2 opacity-60" />
                <p>Không có đơn ứng tuyển nào cho công việc này.</p>
              </div>
            ) : (
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <table className="min-w-full text-sm text-gray-700">
                  <thead className="bg-gradient-to-r from-purple-100 to-pink-100 text-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Ứng viên</th>
                      <th className="px-4 py-3 text-left font-semibold">Địa chỉ</th>
                      <th className="px-4 py-3 text-center font-semibold">Trạng thái</th>
                      <th className="px-4 py-3 text-center font-semibold">Ngày nộp</th>
                      <th className="px-4 py-3 text-right font-semibold">Hành động</th>
                    </tr>
                  </thead>

                  <tbody>
                    {appsQuery.data.map((app, i) => (
                      <tr
                        key={`${app.job_id}-${app.candidate_id}-${i}`}
                        className={`border-t transition ${
                          i % 2 === 0 ? 'bg-white' : 'bg-purple-50/40'
                        } hover:bg-purple-50`}
                      >
                        {/* ỨNG VIÊN */}
                        <td
                          className="px-4 py-3 font-medium text-indigo-600 hover:underline cursor-pointer"
                          onClick={() =>
                            setSelectedCandidate({
                              candidate_id: app.candidate_id,
                              job_id: app.job_id,
                              applied_at: app.applied_at,
                            })
                          }
                        >
                          {app.candidate_full_name || app.candidate_id}
                        </td>

                        {/* ĐỊA CHỈ */}
                        <td className="px-4 py-3 text-gray-700">
                          {app.candidate_address_line ? (
                            <>
                              <div>{app.candidate_address_line}</div>
                              <div className="text-xs text-gray-500">
                                {app.candidate_district && <span>{app.candidate_district}, </span>}
                                {app.candidate_province}
                              </div>
                            </>
                          ) : (
                            <span className="text-gray-400 italic">Chưa cập nhật</span>
                          )}
                        </td>

                        {/* TRẠNG THÁI */}
                        <td className="px-4 py-3 text-center">
                          <StatusBadge status={app.status} />
                        </td>

                        {/* NGÀY NỘP */}
                        <td className="px-4 py-3 text-center text-gray-600">
                          {format(new Date(app.applied_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                        </td>

                        {/* HÀNH ĐỘNG */}
                        <td className="px-4 py-3 text-right flex items-center justify-end gap-2">
                          {/* Gửi feedback */}
                          <button
                            onClick={() =>
                              setShowFeedbackModal({
                                job_id: app.job_id,
                                candidate_id: app.candidate_id,
                              })
                            }
                            className="p-2 text-fuchsia-600 hover:text-fuchsia-800 transition"
                            title="Gửi phản hồi"
                          >
                            <MessageSquareText size={18} />
                          </button>

                          {/* Xoá */}
                          <button
                            onClick={async () => {
                              if (!confirm('Bạn có chắc muốn xoá đơn ứng tuyển này không?')) return;
                              try {
                                await api.delete(`/api/applications`, {
                                  params: {
                                    job_id: app.job_id,
                                    candidate_id: app.candidate_id,
                                    applied_at: app.applied_at,
                                  },
                                });
                                toast.success('Đã xoá đơn ứng tuyển');
                                appsQuery.refetch();
                              } catch (err) {
                                console.error(err);
                                toast.error('Lỗi khi xoá đơn ứng tuyển');
                              }
                            }}
                            className="p-2 text-red-500 hover:text-red-700 transition"
                            title="Xoá đơn ứng tuyển"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* =========================
       * Modals
       * ========================= */}
      {selectedCandidate && (
        <CandidateDetailModal
          candidateId={selectedCandidate.candidate_id}
          jobId={selectedCandidate.job_id}
          appliedAt={selectedCandidate.applied_at}
          onClose={() => setSelectedCandidate(null)}
        />
      )}

      {selectedJobDetailId && (
        <JobDetailModal jobId={selectedJobDetailId} onClose={() => setSelectedJobDetailId(null)} />
      )}

      {showFeedbackModal && (
        <FeedbackModal
          jobId={showFeedbackModal.job_id}
          candidateId={showFeedbackModal.candidate_id}
          onClose={() => setShowFeedbackModal(null)}
          onSaved={() => appsQuery.refetch()}
        />
      )}
    </div>
  );
}
