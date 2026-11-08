import { useState, type FormEvent } from 'react';
import { sb } from '../lib/supabase';
import { Logo } from './Logo';

export function Login() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!sb) return;
    setState('sending');
    setError('');
    const { error } = await sb.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: location.origin + location.pathname, shouldCreateUser: false },
    });
    if (error) {
      setState('idle');
      setError(/signups? not allowed|not found/i.test(error.message)
        ? 'Email ini belum terdaftar. Pakai email akun StudyO.'
        : `Gagal mengirim: ${error.message}`);
    } else setState('sent');
  }

  return (
    <main className="login">
      <div className="login-card">
        <Logo size={56} />
        <h1>Terrain</h1>
        <p className="muted">Peta My AI Tool Stack</p>
        {state === 'sent' ? (
          <p className="login-sent" role="status">
            Link masuk sudah dikirim ke <strong>{email}</strong>. Buka dari perangkat ini.
          </p>
        ) : (
          <form onSubmit={submit}>
            <label htmlFor="email">Email akun StudyO</label>
            <input id="email" type="email" required autoComplete="email" inputMode="email"
              value={email} onChange={e => setEmail(e.target.value)} placeholder="nama@email.com" />
            <button type="submit" className="btn-primary" disabled={state === 'sending'}>
              {state === 'sending' ? 'Mengirim…' : 'Kirim link masuk'}
            </button>
            {error && <p className="login-error" role="alert">{error}</p>}
          </form>
        )}
        <a className="login-demo" href="?demo">Coba mode contoh</a>
      </div>
    </main>
  );
}
