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
import { TrendingUp, Users, Briefcase, CheckCircle, XCircle, Clock, Award } from 'lucide-react';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/admin/dashboard', {
        credentials: 'include',
      });
      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-medium">Không thể tải dữ liệu dashboard</p>
        </div>
      </div>
    );
  }

  const {
    stats,
    recentActivity,
    topJobs,
    applicationTrend,
    statusDistribution,
    jobStatusDistribution,
    conversionRate,
  } = dashboardData;

  // Colors for charts
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  const STATUS_COLORS = {
    PENDING: '#94a3b8',
    active: '#3b82f6',
    shortlisted: '#10b981',
    rejected: '#ef4444',
    hired: '#8b5cf6',
  };

  const statCards = [
    {
      title: 'Tổng công việc',
      value: stats.totalJobs,
      icon: Briefcase,
      color: 'bg-blue-500',
      gradient: 'from-blue-400 to-blue-600',
    },
    {
      title: 'Ứng viên',
      value: stats.totalCandidates,
      icon: Users,
      color: 'bg-green-500',
      gradient: 'from-green-400 to-green-600',
    },
    {
      title: 'Đơn ứng tuyển',
      value: stats.totalApplications,
      icon: TrendingUp,
      color: 'bg-purple-500',
      gradient: 'from-purple-400 to-purple-600',
    },
    {
      title: 'Tỷ lệ chuyển đổi',
      value: `${conversionRate}%`,
      icon: Award,
      color: 'bg-amber-500',
      gradient: 'from-amber-400 to-amber-600',
    },
  ];

  const miniStats = [
    { label: 'Đang xử lý', value: stats.activeApplications, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Shortlisted', value: stats.shortlistedApplications, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Rejected', value: stats.rejectedApplications, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Hired', value: stats.hiredApplications, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Dashboard Tuyển dụng</h1>
          <p className="text-slate-600">Tổng quan hệ thống quản lý ứng viên</p>
        </div>

        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-shadow duration-300"
              >
                <div className={`bg-gradient-to-br ${stat.gradient} p-6`}>
                  <div className="flex items-center justify-between">
                    <div className="text-white">
                      <p className="text-sm font-medium opacity-90 mb-1">{stat.title}</p>
                      <p className="text-3xl font-bold">{stat.value}</p>
                    </div>
                    <div className="bg-white/20 p-3 rounded-xl">
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mini Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {miniStats.map((stat, index) => (
            <div key={index} className={`${stat.bg} rounded-xl p-4 border border-slate-200`}>
              <p className="text-sm text-slate-600 mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Application Trend */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Xu hướng ứng tuyển (30 ngày)
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={applicationTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).getDate().toString()}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Status Distribution */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Phân bố trạng thái đơn
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, percentage }) => `${status}: ${percentage}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Jobs and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Jobs */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-purple-600" />
              Top 5 công việc
            </h2>
            <div className="space-y-3">
              {topJobs.map((job, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800 truncate">{job.title}</p>
                    <p className="text-sm text-slate-500">ID: {job.job_id.slice(0, 8)}...</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        job.status === 'OPEN' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {job.status}
                    </span>
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">
                      {job.applications}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              Hoạt động gần đây
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div
                    className={`p-2 rounded-lg ${
                      activity.status === 'shortlisted'
                        ? 'bg-green-100'
                        : activity.status === 'rejected'
                        ? 'bg-red-100'
                        : activity.status === 'hired'
                        ? 'bg-purple-100'
                        : 'bg-blue-100'
                    }`}
                  >
                    {activity.status === 'shortlisted' ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : activity.status === 'rejected' ? (
                      <XCircle className="w-4 h-4 text-red-600" />
                    ) : activity.status === 'hired' ? (
                      <Award className="w-4 h-4 text-purple-600" />
                    ) : (
                      <Clock className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 truncate">{activity.candidate_name}</p>
                    <p className="text-sm text-slate-600 truncate">{activity.job_title}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(activity.applied_at).toLocaleString('vi-VN')}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      activity.status === 'shortlisted'
                        ? 'bg-green-100 text-green-700'
                        : activity.status === 'rejected'
                        ? 'bg-red-100 text-red-700'
                        : activity.status === 'hired'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {activity.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Job Status Distribution */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Phân bố trạng thái công việc</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={jobStatusDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="status" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
              />
              <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
