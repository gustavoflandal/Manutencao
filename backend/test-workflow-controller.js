// Teste do WorkflowController
try {
  const WorkflowController = require('./controllers/WorkflowController');
  console.log('WorkflowController type:', typeof WorkflowController);
  console.log('listarWorkflows type:', typeof WorkflowController.listarWorkflows);
  console.log('obterTemplates type:', typeof WorkflowController.obterTemplates);
  console.log('Controller methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(WorkflowController)));
} catch (error) {
  console.error('Erro ao carregar WorkflowController:', error.message);
}