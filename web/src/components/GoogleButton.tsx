import { useEffect, useRef } from 'react';
import { loginWithGoogle } from '../api';

// O ID do app no Google vem do .env (VITE_GOOGLE_CLIENT_ID)
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as
  string | undefined;

// Só o pedaço da biblioteca do Google que a gente usa
type GoogleAccounts = {
  id: {
    initialize: (options: {
      client_id: string;
      callback: (response: { credential: string }) => void;
    }) => void;
    renderButton: (
      element: HTMLElement,
      options: Record<string, string | number>,
    ) => void;
  };
};

declare global {
  interface Window {
    google?: { accounts: GoogleAccounts };
  }
}

const SCRIPT_URL = 'https://accounts.google.com/gsi/client';

// Carrega o script do Google uma vez só
function loadGoogleScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.google?.accounts) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('could not load google'));
    document.head.appendChild(script);
  });
}

type GoogleButtonProps = {
  onLogin: (token: string) => void;
  onError: (message: string) => void;
};

function GoogleButton({ onLogin, onError }: GoogleButtonProps) {
  // Lugar na tela onde o Google desenha o botão
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      return;
    }

    loadGoogleScript()
      .then(() => {
        const google = window.google;

        if (!google || !buttonRef.current) {
          return;
        }

        // Quando a pessoa escolhe a conta, o Google chama esta função
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: ({ credential }) => {
            loginWithGoogle(credential)
              .then(({ token }) => onLogin(token))
              .catch(() => onError('Could not sign in with Google.'));
          },
        });

        google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          text: 'continue_with',
          locale: 'en',
          width: 312,
        });
      })
      .catch(() => onError('Could not load Google sign in.'));
  }, [onLogin, onError]);

  // Sem o ID configurado, o botão simplesmente não aparece
  if (!GOOGLE_CLIENT_ID) {
    return null;
  }

  return (
    <>
      <p className="auth-divider">or</p>
      <div className="google-button" ref={buttonRef} />
    </>
  );
}

export default GoogleButton;
