import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext.js';
import { ProtectedRoute, PasswordChangeGuard } from './components/Guards.js';
import { Layout } from './components/Layout.js';

// Pages
import { Login } from './pages/Login.js';
import { ChangePassword } from './pages/ChangePassword.js';
import { Dashboard } from './pages/Dashboard.js';
import { Usuarios } from './pages/usuarios/Usuarios.js';
import { Unidades } from './pages/unidades/Unidades.js';
import { AbrirChamado } from './pages/AbrirChamado.js';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
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

            {/* Rota do Solicitante (abrir chamado) */}
            <Route
              path="/abrir-chamado"
              element={
                <ProtectedRoute allowedRoles={['SOLICITANTE']}>
                  <PasswordChangeGuard>
                    <AbrirChamado />
                  </PasswordChangeGuard>
                </ProtectedRoute>
              }
            />

            {/* Rotas administrativas / atendimento (Layout base + Sidebar + AppBar) */}
            <Route
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'DIRETOR', 'GESTOR_TI', 'TECNICO']}>
                  <PasswordChangeGuard>
                    <Layout />
                  </PasswordChangeGuard>
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route
                path="/usuarios"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'DIRETOR', 'GESTOR_TI']}>
                    <Usuarios />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/unidades"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <Unidades />
                  </ProtectedRoute>
                }
              />
              {/* Redirecionamento da raiz */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Route>

            {/* Fallback para qualquer rota inexistente */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
