import React from 'react';
import { Link } from 'react-router-dom';
import type { Ticket } from '../api/tickets.js';

interface TicketCardProps {
  ticket: Ticket;
  isSolicitante: boolean;
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

export const TicketCard: React.FC<TicketCardProps> = ({ ticket, isSolicitante }) => {
  return (
    <div className="glass-panel ticket-card">
      <div className="ticket-card-header">
        <span className="ticket-card-numero">#{ticket.numero}</span>
        <span className={`status-badge ${getStatusBadgeClass(ticket.status)}`}>
          {ticket.status.replace('_', ' ')}
        </span>
      </div>

      <div className="ticket-card-title">{ticket.titulo}</div>

      {!isSolicitante && (
        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          {ticket.solicitante.nome} · {ticket.unidade.nome}
        </div>
      )}

      <div className="ticket-card-meta">
        <span>{ticket.sector?.nome || '-'} / {ticket.problemType?.nome || ticket.tipoProblema?.replace('_', ' ') || '-'}</span>
        <span className={`urgencia-badge ${getUrgenciaBadgeClass(ticket.urgencia)}`}>
          {ticket.urgencia}
        </span>
      </div>

      <div className="ticket-card-footer">
        {ticket.anexoUrl ? (
          <a
            href={ticket.anexoUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={ticket.anexoNome || 'Ver anexo'}
            style={{ fontSize: '18px', textDecoration: 'none' }}
          >
            {ticket.anexoTipo?.startsWith('image/') ? '🖼️' : '📄'}
          </a>
        ) : (
          <span />
        )}
        <span
          style={{
            fontSize: '13px',
            fontWeight: 500,
            color: ticket.status === 'FECHADO'
              ? 'var(--text-muted)'
              : ticket.urgencia === 'CRITICA' || ticket.urgencia === 'ALTA'
                ? 'var(--danger)'
                : 'var(--text-main)'
          }}
        >
          {getDiasEmAberto(ticket.criadoEm, ticket.status)}
        </span>
      </div>

      <div className="ticket-card-bottom">
        <span className="ticket-card-data">{formatData(ticket.criadoEm)}</span>
        <Link to={`/chamados/${ticket.id}`} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '13px' }}>
          Ver Detalhes
        </Link>
      </div>
    </div>
  );
};
