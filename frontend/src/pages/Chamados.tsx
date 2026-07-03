import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTickets } from '../api/tickets.js';
import { useAuth } from '../context/AuthContext.js';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client.js';

export const Chamados: React.FC = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sectorFilter, setSectorFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data: sectors } = useQuery({
    queryKey: ['sectors'],
    queryFn: async () => {
      const res = await apiClient.get<any[]>('/api/sectors');
      return res.data.filter((s: any) => s.ativo);
    },
  });

  // Query para buscar chamados
  const { data, isLoading, isError } = useQuery({
    queryKey: ['tickets', { search, status: statusFilter, sectorId: sectorFilter, page, limit }],
    queryFn: () => getTickets({
      search: search || undefined,
      status: (statusFilter || undefined) as any,
      sectorId: sectorFilter ? Number(sectorFilter) : undefined,
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
    setSearch(e.target.value);
    setPage(1); // Resetar para a primeira página
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setPage(1); // Resetar para a primeira página
  };

  const handleSectorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSectorFilter(e.target.value);
    setPage(1); // Resetar para a primeira página
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
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ flexGrow: 1, minWidth: '250px' }}>
          <input
            type="text"
            className="input-field"
            placeholder="Buscar por título, solicitante ou unidade..."
            value={search}
            onChange={handleSearchChange}
          />
        </div>
        <div style={{ width: '200px' }}>
          <select
            className="input-field"
            value={sectorFilter}
            onChange={handleSectorChange}
          >
            <option value="">Todos os tipos de ocorrência</option>
            {sectors?.map((sector) => (
              <option key={sector.id} value={sector.id}>
                {sector.nome}
              </option>
            ))}
          </select>
        </div>
        <div style={{ width: '200px' }}>
          <select
            className="input-field"
            value={statusFilter}
            onChange={handleStatusChange}
          >
            <option value="">Todos os status</option>
            <option value="ABERTO">Aberto</option>
            <option value="EM_ANDAMENTO">Em Andamento</option>
            <option value="AGUARDANDO">Aguardando</option>
            <option value="RESOLVIDO">Resolvido</option>
            <option value="FECHADO">Fechado</option>
            <option value="REABERTO">Reaberto</option>
          </select>
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
          {/* Tabela de chamados (Tarefa 12.2) */}
          <div className="glass-panel" style={{ padding: '0', overflowX: 'auto', marginBottom: '24px' }}>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: '24px', width: '90px' }}>Número</th>
                  <th>Título</th>
                  <th>Tipo de Ocorrência</th>
                  <th>Tipo de Problema</th>
                  {!isSolicitante && <th>Solicitante</th>}
                  <th>Status</th>
                  <th>Urgência</th>
                  <th>Abertura</th>
                  <th>Tempo em Aberto</th>
                  <th style={{ paddingRight: '24px', textAlign: 'right', width: '120px' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((ticket) => (
                  <tr key={ticket.id}>
                    <td style={{ paddingLeft: '24px', fontFamily: 'monospace', fontWeight: 'bold' }}>
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
                    <td style={{ paddingRight: '24px', textAlign: 'right' }}>
                      <Link to={`/chamados/${ticket.id}`} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '13px' }}>
                        Ver Detalhes
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginação (Tarefa 12.4) */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '32px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
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
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
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
