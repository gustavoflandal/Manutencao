import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { nextTick } from 'vue';
import FmeaList from '../src/components/fmea/FmeaList.vue';
import FmeaForm from '../src/components/fmea/FmeaForm.vue';
import FmeaDetails from '../src/components/fmea/FmeaDetails.vue';
import FmeaDashboard from '../src/components/fmea/FmeaDashboard.vue';
import { useFmeaStore } from '../src/stores/fmea';

describe('Componentes FMEA', () => {
  describe('FmeaList', () => {
    it('deve renderizar a lista de análises FMEA', async () => {
      const wrapper = mount(FmeaList, {
        global: {
          plugins: [createTestingPinia({
            initialState: {
              fmea: {
                analyses: [
                  {
                    id: 1,
                    component: 'Motor',
                    rpn: 192,
                    status: 'open'
                  }
                ],
                pagination: {
                  current_page: 1,
                  total: 1
                }
              }
            }
          })]
        }
      });

      expect(wrapper.find('table').exists()).toBe(true);
      expect(wrapper.text()).toContain('Motor');
      expect(wrapper.text()).toContain('192');
    });

    it('deve aplicar filtros corretamente', async () => {
      const wrapper = mount(FmeaList, {
        global: {
          plugins: [createTestingPinia()]
        }
      });

      const store = useFmeaStore();

      await wrapper.find('select[v-model="filters.status"]').setValue('open');
      await wrapper.find('button:contains("Aplicar Filtros")').trigger('click');

      expect(store.updateFilters).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'open' })
      );
    });
  });

  describe('FmeaForm', () => {
    it('deve calcular RPN automaticamente', async () => {
      const wrapper = mount(FmeaForm, {
        global: {
          plugins: [createTestingPinia()]
        }
      });

      await wrapper.find('input[v-model="formData.severity"]').setValue(8);
      await wrapper.find('input[v-model="formData.occurrence"]').setValue(6);
      await wrapper.find('input[v-model="formData.detection"]').setValue(4);

      await nextTick();

      expect(wrapper.text()).toContain('RPN: 192');
    });

    it('deve validar campos obrigatórios', async () => {
      const wrapper = mount(FmeaForm, {
        global: {
          plugins: [createTestingPinia()]
        }
      });

      await wrapper.find('form').trigger('submit.prevent');

      expect(wrapper.text()).toContain('obrigatório');
    });
  });

  describe('FmeaDetails', () => {
    it('deve exibir detalhes da análise FMEA', async () => {
      const wrapper = mount(FmeaDetails, {
        global: {
          plugins: [createTestingPinia({
            initialState: {
              fmea: {
                currentAnalysis: {
                  id: 1,
                  component: 'Motor',
                  rpn: 192,
                  status: 'open',
                  actions: []
                }
              }
            }
          })]
        }
      });

      expect(wrapper.text()).toContain('Motor');
      expect(wrapper.text()).toContain('192');
    });

    it('deve permitir adicionar ações', async () => {
      const wrapper = mount(FmeaDetails, {
        global: {
          plugins: [createTestingPinia()]
        }
      });

      const store = useFmeaStore();

      await wrapper.find('button:contains("Adicionar Ação")').trigger('click');
      await wrapper.find('textarea[v-model="newAction.action_taken"]')
        .setValue('Nova ação de teste');
      await wrapper.find('form').trigger('submit.prevent');

      expect(store.addAction).toHaveBeenCalled();
    });
  });

  describe('FmeaDashboard', () => {
    it('deve exibir estatísticas corretamente', async () => {
      const wrapper = mount(FmeaDashboard, {
        global: {
          plugins: [createTestingPinia({
            initialState: {
              fmea: {
                statistics: {
                  total_analyses: 10,
                  critical_analyses: 2,
                  average_rpn: 150
                }
              }
            }
          })]
        }
      });

      expect(wrapper.text()).toContain('10');
      expect(wrapper.text()).toContain('2');
      expect(wrapper.text()).toContain('150');
    });

    it('deve atualizar gráficos quando dados mudam', async () => {
      const wrapper = mount(FmeaDashboard, {
        global: {
          plugins: [createTestingPinia()]
        }
      });

      const store = useFmeaStore();
      
      await store.$patch({
        statistics: {
          total_analyses: 15,
          critical_analyses: 3,
          average_rpn: 160
        }
      });

      await nextTick();

      // Verifica se os gráficos foram atualizados
      expect(wrapper.vm.rpnChartInstance.data.datasets[0].data)
        .toEqual(expect.any(Array));
      expect(wrapper.vm.statusChartInstance.data.datasets[0].data)
        .toEqual(expect.any(Array));
    });
  });
});
