import { TutorSecurityFlagsManager } from '@/components/admin/TutorSecurityFlagsManager';

export default function AdminTutorSecurityPage() {
  return (
    <>
      <h1 className="m-0 font-display text-[22px] font-bold text-gray-900">Bảo mật AI Tutor</h1>
      <p className="mb-5 mt-1 text-sm text-gray-500">
        Tin nhắn học viên gửi vào Gia sư AI (Socratic Tutor) bị lớp pre-check heuristic phát hiện
        pattern nghi vấn (yêu cầu bỏ qua quy tắc, giả danh admin, jailbreak...) — chỉ để theo dõi,
        KHÔNG có hành động khóa/chặn tài khoản nào tự động ở đây.
      </p>
      <TutorSecurityFlagsManager />
    </>
  );
}
