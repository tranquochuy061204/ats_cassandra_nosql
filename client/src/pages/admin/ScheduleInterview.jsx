import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../utils/api.jsx';
import { Loader2, CalendarPlus, UserRound, MapPin } from 'lucide-react';
import CandidateDetailModal from '../../components/CandidateDetailModal.jsx';
import ScheduleFormModal from '../../components/ScheduleFormModal.jsx';
import { toast } from 'react-hot-toast';

export default function ScheduleInterview() {
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [openCandidateModal, setOpenCandidateModal] = useState(false);
  const [openScheduleModal, setOpenScheduleModal] = useState(false);

  /* ---------------- Fetch Jobs ---------------- */
  const { data: jobs, isLoading: loadingJobs } = useQuery({
    queryKey: ['adminJobs'],
    queryFn: async () => {
      const res = await api.get('/api/jobs');
      return res.data?.items || [];
    },
  });

  /* ---------------- Fetch shortlist theo job ---------------- */
  const { data: shortlist, isLoading: loadingShortlist } = useQuery({
    queryKey: ['shortlistCandidates', selectedJob],
    queryFn: async () => {
      if (!selectedJob) return [];
      const res = await api.get(`/api/admin/applications/shortlisted/${selectedJob}`);
      return res.data;
    },
    enabled: !!selectedJob,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-8 flex gap-6">
      {/* ============ CỘT TRÁI ============ */}
      <div className="w-1/3 bg-white rounded-2xl shadow-md border border-gray-100 flex flex-col">
        <div className="bg-gradient-to-r from-purple-100 to-pink-100 text-gray-800 font-semibold px-5 py-3 border-b rounded-t-2xl">
          📋 Danh sách tuyển dụng
        </div>

        <div className="overflow-y-auto flex-1 divide-y">
          {loadingJobs ? (
            <div className="flex items-center justify-center h-40 text-gray-500">
              <Loader2 className="animate-spin w-6 h-6 text-indigo-500 mr-2" /> Đang tải...
            </div>
          ) : jobs?.length === 0 ? (
            <div className="text-center py-10 text-gray-500 italic">Chưa có công việc nào được đăng tuyển.</div>
          ) : (
            jobs.map((job) => (
              <div
                key={job.job_id}
                onClick={() => setSelectedJob(job.job_id)}
                className={`p-4 cursor-pointer transition-all ${
                  selectedJob === job.job_id
                    ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-l-4 border-indigo-500'
                    : 'hover:bg-gray-50'
                }`}
              >
                <h3 className="font-semibold text-gray-800">{job.title_vi}</h3>
                <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                  <MapPin size={14} /> {job.address_line || 'Không rõ địa chỉ'}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ============ CỘT PHẢI ============ */}
      <div className="flex-1 bg-white rounded-2xl shadow-md border border-gray-100 p-6 flex flex-col">
        <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800 mb-5">
          <CalendarPlus className="w-6 h-6 text-indigo-600" />
          Lên lịch phỏng vấn
        </h2>

        {!selectedJob ? (
          <div className="flex flex-col items-center justify-center flex-1 text-gray-500 italic">
            Hãy chọn một công việc ở cột bên trái để xem danh sách ứng viên.
          </div>
        ) : loadingShortlist ? (
          <div className="flex justify-center items-center flex-1 text-gray-500">
            <Loader2 className="animate-spin w-6 h-6 text-indigo-500 mr-2" /> Đang tải ứng viên shortlist...
          </div>
        ) : shortlist?.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 text-gray-400 italic">
            Không có ứng viên shortlisted cho công việc này.
          </div>
        ) : (
          <div className="space-y-4">
            {shortlist.map((c) => (
              <div
                key={c.candidate_id}
                className="flex justify-between items-center bg-gradient-to-r from-white to-purple-50 border border-gray-100 rounded-xl px-5 py-3 hover:shadow-md transition"
              >
                {/* ỨNG VIÊN */}
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-100 text-indigo-600 rounded-full p-2">
                    <UserRound className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{c.full_name}</p>
                    <p className="text-sm text-gray-500">{c.user_email}</p>
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedCandidate(c);
                      setOpenCandidateModal(true);
                    }}
                    className="px-3 py-1.5 border border-gray-300 rounded-md text-sm hover:bg-gray-100 transition"
                  >
                    Xem
                  </button>
                  <button
                    onClick={() => {
                      setSelectedCandidate(c);
                      setOpenScheduleModal(true);
                    }}
                    className="px-3 py-1.5 rounded-md text-sm text-white bg-gradient-to-r from-indigo-500 to-fuchsia-500 hover:from-indigo-600 hover:to-fuchsia-600 transition"
                  >
                    Lên lịch
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ============== Candidate Modal ============== */}
      {openCandidateModal && selectedCandidate && (
        <CandidateDetailModal
          candidateId={selectedCandidate.candidate_id}
          onClose={() => setOpenCandidateModal(false)}
        />
      )}

      {/* ============== Schedule Modal ============== */}
      {openScheduleModal && selectedCandidate && selectedJob && (
        <ScheduleFormModal
          jobId={selectedJob}
          candidate={selectedCandidate}
          onClose={() => setOpenScheduleModal(false)}
          onSuccess={() => {
            toast.success('✅ Đã tạo lịch phỏng vấn thành công!');
            setOpenScheduleModal(false);
          }}
        />
      )}
    </div>
  );
}
