// Controller simplificado para upload funcional
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Ativo, AtivoImagem } = require('../models');
const logger = require('../config/logger');

// Configuração do multer para salvar arquivos físicos temporariamente
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/ativos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const ext = path.extname(file.originalname);
    const filename = `ativo_${req.params.id}_${timestamp}_${random}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 5
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido'), false);
    }
  }
});

class SimpleUploadController {
  
  async uploadImagens(req, res) {
    try {
      console.log('🖼️ UPLOAD SIMPLES - Iniciando...');
      console.log('Params:', req.params);
      console.log('Files:', req.files?.length || 0);
      
      const ativoId = parseInt(req.params.id);
      
      // Verificar se o ativo existe
      const ativo = await Ativo.findByPk(ativoId);
      if (!ativo) {
        return res.status(404).json({
          success: false,
          message: 'Ativo não encontrado'
        });
      }
      
      console.log('✅ Ativo encontrado:', ativo.codigo_patrimonio);
      
      // Verificar se tem arquivos
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Nenhuma imagem foi enviada'
        });
      }
      
      console.log(`📁 ${req.files.length} arquivo(s) recebido(s)`);
      
      // Verificar limite
      const imagensExistentes = await AtivoImagem.count({ 
        where: { ativo_id: ativoId } 
      });
      
      if (imagensExistentes + req.files.length > 5) {
        // Limpar arquivos uploadeados
        req.files.forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
        
        return res.status(400).json({
          success: false,
          message: `Limite de 5 imagens atingido. Você tem ${imagensExistentes} e está tentando adicionar ${req.files.length}.`
        });
      }
      
      const imagensSalvas = [];
      
      // Processar cada arquivo
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        console.log(`📷 Processando: ${file.originalname}`);
        
        try {
          // Salvar metadados no banco
          const imagemRecord = await AtivoImagem.create({
            ativo_id: ativoId,
            nome_arquivo: file.filename,
            caminho: `/api/ativos/${ativoId}/imagens/${file.filename}/download`,
            tipo: file.mimetype,
            tamanho: file.size,
            ordem: imagensExistentes + i
          });
          
          console.log(`✅ Metadados salvos: ID ${imagemRecord.id}`);
          
          imagensSalvas.push({
            id: imagemRecord.id,
            nome_original: file.originalname,
            nome_arquivo: file.filename,
            tipo: file.mimetype,
            tamanho: file.size,
            url: imagemRecord.caminho
          });
          
        } catch (fileError) {
          console.error(`❌ Erro no arquivo ${file.originalname}:`, fileError);
          
          // Limpar arquivo em caso de erro
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
          
          throw fileError;
        }
      }
      
      console.log(`🎉 ${imagensSalvas.length} imagens salvas com sucesso`);
      
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
      console.error('❌ ERRO NO UPLOAD:', error);
      
      // Limpar arquivos em caso de erro
      if (req.files) {
        req.files.forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Erro interno no servidor',
        error: error.message
      });
    }
  }
  
  // Download de imagem
  async downloadImagem(req, res) {
    try {
      const { id, filename } = req.params;
      const filePath = path.join(__dirname, '../uploads/ativos', filename);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: 'Imagem não encontrada'
        });
      }
      
      res.sendFile(filePath);
      
    } catch (error) {
      console.error('Erro no download:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao fazer download da imagem'
      });
    }
  }
  
  // Remover imagem
  async removerImagem(req, res) {
    try {
      const { id, imagemId } = req.params;
      
      const imagem = await AtivoImagem.findOne({
        where: { 
          id: imagemId,
          ativo_id: id 
        }
      });
      
      if (!imagem) {
        return res.status(404).json({
          success: false,
          message: 'Imagem não encontrada'
        });
      }
      
      // Remover arquivo físico
      const filePath = path.join(__dirname, '../uploads/ativos', imagem.nome_arquivo);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      // Remover do banco
      await imagem.destroy();
      
      res.json({
        success: true,
        message: 'Imagem removida com sucesso'
      });
      
    } catch (error) {
      console.error('Erro ao remover imagem:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao remover imagem'
      });
    }
  }
  
  getUploadMiddleware() {
    return upload.array('imagens', 5);
  }
}

module.exports = new SimpleUploadController();