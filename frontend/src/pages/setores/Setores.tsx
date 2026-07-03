import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { apiClient } from '../../api/client.js';
import { sectorSchema } from '@helpdesk/shared';

interface Sector {
  id: number;
  nome: string;
  ativo: boolean;
  criadoEm: string;
}

export const Setores: React.FC = () => {
  const { user } = useAuth();
  const [setores, setSetores] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);
  const [nome, setNome] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [modalError, setModalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchSetores = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<Sector[]>('/api/sectors');
      setSetores(response.data);
    } catch (err: any) {
      console.error('Erro ao listar setores:', err);
      setError('Não foi possível carregar a lista de tipos de ocorrência.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSetores();
  }, []);

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setSelectedSector(null);
    setNome('');
    setAtivo(true);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (sector: Sector) => {
    setModalMode('edit');
    setSelectedSector(sector);
    setNome(sector.nome);
    setAtivo(sector.ativo);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSaveSector = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setSubmitting(true);

    const parseResult = sectorSchema.safeParse({ nome, ativo });
    if (!parseResult.success) {
      setModalError(parseResult.error.format().nome?._errors[0] || 'Dados inválidos');
      setSubmitting(false);
      return;
    }

    try {
      if (modalMode === 'create') {
        await apiClient.post('/api/sectors', { nome, ativo });
      } else {
        await apiClient.put(`/api/sectors/${selectedSector?.id}`, { nome, ativo });
      }
      setIsModalOpen(false);
      fetchSetores();
    } catch (err: any) {
      console.error('Erro ao salvar setor:', err);
      const apiError = err.response?.data?.error;
      setModalError(typeof apiError === 'string' ? apiError : 'Falha ao salvar o tipo de ocorrência.');
    } finally {
      setSubmitting(false);
    }
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="main-content">
      <div className="flex-row-between" style={{ marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>Tipos de Ocorrência</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Gerenciamento de tipos de ocorrência do Instituto.
          </p>
        </div>
        {isAdmin && (
          <button onClick={handleOpenCreateModal} className="btn btn-primary">
            Novo Tipo de Ocorrência
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '24px' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Carregando tipos de ocorrência...</div>
      ) : (
        <div className="glass-panel data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome do Tipo de Ocorrência</th>
                <th>Status</th>
                <th>Criado Em</th>
                {isAdmin && <th style={{ textAlign: 'right' }}>Ações</th>}
              </tr>
            </thead>
            <tbody>
              {setores.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 5 : 4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    Nenhum tipo de ocorrência cadastrado.
                  </td>
                </tr>
              ) : (
                setores.map((sector) => (
                  <tr key={sector.id}>
                    <td style={{ fontFamily: 'monospace' }}>{sector.id}</td>
                    <td style={{ fontWeight: 500 }}>{sector.nome}</td>
                    <td>
                      <span className={`badge ${sector.ativo ? 'badge-success' : 'badge-secondary'}`}>
                        {sector.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td>{new Date(sector.criadoEm).toLocaleDateString()}</td>
                    {isAdmin && (
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleOpenEditModal(sector)}
                            className="btn btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '13px' }}
                          >
                            Editar
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
              {modalMode === 'create' ? 'Novo Tipo de Ocorrência' : 'Editar Tipo de Ocorrência'}
            </h3>

            {modalError && (
              <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
                {modalError}
              </div>
            )}

            <form onSubmit={handleSaveSector}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Nome do Tipo de Ocorrência</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Ex: Manutenção"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  disabled={submitting}
                  autoFocus
                />
              </div>

              <div className="form-group checkbox-group" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="ativo"
                  checked={ativo}
                  onChange={(e) => setAtivo(e.target.checked)}
                  disabled={submitting}
                />
                <label htmlFor="ativo" style={{ margin: 0 }}>Ativo</label>
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
    </div>
  );
};
