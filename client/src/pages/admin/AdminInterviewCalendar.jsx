import { useQuery } from '@tanstack/react-query';
import { api } from '../../utils/api.jsx';
import { Loader2, CalendarDays, Clock, Link2 } from 'lucide-react';
import { useMemo } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
dayjs.locale('vi');

function getShiftLabel(hour) {
  if (hour >= 7 && hour < 12) return 'Sáng';
  if (hour >= 13 && hour < 17) return 'Chiều';
  if (hour >= 18 && hour <= 21) return 'Tối';
  return null;
}

export default function AdminInterviewCalendar() {
  const { data, isLoading } = useQuery({
    queryKey: ['scheduledInterviews'],
    queryFn: async () => {
      const res = await api.get('/api/admin/interviews/scheduled');
      return res.data;
    },
  });

  const weekDays = useMemo(() => {
    const start = dayjs().startOf('week').add(1, 'day'); // Thứ 2
    return Array.from({ length: 7 }, (_, i) => start.add(i, 'day'));
  }, []);

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin w-6 h-6 text-indigo-600" />
      </div>
    );

  const interviewsByDay = {};
  data?.forEach((i) => {
    const d = dayjs(i.scheduled_at).format('YYYY-MM-DD');
    if (!interviewsByDay[d]) interviewsByDay[d] = [];
    interviewsByDay[d].push(i);
  });

  const shifts = ['Sáng', 'Chiều', 'Tối'];

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-[Josefin Sans]">
      <h2 className="text-2xl font-semibold mb-8 flex items-center gap-2 text-indigo-700">
        <CalendarDays className="w-6 h-6" />
        Lịch phỏng vấn trong tuần
      </h2>

      {/* Header */}
      <div className="grid grid-cols-8 border border-gray-300 rounded-t-lg text-center font-medium text-gray-700 bg-gray-100">
        <div className="py-3 border-r border-gray-300 bg-gray-200">Buổi</div>
        {weekDays.map((d) => (
          <div key={d} className="py-3 border-r border-gray-300">
            <div className="capitalize">{d.format('dddd')}</div>
            <div className="text-xs text-gray-500">{d.format('DD/MM')}</div>
          </div>
        ))}
      </div>

      {/* Body */}
      {shifts.map((shift, shiftIndex) => (
        <div
          key={shift}
          className={`grid grid-cols-8 border-x border-b border-gray-300 ${
            shiftIndex === shifts.length - 1 ? 'rounded-b-lg' : ''
          }`}
        >
          {/* Shift label */}
          <div className="bg-gray-100 border-r border-gray-300 flex items-center justify-center font-semibold text-gray-700 py-10">
            {shift}
          </div>

          {/* Day columns */}
          {weekDays.map((day) => {
            const dayStr = day.format('YYYY-MM-DD');
            const slot = interviewsByDay[dayStr]?.filter((i) => getShiftLabel(dayjs(i.scheduled_at).hour()) === shift);

            return (
              <div
                key={dayStr + shift}
                className="border-r border-gray-300 bg-white min-h-[130px] relative hover:bg-gray-50 transition-colors duration-200"
              >
                {slot && slot.length > 0 ? (
                  slot.map((i, idx) => (
                    <div
                      key={idx}
                      className="bg-emerald-50 border-l-4 border-emerald-500 rounded-md p-2 m-1 shadow-sm hover:shadow-md transition"
                    >
                      <p className="font-semibold text-gray-800 text-sm">{i.candidate_name}</p>
                      <p className="text-xs text-gray-600 italic">{i.job_title}</p>

                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <Clock size={12} className="text-emerald-600" />
                        {dayjs(i.scheduled_at).format('HH:mm')}
                      </div>

                      <div className="flex items-center gap-1 mt-1 text-xs text-blue-600 truncate">
                        <Link2 size={12} />
                        <a href={i.meet_link} target="_blank" rel="noreferrer" className="truncate hover:underline">
                          {i.meet_link}
                        </a>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="absolute inset-0 flex justify-center items-center text-gray-300 text-sm italic">
                    —
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
