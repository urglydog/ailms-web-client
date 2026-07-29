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
  }
};
