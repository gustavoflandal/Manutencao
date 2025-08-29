import axios from 'axios';

// Criar instância do axios com configurações base
const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para adicionar token em todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`📤 ${config.method.toUpperCase()} ${config.url}`, config.data);
    return config;
  },
  (error) => {
    console.error('❌ Erro na requisição:', error);
    return Promise.reject(error);
  }
);

// Interceptor para tratar respostas
api.interceptors.response.use(
  (response) => {
    console.log(`📥 Resposta de ${response.config.url}:`, response.data);
    return response;
  },
  (error) => {
    if (error.response) {
      // O servidor respondeu com um status de erro
      console.error('Erro na resposta:', error.response.data);
      
      // Se o token expirou, fazer logout
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      
      return Promise.reject(error.response.data);
    } else if (error.request) {
      // A requisição foi feita mas não houve resposta
      console.error('Erro na resposta: Network Error');
      return Promise.reject({
        success: false,
        message: 'Erro de conexão com o servidor'
      });
    } else {
      // Erro na configuração da requisição
      console.error('Erro:', error.message);
      return Promise.reject({
        success: false,
        message: 'Erro ao fazer requisição'
      });
    }
  }
);

// Exportar a instância configurada do axios como default
export default api;