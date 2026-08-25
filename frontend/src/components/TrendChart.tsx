import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

interface TrendData {
  date: string;
  abertos: number;
  fechados: number;
}

interface TrendChartProps {
  data: TrendData[];
}

export const TrendChart: React.FC<TrendChartProps> = ({ data }) => {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}`;
    }
    return dateStr;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const parts = label.split('-');
      const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : label;
      return (
        <div
          style={{
            backgroundColor: 'var(--bg-card-solid)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '12px',
            boxShadow: 'var(--shadow-lg)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <p style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px', color: 'var(--text-main)' }}>
            {formattedDate}
          </p>
          {payload.map((pld: any) => (
            <p key={pld.name} style={{ fontSize: '12px', color: pld.color, margin: '4px 0' }}>
              <span style={{ fontWeight: 500 }}>{pld.name}:</span> {pld.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', width: '100%' }}>
      <h3 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary)' }}>
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
        Tendência Operacional (Últimos 30 dias)
      </h3>
      
      <div style={{ width: '100%', height: '350px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              stroke="var(--text-muted)"
              tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
              dy={10}
            />
            <YAxis
              allowDecimals={false}
              stroke="var(--text-muted)"
              tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
              dx={-5}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              height={36}
              iconType="circle"
              formatter={(value) => <span style={{ color: 'var(--text-main)', fontSize: '13px', fontWeight: 500 }}>{value}</span>}
            />
            <Line
              type="monotone"
              dataKey="abertos"
              stroke="var(--chart-series-1)"
              strokeWidth={3}
              dot={{ r: 4, stroke: 'var(--chart-series-1)', strokeWidth: 2, fill: 'var(--bg-card-solid)' }}
              activeDot={{ r: 6 }}
              name="Novos Chamados"
            />
            <Line
              type="monotone"
              dataKey="fechados"
              stroke="var(--chart-series-2)"
              strokeWidth={3}
              dot={{ r: 4, stroke: 'var(--chart-series-2)', strokeWidth: 2, fill: 'var(--bg-card-solid)' }}
              activeDot={{ r: 6 }}
              name="Chamados Fechados"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
