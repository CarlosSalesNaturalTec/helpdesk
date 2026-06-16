import React from 'react';
import { useAuth } from '../context/AuthContext.js';

export const AbrirChamado: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      backgroundColor: 'var(--bg-main)',
      color: 'var(--text-main)',
    }}>
      <header className="navbar">
        <div className="nav-brand">
          HelpDesk <span>Instituto</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            {user?.nome} ({user?.unidadeNome})
          </span>
          <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '14px' }}>
            Sair
          </button>
        </div>
      </header>
      
      <main className="main-content" style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>Abrir Chamado</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Preencha os dados do chamado para obter suporte técnico na unidade {user?.unidadeNome}.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '32px' }}>
          <div className="alert alert-warning" style={{ marginBottom: '24px' }}>
            O sistema de abertura de chamados estará disponível em breve. A sua conta atual de <strong>Solicitante</strong> foi configurada com sucesso.
          </div>

          <form onSubmit={(e) => e.preventDefault()} style={{ opacity: 0.5, pointerEvents: 'none' }}>
            <div className="form-group">
              <label className="form-label">Assunto / Título</label>
              <input type="text" className="input-field" placeholder="Ex: Computador não liga" disabled />
            </div>

            <div className="form-group">
              <label className="form-label">Descrição do Problema</label>
              <textarea className="input-field" style={{ minHeight: '120px', resize: 'vertical' }} placeholder="Descreva os detalhes..." disabled></textarea>
            </div>

            <button type="button" className="btn btn-primary" style={{ width: '100%' }} disabled>
              Enviar Chamado
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};
