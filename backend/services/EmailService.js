const nodemailer = require('nodemailer');
const config = require('../config/config.json');
const logger = require('../config/logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.inicializar();
  }

  inicializar() {
    try {
      // Configuração do transportador de email
      this.transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST || config.email?.host || 'localhost',
        port: process.env.SMTP_PORT || config.email?.port || 587,
        secure: process.env.SMTP_SECURE === 'true' || config.email?.secure || false,
        auth: {
          user: process.env.SMTP_USER || config.email?.user,
          pass: process.env.SMTP_PASS || config.email?.password
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      logger.info('Serviço de email inicializado');
    } catch (error) {
      logger.error('Erro ao inicializar serviço de email:', error);
    }
  }

  async verificarConexao() {
    try {
      if (!this.transporter) {
        throw new Error('Transportador de email não inicializado');
      }

      await this.transporter.verify();
      return true;
    } catch (error) {
      logger.error('Erro ao verificar conexão de email:', error);
      return false;
    }
  }

  async enviarEmail(destinatario, assunto, conteudoHtml, conteudoTexto = null) {
    try {
      if (!this.transporter) {
        throw new Error('Transportador de email não inicializado');
      }

      const opcoes = {
        from: process.env.SMTP_FROM || config.email?.from || 'noreply@manutencao.com',
        to: destinatario,
        subject: assunto,
        html: conteudoHtml,
        text: conteudoTexto || this.extrairTextoDeHtml(conteudoHtml)
      };

      const resultado = await this.transporter.sendMail(opcoes);
      
      logger.info(`Email enviado com sucesso para ${destinatario}`, {
        messageId: resultado.messageId,
        assunto
      });

      return {
        sucesso: true,
        messageId: resultado.messageId
      };
    } catch (error) {
      logger.error(`Erro ao enviar email para ${destinatario}:`, error);
      
      return {
        sucesso: false,
        erro: error.message
      };
    }
  }

  async enviarNotificacaoPorEmail(notificacao, usuario) {
    try {
      const assunto = this.gerarAssuntoEmail(notificacao);
      const conteudoHtml = this.gerarConteudoHtmlNotificacao(notificacao, usuario);
      
      return await this.enviarEmail(
        usuario.email,
        assunto,
        conteudoHtml
      );
    } catch (error) {
      logger.error('Erro ao enviar notificação por email:', error);
      return {
        sucesso: false,
        erro: error.message
      };
    }
  }

  gerarAssuntoEmail(notificacao) {
    const prefixos = {
      'critica': '[CRÍTICO]',
      'alta': '[IMPORTANTE]',
      'normal': '[INFO]',
      'baixa': '[INFO]'
    };

    const prefixo = prefixos[notificacao.prioridade] || '[INFO]';
    return `${prefixo} ${notificacao.titulo}`;
  }

  gerarConteudoHtmlNotificacao(notificacao, usuario) {
    const corPrioridade = {
      'critica': '#dc3545',
      'alta': '#fd7e14',
      'normal': '#0d6efd',
      'baixa': '#6c757d'
    };

    const cor = corPrioridade[notificacao.prioridade] || '#0d6efd';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${notificacao.titulo}</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          .header {
            background: ${cor};
            color: white;
            padding: 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
          }
          .priority-badge {
            display: inline-block;
            background: rgba(255,255,255,0.2);
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            margin-top: 8px;
          }
          .content {
            padding: 30px;
          }
          .greeting {
            font-size: 16px;
            margin-bottom: 20px;
            color: #666;
          }
          .message {
            background: #f8f9fa;
            border-left: 4px solid ${cor};
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 4px 4px 0;
          }
          .details {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
          }
          .details table {
            width: 100%;
            border-collapse: collapse;
          }
          .details td {
            padding: 8px 0;
            border-bottom: 1px solid #dee2e6;
          }
          .details td:first-child {
            font-weight: 600;
            color: #495057;
            width: 120px;
          }
          .action-button {
            display: inline-block;
            background: ${cor};
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 4px;
            font-weight: 600;
            margin: 20px 0;
            text-align: center;
          }
          .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #6c757d;
            font-size: 14px;
            border-top: 1px solid #dee2e6;
          }
          .footer p {
            margin: 5px 0;
          }
          @media (max-width: 600px) {
            .container {
              margin: 10px;
              border-radius: 0;
            }
            .content {
              padding: 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${notificacao.titulo}</h1>
            <div class="priority-badge">Prioridade: ${notificacao.prioridade.toUpperCase()}</div>
          </div>
          
          <div class="content">
            <div class="greeting">
              Olá, ${usuario.nome}
            </div>
            
            <div class="message">
              ${notificacao.mensagem.replace(/\n/g, '<br>')}
            </div>
            
            <div class="details">
              <table>
                <tr>
                  <td>Tipo:</td>
                  <td>${this.formatarTipoNotificacao(notificacao.tipo)}</td>
                </tr>
                <tr>
                  <td>Data:</td>
                  <td>${new Date(notificacao.created_at).toLocaleString('pt-BR')}</td>
                </tr>
                ${notificacao.categoria ? `
                <tr>
                  <td>Categoria:</td>
                  <td>${notificacao.categoria}</td>
                </tr>
                ` : ''}
                ${notificacao.remetente ? `
                <tr>
                  <td>Enviado por:</td>
                  <td>${notificacao.remetente.nome}</td>
                </tr>
                ` : ''}
              </table>
            </div>
            
            ${notificacao.link ? `
            <div style="text-align: center;">
              <a href="${notificacao.link}" class="action-button">
                Ver Detalhes
              </a>
            </div>
            ` : ''}
          </div>
          
          <div class="footer">
            <p><strong>Sistema de Manutenção</strong></p>
            <p>Este é um email automático, não responda a esta mensagem.</p>
            <p>Para alterar suas preferências de notificação, acesse o sistema.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return html;
  }

  formatarTipoNotificacao(tipo) {
    const tipos = {
      'info': 'Informação',
      'success': 'Sucesso',
      'warning': 'Aviso',
      'error': 'Erro',
      'sistema': 'Sistema',
      'ordem_criada': 'Nova Ordem de Serviço',
      'ordem_atualizada': 'Ordem de Serviço Atualizada',
      'manutencao_vencida': 'Manutenção Vencida',
      'ativo_problema': 'Problema em Ativo',
      'estoque_baixo': 'Estoque Baixo'
    };

    return tipos[tipo] || tipo;
  }

  extrairTextoDeHtml(html) {
    // Remove tags HTML básicas e converte para texto simples
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  }

  async enviarResumoNotificacoes(usuario, notificacoes, periodo) {
    try {
      const assunto = `Resumo de Notificações - ${periodo}`;
      const conteudoHtml = this.gerarConteudoResumo(usuario, notificacoes, periodo);
      
      return await this.enviarEmail(
        usuario.email,
        assunto,
        conteudoHtml
      );
    } catch (error) {
      logger.error('Erro ao enviar resumo de notificações:', error);
      return {
        sucesso: false,
        erro: error.message
      };
    }
  }

  gerarConteudoResumo(usuario, notificacoes, periodo) {
    const total = notificacoes.length;
    const porTipo = {};
    const porPrioridade = {};

    notificacoes.forEach(notif => {
      porTipo[notif.tipo] = (porTipo[notif.tipo] || 0) + 1;
      porPrioridade[notif.prioridade] = (porPrioridade[notif.prioridade] || 0) + 1;
    });

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Resumo de Notificações</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #0d6efd; padding-bottom: 20px; }
          .summary { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .notification-item { border-bottom: 1px solid #dee2e6; padding: 10px 0; }
          .footer { text-align: center; color: #6c757d; font-size: 14px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Resumo de Notificações</h1>
            <p>Olá, ${usuario.nome}! Aqui está seu resumo ${periodo}.</p>
          </div>
          
          <div class="summary">
            <h3>Estatísticas</h3>
            <p><strong>Total de notificações:</strong> ${total}</p>
            
            <h4>Por tipo:</h4>
            ${Object.entries(porTipo).map(([tipo, count]) => 
              `<p>${this.formatarTipoNotificacao(tipo)}: ${count}</p>`
            ).join('')}
            
            <h4>Por prioridade:</h4>
            ${Object.entries(porPrioridade).map(([prioridade, count]) => 
              `<p>${prioridade.charAt(0).toUpperCase() + prioridade.slice(1)}: ${count}</p>`
            ).join('')}
          </div>
          
          <div class="footer">
            <p>Sistema de Manutenção - Email automático</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return html;
  }

  async testarConexao() {
    const conexaoOk = await this.verificarConexao();
    
    if (conexaoOk) {
      logger.info('Teste de conexão de email: SUCESSO');
      return { sucesso: true, mensagem: 'Conexão estabelecida com sucesso' };
    } else {
      logger.error('Teste de conexão de email: FALHA');
      return { sucesso: false, mensagem: 'Falha na conexão com servidor de email' };
    }
  }
}

module.exports = new EmailService();