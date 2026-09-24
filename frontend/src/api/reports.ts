import { apiClient as api } from './client.js';

export interface ReportMetricsFilters {
  periodo: string;
  dataInicio?: string;
  dataFim?: string;
  unidadeId?: number | null;
  sectorId?: number | null;
  dimensao: string;
}

export interface ReportMetricsData {
  cards: {
    total: number;
    taxaFechamento: number;
    tmaHoras: number;
    satisfacaoMedia: number;
  };
  distribuicao: {
    label: string;
    count: number;
  }[];
}

export const getReportMetrics = async (filters: ReportMetricsFilters): Promise<ReportMetricsData> => {
  const params = new URLSearchParams();
  params.append('periodo', filters.periodo);
  params.append('dimensao', filters.dimensao);
  if (filters.dataInicio) params.append('dataInicio', filters.dataInicio);
  if (filters.dataFim) params.append('dataFim', filters.dataFim);
  if (filters.unidadeId) params.append('unidadeId', String(filters.unidadeId));
  if (filters.sectorId) params.append('sectorId', String(filters.sectorId));

  const response = await api.get(`/api/reports/metrics?${params.toString()}`);
  return response.data;
};

// O servidor apura cards e lista a partir dos filtros; só o gráfico (renderização de DOM) vai pronto
export interface GeneratePdfParams extends ReportMetricsFilters {
  chartImage?: string;
}

export const generateReportPdf = async (params: GeneratePdfParams): Promise<Blob> => {
  const response = await api.post('/api/reports/pdf', params, {
    responseType: 'blob', // Expect PDF binary blob
  });
  return response.data;
};
