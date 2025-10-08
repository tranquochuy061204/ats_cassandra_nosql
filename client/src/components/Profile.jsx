import { useState } from 'react';
import { api } from '../utils/api.jsx';
import { useAuth } from '../store/useAuth.jsx';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  if (!user) return <div>Chưa đăng nhập</div>;

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Chọn file CV trước khi tải lên');
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('cv', file);
      formData.append('user_id', user.user_id);

      const { data } = await api.post('/api/upload/cv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setUser({ ...user, cv_url: data.cv_url });

      console.log('✅ CV uploaded successfully:', data);

      toast.success('Cập nhật CV thành công!');
    } catch (err) {
      console.error('❌ Upload CV error:', err);
      toast.error('Upload thất bại');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded shadow mt-10">
      <h2 className="text-xl font-semibold mb-4">Hồ sơ cá nhân</h2>

      {user.cv_url ? (
        <p className="mb-3">
          📄 CV hiện tại:{' '}
          <a
            href={`http://localhost:3000${user.cv_url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            Xem CV
          </a>
        </p>
      ) : (
        <p className="text-gray-500 mb-3">Chưa có CV</p>
      )}

      <form onSubmit={handleUpload} className="flex flex-col gap-3">
        <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setFile(e.target.files[0])} />
        <button
          type="submit"
          disabled={uploading}
          className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
        >
          {uploading ? 'Đang tải lên...' : 'Cập nhật CV'}
        </button>
      </form>
    </div>
  );
}
