import { useState } from 'react';
import { api } from '../utils/api.jsx';
import toast from 'react-hot-toast';
import { useAuth } from '../store/useAuth.jsx';
import { X, CheckCircle2, Loader2, FileText, HelpCircle, Send } from 'lucide-react';

export default function ApplicationForm({ job, onClose }) {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  let questions = [];
  try {
    if (typeof job.questions_json === 'string') {
      questions = JSON.parse(job.questions_json);
    } else if (Array.isArray(job.questions_json)) {
      questions = job.questions_json;
    }
  } catch (err) {
    console.warn('⚠️ Parse questions_json lỗi:', err);
  }

  const [answers, setAnswers] = useState(
    questions.map((q) => ({
      question_id: q.question_id,
      label: q.label,
      answer: null,
    }))
  );

  const handleChange = (index, value) => {
    const updated = [...answers];
    updated[index].answer = value;
    setAnswers(updated);
  };

  const handleSubmit = async () => {
    // Kiểm tra xem đã trả lời hết câu hỏi chưa
    const unanswered = answers.filter((a) => a.answer === null);
    if (unanswered.length > 0) {
      toast.error('Vui lòng trả lời tất cả các câu hỏi!');
      return;
    }

    try {
      setLoading(true);
      await api.post('/api/applications', {
        job_id: job.job_id,
        answers: answers.filter((a) => a.answer !== null),
      });

      await api.post('/api/application-rounds', {
        job_id: job.job_id,
        candidate_id: user.user_id,
        round_name: 'CV Screening',
        round_order: 1,
        status: 'SCHEDULED',
        scheduled_at: null,
      });

      toast.success('Ứng tuyển thành công! Hồ sơ sẽ được sàng lọc.');
      onClose();
    } catch (err) {
      console.error('❌ Lỗi khi ứng tuyển:', err);
      if (err.response?.status === 409) {
        toast.error('Bạn đã ứng tuyển công việc này rồi!');
      } else if (err.response?.status === 401) {
        toast.error('Vui lòng đăng nhập trước khi ứng tuyển');
      } else {
        toast.error('Không thể gửi ứng tuyển');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl transform animate-scale-in"
      >
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <FileText className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Đơn ứng tuyển</h2>
                <p className="text-white/80 text-sm">{job.title_vi}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center transition-all hover:rotate-90 duration-300"
            >
              <X className="text-white" size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-180px)] px-8 py-6">
          {questions.length > 0 ? (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                <HelpCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="text-sm text-blue-800 font-medium mb-1">Câu hỏi sàng lọc</p>
                  <p className="text-sm text-blue-600">
                    Vui lòng trả lời {questions.length} câu hỏi dưới đây để hoàn tất đơn ứng tuyển
                  </p>
                </div>
              </div>

              {questions.map((q, idx) => (
                <div
                  key={q.question_id}
                  className="bg-gradient-to-br from-gray-50 to-purple-50 rounded-2xl p-6 border-2 border-gray-100 hover:border-purple-200 transition-all"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">{idx + 1}</span>
                    </div>
                    <p className="font-semibold text-gray-800 text-lg leading-relaxed">{q.label}</p>
                  </div>

                  <div className="flex gap-4 ml-11">
                    <label className="relative flex items-center cursor-pointer group">
                      <input
                        type="radio"
                        name={`q_${q.question_id}`}
                        checked={answers[idx].answer === true}
                        onChange={() => handleChange(idx, true)}
                        className="sr-only"
                      />
                      <div
                        className={`w-6 h-6 rounded-full border-2 transition-all ${
                          answers[idx].answer === true
                            ? 'border-green-500 bg-green-500'
                            : 'border-gray-300 group-hover:border-green-400'
                        }`}
                      >
                        {answers[idx].answer === true && <CheckCircle2 className="text-white" size={20} />}
                      </div>
                      <span
                        className={`ml-3 font-medium transition-colors ${
                          answers[idx].answer === true ? 'text-green-700' : 'text-gray-700 group-hover:text-green-600'
                        }`}
                      >
                        Có
                      </span>
                    </label>

                    <label className="relative flex items-center cursor-pointer group">
                      <input
                        type="radio"
                        name={`q_${q.question_id}`}
                        checked={answers[idx].answer === false}
                        onChange={() => handleChange(idx, false)}
                        className="sr-only"
                      />
                      <div
                        className={`w-6 h-6 rounded-full border-2 transition-all ${
                          answers[idx].answer === false
                            ? 'border-red-500 bg-red-500'
                            : 'border-gray-300 group-hover:border-red-400'
                        }`}
                      >
                        {answers[idx].answer === false && <X className="text-white" size={20} />}
                      </div>
                      <span
                        className={`ml-3 font-medium transition-colors ${
                          answers[idx].answer === false ? 'text-red-700' : 'text-gray-700 group-hover:text-red-600'
                        }`}
                      >
                        Không
                      </span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                <FileText className="w-10 h-10 text-purple-600" />
              </div>
              <p className="text-gray-500 text-lg">Không có câu hỏi sàng lọc cho công việc này</p>
              <p className="text-gray-400 text-sm mt-2">Bạn có thể gửi đơn ứng tuyển ngay</p>
            </div>
          )}
        </div>

        {/* Footer with actions */}
        <div className="bg-gradient-to-br from-gray-50 to-purple-50 px-8 py-6 border-t border-gray-100">
          <div className="flex justify-between items-center gap-4">
            <div className="text-sm text-gray-600">
              {questions.length > 0 && (
                <span>
                  Đã trả lời:{' '}
                  <span className="font-semibold text-purple-600">
                    {answers.filter((a) => a.answer !== null).length}/{questions.length}
                  </span>
                </span>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-xl border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 font-semibold text-gray-700 transition-all"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || (questions.length > 0 && answers.some((a) => a.answer === null))}
                className={`group flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                  loading || (questions.length > 0 && answers.some((a) => a.answer === null))
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-xl hover:scale-105'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    Gửi ứng tuyển
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
