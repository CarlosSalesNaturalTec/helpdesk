import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { TicketStatusEnum, NivelUrgenciaEnum } from '@helpdesk/shared';
import type { TicketStatusType, NivelUrgenciaType } from '@helpdesk/shared';
import { getTickets } from '../api/tickets.js';
import { useAuth } from '../context/AuthContext.js';
import { Link, useSearchParams } from 'react-router-dom';
import { apiClient } from '../api/client.js';
import { TicketCard } from '../components/TicketCard.js';
import { UnitSelector } from '../components/UnitSelector.js';

const STATUS_LABELS: Record<TicketStatusType, string> = {
  ABERTO: 'Aberto',
  EM_ANDAMENTO: 'Em Andamento',
  AGUARDANDO: 'Aguardando',
  RESOLVIDO: 'Resolvido',
  FECHADO: 'Fechado',
  REABERTO: 'Reaberto',
};

const URGENCIA_LABELS: Record<NivelUrgenciaType, string> = {
  BAIXA: 'Baixa',
  MEDIA: 'Média',
  ALTA: 'Alta',
  CRITICA: 'Crítica',
};

const parsePositiveInt = (value: string | null) => {
  const n = value ? parseInt(value, 10) : NaN;
  return Number.isInteger(n) && n > 0 ? n : undefined;
};

export const Chamados: React.FC = () => {
  const { user } = useAuth();
  // A URL é a fonte de verdade dos filtros: link direto (cards do Dashboard), recarga e botão voltar.
  const [searchParams, setSearchParams] = useSearchParams();
  const limit = 20;

  const search = searchParams.get('search') ?? '';
  const statusFilter = (searchParams.get('status') ?? '')
    .split(',')
    .filter((s): s is TicketStatusType => (TicketStatusEnum.options as string[]).includes(s));
  const urgenciaParam = searchParams.get('urgencia');
  const urgenciaFilter = (NivelUrgenciaEnum.options as string[]).includes(urgenciaParam ?? '')
    ? (urgenciaParam as NivelUrgenciaType)
    : undefined;
  const sectorFilter = parsePositiveInt(searchParams.get('sectorId'));
  const unidadeFilter = parsePositiveInt(searchParams.get('unidadeId'));
  const page = parsePositiveInt(searchParams.get('page')) ?? 1;

  const isAdmin = user?.role === 'ADMIN';

  // Toda mudança de filtro volta para a página 1. A busca textual substitui a entrada do
  // histórico (uma por tecla seria inútil para o botão voltar); os demais filtros empilham.
  const updateFilters = (changes: Record<string, string | undefined>, options?: { replace?: boolean }) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      for (const [key, value] of Object.entries(changes)) {
        if (value) next.set(key, value);
        else next.delete(key);
      }
      if (!('page' in changes)) next.delete('page');
      return next;
    }, options);
  };

  const setPage = (p: number) => updateFilters({ page: p > 1 ? String(p) : undefined });

  const { data: sectors } = useQuery({
    queryKey: ['sectors', 'ativos'],
    queryFn: async () => {
      const res = await apiClient.get<any[]>('/api/sectors');
      return res.data.filter((s: any) => s.ativo);
    },
  });

  // Query para buscar chamados — a queryKey carrega todos os filtros, para não servir cache de outro recorte
  const unidadeId = isAdmin ? unidadeFilter : undefined;
  const { data, isLoading, isError } = useQuery({
    queryKey: ['tickets', { search, status: statusFilter, urgencia: urgenciaFilter, sectorId: sectorFilter, unidadeId, page, limit }],
    queryFn: () => getTickets({
      search: search || undefined,
      status: statusFilter.length ? statusFilter : undefined,
      urgencia: urgenciaFilter,
      sectorId: sectorFilter,
      unidadeId,
      page,
      limit,
    }),
  });

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

  const getDiasEmAberto = (criadoEm: string, status: string) => {
    if (status === 'FECHADO') return 'Finalizado';
    const dataCriacao = new Date(criadoEm);
    const hoje = new Date();
    const diffTime = Math.abs(hoje.getTime() - dataCriacao.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoje';
    return `${diffDays} dia(s)`;
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

  const totalPages = data ? Math.ceil(data.total / limit) : 1;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFilters({ search: e.target.value || undefined }, { replace: true });
  };

  const toggleStatus = (status: TicketStatusType) => {
    const selected = statusFilter.includes(status)
      ? statusFilter.filter((s) => s !== status)
      : [...statusFilter, status];
    // Mantém a ordem do enum, para que a mesma seleção produza sempre o mesmo endereço
    const ordered = TicketStatusEnum.options.filter((s) => selected.includes(s));
    updateFilters({ status: ordered.length ? ordered.join(',') : undefined });
  };

  const handleUrgenciaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateFilters({ urgencia: e.target.value || undefined });
  };

  const handleSectorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateFilters({ sectorId: e.target.value || undefined });
  };

  const handleUnidadeChange = (id: number | null) => {
    updateFilters({ unidadeId: id ? String(id) : undefined });
  };

  const isSolicitante = user?.role === 'SOLICITANTE';

  return (
    <main className="main-content" style={{ maxWidth: '1200px', margin: '40px auto', width: '100%', padding: '0 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>
            {isSolicitante ? 'Meus Chamados' : 'Gestão de Chamados'}
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            {isSolicitante 
              ? 'Acompanhe o andamento dos chamados abertos por você.' 
              : `Chamados registrados na unidade ${user?.unidadeNome}.`}
          </p>
        </div>
        {isSolicitante && (
          <Link to="/abrir-chamado" className="btn btn-primary">
            + Novo Chamado
          </Link>
        )}
      </div>

      {/* Painel de Filtros (Tarefa 12.1) */}
      <div className="glass-panel filter-bar" style={{ padding: '20px', marginBottom: '24px' }}>
        <div className="filter-field-grow">
          <input
            type="text"
            className="input-field"
            placeholder="Buscar por título, solicitante ou unidade..."
            value={search}
            onChange={handleSearchChange}
          />
        </div>
        <div className="filter-field">
          <select
            className="input-field"
            value={sectorFilter ?? ''}
            onChange={handleSectorChange}
            aria-label="Tipo de Ocorrência"
          >
            <option value="">Todos os tipos de ocorrência</option>
            {sectors?.map((sector) => (
              <option key={sector.id} value={sector.id}>
                {sector.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-field">
          <select
            className="input-field"
            value={urgenciaFilter ?? ''}
            onChange={handleUrgenciaChange}
            aria-label="Urgência"
          >
            <option value="">Todas as urgências</option>
            {NivelUrgenciaEnum.options.map((u) => (
              <option key={u} value={u}>
                {URGENCIA_LABELS[u]}
              </option>
            ))}
          </select>
        </div>
        {isAdmin && (
          <UnitSelector selectedUnitId={unidadeFilter ?? null} onChange={handleUnidadeChange} />
        )}
        <div className="status-filter" role="group" aria-label="Filtrar por status">
          <span className="status-filter-label">Status:</span>
          {TicketStatusEnum.options.map((status) => (
            <button
              key={status}
              type="button"
              className="status-chip"
              aria-pressed={statusFilter.includes(status)}
              onClick={() => toggleStatus(status)}
            >
              {STATUS_LABELS[status]}
            </button>
          ))}
          {statusFilter.length > 0 && (
            <button type="button" className="status-chip" onClick={() => updateFilters({ status: undefined })}>
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Indicador de chamados encontrados (Tarefa 12.3) */}
      {!isLoading && data && (
        <div style={{ marginBottom: '16px', color: 'var(--text-muted)', fontSize: '14px', fontWeight: 500 }}>
          {data.total} chamado(s) encontrado(s)
        </div>
      )}

      {isLoading ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>Carregando chamados...</p>
        </div>
      ) : isError ? (
        <div className="alert alert-danger">
          Erro ao carregar a lista de chamados. Por favor, tente novamente mais tarde.
        </div>
      ) : !data || data.data.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>Nenhum chamado encontrado.</p>
          {isSolicitante && (
            <Link to="/abrir-chamado" className="btn btn-primary">
              Abrir Primeiro Chamado
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Tabela de chamados (Tarefa 12.2) — oculta abaixo de 640px */}
          <div className="glass-panel data-table-container ticket-table-wrapper" style={{ padding: '0', marginBottom: '24px' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th className="col-numero">Número</th>
                  <th>Título</th>
                  <th>Tipo de Ocorrência</th>
                  <th>Tipo de Problema</th>
                  {!isSolicitante && <th>Solicitante</th>}
                  <th>Status</th>
                  <th>Urgência</th>
                  <th className="col-anexo">Anexo</th>
                  <th>Abertura</th>
                  <th>Tempo em Aberto</th>
                  <th className="col-acoes">Ações</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((ticket) => (
                  <tr key={ticket.id}>
                    <td className="col-numero" style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                      #{ticket.numero}
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, color: 'var(--text-main)' }}>{ticket.titulo}</div>
                    </td>
                    <td>
                      <div style={{ color: 'var(--text-main)', fontSize: '14px' }}>{ticket.sector?.nome || '-'}</div>
                    </td>
                    <td>
                      <div style={{ color: 'var(--text-main)', fontSize: '14px' }}>{ticket.problemType?.nome || ticket.tipoProblema?.replace('_', ' ') || '-'}</div>
                    </td>
                    {!isSolicitante && (
                      <td>
                        <div style={{ fontWeight: 500 }}>{ticket.solicitante.nome}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{ticket.unidade.nome}</div>
                      </td>
                    )}
                    <td>
                      <span className={`status-badge ${getStatusBadgeClass(ticket.status)}`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <span className={`urgencia-badge ${getUrgenciaBadgeClass(ticket.urgencia)}`}>
                        {ticket.urgencia}
                      </span>
                    </td>
                    {/* Coluna Anexo */}
                    <td className="col-anexo">
                      {ticket.anexoUrl ? (
                        <a
                          href={ticket.anexoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={ticket.anexoNome || 'Ver anexo'}
                          style={{ fontSize: '20px', textDecoration: 'none', cursor: 'pointer' }}
                        >
                          {ticket.anexoTipo?.startsWith('image/') ? '🖼️' : '📄'}
                        </a>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>—</span>
                      )}
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      {formatData(ticket.criadoEm)}
                    </td>
                    <td>
                      <span style={{
                        fontSize: '13px',
                        fontWeight: 500,
                        color: ticket.status === 'FECHADO'
                          ? 'var(--text-muted)'
                          : ticket.urgencia === 'CRITICA' || ticket.urgencia === 'ALTA'
                            ? 'var(--danger-main)'
                            : 'var(--text-main)'
                      }}>
                        {getDiasEmAberto(ticket.criadoEm, ticket.status)}
                      </span>
                    </td>
                    <td className="col-acoes">
                      <Link to={`/chamados/${ticket.id}`} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '13px' }}>
                        Ver Detalhes
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cartões de chamado (Tarefa 3.3) — exibidos no lugar da tabela abaixo de 640px */}
          <div className="ticket-cards" style={{ marginBottom: '24px' }}>
            {data.data.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} isSolicitante={isSolicitante} />
            ))}
          </div>

          {/* Paginação (Tarefa 12.4) */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '32px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setPage(Math.max(page - 1, 1))}
                disabled={page === 1}
                style={{ padding: '8px 16px' }}
              >
                Anterior
              </button>
              <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                Página <strong>{page}</strong> de {totalPages}
              </span>
              <button
                className="btn btn-secondary"
                onClick={() => setPage(Math.min(page + 1, totalPages))}
                disabled={page === totalPages}
                style={{ padding: '8px 16px' }}
              >
                Próxima
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
};
