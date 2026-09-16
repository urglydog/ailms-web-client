import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { courseResourcesApi } from '@/lib/api/courseResourcesApi';
import { toast } from 'sonner';

interface Props {
  courseId: number;
  onClose: () => void;
}

export function UploadStaticMaterialModal({ courseId, onClose }: Props) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  
  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('Vui lòng chọn file');
      if (!title.trim()) throw new Error('Vui lòng nhập tiêu đề');
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      
      return courseResourcesApi.uploadResource(courseId, formData);
    },
    onSuccess: () => {
      toast.success('Đã tải lên học liệu tĩnh thành công');
      queryClient.invalidateQueries({ queryKey: ['course-resources', courseId] });
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Lỗi khi tải lên file');
    }
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
          ✕
        </button>
        
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
            📁
          </div>
          <h2 className="text-xl font-bold text-gray-900">Tải Lên Học Liệu Tĩnh</h2>
          <p className="text-sm text-gray-500 mt-1">Hỗ trợ file PDF, Word, PowerPoint, ZIP.</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Tiêu đề học liệu</label>
            <input 
              type="text" 
              value={title} 
              onChange={e => setTitle(e.target.value)}
              placeholder="VD: Slide Bài giảng Chương 1" 
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">File đính kèm</label>
            <input 
              type="file" 
              onChange={e => setFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-gray-300 rounded-lg p-1.5"
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50"
          >
            Hủy
          </button>
          <button 
            onClick={() => uploadMutation.mutate()}
            disabled={uploadMutation.isPending || !file || !title.trim()}
            className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {uploadMutation.isPending ? 'Đang tải lên...' : 'Tải Lên Ngay'}
          </button>
        </div>
      </div>
    </div>
  );
}
