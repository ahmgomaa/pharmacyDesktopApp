export const IPC = {
  auth: {
    login: 'auth:login',
    logout: 'auth:logout',
    currentUser: 'auth:currentUser'
  },
  users: {
    list: 'users:list',
    create: 'users:create',
    update: 'users:update',
    remove: 'users:remove'
  },
  medicines: {
    list: 'medicines:list',
    search: 'medicines:search',
    get: 'medicines:get',
    getByBarcode: 'medicines:getByBarcode',
    create: 'medicines:create',
    update: 'medicines:update',
    remove: 'medicines:remove'
  },
  customers: {
    list: 'customers:list',
    create: 'customers:create',
    update: 'customers:update',
    remove: 'customers:remove'
  },
  suppliers: {
    list: 'suppliers:list',
    create: 'suppliers:create',
    update: 'suppliers:update',
    remove: 'suppliers:remove'
  },
  sales: {
    list: 'sales:list',
    get: 'sales:get',
    create: 'sales:create'
  },
  purchases: {
    list: 'purchases:list',
    get: 'purchases:get',
    create: 'purchases:create'
  },
  reports: {
    dailySales: 'reports:dailySales',
    lowStock: 'reports:lowStock',
    expiringSoon: 'reports:expiringSoon',
    dashboardStats: 'reports:dashboardStats'
  }
} as const
