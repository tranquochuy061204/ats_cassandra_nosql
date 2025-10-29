import { useQuery } from '@tanstack/react-query';
import { api } from '.././utils/api.jsx';
import { BriefcaseBusiness } from 'lucide-react';
function JobCard({ job, selected, onSelect, onViewDetail }) {
  const { data, isLoading } = useQuery({
    queryKey: ['applicationCount', job.job_id],
    queryFn: async () => {
      const res = await api.get(`/api/admin/applications?job_id=${job.job_id}`);
      const apps = res.data;
      return {
        total: apps.length,
        pending: apps.filter((a) => a.status === 'PENDING').length,
      };
    },
    enabled: !!job.job_id,
    staleTime: 30000,
  });

  return (
    <div
      className={`px-5 py-3 transition cursor-pointer ${
        selected ? 'bg-blue-50 border-l-4 border-blue-600' : 'hover:bg-gray-50'
      }`}
    >
      <div className="flex justify-between items-start">
        <div onClick={onSelect} className="flex items-start gap-3 flex-1">
          <BriefcaseBusiness className="w-5 h-5 text-blue-600 mt-1" />
          <div>
            <h3 className="font-medium text-gray-800 line-clamp-2">{job.title_vi}</h3>
            <p className="text-xs text-gray-500">
              {job.employment_type} · {job.work_type}
            </p>
            {isLoading ? (
              <p className="text-xs text-gray-400 mt-1">Đang tải...</p>
            ) : (
              <p className="text-xs text-gray-600 mt-1">Tổng {data?.total ?? 0} đơn</p>
            )}
          </div>
        </div>

        {/* Nút xem chi tiết job */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewDetail();
          }}
          className="ml-2 text-sm text-blue-600 hover:underline"
        >
          Xem
        </button>
      </div>
    </div>
  );
}

export default JobCard;
