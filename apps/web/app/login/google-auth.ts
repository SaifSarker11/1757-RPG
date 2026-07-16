// apps/web/app/login/google-auth.ts
'use client';
import { useEffect } from 'react';

/** Load Google Identity Services script once */
export function useGoogleAuth() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (document.getElementById('google-identity')) return;
    const script = document.createElement('script');
    script.id = 'google-identity';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }, []);
}

/** Trigger Google Sign‑In flow */
export async function signIn() {
  // Ensure the Google script is loaded
  if (!window.google?.accounts?.id) {
    throw new Error('Google Identity script not loaded');
  }
  return new Promise<void>((resolve, reject) => {
    window.google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID as string,
      callback: async (response: any) => {
        try {
          const res = await fetch('/api/auth/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ credential: response.credential }),
          });
          const data = await res.json();
          localStorage.setItem('authToken', data.token);
          resolve();
        } catch (e) {
          reject(e);
        }
      },
    });
    window.google.accounts.id.prompt();
  });
}

/** Generate a guest token and store it */
export async function createGuest() {
  const res = await fetch('/api/auth/guest', { method: 'POST' });
  if (!res.ok) throw new Error('Guest generation failed');
  const data = await res.json();
  localStorage.setItem('authToken', data.token);
}
