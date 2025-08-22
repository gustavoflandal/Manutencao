// Upload de imagens simplificado e funcional
const multer = require('multer');
const path = require('path');
const { Ativo, AtivoImagem } = require('../models');
const logger = require('../config/logger');
const imageStorageService = require('../services/ImageStorageService');

// Configuração do multer para memória
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 5 // máximo 5 arquivos
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido. Use JPEG, PNG ou WebP.'), false);
    }
  }
});

class ImageUploadController {
  
  // Upload de imagens
  async uploadImagens(req, res) {
    try {
      console.log('🖼️ Iniciando upload de imagens...');
      
      const ativoId = req.params.id;
      console.log('📋 Ativo ID:', ativoId);
      
      // Verificar se o ativo existe
      const ativo = await Ativo.findByPk(ativoId);
      if (!ativo) {
        return res.status(404).json({
          success: false,
          message: 'Ativo não encontrado'
        });
      }
      
      // Verificar se tem arquivos
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Nenhuma imagem foi enviada'
        });
      }
      
      console.log('📁 Arquivos recebidos:', req.files.length);
      
      // Verificar limite de imagens
      const imagensExistentes = await AtivoImagem.count({ 
        where: { ativo_id: ativoId } 
      });
      
      if (imagensExistentes + req.files.length > 5) {
        return res.status(400).json({
          success: false,
          message: `Limite de 5 imagens atingido. Você tem ${imagensExistentes} e está tentando adicionar ${req.files.length}.`
        });
      }
      
      const imagensSalvas = [];
      
      // Processar cada arquivo
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        console.log(`📷 Processando arquivo ${i + 1}: ${file.originalname}`);
        
        try {
          // Gerar chave única
          const timestamp = Date.now();
          const random = Math.random().toString(36).substr(2, 9);
          const levelKey = `ativo_${ativoId}_${timestamp}_${random}_${i}`;
          
          console.log(`💾 Salvando no Level: ${levelKey}`);
          
          // Verificar se o imageStorageService está pronto
          if (!imageStorageService.isInitialized) {
            throw new Error('Serviço de imagens não está inicializado');
          }
          
          // Salvar no Level
          await imageStorageService.saveImage(levelKey, file.buffer);
          console.log(`✅ Salvo no Level: ${levelKey}`);
          
          // Salvar metadados no MySQL
          const imagemRecord = await AtivoImagem.create({
            ativo_id: parseInt(ativoId),
            nome_arquivo: levelKey,
            caminho: `/api/ativos/${ativoId}/imagens/${levelKey}/download`,
            tipo: file.mimetype,
            tamanho: file.size,
            ordem: imagensExistentes + i
          });
          
          console.log(`✅ Metadados salvos no MySQL: ID ${imagemRecord.id}`);
          
          imagensSalvas.push({
            id: imagemRecord.id,
            levelKey: levelKey,
            nome_original: file.originalname,
            tipo: file.mimetype,
            tamanho: file.size,
            url: imagemRecord.caminho
          });
          
        } catch (fileError) {
          console.error(`❌ Erro ao processar arquivo ${file.originalname}:`, fileError);
          throw fileError;
        }
      }
      
      console.log(`🎉 ${imagensSalvas.length} imagens processadas com sucesso`);
      
      // Log de sucesso
      logger.info(`📸 Upload concluído`, {
        ativo_id: ativoId,
        ativo_codigo: ativo.codigo_patrimonio,
        imagens_count: imagensSalvas.length,
        total_size: imagensSalvas.reduce((acc, img) => acc + img.tamanho, 0),
        user_id: req.user?.id || 'unknown',
        operation: 'UPLOAD_SUCCESS'
      });
      
      res.json({
        success: true,
        message: `${imagensSalvas.length} imagem(ns) enviada(s) com sucesso`,
        data: { 
          imagens: imagensSalvas,
          ativo: {
            id: ativo.id,
            codigo: ativo.codigo_patrimonio,
            nome: ativo.nome
          }
        }
      });
      
    } catch (error) {
      console.error('❌ Erro no upload:', error);
      
      logger.error('Upload failed', {
        ativo_id: req.params.id,
        error: error.message,
        stack: error.stack,
        operation: 'UPLOAD_ERROR'
      });
      
      res.status(500).json({
        success: false,
        message: 'Erro interno no servidor durante o upload',
        error: error.message
      });
    }
  }
  
  // Middleware do multer
  getUploadMiddleware() {
    return upload.array('imagens', 5);
  }
}

module.exports = new ImageUploadController();