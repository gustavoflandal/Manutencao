// backend/controllers/AtivoControllerLevel.js
const Ativo = require('../models/Ativo');
const AtivoImagem = require('../models/AtivoImagem');
const imageStorageService = require('../services/ImageStorageService');
const multer = require('multer');
const path = require('path');

// Configuração do multer para armazenar em memória
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 5
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo inválido. Apenas JPEG, JPG, PNG e GIF são permitidos.'));
    }
  }
});

class AtivoControllerLevel {
  constructor() {
    // Inicializar o serviço de armazenamento
    this.initializeService();
  }

  async initializeService() {
    try {
      await imageStorageService.initialize();
      console.log('Serviço de armazenamento Level inicializado');
    } catch (error) {
      console.error('Erro ao inicializar serviço Level:', error);
    }
  }

  // CRUD básico de ativos (sem alteração)
  async index(req, res) {
    try {
      const ativos = await Ativo.findAll({
        order: [['updatedAt', 'DESC']]
      });
      res.json(ativos);
    } catch (error) {
      console.error('Erro ao listar ativos:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async show(req, res) {
    try {
      const ativo = await Ativo.findByPk(req.params.id);
      if (!ativo) {
        return res.status(404).json({ error: 'Ativo não encontrado' });
      }
      res.json(ativo);
    } catch (error) {
      console.error('Erro ao buscar ativo:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async store(req, res) {
    try {
      const ativo = await Ativo.create(req.body);
      res.status(201).json(ativo);
    } catch (error) {
      console.error('Erro ao criar ativo:', error);
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({ 
          error: 'Dados inválidos', 
          details: error.errors.map(e => e.message) 
        });
      }
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async update(req, res) {
    try {
      const ativo = await Ativo.findByPk(req.params.id);
      if (!ativo) {
        return res.status(404).json({ error: 'Ativo não encontrado' });
      }

      await ativo.update(req.body);
      res.json(ativo);
    } catch (error) {
      console.error('Erro ao atualizar ativo:', error);
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({ 
          error: 'Dados inválidos', 
          details: error.errors.map(e => e.message) 
        });
      }
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async destroy(req, res) {
    try {
      const ativo = await Ativo.findByPk(req.params.id);
      if (!ativo) {
        return res.status(404).json({ error: 'Ativo não encontrado' });
      }

      // Remover todas as imagens do Level antes de excluir o ativo
      await this.removerTodasImagensAtivo(req.params.id);

      await ativo.destroy();
      res.status(204).send();
    } catch (error) {
      console.error('Erro ao excluir ativo:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Métodos para manipulação de imagens com Level
  async uploadImagens(req, res) {
    const uploadMiddleware = upload.array('imagens', 5);
    
    uploadMiddleware(req, res, async (err) => {
      if (err) {
        console.error('Erro no upload:', err);
        return res.status(400).json({ error: err.message });
      }

      try {
        const ativoId = req.params.id;
        const ativo = await Ativo.findByPk(ativoId);
        
        if (!ativo) {
          return res.status(404).json({ error: 'Ativo não encontrado' });
        }

        if (!req.files || req.files.length === 0) {
          return res.status(400).json({ error: 'Nenhuma imagem foi enviada' });
        }

        const imagensSalvas = [];

        for (const file of req.files) {
          // Gerar chave única para a imagem
          const timestamp = Date.now();
          const random = Math.random().toString(36).substr(2, 9);
          const key = `ativo_${ativoId}_${timestamp}_${random}`;
          
          // Salvar no Level
          await imageStorageService.saveImage(key, file.buffer);
          
          // Criar registro no banco de dados
          const imagemRecord = await AtivoImagem.create({
            ativo_id: ativoId,
            nome_original: file.originalname,
            nome_arquivo: key,
            tamanho: file.size,
            tipo_mime: file.mimetype
          });

          imagensSalvas.push({
            id: imagemRecord.id,
            nome_original: imagemRecord.nome_original,
            key: key,
            tamanho: imagemRecord.tamanho,
            tipo_mime: imagemRecord.tipo_mime
          });
        }

        res.json({
          message: `${imagensSalvas.length} imagem(ns) salva(s) com sucesso`,
          imagens: imagensSalvas
        });

      } catch (error) {
        console.error('Erro ao salvar imagens:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
      }
    });
  }

  async listarImagens(req, res) {
    try {
      const ativoId = req.params.id;
      const imagens = await AtivoImagem.findAll({
        where: { ativo_id: ativoId },
        order: [['createdAt', 'DESC']]
      });

      const imagensComUrl = imagens.map(img => ({
        id: img.id,
        nome_original: img.nome_original,
        key: img.nome_arquivo,
        tamanho: img.tamanho,
        tipo_mime: img.tipo_mime,
        url: `/api/ativos/${ativoId}/imagens/${img.nome_arquivo}/download`,
        createdAt: img.createdAt
      }));

      res.json(imagensComUrl);
    } catch (error) {
      console.error('Erro ao listar imagens:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async downloadImagem(req, res) {
    try {
      const { key } = req.params;
      
      // Buscar registro no banco para validação
      const imagemRecord = await AtivoImagem.findOne({
        where: { nome_arquivo: key }
      });

      if (!imagemRecord) {
        return res.status(404).json({ error: 'Imagem não encontrada' });
      }

      // Recuperar do Level
      const imageBuffer = await imageStorageService.getImage(key);
      
      if (!imageBuffer) {
        return res.status(404).json({ error: 'Dados da imagem não encontrados' });
      }

      // Configurar headers
      res.setHeader('Content-Type', imagemRecord.tipo_mime);
      res.setHeader('Content-Length', imageBuffer.length);
      res.setHeader('Content-Disposition', `inline; filename="${imagemRecord.nome_original}"`);
      
      res.send(imageBuffer);
    } catch (error) {
      console.error('Erro ao baixar imagem:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

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
        return res.status(404).json({ error: 'Imagem não encontrada' });
      }

      // Remover do Level
      await imageStorageService.deleteImage(imagem.nome_arquivo);
      
      // Remover registro do banco
      await imagem.destroy();

      res.json({ message: 'Imagem removida com sucesso' });
    } catch (error) {
      console.error('Erro ao remover imagem:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async removerTodasImagensAtivo(ativoId) {
    try {
      const imagens = await AtivoImagem.findAll({
        where: { ativo_id: ativoId }
      });

      for (const imagem of imagens) {
        try {
          await imageStorageService.deleteImage(imagem.nome_arquivo);
        } catch (error) {
          console.error(`Erro ao remover imagem ${imagem.nome_arquivo} do Level:`, error);
        }
      }

      await AtivoImagem.destroy({
        where: { ativo_id: ativoId }
      });
    } catch (error) {
      console.error('Erro ao remover todas as imagens do ativo:', error);
      throw error;
    }
  }

  // Estatísticas do sistema
  async estatisticas(req, res) {
    try {
      const stats = await imageStorageService.getStats();
      const totalAtivos = await Ativo.count();
      const totalImagens = await AtivoImagem.count();
      
      res.json({
        ativos: totalAtivos,
        imagens: totalImagens,
        storage: stats
      });
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}

module.exports = new AtivoControllerLevel();