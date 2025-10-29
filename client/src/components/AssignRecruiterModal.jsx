import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../utils/api.jsx';
import toast from 'react-hot-toast';
import { Search, X } from 'lucide-react';

export default function AssignRecruiterModal({ job, onClose, onSuccess }) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const modalRef = useRef(null);

  // ✅ Đóng modal khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(e) {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // ✅ Lấy danh sách recruiter
  const { data: recruiters = [], isLoading } = useQuery({
    queryKey: ['recruiter-search', search],
    queryFn: async () => {
      const res = await api.get(`/api/admins?role=recruiter&search=${search}`);
      return res.data.items ?? [];
    },
  });

  // ✅ Mutation: phân công recruiter
  const assignMutation = useMutation({
    mutationFn: async (recruiter_id) => await api.patch(`/api/admin/jobs/${job.job_id}`, { recruiter_id }),
    onSuccess: () => {
      toast.success('Phân công recruiter thành công');
      onSuccess?.();
      onClose();
    },
    onError: () => toast.error('Phân công thất bại'),
  });

  const handleAssign = () => {
    if (!selected) return toast.error('Vui lòng chọn recruiter');
    assignMutation.mutate(selected.user_id);
  };

  return (
    <div className="fixed inset-0 bg-gray-200/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div
        ref={modalRef}
        className="bg-white shadow-xl rounded-2xl w-[460px] p-6 border border-gray-100 transform transition-all animate-fade-in"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Phân công recruiter</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors" title="Đóng">
            <X size={20} />
          </button>
        </div>

        {/* Job info */}
        <div className="text-sm text-gray-700 mb-3">
          <span className="font-medium">Công việc:</span> {job.title_vi}
        </div>

        {/* Search box */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Tìm recruiter theo tên hoặc email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-3 py-2 w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Recruiter list */}
        <div className="border rounded-lg max-h-56 overflow-y-auto divide-y divide-gray-100">
          {isLoading ? (
            <div className="p-3 text-center text-gray-500 italic">Đang tải...</div>
          ) : recruiters.length === 0 ? (
            <div className="p-3 text-center text-gray-500 italic">Không tìm thấy recruiter nào.</div>
          ) : (
            recruiters.map((r) => {
              const isSelected = selected?.user_id === r.user_id;
              return (
                <div
                  key={r.user_id}
                  onClick={() => setSelected(r)}
                  className={`flex flex-col p-3 cursor-pointer transition-all duration-150 ${
                    isSelected
                      ? 'bg-blue-600 text-white border-l-4 border-blue-700 shadow-md scale-[1.02]'
                      : 'bg-white hover:bg-blue-50 text-gray-800'
                  }`}
                >
                  <p className={`font-semibold ${isSelected ? 'text-white' : 'text-gray-800'} transition-colors`}>
                    {r.full_name}
                  </p>
                  <p className={`text-xs ${isSelected ? 'text-blue-100' : 'text-gray-500'} transition-colors`}>
                    {r.email}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm transition-colors">
            Hủy
          </button>
          <button
            onClick={handleAssign}
            disabled={!selected || assignMutation.isPending}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selected ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-600 cursor-not-allowed'
            }`}
          >
            {assignMutation.isPending ? 'Đang lưu...' : 'Xác nhận'}
          </button>
        </div>
      </div>
    </div>
  );
}
