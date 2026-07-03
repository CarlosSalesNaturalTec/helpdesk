import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createTicket, getNiveisUrgencia } from '../api/tickets.js';
import { apiClient } from '../api/client.js';
import { createTicketSchema } from '@helpdesk/shared';
import { useAuth } from '../context/AuthContext.js';
import { Link } from 'react-router-dom';

export const AbrirChamado: React.FC = () => {
  const { user } = useAuth();
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [sectorId, setSectorId] = useState<number | ''>('');
  const [problemTypeId, setProblemTypeId] = useState<number | ''>('');
  const [urgencia, setUrgencia] = useState('');

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ numero: string; id: number } | null>(null);

  // Queries para os dropdowns
  const { data: sectors, isLoading: loadingSectors } = useQuery({
    queryKey: ['sectors'],
    queryFn: async () => {
      const res = await apiClient.get<any[]>('/api/sectors');
      return res.data.filter((s: any) => s.ativo);
    },
  });

  const { data: allProblemTypes, isLoading: loadingTipos } = useQuery({
    queryKey: ['problemTypes'],
    queryFn: async () => {
      const res = await apiClient.get<any[]>('/api/problem-types');
      return res.data.filter((pt: any) => pt.ativo);
    },
  });

  const filteredProblemTypes = allProblemTypes?.filter(pt => pt.sectorId === sectorId) || [];

  const { data: niveisUrgencia, isLoading: loadingUrgencias } = useQuery({
    queryKey: ['niveisUrgencia'],
    queryFn: getNiveisUrgencia,
  });

  // Mutation de criação
  const createMutation = useMutation({
    mutationFn: createTicket,
    onSuccess: (data) => {
      setSuccessData({ numero: data.numero, id: data.id });
      // Resetar form
      setTitulo('');
      setDescricao('');
      setSectorId('');
      setProblemTypeId('');
      setUrgencia('');
      setValidationErrors({});
      setSubmitError(null);
    },
    onError: (error: any) => {
      const errMsg = error.response?.data?.error || 'Ocorreu um erro ao enviar o chamado.';
      setSubmitError(errMsg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setValidationErrors({});

    const formData = {
      titulo,
      descricao,
      sectorId: sectorId as any,
      problemTypeId: problemTypeId as any,
      urgencia: urgencia as any,
    };

    // Validação Zod no frontend (Tarefa 11.3)
    const result = createTicketSchema.safeParse(formData);
    if (!result.success) {
      const errorsMap: Record<string, string> = {};
      result.error.issues.forEach((issue: any) => {
        const path = issue.path[0] as string;
        errorsMap[path] = issue.message;
      });
      setValidationErrors(errorsMap);
      return;
    }

    createMutation.mutate(formData);
  };

  if (successData) {
    return (
      <main className="main-content" style={{ maxWidth: '600px', margin: '40px auto', width: '100%' }}>
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px', color: 'var(--success-main)' }}>✓</div>
          <h2 style={{ fontSize: '28px', marginBottom: '12px' }}>Chamado Aberto com Sucesso!</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '16px' }}>
            O seu chamado foi registrado no sistema sob o número:
          </p>
          <div style={{
            fontSize: '32px',
            fontWeight: 'bold',
            padding: '16px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            color: 'var(--primary-main)',
            fontFamily: 'monospace',
            marginBottom: '32px'
          }}>
            #{successData.numero}
          </div>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <Link to={`/chamados/${successData.id}`} className="btn btn-primary">
              Visualizar Chamado
            </Link>
            <button onClick={() => setSuccessData(null)} className="btn btn-secondary">
              Abrir Outro Chamado
            </button>
          </div>
        </div>
      </main>
    );
  }

  const isTituloValid = titulo.length >= 5 && titulo.length <= 100;
  const isDescricaoValid = descricao.length >= 10 && descricao.length <= 2000;

  return (
    <main className="main-content" style={{ maxWidth: '800px', margin: '40px auto', width: '100%' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>Abrir Novo Chamado</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Preencha os campos abaixo detalhando o incidente ou solicitação.
        </p>
      </div>

      {submitError && (
        <div className="alert alert-danger" style={{ marginBottom: '24px' }}>
          {submitError}
        </div>
      )}

      <div className="glass-panel" style={{ padding: '32px' }}>
        {/* Dados do Solicitante (Read-only) - Tarefa 11.2 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          paddingBottom: '24px',
          marginBottom: '24px',
          borderBottom: '1px solid var(--border-color)',
          fontSize: '14px'
        }}>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Solicitante</span>
            <strong style={{ color: 'var(--text-main)' }}>{user?.nome}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>E-mail</span>
            <strong style={{ color: 'var(--text-main)' }}>{user?.email}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Unidade Vinculada</span>
            <strong style={{ color: 'var(--text-main)' }}>{user?.unidadeNome}</strong>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Título */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <label className="form-label">Título do Chamado</label>
              {/* Contador de caracteres (Tarefa 11.5) */}
              <span style={{
                fontSize: '12px',
                color: titulo.length === 0 ? 'var(--text-muted)' : isTituloValid ? 'var(--success-main)' : 'var(--danger-main)'
              }}>
                {titulo.length}/100 caractere(s) {titulo.length > 0 && !isTituloValid && '(Mínimo 5)'}
              </span>
            </div>
            <input
              type="text"
              className={`input-field ${validationErrors.titulo ? 'input-error' : ''}`}
              placeholder="Descreva o problema de forma resumida (ex: Impressora da recepção travada)"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              maxLength={100}
            />
            {validationErrors.titulo && (
              <span className="error-message" style={{ color: 'var(--danger-main)', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                {validationErrors.titulo}
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Setor */}
            <div className="form-group">
              <label className="form-label">Tipo de Ocorrência</label>
              <select
                className={`input-field ${validationErrors.sectorId ? 'input-error' : ''}`}
                value={sectorId}
                onChange={(e) => {
                  setSectorId(e.target.value ? Number(e.target.value) : '');
                  setProblemTypeId('');
                }}
                disabled={loadingSectors}
              >
                <option value="">Selecione o tipo de ocorrência...</option>
                {sectors?.map((sector) => (
                  <option key={sector.id} value={sector.id}>
                    {sector.nome}
                  </option>
                ))}
              </select>
              {validationErrors.sectorId && (
                <span className="error-message" style={{ color: 'var(--danger-main)', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  {validationErrors.sectorId}
                </span>
              )}
            </div>

            {/* Tipo de Problema */}
            <div className="form-group">
              <label className="form-label">Tipo de Problema</label>
              <select
                className={`input-field ${validationErrors.problemTypeId ? 'input-error' : ''}`}
                value={problemTypeId}
                onChange={(e) => setProblemTypeId(e.target.value ? Number(e.target.value) : '')}
                disabled={!sectorId || loadingTipos}
              >
                <option value="">Selecione o problema...</option>
                {filteredProblemTypes.map((pt) => (
                  <option key={pt.id} value={pt.id}>
                    {pt.nome}
                  </option>
                ))}
              </select>
              {validationErrors.problemTypeId && (
                <span className="error-message" style={{ color: 'var(--danger-main)', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  {validationErrors.problemTypeId}
                </span>
              )}
            </div>

            {/* Urgência */}
            <div className="form-group">
              <label className="form-label">Nível de Urgência</label>
              <select
                className={`input-field ${validationErrors.urgencia ? 'input-error' : ''}`}
                value={urgencia}
                onChange={(e) => setUrgencia(e.target.value)}
                disabled={loadingUrgencias}
              >
                <option value="">Selecione a urgência...</option>
                {niveisUrgencia?.map((nivel) => (
                  <option key={nivel.value} value={nivel.value}>
                    {nivel.label}
                  </option>
                ))}
              </select>
              {validationErrors.urgencia && (
                <span className="error-message" style={{ color: 'var(--danger-main)', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  {validationErrors.urgencia}
                </span>
              )}
            </div>
          </div>

          {/* Descrição */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <label className="form-label">Descrição Detalhada</label>
              {/* Contador de caracteres (Tarefa 11.5) */}
              <span style={{
                fontSize: '12px',
                color: descricao.length === 0 ? 'var(--text-muted)' : isDescricaoValid ? 'var(--success-main)' : 'var(--danger-main)'
              }}>
                {descricao.length}/2000 caractere(s) {descricao.length > 0 && !isDescricaoValid && '(Mínimo 10)'}
              </span>
            </div>
            <textarea
              className={`input-field ${validationErrors.descricao ? 'input-error' : ''}`}
              style={{ minHeight: '160px', resize: 'vertical' }}
              placeholder="Forneça o máximo de detalhes possível, incluindo mensagens de erro ou passos para reproduzir o problema."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              maxLength={2000}
            ></textarea>
            {validationErrors.descricao && (
              <span className="error-message" style={{ color: 'var(--danger-main)', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                {validationErrors.descricao}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flexGrow: 1 }}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Enviando chamado...' : 'Enviar Chamado'}
            </button>
            <Link to="/chamados" className="btn btn-secondary">
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
};
