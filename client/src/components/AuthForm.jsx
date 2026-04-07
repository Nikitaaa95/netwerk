import { useState } from 'react';
import { api } from '../api';

export default function AuthForm({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = mode === 'login' ? await api.login(form) : await api.register(form);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
    } else {
      localStorage.setItem('token', result.token);
      localStorage.setItem('username', result.username);
      onAuth(result.username);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>NetWerk</h1>
        <p className="auth-subtitle">
          {mode === 'login' ? 'Sign in to your account' : 'Create an account'}
        </p>
        <form onSubmit={handleSubmit}>
          <label>Username
            <input
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              autoFocus
              required
            />
          </label>
          <label>Password
            <input
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </label>
          {error && <p className="error">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
        <p className="auth-toggle">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            className="link-btn"
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
          >
            {mode === 'login' ? 'Register' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
}
