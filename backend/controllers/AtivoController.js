// Controller de Ativos com armazenamento de imagens em filesystem
const { Ativo, Category, SubCategory, Department, User, Setor, AtivoImagem } = require('../models');
const { Op } = require('sequelize');
const logger = require('../config/logger');
const AuditoriaService = require('../services/AuditoriaService');
const imageStorageService = require('../services/ImageStorageService');
const multer = require('multer');
const path = require('path');

// Configuração do multer APENAS para memória (Level)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
    files: 5 // máximo 5 arquivos
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Apenas imagens (JPEG, PNG, GIF, WEBP) são permitidas'));
    }
  }
});

class AtivoController {
  constructor() {}

  // Lista simplificada de ativos por setor (para dropdowns)
  async bySetor(req, res, next) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ success: false, message: 'ID do setor é obrigatório' });
      }

      const ativos = await Ativo.findAll({
        where: { setor_id: id, ativo: true },
        attributes: ['id', 'codigo_patrimonio', 'nome'],
        order: [['nome', 'ASC']]
      });

      return res.json({
        success: true,
        data: { ativos }
      });
    } catch (error) {
      logger.error('Erro ao listar ativos por setor:', error);
      next(error);
    }
  }

  // (Inicialização de serviço de imagens não necessária para filesystem)
  async initializeImageService() { return; }
  checkLevelAvailability() { return true; }
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
        setor_id = '',
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
  if (setor_id) whereClause.setor_id = setor_id;

      const { count, rows: ativos } = await Ativo.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Category,
            as: 'categoria',
            attributes: ['id', 'nome', 'cor', 'icone']
          },
          {
            model: SubCategory,
            as: 'subcategoria',
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
          },
          {
            model: Setor,
            as: 'setor',
            attributes: ['id', 'codigo', 'nome', 'localizacao']
          }
        ],
        order: [[orderBy, orderDirection.toUpperCase()]],
        limit: parseInt(limit),
        offset: offset,
        distinct: true
      });

      // Calcular estatísticas dos ativos listados
      const stats = {
        operacional: ativos.filter(a => a.estado === 'operacional').length,
        manutencao: ativos.filter(a => a.estado === 'manutencao').length,
        parado: ativos.filter(a => a.estado === 'parado').length,
        inativo: ativos.filter(a => a.estado === 'inativo').length,
        criticos: ativos.filter(a => a.criticidade === 'critica').length
      };

      res.json({
        success: true,
        data: {
          ativos,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / parseInt(limit)),
            totalItems: count,
            itemsPerPage: parseInt(limit)
          },
          stats
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
            attributes: ['id', 'nome', 'cor', 'icone']
          },
          {
            model: SubCategory,
            as: 'subcategoria',
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
            attributes: ['id', 'nome', 'email', 'telefone']
          },
          {
            model: Setor,
            as: 'setor',
            attributes: ['id', 'codigo', 'nome', 'localizacao']
          }
        ]
      });

      if (!ativo) {
        return res.status(404).json({
          success: false,
          message: 'Ativo não encontrado'
        });
      }

      // Adicionar informações calculadas
      const ativoData = ativo.toJSON();
      ativoData.idade_anos = ativo.calcularIdade();
      ativoData.em_garantia = ativo.estaEmGarantia();
      ativoData.precisa_inspecao = ativo.precisaInspecao();

      res.json({
        success: true,
        data: { ativo: ativoData }
      });

    } catch (error) {
      logger.error('Erro ao buscar ativo:', error);
      next(error);
    }
  }

  // Criar novo ativo
  async store(req, res, next) {
    try {
      const ativoData = req.body;

      // Limpar campos vazios que devem ser null para campos de relacionamento
      if (ativoData.categoria_id === '') ativoData.categoria_id = null;
      if (ativoData.subcategoria_id === '') ativoData.subcategoria_id = null;
      if (ativoData.department_id === '') ativoData.department_id = null;
      if (ativoData.responsavel_id === '') ativoData.responsavel_id = null;

      // Validar dados obrigatórios
      if (!ativoData.nome) {
        return res.status(400).json({
          success: false,
          message: 'Nome do ativo é obrigatório'
        });
      }

      // Validar setor (agora obrigatório)
      if (!ativoData.setor_id) {
        return res.status(400).json({
          success: false,
          message: 'Setor é obrigatório para cadastro de ativo'
        });
      }

      // Verificar se código patrimonial já existe (se fornecido)
      if (ativoData.codigo_patrimonio) {
        const existeAtivo = await Ativo.findOne({
          where: { codigo_patrimonio: ativoData.codigo_patrimonio }
        });

        if (existeAtivo) {
          return res.status(400).json({
            success: false,
            message: 'Código patrimonial já existe'
          });
        }
      }

      const novoAtivo = await Ativo.create(ativoData);

      // Buscar ativo criado com associações
      const ativo = await Ativo.findByPk(novoAtivo.id, {
        include: [
          { model: Category, as: 'categoria', attributes: ['id', 'nome'] },
          { model: SubCategory, as: 'subcategoria', attributes: ['id', 'nome'] },
          { model: Department, as: 'department', attributes: ['id', 'nome'] },
          { model: User, as: 'responsavel', attributes: ['id', 'nome'] }
        ]
      });

      logger.info(`Ativo criado: ${ativo.codigo_patrimonio} - ${ativo.nome}`, {
        ativo_id: ativo.id,
        user_id: req.user?.id
      });

      // Registrar auditoria da criação
      await AuditoriaService.registrarCriacao(
        AuditoriaService.modulos.ATIVOS,
        ativo,
        req.user,
        req,
        `Criação do ativo ${ativo.codigo_patrimonio} - ${ativo.nome}`
      );

      // Gerar QR code para o ativo
      try {
        const qrCodeUrl = await QRCodeService.generateAtivoQRCode(ativo);
        await ativo.update({ qr_code: qrCodeUrl });
        ativo.qr_code = qrCodeUrl;
      } catch (qrError) {
        logger.warn('Erro ao gerar QR code para ativo:', qrError);
        // Não falhar a criação do ativo por causa do QR code
      }

      res.status(201).json({
        success: true,
        message: 'Ativo criado com sucesso',
        data: { ativo }
      });

    } catch (error) {
      logger.error('Erro ao criar ativo:', error);
      next(error);
    }
  }

  // Atualizar ativo
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Limpar campos vazios que devem ser null para campos de relacionamento
      if (updateData.categoria_id === '') updateData.categoria_id = null;
      if (updateData.subcategoria_id === '') updateData.subcategoria_id = null;
      if (updateData.department_id === '') updateData.department_id = null;
      if (updateData.responsavel_id === '') updateData.responsavel_id = null;

      const ativo = await Ativo.findByPk(id);

      if (!ativo) {
        return res.status(404).json({
          success: false,
          message: 'Ativo não encontrado'
        });
      }

      // Validar setor obrigatório (não permitir remover)
      if (updateData.hasOwnProperty('setor_id') && !updateData.setor_id) {
        return res.status(400).json({
          success: false,
          message: 'Setor é obrigatório e não pode ser removido do ativo'
        });
      }

      // Verificar se código patrimonial já existe (se alterado)
      if (updateData.codigo_patrimonio && updateData.codigo_patrimonio !== ativo.codigo_patrimonio) {
        const existeAtivo = await Ativo.findOne({
          where: { 
            codigo_patrimonio: updateData.codigo_patrimonio,
            id: { [Op.ne]: id }
          }
        });

        if (existeAtivo) {
          return res.status(400).json({
            success: false,
            message: 'Código patrimonial já existe'
          });
        }
      }

      // Capturar estado anterior para auditoria
      const estadoAnterior = ativo.toJSON();

      await ativo.update(updateData);

      // Buscar ativo atualizado com associações
      const ativoAtualizado = await Ativo.findByPk(id, {
        include: [
          { model: Category, as: 'categoria', attributes: ['id', 'nome'] },
          { model: SubCategory, as: 'subcategoria', attributes: ['id', 'nome'] },
          { model: Department, as: 'department', attributes: ['id', 'nome'] },
          { model: User, as: 'responsavel', attributes: ['id', 'nome'] }
        ]
      });

      logger.info(`Ativo atualizado: ${ativo.codigo_patrimonio}`, {
        ativo_id: id,
        user_id: req.user?.id
      });

      // Registrar auditoria da atualização
      await AuditoriaService.registrarAtualizacao(
        AuditoriaService.modulos.ATIVOS,
        estadoAnterior,
        ativoAtualizado.toJSON(),
        req.user,
        req,
        `Atualização do ativo ${ativo.codigo_patrimonio} - ${ativo.nome}`
      );

      res.json({
        success: true,
        message: 'Ativo atualizado com sucesso',
        data: { ativo: ativoAtualizado }
      });

    } catch (error) {
      logger.error('Erro ao atualizar ativo:', error);
      next(error);
    }
  }

  // Desativar ativo (soft delete)
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

      // Remover TODAS as imagens do Level
      await this.removerTodasImagensLevel(id);

      await ativo.update({ ativo: false });

      logger.info(`Ativo desativado: ${ativo.codigo_patrimonio}`, {
        ativo_id: id,
        user_id: req.user?.id
      });

      res.json({
        success: true,
        message: 'Ativo desativado com sucesso'
      });

    } catch (error) {
      logger.error('Erro ao desativar ativo:', error);
      next(error);
    }
  }

  // Buscar ativo por código patrimonial
  async buscarPorCodigo(req, res, next) {
    try {
      const { codigo } = req.params;

      const ativo = await Ativo.buscarPorCodigo(codigo);

      if (!ativo) {
        return res.status(404).json({
          success: false,
          message: 'Ativo não encontrado'
        });
      }

      // Adicionar informações calculadas
      const ativoData = ativo.toJSON();
      ativoData.idade_anos = ativo.calcularIdade();
      ativoData.em_garantia = ativo.estaEmGarantia();
      ativoData.precisa_inspecao = ativo.precisaInspecao();

      res.json({
        success: true,
        data: { ativo: ativoData }
      });

    } catch (error) {
      logger.error('Erro ao buscar ativo por código:', error);
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
        critica,
        garantia,
        inspecao
      ] = await Promise.all([
        Ativo.count({ where: whereClause }),
        Ativo.count({ where: { ...whereClause, estado: 'operacional' } }),
        Ativo.count({ where: { ...whereClause, estado: 'manutencao' } }),
        Ativo.count({ where: { ...whereClause, estado: 'parado' } }),
        Ativo.count({ where: { ...whereClause, estado: 'inativo' } }),
        Ativo.count({ where: { ...whereClause, criticidade: 'baixa' } }),
        Ativo.count({ where: { ...whereClause, criticidade: 'media' } }),
        Ativo.count({ where: { ...whereClause, criticidade: 'alta' } }),
        Ativo.count({ where: { ...whereClause, criticidade: 'critica' } }),
        Ativo.count({ 
          where: { 
            ...whereClause, 
            garantia_ate: { [Op.gte]: new Date() } 
          } 
        }),
        Ativo.count({ 
          where: { 
            ...whereClause, 
            data_proxima_inspecao: { 
              [Op.lte]: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 dias
            } 
          } 
        })
      ]);

      res.json({
        success: true,
        data: {
          total,
          estado: {
            operacional,
            manutencao,
            parado,
            inativo
          },
          criticidade: {
            baixa,
            media,
            alta,
            critica
          },
          alertas: {
            em_garantia: garantia,
            precisa_inspecao: inspecao
          }
        }
      });

    } catch (error) {
      logger.error('Erro ao obter estatísticas dos ativos:', error);
      next(error);
    }
  }

  // Listar ativos para seleção (dropdown)
  async listForSelect(req, res, next) {
    try {
      const { department_id, estado = 'operacional' } = req.query;

      const whereClause = { ativo: true };
      if (department_id) whereClause.department_id = department_id;
      if (estado) whereClause.estado = estado;

      const ativos = await Ativo.findAll({
        where: whereClause,
        attributes: ['id', 'codigo_patrimonio', 'nome', 'estado', 'criticidade'],
        order: [['nome', 'ASC']]
      });

      res.json({
        success: true,
        data: { ativos }
      });

    } catch (error) {
      logger.error('Erro ao listar ativos para seleção:', error);
      next(error);
    }
  }

  // Upload de imagens (filesystem)
  async uploadImagens(req, res, next) {
    const uploadMiddleware = upload.array('imagens', 5);
    const self = this; // Capturar referência do this
    
    uploadMiddleware(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ 
          success: false,
          message: err.message 
        });
      }

      try {
  // Serviço de imagens sempre disponível (filesystem)

        const ativoId = req.params.id;
        
        // Verificar se ativo existe
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

        // Verificar limite de 5 imagens
        const imagensExistentes = await AtivoImagem.count({ where: { ativo_id: ativoId }});
        const novasImagens = req.files.length;
        
        if (imagensExistentes + novasImagens > 5) {
          return res.status(400).json({
            success: false,
            message: `Limite de 5 imagens atingido. Você tem ${imagensExistentes} e está tentando adicionar ${novasImagens}.`
          });
        }

        const imagensSalvas = [];

        // Processar cada arquivo
        for (const file of req.files) {
          // Gerar chave única para arquivo
          const timestamp = Date.now();
          const random = Math.random().toString(36).substr(2, 9);
          const levelKey = `ativo_${ativoId}_${timestamp}_${random}`;
          
          // Salvar binário no filesystem abstraído
          await imageStorageService.saveImage(levelKey, file.buffer);
          
          // Salvar metadados no MySQL
          const imagemRecord = await AtivoImagem.create({
            ativo_id: ativoId,
            nome_arquivo: levelKey,
            caminho: `/api/ativos/${ativoId}/imagens/${levelKey}/download`,
            tipo: file.mimetype,
            tamanho: file.size,
            ordem: imagensExistentes + imagensSalvas.length
          });

          imagensSalvas.push({
            id: imagemRecord.id,
            levelKey: levelKey,
            nome_original: file.originalname,
            tipo: imagemRecord.tipo,
            tamanho: imagemRecord.tamanho,
            url: imagemRecord.caminho
          });
        }

  logger.info(`📸 ${imagensSalvas.length} imagens processadas e salvas em disco`, {
          ativo_id: ativoId,
          ativo_codigo: ativo.codigo_patrimonio,
          imagens_count: imagensSalvas.length,
          total_size: imagensSalvas.reduce((acc, img) => acc + img.tamanho, 0),
          total_size_formatted: `${(imagensSalvas.reduce((acc, img) => acc + img.tamanho, 0) / 1024).toFixed(2)}KB`,
          storage_keys: imagensSalvas.map(img => img.levelKey),
          user_id: req.user?.id,
          operation: 'UPLOAD_COMPLETE'
        });

  res.json({ success: true, message: `${imagensSalvas.length} imagem(ns) salva(s) com sucesso`, data: { imagens: imagensSalvas } });

      } catch (error) {
  logger.error('❌ Erro no processo de upload de imagens', {
          ativo_id: req.params.id,
          error: error.message,
          stack: error.stack,
          operation: 'UPLOAD_ERROR'
        });
        next(error);
      }
    });
  }

  // Listar imagens de um ativo
  async listarImagens(req, res, next) {
    try {
      const { id } = req.params;

      const imagens = await AtivoImagem.findAll({
        where: { ativo_id: id },
        order: [['ordem', 'ASC'], ['createdAt', 'ASC']]
      });

      // Adicionar URLs de download para cada imagem
      const imagensComUrl = imagens.map(imagem => ({
        ...imagem.toJSON(),
        url: `${req.protocol}://${req.get('host')}/api/ativos/${id}/imagens/${imagem.nome_arquivo}/download`
      }));

      res.json({
        success: true,
        data: { imagens: imagensComUrl }
      });

    } catch (error) {
      logger.error('Erro ao listar imagens:', error);
      next(error);
    }
  }

  // Download de imagem (filesystem)
  async downloadImagem(req, res, next) {
    try {
  // Filesystem sempre disponível

      const { levelKey } = req.params;
      const startTime = Date.now();
      
  logger.info('📥 Solicitação de download de imagem', {
        levelKey: levelKey,
        user_id: req.user?.id,
        ip: req.ip,
        operation: 'DOWNLOAD_REQUEST'
      });
      
      // Buscar metadados no MySQL
      const imagemRecord = await AtivoImagem.findOne({
        where: { nome_arquivo: levelKey }
      });

      if (!imagemRecord) {
  logger.warn('⚠️ Tentativa de download de imagem inexistente', {
          levelKey: levelKey,
          user_id: req.user?.id,
          operation: 'DOWNLOAD_NOT_FOUND'
        });
        
        return res.status(404).json({ 
          success: false,
          message: 'Imagem não encontrada' 
        });
      }

  // Recuperar binário
      const imageBuffer = await imageStorageService.getImage(levelKey);
      
      if (!imageBuffer) {
  logger.error('❌ Metadados existem mas arquivo não encontrado em disco', {
          levelKey: levelKey,
          imagemId: imagemRecord.id,
          operation: 'DOWNLOAD_LEVEL_MISSING'
        });
        
        return res.status(404).json({ 
          success: false,
          message: 'Arquivo de imagem não encontrado' 
        });
      }

      // Servir imagem diretamente
      const duration = Date.now() - startTime;
      
      res.setHeader('Content-Type', imagemRecord.tipo);
      res.setHeader('Content-Length', imageBuffer.length);
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache 1 dia
      res.setHeader('ETag', `"${levelKey}"`);
      
  logger.info('✅ Download de imagem concluído', {
        levelKey: levelKey,
        ativo_id: imagemRecord.ativo_id,
        size: imageBuffer.length,
        sizeFormatted: `${(imageBuffer.length / 1024).toFixed(2)}KB`,
        type: imagemRecord.tipo,
        duration: `${duration}ms`,
        user_id: req.user?.id,
        operation: 'DOWNLOAD_SUCCESS'
      });
      
      res.send(imageBuffer);
      
    } catch (error) {
  logger.error('❌ Erro no download de imagem', {
        levelKey: req.params.levelKey,
        error: error.message,
        user_id: req.user?.id,
        operation: 'DOWNLOAD_ERROR'
      });
      next(error);
    }
  }

  // Remover imagem
  async removerImagem(req, res, next) {
    try {
  // Filesystem sempre disponível

      const { id, imagemId } = req.params;
      
  logger.info('🗑️ Solicitação de remoção de imagem', {
        ativo_id: id,
        imagem_id: imagemId,
        user_id: req.user?.id,
        operation: 'REMOVE_REQUEST'
      });
      
      const imagem = await AtivoImagem.findOne({
        where: { 
          id: imagemId,
          ativo_id: id 
        }
      });

      if (!imagem) {
        logger.warn('⚠️ Tentativa de remoção de imagem inexistente', {
          ativo_id: id,
          imagem_id: imagemId,
          user_id: req.user?.id,
          operation: 'REMOVE_NOT_FOUND'
        });
        
        return res.status(404).json({ 
          success: false,
          message: 'Imagem não encontrada' 
        });
      }

      const levelKey = imagem.nome_arquivo;
      const imagemSize = imagem.tamanho;

  // Remover arquivo em disco
      try {
  await imageStorageService.deleteImage(levelKey);
  logger.info('✅ Imagem removida do storage', {
          levelKey: levelKey,
          size: imagemSize,
          operation: 'LEVEL_DELETE_SUCCESS'
        });
        
      } catch (levelError) {
  logger.error('❌ Erro ao remover arquivo', {
          levelKey: levelKey,
          error: levelError.message,
          operation: 'LEVEL_DELETE_ERROR'
        });
        // Continua para limpar banco mesmo com erro no Level
      }
      
      // Remover registro do MySQL
      await imagem.destroy();

  logger.info('✅ Remoção de imagem concluída', {
        ativo_id: id,
        imagem_id: imagemId,
        levelKey: levelKey,
        size: imagemSize,
        sizeFormatted: `${(imagemSize / 1024).toFixed(2)}KB`,
        user_id: req.user?.id,
        operation: 'REMOVE_COMPLETE'
      });

  res.json({ success: true, message: 'Imagem removida com sucesso' });
      
    } catch (error) {
      logger.error('Erro ao remover imagem:', error);
      next(error);
    }
  }

  // Remover TODAS as imagens de um ativo
  async removerTodasImagensLevel(ativoId) {
    try {
      const imagens = await AtivoImagem.findAll({
        where: { ativo_id: ativoId }
      });

  // Remover arquivos
      for (const imagem of imagens) {
        try {
          await imageStorageService.deleteImage(imagem.nome_arquivo);
        } catch (error) {
          logger.error(`Erro ao remover ${imagem.nome_arquivo}:`, error);
        }
      }

      // Remover registros do MySQL
      await AtivoImagem.destroy({
        where: { ativo_id: ativoId }
      });

  logger.info(`Todas as imagens do ativo ${ativoId} removidas do storage`);
      
    } catch (error) {
      logger.error('Erro ao remover todas as imagens:', error);
      throw error;
    }
  }

  // Estatísticas de imagens
  async estatisticasLevel(req, res, next) {
    try {
  // Filesystem sempre disponível

  logger.info('📊 Solicitação de estatísticas de imagens', {
        user_id: req.user?.id,
        operation: 'STATS_REQUEST'
      });
      
  const storageStats = await imageStorageService.getStats();
      const totalAtivos = await Ativo.count();
      const totalImagens = await AtivoImagem.count();
      
      const stats = {
        ativos: totalAtivos,
        imagens: totalImagens,
  storage: storageStats
      };
      
  logger.info('✅ Estatísticas de imagens calculadas', {
        ...stats,
        user_id: req.user?.id,
        operation: 'STATS_SUCCESS'
      });
      
  res.json({ success: true, data: stats });
      
    } catch (error) {
  logger.error('❌ Erro ao obter estatísticas de imagens', {
        error: error.message,
        user_id: req.user?.id,
        operation: 'STATS_ERROR'
      });
      next(error);
    }
  }

}

// Criar instância única
const ativoControllerInstance = new AtivoController();

module.exports = ativoControllerInstance;