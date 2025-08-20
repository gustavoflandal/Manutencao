const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RelatorioExecucao = sequelize.define('RelatorioExecucao', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  relatorio_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'relatorios',
      key: 'id'
    },
    comment: 'ID do relatório executado'
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Usuário que executou o relatório'
  },
  parametros_utilizados: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Parâmetros utilizados na execução'
  },
  status: {
    type: DataTypes.ENUM(
      'executando',
      'concluido',
      'erro',
      'cancelado',
      'timeout'
    ),
    allowNull: false,
    defaultValue: 'executando',
    comment: 'Status da execução'
  },
  inicio_execucao: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Início da execução'
  },
  fim_execucao: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fim da execução'
  },
  tempo_execucao: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Tempo de execução em milissegundos'
  },
  registros_retornados: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Número de registros retornados'
  },
  tamanho_resultado: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Tamanho do resultado em bytes'
  },
  formato_exportacao: {
    type: DataTypes.ENUM('html', 'pdf', 'excel', 'csv', 'json'),
    allowNull: true,
    comment: 'Formato de exportação utilizado'
  },
  arquivo_gerado: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Caminho do arquivo gerado (se exportado)'
  },
  hash_resultado: {
    type: DataTypes.STRING(64),
    allowNull: true,
    comment: 'Hash MD5 do resultado para cache'
  },
  mensagem_erro: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Mensagem de erro (se houver)'
  },
  stack_trace: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Stack trace do erro (se houver)'
  },
  agendado: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Se foi uma execução agendada'
  },
  enviado_por_email: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Se o resultado foi enviado por email'
  },
  destinatarios_email: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Lista de destinatários do email'
  },
  ip_origem: {
    type: DataTypes.STRING(45),
    allowNull: true,
    comment: 'IP de origem da execução'
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'User agent do navegador'
  },
  cache_utilizado: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Se utilizou cache na execução'
  },
  cache_key: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Chave do cache utilizada'
  }
}, {
  tableName: 'relatorio_execucoes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'idx_execucoes_relatorio',
      fields: ['relatorio_id']
    },
    {
      name: 'idx_execucoes_usuario',
      fields: ['user_id']
    },
    {
      name: 'idx_execucoes_status',
      fields: ['status']
    },
    {
      name: 'idx_execucoes_data',
      fields: ['inicio_execucao']
    },
    {
      name: 'idx_execucoes_agendado',
      fields: ['agendado', 'status']
    },
    {
      name: 'idx_execucoes_cache',
      fields: ['cache_key']
    }
  ]
});

// Associações
RelatorioExecucao.associate = (models) => {
  // Relacionamento com Relatório
  RelatorioExecucao.belongsTo(models.Relatorio, {
    foreignKey: 'relatorio_id',
    as: 'relatorio'
  });

  // Relacionamento com Usuário
  RelatorioExecucao.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'usuario'
  });
};

// Métodos de instância
RelatorioExecucao.prototype.marcarComoConcluido = async function(resultado) {
  this.status = 'concluido';
  this.fim_execucao = new Date();
  this.tempo_execucao = this.fim_execucao - this.inicio_execucao;
  
  if (resultado) {
    this.registros_retornados = Array.isArray(resultado) ? resultado.length : 1;
    this.tamanho_resultado = JSON.stringify(resultado).length;
    this.hash_resultado = require('crypto')
      .createHash('md5')
      .update(JSON.stringify(resultado))
      .digest('hex');
  }
  
  return await this.save();
};

RelatorioExecucao.prototype.marcarComoErro = async function(erro) {
  this.status = 'erro';
  this.fim_execucao = new Date();
  this.tempo_execucao = this.fim_execucao - this.inicio_execucao;
  this.mensagem_erro = erro.message;
  this.stack_trace = erro.stack;
  
  return await this.save();
};

RelatorioExecucao.prototype.cancelar = async function() {
  this.status = 'cancelado';
  this.fim_execucao = new Date();
  this.tempo_execucao = this.fim_execucao - this.inicio_execucao;
  
  return await this.save();
};

RelatorioExecucao.prototype.verificarTimeout = function(timeoutMs = 300000) { // 5 minutos
  const agora = new Date();
  const tempoDecorrido = agora - this.inicio_execucao;
  
  return tempoDecorrido > timeoutMs;
};

RelatorioExecucao.prototype.gerarCacheKey = function() {
  const dadosParaHash = {
    relatorio_id: this.relatorio_id,
    parametros: this.parametros_utilizados,
    versao_relatorio: this.relatorio?.versao || 1
  };
  
  this.cache_key = require('crypto')
    .createHash('md5')
    .update(JSON.stringify(dadosParaHash))
    .digest('hex');
    
  return this.cache_key;
};

// Métodos estáticos
RelatorioExecucao.getEstatisticasExecucao = async function(relatorioId, periodo = 30) {
  const dataLimite = new Date();
  dataLimite.setDate(dataLimite.getDate() - periodo);
  
  const [estatisticas] = await sequelize.query(`
    SELECT 
      COUNT(*) as total_execucoes,
      COUNT(CASE WHEN status = 'concluido' THEN 1 END) as execucoes_sucesso,
      COUNT(CASE WHEN status = 'erro' THEN 1 END) as execucoes_erro,
      AVG(CASE WHEN status = 'concluido' THEN tempo_execucao END) as tempo_medio,
      MAX(tempo_execucao) as tempo_maximo,
      MIN(tempo_execucao) as tempo_minimo,
      AVG(registros_retornados) as media_registros,
      AVG(tamanho_resultado) as tamanho_medio_resultado
    FROM relatorio_execucoes 
    WHERE relatorio_id = :relatorio_id 
    AND inicio_execucao >= :data_limite
  `, {
    replacements: { relatorio_id: relatorioId, data_limite: dataLimite },
    type: sequelize.QueryTypes.SELECT
  });
  
  return estatisticas[0];
};

RelatorioExecucao.getExecucoesRecentes = async function(limite = 20) {
  return await this.findAll({
    include: [
      {
        model: sequelize.models.Relatorio,
        as: 'relatorio',
        attributes: ['id', 'nome', 'tipo']
      },
      {
        model: sequelize.models.User,
        as: 'usuario',
        attributes: ['id', 'nome', 'email']
      }
    ],
    order: [['inicio_execucao', 'DESC']],
    limit: limite
  });
};

RelatorioExecucao.getExecucoesEmAndamento = async function() {
  return await this.findAll({
    where: {
      status: 'executando'
    },
    include: [
      {
        model: sequelize.models.Relatorio,
        as: 'relatorio',
        attributes: ['id', 'nome']
      },
      {
        model: sequelize.models.User,
        as: 'usuario',
        attributes: ['id', 'nome']
      }
    ]
  });
};

RelatorioExecucao.limparExecucoesAntigas = async function(diasParaManter = 90) {
  const dataLimite = new Date();
  dataLimite.setDate(dataLimite.getDate() - diasParaManter);
  
  const execucoesRemovidas = await this.destroy({
    where: {
      inicio_execucao: {
        [sequelize.Sequelize.Op.lt]: dataLimite
      },
      status: {
        [sequelize.Sequelize.Op.in]: ['concluido', 'erro', 'cancelado']
      }
    }
  });
  
  return execucoesRemovidas;
};

RelatorioExecucao.verificarTimeouts = async function() {
  const execucoesEmAndamento = await this.getExecucoesEmAndamento();
  const execucoesTimeout = [];
  
  for (const execucao of execucoesEmAndamento) {
    if (execucao.verificarTimeout()) {
      execucao.status = 'timeout';
      execucao.fim_execucao = new Date();
      execucao.tempo_execucao = execucao.fim_execucao - execucao.inicio_execucao;
      await execucao.save();
      execucoesTimeout.push(execucao);
    }
  }
  
  return execucoesTimeout;
};

RelatorioExecucao.buscarPorCache = async function(cacheKey) {
  return await this.findOne({
    where: {
      cache_key: cacheKey,
      status: 'concluido',
      cache_utilizado: true
    },
    order: [['created_at', 'DESC']]
  });
};

module.exports = RelatorioExecucao;