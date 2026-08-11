'use client';

import { useState, type FormEvent } from 'react';
import {
  useCreateVoiceMapping,
  useDeleteVoiceMapping,
  useUpdateVoiceMapping,
  useVoiceMappings,
} from '@/hooks/useVoiceMappings';
import { ApiError } from '@/lib/api/client';
import type { VoiceMapping } from '@/types/domain';

/**
 * UC47 — Admin cấu hình giọng đọc theo ngôn ngữ.
 *
 * BR-DUB-07: đây là nguồn DUY NHẤT quyết định ngôn ngữ lồng tiếng khả dụng cho học viên
 * (UC18) — tắt `isActive` là ẩn luôn ngôn ngữ đó khỏi bộ chọn ở trang học.
 */
export function VoiceMappingManager() {
  const { data: voices, isLoading } = useVoiceMappings();
  const createVoice = useCreateVoiceMapping();
  const updateVoice = useUpdateVoiceMapping();
  const deleteVoice = useDeleteVoiceMapping();

  const [language, setLanguage] = useState('');
  const [voiceName, setVoiceName] = useState('');
  const [gender, setGender] = useState('FEMALE');
  const [isDefault, setIsDefault] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    if (!language.trim() || !voiceName.trim()) return;
    setErrorMessage(null);
    createVoice.mutate(
      { language: language.trim(), voiceName: voiceName.trim(), gender, isDefault },
      {
        onSuccess: () => {
          setLanguage('');
          setVoiceName('');
          setIsDefault(false);
        },
        onError: (err) => setErrorMessage(err instanceof ApiError ? err.message : 'Có lỗi xảy ra'),
      },
    );
  };

  const handleDelete = (voice: VoiceMapping) => {
    if (!window.confirm(`Xóa giọng đọc "${voice.voiceName}" (${voice.language})?`)) return;
    setErrorMessage(null);
    deleteVoice.mutate(voice.id, {
      onError: (err) =>
        setErrorMessage(err instanceof ApiError ? err.message : 'Không xóa được giọng đọc này.'),
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleCreate} className="flex flex-wrap items-center gap-2.5">
        <input
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          placeholder="Mã ngôn ngữ (vd: en-US)"
          className="w-40 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-cyan-400 focus:outline-none"
        />
        <input
          value={voiceName}
          onChange={(e) => setVoiceName(e.target.value)}
          placeholder="Tên giọng Edge-TTS (vd: en-US-JennyNeural)"
          className="w-64 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-cyan-400 focus:outline-none"
        />
        <select
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-cyan-400 focus:outline-none"
        >
          <option value="FEMALE">Nữ</option>
          <option value="MALE">Nam</option>
        </select>
        <label className="flex items-center gap-1.5 text-sm text-gray-600">
          <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
          Mặc định
        </label>
        <button
          type="submit"
          disabled={createVoice.isPending}
          className="rounded-full bg-cyan-600 px-5 py-2 text-[13px] font-bold text-white hover:bg-cyan-700 disabled:opacity-50"
        >
          + Thêm giọng đọc
        </button>
      </form>

      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-[13px] text-red-700">{errorMessage}</div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
            <tr>
              <th className="px-6 py-4">Ngôn ngữ</th>
              <th className="px-6 py-4">Giọng đọc</th>
              <th className="px-6 py-4">Giới tính</th>
              <th className="px-6 py-4 text-center">Mặc định</th>
              <th className="px-6 py-4 text-center">Kích hoạt</th>
              <th className="px-6 py-4 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-6 py-6 text-center text-gray-500">
                  Đang tải...
                </td>
              </tr>
            )}
            {!isLoading && voices?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-6 text-center text-gray-500">
                  Chưa có giọng đọc nào — học viên sẽ không thấy ngôn ngữ nào để lồng tiếng (BR-DUB-07).
                </td>
              </tr>
            )}
            {voices?.map((voice) => (
              <tr key={voice.id} className="hover:bg-gray-50">
                <td className="px-6 py-3 font-semibold text-gray-900">{voice.language}</td>
                <td className="px-6 py-3 text-gray-600">{voice.voiceName}</td>
                <td className="px-6 py-3 text-gray-600">
                  <select
                    value={voice.gender}
                    onChange={(e) =>
                      updateVoice.mutate({
                        id: voice.id,
                        input: { gender: e.target.value, isDefault: voice.isDefault, isActive: voice.isActive },
                      })
                    }
                    className="rounded-md border border-transparent bg-transparent px-2 py-1 focus:border-cyan-300 focus:bg-white focus:outline-none"
                  >
                    <option value="FEMALE">Nữ</option>
                    <option value="MALE">Nam</option>
                  </select>
                </td>
                <td className="px-6 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={voice.isDefault}
                    onChange={(e) =>
                      updateVoice.mutate({
                        id: voice.id,
                        input: { gender: voice.gender, isDefault: e.target.checked, isActive: voice.isActive },
                      })
                    }
                  />
                </td>
                <td className="px-6 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={voice.isActive}
                    onChange={(e) =>
                      updateVoice.mutate({
                        id: voice.id,
                        input: { gender: voice.gender, isDefault: voice.isDefault, isActive: e.target.checked },
                      })
                    }
                  />
                </td>
                <td className="px-6 py-3 text-right">
                  <button onClick={() => handleDelete(voice)} className="text-xs font-bold text-red-500 hover:text-red-700">
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
