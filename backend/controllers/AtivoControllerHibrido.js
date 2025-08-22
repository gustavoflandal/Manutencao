// backend/controllers/AtivoControllerHibrido.js
const { Ativo, Category, SubCategory, Department, User, Setor, AtivoImagem } = require('../models');
const { Op } = require('sequelize');
const logger = require('../config/logger');
const QRCodeService = require('../services/QRCodeService');
const AuditoriaService = require('../services/AuditoriaService');
const imageStorageService = require('../services/ImageStorageService');
const multer = require('multer');
const path = require('path');

// Configuração do multer para armazenar em memória (Level)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 5
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo inválido. Apenas JPEG, JPG, PNG, WEBP e GIF são permitidos.'));
    }
  }
});

class AtivoControllerHibrido {
  constructor() {
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

  // Listar ativos com paginação e filtros
  async index(req, res, next) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        search = '', 
        estado = '', 
        categoria_id = '',
        criticidade = '',
        department_id = '',
        responsavel_id = '',
        orderBy = 'nome',
        orderDirection = 'ASC'
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);
      
      // Construir filtros
      const whereClause = { ativo: true };
      
      if (search) {
        whereClause[Op.or] = [
          { codigo_patrimonio: { [Op.like]: `%${search}%` } },
          { nome: { [Op.like]: `%${search}%` } },
          { fabricante: { [Op.like]: `%${search}%` } },
          { modelo: { [Op.like]: `%${search}%` } },
          { numero_serie: { [Op.like]: `%${search}%` } },
          { localizacao_completa: { [Op.like]: `%${search}%` } }
        ];
      }
      
      if (estado) whereClause.estado = estado;
      if (categoria_id) whereClause.categoria_id = categoria_id;
      if (criticidade) whereClause.criticidade = criticidade;
      if (department_id) whereClause.department_id = department_id;
      if (responsavel_id) whereClause.responsavel_id = responsavel_id;

      const { count, rows: ativos } = await Ativo.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Category,
            as: 'categoria',
            attributes: ['id', 'nome']
          },
          {
            model: Department,
            as: 'department',
            attributes: ['id', 'nome']
          },
          {
            model: User,
            as: 'responsavel',
            attributes: ['id', 'nome', 'email']
          }
        ],
        order: [[orderBy, orderDirection]],
        limit: parseInt(limit),
        offset
      });

      res.json({
        success: true,
        data: {
          ativos,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / parseInt(limit)),
            totalItems: count,
            itemsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      logger.error('Erro ao listar ativos:', error);
      next(error);
    }
  }

  // Buscar ativo por ID
  async show(req, res, next) {
    try {
      const { id } = req.params;

      const ativo = await Ativo.findByPk(id, {
        include: [
          {
            model: Category,
            as: 'categoria',
            attributes: ['id', 'nome']
          },
          {
            model: Department,
            as: 'department',
            attributes: ['id', 'nome']
          },
          {
            model: User,
            as: 'responsavel',
            attributes: ['id', 'nome', 'email']
          }
        ]
      });

      if (!ativo) {
        return res.status(404).json({
          success: false,
          message: 'Ativo não encontrado'
        });
      }

      res.json({
        success: true,
        data: { ativo }
      });

    } catch (error) {
      logger.error('Erro ao buscar ativo:', error);
      next(error);
    }
  }

  // Criar ativo
  async store(req, res, next) {
    try {
      const ativo = await Ativo.create(req.body);

      await AuditoriaService.log(
        req.user?.id || null,
        'CREATE',
        'ativos',
        ativo.id,
        null,
        ativo.toJSON(),
        req.ip,
        req.get('User-Agent')
      );

      logger.info(`Ativo criado: ${ativo.codigo_patrimonio}`, {
        ativo_id: ativo.id,
        user_id: req.user?.id
      });

      res.status(201).json({
        success: true,
        message: 'Ativo criado com sucesso',
        data: { ativo }
      });

    } catch (error) {
      logger.error('Erro ao criar ativo:', error);
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({ 
          success: false,
          message: 'Dados inválidos', 
          errors: error.errors.map(e => e.message) 
        });
      }
      next(error);
    }
  }

  // Atualizar ativo
  async update(req, res, next) {
    try {
      const { id } = req.params;
      
      const ativo = await Ativo.findByPk(id);
      if (!ativo) {
        return res.status(404).json({
          success: false,
          message: 'Ativo não encontrado'
        });
      }

      const dadosAnteriores = ativo.toJSON();
      await ativo.update(req.body);

      await AuditoriaService.log(
        req.user?.id || null,
        'UPDATE',
        'ativos',
        ativo.id,
        dadosAnteriores,
        ativo.toJSON(),
        req.ip,
        req.get('User-Agent')
      );

      logger.info(`Ativo atualizado: ${ativo.codigo_patrimonio}`, {
        ativo_id: ativo.id,
        user_id: req.user?.id
      });

      res.json({
        success: true,
        message: 'Ativo atualizado com sucesso',
        data: { ativo }
      });

    } catch (error) {
      logger.error('Erro ao atualizar ativo:', error);
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({ 
          success: false,
          message: 'Dados inválidos', 
          errors: error.errors.map(e => e.message) 
        });
      }
      next(error);
    }
  }

  // Excluir ativo
  async destroy(req, res, next) {
    try {
      const { id } = req.params;
      
      const ativo = await Ativo.findByPk(id);
      if (!ativo) {
        return res.status(404).json({
          success: false,
          message: 'Ativo não encontrado'
        });
      }

      // Remover todas as imagens do Level antes de excluir o ativo
      await this.removerTodasImagensAtivo(id);

      const dadosAnteriores = ativo.toJSON();
      await ativo.destroy();

      await AuditoriaService.log(
        req.user?.id || null,
        'DELETE',
        'ativos',
        id,
        dadosAnteriores,
        null,
        req.ip,
        req.get('User-Agent')
      );

      logger.info(`Ativo excluído: ${ativo.codigo_patrimonio}`, {
        ativo_id: id,
        user_id: req.user?.id
      });

      res.json({
        success: true,
        message: 'Ativo excluído com sucesso'
      });

    } catch (error) {
      logger.error('Erro ao excluir ativo:', error);
      next(error);
    }
  }

  // Estatísticas gerais dos ativos
  async stats(req, res, next) {
    try {
      const { department_id } = req.query;
      
      const whereClause = { ativo: true };
      if (department_id) whereClause.department_id = department_id;

      const [
        total,
        operacional,
        manutencao,
        parado,
        inativo,
        baixa,
        media,
        alta,
        critica
      ] = await Promise.all([
        Ativo.count({ where: whereClause }),
        Ativo.count({ where: { ...whereClause, estado: 'operacional' } }),
        Ativo.count({ where: { ...whereClause, estado: 'manutencao' } }),
        Ativo.count({ where: { ...whereClause, estado: 'parado' } }),
        Ativo.count({ where: { ...whereClause, estado: 'inativo' } }),
        Ativo.count({ where: { ...whereClause, criticidade: 'baixa' } }),
        Ativo.count({ where: { ...whereClause, criticidade: 'media' } }),
        Ativo.count({ where: { ...whereClause, criticidade: 'alta' } }),
        Ativo.count({ where: { ...whereClause, criticidade: 'critica' } })
      ]);

      res.json({
        success: true,
        data: {
          total,
          operacional,
          manutencao,
          parado,
          inativo,
          baixa,
          media,
          alta,
          critica
        }
      });

    } catch (error) {
      logger.error('Erro ao obter estatísticas dos ativos:', error);
      next(error);
    }
  }

  // ===== MÉTODOS DE IMAGENS COM LEVEL =====

  // Upload de imagens usando Level
  async uploadImagens(req, res, next) {
    const uploadMiddleware = upload.array('imagens', 5);
    
    uploadMiddleware(req, res, async (err) => {
      if (err) {
        console.error('Erro no upload:', err);
        return res.status(400).json({ 
          success: false,
          message: err.message 
        });
      }

      try {
        const ativoId = req.params.id;
        const ativo = await Ativo.findByPk(ativoId);
        
        if (!ativo) {
          return res.status(404).json({ 
            success: false,
            message: 'Ativo não encontrado' 
          });
        }

        if (!req.files || req.files.length === 0) {
          return res.status(400).json({ 
            success: false,
            message: 'Nenhuma imagem foi enviada' 
          });
        }

        // Verificar limite de imagens
        const imagensExistentes = await AtivoImagem.count({ where: { ativo_id: ativoId }});
        const novasImagens = req.files.length;
        
        if (imagensExistentes + novasImagens > 5) {
          return res.status(400).json({
            success: false,
            message: `Limite de 5 imagens atingido. Você tem ${imagensExistentes} imagens e está tentando adicionar ${novasImagens}.`
          });
        }

        const imagensSalvas = [];

        for (const file of req.files) {
          // Gerar chave única para a imagem
          const timestamp = Date.now();
          const random = Math.random().toString(36).substr(2, 9);
          const key = `ativo_${ativoId}_${timestamp}_${random}`;
          
          // Salvar no Level
          await imageStorageService.saveImage(key, file.buffer);
          
          // Criar registro no banco de dados MySQL
          const imagemRecord = await AtivoImagem.create({
            ativo_id: ativoId,
            nome_arquivo: key, // Chave Level como nome_arquivo
            caminho: `/api/ativos/${ativoId}/imagens/${key}/download`, // URL de download
            tipo: file.mimetype,
            tamanho: file.size,
            ordem: imagensExistentes + imagensSalvas.length
          });

          imagensSalvas.push({
            id: imagemRecord.id,
            nome_arquivo: key,
            caminho: imagemRecord.caminho,
            tipo: imagemRecord.tipo,
            tamanho: imagemRecord.tamanho,
            ordem: imagemRecord.ordem
          });
        }

        logger.info(`Imagens adicionadas ao ativo ${ativo.codigo_patrimonio}`, {
          ativo_id: ativoId,
          quantidade: imagensSalvas.length,
          user_id: req.user?.id
        });

        res.json({
          success: true,
          message: `${imagensSalvas.length} imagem(ns) salva(s) com sucesso`,
          data: { imagens: imagensSalvas }
        });

      } catch (error) {
        console.error('Erro ao salvar imagens:', error);
        logger.error('Erro ao salvar imagens:', error);
        next(error);
      }
    });
  }

  // Listar imagens de um ativo
  async listarImagens(req, res, next) {
    try {
      const ativoId = req.params.id;
      
      const imagens = await AtivoImagem.findAll({
        where: { ativo_id: ativoId },
        order: [['ordem', 'ASC'], ['createdAt', 'DESC']]
      });

      res.json({
        success: true,
        data: { imagens }
      });
      
    } catch (error) {
      logger.error('Erro ao listar imagens:', error);
      next(error);
    }
  }

  // Download de imagem do Level
  async downloadImagem(req, res, next) {
    try {
      const { key } = req.params;
      
      // Buscar registro no banco para validação
      const imagemRecord = await AtivoImagem.findOne({
        where: { nome_arquivo: key }
      });

      if (!imagemRecord) {
        return res.status(404).json({ 
          success: false,
          message: 'Imagem não encontrada' 
        });
      }

      // Recuperar do Level
      const imageBuffer = await imageStorageService.getImage(key);
      
      if (!imageBuffer) {
        return res.status(404).json({ 
          success: false,
          message: 'Dados da imagem não encontrados' 
        });
      }

      // Configurar headers para servir a imagem
      res.setHeader('Content-Type', imagemRecord.tipo);
      res.setHeader('Content-Length', imageBuffer.length);
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache por 1 dia
      
      res.send(imageBuffer);
      
    } catch (error) {
      console.error('Erro ao baixar imagem:', error);
      logger.error('Erro ao baixar imagem:', error);
      next(error);
    }
  }

  // Remover imagem
  async removerImagem(req, res, next) {
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

      // Remover do Level
      try {
        await imageStorageService.deleteImage(imagem.nome_arquivo);
      } catch (levelError) {
        console.error('Erro ao remover do Level:', levelError);
        // Continua mesmo com erro no Level para limpar banco
      }
      
      // Remover registro do banco MySQL
      await imagem.destroy();

      logger.info('Imagem removida', {
        ativo_id: id,
        imagem_id: imagemId,
        user_id: req.user?.id
      });

      res.json({ 
        success: true,
        message: 'Imagem removida com sucesso' 
      });
      
    } catch (error) {
      console.error('Erro ao remover imagem:', error);
      logger.error('Erro ao remover imagem:', error);
      next(error);
    }
  }

  // Método auxiliar para remover todas as imagens de um ativo
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

  // Estatísticas do sistema (Level + MySQL)
  async estatisticas(req, res, next) {
    try {
      const stats = await imageStorageService.getStats();
      const totalAtivos = await Ativo.count();
      const totalImagens = await AtivoImagem.count();
      
      res.json({
        success: true,
        data: {
          ativos: totalAtivos,
          imagens: totalImagens,
          storage: stats
        }
      });
      
    } catch (error) {
      logger.error('Erro ao obter estatísticas:', error);
      next(error);
    }
  }
}

module.exports = new AtivoControllerHibrido();