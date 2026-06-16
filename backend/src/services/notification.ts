import { prisma } from '../lib/prisma.js';
import { EmailService } from './email.js';

export class NotificationService {
  // Cria uma notificação visual (no banco)
  static async create(userId: number, ticketId: number, type: string, message: string) {
    try {
      return await prisma.notification.create({
        data: {
          userId,
          ticketId,
          type,
          message,
          lida: false,
        },
      });
    } catch (error) {
      console.error('[NotificationService] Error creating visual notification:', error);
    }
  }

  // Busca o ticket completo com as relações solicitante e técnico
  private static async getFullTicket(ticketOrId: any) {
    const ticketId = typeof ticketOrId === 'object' ? ticketOrId.id : ticketOrId;
    return await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        solicitante: true,
        tecnico: true,
        unidade: true,
      },
    });
  }

  // 3.2notifyAssigned: Notifica Solicitante (visual + e-mail) quando técnico assume
  static async notifyAssigned(ticketOrId: any) {
    try {
      const ticket = await this.getFullTicket(ticketOrId);
      if (!ticket) return;

      const solicitante = ticket.solicitante;
      const tecnicoName = ticket.tecnico?.nome || 'um técnico';

      const messageText = `Chamado #${ticket.numero} foi assumido por ${tecnicoName}`;

      // Notificação visual no banco para o solicitante
      await this.create(solicitante.id, ticket.id, 'ASSUMIDO', messageText);

      // Envia e-mail para o solicitante
      await EmailService.sendAssumido(
        solicitante.email,
        solicitante.nome,
        ticket.numero.toString(),
        ticket.titulo,
        tecnicoName,
        ticket.id
      ).catch(err => console.error('[NotificationService] Email error:', err));
    } catch (error) {
      console.error('[NotificationService] Error in notifyAssigned:', error);
    }
  }

  // 3.3 notifyAguardando: Notifica Solicitante (visual + e-mail)
  static async notifyAguardando(ticketOrId: any, mensagemTecnico: string) {
    try {
      const ticket = await this.getFullTicket(ticketOrId);
      if (!ticket) return;

      const solicitante = ticket.solicitante;
      const messageText = `Chamado #${ticket.numero} precisa de informações adicionais (Aguardando)`;

      // Notificação visual
      await this.create(solicitante.id, ticket.id, 'AGUARDANDO', messageText);

      // E-mail
      await EmailService.sendAguardando(
        solicitante.email,
        solicitante.nome,
        ticket.numero.toString(),
        ticket.titulo,
        mensagemTecnico,
        ticket.id
      ).catch(err => console.error('[NotificationService] Email error:', err));
    } catch (error) {
      console.error('[NotificationService] Error in notifyAguardando:', error);
    }
  }

  // 3.4 notifyResolved: Notifica Solicitante (visual + e-mail)
  static async notifyResolved(ticketOrId: any) {
    try {
      const ticket = await this.getFullTicket(ticketOrId);
      if (!ticket) return;

      const solicitante = ticket.solicitante;
      const messageText = `Chamado #${ticket.numero} foi resolvido`;

      // Notificação visual
      await this.create(solicitante.id, ticket.id, 'RESOLVIDO', messageText);

      // E-mail
      await EmailService.sendResolvido(
        solicitante.email,
        solicitante.nome,
        ticket.numero.toString(),
        ticket.titulo,
        ticket.id
      ).catch(err => console.error('[NotificationService] Email error:', err));
    } catch (error) {
      console.error('[NotificationService] Error in notifyResolved:', error);
    }
  }

  // 3.5 notifyAdminClose: Notifica Solicitante (visual + e-mail)
  static async notifyAdminClose(ticketOrId: any) {
    try {
      const ticket = await this.getFullTicket(ticketOrId);
      if (!ticket) return;

      const solicitante = ticket.solicitante;
      const messageText = `Chamado #${ticket.numero} foi encerrado administrativamente`;

      // Notificação visual
      await this.create(solicitante.id, ticket.id, 'FECHADO_ADMIN', messageText);

      // E-mail
      await EmailService.sendFechadoAdmin(
        solicitante.email,
        solicitante.nome,
        ticket.numero.toString(),
        ticket.titulo,
        ticket.id
      ).catch(err => console.error('[NotificationService] Email error:', err));
    } catch (error) {
      console.error('[NotificationService] Error in notifyAdminClose:', error);
    }
  }

  // 3.6 notifyReopened: Notifica Técnico anterior (visual + e-mail)
  static async notifyReopened(ticketOrId: any, motivoReabertura: string) {
    try {
      const ticket = await this.getFullTicket(ticketOrId);
      if (!ticket) return;

      const messageText = `Chamado #${ticket.numero} foi reaberto`;

      if (ticket.tecnicoId) {
        // Se tinha técnico responsável, notifica ele
        await this.create(ticket.tecnicoId, ticket.id, 'REABERTO', messageText);
        
        if (ticket.tecnico) {
          await EmailService.sendReaberto(
            ticket.tecnico.email,
            ticket.tecnico.nome,
            ticket.numero.toString(),
            ticket.titulo,
            motivoReabertura,
            ticket.id
          ).catch(err => console.error('[NotificationService] Email error:', err));
        }
      } else {
        // Se não tinha técnico, notifica os técnicos da unidade do chamado
        const tecnicosUnidade = await prisma.user.findMany({
          where: {
            unidadeId: ticket.unidadeId,
            role: 'TECNICO',
            ativo: true,
          },
        });

        for (const tec of tecnicosUnidade) {
          await this.create(tec.id, ticket.id, 'REABERTO', messageText);
          await EmailService.sendReaberto(
            tec.email,
            tec.nome,
            ticket.numero.toString(),
            ticket.titulo,
            motivoReabertura,
            ticket.id
          ).catch(err => console.error('[NotificationService] Email error:', err));
        }
      }
    } catch (error) {
      console.error('[NotificationService] Error in notifyReopened:', error);
    }
  }

  // 3.7 notifyMessageInAguardando: Notifica Técnico (visual + e-mail)
  static async notifyMessageInAguardando(ticketOrId: any, mensagemSolicitante: string) {
    try {
      const ticket = await this.getFullTicket(ticketOrId);
      if (!ticket) return;

      // Só notifica se tiver técnico responsável
      if (ticket.tecnicoId && ticket.tecnico) {
        const messageText = `Nova resposta no chamado #${ticket.numero} (Aguardando)`;

        // Notificação visual
        await this.create(ticket.tecnicoId, ticket.id, 'MENSAGEM_AGUARDANDO', messageText);

        // E-mail
        await EmailService.sendMensagemAguardando(
          ticket.tecnico.email,
          ticket.tecnico.nome,
          ticket.numero.toString(),
          ticket.titulo,
          mensagemSolicitante,
          ticket.id
        ).catch(err => console.error('[NotificationService] Email error:', err));
      }
    } catch (error) {
      console.error('[NotificationService] Error in notifyMessageInAguardando:', error);
    }
  }

  // 3.8 notifyReassignment: Notifica novo Técnico + Solicitante (visual + e-mail)
  static async notifyReassignment(ticketOrId: any, novoTecnicoOrId: any) {
    try {
      const ticket = await this.getFullTicket(ticketOrId);
      if (!ticket) return;

      const novoTecnicoId = typeof novoTecnicoOrId === 'object' ? novoTecnicoOrId.id : novoTecnicoOrId;
      const novoTecnico = await prisma.user.findUnique({
        where: { id: novoTecnicoId },
      });

      if (!novoTecnico) return;

      const solicitante = ticket.solicitante;

      // 1. Notificar o Novo Técnico
      const msgTecnico = `Chamado #${ticket.numero} foi atribuído a você`;
      await this.create(novoTecnico.id, ticket.id, 'REATRIBUICAO', msgTecnico);
      await EmailService.sendReatribuicaoNovoTecnico(
        novoTecnico.email,
        novoTecnico.nome,
        ticket.numero.toString(),
        ticket.titulo,
        ticket.id
      ).catch(err => console.error('[NotificationService] Email error:', err));

      // 2. Notificar o Solicitante
      const msgSolicitante = `Chamado #${ticket.numero} foi reatribuído para o técnico ${novoTecnico.nome}`;
      await this.create(solicitante.id, ticket.id, 'REATRIBUICAO', msgSolicitante);
      await EmailService.sendReatribuicaoSolicitante(
        solicitante.email,
        solicitante.nome,
        ticket.numero.toString(),
        ticket.titulo,
        novoTecnico.nome,
        ticket.id
      ).catch(err => console.error('[NotificationService] Email error:', err));

    } catch (error) {
      console.error('[NotificationService] Error in notifyReassignment:', error);
    }
  }
}
