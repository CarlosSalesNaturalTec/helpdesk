import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { loginSchema } from '@helpdesk/shared';
import { FULL_NAME } from '../config.js';

export const Login: React.FC = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; senha?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  // Se já estiver logado, redireciona
  React.useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || (user.role === 'SOLICITANTE' ? '/abrir-chamado' : '/dashboard');
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setSubmitting(true);

    // Validar localmente com Zod
    const parseResult = loginSchema.safeParse({ email, senha });
    if (!parseResult.success) {
      const formatted = parseResult.error.format();
      setFieldErrors({
        email: formatted.email?._errors[0],
        senha: formatted.senha?._errors[0],
      });
      setSubmitting(false);
      return;
    }

    try {
      await login({ email, senha });
      // O useEffect cuidará de navegar pós-login
    } catch (err: any) {
      console.error('Erro de login:', err);
      const apiError = err.response?.data?.error;
      setError(typeof apiError === 'string' ? apiError : 'Falha ao autenticar. Verifique sua conexão.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at top, #1e293b, #0f172a, #0b0f19)',
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        width: '420px',
        padding: '40px',
        textAlign: 'center',
      }}>
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '28px', background: 'linear-gradient(135deg, #a5b4fc, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px' }}>
            {FULL_NAME}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Entre na sua conta para acessar o portal
          </p>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">E-mail Corporativo</label>
            <input
              id="email"
              type="email"
              className="input-field"
              placeholder="exemplo@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
            />
            {fieldErrors.email && (
              <span style={{ color: 'var(--danger)', fontSize: '12px', marginTop: '2px' }}>
                {fieldErrors.email}
              </span>
            )}
          </div>

          <div className="form-group" style={{ marginBottom: '28px' }}>
            <label className="form-label" htmlFor="senha">Senha</label>
            <input
              id="senha"
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              disabled={submitting}
            />
            {fieldErrors.senha && (
              <span style={{ color: 'var(--danger)', fontSize: '12px', marginTop: '2px' }}>
                {fieldErrors.senha}
              </span>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={submitting}
          >
            {submitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
};
