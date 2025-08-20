const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs').promises;

class QRCodeService {
  constructor() {
    this.uploadsDir = path.join(__dirname, '..', 'uploads', 'qrcodes');
    this.ensureUploadsDir();
  }

  async ensureUploadsDir() {
    try {
      await fs.mkdir(this.uploadsDir, { recursive: true });
    } catch (error) {
      console.error('Erro ao criar diretório de QR codes:', error);
    }
  }

  /**
   * Gera QR code para um ativo
   * @param {Object} ativo - Dados do ativo
   * @returns {Promise<string>} - URL do QR code gerado
   */
  async generateAtivoQRCode(ativo) {
    try {
      // Dados que serão codificados no QR code
      const qrData = {
        tipo: 'ativo',
        id: ativo.id,
        codigo: ativo.codigo_patrimonio,
        nome: ativo.nome,
        localizacao: ativo.localizacao_completa,
        criticidade: ativo.criticidade,
        url: `${process.env.FRONTEND_URL || 'http://localhost:3002'}/ativos/${ativo.id}`,
        timestamp: new Date().toISOString()
      };

      // Converter para JSON
      const qrString = JSON.stringify(qrData);

      // Nome do arquivo
      const fileName = `ativo_${ativo.codigo_patrimonio}_${Date.now()}.png`;
      const filePath = path.join(this.uploadsDir, fileName);

      // Gerar QR code
      await QRCode.toFile(filePath, qrString, {
        width: 300,
        margin: 2,
        color: {
          dark: '#2c3e50',
          light: '#ffffff'
        }
      });

      // Retornar URL relativa
      return `/uploads/qrcodes/${fileName}`;

    } catch (error) {
      console.error('Erro ao gerar QR code:', error);
      throw new Error('Erro ao gerar QR code para o ativo');
    }
  }

  /**
   * Gera QR code para ordem de serviço
   * @param {Object} os - Dados da ordem de serviço
   * @returns {Promise<string>} - URL do QR code gerado
   */
  async generateOrdemServicoQRCode(os) {
    try {
      const qrData = {
        tipo: 'ordem_servico',
        id: os.id,
        numero: os.numero_os,
        ativo_codigo: os.ativo?.codigo_patrimonio,
        status: os.status,
        prioridade: os.prioridade,
        url: `${process.env.FRONTEND_URL || 'http://localhost:3002'}/ordens-servico/${os.id}`,
        timestamp: new Date().toISOString()
      };

      const qrString = JSON.stringify(qrData);
      const fileName = `os_${os.numero_os}_${Date.now()}.png`;
      const filePath = path.join(this.uploadsDir, fileName);

      await QRCode.toFile(filePath, qrString, {
        width: 250,
        margin: 2,
        color: {
          dark: '#2c3e50',
          light: '#ffffff'
        }
      });

      return `/uploads/qrcodes/${fileName}`;

    } catch (error) {
      console.error('Erro ao gerar QR code para OS:', error);
      throw new Error('Erro ao gerar QR code para a ordem de serviço');
    }
  }

  /**
   * Gera QR code simples com texto/URL
   * @param {string} data - Dados para codificar
   * @param {string} prefix - Prefixo para o nome do arquivo
   * @returns {Promise<string>} - URL do QR code gerado
   */
  async generateSimpleQRCode(data, prefix = 'qr') {
    try {
      const fileName = `${prefix}_${Date.now()}.png`;
      const filePath = path.join(this.uploadsDir, fileName);

      await QRCode.toFile(filePath, data, {
        width: 250,
        margin: 2,
        color: {
          dark: '#2c3e50',
          light: '#ffffff'
        }
      });

      return `/uploads/qrcodes/${fileName}`;

    } catch (error) {
      console.error('Erro ao gerar QR code simples:', error);
      throw new Error('Erro ao gerar QR code');
    }
  }

  /**
   * Remove arquivo de QR code antigo
   * @param {string} qrUrl - URL do QR code a ser removido
   */
  async removeOldQRCode(qrUrl) {
    try {
      if (!qrUrl) return;

      const fileName = path.basename(qrUrl);
      const filePath = path.join(this.uploadsDir, fileName);

      await fs.unlink(filePath);
    } catch (error) {
      // Ignorar erros de arquivo não encontrado
      if (error.code !== 'ENOENT') {
        console.error('Erro ao remover QR code antigo:', error);
      }
    }
  }

  /**
   * Valida dados de QR code decodificado
   * @param {string} qrString - String do QR code
   * @returns {Object|null} - Dados decodificados ou null se inválido
   */
  validateQRCode(qrString) {
    try {
      const data = JSON.parse(qrString);
      
      // Verificar estrutura básica
      if (!data.tipo || !data.id) {
        return null;
      }

      // Verificar timestamp (não mais que 30 dias)
      if (data.timestamp) {
        const qrDate = new Date(data.timestamp);
        const now = new Date();
        const diffDays = (now - qrDate) / (1000 * 60 * 60 * 24);
        
        if (diffDays > 30) {
          console.warn('QR code expirado:', data);
        }
      }

      return data;

    } catch (error) {
      console.error('QR code inválido:', error);
      return null;
    }
  }
}

module.exports = new QRCodeService();