import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/services/supabase';

export function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError('E-mail ou senha incorretos.');
      setLoading(false);
    } else {
      navigate('/admin');
    }
  }

  return (
    <div className="login-shell">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;1,500&family=Inter:wght@400;500;600&display=swap');

        :root {
          --forest: #3c5a53;
          --forest-deep: #2f4842;
          --sage: #97b7b1;
          --nude: #d1b39d;
          --cream: #e8dad1;
          --warm-white: #fffaf8;
          --ink: #26332f;
        }

        .login-shell {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background-color: var(--forest);
          font-family: 'Inter', -apple-system, sans-serif;
          color: var(--ink);
          padding: 24px;
        }

        .login-card {
          background-color: var(--warm-white);
          padding: 48px 40px 40px;
          border-radius: 4px;
          box-shadow: 0 24px 48px rgba(20, 32, 28, 0.28);
          display: flex;
          flex-direction: column;
          gap: 20px;
          width: 100%;
          max-width: 400px;
        }

        .login-brand {
          text-align: center;
          margin-bottom: 6px;
        }

        .login-brand-name {
          font-family: 'Playfair Display', serif;
          font-size: 30px;
          font-weight: 600;
          color: var(--forest-deep);
          line-height: 1;
        }

        .login-brand-rule {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 12px;
        }

        .login-brand-rule-line {
          flex: 1;
          height: 1px;
          background: var(--cream);
        }

        .login-brand-label {
          font-size: 11px;
          letter-spacing: 0.16em;
          color: var(--nude);
          white-space: nowrap;
        }

        .login-error {
          color: #9a3b2f;
          background-color: #f7e9e4;
          border: 1px solid #e7c9bd;
          padding: 11px 13px;
          border-radius: 4px;
          font-size: 13.5px;
        }

        .login-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .login-field label {
          font-size: 13px;
          font-weight: 500;
          color: var(--forest-deep);
        }

        .login-field input {
          padding: 11px 13px;
          border-radius: 4px;
          border: 1px solid var(--cream);
          background-color: var(--warm-white);
          font-family: inherit;
          font-size: 14.5px;
          color: var(--ink);
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .login-field input:focus {
          outline: none;
          border-color: var(--sage);
          box-shadow: 0 0 0 3px rgba(151, 183, 177, 0.28);
        }

        .login-submit {
          padding: 13px;
          background-color: var(--forest);
          color: var(--warm-white);
          border: none;
          border-radius: 4px;
          font-family: inherit;
          font-size: 14.5px;
          font-weight: 600;
          letter-spacing: 0.01em;
          cursor: pointer;
          margin-top: 8px;
          transition: background-color 0.15s ease;
        }

        .login-submit:hover:not(:disabled) {
          background-color: var(--forest-deep);
        }

        .login-submit:disabled {
          background-color: var(--sage);
          cursor: not-allowed;
        }
      `}</style>

      <form onSubmit={handleLogin} className="login-card">
        <div className="login-brand">
          <div className="login-brand-name">5Seasons</div>
          <div className="login-brand-rule">
            <span className="login-brand-rule-line" />
            <span className="login-brand-label">ADMIN</span>
            <span className="login-brand-rule-line" />
          </div>
        </div>

        {error && <div className="login-error">{error}</div>}

        <div className="login-field">
          <label htmlFor="email">E-mail da Agência</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="login-field">
          <label htmlFor="password">Senha</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" disabled={loading} className="login-submit">
          {loading ? 'Autenticando...' : 'Acessar Painel'}
        </button>
      </form>
    </div>
  );
}