const express = require('express');
const router = express.Router();
const EstoqueController = require('../controllers/EstoqueController');
const { authenticate } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permissions');

// Aplicar autenticação a todas as rotas
router.use(authenticate);

// ========== ROTAS DE CATEGORIAS DE ESTOQUE ==========

// Listar categorias
router.get('/categorias', 
  checkPermission('estoque.visualizar'),
  EstoqueController.listarCategorias
);

// Obter categoria específica
router.get('/categorias/:id', 
  checkPermission('estoque.visualizar'),
  EstoqueController.obterCategoria
);

// Criar categoria
router.post('/categorias', 
  checkPermission('estoque.criar'),
  EstoqueController.criarCategoria
);

// Atualizar categoria
router.put('/categorias/:id', 
  checkPermission('estoque.editar'),
  EstoqueController.atualizarCategoria
);

// Excluir categoria
router.delete('/categorias/:id', 
  checkPermission('estoque.excluir'),
  EstoqueController.excluirCategoria
);

// ========== ROTAS DE FORNECEDORES ==========

// Listar fornecedores
router.get('/fornecedores', 
  checkPermission('estoque.visualizar'),
  EstoqueController.listarFornecedores
);

// Obter fornecedor específico
router.get('/fornecedores/:id', 
  checkPermission('estoque.visualizar'),
  EstoqueController.obterFornecedor
);

// Criar fornecedor
router.post('/fornecedores', 
  checkPermission('estoque.criar'),
  EstoqueController.criarFornecedor
);

// Atualizar fornecedor
router.put('/fornecedores/:id', 
  checkPermission('estoque.editar'),
  EstoqueController.atualizarFornecedor
);

// Excluir fornecedor
router.delete('/fornecedores/:id', 
  checkPermission('estoque.excluir'),
  EstoqueController.excluirFornecedor
);

// ========== ROTAS DE ITENS DE ESTOQUE ==========

// Listar itens
router.get('/itens', 
  checkPermission('estoque.visualizar'),
  EstoqueController.listarItens
);

// Obter item específico
router.get('/itens/:id', 
  checkPermission('estoque.visualizar'),
  EstoqueController.obterItem
);

// Criar item
router.post('/itens', 
  checkPermission('estoque.criar'),
  EstoqueController.criarItem
);

// Atualizar item
router.put('/itens/:id', 
  checkPermission('estoque.editar'),
  EstoqueController.atualizarItem
);

// Excluir item
router.delete('/itens/:id', 
  checkPermission('estoque.excluir'),
  EstoqueController.excluirItem
);

// ========== ROTAS DE MOVIMENTAÇÕES ==========

// Listar movimentações
router.get('/movimentacoes', 
  checkPermission('estoque.visualizar'),
  EstoqueController.listarMovimentacoes
);

// Criar movimentação (entrada/saída)
router.post('/movimentacoes', 
  checkPermission('estoque.movimentar'),
  EstoqueController.criarMovimentacao
);

// ========== ROTAS DE RELATÓRIOS ==========

// Relatório de estoque atual
router.get('/relatorios/estoque', 
  checkPermission('estoque.relatorios'),
  EstoqueController.relatorioEstoque
);

// Relatório de movimentações por período
router.get('/relatorios/movimentacoes', 
  checkPermission('estoque.relatorios'),
  EstoqueController.relatorioMovimentacoes
);

// Alertas de estoque (baixo estoque, itens críticos, etc)
router.get('/alertas', 
  checkPermission('estoque.visualizar'),
  EstoqueController.alertasEstoque
);

module.exports = router;
