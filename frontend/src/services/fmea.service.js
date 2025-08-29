import api from './api';

class FmeaService {
  // Listar análises FMEA com paginação e filtros
  async list(params = {}) {
    const response = await api.get('/fmea', { params });
    return response.data;
  }

  // Obter uma análise FMEA específica
  async get(id) {
    const response = await api.get(`/fmea/${id}`);
    return response.data;
  }

  // Criar nova análise FMEA
  async create(data) {
    const response = await api.post('/fmea', data);
    return response.data;
  }

  // Atualizar análise FMEA
  async update(id, data) {
    const response = await api.put(`/fmea/${id}`, data);
    return response.data;
  }

  // Adicionar ação a uma análise FMEA
  async addAction(id, data) {
    const response = await api.post(`/fmea/${id}/actions`, data);
    return response.data;
  }

  // Obter análises críticas
  async getCriticalAnalyses() {
    const response = await api.get('/fmea/reports/critical');
    return response.data;
  }

  // Obter estatísticas
  async getStatistics() {
    const response = await api.get('/fmea/reports/statistics');
    return response.data;
  }
}

export default new FmeaService();

