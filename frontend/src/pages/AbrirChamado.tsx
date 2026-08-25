import React, { useState, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createTicket, getNiveisUrgencia } from '../api/tickets.js';
import { apiClient } from '../api/client.js';
import { createTicketSchema } from '@helpdesk/shared';
import { useAuth } from '../context/AuthContext.js';
import { Link } from 'react-router-dom';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const ALLOWED_EXTENSIONS = '.jpg,.jpeg,.png,.pdf,.docx';
const ALLOWED_TYPES_LABEL = 'JPG, PNG, PDF ou DOCX';

export const AbrirChamado: React.FC = () => {
  const { user } = useAuth();
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [sectorId, setSectorId] = useState<number | ''>('');
  const [problemTypeId, setProblemTypeId] = useState<number | ''>('');
  const [urgencia, setUrgencia] = useState('');

  // Estado do anexo
  const [anexoFile, setAnexoFile] = useState<File | null>(null);
  const [anexoError, setAnexoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setAnexoFile(null);
      setValidationErrors({});
      setSubmitError(null);
      setAnexoError(null);
    },
    onError: (error: any) => {
      const errMsg = error.response?.data?.error || 'Ocorreu um erro ao enviar o chamado.';
      setSubmitError(errMsg);
    },
  });

  /**
   * Valida o arquivo selecionado (tipo e tamanho) com feedback imediato.
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setAnexoError(null);
    if (!file) {
      setAnexoFile(null);
      return;
    }
    // Validar tipo
    if (!ALLOWED_TYPES.includes(file.type)) {
      setAnexoError(`Tipo de arquivo não permitido. Tipos aceitos: ${ALLOWED_TYPES_LABEL}`);
      setAnexoFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    // Validar tamanho
    if (file.size > MAX_FILE_SIZE) {
      setAnexoError('O arquivo excede o tamanho máximo de 5 MB');
      setAnexoFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setAnexoFile(file);
  };

  const handleRemoveFile = () => {
    setAnexoFile(null);
    setAnexoError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type === 'application/pdf') return '📄';
    return '📝';
  };

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

    // Validação Zod no frontend
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

    createMutation.mutate({
      ...formData,
      anexo: anexoFile,
    });
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
            backgroundColor: 'var(--bg-surface-subtle)',
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
        {/* Dados do Solicitante (Read-only) */}
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

          <div className="grid-1-1">
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

          {/* Anexo (Opcional) */}
          <div className="form-group" style={{ marginTop: '8px' }}>
            <label className="form-label">
              Anexo <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(opcional — {ALLOWED_TYPES_LABEL}, máx. 5 MB)</span>
            </label>

            {!anexoFile ? (
              <div
                id="anexo-dropzone"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${anexoError ? 'var(--danger-main)' : 'var(--border-color)'}`,
                  borderRadius: '8px',
                  padding: '24px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: 'var(--bg-surface-subtle)',
                  transition: 'border-color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--primary-main)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = anexoError ? 'var(--danger-main)' : 'var(--border-color)')}
              >
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📎</div>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
                  Clique para selecionar um arquivo
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px' }}>
                  {ALLOWED_TYPES_LABEL} — até 5 MB
                </p>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                background: 'var(--primary-tint)',
              }}>
                <span style={{ fontSize: '24px' }}>{getFileIcon(anexoFile.type)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {anexoFile.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {formatFileSize(anexoFile.size)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--danger-main)',
                    fontSize: '18px',
                    padding: '4px',
                    lineHeight: 1,
                  }}
                  title="Remover arquivo"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Input de arquivo oculto */}
            <input
              ref={fileInputRef}
              type="file"
              id="anexo-input"
              accept={ALLOWED_EXTENSIONS}
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />

            {/* Feedback de erro de validação de arquivo */}
            {anexoError && (
              <span style={{ color: 'var(--danger-main)', fontSize: '12px', marginTop: '6px', display: 'block' }}>
                ⚠ {anexoError}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flexGrow: 1 }}
              disabled={createMutation.isPending || !!anexoError}
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
