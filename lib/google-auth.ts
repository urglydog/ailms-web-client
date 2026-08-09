import { toast } from 'sonner';

interface GoogleCredentialResponse {
  credential?: string;
}

export async function handleGoogleSuccess(credentialResponse: GoogleCredentialResponse) {
  const idToken = credentialResponse.credential;

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    const res = await fetch(
      `${apiUrl}/api/v1/auth/oauth/google/callback`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      }
    );

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || err.detail || 'Đăng nhập Google thất bại');
    }

    const data = await res.json();
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);

    // Determine redirect URL based on role in token
    let targetUrl = '/';
    try {
      const payload = data.accessToken.split('.')[1];
      if (payload) {
        const decoded: unknown = JSON.parse(atob(payload));
        const decodedPayload =
          typeof decoded === 'object' && decoded !== null
            ? (decoded as Record<string, unknown>)
            : {};
        let roleStr = '';
        if (typeof decodedPayload.role === 'string') roleStr = decodedPayload.role;
        else if (Array.isArray(decodedPayload.roles)) roleStr = String(decodedPayload.roles[0] || '');
        else if (typeof decodedPayload.roles === 'string') roleStr = decodedPayload.roles;
        else if (Array.isArray(decodedPayload.authorities)) roleStr = decodedPayload.authorities.map((a: Record<string, unknown> | string) => (typeof a === 'string' ? a : (a as {authority?: string}).authority || '')).join(',');
        else if (typeof decodedPayload.authorities === 'string') roleStr = decodedPayload.authorities;

        if (roleStr.includes('ADMIN')) {
          targetUrl = '/admin';
        } else if (roleStr.includes('INSTRUCTOR')) {
          targetUrl = '/instructor';
        }
      }
    } catch (e) {
      console.error('Lỗi giải mã token lúc đăng nhập Google:', e);
    }

    toast.success('Đăng nhập thành công!');
    setTimeout(() => {
      window.location.href = targetUrl;
    }, 1000);
  } catch (error: unknown) {
    toast.error('Lỗi đăng nhập: ' + (error instanceof Error ? error.message : 'Có lỗi xảy ra'));
  }
}
