/**
 * Sistema de Inicialização e Setup do Banco de Dados
 * Sistema de Gestão de Manutenção
 * 
 * Este script:
 * 1. Verifica se o banco de dados existe
 * 2. Cria o banco se não existir
 * 3. Executa as migrações
 * 4. Insere dados iniciais (seed)
 * 5. Cria usuário administrador padrão
 */

const mysql = require('mysql2/promise');
const { Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');
const logger = require('./config/logger');

// Configurações do banco
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'root',
  database: process.env.DB_NAME || 'manutencao_db'
};

// Dados iniciais do sistema
const INITIAL_DATA = {
  // Usuário administrador padrão
  admin: {
    nome: 'Administrador do Sistema',
    email: 'admin@sistema.com',
    senha: '123456',
    perfil: 'administrador',
    departamento: 'TI',
    ativo: true
  },

  // Departamentos iniciais
  departments: [
    {
      nome: 'Tecnologia da Informação',
      descricao: 'Departamento responsável pela infraestrutura tecnológica',
      responsavel: 'Administrador do Sistema',
      localizacao: 'Prédio A - 2º Andar',
      ativo: true
    },
    {
      nome: 'Manutenção',
      descricao: 'Departamento de manutenção predial e equipamentos',
      responsavel: 'Coordenador de Manutenção',
      localizacao: 'Prédio B - Térreo',
      ativo: true
    },
    {
      nome: 'Recursos Humanos',
      descricao: 'Gestão de pessoas e desenvolvimento organizacional',
      responsavel: 'Gerente de RH',
      localizacao: 'Prédio A - 1º Andar',
      ativo: true
    },
    {
      nome: 'Financeiro',
      descricao: 'Controle financeiro e contabilidade',
      responsavel: 'Controller',
      localizacao: 'Prédio A - 3º Andar',
      ativo: true
    },
    {
      nome: 'Operações',
      descricao: 'Operações e produção',
      responsavel: 'Gerente de Operações',
      localizacao: 'Prédio C',
      ativo: true
    }
  ],

  // Setores operacionais
  setores: [
    {
      codigo: 'ADMIN',
      nome: 'Administração',
      descricao: 'Setor administrativo geral',
      localizacao: 'Prédio A - 1º Andar',
      ativo: true
    },
    {
      codigo: 'PROD',
      nome: 'Produção',
      descricao: 'Setor de produção principal',
      localizacao: 'Prédio C - Galpão 1',
      ativo: true
    },
    {
      codigo: 'MANUT',
      nome: 'Manutenção',
      descricao: 'Oficina de manutenção',
      localizacao: 'Prédio B - Subsolo',
      ativo: true
    },
    {
      codigo: 'ARMAZ',
      nome: 'Armazenagem',
      descricao: 'Depósito e almoxarifado',
      localizacao: 'Prédio D',
      ativo: true
    },
    {
      codigo: 'QUAL',
      nome: 'Qualidade',
      descricao: 'Controle de qualidade',
      localizacao: 'Prédio C - Laboratório',
      ativo: true
    }
  ],

  // Categorias de solicitações
  categories: [
    {
      nome: 'Infraestrutura',
      descricao: 'Problemas relacionados à infraestrutura predial',
      cor: '#dc3545',
      icone: 'fas fa-building',
      ativo: true
    },
    {
      nome: 'Equipamentos',
      descricao: 'Manutenção e reparo de equipamentos',
      cor: '#28a745',
      icone: 'fas fa-cogs',
      ativo: true
    },
    {
      nome: 'TI e Tecnologia',
      descricao: 'Suporte técnico e tecnologia da informação',
      cor: '#007bff',
      icone: 'fas fa-laptop',
      ativo: true
    },
    {
      nome: 'Limpeza',
      descricao: 'Serviços de limpeza e higienização',
      cor: '#17a2b8',
      icone: 'fas fa-broom',
      ativo: true
    },
    {
      nome: 'Segurança',
      descricao: 'Questões de segurança patrimonial e pessoal',
      cor: '#ffc107',
      icone: 'fas fa-shield-alt',
      ativo: true
    },
    {
      nome: 'Elétrica',
      descricao: 'Instalações e manutenções elétricas',
      cor: '#fd7e14',
      icone: 'fas fa-bolt',
      ativo: true
    },
    {
      nome: 'Hidráulica',
      descricao: 'Sistemas hidráulicos e encanamentos',
      cor: '#20c997',
      icone: 'fas fa-tint',
      ativo: true
    }
  ],

  // Subcategorias por categoria
  subcategories: [
    // Infraestrutura
    { nome: 'Pintura', descricao: 'Serviços de pintura predial', category: 'Infraestrutura' },
    { nome: 'Alvenaria', descricao: 'Reparos em paredes e estruturas', category: 'Infraestrutura' },
    { nome: 'Telhado', descricao: 'Manutenção de telhados e coberturas', category: 'Infraestrutura' },
    { nome: 'Pisos', descricao: 'Reparos e manutenção de pisos', category: 'Infraestrutura' },
    
    // Equipamentos
    { nome: 'Maquinário', descricao: 'Equipamentos de produção', category: 'Equipamentos' },
    { nome: 'Ferramentas', descricao: 'Ferramentas e utensílios', category: 'Equipamentos' },
    { nome: 'Veículos', descricao: 'Frota de veículos', category: 'Equipamentos' },
    { nome: 'Ar Condicionado', descricao: 'Sistemas de climatização', category: 'Equipamentos' },
    
    // TI e Tecnologia
    { nome: 'Hardware', descricao: 'Computadores e equipamentos', category: 'TI e Tecnologia' },
    { nome: 'Software', descricao: 'Sistemas e aplicativos', category: 'TI e Tecnologia' },
    { nome: 'Rede', descricao: 'Infraestrutura de rede', category: 'TI e Tecnologia' },
    { nome: 'Telefonia', descricao: 'Sistemas de comunicação', category: 'TI e Tecnologia' },
    
    // Limpeza
    { nome: 'Limpeza Geral', descricao: 'Limpeza de ambientes', category: 'Limpeza' },
    { nome: 'Jardinagem', descricao: 'Manutenção de jardins', category: 'Limpeza' },
    { nome: 'Dedetização', descricao: 'Controle de pragas', category: 'Limpeza' },
    
    // Segurança
    { nome: 'Câmeras', descricao: 'Sistema de monitoramento', category: 'Segurança' },
    { nome: 'Alarmes', descricao: 'Sistemas de alarme', category: 'Segurança' },
    { nome: 'Controle de Acesso', descricao: 'Catracas e fechaduras', category: 'Segurança' },
    
    // Elétrica
    { nome: 'Iluminação', descricao: 'Lâmpadas e luminárias', category: 'Elétrica' },
    { nome: 'Tomadas', descricao: 'Instalações elétricas', category: 'Elétrica' },
    { nome: 'Quadros Elétricos', descricao: 'Painéis e disjuntores', category: 'Elétrica' },
    
    // Hidráulica
    { nome: 'Vazamentos', descricao: 'Reparos de vazamentos', category: 'Hidráulica' },
    { nome: 'Entupimentos', descricao: 'Desobstrução de tubulações', category: 'Hidráulica' },
    { nome: 'Instalações', descricao: 'Novas instalações hidráulicas', category: 'Hidráulica' }
  ],

  // Categorias de estoque
  categorias_estoque: [
    {
      codigo: 'ELET',
      nome: 'Material Elétrico',
      descricao: 'Componentes e materiais elétricos',
      cor: '#fd7e14',
      icone: 'fas fa-bolt'
    },
    {
      codigo: 'HIDR',
      nome: 'Material Hidráulico',
      descricao: 'Tubos, conexões e acessórios hidráulicos',
      cor: '#20c997',
      icone: 'fas fa-tint'
    },
    {
      codigo: 'FERR',
      nome: 'Ferramentas',
      descricao: 'Ferramentas e equipamentos de trabalho',
      cor: '#6c757d',
      icone: 'fas fa-tools'
    },
    {
      codigo: 'LIMP',
      nome: 'Material de Limpeza',
      descricao: 'Produtos de limpeza e higienização',
      cor: '#17a2b8',
      icone: 'fas fa-broom'
    },
    {
      codigo: 'ESCR',
      nome: 'Material de Escritório',
      descricao: 'Suprimentos para escritório',
      cor: '#007bff',
      icone: 'fas fa-file-alt'
    },
    {
      codigo: 'SEGUR',
      nome: 'Equipamentos de Segurança',
      descricao: 'EPIs e equipamentos de segurança',
      cor: '#ffc107',
      icone: 'fas fa-hard-hat'
    },
    {
      codigo: 'MANU',
      nome: 'Peças de Manutenção',
      descricao: 'Peças de reposição e manutenção',
      cor: '#28a745',
      icone: 'fas fa-cog'
    }
  ],

  // Permissões do sistema por módulo
  permissions: [
    // Módulo de Usuários
    { name: 'users.create', description: 'Criar novos usuários', module: 'users', action: 'create', resource: null },
    { name: 'users.read', description: 'Visualizar usuários', module: 'users', action: 'read', resource: null },
    { name: 'users.update', description: 'Editar usuários', module: 'users', action: 'update', resource: null },
    { name: 'users.delete', description: 'Excluir usuários', module: 'users', action: 'delete', resource: null },
    { name: 'users.manage', description: 'Gerenciar todos os usuários', module: 'users', action: 'manage', resource: null },
    
    // Módulo de Permissões
    { name: 'permissions.create', description: 'Criar permissões', module: 'permissions', action: 'create', resource: null },
    { name: 'permissions.read', description: 'Visualizar permissões', module: 'permissions', action: 'read', resource: null },
    { name: 'permissions.update', description: 'Editar permissões', module: 'permissions', action: 'update', resource: null },
    { name: 'permissions.delete', description: 'Excluir permissões', module: 'permissions', action: 'delete', resource: null },
    { name: 'permissions.assign', description: 'Atribuir permissões a usuários', module: 'permissions', action: 'assign', resource: null },
    
    // Módulo de Solicitações
    { name: 'solicitacoes.create', description: 'Criar solicitações', module: 'solicitacoes', action: 'create', resource: null },
    { name: 'solicitacoes.read', description: 'Visualizar solicitações', module: 'solicitacoes', action: 'read', resource: null },
    { name: 'solicitacoes.update', description: 'Editar solicitações', module: 'solicitacoes', action: 'update', resource: null },
    { name: 'solicitacoes.delete', description: 'Excluir solicitações', module: 'solicitacoes', action: 'delete', resource: null },
    { name: 'solicitacoes.approve', description: 'Aprovar solicitações', module: 'solicitacoes', action: 'approve', resource: null },
    { name: 'solicitacoes.assign', description: 'Atribuir solicitações', module: 'solicitacoes', action: 'assign', resource: null },
    
    // Módulo de Ordens de Serviço
    { name: 'ordens.create', description: 'Criar ordens de serviço', module: 'ordens', action: 'create', resource: null },
    { name: 'ordens.read', description: 'Visualizar ordens de serviço', module: 'ordens', action: 'read', resource: null },
    { name: 'ordens.update', description: 'Editar ordens de serviço', module: 'ordens', action: 'update', resource: null },
    { name: 'ordens.delete', description: 'Excluir ordens de serviço', module: 'ordens', action: 'delete', resource: null },
    { name: 'ordens.complete', description: 'Finalizar ordens de serviço', module: 'ordens', action: 'complete', resource: null },
    { name: 'ordens.assign', description: 'Atribuir ordens de serviço', module: 'ordens', action: 'assign', resource: null },
    
    // Módulo de Ativos
    { name: 'ativos.create', description: 'Cadastrar ativos', module: 'ativos', action: 'create', resource: null },
    { name: 'ativos.read', description: 'Visualizar ativos', module: 'ativos', action: 'read', resource: null },
    { name: 'ativos.update', description: 'Editar ativos', module: 'ativos', action: 'update', resource: null },
    { name: 'ativos.delete', description: 'Excluir ativos', module: 'ativos', action: 'delete', resource: null },
    { name: 'ativos.maintain', description: 'Realizar manutenção em ativos', module: 'ativos', action: 'maintain', resource: null },
    
    // Módulo de Estoque
    { name: 'estoque.create', description: 'Cadastrar itens de estoque', module: 'estoque', action: 'create', resource: null },
    { name: 'estoque.read', description: 'Visualizar estoque', module: 'estoque', action: 'read', resource: null },
    { name: 'estoque.update', description: 'Editar itens de estoque', module: 'estoque', action: 'update', resource: null },
    { name: 'estoque.delete', description: 'Excluir itens de estoque', module: 'estoque', action: 'delete', resource: null },
    { name: 'estoque.moviment', description: 'Movimentar estoque', module: 'estoque', action: 'moviment', resource: null },
    { name: 'estoque.categories', description: 'Gerenciar categorias de estoque', module: 'estoque', action: 'categories', resource: null },
    { name: 'estoque.suppliers', description: 'Gerenciar fornecedores', module: 'estoque', action: 'suppliers', resource: null },
    
    // Módulo de Manutenção Preventiva
    { name: 'preventiva.create', description: 'Criar planos preventivos', module: 'preventiva', action: 'create', resource: null },
    { name: 'preventiva.read', description: 'Visualizar manutenção preventiva', module: 'preventiva', action: 'read', resource: null },
    { name: 'preventiva.update', description: 'Editar planos preventivos', module: 'preventiva', action: 'update', resource: null },
    { name: 'preventiva.delete', description: 'Excluir planos preventivos', module: 'preventiva', action: 'delete', resource: null },
    { name: 'preventiva.schedule', description: 'Agendar manutenções', module: 'preventiva', action: 'schedule', resource: null },
    
    // Módulo de Relatórios
    { name: 'relatorios.read', description: 'Visualizar relatórios', module: 'relatorios', action: 'read', resource: null },
    { name: 'relatorios.export', description: 'Exportar relatórios', module: 'relatorios', action: 'export', resource: null },
    { name: 'relatorios.create', description: 'Criar relatórios personalizados', module: 'relatorios', action: 'create', resource: null },
    
    // Módulo de Configurações
    { name: 'config.read', description: 'Visualizar configurações', module: 'config', action: 'read', resource: null },
    { name: 'config.update', description: 'Alterar configurações', module: 'config', action: 'update', resource: null },
    { name: 'config.system', description: 'Configurações do sistema', module: 'config', action: 'system', resource: null },
    
    // Módulo de Dashboard
    { name: 'dashboard.read', description: 'Visualizar dashboard', module: 'dashboard', action: 'read', resource: null },
    { name: 'dashboard.analytics', description: 'Visualizar analytics', module: 'dashboard', action: 'analytics', resource: null }
  ]
};

class DatabaseInitializer {
  constructor() {
    this.connection = null;
    this.sequelize = null;
  }

  /**
   * Conecta ao MySQL sem especificar banco de dados
   */
  async connectToMySQL() {
    try {
      this.connection = await mysql.createConnection({
        host: DB_CONFIG.host,
        port: DB_CONFIG.port,
        user: DB_CONFIG.user,
        password: DB_CONFIG.password
      });
      
      logger.info('Conectado ao MySQL com sucesso');
      return true;
    } catch (error) {
      logger.error('Erro ao conectar ao MySQL:', error.message);
      throw error;
    }
  }

  /**
   * Verifica se o banco de dados existe
   */
  async checkDatabaseExists() {
    try {
      const [rows] = await this.connection.execute(
        'SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?',
        [DB_CONFIG.database]
      );
      
      const exists = rows.length > 0;
      logger.info(`Banco de dados '${DB_CONFIG.database}' ${exists ? 'existe' : 'não existe'}`);
      return exists;
    } catch (error) {
      logger.error('Erro ao verificar existência do banco:', error.message);
      throw error;
    }
  }

  /**
   * Cria o banco de dados
   */
  async createDatabase() {
    try {
      await this.connection.execute(`CREATE DATABASE IF NOT EXISTS \`${DB_CONFIG.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      logger.info(`Banco de dados '${DB_CONFIG.database}' criado com sucesso`);
    } catch (error) {
      logger.error('Erro ao criar banco de dados:', error.message);
      throw error;
    }
  }

  /**
   * Conecta ao Sequelize
   */
  async connectToSequelize() {
    try {
      this.sequelize = require('./config/database');
      await this.sequelize.authenticate();
      logger.info('Conexão Sequelize estabelecida com sucesso');
    } catch (error) {
      logger.error('Erro ao conectar via Sequelize:', error.message);
      throw error;
    }
  }

  /**
   * Sincroniza os modelos (cria tabelas)
   */
  async syncModels() {
    try {
      // Importar todos os modelos
      const models = require('./models');
      
      // Sincronizar tabelas (force: false não apaga dados existentes)
      await this.sequelize.sync({ force: false, alter: false });
      
      logger.info('Modelos sincronizados com sucesso - tabelas criadas');
    } catch (error) {
      logger.error('Erro ao sincronizar modelos:', error.message);
      throw error;
    }
  }

  /**
   * Verifica se já existem dados iniciais
   */
  async checkExistingData() {
    try {
      const models = require('./models');
      
      // Verificar se existe usuário admin
      const adminExists = await models.User.findOne({
        where: { email: INITIAL_DATA.admin.email }
      });

      // Verificar quantidade de departamentos
      const departmentCount = await models.Department.count();
      
      // Verificar quantidade de permissões
      const permissionCount = await models.Permission.count();

      return {
        adminExists: !!adminExists,
        departmentCount,
        permissionCount,
        hasBasicData: departmentCount > 0 && permissionCount > 0
      };
    } catch (error) {
      logger.error('Erro ao verificar dados existentes:', error.message);
      throw error;
    }
  }

  /**
   * Insere departamentos iniciais
   */
  async insertDepartments() {
    try {
      const models = require('./models');
      
      for (const dept of INITIAL_DATA.departments) {
        const [department, created] = await models.Department.findOrCreate({
          where: { nome: dept.nome },
          defaults: dept
        });
        
        if (created) {
          logger.info(`Departamento '${dept.nome}' criado`);
        } else {
          logger.info(`Departamento '${dept.nome}' já existe`);
        }
      }
    } catch (error) {
      logger.error('Erro ao inserir departamentos:', error.message);
      throw error;
    }
  }

  /**
   * Insere setores iniciais
   */
  async insertSetores() {
    try {
      const models = require('./models');
      
      if (!models.Setor) {
        logger.warn('Modelo Setor não encontrado, pulando inserção de setores');
        return;
      }
      
      for (const setor of INITIAL_DATA.setores) {
        const [setorRecord, created] = await models.Setor.findOrCreate({
          where: { codigo: setor.codigo },
          defaults: setor
        });
        
        if (created) {
          logger.info(`Setor '${setor.nome}' criado`);
        } else {
          logger.info(`Setor '${setor.nome}' já existe`);
        }
      }
    } catch (error) {
      logger.error('Erro ao inserir setores:', error.message);
      throw error;
    }
  }

  /**
   * Insere categorias iniciais
   */
  async insertCategories() {
    try {
      const models = require('./models');
      
      for (const cat of INITIAL_DATA.categories) {
        const [category, created] = await models.Category.findOrCreate({
          where: { nome: cat.nome },
          defaults: cat
        });
        
        if (created) {
          logger.info(`Categoria '${cat.nome}' criada`);
        } else {
          logger.info(`Categoria '${cat.nome}' já existe`);
        }
      }
    } catch (error) {
      logger.error('Erro ao inserir categorias:', error.message);
      throw error;
    }
  }

  /**
   * Insere subcategorias iniciais
   */
  async insertSubCategories() {
    try {
      const models = require('./models');
      
      for (const subcat of INITIAL_DATA.subcategories) {
        // Encontrar a categoria pai
        const category = await models.Category.findOne({
          where: { nome: subcat.category }
        });
        
        if (!category) {
          logger.warn(`Categoria '${subcat.category}' não encontrada para subcategoria '${subcat.nome}'`);
          continue;
        }
        
        const [subcategory, created] = await models.SubCategory.findOrCreate({
          where: { 
            nome: subcat.nome,
            category_id: category.id 
          },
          defaults: {
            nome: subcat.nome,
            descricao: subcat.descricao,
            category_id: category.id
          }
        });
        
        if (created) {
          logger.info(`Subcategoria '${subcat.nome}' criada`);
        } else {
          logger.info(`Subcategoria '${subcat.nome}' já existe`);
        }
      }
    } catch (error) {
      logger.error('Erro ao inserir subcategorias:', error.message);
      throw error;
    }
  }

  /**
   * Insere categorias de estoque iniciais
   */
  async insertEstoqueCategories() {
    try {
      const models = require('./models');
      
      if (!models.CategoriaEstoque) {
        logger.warn('Modelo CategoriaEstoque não encontrado, pulando inserção');
        return;
      }
      
      for (const cat of INITIAL_DATA.categorias_estoque) {
        const [categoria, created] = await models.CategoriaEstoque.findOrCreate({
          where: { codigo: cat.codigo },
          defaults: cat
        });
        
        if (created) {
          logger.info(`Categoria de estoque '${cat.nome}' criada`);
        } else {
          logger.info(`Categoria de estoque '${cat.nome}' já existe`);
        }
      }
    } catch (error) {
      logger.error('Erro ao inserir categorias de estoque:', error.message);
      throw error;
    }
  }

  /**
   * Insere permissões iniciais
   */
  async insertPermissions() {
    try {
      const models = require('./models');
      
      for (const perm of INITIAL_DATA.permissions) {
        const [permission, created] = await models.Permission.findOrCreate({
          where: { name: perm.name },
          defaults: perm
        });
        
        if (created) {
          logger.info(`Permissão '${perm.name}' criada`);
        } else {
          logger.info(`Permissão '${perm.name}' já existe`);
        }
      }
    } catch (error) {
      logger.error('Erro ao inserir permissões:', error.message);
      throw error;
    }
  }

  /**
   * Cria usuário administrador
   */
  async createAdminUser() {
    try {
      const models = require('./models');
      
      // Verificar se já existe
      const existingAdmin = await models.User.findOne({
        where: { email: INITIAL_DATA.admin.email }
      });
      
      if (existingAdmin) {
        logger.info('Usuário administrador já existe');
        return existingAdmin;
      }
      
      // Encontrar departamento de TI
      const tiDepartment = await models.Department.findOne({
        where: { nome: 'Tecnologia da Informação' }
      });
      
      // Criar usuário admin
      const adminData = {
        ...INITIAL_DATA.admin,
        department_id: tiDepartment ? tiDepartment.id : null
      };
      
      const admin = await models.User.create(adminData);
      logger.info('Usuário administrador criado com sucesso');
      
      return admin;
    } catch (error) {
      logger.error('Erro ao criar usuário administrador:', error.message);
      throw error;
    }
  }

  /**
   * Atribui todas as permissões ao administrador
   */
  async assignAdminPermissions() {
    try {
      const models = require('./models');
      
      // Encontrar usuário admin
      const admin = await models.User.findOne({
        where: { email: INITIAL_DATA.admin.email }
      });
      
      if (!admin) {
        logger.error('Usuário administrador não encontrado');
        return;
      }
      
      // Buscar todas as permissões
      const permissions = await models.Permission.findAll();
      
      // Atribuir todas as permissões ao admin
      for (const permission of permissions) {
        const [userPermission, created] = await models.UserPermission.findOrCreate({
          where: {
            user_id: admin.id,
            permission_id: permission.id
          },
          defaults: {
            user_id: admin.id,
            permission_id: permission.id,
            granted_by: admin.id,
            granted_at: new Date()
          }
        });
        
        if (created) {
          logger.info(`Permissão '${permission.name}' atribuída ao administrador`);
        }
      }
      
      logger.info('Todas as permissões foram atribuídas ao administrador');
    } catch (error) {
      logger.error('Erro ao atribuir permissões ao administrador:', error.message);
      throw error;
    }
  }

  /**
   * Executa todo o processo de inicialização
   */
  async initialize() {
    try {
      logger.info('🚀 Iniciando processo de configuração do banco de dados...');
      
      // 1. Conectar ao MySQL
      await this.connectToMySQL();
      
      // 2. Verificar se banco existe
      const dbExists = await this.checkDatabaseExists();
      
      // 3. Criar banco se não existir
      if (!dbExists) {
        logger.info('📦 Criando banco de dados...');
        await this.createDatabase();
      }
      
      // 4. Fechar conexão MySQL direta
      if (this.connection) {
        await this.connection.end();
      }
      
      // 5. Conectar via Sequelize
      await this.connectToSequelize();
      
      // 6. Sincronizar modelos (criar tabelas)
      logger.info('🔄 Sincronizando modelos e criando tabelas...');
      await this.syncModels();
      
      // 7. Verificar dados existentes
      const existingData = await this.checkExistingData();
      logger.info('📊 Dados existentes:', existingData);
      
      // 8. Inserir dados iniciais se necessário
      if (!existingData.hasBasicData) {
        logger.info('📝 Inserindo dados iniciais...');
        
        await this.insertDepartments();
        await this.insertSetores();
        await this.insertCategories();
        await this.insertSubCategories();
        await this.insertEstoqueCategories();
        await this.insertPermissions();
      } else {
        logger.info('✅ Dados básicos já existem');
      }
      
      // 9. Criar usuário administrador se não existir
      if (!existingData.adminExists) {
        logger.info('👤 Criando usuário administrador...');
        await this.createAdminUser();
        await this.assignAdminPermissions();
      } else {
        logger.info('✅ Usuário administrador já existe');
      }
      
      // 10. Fechar conexão
      if (this.sequelize) {
        await this.sequelize.close();
      }
      
      logger.info('🎉 Inicialização do banco de dados concluída com sucesso!');
      
      // Resumo final
      logger.info('\n' + '='.repeat(60));
      logger.info('📋 RESUMO DA CONFIGURAÇÃO:');
      logger.info('='.repeat(60));
      logger.info(`🗄️  Banco de dados: ${DB_CONFIG.database}`);
      logger.info(`👤 Usuário admin: ${INITIAL_DATA.admin.email}`);
      logger.info(`🔑 Senha admin: ${INITIAL_DATA.admin.senha}`);
      logger.info(`🏢 Departamentos: ${INITIAL_DATA.departments.length} configurados`);
      logger.info(`🏭 Setores: ${INITIAL_DATA.setores.length} configurados`);
      logger.info(`📂 Categorias: ${INITIAL_DATA.categories.length} configuradas`);
      logger.info(`📋 Subcategorias: ${INITIAL_DATA.subcategories.length} configuradas`);
      logger.info(`📦 Categorias de estoque: ${INITIAL_DATA.categorias_estoque.length} configuradas`);
      logger.info(`🔐 Permissões: ${INITIAL_DATA.permissions.length} configuradas`);
      logger.info('='.repeat(60));
      
      return {
        success: true,
        message: 'Sistema inicializado com sucesso',
        database: DB_CONFIG.database,
        adminUser: INITIAL_DATA.admin.email,
        adminPassword: INITIAL_DATA.admin.senha
      };
      
    } catch (error) {
      logger.error('❌ Erro durante inicialização:', error.message);
      
      // Fechar conexões abertas
      if (this.connection) {
        try {
          await this.connection.end();
        } catch (e) {
          logger.error('Erro ao fechar conexão MySQL:', e.message);
        }
      }
      
      if (this.sequelize) {
        try {
          await this.sequelize.close();
        } catch (e) {
          logger.error('Erro ao fechar conexão Sequelize:', e.message);
        }
      }
      
      throw error;
    }
  }
}

// Função principal para executar a inicialização
async function initializeDatabase() {
  const initializer = new DatabaseInitializer();
  return await initializer.initialize();
}

// Exportar função principal
module.exports = {
  initializeDatabase,
  DatabaseInitializer,
  INITIAL_DATA,
  DB_CONFIG
};

// Executar se chamado diretamente
if (require.main === module) {
  initializeDatabase()
    .then((result) => {
      console.log('\n✅ Inicialização concluída com sucesso!');
      console.log('📋 Resultado:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Erro na inicialização:', error.message);
      process.exit(1);
    });
}