// backend/services/ImageStorageService.js (refatorado para filesystem puro)
const path = require('path');
const fs = require('fs');
const fsp = require('fs').promises;
const logger = require('../config/logger');

class ImageStorageService {
  constructor() {
    this.baseDir = path.join(__dirname, '..', 'uploads', 'imagens');
    this.ensureBaseDir();
  }

  ensureBaseDir() {
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
      logger.info('📁 Diretório base de imagens criado', { dir: this.baseDir });
    }
  }

  buildFilePath(key) {
    return path.join(this.baseDir, `${key}.bin`);
  }

  async saveImage(key, imageBuffer) {
    const filePath = this.buildFilePath(key);
    const start = Date.now();
    await fsp.writeFile(filePath, imageBuffer);
    const duration = Date.now() - start;
    logger.info('💾 Imagem salva em disco', { key, size: imageBuffer.length, duration: `${duration}ms` });
    return key;
  }

  async getImage(key) {
    const filePath = this.buildFilePath(key);
    try {
      const start = Date.now();
      const data = await fsp.readFile(filePath);
      logger.info('📥 Imagem lida do disco', { key, size: data.length, duration: `${Date.now() - start}ms` });
      return data;
    } catch (err) {
      if (err.code === 'ENOENT') {
        logger.warn('⚠️ Imagem não encontrada em disco', { key });
        return null;
      }
      logger.error('❌ Erro ao ler imagem em disco', { key, error: err.message });
      throw err;
    }
  }

  async deleteImage(key) {
    const filePath = this.buildFilePath(key);
    try {
      await fsp.unlink(filePath);
      logger.info('🗑️ Imagem removida do disco', { key });
    } catch (err) {
      if (err.code === 'ENOENT') {
        logger.warn('Imagem já inexistente ao remover', { key });
        return;
      }
      logger.error('❌ Erro ao remover imagem do disco', { key, error: err.message });
      throw err;
    }
  }

  async listImages(ativoId) {
    const prefix = `ativo_${ativoId}_`;
    const files = await fsp.readdir(this.baseDir);
    const result = [];
    for (const file of files) {
      if (file.startsWith(prefix)) {
        const full = path.join(this.baseDir, file);
        const stat = await fsp.stat(full);
        result.push({ key: file.replace(/\.bin$/, ''), size: stat.size });
      }
    }
    logger.info('📋 Imagens listadas em disco', { ativoId, count: result.length });
    return result;
  }

  async getStats() {
    const files = await fsp.readdir(this.baseDir);
    let totalSize = 0;
    for (const file of files) {
      if (!file.endsWith('.bin')) continue;
      const stat = await fsp.stat(path.join(this.baseDir, file));
      totalSize += stat.size;
    }
    const stats = {
      totalImages: files.filter(f => f.endsWith('.bin')).length,
      totalSize,
      totalSizeFormatted: `${(totalSize / 1024 / 1024).toFixed(2)}MB`
    };
    logger.info('📊 Estatísticas de imagens (filesystem)', stats);
    return stats;
  }

  async close() {
    // Nada a fechar para filesystem puro
  }
}

// Singleton para evitar múltiplas instâncias
let instance = null;

function getInstance() {
  if (!instance) {
    instance = new ImageStorageService();
  }
  return instance;
}

module.exports = getInstance();