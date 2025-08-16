import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'

export const useAuthStore = defineStore('auth', () => {
  // Estado
  const user = ref(null)
  const token = ref(localStorage.getItem('access_token'))
  const refreshToken = ref(localStorage.getItem('refresh_token'))
  const loading = ref(false)
  const error = ref(null)

  // Getters
  const isAuthenticated = computed(() => !!user.value && !!token.value)
  const userRole = computed(() => user.value?.perfil || null)
  const userName = computed(() => user.value?.nome || '')

  // Actions
  const login = async (credentials) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await api.post('/auth/login', credentials)
      
      if (response.data.success) {
        const { user: userData, accessToken, refreshToken: newRefreshToken } = response.data.data
        
        // Armazenar dados do usuário e tokens
        user.value = userData
        token.value = accessToken
        refreshToken.value = newRefreshToken
        
        // Salvar no localStorage
        localStorage.setItem('access_token', accessToken)
        localStorage.setItem('refresh_token', newRefreshToken)
        
        // Configurar token padrão do axios
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
        
        return { success: true }
      } else {
        throw new Error(response.data.message || 'Erro no login')
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Erro no login'
      error.value = errorMessage
      return { success: false, message: errorMessage }
    } finally {
      loading.value = false
    }
  }

  const logout = () => {
    // Limpar estado
    user.value = null
    token.value = null
    refreshToken.value = null
    error.value = null
    
    // Limpar localStorage
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    
    // Remover token padrão do axios
    delete api.defaults.headers.common['Authorization']
  }

  const verifyToken = async () => {
    if (!token.value) {
      throw new Error('Token não encontrado')
    }

    try {
      // Configurar token no header
      api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
      
      const response = await api.get('/auth/verify')
      
      if (response.data.success) {
        user.value = response.data.data.user
        return true
      } else {
        throw new Error('Token inválido')
      }
    } catch (err) {
      // Token inválido, fazer logout
      logout()
      throw err
    }
  }

  const refreshAccessToken = async () => {
    if (!refreshToken.value) {
      throw new Error('Refresh token não encontrado')
    }

    try {
      const response = await api.post('/auth/refresh', {
        refreshToken: refreshToken.value
      })

      if (response.data.success) {
        const newAccessToken = response.data.data.accessToken
        token.value = newAccessToken
        localStorage.setItem('access_token', newAccessToken)
        api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`
        return newAccessToken
      } else {
        throw new Error('Falha ao renovar token')
      }
    } catch (err) {
      // Refresh token inválido, fazer logout
      logout()
      throw err
    }
  }

  const updateProfile = async (profileData) => {
    loading.value = true
    error.value = null

    try {
      const response = await api.put('/users/profile', profileData)
      
      if (response.data.success) {
        user.value = response.data.data.user
        return { success: true }
      } else {
        throw new Error(response.data.message || 'Erro ao atualizar perfil')
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao atualizar perfil'
      error.value = errorMessage
      return { success: false, message: errorMessage }
    } finally {
      loading.value = false
    }
  }

  const changePassword = async (passwordData) => {
    loading.value = true
    error.value = null

    try {
      const response = await api.post('/auth/change-password', passwordData)
      
      if (response.data.success) {
        return { success: true, message: response.data.message }
      } else {
        throw new Error(response.data.message || 'Erro ao alterar senha')
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao alterar senha'
      error.value = errorMessage
      return { success: false, message: errorMessage }
    } finally {
      loading.value = false
    }
  }

  // Verificar se usuário tem permissão
  const hasRole = (requiredRole) => {
    if (!user.value) return false
    
    const roleHierarchy = {
      'solicitante': 1,
      'tecnico': 2,
      'supervisor': 3,
      'administrador': 4
    }
    
    const userLevel = roleHierarchy[user.value.perfil] || 0
    const requiredLevel = roleHierarchy[requiredRole] || 0
    
    return userLevel >= requiredLevel
  }

  // Inicializar quando store é criado
  const initialize = async () => {
    console.log('🔧 Inicializando auth store...')
    console.log('  Token existe:', !!token.value)
    console.log('  User existe:', !!user.value)
    
    if (token.value && !user.value) {
      try {
        console.log('  Verificando token...')
        await verifyToken()
        console.log('  Token válido! Usuário:', user.value?.nome, 'Perfil:', user.value?.perfil)
      } catch (error) {
        console.log('  Token inválido, fazendo logout')
        // Token inválido, fazer logout silencioso
        logout()
      }
    }
  }

  // Auto-inicializar
  initialize()

  return {
    // Estado
    user,
    token,
    refreshToken,
    loading,
    error,
    // Getters
    isAuthenticated,
    userRole,
    userName,
    // Actions
    login,
    logout,
    verifyToken,
    refreshAccessToken,
    updateProfile,
    changePassword,
    hasRole,
    // Initialize
    initialize
  }
})
