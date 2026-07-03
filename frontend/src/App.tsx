import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { ProtectedRoute, PasswordChangeGuard } from './components/Guards.js';
import { Layout } from './components/Layout.js';

// Pages
import { Login } from './pages/Login.js';
import { ChangePassword } from './pages/ChangePassword.js';
import { Dashboard } from './pages/Dashboard.js';
import { Relatorios } from './pages/Relatorios.js';
import { Usuarios } from './pages/usuarios/Usuarios.js';
import { Unidades } from './pages/unidades/Unidades.js';
import { Setores } from './pages/setores/Setores.js';
import { TiposProblema } from './pages/tipos-problema/TiposProblema.js';
import { AbrirChamado } from './pages/AbrirChamado.js';
import { Chamados } from './pages/Chamados.js';
import { DetalhesChamado } from './pages/DetalhesChamado.js';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const HomeRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'SOLICITANTE') {
    return <Navigate to="/chamados" replace />;
  }
  return <Navigate to="/dashboard" replace />;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Rota pública de login */}
      <Route path="/login" element={<Login />} />

      {/* Rota de alteração de senha obrigatória (protegida de auth, mas sem o guard de senha para evitar loop) */}
      <Route
        path="/change-password"
        element={
          <ProtectedRoute>
            <ChangePassword />
          </ProtectedRoute>
        }
      />

      {/* Rotas protegidas sob o Layout superior unificado */}
      <Route
        element={
          <ProtectedRoute>
            <PasswordChangeGuard>
              <Layout />
            </PasswordChangeGuard>
          </ProtectedRoute>
        }
      >
        {/* Rotas de Tickets - Acessíveis a todos os cargos autorizados */}
        <Route path="/chamados" element={<Chamados />} />
        <Route path="/chamados/:id" element={<DetalhesChamado />} />
        
        {/* Rota de Abertura de Chamado - Apenas Solicitante */}
        <Route
          path="/abrir-chamado"
          element={
            <ProtectedRoute allowedRoles={['SOLICITANTE']}>
              <AbrirChamado />
            </ProtectedRoute>
          }
        />

        {/* Dashboard - Técnico, Gestor, Diretor e Admin */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'DIRETOR', 'GESTOR_TI', 'TECNICO']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Relatórios - Gestor, Diretor e Admin */}
        <Route
          path="/relatorios"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'DIRETOR', 'GESTOR_TI']}>
              <Relatorios />
            </ProtectedRoute>
          }
        />

        {/* Gestão de Usuários - Gestor, Diretor e Admin */}
        <Route
          path="/usuarios"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'DIRETOR', 'GESTOR_TI']}>
              <Usuarios />
            </ProtectedRoute>
          }
        />

        {/* Gestão de Unidades - Apenas Admin */}
        <Route
          path="/unidades"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Unidades />
            </ProtectedRoute>
          }
        />

        {/* Gestão de Tipos de Ocorrência - Apenas Admin */}
        <Route
          path="/setores"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Setores />
            </ProtectedRoute>
          }
        />

        {/* Gestão de Tipos de Problema - Apenas Admin */}
        <Route
          path="/tipos-problema"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <TiposProblema />
            </ProtectedRoute>
          }
        />

        {/* Redirecionamento da raiz com base no cargo */}
        <Route path="/" element={<HomeRedirect />} />
      </Route>

      {/* Fallback para qualquer rota inexistente */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
