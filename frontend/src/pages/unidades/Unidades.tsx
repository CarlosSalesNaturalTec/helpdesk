import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { apiClient } from '../../api/client.js';
import { unidadeSchema } from '@helpdesk/shared';

interface Unidade {
  id: number;
  nome: string;
  criadoEm: string;
}

export const Unidades: React.FC = () => {
  const { user } = useAuth();
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedUnidade, setSelectedUnidade] = useState<Unidade | null>(null);
  const [nome, setNome] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [unidadeToDelete, setUnidadeToDelete] = useState<Unidade | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchUnidades = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<Unidade[]>('/api/unidades');
      setUnidades(response.data);
    } catch (err: any) {
      console.error('Erro ao listar unidades:', err);
      setError('Não foi possível carregar a lista de unidades.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnidades();
  }, []);

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setSelectedUnidade(null);
    setNome('');
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (unidade: Unidade) => {
    setModalMode('edit');
    setSelectedUnidade(unidade);
    setNome(unidade.nome);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSaveUnidade = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setSubmitting(true);

    // Validar com Zod
    const parseResult = unidadeSchema.safeParse({ nome });
    if (!parseResult.success) {
      setModalError(parseResult.error.format().nome?._errors[0] || 'Nome inválido');
      setSubmitting(false);
      return;
    }

    try {
      if (modalMode === 'create') {
        await apiClient.post('/api/unidades', { nome });
      } else {
        await apiClient.put(`/api/unidades/${selectedUnidade?.id}`, { nome });
      }
      setIsModalOpen(false);
      fetchUnidades();
    } catch (err: any) {
      console.error('Erro ao salvar unidade:', err);
      const apiError = err.response?.data?.error;
      setModalError(typeof apiError === 'string' ? apiError : 'Falha ao salvar a unidade.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDeleteDialog = (unidade: Unidade) => {
    setUnidadeToDelete(unidade);
    setDeleteError(null);
    setIsDeleteOpen(true);
  };

  const handleDeleteUnidade = async () => {
    if (!unidadeToDelete) return;
    setDeleteError(null);
    
    try {
      await apiClient.delete(`/api/unidades/${unidadeToDelete.id}`);
      setIsDeleteOpen(false);
      fetchUnidades();
    } catch (err: any) {
      console.error('Erro ao excluir unidade:', err);
      const apiError = err.response?.data?.error;
      setDeleteError(typeof apiError === 'string' ? apiError : 'Erro ao tentar excluir a unidade.');
    }
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="main-content">
      <div className="flex-row-between" style={{ marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>Unidades</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Lista de unidades do Instituto para vinculação de chamados e contas de usuários.
          </p>
        </div>
        {isAdmin && (
          <button onClick={handleOpenCreateModal} className="btn btn-primary">
            Nova Unidade
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '24px' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Carregando unidades...</div>
      ) : (
        <div className="glass-panel data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome da Unidade</th>
                <th>Criado Em</th>
                {isAdmin && <th style={{ textAlign: 'right' }}>Ações</th>}
              </tr>
            </thead>
            <tbody>
              {unidades.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 4 : 3} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    Nenhuma unidade cadastrada.
                  </td>
                </tr>
              ) : (
                unidades.map((unidade) => (
                  <tr key={unidade.id}>
                    <td style={{ fontFamily: 'monospace' }}>{unidade.id}</td>
                    <td style={{ fontWeight: 500 }}>{unidade.nome}</td>
                    <td>{new Date(unidade.criadoEm).toLocaleDateString()}</td>
                    {isAdmin && (
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleOpenEditModal(unidade)}
                            className="btn btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '13px' }}
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleOpenDeleteDialog(unidade)}
                            className="btn btn-danger"
                            style={{ padding: '6px 12px', fontSize: '13px' }}
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    )}
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
          <div className="modal-content glass-panel" style={{ backgroundColor: 'var(--bg-card-solid)' }}>
            <h3 style={{ fontSize: '20px', marginBottom: '24px' }}>
              {modalMode === 'create' ? 'Nova Unidade' : 'Editar Unidade'}
            </h3>

            {modalError && (
              <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
                {modalError}
              </div>
            )}

            <form onSubmit={handleSaveUnidade}>
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Nome da Unidade</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Ex: TI - São Paulo"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  disabled={submitting}
                  autoFocus
                />
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

      {/* Delete Confirmation Modal */}
      {isDeleteOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ backgroundColor: 'var(--bg-card-solid)' }}>
            <h3 style={{ fontSize: '20px', marginBottom: '16px', color: 'var(--danger)' }}>
              Confirmar Exclusão
            </h3>

            <p style={{ color: 'var(--text-main)', marginBottom: '24px', fontSize: '15px' }}>
              Tem certeza que deseja excluir a unidade <strong>{unidadeToDelete?.nome}</strong>? Esta ação não pode ser desfeita.
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
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteUnidade}
                className="btn btn-danger"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
