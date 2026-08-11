import { AiJobQueueManager } from '@/components/admin/AiJobQueueManager';

export default function AdminAiQueuePage() {
  return (
    <>
      <h1 className="m-0 font-display text-[22px] font-bold text-gray-900">Giám sát AI Queue</h1>
      <AiJobQueueManager />
    </>
  );
}
