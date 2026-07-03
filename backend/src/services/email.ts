import sgMail from '@sendgrid/mail';

const apiKey = process.env.SENDGRID_API_KEY || 'SG.dummy_key';
const emailFrom = process.env.EMAIL_FROM || 'helpdesk@naturaltec.com.br';
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

if (apiKey && apiKey !== 'SG.dummy_key') {
  sgMail.setApiKey(apiKey);
}

export class EmailService {
  static async send(to: string, subject: string, body: string): Promise<boolean> {
    const msg = {
      to,
      from: emailFrom,
      subject,
      text: body,
    };

    if (apiKey === 'SG.dummy_key') {
      console.log(`[EmailService] [MOCK] Sending email to ${to}: \nSubject: ${subject}\nBody: ${body}\n`);
      return true;
    }

    try {
      const sendPromise = sgMail.send(msg);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('SendGrid email send timeout after 3s')), 3000)
      );

      await Promise.race([sendPromise, timeoutPromise]);
      console.log(`[EmailService] Email sent successfully to ${to}`);
      return true;
    } catch (error) {
      console.error(`[EmailService] Failed to send email to ${to}:`, error);
      return false; // Não propaga a exceção conforme especificação de resiliência
    }
  }

  static getTicketLink(ticketId: number): string {
    return `${frontendUrl}/chamados/${ticketId}`;
  }

  // 1. ASSUMIDO: Técnico assume o chamado, notifica Solicitante
  static async sendAssumido(toEmail: string, solicitanteNome: string, ticketNumero: string | number, ticketTitulo: string, tecnicoNome: string, ticketId: number) {
    const subject = `Chamado #${ticketNumero} foi assumido`;
    const body = `Olá, ${solicitanteNome}.

Seu chamado #${ticketNumero} ("${ticketTitulo}") foi assumido pelo técnico ${tecnicoNome} e agora está Em Andamento.

Para acompanhar o chamado, acesse o link abaixo:
${this.getTicketLink(ticketId)}

Atenciosamente,
HelpDesk Instituto SETES.`;
    return this.send(toEmail, subject, body);
  }

  // 2. AGUARDANDO: Chamado colocado em aguardando, notifica Solicitante com a justificativa
  static async sendAguardando(toEmail: string, solicitanteNome: string, ticketNumero: string | number, ticketTitulo: string, mensagemTecnico: string, ticketId: number) {
    const subject = `Chamado #${ticketNumero} precisa de informações (Aguardando)`;
    const body = `Olá, ${solicitanteNome}.

Seu chamado #${ticketNumero} ("${ticketTitulo}") foi colocado no status "Aguardando" porque o técnico necessita de informações adicionais.

Mensagem do técnico:
"${mensagemTecnico}"

Por favor, responda diretamente no sistema acessando o link abaixo para dar andamento ao atendimento:
${this.getTicketLink(ticketId)}

Atenciosamente,
HelpDesk Instituto SETES.`;
    return this.send(toEmail, subject, body);
  }

  // 3. RESOLVIDO: Chamado resolvido, notifica Solicitante
  static async sendResolvido(toEmail: string, solicitanteNome: string, ticketNumero: string | number, ticketTitulo: string, ticketId: number) {
    const subject = `Chamado #${ticketNumero} foi resolvido`;
    const body = `Olá, ${solicitanteNome}.

Seu chamado #${ticketNumero} ("${ticketTitulo}") foi resolvido pelo técnico responsável.

Por favor, acesse o sistema para verificar a solução e confirmar o fechamento do chamado:
${this.getTicketLink(ticketId)}

Atenciosamente,
HelpDesk Instituto SETES.`;
    return this.send(toEmail, subject, body);
  }

  // 4. FECHADO_ADMIN: Fechamento administrativo, notifica Solicitante
  static async sendFechadoAdmin(toEmail: string, solicitanteNome: string, ticketNumero: string | number, ticketTitulo: string, ticketId: number) {
    const subject = `Chamado #${ticketNumero} foi encerrado`;
    const body = `Olá, ${solicitanteNome}.

Seu chamado #${ticketNumero} ("${ticketTitulo}") foi encerrado administrativamente pela equipe de TI. Não é necessária nenhuma ação adicional ou avaliação.

Você pode revisar o histórico do chamado a qualquer momento pelo link abaixo:
${this.getTicketLink(ticketId)}

Atenciosamente,
HelpDesk Instituto SETES.`;
    return this.send(toEmail, subject, body);
  }

  // 5. REABERTO: Chamado fechado reaberto, notifica Técnico anterior
  static async sendReaberto(toEmail: string, tecnicoNome: string, ticketNumero: string | number, ticketTitulo: string, motivoReabertura: string, ticketId: number) {
    const subject = `Chamado #${ticketNumero} foi reaberto`;
    const body = `Olá, ${tecnicoNome}.

O chamado #${ticketNumero} ("${ticketTitulo}"), pelo qual você era responsável, foi reaberto pelo solicitante.

Motivo da reabertura:
"${motivoReabertura}"

Acesse o chamado no sistema para continuar o atendimento:
${this.getTicketLink(ticketId)}

Atenciosamente,
HelpDesk Instituto SETES.`;
    return this.send(toEmail, subject, body);
  }

  // 6. MENSAGEM_AGUARDANDO: Solicitante responde mensagem em chamado Aguardando, notifica Técnico
  static async sendMensagemAguardando(toEmail: string, tecnicoNome: string, ticketNumero: string | number, ticketTitulo: string, mensagemSolicitante: string, ticketId: number) {
    const subject = `Nova resposta no chamado #${ticketNumero} (Aguardando)`;
    const body = `Olá, ${tecnicoNome}.

O solicitante enviou uma mensagem no chamado #${ticketNumero} ("${ticketTitulo}"), que estava aguardando retorno. O status do chamado foi atualizado automaticamente para Em Andamento.

Mensagem do solicitante:
"${mensagemSolicitante}"

Acesse o chamado pelo link abaixo para responder:
${this.getTicketLink(ticketId)}

Atenciosamente,
HelpDesk Instituto SETES.`;
    return this.send(toEmail, subject, body);
  }

  // 7. REATRIBUICAO: Gestor/Diretor reatribui, notifica novo Técnico e Solicitante
  // E-mail para o novo Técnico
  static async sendReatribuicaoNovoTecnico(toEmail: string, tecnicoNome: string, ticketNumero: string | number, ticketTitulo: string, ticketId: number) {
    const subject = `Novo chamado atribuído a você: #${ticketNumero}`;
    const body = `Olá, ${tecnicoNome}.

O chamado #${ticketNumero} ("${ticketTitulo}") foi reatribuído a você por um gestor da equipe de TI.

Acesse o chamado no link abaixo para iniciar o atendimento:
${this.getTicketLink(ticketId)}

Atenciosamente,
HelpDesk Instituto SETES.`;
    return this.send(toEmail, subject, body);
  }

  // E-mail para o Solicitante na reatribuição
  static async sendReatribuicaoSolicitante(toEmail: string, solicitanteNome: string, ticketNumero: string | number, ticketTitulo: string, novoTecnicoNome: string, ticketId: number) {
    const subject = `Chamado #${ticketNumero} foi reatribuído`;
    const body = `Olá, ${solicitanteNome}.

Seu chamado #${ticketNumero} ("${ticketTitulo}") foi reatribuído e agora está sob a responsabilidade do técnico ${novoTecnicoNome}.

Para acompanhar o chamado, acesse o link abaixo:
${this.getTicketLink(ticketId)}

Atenciosamente,
HelpDesk Instituto SETES.`;
    return this.send(toEmail, subject, body);
  }
}
