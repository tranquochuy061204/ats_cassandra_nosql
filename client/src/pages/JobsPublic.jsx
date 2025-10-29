import { useQuery } from '@tanstack/react-query';
import { api } from '../utils/api.jsx';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  MapPin,
  DollarSign,
  Calendar,
  TrendingUp,
  Clock,
  Users,
  ChevronRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useState } from 'react';

export default function JobsPublic() {
  const [hoveredCard, setHoveredCard] = useState(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['public-jobs'],
    queryFn: async () => {
      const res = await api.get('/api/jobs/public');
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-purple-600 animate-spin" />
          <p className="text-gray-600 text-lg">Đang tải danh sách việc làm...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-xl p-8 max-w-md">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Có lỗi xảy ra</h2>
          <p className="text-gray-600">Không thể tải danh sách việc làm. Vui lòng thử lại sau.</p>
        </div>
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-xl p-12 max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
            <Briefcase className="w-10 h-10 text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Chưa có việc làm</h2>
          <p className="text-gray-600">Hiện tại chưa có vị trí nào đang tuyển dụng. Hãy quay lại sau nhé!</p>
        </div>
      </div>
    );
  }

  const getWorkTypeColor = (type) => {
    const colors = {
      remote: 'bg-green-100 text-green-700',
      hybrid: 'bg-blue-100 text-blue-700',
      onsite: 'bg-orange-100 text-orange-700',
    };
    return colors[type?.toLowerCase()] || 'bg-gray-100 text-gray-700';
  };

  const getLevelColor = (level) => {
    const colors = {
      intern: 'bg-purple-100 text-purple-700',
      fresher: 'bg-cyan-100 text-cyan-700',
      junior: 'bg-blue-100 text-blue-700',
      middle: 'bg-indigo-100 text-indigo-700',
      senior: 'bg-pink-100 text-pink-700',
      lead: 'bg-red-100 text-red-700',
    };
    return colors[level?.toLowerCase()] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-block mb-4 px-6 py-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full">
            <span className="text-purple-700 font-semibold text-sm">🚀 {data.length} vị trí đang tuyển</span>
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
            Cơ hội nghề nghiệp
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Khám phá những vị trí tuyệt vời và bắt đầu hành trình sự nghiệp của bạn cùng chúng tôi
          </p>
        </div>

        {/* Jobs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map((job) => (
            <div
              key={job.job_id}
              onMouseEnter={() => setHoveredCard(job.job_id)}
              onMouseLeave={() => setHoveredCard(null)}
              className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:-translate-y-2 border-2 border-transparent hover:border-purple-200"
            >
              {/* Gradient overlay on hover */}
              <div
                className={`absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 transition-opacity duration-300 ${
                  hoveredCard === job.job_id ? 'opacity-100' : 'opacity-0'
                }`}
              ></div>

              <div className="relative z-10 p-6">
                {/* Header with icon */}
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                    <Briefcase className="text-white" size={28} />
                  </div>
                  <div className="flex flex-wrap gap-2 justify-end">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getWorkTypeColor(job.work_type)}`}>
                      {job.work_type}
                    </span>
                  </div>
                </div>

                {/* Job Title */}
                <h2 className="text-xl font-bold mb-2 text-gray-800 group-hover:text-purple-600 transition-colors line-clamp-2 min-h-[3.5rem]">
                  {job.title_vi}
                </h2>

                {/* Location */}
                <div className="flex items-center text-gray-600 mb-4">
                  <MapPin size={16} className="mr-2 text-purple-500 flex-shrink-0" />
                  <span className="text-sm line-clamp-1">{job.address_line}</span>
                </div>

                {/* Info Grid */}
                <div className="space-y-3 mb-4 pb-4 border-b border-gray-100">
                  {/* Employment Type */}
                  <div className="flex items-center text-sm">
                    <Clock size={16} className="mr-2 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-700">{job.employment_type}</span>
                  </div>

                  {/* Level */}
                  <div className="flex items-center text-sm">
                    <TrendingUp size={16} className="mr-2 text-gray-400 flex-shrink-0" />
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getLevelColor(job.level)}`}>
                      {job.level}
                    </span>
                  </div>

                  {/* Salary */}
                  <div className="flex items-center text-sm">
                    <DollarSign size={16} className="mr-2 text-gray-400 flex-shrink-0" />
                    <span className="font-semibold text-green-600">
                      {job.salary_vnd_min
                        ? `${job.salary_vnd_min.toLocaleString('vi-VN')} - ${job.salary_vnd_max?.toLocaleString(
                            'vi-VN'
                          )}₫`
                        : 'Thương lượng'}
                    </span>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar size={14} className="mr-1" />
                    <span>{new Date(job.published_at).toLocaleDateString('vi-VN')}</span>
                  </div>

                  <Link
                    to={`/jobs/${job.job_id}`}
                    className="inline-flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-sm font-semibold hover:shadow-lg transform hover:scale-105 transition-all"
                  >
                    Chi tiết
                    <ChevronRight
                      size={16}
                      className={`transition-transform ${hoveredCard === job.job_id ? 'translate-x-1' : ''}`}
                    />
                  </Link>
                </div>
              </div>

              {/* Decorative element */}
              <div className="absolute -bottom-2 -right-2 w-24 h-24 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full blur-2xl opacity-0 group-hover:opacity-30 transition-opacity"></div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-12 shadow-2xl">
          <h2 className="text-3xl font-bold text-white mb-4">Không tìm thấy vị trí phù hợp?</h2>
          <p className="text-white/90 text-lg mb-6 max-w-2xl mx-auto">
            Đừng lo lắng, chúng tôi sẽ có công việc phù hợp cho bạn vào tương lai !
          </p>
        </div>
      </div>
    </div>
  );
}
