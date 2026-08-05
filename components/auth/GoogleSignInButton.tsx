'use client';
import { useEffect } from 'react';
import { handleGoogleSuccess } from '@/lib/google-auth';

declare global {
  interface Window {
    google: any;
  }
}

export function GoogleSignInButton() {
  useEffect(() => {
    // Initialize Google Sign-In button
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        callback: handleGoogleSuccess,
      });
      window.google.accounts.id.renderButton(
        document.getElementById('google-signin-button'),
        {
          theme: 'outline',
          size: 'large',
          width: '100%',
          text: 'signin_with'
        }
      );
    }
  }, []);

  return <div id="google-signin-button" className="flex justify-center"></div>;
}
