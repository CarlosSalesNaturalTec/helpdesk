import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client.js';

interface Sector {
  id: number;
  nome: string;
}

interface SectorSelectorProps {
  selectedSectorId: number | null;
  onChange: (sectorId: number | null) => void;
}

export const SectorSelector: React.FC<SectorSelectorProps> = ({ selectedSectorId, onChange }) => {
  const { data: sectors, isLoading } = useQuery<Sector[]>({
    queryKey: ['sectors'],
    queryFn: async () => {
      const res = await apiClient.get<Sector[]>('/api/sectors');
      return res.data;
    },
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
      <label
        htmlFor="sector-filter"
        style={{
          fontSize: '14px',
          fontWeight: 600,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        Filtrar por Setor:
      </label>
      
      <select
        id="sector-filter"
        value={selectedSectorId ?? ''}
        onChange={(e) => {
          const val = e.target.value;
          onChange(val ? parseInt(val, 10) : null);
        }}
        disabled={isLoading}
        style={{
          padding: '10px 16px',
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          color: 'var(--text-main)',
          fontFamily: 'var(--font-sans)',
          fontSize: '14px',
          cursor: 'pointer',
          outline: 'none',
          transition: 'var(--transition-smooth)',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'var(--primary)';
          e.target.style.boxShadow = '0 0 0 3px var(--primary-glow)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'var(--border)';
          e.target.style.boxShadow = 'none';
        }}
      >
        <option value="">Todos os Setores</option>
        {sectors?.map((sector) => (
          <option key={sector.id} value={sector.id}>
            {sector.nome}
          </option>
        ))}
      </select>
      
      {isLoading && (
        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Carregando setores...
        </span>
      )}
    </div>
  );
};
