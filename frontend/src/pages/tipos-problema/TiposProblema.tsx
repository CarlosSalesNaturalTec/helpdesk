import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { apiClient } from '../../api/client.js';
import { problemTypeSchema } from '@helpdesk/shared';

interface Sector {
  id: number;
  nome: string;
}

interface ProblemType {
  id: number;
  nome: string;
  slaMinutes: number;
  sectorId: number;
  ativo: boolean;
  criadoEm: string;
  sector?: Sector; // Optional nested relation from backend
}

export const TiposProblema: React.FC = () => {
  const { user } = useAuth();
  const [tiposProblema, setTiposProblema] = useState<ProblemType[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedProblemType, setSelectedProblemType] = useState<ProblemType | null>(null);
  
  // Form Fields
  const [nome, setNome] = useState('');
  const [slaMinutes, setSlaMinutes] = useState<number | ''>('');
  const [sectorId, setSectorId] = useState<number | ''>('');
  const [ativo, setAtivo] = useState(true);
  
  const [modalError, setModalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ptRes, secRes] = await Promise.all([
        apiClient.get<ProblemType[]>('/api/problem-types'),
        apiClient.get<Sector[]>('/api/sectors')
      ]);
      setTiposProblema(ptRes.data);
      setSectors(secRes.data);
    } catch (err: any) {
      console.error('Erro ao buscar dados:', err);
      setError('Não foi possível carregar a lista de tipos de problema.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setSelectedProblemType(null);
    setNome('');
    setSlaMinutes('');
    setSectorId('');
    setAtivo(true);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (pt: ProblemType) => {
    setModalMode('edit');
    setSelectedProblemType(pt);
    setNome(pt.nome);
    setSlaMinutes(pt.slaMinutes);
    setSectorId(pt.sectorId);
    setAtivo(pt.ativo);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSaveProblemType = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setSubmitting(true);

    const parseResult = problemTypeSchema.safeParse({ 
      nome, 
      slaMinutes: Number(slaMinutes), 
      sectorId: Number(sectorId), 
      ativo 
    });
    
    if (!parseResult.success) {
      setModalError('Verifique os dados preenchidos. Todos os campos são obrigatórios.');
      setSubmitting(false);
      return;
    }

    try {
      const payload = parseResult.data;
      if (modalMode === 'create') {
        await apiClient.post('/api/problem-types', payload);
      } else {
        await apiClient.put(`/api/problem-types/${selectedProblemType?.id}`, payload);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error('Erro ao salvar tipo de problema:', err);
      const apiError = err.response?.data?.error;
      setModalError(typeof apiError === 'string' ? apiError : 'Falha ao salvar o tipo de problema.');
    } finally {
      setSubmitting(false);
    }
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="main-content">
      <div className="flex-row-between" style={{ marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>Tipos de Problema</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Gerenciamento de categorias de problemas por tipo de ocorrência e seus respectivos SLAs.
          </p>
        </div>
        {isAdmin && (
          <button onClick={handleOpenCreateModal} className="btn btn-primary">
            Novo Tipo de Problema
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '24px' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Carregando dados...</div>
      ) : (
        <div className="glass-panel data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>Tipo de Ocorrência</th>
                <th>SLA (minutos)</th>
                <th>Status</th>
                {isAdmin && <th style={{ textAlign: 'right' }}>Ações</th>}
              </tr>
            </thead>
            <tbody>
              {tiposProblema.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    Nenhum tipo de problema cadastrado.
                  </td>
                </tr>
              ) : (
                tiposProblema.map((pt) => {
                  const sectorName = pt.sector?.nome || sectors.find(s => s.id === pt.sectorId)?.nome || `ID: ${pt.sectorId}`;
                  return (
                    <tr key={pt.id}>
                      <td style={{ fontFamily: 'monospace' }}>{pt.id}</td>
                      <td style={{ fontWeight: 500 }}>{pt.nome}</td>
                      <td>{sectorName}</td>
                      <td>{pt.slaMinutes} min</td>
                      <td>
                        <span className={`badge ${pt.ativo ? 'badge-success' : 'badge-secondary'}`}>
                          {pt.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      {isAdmin && (
                        <td style={{ textAlign: 'right' }}>
                          <button
                            onClick={() => handleOpenEditModal(pt)}
                            className="btn btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '13px' }}
                          >
                            Editar
                          </button>
                        </td>
                      )}
                    </tr>
                  )
                })
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
              {modalMode === 'create' ? 'Novo Tipo de Problema' : 'Editar Tipo de Problema'}
            </h3>

            {modalError && (
              <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
                {modalError}
              </div>
            )}

            <form onSubmit={handleSaveProblemType}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Nome do Problema</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Ex: Troca de Lâmpada"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  disabled={submitting}
                  autoFocus
                />
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Tipo de Ocorrência</label>
                <select
                  className="input-field"
                  value={sectorId}
                  onChange={(e) => setSectorId(e.target.value ? Number(e.target.value) : '')}
                  disabled={submitting}
                >
                  <option value="">Selecione o tipo de ocorrência...</option>
                  {sectors.map(s => (
                    <option key={s.id} value={s.id}>{s.nome}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">SLA (em minutos)</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="Ex: 1440 para 24h"
                  value={slaMinutes}
                  onChange={(e) => setSlaMinutes(e.target.value ? Number(e.target.value) : '')}
                  disabled={submitting}
                  min="0"
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
