import { Search, MapPin, Briefcase, TrendingUp, Users, Zap, ChevronRight, Star, Award, Heart } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Home() {
  const [scrollY, setScrollY] = useState(0);
  const [hoveredCard, setHoveredCard] = useState(null);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const jobs = [
    {
      title: 'Nhân viên kinh doanh (Sales)',
      location: 'Hồ Chí Minh',
      salary: '8 - 15 triệu / tháng',
      type: 'Full-time',
    },
    { title: 'Chuyên viên Marketing', location: 'Hà Nội', salary: '10 - 18 triệu / tháng', type: 'Full-time' },
    { title: 'Lập trình viên Frontend', location: 'Hồ Chí Minh', salary: '15 - 25 triệu / tháng', type: 'Full-time' },
    { title: 'Designer UI/UX', location: 'Remote', salary: '12 - 20 triệu / tháng', type: 'Remote' },
    { title: 'Nhân viên Chăm sóc KH', location: 'Đà Nẵng', salary: '7 - 12 triệu / tháng', type: 'Full-time' },
    { title: 'Trưởng phòng Kinh doanh', location: 'Hồ Chí Minh', salary: '20 - 35 triệu / tháng', type: 'Full-time' },
  ];

  return (
    <div className="w-full overflow-hidden">
      {/* HERO SECTION */}
      <section
        className="relative h-screen flex flex-col justify-center items-center text-center text-white overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        }}
      >
        {/* Animated background circles */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute w-96 h-96 bg-white/10 rounded-full blur-3xl -top-48 -left-48 animate-pulse"
            style={{ animationDuration: '4s' }}
          ></div>
          <div
            className="absolute w-96 h-96 bg-white/10 rounded-full blur-3xl -bottom-48 -right-48 animate-pulse"
            style={{ animationDuration: '6s', animationDelay: '1s' }}
          ></div>
        </div>

        <div
          className="relative z-10 max-w-4xl px-4 transform transition-all duration-1000"
          style={{ transform: `translateY(${scrollY * 0.3}px)` }}
        >
          <div className="inline-block mb-6 px-6 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold animate-bounce">
            🚀 Đang tuyển dụng nhiều vị trí hấp dẫn
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
            Khai phóng sự nghiệp <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 to-pink-200">
              cùng chúng tôi
            </span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-white/90">
            Nơi tài năng gặp gỡ cơ hội, nơi đam mê được thăng hoa
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button className="group px-8 py-4 bg-white text-purple-600 rounded-full font-bold text-lg hover:scale-105 transform transition-all shadow-2xl hover:shadow-purple-500/50 flex items-center gap-2">
              Khám phá cơ hội
              <ChevronRight className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-full font-bold text-lg hover:bg-white hover:text-purple-600 transform transition-all">
              Tìm hiểu thêm
            </button>
          </div>
        </div>
      </section>

      {/* STATS SECTION */}
      <section className="py-16 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: Users, number: '500+', label: 'Nhân viên' },
              { icon: Award, number: '50+', label: 'Vị trí tuyển dụng' },
              { icon: Star, number: '4.8/5', label: 'Đánh giá nhân viên' },
              { icon: TrendingUp, number: '95%', label: 'Tỷ lệ hài lòng' },
            ].map((stat, i) => (
              <div key={i} className="text-center group cursor-pointer transform hover:scale-110 transition-all">
                <stat.icon className="w-12 h-12 mx-auto mb-4 text-purple-400 group-hover:text-pink-400 transition-colors" />
                <div className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                  {stat.number}
                </div>
                <div className="text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* JOB LIST SECTION */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
              Cơ hội nghề nghiệp
            </h2>
            <p className="text-gray-600 text-lg">Tìm công việc phù hợp với bạn</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {jobs.map((job, i) => (
              <div
                key={i}
                onMouseEnter={() => setHoveredCard(i)}
                onMouseLeave={() => setHoveredCard(null)}
                className="group bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2 border-2 border-transparent hover:border-purple-300 relative overflow-hidden"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 transition-opacity duration-300 ${
                    hoveredCard === i ? 'opacity-100' : 'opacity-0'
                  }`}
                ></div>

                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Briefcase className="text-white" size={24} />
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-xs font-semibold">
                      {job.type}
                    </span>
                  </div>

                  <h3 className="font-bold text-lg mb-3 text-gray-800 group-hover:text-purple-600 transition-colors">
                    {job.title}
                  </h3>

                  <div className="flex items-center text-gray-600 mb-3">
                    <MapPin size={16} className="mr-2 text-purple-500" />
                    <span className="text-sm">{job.location}</span>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                    <span className="text-sm text-blue-600 font-bold">{job.salary}</span>
                    <ChevronRight
                      className={`text-purple-500 transition-transform ${hoveredCard === i ? 'translate-x-1' : ''}`}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <button className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-semibold hover:shadow-xl transform hover:scale-105 transition-all">
              Xem tất cả vị trí
            </button>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE SECTION */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
            Lý do chọn chúng tôi
          </h2>
          <p className="text-gray-600 text-lg mb-12">Những giá trị cốt lõi tạo nên sự khác biệt</p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Heart,
                title: 'Quyền lợi vượt trội',
                gradient: 'from-blue-500 to-cyan-500',
                desc: 'Chính sách phúc lợi toàn diện, hỗ trợ nhân viên phát triển sự nghiệp và cuộc sống cá nhân.',
              },
              {
                icon: Zap,
                title: 'Công nghệ tiên phong',
                gradient: 'from-orange-500 to-red-500',
                desc: 'Làm việc trong môi trường sáng tạo, áp dụng các công nghệ hiện đại.',
              },
              {
                icon: Star,
                title: 'Làm hết sức, chơi hết mình',
                gradient: 'from-green-500 to-emerald-500',
                desc: 'Văn hoá trẻ trung, năng động, nơi bạn được là chính mình.',
              },
            ].map((item, i) => (
              <div
                key={i}
                className="group relative overflow-hidden rounded-3xl p-8 text-white transform hover:scale-105 transition-all duration-300 cursor-pointer shadow-xl hover:shadow-2xl"
                style={{
                  background: `linear-gradient(135deg, var(--tw-gradient-stops))`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `linear-gradient(135deg, ${
                    item.gradient.includes('blue')
                      ? '#3b82f6, #06b6d4'
                      : item.gradient.includes('orange')
                      ? '#f97316, #ef4444'
                      : '#10b981, #059669'
                  })`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = `linear-gradient(135deg, ${
                    item.gradient.includes('blue')
                      ? '#3b82f6, #06b6d4'
                      : item.gradient.includes('orange')
                      ? '#f97316, #ef4444'
                      : '#10b981, #059669'
                  })`;
                }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>

                <item.icon className="w-16 h-16 mb-6 mx-auto group-hover:rotate-12 transition-transform" />
                <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                <p className="text-white/90">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RECRUITMENT PROCESS */}
      <section className="py-20 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
            Quy trình tuyển dụng
          </h2>
          <p className="text-gray-600 text-lg mb-12">Đơn giản, nhanh chóng và minh bạch</p>

          <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative">
            {/* Connection line */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-purple-300 via-pink-300 to-purple-300 -z-10"></div>

            {[
              {
                step: 1,
                title: 'Sàng lọc hồ sơ',
                desc: 'Đội ngũ tuyển dụng sẽ xem xét hồ sơ của bạn.',
                icon: Search,
              },
              {
                step: 2,
                title: 'Phỏng vấn',
                desc: 'Ứng viên phù hợp được mời phỏng vấn trực tiếp hoặc online.',
                icon: Users,
              },
              {
                step: 3,
                title: 'Thông báo kết quả',
                desc: 'Nhận phản hồi kết quả qua email hoặc điện thoại.',
                icon: Award,
              },
            ].map((item, i) => (
              <div
                key={i}
                className="relative bg-white rounded-2xl shadow-xl p-8 w-full md:w-1/3 transform hover:scale-105 transition-all hover:shadow-2xl group"
              >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-125 transition-transform">
                  {item.step}
                </div>

                <item.icon className="w-12 h-12 mx-auto mt-8 mb-4 text-purple-500 group-hover:scale-110 transition-transform" />
                <h3 className="font-bold text-xl mb-3 text-gray-800">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TEAM SECTION */}
      <section className="py-20 bg-gradient-to-br from-gray-900 to-purple-900 text-white">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-white/80 text-lg mb-12">Gặp gỡ đội ngũ tuyệt vời của chúng tôi</p>

          <div className="grid md:grid-cols-4 gap-6">
            {['Marketing Lead', 'Senior Developer', 'Product Designer', 'HR Manager'].map((role, i) => (
              <div
                key={i}
                className="group bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/20 transition-all transform hover:-translate-y-2 cursor-pointer"
              >
                <div className="relative mb-4 overflow-hidden rounded-xl">
                  <div className="h-48 bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                    <Users className="w-20 h-20 text-white/50" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <h3 className="font-bold text-lg mb-1">Nhân viên {i + 1}</h3>
                <p className="text-white/70 text-sm">{role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Sẵn sàng bắt đầu hành trình mới?</h2>
          <p className="text-xl mb-8 text-white/90">
            Hãy để chúng tôi đồng hành cùng bạn trên con đường phát triển sự nghiệp
          </p>
          <button className="px-10 py-4 bg-white text-purple-600 rounded-full font-bold text-lg hover:scale-110 transform transition-all shadow-2xl hover:shadow-white/50">
            Ứng tuyển ngay
          </button>
        </div>
      </section>
    </div>
  );
}
