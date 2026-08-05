export async function handleGoogleSuccess(credentialResponse: any) {
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
      throw new Error(err.message || 'Đăng nhập Google thất bại');
    }

    const data = await res.json();
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);

    // Determine redirect URL based on role in token
    let targetUrl = '/';
    try {
      const payload = data.accessToken.split('.')[1];
      if (payload) {
        const decoded = JSON.parse(atob(payload));
        let roleStr = '';
        if (typeof decoded.role === 'string') roleStr = decoded.role;
        else if (Array.isArray(decoded.roles)) roleStr = decoded.roles[0] || '';
        else if (typeof decoded.roles === 'string') roleStr = decoded.roles;
        else if (Array.isArray(decoded.authorities)) roleStr = decoded.authorities.map((a: Record<string, unknown> | string) => (typeof a === 'string' ? a : (a as {authority?: string}).authority || '')).join(',');
        else if (typeof decoded.authorities === 'string') roleStr = decoded.authorities;

        if (roleStr.includes('ADMIN')) {
          targetUrl = '/admin';
        } else if (roleStr.includes('INSTRUCTOR')) {
          targetUrl = '/instructor';
        }
      }
    } catch (e) {
      console.error('Lỗi giải mã token lúc đăng nhập Google:', e);
    }

    window.location.href = targetUrl;
  } catch (error: any) {
    alert('Lỗi đăng nhập: ' + error.message);
  }
}
