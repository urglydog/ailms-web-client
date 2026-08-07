'use client';
import { useEffect } from 'react';
import { handleGoogleSuccess } from '@/lib/google-auth';

interface GoogleCredentialResponse {
  credential?: string;
}

interface GoogleAccountsId {
  initialize(config: {
    client_id?: string;
    callback: (response: GoogleCredentialResponse) => void;
  }): void;
  renderButton(
    element: HTMLElement | null,
    options: { theme: string; size: string; width: string; text: string }
  ): void;
}

interface GoogleGlobal {
  accounts: {
    id: GoogleAccountsId;
  };
}

declare global {
  interface Window {
    google?: GoogleGlobal;
  }
}

export function GoogleSignInButton() {
  useEffect(() => {
    // Initialize Google Sign-In button
    if (window.google?.accounts?.id) {
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
