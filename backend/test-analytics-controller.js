// Teste do AnalyticsController
const AnalyticsController = require('./controllers/AnalyticsController');

console.log('AnalyticsController type:', typeof AnalyticsController);
console.log('listarMetricas type:', typeof AnalyticsController.listarMetricas);
console.log('obterKPIs type:', typeof AnalyticsController.obterKPIs);

console.log('Controller properties:', Object.getOwnPropertyNames(AnalyticsController));
console.log('Controller methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(AnalyticsController)));