import { VoiceMappingManager } from '@/components/admin/VoiceMappingManager';

export default function AdminVoiceMappingsPage() {
  return (
    <>
      <h1 className="m-0 font-display text-[22px] font-bold text-gray-900">Giọng đọc lồng tiếng</h1>
      <VoiceMappingManager />
    </>
  );
}
