import { apiClient } from './client.js';

export interface DashboardData {
  cards: {
    abertos: number;
    emAndamento: number;
    resolvidos: number;
    criticos: number;
  };
  trend: {
    date: string;
    abertos: number;
    fechados: number;
  }[];
}

export const getDashboardData = async (unidadeId?: number | null) => {
  const response = await apiClient.get<DashboardData>('/api/dashboard', {
    params: unidadeId ? { unidadeId } : {},
  });
  return response.data;
};
