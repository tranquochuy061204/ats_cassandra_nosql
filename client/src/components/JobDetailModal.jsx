import { useQuery } from '@tanstack/react-query';
import { api } from '../utils/api.jsx';
import { Loader2, X } from 'lucide-react';

export default function JobDetailModal({ jobId, onClose }) {
  const { data, isLoading } = useQuery({
    queryKey: ['jobDetail', jobId],
    queryFn: async () => {
      const res = await api.get(`/api/admin/jobs/${jobId}`);
      return res.data;
    },
    enabled: !!jobId,
  });

  return (
    <div className="fixed inset-0 bg-black/30 flex justify-center items-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-[650px] max-h-[90vh] overflow-y-auto shadow-lg p-6 relative animate-fade-in">
        {/* ✖ Nút đóng */}
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 transition">
          <X size={20} />
        </button>

        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="animate-spin w-8 h-8 text-gray-500" />
          </div>
        ) : (
          <div>
            {/* 🏷 Tiêu đề */}
            <h2 className="text-2xl font-semibold text-gray-800 mb-3 leading-snug">{data.title_vi}</h2>

            {/* 📋 Thông tin cơ bản */}
            <div className="space-y-1 text-sm text-gray-700">
              <p>
                <b>Hình thức:</b> {data.employment_type} / {data.work_type}
              </p>
              <p>
                <b>Cấp độ:</b> {data.level}
              </p>
              <p>
                <b>Địa chỉ:</b> {data.address_line}
              </p>
              <p>
                <b>Mức lương:</b> {data.salary_vnd_min?.toLocaleString()} - {data.salary_vnd_max?.toLocaleString()} VND
              </p>
            </div>

            {/* 🧾 Yêu cầu */}
            <div className="mt-5">
              <h3 className="font-medium text-gray-800 mb-2 text-[15px]">Yêu cầu</h3>
              <div
                className="prose prose-sm max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: data.requirements_vi }}
              />
            </div>

            {/* 🧠 Kỹ năng */}
            <div className="mt-4">
              <h3 className="font-medium text-gray-800 mb-2 text-[15px]">Kỹ năng</h3>
              <p className="text-gray-700 text-sm">{data.skills?.length ? data.skills.join(', ') : 'Không có'}</p>
            </div>

            {/* ❓ Câu hỏi tuyển dụng */}
            <div className="mt-5 border-t pt-4">
              <h3 className="font-medium text-gray-800 mb-3 text-[15px]">Câu hỏi tuyển dụng (Screening)</h3>

              {(() => {
                let questions = [];
                let answers = [];

                try {
                  questions =
                    typeof data.questions_json === 'string'
                      ? JSON.parse(data.questions_json)
                      : data.questions_json || [];
                } catch {
                  questions = [];
                }

                try {
                  answers = typeof data.answers === 'string' ? JSON.parse(data.answers) : data.answers || [];
                } catch {
                  answers = [];
                }

                if (!questions.length) {
                  return <p className="text-gray-500 text-sm">Không có câu hỏi nào được thiết lập.</p>;
                }

                return (
                  <ul className="space-y-2">
                    {questions.map((q, index) => {
                      const candidateAnswer = answers.find((a) => a.question_id === q.question_id);
                      const answerValue = candidateAnswer ? candidateAnswer.answer : null;

                      const isMatch = answerValue !== null && answerValue === q.preferred_answer;
                      const isKnockoutFailed = q.knockout && !isMatch;

                      return (
                        <li
                          key={q.question_id}
                          className={`border rounded-lg px-3 py-2 flex justify-between items-start text-sm ${
                            isKnockoutFailed ? 'bg-red-50 border-red-300' : 'bg-gray-50'
                          }`}
                        >
                          <div className="flex-1">
                            <p className="font-medium text-gray-800">
                              {index + 1}. {q.label}
                            </p>
                            <div className="text-xs mt-1">
                              <p className="text-gray-600">
                                Mong muốn:{' '}
                                <span
                                  className={
                                    q.preferred_answer ? 'text-green-600 font-medium' : 'text-red-600 font-medium'
                                  }
                                >
                                  {q.preferred_answer ? 'Có' : 'Không'}
                                </span>
                              </p>
                              <p className="text-gray-600">
                                Ứng viên trả lời:{' '}
                                {answerValue === null ? (
                                  <span className="text-gray-400 italic">Chưa trả lời</span>
                                ) : (
                                  <span className={isMatch ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                                    {answerValue ? 'Có' : 'Không'}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>

                          {q.knockout && (
                            <span
                              className={`ml-3 px-2 py-1 text-xs rounded font-semibold ${
                                isKnockoutFailed ? 'bg-red-200 text-red-800' : 'bg-red-100 text-red-700'
                              }`}
                            >
                              Knockout
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
