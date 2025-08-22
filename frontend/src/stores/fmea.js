import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import FmeaService from '../services/fmea.service';
import { useToast } from '../composables/useToast';

export const useFmeaStore = defineStore('fmea', () => {
  const toast = useToast();
  
  // Estado
  const analyses = ref([]);
  const currentAnalysis = ref(null);
  const loading = ref(false);
  const pagination = ref({
    total: 0,
    current_page: 1,
    pages: 1
  });
  const filters = ref({
    status: '',
    equipment_id: null,
    rpn_min: null,
    rpn_max: null
  });
  const statistics = ref(null);

  // Getters computados
  const criticalAnalyses = computed(() => 
    analyses.value.filter(a => a.rpn >= 200)
  );

  const analysesByStatus = computed(() => {
    const result = {
      open: [],
      in_progress: [],
      completed: [],
      cancelled: []
    };
    analyses.value.forEach(a => {
      result[a.status].push(a);
    });
    return result;
  });

  // Ações
  async function fetchAnalyses(page = 1) {
    try {
      loading.value = true;
      const response = await FmeaService.list({
        page,
        ...filters.value
      });
      
      analyses.value = response.data;
      pagination.value = {
        total: response.total,
        current_page: response.current_page,
        pages: response.pages
      };
    } catch (error) {
      toast.error('Erro ao carregar análises FMEA');
      console.error('Erro ao carregar análises:', error);
    } finally {
      loading.value = false;
    }
  }

  async function fetchAnalysis(id) {
    try {
      loading.value = true;
      const response = await FmeaService.get(id);
      currentAnalysis.value = response.data;
    } catch (error) {
      toast.error('Erro ao carregar análise FMEA');
      console.error('Erro ao carregar análise:', error);
    } finally {
      loading.value = false;
    }
  }

  async function createAnalysis(data) {
    try {
      loading.value = true;
      const response = await FmeaService.create(data);
      toast.success('Análise FMEA criada com sucesso');
      return response.data;
    } catch (error) {
      toast.error('Erro ao criar análise FMEA');
      console.error('Erro ao criar análise:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function updateAnalysis(id, data) {
    try {
      loading.value = true;
      const response = await FmeaService.update(id, data);
      
      if (currentAnalysis.value?.id === id) {
        currentAnalysis.value = response.data;
      }
      
      const index = analyses.value.findIndex(a => a.id === id);
      if (index !== -1) {
        analyses.value[index] = response.data;
      }
      
      toast.success('Análise FMEA atualizada com sucesso');
    } catch (error) {
      toast.error('Erro ao atualizar análise FMEA');
      console.error('Erro ao atualizar análise:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function addAction(id, data) {
    try {
      loading.value = true;
      const response = await FmeaService.addAction(id, data);
      
      if (currentAnalysis.value?.id === id) {
        currentAnalysis.value.actions.push(response.data);
      }
      
      toast.success('Ação adicionada com sucesso');
    } catch (error) {
      toast.error('Erro ao adicionar ação');
      console.error('Erro ao adicionar ação:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function fetchStatistics() {
    try {
      loading.value = true;
      const response = await FmeaService.getStatistics();
      statistics.value = response.data;
    } catch (error) {
      toast.error('Erro ao carregar estatísticas');
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      loading.value = false;
    }
  }

  function updateFilters(newFilters) {
    filters.value = {
      ...filters.value,
      ...newFilters
    };
    fetchAnalyses(1); // Reset para primeira página ao filtrar
  }

  function resetFilters() {
    filters.value = {
      status: '',
      equipment_id: null,
      rpn_min: null,
      rpn_max: null
    };
    fetchAnalyses(1);
  }

  return {
    // Estado
    analyses,
    currentAnalysis,
    loading,
    pagination,
    filters,
    statistics,
    
    // Getters
    criticalAnalyses,
    analysesByStatus,
    
    // Ações
    fetchAnalyses,
    fetchAnalysis,
    createAnalysis,
    updateAnalysis,
    addAction,
    fetchStatistics,
    updateFilters,
    resetFilters
  };
});
