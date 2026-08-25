import React, { useEffect, useRef, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { NotificationBell } from './NotificationBell.js';
import { BrandLogo } from './BrandLogo.js';
import { APP_NAME, CLIENT_NAME } from '../config.js';

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Fecha o menu a cada mudança de rota
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Fecha o menu ao clicar fora do header
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const getBadgeClass = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'badge-admin';
      case 'DIRETOR': return 'badge-diretor';
      case 'GESTOR': return 'badge-gestor';
      case 'TECNICO': return 'badge-tecnico';
      default: return 'badge-solicitante';
    }
  };

  const getRoleLabel = (role: string, sectorNome?: string) => {
    switch (role) {
      case 'ADMIN': return 'Admin';
      case 'DIRETOR': return 'Diretor';
      case 'GESTOR': return sectorNome ? `Gestor de ${sectorNome}` : 'Gestor';
      case 'TECNICO': return 'Técnico';
      default: return 'Solicitante';
    }
  };

  const showUsuarios = ['ADMIN', 'DIRETOR', 'GESTOR'].includes(user.role);
  const showUnidades = user.role === 'ADMIN';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <header className="navbar" ref={navRef}>
        <div className="nav-brand">
          <BrandLogo variant="horizontal" height={40} />
          {APP_NAME} <span>{CLIENT_NAME}</span>
        </div>

        <div className={`nav-collapsible ${menuOpen ? 'nav-open' : ''}`}>
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

            {/* Último item do nav. O destino é `index.html` explícito: o
                endpoint do bucket resolve apenas chaves exatas, e `/manual/`
                retorna 404. Ver use_directory_urls em mkdocs.yml. */}
            <a
              href="/manual/index.html"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-link"
            >
              Manual
            </a>
          </nav>

          <div className="navbar-user">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-main)' }}>
                {user.nome}
              </span>
              <span className={`user-badge ${getBadgeClass(user.role)}`} style={{ marginTop: '2px' }}>
                {getRoleLabel(user.role, user.sectorNome)}
              </span>
            </div>

            <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '14px' }}>
              Sair
            </button>
          </div>
        </div>

        <NotificationBell />

        <button
          type="button"
          className="nav-toggle"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </header>

      <main style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </main>
    </div>
  );
};
