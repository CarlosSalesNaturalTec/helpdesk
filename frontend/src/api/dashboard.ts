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

export const getDashboardData = async (unidadeId?: number | null, sectorId?: number | null) => {
  const params: any = {};
  if (unidadeId) params.unidadeId = unidadeId;
  if (sectorId) params.sectorId = sectorId;

  const response = await apiClient.get<DashboardData>('/api/dashboard', {
    params,
  });
  return response.data;
};
