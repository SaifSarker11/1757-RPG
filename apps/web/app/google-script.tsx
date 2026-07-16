import { useEffect } from 'react';

export default function GoogleScript() {
  useEffect(() => {
    const existing = document.getElementById('google-identity');
    if (existing) return;
    const script = document.createElement('script');
    script.id = 'google-identity';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }, []);
  return null;
}
