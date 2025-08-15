import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Componentes de páginas
import Login from '@/pages/Login.vue'
import Dashboard from '@/pages/Dashboard.vue'
import Users from '@/pages/Users.vue'
import UserForm from '@/pages/UserForm.vue'
import Permissions from '@/pages/Permissions.vue'
import Profile from '@/pages/Profile.vue'

const routes = [
  {
    path: '/',
    redirect: (to) => {
      // Será determinado pelo guard de navegação
      return '/login'
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresGuest: true }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  {
    path: '/users',
    name: 'Users',
    component: Users,
    meta: { requiresAuth: true, requiresRole: 'supervisor' }
  },
  {
    path: '/users/create',
    name: 'UserCreate',
    component: UserForm,
    meta: { requiresAuth: true, requiresRole: 'administrador' }
  },
  {
    path: '/users/:id/edit',
    name: 'UserEdit',
    component: UserForm,
    meta: { requiresAuth: true }
  },
  {
    path: '/permissions',
    name: 'Permissions',
    component: Permissions,
    meta: { requiresAuth: true, requiresRole: 'supervisor' }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Hierarquia de perfis
const ROLE_HIERARCHY = {
  'solicitante': 1,
  'tecnico': 2,
  'supervisor': 3,
  'administrador': 4
}

// Guards de navegação
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // SEMPRE forçar logout na primeira navegação (quando from.name é undefined)
  // Isso garante que o sistema sempre abra na tela de login
  if (from.name === undefined) {
    authStore.logout()
    if (to.path !== '/login') {
      return next('/login')
    }
  }
  
  // Verificar se o usuário está autenticado
  if (!authStore.user && authStore.token) {
    try {
      await authStore.verifyToken()
    } catch (error) {
      authStore.logout()
    }
  }

  // Se for a rota raiz, sempre redirecionar para login
  if (to.path === '/') {
    return next('/login')
  }

  // Rota requer autenticação
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next('/login')
  }

  // Rota requer visitante (não autenticado)
  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    return next('/dashboard')
  }

  // Verificar permissões de perfil
  if (to.meta.requiresRole && authStore.user) {
    const userRoleLevel = ROLE_HIERARCHY[authStore.user.perfil] || 0
    const requiredRoleLevel = ROLE_HIERARCHY[to.meta.requiresRole] || 0
    
    if (userRoleLevel < requiredRoleLevel) {
      // Usuário sem permissão suficiente
      return next('/dashboard')
    }
  }

  next()
})

export default router
