/**
 * Đọc JWT access token đã lưu ở Giai đoạn 1 (`localStorage['accessToken']`).
 *
 * Không có store xác thực tập trung trong dự án — module này chỉ là một shim đọc
 * đúng key mà `authApi.login` (lib/api/auth.ts) đã dùng, để các API call mới của
 * F2.1 có thể đính kèm Bearer token mà không phải refactor luồng đăng nhập cũ.
 */

import type { Role } from '@/types/domain';

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

interface DecodedAccessToken {
  sub: string;
  id: number;
  /** Backend nhồi chuỗi "ROLE_ADMIN" (JwtTokenProvider.generateToken). */
  roles: string;
  exp: number;
}

export function decodeAccessToken(): DecodedAccessToken | null {
  const token = getAccessToken();
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decodeURIComponent(escape(json))) as DecodedAccessToken;
  } catch {
    return null;
  }
}

/** Trả về vai trò hiện tại đọc từ JWT, hoặc null nếu chưa đăng nhập/token hỏng. */
export function getCurrentRole(): Role | null {
  const decoded = decodeAccessToken();
  if (!decoded?.roles) return null;
  const role = decoded.roles.split(',')[0]?.replace('ROLE_', '');
  return (role as Role) || null;
}
