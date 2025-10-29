import { useEffect, useState } from 'react';
import { api } from '../../utils/api.jsx';
import { Loader2, Edit2, Save, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function FeedbackSection({ jobId, candidateId }) {
  const [loading, setLoading] = useState(false);
  const [rounds, setRounds] = useState([]);
  const [editingRound, setEditingRound] = useState(null);
  const [newFeedback, setNewFeedback] = useState({
    round_name: '',
    status: 'PENDING',
    score: '',
    feedback_html: '',
  });

  /* ==================== Fetch rounds ==================== */
  useEffect(() => {
    fetchRounds();
  }, [jobId, candidateId]);

  async function fetchRounds() {
    if (!jobId || !candidateId) return;
    setLoading(true);
    try {
      const res = await api.get('/api/application-rounds', {
        params: { job_id: jobId, candidate_id: candidateId },
      });
      setRounds(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải danh sách phản hồi');
    } finally {
      setLoading(false);
    }
  }

  /* ==================== Cập nhật hoặc thêm mới ==================== */
  const handleSubmit = async (round = null) => {
    const data = round
      ? round // cập nhật vòng cũ
      : {
          job_id: jobId,
          candidate_id: candidateId,
          round_name: newFeedback.round_name || 'Technical Interview',
          round_order: rounds.length + 1,
          status: newFeedback.status,
          score: Number(newFeedback.score) || null,
          feedback_html: newFeedback.feedback_html,
        };

    try {
      await api.patch('/api/application-rounds', {
        job_id: jobId,
        candidate_id: candidateId,
        round_name: data.round_name,
        round_order: data.round_order,
        status: data.status,
        score: data.score,
        feedback_html: data.feedback_html,
      });
      toast.success(round ? 'Đã cập nhật phản hồi!' : 'Đã thêm phản hồi mới!');
      setEditingRound(null);
      setNewFeedback({ round_name: '', status: 'PENDING', score: '', feedback_html: '' });
      fetchRounds();
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi lưu phản hồi');
    }
  };

  /* ==================== Render ==================== */
  return (
    <div className="p-4 bg-white h-full overflow-y-auto">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Phản hồi phỏng vấn</h3>

      {loading ? (
        <div className="flex justify-center py-6 text-gray-500">
          <Loader2 className="animate-spin mr-2" /> Đang tải phản hồi...
        </div>
      ) : (
        <>
          {/* ==================== Danh sách các vòng ==================== */}
          <div className="space-y-3">
            {rounds.map((r, i) => (
              <div
                key={i}
                className={`border rounded-lg p-3 transition bg-gray-50 hover:bg-gray-100 ${
                  editingRound?.round_order === r.round_order ? 'ring-2 ring-indigo-400 bg-white' : ''
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-semibold text-indigo-700">{r.round_name}</h4>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm px-2 py-1 rounded-full ${
                        r.status === 'PASSED'
                          ? 'bg-green-100 text-green-700'
                          : r.status === 'REJECTED'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {r.status}
                    </span>
                    <button
                      onClick={() => setEditingRound(r)}
                      className="text-gray-500 hover:text-indigo-600 transition"
                    >
                      <Edit2 size={16} />
                    </button>
                  </div>
                </div>

                {r.score && <p className="text-sm text-gray-700">Điểm: {r.score}</p>}
                {r.feedback_html && (
                  <div
                    className="prose prose-sm mt-1 text-gray-700"
                    dangerouslySetInnerHTML={{ __html: r.feedback_html }}
                  />
                )}
              </div>
            ))}

            {rounds.length === 0 && <p className="text-gray-500 text-sm text-center italic">Chưa có phản hồi nào.</p>}
          </div>

          {/* ==================== Form chỉnh sửa vòng cũ ==================== */}
          {editingRound && (
            <div className="mt-5 border-t pt-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-gray-800">Chỉnh sửa vòng: {editingRound.round_name}</h4>
                <button onClick={() => setEditingRound(null)} className="text-gray-400 hover:text-gray-700 transition">
                  <X size={18} />
                </button>
              </div>

              <select
                value={editingRound.status}
                onChange={(e) => setEditingRound({ ...editingRound, status: e.target.value })}
                className="w-full border rounded-lg p-2 mb-2"
              >
                <option value="PENDING">Đang xử lý</option>
                <option value="PASSED">Vượt qua</option>
                <option value="REJECTED">Từ chối</option>
              </select>

              <input
                type="number"
                placeholder="Điểm (nếu có)"
                value={editingRound.score || ''}
                onChange={(e) => setEditingRound({ ...editingRound, score: e.target.value })}
                className="w-full border rounded-lg p-2 mb-2"
              />

              <textarea
                rows="3"
                placeholder="Ghi chú chi tiết..."
                value={editingRound.feedback_html || ''}
                onChange={(e) => setEditingRound({ ...editingRound, feedback_html: e.target.value })}
                className="w-full border rounded-lg p-2"
              />

              <button
                onClick={() => handleSubmit(editingRound)}
                className="mt-3 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg flex items-center justify-center gap-2"
              >
                <Save size={16} />
                Lưu thay đổi
              </button>
            </div>
          )}

          {/* ==================== Form thêm mới ==================== */}
          {!editingRound && (
            <div className="mt-6 border-t pt-4">
              <h4 className="font-semibold mb-2 text-gray-800">Thêm phản hồi mới</h4>
              <input
                type="text"
                placeholder="Tên vòng (VD: Technical Interview)"
                value={newFeedback.round_name}
                onChange={(e) => setNewFeedback({ ...newFeedback, round_name: e.target.value })}
                className="w-full border rounded-lg p-2 mb-2"
              />
              <select
                value={newFeedback.status}
                onChange={(e) => setNewFeedback({ ...newFeedback, status: e.target.value })}
                className="w-full border rounded-lg p-2 mb-2"
              >
                <option value="PENDING">Đang xử lý</option>
                <option value="PASSED">Vượt qua</option>
                <option value="REJECTED">Từ chối</option>
              </select>
              <input
                type="number"
                placeholder="Điểm (nếu có)"
                value={newFeedback.score}
                onChange={(e) => setNewFeedback({ ...newFeedback, score: e.target.value })}
                className="w-full border rounded-lg p-2 mb-2"
              />
              <textarea
                rows="3"
                placeholder="Ghi chú chi tiết..."
                value={newFeedback.feedback_html}
                onChange={(e) => setNewFeedback({ ...newFeedback, feedback_html: e.target.value })}
                className="w-full border rounded-lg p-2"
              />
              <button
                onClick={() => handleSubmit(null)}
                className="mt-3 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg"
              >
                Lưu phản hồi mới
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
