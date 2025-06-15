import { createRouter, createWebHistory } from 'vue-router'
import { session } from './data/session'
import { userResource } from '@/data/user'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    name: 'Login',
    path: '/account/login',
    component: () => import('@/pages/Login.vue'),
    meta: {
      title: 'Login',
      description: 'Sign in to your Artha Raksha account'
    }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/pages/Profile.vue'),
    meta: {
      requiresAuth: true,
      layout: 'app',
      title: 'Profile Settings',
      description: 'Manage your profile and account settings'
    }
  },
  // Dashboard Routes
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/pages/Dashboard.vue'),
    meta: {
      requiresAuth: true,
      layout: 'app',
      title: 'Dashboard',
      description: 'Healthcare financial protection dashboard with expense tracking and welfare scheme management'
    }
  },
  // Income section
  {
    path: '/income',
    redirect: '/income/management'
  },
  {
    path: '/income/management',
    name: 'IncomeManagement',
    component: () => import('@/pages/income-management/Income.vue'),
    meta: {
      requiresAuth: true,
      layout: 'app',
      title: 'Income Management',
      description: 'Manage and track your income sources for comprehensive financial planning'
    }
  },
  {
    path: '/income/reports',
    name: 'IncomeReports',
    component: () => import('@/pages/income-management/Reports.vue'),
    meta: {
      requiresAuth: true,
      layout: 'app',
      title: 'Income Reports',
      description: 'Detailed income analysis and reporting for financial insights'
    }
  },

  // Expense Routes
  {
    path: '/expenses',
    name: 'ExpenseManagement',
    component: () => import('@/pages/expense/ExpenseLayout.vue'),
    meta: { requiresAuth: true, layout: 'app' },
    children: [
      {
        path: '',
        name: 'ExpenseDefault',
        redirect: '/expenses/overview'
      },
      {
        path: 'overview',
        name: 'ExpenseOverview',
        component: () => import('@/pages/expense/ExpenseAnalyzer.vue'),
        meta: {
          requiresAuth: true,
          layout: 'app',
          title: 'Expense Overview',
          description: 'Track and manage your medical and healthcare expenses'
        }
      },
      {
        path: 'analytics',
        redirect: '/expenses/analytics/categories'
      },
      {
        path: 'analytics/categories',
        name: 'ExpenseCategories',
        component: () => import('@/pages/expense/CategoriesEnhanced.vue'),
        meta: {
          requiresAuth: true,
          layout: 'app',
          title: 'Expense Categories',
          description: 'Analyze spending patterns with direct and indirect medical classification'
        }
      },
      {
        path: 'analytics/medical',
        name: 'ExpenseMedicalAnalytics',
        component: () => import('@/pages/expense/MedicalAnalytics.vue'),
        meta: {
          requiresAuth: true,
          layout: 'app',
          title: 'Medical Expense Analytics',
          description: 'Comprehensive medical expense and CHE analysis'
        }
      },
      {
        path: 'analytics/trends',
        name: 'ExpenseTrends',
        component: () => import('@/pages/expense/Monthly.vue'),
        meta: {
          requiresAuth: true,
          layout: 'app',
          title: 'Expense Trends',
          description: 'Monthly and yearly expense trends and patterns'
        }
      }
    ]
  },

  // Applications & Claims Routes
  {
    path: '/applications-claims',
    name: 'ApplicationsClaims',
    redirect: '/applications-claims/applications'
  },
  {
    path: '/applications-claims/applications',
    name: 'MyApplications',
    component: () => import('@/pages/care-support/Applications.vue'),
    meta: {
      requiresAuth: true,
      layout: 'app',
      title: 'My Applications',
      description: 'Track your welfare scheme and insurance applications'
    }
  },
  {
    path: '/applications-claims/claims',
    name: 'ClaimsAndBenefits',
    component: () => import('@/pages/care-support/Claims.vue'),
    meta: {
      requiresAuth: true,
      layout: 'app',
      title: 'Claims & Benefits',
      description: 'Manage your claims and benefit utilization'
    }
  },

  // Care & Support Routes (consolidated with insurance functionality)
  {
    path: '/care-support',
    redirect: '/care-support/conditions'
  },
  {
    path: '/care-support/conditions',
    name: 'HealthConditions',
    component: () => import('@/pages/care-support/Conditions.vue'),
    meta: {
      requiresAuth: true,
      layout: 'app',
      title: 'Health Conditions',
      description: 'Manage your health conditions and risk assessment'
    }
  },
  {
    path: '/care-support/programs',
    name: 'SchemesAndPrograms',
    component: () => import('@/pages/care-support/Programs.vue'),
    meta: {
      requiresAuth: true,
      layout: 'app',
      title: 'Schemes & Programs',
      description: 'Discover and apply for welfare schemes and insurance programs'
    }
  },
  {
    path: '/care-support/resources',
    name: 'SupportResources',
    component: () => import('@/pages/care-support/Resources.vue'),
    meta: {
      requiresAuth: true,
      layout: 'app',
      title: 'Support Resources',
      description: 'Browse support pathways and healthcare resources'
    }
  },

  // Admin Routes
  {
    path: '/admin/notifications',
    name: 'AdminNotifications',
    component: () => import('@/components/admin/AdminNotificationCenter.vue'),
    meta: {
      requiresAuth: true,
      layout: 'app',
      title: 'Admin Notification Center',
      description: 'Manage role-based and broadcast notifications'
    }
  }
]

let router = createRouter({
  history: createWebHistory('/frontend'),
  routes,
})

router.beforeEach(async (to, from, next) => {
  let isLoggedIn = session.isLoggedIn
  try {
    await userResource.promise
  } catch (error) {
    isLoggedIn = false
  }

  if (to.name === 'Login' && isLoggedIn) {
    next({ name: 'Dashboard' })
  } else if (to.meta?.requiresAuth && !isLoggedIn) {
    next({ name: 'Login' })
  } else {
    next()
  }
})

export default router
