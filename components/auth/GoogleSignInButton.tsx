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
    options: { theme: string; size: string; width?: string; text: string }
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
    let attempts = 0;
    const checkGoogle = setInterval(() => {
      attempts++;
      if (window.google?.accounts?.id) {
        clearInterval(checkGoogle);
        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          callback: handleGoogleSuccess,
        });
        window.google.accounts.id.renderButton(
          document.getElementById('google-signin-button'),
          {
            theme: 'outline',
            size: 'large',
            text: 'signin_with'
          }
        );
      } else if (attempts > 50) {
        // Stop checking after 5 seconds
        clearInterval(checkGoogle);
      }
    }, 100);

    return () => clearInterval(checkGoogle);
  }, []);

  return (
    <div className="flex justify-center w-full">
      <div id="google-signin-button" className="w-full flex justify-center"></div>
    </div>
  );
}
