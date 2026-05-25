import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../pages/Login.vue')
  },
  {
    path: '/',
    component: () => import('../layouts/MainLayout.vue'),
    children: [
      { 
        path: '', 
        name: 'Dashboard', 
        component: () => import('../pages/Dashboard.vue'),
        meta: { requiresAuth: true, roles: ['Admin', 'Manager'] }
      },
      { 
        path: 'admin', 
        name: 'AdminPanel', 
        component: () => import('../pages/AdminPanel.vue'),
        meta: { requiresAuth: true, roles: ['Admin'] }
      },
      { 
        path: 'branch', 
        name: 'Branch', 
        component: () => import('../pages/Branch.vue'),
        meta: { requiresAuth: true, roles: ['Admin', 'Manager'] }
      },
      { 
        path: 'create-invoice', 
        name: 'CreateInvoice', 
        component: () => import('../pages/CreateInvoice.vue'),
        meta: { requiresAuth: true, roles: ['Admin', 'Manager'] }
      },
      { 
        path: 'packing', 
        name: 'Packing', 
        component: () => import('../pages/Packing.vue'),
        meta: { requiresAuth: true, roles: ['Admin', 'Packer', 'Manager'] }
      },
      { 
        path: 'collection', 
        name: 'Collection', 
        component: () => import('../pages/Collection.vue'),
        meta: { requiresAuth: true, roles: ['Admin', 'Collector', 'Manager'] }
      },
      { 
        path: 'manage-orders', 
        name: 'ManageOrders', 
        component: () => import('../pages/ManageOrders.vue'),
        meta: { requiresAuth: true, roles: ['Admin', 'Manager'] }
      },
      { 
        path: 'analysis', 
        name: 'Analysis', 
        component: () => import('../pages/Analysis.vue'),
        meta: { requiresAuth: true, roles: ['Admin', 'Manager'] }
      },
      { 
        path: 'inventory', 
        name: 'Inventory Data', 
        component: () => import('../pages/Inventory.vue'),
        meta: { requiresAuth: true, roles: ['Admin', 'Manager'] }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation Guards for Auth and RBAC
router.beforeEach((to, from, next) => {
  const currentUserString = localStorage.getItem('currentUser')
  const currentUser = currentUserString ? JSON.parse(currentUserString) : null

  // If route requires auth and no user is logged in
  if (to.meta.requiresAuth && !currentUser) {
    next('/login')
  } 
  // If user is already logged in and tries to go to login page
  else if (to.path === '/login' && currentUser) {
    next('/')
  }
  // Check Role-Based Access Control
  else if (to.meta.requiresAuth && currentUser) {
    // If the user's role is not permitted for this route
    if (to.meta.roles && !to.meta.roles.includes(currentUser.role)) {
      if (currentUser.role === 'Packer') next('/packing')
      else if (currentUser.role === 'Collector') next('/collection')
      else next('/')
    } else {
      next()
    }
  } 
  else {
    next()
  }
})

export default router
