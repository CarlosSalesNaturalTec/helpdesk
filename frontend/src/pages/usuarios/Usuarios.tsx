import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { apiClient } from '../../api/client.js';
import { userSchema, MANAGEABLE_ROLES } from '@helpdesk/shared';
import { maskCpf, maskTelefone, onlyDigits } from '../../utils/masks.js';

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
  cpf?: string | null;
  telefone?: string | null;
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

const ROLE_LABELS: Record<string, string> = {
  SOLICITANTE: 'Solicitante',
  TECNICO: 'Técnico',
  GESTOR: 'Gestor',
  DIRETOR: 'Diretor',
  ADMIN: 'Administrador',
};

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
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
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

  // Reactivate / Delete State
  const [isActivateOpen, setIsActivateOpen] = useState(false);
  const [userToActivate, setUserToActivate] = useState<UserListItem | null>(null);
  const [activateError, setActivateError] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserListItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [actionSubmitting, setActionSubmitting] = useState(false);

  const isUserAdmin = currentUser?.role === 'ADMIN';

  // Papéis que o usuário logado pode atribuir, a partir da mesma matriz usada
  // pelo backend — o seletor nunca oferece uma opção que a API recusaria.
  const rolesDisponiveis = (currentUser ? MANAGEABLE_ROLES[currentUser.role] : []) || [];

  // Na auto-edição, papel, Unidade e Tipo de Ocorrência ficam travados: o
  // backend recusa alterá-los com 403 (change usuarios-permissoes-por-papel).
  const isSelfEdit = modalMode === 'edit' && selectedUser?.id === currentUser?.id;

  // Gestor cadastrando Técnico: a área é sempre a dele, então vem preenchida e
  // travada.
  const sectorTravadoNoGestor =
    currentUser?.role === 'GESTOR' && role === 'TECNICO' && !isSelfEdit;

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

  // Mantém a área do Gestor preenchida enquanto o campo estiver travado, para
  // que o payload saia correto mesmo que o papel mude dentro do modal.
  useEffect(() => {
    if (sectorTravadoNoGestor && currentUser?.sectorId) {
      setSectorId(currentUser.sectorId);
    }
  }, [sectorTravadoNoGestor, currentUser?.sectorId]);

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setSelectedUser(null);
    setNome('');
    setCpf('');
    setTelefone('');
    setEmail('');
    setRole(rolesDisponiveis[0] ?? 'SOLICITANTE');
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
    setCpf(maskCpf(userItem.cpf || ''));
    setTelefone(maskTelefone(userItem.telefone || ''));
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
      cpf,
      // O schema compartilhado exige o telefone apenas com dígitos; a máscara
      // existe só na tela (design D1).
      telefone: onlyDigits(telefone),
      email,
      role,
      unidadeId: Number(unidadeId),
    };

    if (role === 'TECNICO' || role === 'GESTOR') {
      if (!sectorId) {
        setFieldErrors({ sectorId: 'Área de atuação é obrigatória para Técnicos e Gestores' });
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
      if (formatted.cpf) errors.cpf = formatted.cpf._errors[0];
      if (formatted.telefone) errors.telefone = formatted.telefone._errors[0];
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

  const handleOpenActivateDialog = (userItem: UserListItem) => {
    setUserToActivate(userItem);
    setActivateError(null);
    setIsActivateOpen(true);
  };

  const handleActivateUser = async () => {
    if (!userToActivate) return;
    setActivateError(null);
    setActionSubmitting(true);

    try {
      await apiClient.patch(`/api/usuarios/${userToActivate.id}/activate`);
      setIsActivateOpen(false);
      fetchUsuarios();
    } catch (err: any) {
      console.error('Erro ao reativar usuário:', err);
      setActivateError(err.response?.data?.error || 'Falha ao reativar o usuário.');
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleOpenDeleteDialog = (userItem: UserListItem) => {
    setUserToDelete(userItem);
    setDeleteError(null);
    setIsDeleteOpen(true);
  };

  // A tela não tenta prever se o usuário tem vínculos: o servidor decide e
  // explica, e o 409 é exibido dentro do próprio modal (design D4).
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setDeleteError(null);
    setActionSubmitting(true);

    try {
      await apiClient.delete(`/api/usuarios/${userToDelete.id}`);
      setIsDeleteOpen(false);
      fetchUsuarios();
    } catch (err: any) {
      console.error('Erro ao excluir usuário:', err);
      setDeleteError(err.response?.data?.error || 'Falha ao excluir o usuário.');
    } finally {
      setActionSubmitting(false);
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
                <th>CPF</th>
                <th>Telefone</th>
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
                  <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
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
                    {/* Registros anteriores à introdução destes campos ficam vazios
                        até a próxima edição — marcador neutro em vez de célula em branco */}
                    <td>{userItem.cpf || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                    <td>{userItem.telefone ? maskTelefone(userItem.telefone) : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
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
                        {/* Usuário inativo: reativar (volta o acesso) ou excluir
                            em definitivo. "Editar" segue desabilitado — reativa-se
                            primeiro (design D4). */}
                        {!userItem.ativo && (
                          <>
                            <button
                              onClick={() => handleOpenActivateDialog(userItem)}
                              className="btn btn-secondary"
                              style={{ padding: '6px 12px', fontSize: '13px' }}
                            >
                              Reativar
                            </button>
                            <button
                              onClick={() => handleOpenDeleteDialog(userItem)}
                              className="btn btn-danger"
                              style={{ padding: '6px 12px', fontSize: '13px', background: 'transparent', border: '1px solid var(--hue-red-border)', color: 'var(--danger)' }}
                            >
                              Excluir
                            </button>
                          </>
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
                <label className="form-label">CPF</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="000.000.000-00"
                  inputMode="numeric"
                  value={cpf}
                  onChange={(e) => setCpf(maskCpf(e.target.value))}
                  disabled={submitting}
                />
                {fieldErrors.cpf && <span style={{ color: 'var(--danger)', fontSize: '12px' }}>{fieldErrors.cpf}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Telefone</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="(00) 00000-0000"
                  inputMode="numeric"
                  value={telefone}
                  onChange={(e) => setTelefone(maskTelefone(e.target.value))}
                  disabled={submitting}
                />
                {fieldErrors.telefone && <span style={{ color: 'var(--danger)', fontSize: '12px' }}>{fieldErrors.telefone}</span>}
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
                    disabled={submitting || isSelfEdit}
                  >
                    {rolesDisponiveis.map((r) => (
                      <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                    ))}
                  </select>
                  {fieldErrors.role && <span style={{ color: 'var(--danger)', fontSize: '12px' }}>{fieldErrors.role}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Unidade</label>
                  <select
                    className="input-field"
                    value={unidadeId}
                    onChange={(e) => setUnidadeId(Number(e.target.value))}
                    disabled={submitting || !isUserAdmin || isSelfEdit} // Bloqueado para Diretor/Gestor e na auto-edição
                  >
                    {unidades.map((u) => (
                      <option key={u.id} value={u.id}>{u.nome}</option>
                    ))}
                  </select>
                  {fieldErrors.unidadeId && <span style={{ color: 'var(--danger)', fontSize: '12px' }}>{fieldErrors.unidadeId}</span>}
                </div>

                {(role === 'TECNICO' || role === 'GESTOR') && (
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Área de atuação</label>
                    <select
                      className="input-field"
                      value={sectorId}
                      onChange={(e) => setSectorId(e.target.value ? Number(e.target.value) : '')}
                      disabled={submitting || isSelfEdit || sectorTravadoNoGestor}
                    >
                      <option value="">Selecione a área...</option>
                      {sectors.map((s) => (
                        <option key={s.id} value={s.id}>{s.nome}</option>
                      ))}
                    </select>
                    {/* O termo "Tipo de Ocorrência" descreve um chamado, não uma
                        pessoa — a dica liga os dois (design D5). */}
                    <span style={{ display: 'block', marginTop: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                      Tipo de Ocorrência atendido por este usuário. Para Gestores, define quais chamados, indicadores e técnicos ele gerencia.
                    </span>
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

      {/* Reactivate Confirmation Modal */}
      {isActivateOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ backgroundColor: 'var(--bg-card-solid)' }}>
            <h3 style={{ fontSize: '20px', marginBottom: '16px' }}>
              Confirmar Reativação
            </h3>

            <p style={{ color: 'var(--text-main)', marginBottom: '24px', fontSize: '15px' }}>
              Reativar o usuário <strong>{userToActivate?.nome}</strong>? Ele volta a acessar o sistema com a senha que já possuía, e qualquer bloqueio por tentativas de login malsucedidas é removido.
            </p>

            {activateError && (
              <div className="alert alert-danger" style={{ marginBottom: '24px' }}>
                {activateError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setIsActivateOpen(false)}
                className="btn btn-secondary"
                disabled={actionSubmitting}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleActivateUser}
                className="btn btn-primary"
                disabled={actionSubmitting}
              >
                {actionSubmitting ? 'Reativando...' : 'Confirmar Reativação'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ backgroundColor: 'var(--bg-card-solid)' }}>
            <h3 style={{ fontSize: '20px', marginBottom: '16px', color: 'var(--danger)' }}>
              Confirmar Exclusão
            </h3>

            <p style={{ color: 'var(--text-main)', marginBottom: '24px', fontSize: '15px' }}>
              Excluir definitivamente o usuário <strong>{userToDelete?.nome}</strong>? <strong>Esta ação é irreversível.</strong> Só é possível excluir usuários que nunca participaram de um chamado — havendo histórico, mantenha o usuário inativo.
            </p>

            {deleteError && (
              <div className="alert alert-danger" style={{ marginBottom: '24px' }}>
                {deleteError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setIsDeleteOpen(false)}
                className="btn btn-secondary"
                disabled={actionSubmitting}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                className="btn btn-danger"
                disabled={actionSubmitting}
              >
                {actionSubmitting ? 'Excluindo...' : 'Excluir Definitivamente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
