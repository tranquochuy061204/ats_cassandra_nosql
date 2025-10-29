function StatusBadge({ status }) {
  const color =
    status === 'PENDING'
      ? 'bg-yellow-100 text-yellow-700'
      : status === 'REVIEWED'
      ? 'bg-blue-100 text-blue-700'
      : status === 'SHORTLISTED'
      ? 'bg-green-100 text-green-700'
      : status === 'REJECTED'
      ? 'bg-red-100 text-red-700'
      : 'bg-gray-100 text-gray-600';

  const label =
    {
      PENDING: 'Chờ duyệt',
      REVIEWED: 'Đã xem',
      SHORTLISTED: 'Vào vòng sau',
      REJECTED: 'Từ chối',
      HIRED: 'Đã tuyển',
    }[status] || status;

  return <span className={`px-2 py-1 text-xs font-medium rounded-full ${color}`}>{label}</span>;
}

export default StatusBadge;
