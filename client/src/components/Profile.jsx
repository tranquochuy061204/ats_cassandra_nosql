import { useState } from 'react';
import { api } from '../utils/api.jsx';
import { useAuth } from '../store/useAuth.jsx';
import toast from 'react-hot-toast';
import { Upload, FileText, CheckCircle2, Loader2, ExternalLink, AlertCircle, File } from 'lucide-react';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  if (!user) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-600">Chưa đăng nhập</p>
      </div>
    );
  }

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
      setFile(null);

      console.log('✅ CV uploaded successfully:', data);

      toast.success('Cập nhật CV thành công!');
    } catch (err) {
      console.error('❌ Upload CV error:', err);
      toast.error('Upload thất bại');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      const validTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];

      if (validTypes.includes(droppedFile.type)) {
        setFile(droppedFile);
      } else {
        toast.error('Chỉ chấp nhận file PDF, DOC, DOCX');
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="mt-8">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
          <FileText className="text-white" size={20} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-800">CV của tôi</h3>
          <p className="text-sm text-gray-500">Tải lên CV để hoàn thiện hồ sơ ứng tuyển</p>
        </div>
      </div>

      {/* Current CV Display */}
      {user.cv_url && (
        <div className="mb-6 p-5 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="text-white" size={24} />
              </div>
              <div>
                <p className="font-semibold text-gray-800">CV đã được tải lên</p>
                <p className="text-sm text-gray-600">Sẵn sàng để ứng tuyển</p>
              </div>
            </div>
            <a
              href={`http://localhost:3000${user.cv_url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-gray-50 text-green-600 rounded-xl font-semibold border-2 border-green-200 hover:border-green-300 transition-all hover:shadow-md"
            >
              <ExternalLink size={18} />
              Xem CV
            </a>
          </div>
        </div>
      )}

      {/* Upload Form */}
      <form onSubmit={handleUpload} className="space-y-4">
        {/* Drag & Drop Area */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl p-8 transition-all ${
            dragActive
              ? 'border-purple-500 bg-purple-50'
              : file
              ? 'border-green-300 bg-green-50'
              : 'border-gray-300 bg-gray-50 hover:border-purple-300 hover:bg-purple-50'
          }`}
        >
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={uploading}
          />

          <div className="text-center pointer-events-none">
            {file ? (
              <>
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center">
                  <File className="text-white" size={32} />
                </div>
                <p className="font-semibold text-gray-800 mb-1">{file.name}</p>
                <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                  <Upload className="text-white" size={32} />
                </div>
                <p className="font-semibold text-gray-800 mb-2">Kéo thả file CV vào đây hoặc nhấn để chọn</p>
                <p className="text-sm text-gray-500">Chấp nhận: PDF, DOC, DOCX (tối đa 10MB)</p>
              </>
            )}
          </div>
        </div>

        {/* File Info & Actions */}
        {file && (
          <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <FileText className="text-white" size={20} />
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">{file.name}</p>
                <p className="text-xs text-gray-600">{formatFileSize(file.size)}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFile(null)}
              className="text-red-600 hover:text-red-700 font-medium text-sm"
              disabled={uploading}
            >
              Xóa
            </button>
          </div>
        )}

        {/* Upload Button */}
        <button
          type="submit"
          disabled={uploading || !file}
          className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-white transition-all ${
            uploading || !file
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-xl hover:scale-[1.02]'
          }`}
        >
          {uploading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Đang tải lên...
            </>
          ) : (
            <>
              <Upload size={20} />
              {user.cv_url ? 'Cập nhật CV mới' : 'Tải lên CV'}
            </>
          )}
        </button>
      </form>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <div className="flex gap-3">
          <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="text-sm font-semibold text-blue-800 mb-1">Lưu ý khi tải CV</p>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• CV nên có định dạng PDF để đảm bảo hiển thị tốt nhất</li>
              <li>• Đảm bảo thông tin cá nhân và kinh nghiệm được cập nhật đầy đủ</li>
              <li>• Kích thước file không quá 10MB</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
