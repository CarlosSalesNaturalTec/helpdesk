import React from 'react';
import { useAuth } from '../context/AuthContext.js';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="main-content">
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>
          Olá, {user.nome}!
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Bem-vindo ao portal de atendimento do Instituto.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
        marginBottom: '40px'
      }}>
        <div className="glass-panel" style={{ padding: '24px' }}>
          <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>Sua Unidade</span>
          <h2 style={{ fontSize: '24px', margin: '8px 0 4px 0' }}>{user.unidadeNome || 'Unidade Central'}</h2>
          <span style={{ fontSize: '13px', color: 'var(--primary)' }}>Acesso local restrito</span>
        </div>

        <div className="glass-panel" style={{ padding: '24px' }}>
          <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>Chamados da Unidade</span>
          <h2 style={{ fontSize: '36px', margin: '8px 0 4px 0', fontFamily: 'monospace' }}>0</h2>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Nenhum chamado ativo</span>
        </div>

        <div className="glass-panel" style={{ padding: '24px' }}>
          <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>Usuários Ativos</span>
          <h2 style={{ fontSize: '36px', margin: '8px 0 4px 0', fontFamily: 'monospace' }}>--</h2>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Módulo ativo</span>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '32px', textAlign: 'left' }}>
        <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Visão Geral do Perfil</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px 24px', fontSize: '15px' }}>
          <span style={{ color: 'var(--text-muted)' }}>E-mail:</span>
          <span>{user.email}</span>
          
          <span style={{ color: 'var(--text-muted)' }}>Papel no Sistema:</span>
          <span>{user.role}</span>
          
          <span style={{ color: 'var(--text-muted)' }}>Permissões:</span>
          <span>
            {user.role === 'ADMIN' && 'Acesso irrestrito global e gerenciamento de Unidades e Usuários'}
            {user.role === 'DIRETOR' && 'Gerenciamento de chamados e usuários da própria unidade'}
            {user.role === 'GESTOR_TI' && 'Gerenciamento de chamados e usuários da própria unidade'}
            {user.role === 'TECNICO' && 'Visualização e atendimento a chamados da própria unidade'}
            {user.role === 'SOLICITANTE' && 'Abertura e acompanhamento de chamados próprios'}
          </span>
        </div>
      </div>
    </div>
  );
};
