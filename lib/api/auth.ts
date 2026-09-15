const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const fetchApi = async (endpoint: string, data: Record<string, unknown>) => {
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    // next.js/browser fetch equivalent of withCredentials
    credentials: 'omit' // For Giai đoạn 1 login API. (Change to 'include' later if refresh token cookies are used)
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    // Tạo cấu trúc lỗi giống axios để không phải sửa UI
    throw { response: { data: errorData } }; 
  }
  return res.json();
};

export const authApi = {
  login: async (data: Record<string, unknown>) => {
    return fetchApi('/api/v1/auth/login', data);
  },
  register: async (data: Record<string, unknown>) => {
    return fetchApi('/api/v1/auth/register', data);
  },
  verifyOtp: async (data: Record<string, unknown>) => {
    return fetchApi('/api/v1/auth/register/verify', data);
  },
  /**
   * (14/09/2026) — BE có sẵn từ đầu để thu hồi refresh token (BR-AUTH-04) nhưng FE trước đây
   * đăng xuất thuần bằng cách xoá localStorage, không hề gọi endpoint này — refresh token cũ
   * vẫn còn hiệu lực phía server sau khi "đăng xuất". Best-effort: lỗi (mất mạng, token đã
   * hết hạn) không nên chặn việc đăng xuất phía client.
   */
  logout: async (refreshToken: string) => {
    try {
      await fetchApi('/api/v1/auth/logout', { refreshToken });
    } catch {
      // best-effort — xem docblock
    }
  },
  /**
   * (15/09/2026) — `JwtTokenProvider` nhồi `roles` vào access token NGAY LÚC KÝ, không đọc lại
   * DB mỗi request; chỉ `refresh` mới đọc `Role` mới nhất từ DB. Nên sau khi
   * `instructorApi.become()` nâng role STUDENT → INSTRUCTOR ở DB, access token cũ trên máy
   * học viên VẪN mang role STUDENT cho tới khi chủ động gọi hàm này — bắt buộc gọi ngay sau
   * `become()` thành công (xem `app/(public)/profile/page.tsx`), không đợi request nào đó
   * tình cờ nhận 401 mới refresh.
   */
  refresh: async (): Promise<{ accessToken: string; refreshToken: string }> => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) throw new Error('Không có refresh token');
    const data = await fetchApi('/api/v1/auth/refresh', { refreshToken });
    localStorage.setItem('accessToken', data.accessToken as string);
    localStorage.setItem('refreshToken', data.refreshToken as string);
    return data as { accessToken: string; refreshToken: string };
  },
};
