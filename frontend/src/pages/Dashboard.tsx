import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext.js';
import { getDashboardData } from '../api/dashboard.js';
import { StatusCard } from '../components/StatusCard.js';
import { TrendChart } from '../components/TrendChart.js';
import { UnitSelector } from '../components/UnitSelector.js';
import { SectorSelector } from '../components/SectorSelector.js';

// 2.1 Hook useDashboard(unidadeId?) com React Query chamando GET /api/dashboard
export function useDashboard(unidadeId?: number | null, sectorId?: number | null) {
  return useQuery({
    queryKey: ['dashboard', unidadeId, sectorId],
    queryFn: () => getDashboardData(unidadeId, sectorId),
  });
}

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  const [selectedSectorId, setSelectedSectorId] = useState<number | null>(null);

  const isAdmin = user?.role === 'ADMIN';

  // Chamar o hook com a unidade selecionada (ou nulo para Admin consolidado)
  const { data, isLoading, isError, error } = useDashboard(isAdmin ? selectedUnitId : null, isAdmin ? selectedSectorId : null);

  if (!user) return null;

  return (
    <div className="main-content">
      {/* Cabeçalho */}
      <div style={{ marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>
            Olá, {user.nome}!
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            {isAdmin 
              ? 'Painel consolidado do sistema com indicadores de todas as unidades.' 
              : `Bem-vindo ao portal de atendimento da ${user.unidadeNome || 'sua unidade'}.`
            }
          </p>
        </div>

        {/* 4.1 UnitSelector e SectorSelector visíveis apenas para Admin */}
        {isAdmin && (
          <div className="glass-panel" style={{ padding: '16px 24px', alignSelf: 'flex-start', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <UnitSelector selectedUnitId={selectedUnitId} onChange={setSelectedUnitId} />
            <SectorSelector selectedSectorId={selectedSectorId} onChange={setSelectedSectorId} />
          </div>
        )}
      </div>

      {/* Estados de carregamento e erro */}
      {isLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <div style={{ fontSize: '18px', color: 'var(--text-muted)' }}>Carregando dados do painel...</div>
        </div>
      )}

      {isError && (
        <div className="glass-panel" style={{ padding: '24px', borderColor: 'var(--danger)', marginBottom: '32px' }}>
          <h3 style={{ color: 'var(--danger)', marginBottom: '8px' }}>Erro ao carregar dados do Dashboard</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            {(error as any)?.response?.data?.error || 'Não foi possível conectar ao servidor. Tente novamente mais tarde.'}
          </p>
        </div>
      )}

      {/* Conteúdo principal */}
      {data && !isLoading && !isError && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* 2.3 Grid de 4 colunas com os cards de status */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '24px',
            }}
          >
            <StatusCard
              label="Abertos"
              value={data.cards.abertos}
              type="abertos"
            />
            <StatusCard
              label="Em Andamento"
              value={data.cards.emAndamento}
              type="emAndamento"
            />
            <StatusCard
              label="Resolvidos"
              value={data.cards.resolvidos}
              type="resolvidos"
            />
            <StatusCard
              label="Críticos"
              value={data.cards.criticos}
              type="criticos"
            />
          </div>

          {/* Gráfico de tendência */}
          <div style={{ width: '100%' }}>
            <TrendChart data={data.trend} />
          </div>
        </div>
      )}
    </div>
  );
};
