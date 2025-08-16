import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Componentes de páginas
import Login from '@/pages/Login.vue'
import Dashboard from '@/pages/Dashboard.vue'
import Users from '@/pages/Users.vue'
import UserForm from '@/pages/UserForm.vue'
import Permissions from '@/pages/Permissions.vue'
import Profile from '@/pages/Profile.vue'
import Departments from '@/pages/Departments.vue'
import DepartmentForm from '@/pages/DepartmentForm.vue'
import Solicitacoes from '@/pages/Solicitacoes.vue'
import SolicitacaoForm from '@/pages/SolicitacaoForm.vue'
import SolicitacaoDetail from '@/pages/SolicitacaoDetail.vue'
import Categories from '@/pages/Categories.vue'
import SubCategories from '@/pages/SubCategories.vue'

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
    path: '/departments',
    name: 'Departments',
    component: Departments,
    meta: { requiresAuth: true }
  },
  {
    path: '/departments/create',
    name: 'DepartmentCreate',
    component: DepartmentForm,
    meta: { requiresAuth: true, requiresRole: 'supervisor' }
  },
  {
    path: '/departments/:id/edit',
    name: 'DepartmentEdit',
    component: DepartmentForm,
    meta: { requiresAuth: true, requiresRole: 'supervisor' }
  },
  {
    path: '/solicitacoes',
    name: 'Solicitacoes',
    component: Solicitacoes,
    meta: { requiresAuth: true }
  },
  {
    path: '/solicitacoes/create',
    name: 'SolicitacaoCreate',
    component: SolicitacaoForm,
    meta: { requiresAuth: true }
  },
  {
    path: '/solicitacoes/:id',
    name: 'SolicitacaoDetail',
    component: SolicitacaoDetail,
    meta: { requiresAuth: true }
  },
  {
    path: '/solicitacoes/:id/edit',
    name: 'SolicitacaoEdit',
    component: SolicitacaoForm,
    meta: { requiresAuth: true }
  },
  {
    path: '/categories',
    name: 'Categories',
    component: Categories,
    meta: { requiresAuth: true, requiresRole: 'administrador' }
  },
  {
    path: '/subcategories',
    name: 'SubCategories',
    component: SubCategories,
    meta: { requiresAuth: true, requiresRole: 'administrador' }
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
  
  // Se for a rota raiz, redirecionar baseado no estado de autenticação
  if (to.path === '/') {
    // Se tem token, tentar verificar autenticação
    if (authStore.token && !authStore.user) {
      try {
        await authStore.verifyToken()
        return next('/dashboard')
      } catch (error) {
        authStore.logout()
        return next('/login')
      }
    }
    
    // Se já está autenticado, ir para dashboard
    if (authStore.isAuthenticated) {
      return next('/dashboard')
    }
    
    // Senão, ir para login
    return next('/login')
  }
  
  // Verificar se o usuário está autenticado
  if (!authStore.user && authStore.token) {
    try {
      await authStore.verifyToken()
    } catch (error) {
      authStore.logout()
    }
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
