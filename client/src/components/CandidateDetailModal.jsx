import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api.jsx';
import { Loader2, X, ExternalLink, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import FeedbackSection from '../components/Feedback/FeedbackSection.jsx';

export default function CandidateDetailModal({ candidateId, jobId, appliedAt, onClose }) {
  const [pdfError, setPdfError] = useState(false);
  const [aiMatch, setAiMatch] = useState(null);
  const [loadingMatch, setLoadingMatch] = useState(false);
  const [matchError, setMatchError] = useState(null);
  const [showFeedbackOnly, setShowFeedbackOnly] = useState(false);
  const [loadingDecision, setLoadingDecision] = useState(false);

  const queryClient = useQueryClient();

  /* ========================== Fetch thông tin ứng viên ========================== */
  const { data: candidate, isLoading: loadingCandidate } = useQuery({
    queryKey: ['candidateDetail', candidateId],
    queryFn: async () => {
      const res = await api.get(`/api/admin/candidates/${candidateId}`);
      return res.data;
    },
    enabled: !!candidateId,
  });

  /* ========================== Fetch provinces & districts ========================== */
  const { data: provinces } = useQuery({
    queryKey: ['provinces'],
    queryFn: async () => (await api.get('/api/provinces')).data,
    staleTime: 1000 * 60 * 10,
  });

  const { data: districts } = useQuery({
    queryKey: ['districts', candidate?.province_code],
    queryFn: async () => {
      if (!candidate?.province_code) return [];
      const res = await api.get(`/api/districts?province_code=${candidate.province_code}`);
      return res.data;
    },
    enabled: !!candidate?.province_code,
    staleTime: 1000 * 60 * 10,
  });

  const provinceName = provinces?.find((p) => String(p.code) === String(candidate?.province_code))?.name || 'Không có';
  const districtName = districts?.find((d) => String(d.code) === String(candidate?.district_code))?.name || 'Không có';

  /* ========================== Fetch vòng hiện tại ========================== */
  const { data: currentRound, isFetching: loadingRound } = useQuery({
    queryKey: ['currentRound', jobId, candidateId],
    queryFn: async () => {
      const res = await api.get('/api/application-rounds', { params: { job_id: jobId, candidate_id: candidateId } });
      const rounds = res.data;
      return rounds.sort((a, b) => b.round_order - a.round_order)[0] || null;
    },
    enabled: !!jobId && !!candidateId,
  });

  /* ========================== Chuẩn hóa URL CV ========================== */
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const pdfPreviewUrl = candidate?.cv_url ? `${baseUrl}/uploads/preview/${candidate.cv_url.split('/').pop()}` : null;
  const pdfDownloadUrl = candidate?.cv_url ? `${baseUrl}${candidate.cv_url}` : null;

  /* ========================== AI Match ========================== */
  const handleAIMatch = async () => {
    if (!candidateId || !jobId || !appliedAt) return;
    setLoadingMatch(true);
    setMatchError(null);
    try {
      const res = await api.get(`/api/applications/ai-match`, {
        params: { job_id: jobId, candidate_id: candidateId, applied_at: appliedAt },
      });
      setAiMatch(res.data);
    } catch (err) {
      console.error('AI Match error:', err);
      setMatchError('Không thể phân tích CV bằng AI.');
    } finally {
      setLoadingMatch(false);
    }
  };

  /* ========================== Pass / Reject nhanh vòng CV Screening ========================== */
  const handleDecision = async (decision) => {
    if (!currentRound || currentRound.round_name !== 'CV Screening') return;
    setLoadingDecision(true);
    try {
      await api.patch('/api/application-rounds', {
        job_id: jobId,
        candidate_id: candidateId,
        round_name: 'CV Screening',
        round_order: currentRound.round_order,
        status: decision === 'pass' ? 'PASSED' : 'REJECTED',
        score: null,
        feedback_html: decision === 'pass' ? 'CV đạt yêu cầu' : 'Không đạt yêu cầu vòng CV',
      });
      toast.success(decision === 'pass' ? '✅ Ứng viên đã được shortlist!' : '🚫 Ứng viên đã bị từ chối!');
      queryClient.invalidateQueries(['currentRound', jobId, candidateId]);
    } catch (err) {
      console.error('❌ Error updating decision:', err);
      toast.error('Lỗi khi cập nhật trạng thái.');
    } finally {
      setLoadingDecision(false);
    }
  };

  /* ========================== UI chính ========================== */
  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-[1200px] h-[85vh] max-h-[800px] shadow-xl relative animate-fade-in flex overflow-hidden">
        {/* Nút đóng */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 text-gray-500 hover:text-gray-800 transition bg-white rounded-full p-1 shadow-md hover:shadow-lg"
        >
          <X size={22} />
        </button>

        {loadingCandidate ? (
          <div className="flex justify-center items-center w-full h-full">
            <Loader2 className="animate-spin w-8 h-8 text-gray-500" />
          </div>
        ) : (
          <>
            {/* ========== CỘT TRÁI: THÔNG TIN ỨNG VIÊN ========== */}
            <div className="w-[330px] p-5 overflow-y-auto border-r border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Thông tin ứng viên</h2>
              <div className="space-y-2.5 text-gray-700 text-sm">
                <p>
                  <span className="text-xs text-gray-500">Họ tên:</span> <br /> <b>{candidate?.full_name || '—'}</b>
                </p>
                <p>
                  <span className="text-xs text-gray-500">Email:</span>
                  <br />
                  {candidate?.user_email}
                </p>
                <p>
                  <span className="text-xs text-gray-500">Giới tính:</span> {candidate?.gender || 'Không rõ'}
                </p>
                <p>
                  <span className="text-xs text-gray-500">Địa chỉ:</span> {candidate?.address || 'Không có'}
                </p>
                <p>
                  <span className="text-xs text-gray-500">Thành phố:</span> {provinceName}
                </p>
                <p>
                  <span className="text-xs text-gray-500">Quận/Huyện:</span> {districtName}
                </p>

                {/* CV */}
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-1.5">CV của ứng viên</p>
                  {pdfDownloadUrl ? (
                    <a
                      href={pdfDownloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-medium text-sm"
                    >
                      <ExternalLink size={14} /> Mở toàn màn hình
                    </a>
                  ) : (
                    <p className="text-gray-400 italic text-sm">Chưa có</p>
                  )}
                </div>

                {/* ⚡ Đánh giá AI Match */}
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={handleAIMatch}
                    disabled={loadingMatch}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-md font-medium transition"
                  >
                    {loadingMatch ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {loadingMatch ? 'Đang phân tích...' : 'Phân tích độ phù hợp AI'}
                  </button>

                  {aiMatch && (
                    <div className="mt-3 bg-white border rounded-lg p-3 shadow-sm space-y-4">
                      {/* Điểm phù hợp */}
                      <p className="font-medium text-gray-800">
                        Điểm phù hợp:{' '}
                        <span
                          className={`font-semibold ${
                            aiMatch.match_score >= 80
                              ? 'text-green-600'
                              : aiMatch.match_score >= 50
                              ? 'text-yellow-600'
                              : 'text-red-600'
                          }`}
                        >
                          {aiMatch.match_score}/100
                        </span>
                      </p>

                      {/* Nhận xét chi tiết */}
                      {aiMatch.analysis && (
                        <div className="text-sm space-y-3">
                          {/* Điểm mạnh */}
                          {aiMatch.analysis.strengths?.length > 0 && (
                            <div>
                              <p className="font-semibold text-green-700 mb-1">💪 Điểm mạnh:</p>
                              <ul className="list-disc list-inside text-gray-700">
                                {aiMatch.analysis.strengths.map((item, i) => (
                                  <li key={i}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Điểm yếu */}
                          {aiMatch.analysis.weaknesses?.length > 0 && (
                            <div>
                              <p className="font-semibold text-red-700 mb-1">⚠️ Điểm yếu:</p>
                              <ul className="list-disc list-inside text-gray-700">
                                {aiMatch.analysis.weaknesses.map((item, i) => (
                                  <li key={i}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {matchError && <p className="text-red-600 text-xs mt-2">{matchError}</p>}
                </div>
              </div>
            </div>

            {/* ========== CỘT PHẢI: FEEDBACK + PDF ========== */}
            <div className="flex-1 flex flex-col relative bg-gray-50">
              {/* Thanh tiêu đề */}
              <div className="p-3 border-b border-gray-200 bg-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowFeedbackOnly((prev) => !prev)}
                    className="flex items-center gap-2 text-gray-800 font-medium hover:text-indigo-600 transition"
                  >
                    {showFeedbackOnly ? (
                      <>
                        <X size={16} /> Đóng phản hồi
                      </>
                    ) : (
                      <>
                        Phản hồi phỏng vấn <span className="text-xs text-gray-400">(bấm để nhập)</span>
                      </>
                    )}
                  </button>

                  {currentRound && (
                    <span className="ml-3 text-sm text-gray-500">
                      {loadingRound ? 'Đang tải vòng...' : `${currentRound.round_name} • `}
                      <span
                        className={`font-medium ${
                          currentRound.status === 'PASSED'
                            ? 'text-green-600'
                            : currentRound.status === 'REJECTED'
                            ? 'text-red-600'
                            : 'text-gray-700'
                        }`}
                      >
                        {currentRound.status}
                      </span>
                    </span>
                  )}
                </div>

                {currentRound?.round_name === 'CV Screening' && currentRound.status === 'SCHEDULED' && (
                  <div className="flex gap-2 mr-10 ">
                    <button
                      onClick={() => handleDecision('pass')}
                      disabled={loadingDecision}
                      className={`cursor-pointer px-4 py-1.5 rounded-lg text-white text-sm font-medium transition ${
                        loadingDecision ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 shadow-sm'
                      }`}
                    >
                      {loadingDecision ? 'Đang xử lý...' : 'Pass'}
                    </button>

                    <button
                      onClick={() => handleDecision('reject')}
                      disabled={loadingDecision}
                      className={`cursor-pointer px-4 py-1.5 rounded-lg text-white text-sm font-medium transition ${
                        loadingDecision ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 shadow-sm'
                      }`}
                    >
                      {loadingDecision ? 'Đang xử lý...' : 'Từ chối'}
                    </button>
                  </div>
                )}
              </div>

              {/* Nội dung */}
              <div className="flex-1 overflow-y-auto p-4">
                {showFeedbackOnly ? (
                  <FeedbackSection jobId={jobId} candidateId={candidateId} />
                ) : pdfPreviewUrl ? (
                  pdfError ? (
                    <div className="text-center">
                      <p className="text-sm text-gray-500 mb-3">Không thể hiển thị xem trước PDF</p>
                      <a
                        href={pdfDownloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <ExternalLink size={16} /> Mở CV trong tab mới
                      </a>
                    </div>
                  ) : (
                    <iframe
                      src={pdfPreviewUrl}
                      title="CV Ứng viên"
                      className="w-full h-full rounded-r-2xl border-0"
                      onError={() => setPdfError(true)}
                    />
                  )
                ) : (
                  <div className="text-gray-500 text-center">
                    <p className="text-sm">Ứng viên chưa tải lên CV</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
