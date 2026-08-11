import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client.js';

interface Notification {
  id: number;
  userId: number;
  ticketId: number;
  type: string;
  message: string;
  lida: boolean;
  criadoEm: string;
}

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // 8.1 Hook useUnreadCount com refetchInterval de 30s
  const { data: countData } = useQuery({
    queryKey: ['unreadCount'],
    queryFn: async () => {
      const res = await apiClient.get<{ count: number }>('/api/notifications/unread-count');
      return res.data;
    },
    refetchInterval: 30_000,
  });

  const unreadCount = countData?.count ?? 0;

  // Query de Notificações
  const { data: notificationsData, refetch: refetchNotifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: Notification[] }>('/api/notifications?page=1&limit=20');
      return res.data;
    },
    enabled: isOpen, // Só busca quando abre o dropdown
  });

  const notifications = notificationsData?.data ?? [];

  // Recarrega notificações se abrir o dropdown
  useEffect(() => {
    if (isOpen) {
      refetchNotifications();
    }
  }, [isOpen, refetchNotifications]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Mutation para Marcar como Lida
  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.patch(`/api/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mutation para Marcar Todas como Lidas
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiClient.patch('/api/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleNotificationClick = async (notif: Notification) => {
    setIsOpen(false);
    if (!notif.lida) {
      // 8.6 Atualiza contagem localmente antes para feedback instantâneo se quiser, 
      // ou apenas deixa a mutation invalidar as queries.
      await markAsReadMutation.mutateAsync(notif.id);
    }
    // Redireciona para o chamado
    navigate(`/chamados/${notif.ticketId}`);
  };

  const formatRelativeTime = (dateStr: string): string => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    
    if (diffMs < 0) return 'agora';

    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `há ${diffMins} min`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `há ${diffHours} h`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'ontem';
    if (diffDays < 7) return `há ${diffDays} dias`;

    return date.toLocaleDateString('pt-BR');
  };

  const getIconByType = (type: string) => {
    switch (type) {
      case 'ASSUMIDO': return '🙋';
      case 'AGUARDANDO': return '⏸';
      case 'RESOLVIDO': return '✓';
      case 'FECHADO_ADMIN': return '🔒';
      case 'REABERTO': return '♻';
      case 'MENSAGEM':
      case 'MENSAGEM_AGUARDANDO': return '💬';
      case 'REATRIBUICAO': return '🔄';
      default: return '🔔';
    }
  };

  return (
    <div ref={dropdownRef} className="notification-bell-wrapper">
      {/* Botão do Sino */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'none',
          border: 'none',
          fontSize: '22px',
          cursor: 'pointer',
          padding: '6px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-main)',
          transition: 'background-color 0.2s, transform 0.2s',
          position: 'relative',
        }}
        className="nav-bell-button"
        title="Notificações"
      >
        🔔
        {/* Badge Numérico Condicional */}
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              backgroundColor: 'var(--danger)',
              color: 'white',
              borderRadius: '50%',
              fontSize: '10px',
              fontWeight: 'bold',
              height: '18px',
              width: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--background-nav)',
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown de Notificações */}
      {isOpen && (
        <div
          className="notification-dropdown"
          style={{
            backgroundColor: 'rgba(30, 30, 40, 0.95)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header do Dropdown */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <span style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-main)' }}>
              Notificações
            </span>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsReadMutation.mutate()}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary-main)',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  transition: 'background-color 0.2s',
                }}
                className="btn-mark-all-read"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          {/* Lista de Notificações */}
          <div
            style={{
              overflowY: 'auto',
              flexGrow: 1,
            }}
          >
            {notifications.length === 0 ? (
              <div
                style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '14px',
                }}
              >
                Nenhuma notificação por aqui.
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    padding: '12px 16px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    backgroundColor: notif.lida ? 'transparent' : 'rgba(168, 85, 247, 0.03)',
                  }}
                  className="notification-item"
                >
                  <span
                    style={{
                      fontSize: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '32px',
                      height: '32px',
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '8px',
                    }}
                  >
                    {getIconByType(notif.type)}
                  </span>
                  <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span
                      style={{
                        fontSize: '13px',
                        color: notif.lida ? 'var(--text-muted)' : 'var(--text-main)',
                        fontWeight: notif.lida ? 400 : 500,
                        lineHeight: '1.4',
                      }}
                    >
                      {notif.message}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {formatRelativeTime(notif.criadoEm)}
                    </span>
                  </div>
                  {!notif.lida && (
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        backgroundColor: 'var(--primary-main)',
                        borderRadius: '50%',
                        alignSelf: 'center',
                        flexShrink: 0,
                      }}
                    />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
