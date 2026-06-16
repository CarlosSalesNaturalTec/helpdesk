import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<'SOLICITANTE' | 'TECNICO' | 'GESTOR_TI' | 'DIRETOR' | 'ADMIN'>;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0f172a',
        color: '#f8fafc',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            height: '48px',
            width: '48px',
            borderRadius: '50%',
            border: '4px solid #334155',
            borderTopColor: '#6366f1',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ marginTop: '16px', fontSize: '14px', fontWeight: 500, letterSpacing: '0.05em' }}>Carregando...</p>
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Se o solicitante tenta ir a uma página restrita, redireciona ele para abrir-chamado. Outros vão para dashboard.
    const defaultRedirect = user.role === 'SOLICITANTE' ? '/abrir-chamado' : '/dashboard';
    return <Navigate to={defaultRedirect} replace />;
  }

  return <>{children}</>;
};

export const PasswordChangeGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return null;
  }

  if (user && user.passwordResetRequired && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  return <>{children}</>;
};
