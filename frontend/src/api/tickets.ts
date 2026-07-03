import { apiClient } from './client.js';
import type {
  TicketQueryInput,
  TicketStatusInput,
  AssignTicketInput,
  SatisfactionInput,
} from '@helpdesk/shared';

export interface Ticket {
  id: number;
  numero: string;
  titulo: string;
  descricao: string;
  tipoProblema: string;
  urgencia: string;
  status: string;
  solicitanteId: number;
  tecnicoId: number | null;
  unidadeId: number;
  sectorId?: number;
  problemTypeId?: number;
  criadoEm: string;
  atualizadoEm: string;
  solicitante: { id: number; nome: string; email: string };
  tecnico: { id: number; nome: string; email: string } | null;
  unidade: { id: number; nome: string };
  sector?: { id: number; nome: string };
  problemType?: { id: number; nome: string };
  // Campos de anexo (opcionais — null quando não há anexo)
  anexoUrl?: string | null;
  anexoNome?: string | null;
  anexoTipo?: string | null;
  anexoTamanho?: number | null;
}

export interface TicketHistory {
  id: number;
  ticketId: number;
  type: string;
  content: any;
  authorId: number;
  criadoEm: string;
  author: { id: number; nome: string; role: string };
}

export interface TicketListResponse {
  data: Ticket[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateTicketInput {
  titulo: string;
  descricao: string;
  sectorId: number;
  problemTypeId: number;
  urgencia: string;
  anexo?: File | null;
}

/**
 * Cria um chamado via multipart/form-data.
 * Inclui arquivo opcional no campo "anexo".
 */
export const createTicket = async (data: CreateTicketInput) => {
  const formData = new FormData();
  formData.append('titulo', data.titulo);
  formData.append('descricao', data.descricao);
  formData.append('sectorId', String(data.sectorId));
  formData.append('problemTypeId', String(data.problemTypeId));
  formData.append('urgencia', data.urgencia);
  if (data.anexo) {
    formData.append('anexo', data.anexo);
  }

  const response = await apiClient.post<{
    id: number;
    numero: string;
    status: string;
    criadoEm: string;
    message: string;
  }>('/api/tickets', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getTickets = async (params?: TicketQueryInput) => {
  const response = await apiClient.get<TicketListResponse>('/api/tickets', { params });
  return response.data;
};

export const getTicket = async (id: number) => {
  const response = await apiClient.get<Ticket>(`/api/tickets/${id}`);
  return response.data;
};

export const getTicketHistory = async (id: number) => {
  const response = await apiClient.get<TicketHistory[]>(`/api/tickets/${id}/history`);
  return response.data;
};

export const assignTicket = async (id: number) => {
  const response = await apiClient.patch<{
    id: number;
    status: string;
    message: string;
  }>(`/api/tickets/${id}/assign`);
  return response.data;
};

export const reassignTicket = async (id: number, data: AssignTicketInput) => {
  const response = await apiClient.patch<{
    id: number;
    status: string;
    message: string;
  }>(`/api/tickets/${id}/reassign`, data);
  return response.data;
};

export const updateTicketStatus = async (id: number, data: TicketStatusInput) => {
  const response = await apiClient.patch<{
    id: number;
    status: string;
    message: string;
  }>(`/api/tickets/${id}/status`, data);
  return response.data;
};

export const closeTicket = async (id: number, data: SatisfactionInput) => {
  const response = await apiClient.patch<{
    id: number;
    status: string;
    message: string;
  }>(`/api/tickets/${id}/close`, data);
  return response.data;
};

export const adminCloseTicket = async (id: number, data: { motivo?: string }) => {
  const response = await apiClient.patch<{
    id: number;
    status: string;
    message: string;
  }>(`/api/tickets/${id}/admin-close`, data);
  return response.data;
};

export const reopenTicket = async (id: number, data: { motivo: string }) => {
  const response = await apiClient.patch<{
    id: number;
    status: string;
    message: string;
  }>(`/api/tickets/${id}/reopen`, data);
  return response.data;
};

export const getTiposProblema = async () => {
  const response = await apiClient.get<{ label: string; value: string }[]>('/api/tickets/tipos-problema');
  return response.data;
};

export const getNiveisUrgencia = async () => {
  const response = await apiClient.get<{ label: string; value: string }[]>('/api/tickets/niveis-urgencia');
  return response.data;
};

/**
 * Substitui o anexo de um chamado (PATCH /api/tickets/:id/anexo).
 * Apenas o solicitante pode realizar esta ação.
 */
export const replaceAttachment = async (ticketId: number, file: File) => {
  const formData = new FormData();
  formData.append('anexo', file);
  const response = await apiClient.patch<{
    id: number;
    anexoUrl: string;
    anexoNome: string;
    anexoTipo: string;
    anexoTamanho: number;
    message: string;
  }>(`/api/tickets/${ticketId}/anexo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

/**
 * Remove o anexo de um chamado (DELETE /api/tickets/:id/anexo).
 * Apenas o solicitante pode realizar esta ação.
 */
export const removeAttachment = async (ticketId: number) => {
  const response = await apiClient.delete<{ message: string }>(`/api/tickets/${ticketId}/anexo`);
  return response.data;
};
