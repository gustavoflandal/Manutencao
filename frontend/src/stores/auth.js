import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'

export const useAuthStore = defineStore('auth', () => {
  // Estado
  const user = ref(null)
  
  // Debug do localStorage
  console.log('🔐 Store: Verificando localStorage na inicialização...')
  const storedToken = localStorage.getItem('access_token')
  const storedRefreshToken = localStorage.getItem('refresh_token')
  console.log('🔐 Store: Token no localStorage:', storedToken ? 'EXISTE' : 'NÃO EXISTE')
  console.log('🔐 Store: Refresh token no localStorage:', storedRefreshToken ? 'EXISTE' : 'NÃO EXISTE')
  
  const token = ref(storedToken)
  const refreshToken = ref(storedRefreshToken)
  const loading = ref(false)
  const error = ref(null)

  console.log('🔐 Store: Valores iniciais:', {
    token: !!token.value,
    refreshToken: !!refreshToken.value
  })

  // Getters
  const isAuthenticated = computed(() => !!user.value && !!token.value)
  const userRole = computed(() => user.value?.perfil || null)
  const userName = computed(() => user.value?.nome || '')

  // Actions
  const login = async (credentials) => {
    loading.value = true
    error.value = null
    
    console.log('🔐 Store: Iniciando login...')
    
    try {
      const response = await api.post('/auth/login', credentials)
      
      console.log('🔐 Store: Resposta do login:', response.data)
      
      if (response.data.success) {
        const { user: userData, accessToken, refreshToken: newRefreshToken } = response.data.data
        
        console.log('🔐 Store: Dados extraídos:', {
          userData,
          accessToken: !!accessToken,
          refreshToken: !!newRefreshToken
        })
        
        // Armazenar dados do usuário e tokens
        user.value = userData
        token.value = accessToken
        refreshToken.value = newRefreshToken
        
        console.log('🔐 Store: Valores atribuídos:', {
          user: user.value,
          token: !!token.value,
          refreshToken: !!refreshToken.value
        })
        
        // Salvar no localStorage
        localStorage.setItem('access_token', accessToken)
        localStorage.setItem('refresh_token', newRefreshToken)
        
        console.log('🔐 Store: Tokens salvos no localStorage')
        
        // Verificar se foi salvo mesmo
        const verificarToken = localStorage.getItem('access_token')
        const verificarRefresh = localStorage.getItem('refresh_token')
        console.log('🔐 Store: Verificação pós-save:', {
          tokenSalvo: verificarToken ? 'EXISTE' : 'NÃO EXISTE',
          refreshSalvo: verificarRefresh ? 'EXISTE' : 'NÃO EXISTE',
          tokenIgual: verificarToken === accessToken,
          refreshIgual: verificarRefresh === newRefreshToken
        })
        
        // Configurar token padrão do axios
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
        
        console.log('🔐 Store: Header configurado no axios')
        console.log('🔐 Store: Estado final isAuthenticated:', isAuthenticated.value)
        
        return { success: true }
      } else {
        console.log('🔐 Store: Login falhou segundo backend')
        throw new Error(response.data.message || 'Erro no login')
      }
    } catch (err) {
      console.error('🔐 Store: Erro no login:', err)
      const errorMessage = err.response?.data?.message || err.message || 'Erro no login'
      error.value = errorMessage
      return { success: false, message: errorMessage }
    } finally {
      loading.value = false
      console.log('🔐 Store: Login finalizado')
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
      console.log('🔐 Verificando token...')
      
      // Configurar token no header
      api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
      
      const response = await api.get('/auth/verify')
      
      console.log('🔐 Resposta da verificação:', response.data)
      
      if (response.data.success) {
        user.value = response.data.data.user
        console.log('🔐 Token válido, usuário definido:', user.value)
        return true
      } else {
        console.log('🔐 Token inválido segundo backend')
        throw new Error('Token inválido')
      }
    } catch (err) {
      console.error('🔐 Erro na verificação do token:', err)
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
    if (token.value && !user.value) {
      try {
        await verifyToken()
      } catch (error) {
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
