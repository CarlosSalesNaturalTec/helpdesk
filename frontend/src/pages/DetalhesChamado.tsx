import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTicket,
  getTicketHistory,
  assignTicket,
  reassignTicket,
  updateTicketStatus,
  closeTicket,
  adminCloseTicket,
  reopenTicket,
} from '../api/tickets.js';
import { useAuth } from '../context/AuthContext.js';
import { StarRating } from '../components/StarRating.js';
import { apiClient } from '../api/client.js';

export const DetalhesChamado: React.FC = () => {
  const { id: paramId } = useParams<{ id: string }>();
  const id = parseInt(paramId || '0', 10);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Modais
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState<'AGUARDANDO' | 'RESOLVIDO' | null>(null);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showAdminCloseModal, setShowAdminCloseModal] = useState(false);
  const [showReopenModal, setShowReopenModal] = useState(false);

  // Form states dos modais
  const [selectedTecnicoId, setSelectedTecnicoId] = useState<number | ''>('');
  const [statusMessage, setStatusMessage] = useState('');
  const [statusSolution, setStatusSolution] = useState('');
  const [satisfactionRating, setSatisfactionRating] = useState(0);
  const [closeReason, setCloseReason] = useState('');
  const [reopenReason, setReopenReason] = useState('');

  const [messageText, setMessageText] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  // Queries
  const { data: ticket, isLoading: loadingTicket, isError: ticketError } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => getTicket(id),
    enabled: id > 0,
  });

  const { data: history, isLoading: loadingHistory } = useQuery({
    queryKey: ['ticketHistory', id],
    queryFn: () => getTicketHistory(id),
    enabled: id > 0,
  });

  // Query de Técnicos da mesma unidade para o modal de reatribuição
  const { data: usuariosUnidade } = useQuery({
    queryKey: ['usuariosUnidade'],
    queryFn: async () => {
      const res = await apiClient.get<any[]>('/api/usuarios');
      return res.data;
    },
    enabled: showReassignModal && ['ADMIN', 'GESTOR_TI', 'DIRETOR'].includes(user?.role || ''),
  });

  const tecnicosDisponiveis = usuariosUnidade?.filter(u => u.role === 'TECNICO' || u.role === 'GESTOR_TI') || [];

  // Mutations
  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['ticket', id] });
    queryClient.invalidateQueries({ queryKey: ['ticketHistory', id] });
    setActionError(null);
  };

  const assignMutation = useMutation({
    mutationFn: () => assignTicket(id),
    onSuccess: invalidateQueries,
    onError: (err: any) => setActionError(err.response?.data?.error || 'Erro ao assumir chamado.'),
  });

  const reassignMutation = useMutation({
    mutationFn: (tecnicoId: number) => reassignTicket(id, { tecnicoId }),
    onSuccess: () => {
      setShowReassignModal(false);
      setSelectedTecnicoId('');
      invalidateQueries();
    },
    onError: (err: any) => setActionError(err.response?.data?.error || 'Erro ao reatribuir chamado.'),
  });

  const statusMutation = useMutation({
    mutationFn: (data: { status: any; mensagem?: string; solucao?: string }) => updateTicketStatus(id, data),
    onSuccess: () => {
      setShowStatusModal(null);
      setStatusMessage('');
      setStatusSolution('');
      invalidateQueries();
    },
    onError: (err: any) => setActionError(err.response?.data?.error || 'Erro ao alterar status.'),
  });

  const closeMutation = useMutation({
    mutationFn: (nota: number) => closeTicket(id, { nota }),
    onSuccess: () => {
      setShowCloseModal(false);
      setSatisfactionRating(0);
      invalidateQueries();
    },
    onError: (err: any) => setActionError(err.response?.data?.error || 'Erro ao fechar chamado.'),
  });

  const adminCloseMutation = useMutation({
    mutationFn: (motivo: string) => adminCloseTicket(id, { motivo }),
    onSuccess: () => {
      setShowAdminCloseModal(false);
      setCloseReason('');
      invalidateQueries();
    },
    onError: (err: any) => setActionError(err.response?.data?.error || 'Erro no fechamento administrativo.'),
  });

  const reopenMutation = useMutation({
    mutationFn: (motivo: string) => reopenTicket(id, { motivo }),
    onSuccess: () => {
      setShowReopenModal(false);
      setReopenReason('');
      invalidateQueries();
    },
    onError: (err: any) => setActionError(err.response?.data?.error || 'Erro ao reabrir chamado.'),
  });

  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => apiClient.post(`/api/tickets/${id}/messages`, { content }),
    onSuccess: () => {
      setMessageText('');
      invalidateQueries();
    },
    onError: (err: any) => setActionError(err.response?.data?.error || 'Erro ao enviar mensagem.'),
  });

  if (loadingTicket) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Carregando detalhes do chamado...</p>
      </div>
    );
  }

  if (ticketError || !ticket) {
    return (
      <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
        <div className="alert alert-danger">Chamado não encontrado ou acesso negado.</div>
        <Link to="/chamados" className="btn btn-secondary">
          Voltar para Lista
        </Link>
      </div>
    );
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'ABERTO': return 'badge-aberto';
      case 'EM_ANDAMENTO': return 'badge-andamento';
      case 'AGUARDANDO': return 'badge-aguardando';
      case 'RESOLVIDO': return 'badge-resolvido';
      case 'FECHADO': return 'badge-fechado';
      case 'REABERTO': return 'badge-reaberto';
      default: return 'badge-secondary';
    }
  };

  const getUrgenciaBadgeClass = (urgencia: string) => {
    switch (urgencia) {
      case 'BAIXA': return 'badge-urgencia-baixa';
      case 'MEDIA': return 'badge-urgencia-media';
      case 'ALTA': return 'badge-urgencia-alta';
      case 'CRITICA': return 'badge-urgencia-critica';
      default: return 'badge-secondary';
    }
  };

  const formatData = (dataStr: string) => {
    return new Date(dataStr).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Regras de Visualização das Ações
  const isSolicitante = user?.role === 'SOLICITANTE';
  const isStaff = ['TECNICO', 'GESTOR_TI', 'DIRETOR'].includes(user?.role || '');
  const isAdmin = user?.role === 'ADMIN';
  const belongsToSameUnit = ticket.unidadeId === user?.unidadeId;

  const canAssign = isStaff && belongsToSameUnit && (ticket.status === 'ABERTO' || ticket.status === 'REABERTO');
  const canReassign = (isAdmin || (['GESTOR_TI', 'DIRETOR'].includes(user?.role || '') && belongsToSameUnit)) && ticket.status !== 'FECHADO';
  const canChangeStatus = isStaff && belongsToSameUnit && ticket.tecnicoId === user?.id && ticket.status !== 'FECHADO';
  const canClose = isSolicitante && ticket.solicitanteId === user?.id && ticket.status === 'RESOLVIDO';
  const canAdminClose = (isAdmin || (['GESTOR_TI', 'DIRETOR'].includes(user?.role || '') && belongsToSameUnit)) && ticket.status === 'RESOLVIDO';
  const canReopen = ticket.status === 'FECHADO' && (isSolicitante || (isStaff && belongsToSameUnit) || isAdmin);

  const renderHistoryContent = (item: any) => {
    const content = item.content as any;
    switch (item.type) {
      case 'ABERTURA':
        return (
          <div>
            Abertura do chamado registrada com urgência <strong>{content.urgencia}</strong> e tipo <strong>{ticket.problemType?.nome}</strong> no tipo de ocorrência <strong>{ticket.sector?.nome}</strong>.
            <div style={{ marginTop: '8px', padding: '12px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '6px', fontSize: '13px', borderLeft: '3px solid var(--primary)' }}>
              {content.descricao}
            </div>
          </div>
        );
      case 'ATRIBUICAO':
        return (
          <div>
            Chamado atribuído ao técnico <strong>{content.tecnicoNome}</strong>.
          </div>
        );
      case 'REATRIBUICAO':
        return (
          <div>
            Chamado reatribuído para o técnico <strong>{content.tecnicoNome}</strong> por <strong>{content.atribuidoPor}</strong>.
          </div>
        );
      case 'MUDANCA_STATUS':
        return (
          <div>
            Status alterado de <span className={`status-badge ${getStatusBadgeClass(content.from)}`} style={{ padding: '2px 8px', fontSize: '10px' }}>{content.from}</span> para <span className={`status-badge ${getStatusBadgeClass(content.to)}`} style={{ padding: '2px 8px', fontSize: '10px' }}>{content.to}</span>.
            {content.mensagem && (
              <div style={{ marginTop: '8px', padding: '8px 12px', background: 'rgba(168, 85, 247, 0.05)', borderRadius: '6px', fontSize: '13px', borderLeft: '3px solid #c084fc', color: '#e9d5ff' }}>
                <strong>Motivo do Aguardo:</strong> {content.mensagem}
              </div>
            )}
            {content.solucao && (
              <div style={{ marginTop: '8px', padding: '12px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '6px', fontSize: '13px', borderLeft: '3px solid var(--success)', color: '#a7f3d0' }}>
                <strong>Solução Aplicada:</strong> {content.solucao}
              </div>
            )}
          </div>
        );
      case 'FECHAMENTO':
        return (
          <div>
            Chamado finalizado.
            {content.adminClose ? (
              <div style={{ marginTop: '8px', padding: '8px 12px', background: 'rgba(107, 114, 128, 0.1)', borderRadius: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
                <strong>Fechamento Administrativo por {content.fechadoPor}:</strong> {content.motivo}
              </div>
            ) : (
              <div style={{ marginTop: '8px', padding: '8px 12px', background: 'rgba(245, 158, 11, 0.05)', borderRadius: '6px', fontSize: '13px', borderLeft: '3px solid var(--warning)' }}>
                <strong>Avaliação do Solicitante ({content.avaliadoPor}):</strong>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: '4px 0', color: 'var(--warning)' }}>
                  {Array.from({ length: content.nota || 0 }).map((_, i) => <span key={i}>★</span>)}
                </div>
              </div>
            )}
          </div>
        );
      case 'REABERTURA':
        return (
          <div>
            Chamado reaberto por <strong>{content.reabertoPor}</strong>.
            <div style={{ marginTop: '8px', padding: '8px 12px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '6px', fontSize: '13px', borderLeft: '3px solid var(--danger)', color: '#fca5a5' }}>
              <strong>Motivo da Reabertura:</strong> {content.motivo}
            </div>
          </div>
        );
      case 'MENSAGEM':
        const isAuthorSolicitante = item.author.role === 'SOLICITANTE';
        return (
          <div style={{
            padding: '12px 16px',
            borderRadius: '12px',
            borderTopLeftRadius: isAuthorSolicitante ? '0px' : '12px',
            borderTopRightRadius: isAuthorSolicitante ? '12px' : '0px',
            background: isAuthorSolicitante ? 'rgba(168, 85, 247, 0.1)' : 'rgba(59, 130, 246, 0.1)',
            border: isAuthorSolicitante ? '1px solid rgba(168, 85, 247, 0.2)' : '1px solid rgba(59, 130, 246, 0.2)',
            marginTop: '4px',
            color: 'var(--text-main)',
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap'
          }}>
            {content.mensagem}
          </div>
        );
      default:
        return <div>Evento de histórico registrado.</div>;
    }
  };

  const getMarkerIcon = (type: string) => {
    switch (type) {
      case 'ABERTURA': return '📥';
      case 'ATRIBUICAO':
      case 'REATRIBUICAO': return '👤';
      case 'MUDANCA_STATUS': return '⚙';
      case 'FECHAMENTO': return '✓';
      case 'REABERTURA': return '♻';
      case 'MENSAGEM': return '💬';
      default: return '•';
    }
  };

  return (
    <main className="main-content" style={{ maxWidth: '1200px', margin: '40px auto', width: '100%', padding: '0 20px' }}>
      {/* Voltar */}
      <div style={{ marginBottom: '24px' }}>
        <Link to="/chamados" className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '14px' }}>
          ← Voltar para Lista
        </Link>
      </div>

      {actionError && (
        <div className="alert alert-danger" style={{ marginBottom: '24px' }}>
          {actionError}
        </div>
      )}

      {/* Grid Principal */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px', alignItems: 'start' }}>
        
        {/* Esquerda: Informações e Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Card Detalhes */}
          <div className="glass-panel" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '14px', color: 'var(--primary-main)', fontWeight: 'bold', fontFamily: 'monospace' }}>
                  CHAMADO #{ticket.numero}
                </span>
                <h1 style={{ fontSize: '28px', marginTop: '4px', marginBottom: '12px' }}>{ticket.titulo}</h1>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <span className={`status-badge ${getStatusBadgeClass(ticket.status)}`}>
                    {ticket.status.replace('_', ' ')}
                  </span>
                  <span className={`urgencia-badge ${getUrgenciaBadgeClass(ticket.urgencia)}`}>
                    Urgência {ticket.urgencia}
                  </span>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center' }}>
                    Tipo de Ocorrência: {ticket.sector?.nome} | Tipo: {ticket.problemType?.nome}
                  </span>
                </div>
              </div>
            </div>

            {/* Metadados */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '24px',
              padding: '24px 0',
              borderTop: '1px solid var(--border)',
              borderBottom: '1px solid var(--border)',
              fontSize: '14px'
            }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Solicitante</span>
                <strong style={{ color: 'var(--text-main)' }}>{ticket.solicitante.nome}</strong>
                <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{ticket.solicitante.email}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Técnico Responsável</span>
                {ticket.tecnico ? (
                  <>
                    <strong style={{ color: 'var(--text-main)' }}>{ticket.tecnico.nome}</strong>
                    <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{ticket.tecnico.email}</span>
                  </>
                ) : (
                  <em style={{ color: 'var(--text-muted)' }}>Não atribuído</em>
                )}
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Unidade</span>
                <strong style={{ color: 'var(--text-main)' }}>{ticket.unidade.nome}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Tipo de Ocorrência</span>
                <strong style={{ color: 'var(--text-main)' }}>{ticket.sector?.nome || '-'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Datas</span>
                <span style={{ display: 'block', fontSize: '13px' }}>Abertura: <strong>{formatData(ticket.criadoEm)}</strong></span>
                <span style={{ display: 'block', fontSize: '13px', marginTop: '4px' }}>Atualizado: <strong>{formatData(ticket.atualizadoEm)}</strong></span>
              </div>
            </div>

            {/* Descrição Principal */}
            <div style={{ marginTop: '24px' }}>
              <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Descrição</span>
              <p style={{
                color: 'var(--text-main)',
                fontSize: '15px',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap',
                padding: '16px',
                background: 'rgba(255, 255, 255, 0.01)',
                border: '1px solid var(--border)',
                borderRadius: '8px'
              }}>
                {ticket.descricao}
              </p>
            </div>
          </div>

          {/* Timeline (Tarefa 13.2) */}
          <div className="glass-panel" style={{ padding: '32px' }}>
            <h3 style={{ fontSize: '20px', marginBottom: '16px' }}>Linha do Tempo do Chamado</h3>
            
            {loadingHistory ? (
              <p style={{ color: 'var(--text-muted)' }}>Carregando histórico...</p>
            ) : !history || history.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>Nenhum evento registrado.</p>
            ) : (
              <div className="timeline">
                {history.map((item) => (
                  <div key={item.id} className="timeline-item">
                    <span className="timeline-marker">
                      {getMarkerIcon(item.type)}
                    </span>
                    <div className="timeline-content">
                      <div className="timeline-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '8px' }}>
                        <span>
                          <strong>{item.author.nome}</strong> ({item.author.role.replace('_', ' ')})
                        </span>
                        <span className="timeline-time">{formatData(item.criadoEm)}</span>
                      </div>
                      <div style={{ fontSize: '14px', color: 'var(--text-main)', marginTop: '8px', lineHeight: '1.5' }}>
                        {renderHistoryContent(item)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Envio de Mensagens */}
          <div className="glass-panel" style={{ padding: '32px', marginTop: '24px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Nova Mensagem</h3>
            
            {ticket.status === 'FECHADO' ? (
              <div className="alert alert-secondary" style={{ margin: 0, fontSize: '14px' }}>
                Este chamado está fechado. Para continuar, utilize a opção "Reabrir Chamado".
              </div>
            ) : (
              <form onSubmit={(e) => {
                e.preventDefault();
                if (messageText.trim().length > 0 && messageText.length <= 2000) {
                  sendMessageMutation.mutate(messageText);
                }
              }}>
                <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <textarea
                    rows={4}
                    placeholder="Digite sua mensagem para o técnico/solicitante..."
                    className="form-control"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      padding: '12px',
                      color: 'var(--text-main)',
                      resize: 'vertical',
                      fontSize: '14px'
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                    <span style={{ fontSize: '12px', color: messageText.length > 2000 ? 'var(--danger)' : 'var(--text-muted)' }}>
                      {messageText.length}/2000 caracteres
                    </span>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={messageText.trim().length === 0 || messageText.length > 2000 || sendMessageMutation.isPending}
                      style={{ padding: '8px 24px', fontSize: '14px' }}
                    >
                      {sendMessageMutation.isPending ? 'Enviando...' : 'Enviar Mensagem'}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>

        </div>

        {/* Direita: Ações Disponíveis */}
        <div className="glass-panel" style={{ padding: '24px', position: 'sticky', top: '94px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
            Ações do Chamado
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Se nenhuma ação for possível */}
            {!canAssign && !canReassign && !canChangeStatus && !canClose && !canAdminClose && !canReopen && (
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>
                Nenhuma ação disponível no momento para o seu cargo e o status atual do chamado.
              </p>
            )}

            {/* 1. Assumir Chamado (Técnico) */}
            {canAssign && (
              <button
                className="btn btn-primary"
                onClick={() => assignMutation.mutate()}
                disabled={assignMutation.isPending}
                style={{ width: '100%' }}
              >
                {assignMutation.isPending ? 'Assumindo chamado...' : '🙋 Assumir Chamado'}
              </button>
            )}

            {/* 2. Alterar Status (Técnico Atribuído) */}
            {canChangeStatus && (
              <>
                {ticket.status === 'AGUARDANDO' && (
                  <button
                    className="btn btn-primary"
                    onClick={() => statusMutation.mutate({ status: 'EM_ANDAMENTO' })}
                    disabled={statusMutation.isPending}
                    style={{ width: '100%' }}
                  >
                    ▶ Retomar Atendimento (Em Andamento)
                  </button>
                )}

                {ticket.status === 'EM_ANDAMENTO' && (
                  <>
                    <button
                      className="btn btn-secondary"
                      onClick={() => setShowStatusModal('AGUARDANDO')}
                      style={{ width: '100%', borderColor: 'var(--warning-glow)' }}
                    >
                      ⏸ Colocar em Aguardando
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={() => setShowStatusModal('RESOLVIDO')}
                      style={{ width: '100%', backgroundColor: 'var(--success)', boxShadow: '0 4px 14px var(--success-glow)' }}
                    >
                      ✓ Marcar como Resolvido
                    </button>
                  </>
                )}
              </>
            )}

            {/* 3. Reatribuir (Gestor / Diretor / Admin) */}
            {canReassign && (
              <button
                className="btn btn-secondary"
                onClick={() => setShowReassignModal(true)}
                style={{ width: '100%' }}
              >
                🔄 Reatribuir Chamado
              </button>
            )}

            {/* 4. Fechar Chamado (Solicitante) */}
            {canClose && (
              <button
                className="btn btn-primary"
                onClick={() => setShowCloseModal(true)}
                style={{ width: '100%', backgroundColor: 'var(--success)', boxShadow: '0 4px 14px var(--success-glow)' }}
              >
                ✓ Finalizar e Avaliar
              </button>
            )}

            {/* 5. Fechamento Administrativo (Gestor / Diretor / Admin) */}
            {canAdminClose && (
              <button
                className="btn btn-secondary"
                onClick={() => setShowAdminCloseModal(true)}
                style={{ width: '100%' }}
              >
                🔒 Fechamento Administrativo
              </button>
            )}

            {/* 6. Reabrir Chamado (Todos com acesso, se fechado) */}
            {canReopen && (
              <button
                className="btn btn-danger"
                onClick={() => setShowReopenModal(true)}
                style={{ width: '100%' }}
              >
                ♻ Reabrir Chamado
              </button>
            )}
          </div>
        </div>

      </div>

      {/* ================= MODAIS ================= */}

      {/* Modal Reatribuir */}
      {showReassignModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <h3 style={{ fontSize: '20px', marginBottom: '16px' }}>Reatribuir Chamado</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>
              Selecione um técnico da unidade para assumir o chamado.
            </p>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (selectedTecnicoId) reassignMutation.mutate(Number(selectedTecnicoId));
            }}>
              <div className="form-group">
                <label className="form-label">Técnico Destino</label>
                <select
                  className="input-field"
                  value={selectedTecnicoId}
                  onChange={(e) => setSelectedTecnicoId(e.target.value !== '' ? Number(e.target.value) : '')}
                  required
                >
                  <option value="">Selecione um técnico...</option>
                  {tecnicosDisponiveis.map((tec) => (
                    <option key={tec.id} value={tec.id}>
                      {tec.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowReassignModal(false);
                  setSelectedTecnicoId('');
                }}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={!selectedTecnicoId || reassignMutation.isPending}>
                  {reassignMutation.isPending ? 'Reatribuindo...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Status (Aguardando / Resolvido) */}
      {showStatusModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <h3 style={{ fontSize: '20px', marginBottom: '16px' }}>
              {showStatusModal === 'AGUARDANDO' ? 'Colocar em Aguardando' : 'Resolver Chamado'}
            </h3>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              if (showStatusModal === 'AGUARDANDO') {
                statusMutation.mutate({ status: 'AGUARDANDO', mensagem: statusMessage });
              } else {
                statusMutation.mutate({ status: 'RESOLVIDO', solucao: statusSolution });
              }
            }}>
              {showStatusModal === 'AGUARDANDO' ? (
                <div className="form-group">
                  <label className="form-label">Motivo do Aguardo</label>
                  <textarea
                    className="input-field"
                    style={{ minHeight: '100px', resize: 'vertical' }}
                    placeholder="Ex: Aguardando retorno da peça de reposição pelo fornecedor."
                    value={statusMessage}
                    onChange={(e) => setStatusMessage(e.target.value)}
                    required
                  ></textarea>
                </div>
              ) : (
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <label className="form-label">Solução Aplicada</label>
                    <span style={{ fontSize: '11px', color: statusSolution.trim().length >= 10 ? 'var(--success-main)' : 'var(--text-muted)' }}>
                      {statusSolution.trim().length}/10 chars min
                    </span>
                  </div>
                  <textarea
                    className="input-field"
                    style={{ minHeight: '120px', resize: 'vertical' }}
                    placeholder="Descreva o que foi feito para solucionar o problema."
                    value={statusSolution}
                    onChange={(e) => setStatusSolution(e.target.value)}
                    required
                  ></textarea>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowStatusModal(null);
                  setStatusMessage('');
                  setStatusSolution('');
                }}>
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={
                    statusMutation.isPending ||
                    (showStatusModal === 'AGUARDANDO' && statusMessage.trim() === '') ||
                    (showStatusModal === 'RESOLVIDO' && statusSolution.trim().length < 10)
                  }
                >
                  {statusMutation.isPending ? 'Processando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Fechar com Avaliação (Satisfação) (Tarefa 14) */}
      {showCloseModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '22px', marginBottom: '12px' }}>Finalizar Chamado</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
              Por favor, avalie a qualidade do atendimento prestado pelo técnico para finalizar o chamado.
            </p>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (satisfactionRating > 0) closeMutation.mutate(satisfactionRating);
            }}>
              {/* Star Rating interativo (Tarefa 14.1 e 14.2) */}
              <StarRating rating={satisfactionRating} onChange={setSatisfactionRating} />
              
              <div style={{ margin: '16px 0', fontSize: '14px', fontWeight: 500 }}>
                {satisfactionRating === 0 ? (
                  <span style={{ color: 'var(--danger-main)' }}>Selecione uma avaliação</span>
                ) : (
                  <span style={{ color: 'var(--success-main)' }}>Avaliação selecionada: {satisfactionRating} de 5</span>
                )}
              </div>

              {/* Botões (com bloqueio na confirmação - Tarefa 14.3) */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '32px', justifyContent: 'center' }}>
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowCloseModal(false);
                  setSatisfactionRating(0);
                }}>
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ backgroundColor: 'var(--success)', border: 'none' }}
                  disabled={satisfactionRating === 0 || closeMutation.isPending}
                >
                  {closeMutation.isPending ? 'Finalizando...' : 'Confirmar Fechamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Fechamento Administrativo */}
      {showAdminCloseModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <h3 style={{ fontSize: '20px', marginBottom: '16px' }}>Fechamento Administrativo</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>
              Esta ação finalizará o chamado sem solicitar avaliação do solicitante.
            </p>
            <form onSubmit={(e) => {
              e.preventDefault();
              adminCloseMutation.mutate(closeReason);
            }}>
              <div className="form-group">
                <label className="form-label">Motivo do Fechamento Administrativo</label>
                <textarea
                  className="input-field"
                  style={{ minHeight: '100px', resize: 'vertical' }}
                  placeholder="Ex: Fechado devido à inatividade do solicitante por mais de 5 dias."
                  value={closeReason}
                  onChange={(e) => setCloseReason(e.target.value)}
                  required
                ></textarea>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowAdminCloseModal(false);
                  setCloseReason('');
                }}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={closeReason.trim() === '' || adminCloseMutation.isPending}>
                  {adminCloseMutation.isPending ? 'Finalizando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Reabrir */}
      {showReopenModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <h3 style={{ fontSize: '20px', marginBottom: '16px' }}>Reabrir Chamado</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>
              O chamado voltará para o status Reaberto e exigirá atendimento técnico.
            </p>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (reopenReason.trim().length >= 10) reopenMutation.mutate(reopenReason);
            }}>
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <label className="form-label">Motivo da Reabertura</label>
                  <span style={{ fontSize: '11px', color: reopenReason.trim().length >= 10 ? 'var(--success-main)' : 'var(--text-muted)' }}>
                    {reopenReason.trim().length}/10 chars min
                  </span>
                </div>
                <textarea
                  className="input-field"
                  style={{ minHeight: '100px', resize: 'vertical' }}
                  placeholder="Explique detalhadamente o motivo da reabertura do chamado (ex: O computador voltou a apresentar tela azul ao ligar)."
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  required
                ></textarea>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowReopenModal(false);
                  setReopenReason('');
                }}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: 'var(--danger)' }} disabled={reopenReason.trim().length < 10 || reopenMutation.isPending}>
                  {reopenMutation.isPending ? 'Reabrindo...' : 'Reabrir'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  );
};
