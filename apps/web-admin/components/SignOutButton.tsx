'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function SignOutButton() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function signOut() {
    setIsSigningOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.replace('/login');
      router.refresh();
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <button className="sidebar-link-button" type="button" disabled={isSigningOut} onClick={signOut}>
      {isSigningOut ? 'Signing out...' : 'Sign out'}
    </button>
  );
}
