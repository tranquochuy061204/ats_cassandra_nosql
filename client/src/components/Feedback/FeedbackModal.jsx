import { useState, useEffect } from 'react';
import { X, Send, Loader2, PlusCircle } from 'lucide-react';
import { api } from '../../utils/api.jsx';
import { toast } from 'react-hot-toast';

export default function FeedbackModal({ jobId, candidateId, onClose, onSaved }) {
  const [rounds, setRounds] = useState([]); // 🧩 Danh sách vòng có sẵn
  const [selectedRound, setSelectedRound] = useState('');
  const [newRoundName, setNewRoundName] = useState('');
  const [isNewRound, setIsNewRound] = useState(false);

  const [status, setStatus] = useState('PENDING');
  const [score, setScore] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingRounds, setLoadingRounds] = useState(false);

  /* =========================
   * Fetch các vòng hiện có của ứng viên
   * ========================= */
  useEffect(() => {
    fetchRounds();
  }, []);

  async function fetchRounds() {
    setLoadingRounds(true);
    try {
      const res = await api.get('/api/application-rounds', {
        params: { job_id: jobId, candidate_id: candidateId },
      });
      setRounds(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải danh sách vòng');
    } finally {
      setLoadingRounds(false);
    }
  }

  /* =========================
   * Xác định round_order hiện tại
   * ========================= */
  const nextRoundOrder =
    isNewRound && rounds.length > 0
      ? Math.max(...rounds.map((r) => r.round_order)) + 1
      : rounds.find((r) => r.round_name === selectedRound)?.round_order || 1;

  /* =========================
   * Submit feedback
   * ========================= */
  const handleSubmit = async () => {
    if (!status) return toast.error('Vui lòng chọn trạng thái');

    console.log({ isNewRound, selectedRound, newRoundName });
    const roundName = isNewRound ? newRoundName.trim() : selectedRound;

    console.log('đây là roundName', roundName);
    if (!roundName) return toast.error('Vui lòng nhập hoặc chọn tên vòng');

    setLoading(true);
    try {
      await api.patch('/api/application-rounds', {
        job_id: jobId,
        candidate_id: candidateId,
        round_name: roundName,
        round_order: nextRoundOrder,
        status,
        score: score ? Number(score) : null,
        feedback_html: comment,
      });

      toast.success('Đã lưu phản hồi!');
      onSaved?.();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi lưu phản hồi');
    } finally {
      setLoading(false);
    }
  };

  /* =========================
   * Giao diện
   * ========================= */
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>

        <h2 className="text-xl font-semibold text-gray-800 mb-4">Phản hồi vòng tuyển chọn</h2>

        {loadingRounds ? (
          <div className="flex justify-center py-6 text-gray-500">
            <Loader2 className="animate-spin mr-2" /> Đang tải danh sách vòng...
          </div>
        ) : (
          <div className="space-y-4">
            {/* =========================
             * Chọn vòng phỏng vấn
             * ========================= */}
            <div>
              <label className="block text-sm font-medium mb-1">Vòng phỏng vấn</label>

              {isNewRound ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nhập tên vòng mới..."
                    value={newRoundName}
                    onChange={(e) => setNewRoundName(e.target.value)}
                    className="flex-1 border rounded-lg p-2 focus:ring focus:ring-indigo-200"
                  />
                  <button
                    onClick={() => {
                      setIsNewRound(false);
                      setNewRoundName('');
                    }}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Hủy
                  </button>
                </div>
              ) : (
                <div className="flex gap-2 items-center">
                  <select
                    value={selectedRound}
                    onChange={(e) => setSelectedRound(e.target.value)}
                    className="flex-1 border rounded-lg p-2 focus:ring focus:ring-indigo-200"
                  >
                    <option value="">-- Chọn vòng --</option>
                    {rounds.map((r) => (
                      <option key={r.round_order} value={r.round_name}>
                        {r.round_name} ({r.status})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setIsNewRound(true)}
                    className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 text-sm"
                  >
                    <PlusCircle size={16} /> Thêm
                  </button>
                </div>
              )}
            </div>

            {/* =========================
             * Trạng thái
             * ========================= */}
            <div>
              <label className="block text-sm font-medium mb-1">Trạng thái</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full border rounded-lg p-2 focus:ring focus:ring-indigo-200"
              >
                <option value="PENDING">Đang xử lý</option>
                <option value="PASSED">Vượt qua</option>
                <option value="REJECTED">Từ chối</option>
              </select>
            </div>

            {/* =========================
             * Điểm
             * ========================= */}
            <div>
              <label className="block text-sm font-medium mb-1">Điểm đánh giá (nếu có)</label>
              <input
                type="number"
                className="w-full border rounded-lg p-2 focus:ring focus:ring-indigo-200"
                value={score}
                onChange={(e) => setScore(e.target.value)}
              />
            </div>

            {/* =========================
             * Nhận xét
             * ========================= */}
            <div>
              <label className="block text-sm font-medium mb-1">Nhận xét</label>
              <textarea
                rows="3"
                className="w-full border rounded-lg p-2 focus:ring focus:ring-indigo-200"
                placeholder="Nhận xét ngắn gọn về ứng viên..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              ></textarea>
            </div>
          </div>
        )}

        {/* =========================
         * Nút lưu
         * ========================= */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="mt-5 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl flex justify-center items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Đang lưu...
            </>
          ) : (
            <>
              <Send size={18} />
              Gửi phản hồi
            </>
          )}
        </button>
      </div>
    </div>
  );
}
