import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { NotificationBell } from './NotificationBell.js';
import { APP_NAME, CLIENT_NAME } from '../config.js';

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const getBadgeClass = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'badge-admin';
      case 'DIRETOR': return 'badge-diretor';
      case 'GESTOR_TI': return 'badge-gestor';
      case 'TECNICO': return 'badge-tecnico';
      default: return 'badge-solicitante';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Admin';
      case 'DIRETOR': return 'Diretor';
      case 'GESTOR_TI': return 'Gestor de TI';
      case 'TECNICO': return 'Técnico';
      default: return 'Solicitante';
    }
  };

  const showUsuarios = ['ADMIN', 'DIRETOR', 'GESTOR_TI'].includes(user.role);
  const showUnidades = user.role === 'ADMIN';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <header className="navbar">
        <div className="nav-brand">
          {APP_NAME} <span>{CLIENT_NAME}</span>
        </div>

        <nav className="nav-links">
          {user.role === 'SOLICITANTE' && (
            <>
              <Link 
                to="/chamados" 
                className={`nav-link ${location.pathname === '/chamados' ? 'active' : ''}`}
              >
                Meus Chamados
              </Link>
              <Link 
                to="/abrir-chamado" 
                className={`nav-link ${location.pathname === '/abrir-chamado' ? 'active' : ''}`}
              >
                Abrir Chamado
              </Link>
            </>
          )}

          {user.role !== 'SOLICITANTE' && (
            <>
              <Link 
                to="/dashboard" 
                className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
              >
                Dashboard
              </Link>
              <Link 
                to="/chamados" 
                className={`nav-link ${location.pathname.startsWith('/chamados') ? 'active' : ''}`}
              >
                Chamados
              </Link>
            </>
          )}

          {showUsuarios && (
            <Link 
              to="/relatorios" 
              className={`nav-link ${location.pathname.startsWith('/relatorios') ? 'active' : ''}`}
            >
              Relatórios
            </Link>
          )}
          
          {showUsuarios && (
            <Link 
              to="/usuarios" 
              className={`nav-link ${location.pathname.startsWith('/usuarios') ? 'active' : ''}`}
            >
              Usuários
            </Link>
          )}

          {showUnidades && (
            <>
              <Link 
                to="/unidades" 
                className={`nav-link ${location.pathname.startsWith('/unidades') ? 'active' : ''}`}
              >
                Unidades
              </Link>
              <Link 
                to="/setores" 
                className={`nav-link ${location.pathname.startsWith('/setores') ? 'active' : ''}`}
              >
                Tipos de Ocorrência
              </Link>
              <Link 
                to="/tipos-problema" 
                className={`nav-link ${location.pathname.startsWith('/tipos-problema') ? 'active' : ''}`}
              >
                Tipos de Problema
              </Link>
            </>
          )}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <NotificationBell />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-main)' }}>
              {user.nome}
            </span>
            <span className={`user-badge ${getBadgeClass(user.role)}`} style={{ marginTop: '2px' }}>
              {getRoleLabel(user.role)}
            </span>
          </div>

          <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '14px' }}>
            Sair
          </button>
        </div>
      </header>

      <main style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </main>
    </div>
  );
};
