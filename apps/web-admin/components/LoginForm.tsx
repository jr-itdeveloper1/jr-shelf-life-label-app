'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

type Portal = 'company' | 'site';

const portalCopy = {
  company: {
    title: 'Company user sign in',
    email: 'grace@jrfoods.example',
    redirectTo: '/company-admin/dashboard',
    submit: 'Login',
  },
  site: {
    title: 'Site Admin sign in',
    email: 'site.admin@jrlabels.example',
    redirectTo: '/site-admin/dashboard',
    submit: 'Login',
  },
} satisfies Record<Portal, { title: string; email: string; redirectTo: string; submit: string }>;

export function LoginForm({ portal }: { portal: Portal }) {
  const router = useRouter();
  const copy = portalCopy[portal];
  const [email, setEmail] = useState(copy.email);
  const [password, setPassword] = useState('ChangeMe123!');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, portal }),
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.message ?? body.error ?? 'Unable to sign in.');
      }
      router.push(copy.redirectTo);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="login-form" onSubmit={submit}>
      <h2>{copy.title}</h2>
      <label>
        <span>Email</span>
        <input value={email} type="email" autoComplete="email" maxLength={160} required onChange={(event) => setEmail(event.target.value)} />
      </label>
      <label>
        <span>Password</span>
        <input value={password} type="password" autoComplete="current-password" minLength={8} maxLength={128} required onChange={(event) => setPassword(event.target.value)} />
      </label>
      {error ? <div className="form-message error">{error}</div> : null}
      <button className="button primary" disabled={isSubmitting || !email || !password}>
        {isSubmitting ? 'Signing in...' : copy.submit}
      </button>
    </form>
  );
}
