const { Ativo, Category, SubCategory, Department, User, Setor } = require('../models');
const { Op } = require('sequelize');
const logger = require('../config/logger');
const QRCodeService = require('../services/QRCodeService');

class AtivoController {
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

      // Validar dados obrigatórios
      if (!ativoData.nome) {
        return res.status(400).json({
          success: false,
          message: 'Nome do ativo é obrigatório'
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

      const ativo = await Ativo.findByPk(id);

      if (!ativo) {
        return res.status(404).json({
          success: false,
          message: 'Ativo não encontrado'
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

  // Regenerar QR code para um ativo
  async regenerateQRCode(req, res, next) {
    try {
      const { id } = req.params;

      const ativo = await Ativo.findByPk(id, {
        include: [
          { model: Category, as: 'categoria', attributes: ['id', 'nome'] },
          { model: Setor, as: 'setor', attributes: ['id', 'nome'] }
        ]
      });

      if (!ativo) {
        return res.status(404).json({
          success: false,
          message: 'Ativo não encontrado'
        });
      }

      // Remover QR code antigo se existir
      if (ativo.qr_code) {
        await QRCodeService.removeOldQRCode(ativo.qr_code);
      }

      // Gerar novo QR code
      const qrCodeUrl = await QRCodeService.generateAtivoQRCode(ativo);
      await ativo.update({ qr_code: qrCodeUrl });

      logger.info(`QR code regenerado para ativo ${ativo.codigo_patrimonio}`, {
        ativo_id: id,
        user_id: req.user?.id
      });

      res.json({
        success: true,
        message: 'QR code regenerado com sucesso',
        data: { qr_code: qrCodeUrl }
      });

    } catch (error) {
      logger.error('Erro ao regenerar QR code:', error);
      next(error);
    }
  }

  // Calcular métricas de manutenção para um ativo
  async calculateMaintenanceMetrics(req, res, next) {
    try {
      const { id } = req.params;
      const { OrdemServico } = require('../models');

      const ativo = await Ativo.findByPk(id);
      if (!ativo) {
        return res.status(404).json({
          success: false,
          message: 'Ativo não encontrado'
        });
      }

      // Buscar histórico de ordens de serviço
      const ordensServico = await OrdemServico.findAll({
        where: { 
          ativo_id: id,
          status: 'concluida'
        },
        order: [['data_fim_real', 'ASC']]
      });

      let mtbf = null;
      let mttr = null;
      let custoTotal = 0;
      let tempoParadaTotal = 0;

      if (ordensServico.length > 0) {
        // Calcular MTTR (Mean Time To Repair)
        const temposReparo = ordensServico
          .filter(os => os.data_inicio_real && os.data_fim_real)
          .map(os => {
            const inicio = new Date(os.data_inicio_real);
            const fim = new Date(os.data_fim_real);
            return (fim - inicio) / (1000 * 60 * 60); // em horas
          });

        if (temposReparo.length > 0) {
          mttr = temposReparo.reduce((acc, tempo) => acc + tempo, 0) / temposReparo.length;
          tempoParadaTotal = temposReparo.reduce((acc, tempo) => acc + tempo, 0);
        }

        // Calcular MTBF (Mean Time Between Failures) - apenas para OS corretivas
        const osCorretivas = ordensServico.filter(os => os.tipo === 'corretiva');
        if (osCorretivas.length > 1) {
          const intervalos = [];
          for (let i = 1; i < osCorretivas.length; i++) {
            const anterior = new Date(osCorretivas[i-1].data_fim_real);
            const atual = new Date(osCorretivas[i].data_inicio_real);
            const intervalo = (atual - anterior) / (1000 * 60 * 60); // em horas
            intervalos.push(intervalo);
          }
          mtbf = intervalos.reduce((acc, int) => acc + int, 0) / intervalos.length;
        }

        // Calcular custo total
        custoTotal = ordensServico.reduce((acc, os) => acc + parseFloat(os.custo_total || 0), 0);
      }

      // Calcular disponibilidade (assumindo 24h/dia operação)
      const diasOperacao = 365; // último ano
      const horasDisponiveis = diasOperacao * 24;
      const disponibilidade = horasDisponiveis > 0 ? 
        ((horasDisponiveis - tempoParadaTotal) / horasDisponiveis) * 100 : 100;

      // Atualizar ativo com as métricas
      await ativo.update({
        mtbf_horas: mtbf,
        mttr_horas: mttr,
        custo_manutencao_total: custoTotal
      });

      const metricas = {
        mtbf_horas: mtbf,
        mttr_horas: mttr,
        custo_total: custoTotal,
        tempo_parada_total: tempoParadaTotal,
        disponibilidade_percentual: Math.round(disponibilidade * 100) / 100,
        total_ordens_servico: ordensServico.length,
        ordens_corretivas: ordensServico.filter(os => os.tipo === 'corretiva').length,
        ordens_preventivas: ordensServico.filter(os => os.tipo === 'preventiva').length
      };

      res.json({
        success: true,
        data: { metricas }
      });

    } catch (error) {
      logger.error('Erro ao calcular métricas de manutenção:', error);
      next(error);
    }
  }

  // Atualizar parâmetros de operação
  async updateOperationParameters(req, res, next) {
    try {
      const { id } = req.params;
      const { parametros } = req.body;

      const ativo = await Ativo.findByPk(id);
      if (!ativo) {
        return res.status(404).json({
          success: false,
          message: 'Ativo não encontrado'
        });
      }

      await ativo.update({
        parametros_operacao: parametros
      });

      logger.info(`Parâmetros de operação atualizados para ativo ${ativo.codigo_patrimonio}`, {
        ativo_id: id,
        user_id: req.user?.id
      });

      res.json({
        success: true,
        message: 'Parâmetros de operação atualizados com sucesso'
      });

    } catch (error) {
      logger.error('Erro ao atualizar parâmetros de operação:', error);
      next(error);
    }
  }

  // Adicionar entrada no histórico de falhas
  async addFailureRecord(req, res, next) {
    try {
      const { id } = req.params;
      const { descricao, data_ocorrencia, causa, solucao, tempo_parada_horas } = req.body;

      const ativo = await Ativo.findByPk(id);
      if (!ativo) {
        return res.status(404).json({
          success: false,
          message: 'Ativo não encontrado'
        });
      }

      // Obter histórico atual
      const historicoAtual = ativo.historico_falhas || [];

      // Adicionar nova entrada
      const novaEntrada = {
        id: Date.now(),
        descricao,
        data_ocorrencia: data_ocorrencia || new Date(),
        causa,
        solucao,
        tempo_parada_horas: parseFloat(tempo_parada_horas || 0),
        registrado_por: req.user?.id,
        registrado_em: new Date()
      };

      historicoAtual.push(novaEntrada);

      await ativo.update({
        historico_falhas: historicoAtual
      });

      logger.info(`Falha registrada para ativo ${ativo.codigo_patrimonio}`, {
        ativo_id: id,
        falha_id: novaEntrada.id,
        user_id: req.user?.id
      });

      res.json({
        success: true,
        message: 'Falha registrada com sucesso',
        data: { falha: novaEntrada }
      });

    } catch (error) {
      logger.error('Erro ao registrar falha:', error);
      next(error);
    }
  }
}

module.exports = new AtivoController();