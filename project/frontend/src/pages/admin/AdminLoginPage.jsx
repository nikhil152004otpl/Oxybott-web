import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { IconArrowRight } from '../../components/common/Icons';
import '../../styles/admin.css';

export default function AdminLoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(username, password);
      if (res.success) {
        navigate('/admin');
      } else {
        setError(res.error || 'Invalid username or password.');
      }
    } catch (err) {
      setError('Network or server error. Please verify backend connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen" id="loginScreen" style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--admin-navy-dark)' }}>
      <div className="login-card" style={{ background: '#ffffff', borderRadius: '16px', padding: '2.5rem', width: '100%', maxWidth: '420px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <img src="/assets/images/oxybott_logo.webp" alt="Oxybott" className="login-logo" style={{ maxHeight: '42px', margin: '0 auto 1rem auto' }} />
          <h1 className="login-title" style={{ fontSize: '1.5rem', color: 'var(--admin-navy)', margin: 0 }}>Admin Portal</h1>
          <p className="login-subtitle" style={{ color: 'var(--admin-gray-500)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Sign in to manage Oxybott store, products, and leads
          </p>
        </div>

        {error && (
          <div id="loginAlert" style={{ padding: '0.75rem', borderRadius: '8px', background: '#fee2e2', color: '#b91c1c', fontSize: '0.85rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form" id="loginForm">
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--admin-gray-700)', marginBottom: '0.25rem' }}>
              Username or Email
            </label>
            <input
              type="text"
              id="loginUsername"
              className="form-input"
              style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid var(--admin-gray-300)', boxSizing: 'border-box' }}
              placeholder="admin"
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--admin-gray-700)', marginBottom: '0.25rem' }}>
              Password
            </label>
            <input
              type="password"
              id="loginPassword"
              className="form-input"
              style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid var(--admin-gray-300)', boxSizing: 'border-box' }}
              placeholder="••••••••"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.85rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            id="loginBtn"
            disabled={loading}
          >
            <span>{loading ? 'Verifying...' : 'Sign In to Dashboard'}</span>
            {!loading && <IconArrowRight size={15} />}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', padding: '0.75rem', background: '#f1f5f9', borderRadius: '8px', fontSize: '0.8rem', color: '#475569' }}>
          <strong>Initial Admin Credentials:</strong><br />
          Username: <code style={{ color: 'var(--admin-navy)', fontWeight: 700 }}>admin</code> &bull; Password: <code style={{ color: 'var(--admin-navy)', fontWeight: 700 }}>AdminPassword123!</code>
        </div>
      </div>
    </div>
  );
}

