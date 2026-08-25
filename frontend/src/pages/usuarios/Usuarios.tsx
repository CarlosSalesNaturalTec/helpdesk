import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { apiClient } from '../../api/client.js';
import { userSchema } from '@helpdesk/shared';

interface Unidade {
  id: number;
  nome: string;
}

interface Sector {
  id: number;
  nome: string;
}

interface UserListItem {
  id: number;
  nome: string;
  email: string;
  role: 'SOLICITANTE' | 'TECNICO' | 'GESTOR' | 'DIRETOR' | 'ADMIN';
  unidadeId: number;
  unidade: Unidade;
  ativo: boolean;
  passwordResetRequired: boolean;
  criadoEm: string;
  sectorId?: number;
  sector?: Sector | null;
}

export const Usuarios: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [usuarios, setUsuarios] = useState<UserListItem[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
  
  // Form Fields
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'SOLICITANTE' | 'TECNICO' | 'GESTOR' | 'DIRETOR' | 'ADMIN'>('SOLICITANTE');
  const [unidadeId, setUnidadeId] = useState<number>(0);
  const [sectorId, setSectorId] = useState<number | ''>('');
  const [senha, setSenha] = useState('');
  
  const [modalError, setModalError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Deactivate Warning State
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
  const [userToDeactivate, setUserToDeactivate] = useState<UserListItem | null>(null);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);
  const [activeTicketsWarning, setActiveTicketsWarning] = useState<string | null>(null);

  const fetchUsuarios = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<UserListItem[]>('/api/usuarios');
      setUsuarios(response.data);
    } catch (err: any) {
      console.error('Erro ao listar usuários:', err);
      setError('Não foi possível carregar a lista de usuários.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnidades = async () => {
    try {
      const response = await apiClient.get<Unidade[]>('/api/unidades');
      setUnidades(response.data);
      if (response.data.length > 0 && unidadeId === 0) {
        // Inicializar com a primeira unidade ou a do usuário logado
        if (currentUser?.role !== 'ADMIN') {
          setUnidadeId(currentUser?.unidadeId || response.data[0].id);
        } else {
          setUnidadeId(response.data[0].id);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar unidades:', err);
    }
  };

  const fetchSectors = async () => {
    try {
      const response = await apiClient.get<Sector[]>('/api/sectors');
      setSectors(response.data);
    } catch (err) {
      console.error('Erro ao carregar setores:', err);
    }
  };

  useEffect(() => {
    fetchUsuarios();
    fetchUnidades();
    fetchSectors();
  }, [currentUser]);

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setSelectedUser(null);
    setNome('');
    setEmail('');
    setRole('SOLICITANTE');
    // Se for admin, usa a primeira unidade, senão a dele
    setUnidadeId(currentUser?.role === 'ADMIN' ? (unidades[0]?.id || 0) : (currentUser?.unidadeId || 0));
    setSectorId('');
    setSenha('');
    setModalError(null);
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (userItem: UserListItem) => {
    setModalMode('edit');
    setSelectedUser(userItem);
    setNome(userItem.nome);
    setEmail(userItem.email);
    setRole(userItem.role);
    setUnidadeId(userItem.unidadeId);
    setSectorId(userItem.sectorId || '');
    setSenha('');
    setModalError(null);
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setFieldErrors({});
    setSubmitting(true);

    const payload: any = {
      nome,
      email,
      role,
      unidadeId: Number(unidadeId),
    };

    if (role === 'TECNICO' || role === 'GESTOR') {
      if (!sectorId) {
        setFieldErrors({ sectorId: 'Tipo de Ocorrência é obrigatório para Técnicos e Gestores' });
        setSubmitting(false);
        return;
      }
      payload.sectorId = Number(sectorId);
    }

    // Senha temporária só é exigida no cadastro, ou se preenchida no edit
    if (senha) {
      payload.senha = senha;
    }

    // Validar com Zod
    const parseResult = userSchema.safeParse(payload);
    if (!parseResult.success) {
      const formatted = parseResult.error.format();
      const errors: Record<string, string> = {};
      if (formatted.nome) errors.nome = formatted.nome._errors[0];
      if (formatted.email) errors.email = formatted.email._errors[0];
      if (formatted.role) errors.role = formatted.role._errors[0];
      if (formatted.unidadeId) errors.unidadeId = formatted.unidadeId._errors[0];
      if (formatted.sectorId) errors.sectorId = formatted.sectorId._errors[0];
      if (formatted.senha) errors.senha = formatted.senha._errors[0];
      
      setFieldErrors(errors);
      setSubmitting(false);
      return;
    }

    // No cadastro a senha é obrigatória de qualquer forma
    if (modalMode === 'create' && !senha) {
      setFieldErrors({ senha: 'A senha temporária é obrigatória na criação' });
      setSubmitting(false);
      return;
    }

    try {
      if (modalMode === 'create') {
        await apiClient.post('/api/usuarios', payload);
      } else {
        await apiClient.put(`/api/usuarios/${selectedUser?.id}`, payload);
      }
      setIsModalOpen(false);
      fetchUsuarios();
    } catch (err: any) {
      console.error('Erro ao salvar usuário:', err);
      const apiError = err.response?.data?.error;
      setModalError(typeof apiError === 'string' ? apiError : 'Erro ao processar requisição.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDeactivateDialog = (userItem: UserListItem) => {
    setUserToDeactivate(userItem);
    setDeactivateError(null);
    setActiveTicketsWarning(null);
    setIsDeactivateOpen(true);
  };

  const handleDeactivateUser = async (force: boolean = false) => {
    if (!userToDeactivate) return;
    setDeactivateError(null);

    try {
      const url = `/api/usuarios/${userToDeactivate.id}/deactivate${force ? '?force=true' : ''}`;
      await apiClient.patch(url);
      setIsDeactivateOpen(false);
      fetchUsuarios();
    } catch (err: any) {
      console.error('Erro ao desativar usuário:', err);
      const data = err.response?.data;
      if (data?.code === 'ACTIVE_TICKETS_WARNING') {
        setActiveTicketsWarning(data.error);
      } else {
        setDeactivateError(data?.error || 'Falha ao desativar o usuário.');
      }
    }
  };

  const getRoleLabel = (r: string, sectorNome?: string | null) => {
    switch (r) {
      case 'ADMIN': return 'Admin';
      case 'DIRETOR': return 'Diretor';
      case 'GESTOR': return sectorNome ? `Gestor de ${sectorNome}` : 'Gestor';
      case 'TECNICO': return 'Técnico';
      default: return 'Solicitante';
    }
  };

  const getBadgeClass = (r: string) => {
    switch (r) {
      case 'ADMIN': return 'badge-admin';
      case 'DIRETOR': return 'badge-diretor';
      case 'GESTOR': return 'badge-gestor';
      case 'TECNICO': return 'badge-tecnico';
      default: return 'badge-solicitante';
    }
  };

  const isUserAdmin = currentUser?.role === 'ADMIN';

  return (
    <div className="main-content">
      <div className="flex-row-between" style={{ marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>Usuários</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Gerenciamento de usuários.
            {currentUser?.role !== 'ADMIN' && ` Exibindo usuários vinculados à sua unidade: ${currentUser?.unidadeNome}.`}
          </p>
        </div>
        <button onClick={handleOpenCreateModal} className="btn btn-primary">
          Novo Usuário
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '24px' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Carregando usuários...</div>
      ) : (
        <div className="glass-panel data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Papel</th>
                <th>Unidade</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    Nenhum usuário cadastrado.
                  </td>
                </tr>
              ) : (
                usuarios.map((userItem) => (
                  <tr key={userItem.id} style={{ opacity: userItem.ativo ? 1 : 0.5 }}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{userItem.nome}</div>
                      {userItem.id === currentUser?.id && (
                        <span style={{ fontSize: '11px', color: 'var(--primary)' }}>Você</span>
                      )}
                    </td>
                    <td>{userItem.email}</td>
                    <td>
                      <span className={`user-badge ${getBadgeClass(userItem.role)}`}>
                        {getRoleLabel(userItem.role, userItem.sector?.nome)}
                      </span>
                    </td>
                    <td>{userItem.unidade?.nome}</td>
                    <td>
                      <span style={{
                        color: userItem.ativo ? 'var(--success)' : 'var(--danger)',
                        fontSize: '14px',
                        fontWeight: 600
                      }}>
                        {userItem.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleOpenEditModal(userItem)}
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '13px' }}
                          disabled={!userItem.ativo}
                        >
                          Editar
                        </button>
                        {userItem.ativo && userItem.id !== currentUser?.id && (
                          <button
                            onClick={() => handleOpenDeactivateDialog(userItem)}
                            className="btn btn-danger"
                            style={{ padding: '6px 12px', fontSize: '13px', background: 'transparent', border: '1px solid var(--hue-red-border)', color: 'var(--danger)' }}
                          >
                            Desativar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ backgroundColor: 'var(--bg-card-solid)', width: '560px' }}>
            <h3 style={{ fontSize: '20px', marginBottom: '24px' }}>
              {modalMode === 'create' ? 'Novo Usuário' : 'Editar Usuário'}
            </h3>

            {modalError && (
              <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
                {modalError}
              </div>
            )}

            <form onSubmit={handleSaveUser}>
              <div className="form-group">
                <label className="form-label">Nome Completo</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Ex: João da Silva"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  disabled={submitting}
                  autoFocus
                />
                {fieldErrors.nome && <span style={{ color: 'var(--danger)', fontSize: '12px' }}>{fieldErrors.nome}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">E-mail Corporativo</label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="joao@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                />
                {fieldErrors.email && <span style={{ color: 'var(--danger)', fontSize: '12px' }}>{fieldErrors.email}</span>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Papel / Função</label>
                  <select
                    className="input-field"
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    disabled={submitting}
                  >
                    <option value="SOLICITANTE">Solicitante</option>
                    <option value="TECNICO">Técnico</option>
                    <option value="GESTOR">Gestor</option>
                    <option value="DIRETOR">Diretor</option>
                    {isUserAdmin && <option value="ADMIN">Administrador</option>}
                  </select>
                  {fieldErrors.role && <span style={{ color: 'var(--danger)', fontSize: '12px' }}>{fieldErrors.role}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Unidade</label>
                  <select
                    className="input-field"
                    value={unidadeId}
                    onChange={(e) => setUnidadeId(Number(e.target.value))}
                    disabled={submitting || !isUserAdmin} // Bloqueado para Diretor/Gestor
                  >
                    {unidades.map((u) => (
                      <option key={u.id} value={u.id}>{u.nome}</option>
                    ))}
                  </select>
                  {fieldErrors.unidadeId && <span style={{ color: 'var(--danger)', fontSize: '12px' }}>{fieldErrors.unidadeId}</span>}
                </div>

                {(role === 'TECNICO' || role === 'GESTOR') && (
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Tipo de Ocorrência</label>
                    <select
                      className="input-field"
                      value={sectorId}
                      onChange={(e) => setSectorId(e.target.value ? Number(e.target.value) : '')}
                      disabled={submitting}
                    >
                      <option value="">Selecione um tipo de ocorrência...</option>
                      {sectors.map((s) => (
                        <option key={s.id} value={s.id}>{s.nome}</option>
                      ))}
                    </select>
                    {fieldErrors.sectorId && <span style={{ color: 'var(--danger)', fontSize: '12px' }}>{fieldErrors.sectorId}</span>}
                  </div>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">
                  {modalMode === 'create' ? 'Senha Inicial Temporária' : 'Nova Senha Temporária (deixe em branco para manter a atual)'}
                </label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  disabled={submitting}
                />
                {fieldErrors.senha && <span style={{ color: 'var(--danger)', fontSize: '12px' }}>{fieldErrors.senha}</span>}
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary"
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deactivate Confirmation Modal */}
      {isDeactivateOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ backgroundColor: 'var(--bg-card-solid)' }}>
            <h3 style={{ fontSize: '20px', marginBottom: '16px', color: 'var(--danger)' }}>
              Confirmar Desativação
            </h3>

            {!activeTicketsWarning ? (
              <p style={{ color: 'var(--text-main)', marginBottom: '24px', fontSize: '15px' }}>
                Tem certeza que deseja desativar o usuário <strong>{userToDeactivate?.nome}</strong>? Ele perderá o acesso ao sistema imediatamente, mas seu histórico será mantido.
              </p>
            ) : (
              <div style={{ marginBottom: '24px' }}>
                <div className="alert alert-warning" style={{ marginBottom: '16px' }}>
                  {activeTicketsWarning}
                </div>
                <p style={{ color: 'var(--text-main)', fontSize: '15px' }}>
                  Deseja realmente prosseguir e desativar este Técnico mesmo assim?
                </p>
              </div>
            )}

            {deactivateError && (
              <div className="alert alert-danger" style={{ marginBottom: '24px' }}>
                {deactivateError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setIsDeactivateOpen(false)}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDeactivateUser(!!activeTicketsWarning)}
                className="btn btn-danger"
              >
                Confirmar Desativação
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
