import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { apiClient } from '../api/client.js';
import { changePasswordSchema } from '@helpdesk/shared';
import { BrandLogo } from '../components/BrandLogo.js';

export const ChangePassword: React.FC = () => {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmacaoSenha, setConfirmacaoSenha] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ senhaAtual?: string; novaSenha?: string; confirmacaoSenha?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setFieldErrors({});
    setSubmitting(true);

    // Validar com Zod
    const parseResult = changePasswordSchema.safeParse({ senhaAtual, novaSenha, confirmacaoSenha });
    if (!parseResult.success) {
      const formatted = parseResult.error.format();
      setFieldErrors({
        senhaAtual: formatted.senhaAtual?._errors[0],
        novaSenha: formatted.novaSenha?._errors[0],
        confirmacaoSenha: formatted.confirmacaoSenha?._errors[0],
      });
      setSubmitting(false);
      return;
    }

    try {
      await apiClient.post('/api/auth/change-password', { senhaAtual, novaSenha, confirmacaoSenha });
      setSuccess('Senha alterada com sucesso! Redirecionando...');
      
      // Atualizar o estado do usuário
      await refreshUser();
      
      // Redirecionar após 2 segundos
      setTimeout(() => {
        if (user?.role === 'SOLICITANTE') {
          navigate('/abrir-chamado', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      }, 1500);
    } catch (err: any) {
      console.error('Erro ao mudar senha:', err);
      const apiError = err.response?.data?.error;
      setError(typeof apiError === 'string' ? apiError : 'Senha atual incorreta ou erro no servidor.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (user?.passwordResetRequired) {
      // Se for obrigatório, cancelar desloga o usuário
      logout();
      navigate('/login');
    } else {
      navigate(-1);
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
      <div className="glass-panel auth-panel auth-panel--wide" style={{
        padding: '40px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <BrandLogo variant="mark" height={64} />
          </div>
          <h2 style={{ fontSize: '24px', color: 'var(--text-main)', marginBottom: '8px' }}>
            {user?.passwordResetRequired ? 'Alteração de Senha Obrigatória' : 'Alterar Senha'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            {user?.passwordResetRequired 
              ? 'Por segurança, você deve definir uma nova senha no seu primeiro acesso.'
              : 'Defina uma nova senha para sua conta.'
            }
          </p>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success" style={{ marginBottom: '20px' }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="senhaAtual">Senha Atual / Temporária</label>
            <input
              id="senhaAtual"
              type="password"
              className="input-field"
              value={senhaAtual}
              onChange={(e) => setSenhaAtual(e.target.value)}
              disabled={submitting}
            />
            {fieldErrors.senhaAtual && (
              <span style={{ color: 'var(--danger)', fontSize: '12px', marginTop: '2px' }}>
                {fieldErrors.senhaAtual}
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="novaSenha">Nova Senha</label>
            <input
              id="novaSenha"
              type="password"
              className="input-field"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              disabled={submitting}
            />
            {fieldErrors.novaSenha && (
              <span style={{ color: 'var(--danger)', fontSize: '12px', marginTop: '2px' }}>
                {fieldErrors.novaSenha}
              </span>
            )}
          </div>

          <div className="form-group" style={{ marginBottom: '28px' }}>
            <label className="form-label" htmlFor="confirmacaoSenha">Confirme a Nova Senha</label>
            <input
              id="confirmacaoSenha"
              type="password"
              className="input-field"
              value={confirmacaoSenha}
              onChange={(e) => setConfirmacaoSenha(e.target.value)}
              disabled={submitting}
            />
            {fieldErrors.confirmacaoSenha && (
              <span style={{ color: 'var(--danger)', fontSize: '12px', marginTop: '2px' }}>
                {fieldErrors.confirmacaoSenha}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleCancel}
              style={{ flex: 1 }}
              disabled={submitting}
            >
              {user?.passwordResetRequired ? 'Sair' : 'Cancelar'}
            </button>
            
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 2 }}
              disabled={submitting}
            >
              {submitting ? 'Alterando...' : 'Confirmar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
