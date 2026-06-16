import React from 'react';

interface StatusCardProps {
  label: string;
  value: number;
  type: 'abertos' | 'emAndamento' | 'resolvidos' | 'criticos';
}

export const StatusCard: React.FC<StatusCardProps> = ({ label, value, type }) => {
  const getConfig = () => {
    switch (type) {
      case 'abertos':
        return {
          glowColor: 'var(--primary-glow)',
          borderColor: 'rgba(99, 102, 241, 0.2)',
          iconColor: 'var(--primary)',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          )
        };
      case 'emAndamento':
        return {
          glowColor: 'var(--warning-glow)',
          borderColor: 'rgba(245, 158, 11, 0.2)',
          iconColor: 'var(--warning)',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          )
        };
      case 'resolvidos':
        return {
          glowColor: 'var(--success-glow)',
          borderColor: 'rgba(16, 185, 129, 0.2)',
          iconColor: 'var(--success)',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          )
        };
      case 'criticos':
        return {
          glowColor: 'var(--danger-glow)',
          borderColor: 'rgba(239, 68, 68, 0.2)',
          iconColor: 'var(--danger)',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          )
        };
    }
  };

  const config = getConfig();

  return (
    <div
      className="glass-panel"
      style={{
        padding: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        border: `1px solid ${config.borderColor}`,
        boxShadow: `0 4px 20px ${config.glowColor}`,
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: 'default',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = `0 8px 30px ${config.glowColor}`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = `0 4px 20px ${config.glowColor}`;
      }}
    >
      <div>
        <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>
          {label}
        </span>
        <h2 style={{ fontSize: '36px', margin: '8px 0 0 0', fontFamily: 'monospace', fontWeight: 700 }}>
          {value}
        </h2>
      </div>
      
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          backgroundColor: config.glowColor,
          color: config.iconColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {config.icon}
      </div>
    </div>
  );
};
