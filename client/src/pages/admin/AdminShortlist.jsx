import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../utils/api.jsx';
import { Loader2, MapPin, UserRound, CheckCircle, XCircle, ClipboardList } from 'lucide-react';
import { toast } from 'react-hot-toast';
import CandidateDetailModal from '../../components/CandidateDetailModal.jsx'; // ✅ thêm import

export default function AdminShortlist() {
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null); // ✅ modal state
  const [openCandidateModal, setOpenCandidateModal] = useState(false);
  const queryClient = useQueryClient();

  /* ---------------- Fetch Jobs ---------------- */
  const { data: jobs, isLoading: loadingJobs } = useQuery({
    queryKey: ['adminJobs'],
    queryFn: async () => {
      const res = await api.get('/api/jobs');
      return res.data?.items || [];
    },
  });

  /* ---------------- Fetch shortlist per job ---------------- */
  const { data: shortlist, isLoading: loadingShortlist } = useQuery({
    queryKey: ['shortlistByJob', selectedJob],
    queryFn: async () => {
      if (!selectedJob) return [];
      const res = await api.get(`/api/admin/shortlist?job_id=${selectedJob}`);
      return res.data || [];
    },
    enabled: !!selectedJob,
  });

  /* ---------------- Mutation: Admin decision ---------------- */
  const decisionMutation = useMutation({
    mutationFn: async ({ job_id, candidate_id, decision, applied_at }) => {
      const res = await api.patch('/api/admin/shortlist/decision', { job_id, candidate_id, decision, applied_at });
      return res.data;
    },
    onSuccess: (_, vars) => {
      toast.success(vars.decision === 'hired' ? '✅ Đã tuyển ứng viên này!' : '❌ Đã loại ứng viên khỏi shortlist!');
      queryClient.invalidateQueries(['shortlistByJob']);
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-8 flex gap-6">
      {/* ============ CỘT TRÁI: JOBS ============ */}
      <div className="w-1/3 bg-white rounded-2xl shadow-md border border-gray-100 flex flex-col">
        <div className="bg-gradient-to-r from-indigo-100 to-fuchsia-100 text-gray-800 font-semibold px-5 py-3 border-b rounded-t-2xl">
          📋 Danh sách công việc
        </div>

        <div className="overflow-y-auto flex-1 divide-y">
          {loadingJobs ? (
            <div className="flex items-center justify-center h-40 text-gray-500">
              <Loader2 className="animate-spin w-6 h-6 text-indigo-500 mr-2" /> Đang tải...
            </div>
          ) : jobs?.length === 0 ? (
            <div className="text-center py-10 text-gray-500 italic">Chưa có công việc nào.</div>
          ) : (
            jobs.map((job) => (
              <div
                key={job.job_id}
                onClick={() => setSelectedJob(job.job_id)}
                className={`p-4 cursor-pointer transition-all ${
                  selectedJob === job.job_id
                    ? 'bg-gradient-to-r from-indigo-50 to-fuchsia-50 border-l-4 border-indigo-500'
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

      {/* ============ CỘT PHẢI: SHORTLIST ============ */}
      <div className="flex-1 bg-white rounded-2xl shadow-md border border-gray-100 p-6 flex flex-col">
        <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800 mb-5">
          <ClipboardList className="w-6 h-6 text-indigo-600" />
          Danh sách ứng viên Shortlist
        </h2>

        {!selectedJob ? (
          <div className="flex flex-col items-center justify-center flex-1 text-gray-500 italic">
            Hãy chọn một công việc ở cột bên trái để xem danh sách shortlist.
          </div>
        ) : loadingShortlist ? (
          <div className="flex justify-center items-center flex-1 text-gray-500">
            <Loader2 className="animate-spin w-6 h-6 text-indigo-500 mr-2" /> Đang tải ứng viên shortlist...
          </div>
        ) : shortlist?.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 text-gray-400 italic">
            Không có ứng viên shortlist cho công việc này.
          </div>
        ) : (
          <div className="space-y-4">
            {shortlist.map((c) => (
              <div
                key={c.candidate_id}
                className="flex justify-between items-center bg-gradient-to-r from-white to-indigo-50 border border-gray-100 rounded-xl px-5 py-3 hover:shadow-md transition"
              >
                {/* ỨNG VIÊN */}
                <div
                  onClick={() => {
                    setSelectedCandidate(c);
                    setOpenCandidateModal(true);
                  }}
                  className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition"
                >
                  <div className="bg-indigo-100 text-indigo-600 rounded-full p-2">
                    <UserRound className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{c.full_name}</p>
                    <p className="text-sm text-gray-500">{c.user_email}</p>
                    {c.match_score && <p className="text-xs text-gray-400">Độ phù hợp: {Math.round(c.match_score)}%</p>}
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      decisionMutation.mutate({
                        job_id: c.job_id,
                        candidate_id: c.candidate_id,
                        applied_at: c.applied_at, // ✅ thêm applied_at vào payload
                        decision: 'hired',
                      })
                    }
                    disabled={decisionMutation.isPending}
                    className="px-3 py-1.5 rounded-md text-sm text-white bg-green-500 hover:bg-green-600 flex items-center gap-1"
                  >
                    <CheckCircle size={14} /> Tuyển
                  </button>
                  <button
                    onClick={() =>
                      decisionMutation.mutate({
                        job_id: c.job_id,
                        candidate_id: c.candidate_id,
                        applied_at: c.applied_at,
                        decision: 'rejected',
                      })
                    }
                    disabled={decisionMutation.isPending}
                    className="px-3 py-1.5 rounded-md text-sm text-white bg-red-500 hover:bg-red-600 flex items-center gap-1"
                  >
                    <XCircle size={14} /> Loại
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ============== Candidate Detail Modal ============== */}
      {openCandidateModal && selectedCandidate && (
        <CandidateDetailModal
          candidateId={selectedCandidate.candidate_id}
          jobId={selectedCandidate.job_id}
          appliedAt={selectedCandidate.applied_at}
          onClose={() => setOpenCandidateModal(false)}
        />
      )}
    </div>
  );
}
