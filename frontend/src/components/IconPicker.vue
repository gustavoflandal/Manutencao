<template>
  <div class="icon-picker">
    <!-- Botão para abrir o seletor -->
    <div class="icon-input-wrapper">
      <button 
        type="button" 
        class="icon-trigger" 
        @click="isOpen = !isOpen"
        :class="{ 'active': isOpen }"
      >
        <div class="selected-icon">
          <component 
            v-if="selectedIcon?.component" 
            :is="selectedIcon.component" 
            class="icon-component" 
            :size="20" 
            :color="iconColor" 
          />
          <i v-else class="fas fa-folder" :style="{ color: iconColor }"></i>
        </div>
        <span class="icon-name">{{ selectedIcon?.description || 'Selecionar ícone' }}</span>
        <i class="fas fa-chevron-down" :class="{ 'rotated': isOpen }"></i>
      </button>
    </div>

    <!-- Modal do seletor -->
    <div v-if="isOpen" class="icon-picker-modal" @click="isOpen = false">
      <div class="icon-picker-content" @click.stop>
        <div class="picker-header">
          <h4>Selecionar Ícone</h4>
          <button class="btn-close" @click="isOpen = false">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <!-- Busca -->
        <div class="picker-search">
          <input
            type="text"
            v-model="searchTerm"
            placeholder="Buscar ícone..."
            class="search-input"
          />
          <i class="fas fa-search search-icon"></i>
        </div>

        <!-- Filtro por categoria -->
        <div class="category-filter">
          <button
            v-for="category in iconCategories"
            :key="category.id"
            class="category-btn"
            :class="{ 'active': selectedCategory === category.id }"
            @click="selectedCategory = selectedCategory === category.id ? null : category.id"
            :style="{ borderColor: category.color }"
          >
            <span class="category-color" :style="{ backgroundColor: category.color }"></span>
            {{ category.name }}
          </button>
        </div>

        <!-- Grid de ícones -->
        <div class="icons-grid">
          <button
            v-for="icon in filteredIcons"
            :key="icon.name"
            class="icon-item"
            :class="{ 'selected': modelValue === icon.name }"
            @click="selectIcon(icon)"
            :title="icon.description"
          >
            <component 
              v-if="icon.component" 
              :is="icon.component" 
              class="icon-component" 
              :size="24" 
              :color="iconColor" 
            />
            <i v-else class="fas fa-folder" :style="{ color: iconColor }"></i>
            <span class="icon-label">{{ icon.description }}</span>
          </button>
        </div>

        <!-- Footer -->
        <div class="picker-footer">
          <button class="btn btn-outline" @click="clearSelection">
            <i class="fas fa-times"></i>
            Limpar
          </button>
          <button class="btn btn-primary" @click="isOpen = false">
            <i class="fas fa-check"></i>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { systemIcons, iconCategories, getIconsByCategory } from '@/assets/icons'

export default {
  name: 'IconPicker',
  props: {
    modelValue: {
      type: String,
      default: ''
    },
    iconColor: {
      type: String,
      default: '#6c757d'
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const isOpen = ref(false)
    const searchTerm = ref('')
    const selectedCategory = ref(null)

    // Ícone selecionado
    const selectedIcon = computed(() => {
      return systemIcons.find(icon => icon.name === props.modelValue)
    })

    // Ícones filtrados
    const filteredIcons = computed(() => {
      let icons = systemIcons

      // Filtrar por categoria
      if (selectedCategory.value) {
        icons = getIconsByCategory(selectedCategory.value)
      }

      // Filtrar por busca
      if (searchTerm.value) {
        icons = icons.filter(icon => 
          icon.name.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
          icon.description.toLowerCase().includes(searchTerm.value.toLowerCase())
        )
      }

      return icons
    })

    // Selecionar ícone
    const selectIcon = (icon) => {
      emit('update:modelValue', icon.name)
    }

    // Limpar seleção
    const clearSelection = () => {
      emit('update:modelValue', '')
    }

    // Fechar ao clicar fora
    const handleClickOutside = (event) => {
      if (!event.target.closest('.icon-picker')) {
        isOpen.value = false
      }
    }

    // Adicionar listener quando abrir
    watch(isOpen, (newValue) => {
      if (newValue) {
        document.addEventListener('click', handleClickOutside)
      } else {
        document.removeEventListener('click', handleClickOutside)
      }
    })

    return {
      isOpen,
      searchTerm,
      selectedCategory,
      selectedIcon,
      filteredIcons,
      iconCategories,
      selectIcon,
      clearSelection
    }
  }
}
</script>

<style scoped>
.icon-picker {
  position: relative;
  width: 100%;
}

.icon-input-wrapper {
  width: 100%;
}

.icon-trigger {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.icon-trigger:hover {
  border-color: var(--btn-primary);
}

.icon-trigger.active {
  border-color: var(--btn-primary);
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.selected-icon {
  width: 24px;
  height: 24px;
  margin-right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-component {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.icon-name {
  flex: 1;
  font-size: 14px;
  color: #495057;
}

.fa-chevron-down {
  transition: transform 0.2s ease;
  color: #6c757d;
}

.fa-chevron-down.rotated {
  transform: rotate(180deg);
}

.icon-picker-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.icon-picker-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid #e1e5e9;
}

.picker-header h4 {
  margin: 0;
  color: #2c3e50;
}

.btn-close {
  background: none;
  border: none;
  color: #6c757d;
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.btn-close:hover {
  color: #dc3545;
  background: #f8f9fa;
}

.picker-search {
  position: relative;
  padding: 20px;
  border-bottom: 1px solid #e1e5e9;
}

.search-input {
  width: 100%;
  padding: 12px 16px 12px 40px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s ease;
}

.search-input:focus {
  border-color: var(--btn-primary);
}

.search-icon {
  position: absolute;
  left: 32px;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
}

.category-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 20px;
  border-bottom: 1px solid #e1e5e9;
}

.category-btn {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border: 2px solid #e1e5e9;
  border-radius: 20px;
  background: white;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
}

.category-btn:hover {
  background: #f8f9fa;
}

.category-btn.active {
  background: #f8f9fa;
  border-color: currentColor;
}

.category-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 6px;
}

.icons-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 8px;
  padding: 20px;
  overflow-y: auto;
  max-height: 300px;
}

.icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  border: 2px solid transparent;
  border-radius: 8px;
  background: #f8f9fa;
  cursor: pointer;
  transition: all 0.2s ease;
}

.icon-item:hover {
  background: #e9ecef;
  border-color: #dee2e6;
}

.icon-item.selected {
  background: rgba(0, 123, 255, 0.1);
  border-color: var(--btn-primary);
}

.icon-item .icon-component {
  width: 24px;
  height: 24px;
  margin-bottom: 4px;
  flex-shrink: 0;
}

.icon-label {
  font-size: 10px;
  color: #6c757d;
  text-align: center;
  line-height: 1.2;
}

.picker-footer {
  display: flex;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid #e1e5e9;
  justify-content: flex-end;
}

.btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.btn-outline {
  background: white;
  border: 2px solid #6c757d;
  color: #6c757d;
}

.btn-outline:hover {
  background: #6c757d;
  color: white;
}

.btn-primary {
  background: var(--btn-primary);
  color: white;
}

.btn-primary:hover {
  background: #0056b3;
}

/* Responsivo */
@media (max-width: 768px) {
  .icon-picker-content {
    width: 95%;
    max-height: 90vh;
  }
  
  .icons-grid {
    grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
  }
  
  .category-filter {
    flex-direction: column;
  }
  
  .picker-footer {
    flex-direction: column-reverse;
  }
  
  .picker-footer .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>