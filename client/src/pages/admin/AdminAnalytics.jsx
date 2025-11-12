import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Users, Briefcase, Calendar, Award, Clock, RefreshCw } from 'lucide-react';

const ATSAnalyticsDashboard = () => {
  const [timeRange, setTimeRange] = useState('30days');
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);

  // Fetch dashboard data from API
  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
    const response = await fetch('http://localhost:3000/api/admin/dashboard', {
      credentials: 'include',
    });

      if (!response.ok) throw new Error('Failed to fetch dashboard data');

      const data = await response.json();
      setDashboardData(data);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [timeRange]);

  const StatCard = ({ icon: Icon, title, value, change, trend }) => (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-blue-50 rounded-lg">
          <Icon className="w-6 h-6 text-blue-600" />
        </div>
        {change && (
          <span className={`text-sm font-semibold ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            {trend === 'up' ? '↑' : '↓'} {change}
          </span>
        )}
      </div>
      <h3 className="text-gray-600 text-sm font-medium mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center bg-white p-8 rounded-lg shadow">
          <p className="text-red-600 mb-4">❌ Lỗi: {error}</p>
          <button onClick={fetchDashboard} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) return null;

  const {
    stats,
    recentActivity,
    topJobs,
    applicationTrend,
    statusDistribution,
    jobStatusDistribution,
    conversionRate,
  } = dashboardData;

  // Map status to Vietnamese
  const statusLabels = {
    PENDING: 'Chờ xử lý',
    active: 'Đang xử lý',
    shortlisted: 'Shortlist',
    rejected: 'Từ chối',
    hired: 'Đã tuyển',
  };

  const statusColors = {
    PENDING: '#f59e0b',
    active: '#3b82f6',
    shortlisted: '#8b5cf6',
    rejected: '#ef4444',
    hired: '#10b981',
  };

  const jobStatusLabels = {
    DRAFT: 'Nháp',
    OPEN: 'Đang mở',
    CLOSED: 'Đã đóng',
    ARCHIVED: 'Lưu trữ',
  };

  const jobStatusColors = {
    DRAFT: '#6b7280',
    OPEN: '#10b981',
    CLOSED: '#ef4444',
    ARCHIVED: '#9ca3af',
  };

  // Process status distribution for chart
  const pieStatusData = statusDistribution.map((s) => ({
    name: statusLabels[s.status] || s.status,
    value: s.count,
    color: statusColors[s.status] || '#6b7280',
    percentage: s.percentage,
  }));

  const pieJobStatusData = jobStatusDistribution.map((s) => ({
    name: jobStatusLabels[s.status] || s.status,
    value: s.count,
    color: jobStatusColors[s.status] || '#6b7280',
  }));

  // Format application trend data
  const trendData = applicationTrend.slice(-14).map((t) => ({
    date: new Date(t.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
    count: t.count,
  }));

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <div className="flex gap-3">
            <button
              onClick={fetchDashboard}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Làm mới
            </button>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7days">7 ngày qua</option>
              <option value="30days">30 ngày qua</option>
              <option value="90days">90 ngày qua</option>
              <option value="12months">12 tháng qua</option>
            </select>
          </div>
        </div>
        <p className="text-gray-600">Tổng quan hiệu suất tuyển dụng</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
        <StatCard icon={Briefcase} title="Tổng số vị trí" value={stats.totalJobs} />
        <StatCard icon={TrendingUp} title="Đơn đang xử lý" value={stats.activeApplications} />
        <StatCard icon={Users} title="Tổng ứng viên" value={stats.totalApplications} />
        <StatCard icon={Award} title="Shortlisted" value={stats.shortlistedApplications} />
        <StatCard icon={Calendar} title="Đã tuyển" value={stats.hiredApplications} />
        <StatCard icon={Clock} title="Tỷ lệ chuyển đổi" value={`${conversionRate}%`} />
      </div>

      {/* Application Trend */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Xu hướng ứng tuyển (14 ngày gần nhất)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Số đơn ứng tuyển"
              dot={{ fill: '#3b82f6', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Status Distribution & Job Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Trạng thái đơn ứng tuyển</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name} ${percentage}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Trạng thái công việc</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieJobStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieJobStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Status Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Chi tiết trạng thái</h2>
          <div className="space-y-4">
            {statusDistribution.map((status, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{statusLabels[status.status] || status.status}</span>
                  <span className="text-sm text-gray-600">
                    {status.count} ({status.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-3 rounded-full transition-all duration-500"
                    style={{
                      width: `${status.percentage}%`,
                      backgroundColor: statusColors[status.status] || '#6b7280',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Jobs */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Top công việc</h2>
          <div className="space-y-4">
            {topJobs.map((job, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{job.title}</p>
                    <p className="text-sm text-gray-600">{job.applications} ứng viên</p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    job.status === 'OPEN' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {jobStatusLabels[job.status] || job.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Hoạt động gần đây</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Ứng viên</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Công việc</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Trạng thái</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {recentActivity.map((activity, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-900">{activity.candidate_name}</td>
                  <td className="py-3 px-4 text-gray-700">{activity.job_title}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        activity.status === 'hired'
                          ? 'bg-green-100 text-green-800'
                          : activity.status === 'shortlisted'
                          ? 'bg-purple-100 text-purple-800'
                          : activity.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : activity.status === 'active'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {statusLabels[activity.status] || activity.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600 text-sm">
                    {new Date(activity.applied_at).toLocaleDateString('vi-VN', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ATSAnalyticsDashboard;
