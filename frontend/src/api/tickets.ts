import { apiClient } from './client.js';
import type {
  CreateTicketInput,
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
  criadoEm: string;
  atualizadoEm: string;
  solicitante: { id: number; nome: string; email: string };
  tecnico: { id: number; nome: string; email: string } | null;
  unidade: { id: number; nome: string };
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

export const createTicket = async (data: CreateTicketInput) => {
  const response = await apiClient.post<{
    id: number;
    numero: string;
    status: string;
    criadoEm: string;
    message: string;
  }>('/api/tickets', data);
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
