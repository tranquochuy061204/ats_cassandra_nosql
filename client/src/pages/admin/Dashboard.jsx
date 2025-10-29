import { useQuery } from '@tanstack/react-query';
import { api } from '../../utils/api.jsx';
import { Card, CardContent } from '../../components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Loader2 } from 'lucide-react';

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['adminDashboard'],
    queryFn: async () => {
      const res = await api.get('/api/admin/dashboard');
      return res.data;
    },
  });

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin w-8 h-8 text-gray-600" />
      </div>
    );

  const { stats, statusCount, dailyCount, jobRanking } = data;
  const COLORS = ['#22c55e', '#eab308', '#ef4444', '#3b82f6'];

  const statusData = Object.entries(statusCount).map(([status, count]) => ({
    name: status,
    value: count,
  }));

  const timelineData = Object.entries(dailyCount).map(([date, count]) => ({
    date,
    count,
  }));

  return (
    <div className="p-6 space-y-8">
      {/* Tổng quan */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-gray-500 text-sm">Công việc đang đăng</p>
            <p className="text-2xl font-bold text-blue-600">{stats.totalJobs}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-gray-500 text-sm">Ứng viên</p>
            <p className="text-2xl font-bold text-green-600">{stats.totalCandidates}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-gray-500 text-sm">Nhà tuyển dụng</p>
            <p className="text-2xl font-bold text-orange-600">{stats.totalRecruiters}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-gray-500 text-sm">Đơn ứng tuyển</p>
            <p className="text-2xl font-bold text-purple-600">{stats.totalApplications}</p>
          </CardContent>
        </Card>
      </div>

      {/* Biểu đồ */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Pie - status */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-800 mb-4">Tình trạng đơn ứng tuyển</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={80} label>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bar - timeline */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-800 mb-4">Số lượng ứng tuyển theo ngày</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={timelineData}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bảng Top Job */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-gray-800 mb-4">Top công việc có nhiều ứng tuyển nhất</h3>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                <th className="px-4 py-2 text-left">Job ID</th>
                <th className="px-4 py-2 text-right">Số lượng ứng tuyển</th>
              </tr>
            </thead>
            <tbody>
              {jobRanking.map((j) => (
                <tr key={j.job_id} className="border-b">
                  <td className="px-4 py-2">{j.job_id}</td>
                  <td className="px-4 py-2 text-right font-semibold">{j.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
