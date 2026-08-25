import React, { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toPng } from 'html-to-image';
import { useAuth } from '../context/AuthContext.js';
import { getReportMetrics, generateReportPdf } from '../api/reports.js';
import { UnitSelector } from '../components/UnitSelector.js';
import { StatusCard } from '../components/StatusCard.js';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BRANDING_SLUG } from '../config.js';

export const Relatorios: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [periodo, setPeriodo] = useState('30');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [dimensao, setDimensao] = useState('status');
  const [unidadeId, setUnidadeId] = useState<number | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['reportMetrics', periodo, dataInicio, dataFim, dimensao, isAdmin ? unidadeId : null],
    queryFn: () => getReportMetrics({
      periodo,
      dataInicio: periodo === 'custom' ? dataInicio : undefined,
      dataFim: periodo === 'custom' ? dataFim : undefined,
      dimensao,
      unidadeId: isAdmin ? unidadeId : undefined,
    }),
    enabled: periodo !== 'custom' || (!!dataInicio && !!dataFim),
  });

  const handleGeneratePdf = async () => {
    if (!data) return;
    setIsGenerating(true);
    try {
      let chartImage: string | undefined;
      if (chartRef.current && data.distribuicao.length > 0) {
        // html-to-image aplica isto via canvas fillStyle e clone destacado do DOM: var() não resolve aqui, precisa do literal
        chartImage = await toPng(chartRef.current, { backgroundColor: '#ffffff', pixelRatio: 2 });
      }

      let periodoLabel = `Últimos ${periodo} dias`;
      if (periodo === 'custom') {
        periodoLabel = `De ${new Date(dataInicio).toLocaleDateString()} até ${new Date(dataFim).toLocaleDateString()}`;
      }

      const blob = await generateReportPdf({
        cards: data.cards,
        chartImage,
        dimensao,
        periodoLabel,
        unidadeLabel: isAdmin && unidadeId ? 'Filtrada' : undefined, // idealmente o nome real
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio_${BRANDING_SLUG}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('Erro ao gerar PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  const COLORS = [
    'var(--chart-cat-1)',
    'var(--chart-cat-2)',
    'var(--chart-cat-3)',
    'var(--chart-cat-4)',
    'var(--chart-cat-5)',
    'var(--chart-cat-6)',
  ];

  return (
    <div className="main-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>Relatórios Gerenciais</h1>
          <p style={{ color: 'var(--text-muted)' }}>Métricas calculadas e gráficos operacionais.</p>
        </div>
        <button className="btn btn-primary" onClick={handleGeneratePdf} disabled={isGenerating || isLoading}>
          {isGenerating ? 'Gerando PDF...' : 'Gerar PDF'}
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '24px', marginBottom: '32px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <div>
          <label className="form-label">Período</label>
          <select className="form-input" value={periodo} onChange={e => setPeriodo(e.target.value)}>
            <option value="30">Últimos 30 dias</option>
            <option value="60">Últimos 60 dias</option>
            <option value="90">Últimos 90 dias</option>
            <option value="custom">Personalizado</option>
          </select>
        </div>
        
        {periodo === 'custom' && (
          <>
            <div>
              <label className="form-label">Data Início</label>
              <input type="date" className="form-input" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
            </div>
            <div>
              <label className="form-label">Data Fim</label>
              <input type="date" className="form-input" value={dataFim} onChange={e => setDataFim(e.target.value)} />
            </div>
          </>
        )}

        <div>
          <label className="form-label">Dimensão do Gráfico</label>
          <select className="form-input" value={dimensao} onChange={e => setDimensao(e.target.value)}>
            <option value="status">Status</option>
            <option value="prioridade">Prioridade</option>
            <option value="categoria">Categoria</option>
            <option value="satisfacao">Satisfação</option>
            {isAdmin && <option value="unidade">Unidade</option>}
          </select>
        </div>

        {isAdmin && (
          <div style={{ flexGrow: 1, minWidth: '200px' }}>
            <label className="form-label">Unidade</label>
            <UnitSelector selectedUnitId={unidadeId} onChange={setUnidadeId} />
          </div>
        )}
      </div>

      {isLoading && <p>Carregando relatórios...</p>}
      {isError && <p style={{ color: 'var(--danger)' }}>Erro ao carregar dados: {(error as any)?.message}</p>}

      {data && !isLoading && !isError && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
            <StatusCard label="Total de Chamados" value={data.cards.total} type="abertos" />
            <StatusCard label="Taxa de Fechamento" value={`${Number(data.cards.taxaFechamento).toFixed(1)}%`} type="resolvidos" />
            <StatusCard label="Tempo Médio (TMA)" value={`${Number(data.cards.tmaHoras).toFixed(1)} h`} type="emAndamento" />
            <StatusCard label="Satisfação Média" value={Number(data.cards.satisfacaoMedia).toFixed(1)} type="criticos" />
          </div>

          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '24px' }}>Distribuição por {dimensao}</h3>
            <div ref={chartRef} style={{ height: 400, backgroundColor: 'var(--bg-card-solid)', padding: '16px' }}>
              {data.distribuicao.length === 0 ? (
                <p style={{ textAlign: 'center', marginTop: '150px', color: 'var(--text-muted)' }}>Não há dados disponíveis para os filtros selecionados</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  {(dimensao === 'status' || dimensao === 'satisfacao') ? (
                    <PieChart>
                      <Pie data={data.distribuicao} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={120} label>
                        {data.distribuicao.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  ) : (
                    <BarChart data={data.distribuicao}>
                      <XAxis dataKey="label" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="var(--chart-cat-1)">
                        {data.distribuicao.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  )}
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
