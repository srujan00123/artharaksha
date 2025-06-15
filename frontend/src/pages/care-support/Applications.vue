<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 dark:bg-gray-100 py-6">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">My Applications</h1>
            <p class="mt-2 text-gray-600 dark:text-gray-400 dark:text-gray-500">Track your welfare scheme and insurance applications</p>
          </div>
          <button
            @click="showApplicationModal = true"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white dark:text-black bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:ring-blue-400 dark:focus:ring-blue-400"
          >
            <Plus class="w-4 h-4 mr-2" />
            New Application
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20 p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <FileText class="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500">Total Applications</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-gray-100">{{ totalApplications }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20 p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <Clock class="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500">Pending</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-gray-100">{{ pendingApplications }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20 p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <CheckCircle class="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500">Approved</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-gray-100">{{ approvedApplications }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20 p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <XCircle class="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500">Rejected</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-gray-100">{{ rejectedApplications }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="support.loading.value.applications" class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span class="ml-3 text-gray-600 dark:text-gray-400 dark:text-gray-500">Loading applications...</span>
      </div>

      <!-- Error State -->
      <div v-else-if="support.errors.value.applications" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
        <div class="flex">
          <AlertCircle class="h-5 w-5 text-red-400" />
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800 dark:text-red-200">Error Loading Applications</h3>
            <p class="mt-1 text-sm text-red-700 dark:text-red-300">{{ support.errors.value.applications }}</p>
            <button
              @click="loadApplications"
              class="mt-2 inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded-md text-gray-700 dark:text-gray-300 dark:text-gray-600 bg-white dark:bg-gray-800 dark:bg-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 dark:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:ring-blue-400 dark:focus:ring-blue-400"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>

      <!-- Applications List -->
      <div v-else class="space-y-6">
        <div
          v-for="application in applications"
          :key="application.name"
          class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20 hover:shadow dark:shadow-gray-900/20-md transition-shadow dark:shadow-gray-900/20"
        >
          <div class="p-6">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center space-x-3 mb-2">
                  <component 
                    :is="getSchemeType(application) === 'insurance' ? Shield : Building" 
                    class="w-6 h-6"
                    :class="getSchemeType(application) === 'insurance' ? 'text-orange-600' : 'text-blue-600'"
                  />
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ getSchemeDisplayName(application) }}</h3>
                  <span
                    :class="getStatusBadgeClass(application.status)"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  >
                    {{ application.statusLabel || getStatusLabel(application.status) }}
                  </span>
                </div>

                <p v-if="application.description" class="text-gray-600 dark:text-gray-400 dark:text-gray-500 mb-4">{{ application.description }}</p>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p class="text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500">Application Date</p>
                    <p class="text-sm text-gray-900 dark:text-gray-100">{{ formatDate(application.date_applied) }}</p>
                  </div>
                  <div v-if="application.approval_date">
                    <p class="text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500">Approval Date</p>
                    <p class="text-sm text-gray-900 dark:text-gray-100">{{ formatDate(application.approval_date) }}</p>
                  </div>
                  <div v-if="getCoverageAmount(application)">
                    <p class="text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500">Coverage Amount</p>
                    <p class="text-sm font-semibold text-green-600 dark:text-green-400">₹{{ formatCurrency(getCoverageAmount(application)) }}</p>
                  </div>
                  <div v-if="application.rejection_reason">
                    <p class="text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500">Rejection Reason</p>
                    <p class="text-sm text-red-600 dark:text-red-400">{{ application.rejection_reason }}</p>
                  </div>
                </div>
              </div>

              <div class="flex items-center space-x-2">
                <button
                  @click="editApplication(application)"
                  class="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:text-gray-500 transition-colors"
                >
                  <Edit class="h-4 w-4" />
                </button>
                <button
                  class="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:text-gray-500 transition-colors"
                >
                  <Eye class="h-4 w-4" />
                </button>
                <button
                  v-if="application.status === 'approved' && application.certificate_url"
                  @click="window.open(application.certificate_url, '_blank')"
                  class="p-2 text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400 dark:text-green-400 transition-colors"
                >
                  <Download class="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="applications.length === 0" class="text-center py-12">
          <FileText class="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
          <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No applications found</h3>
          <p class="text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-6">You haven't applied for any schemes yet</p>
          <button
            @click="$router.push('/care-support/programs')"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white dark:text-black bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:ring-blue-400 dark:focus:ring-blue-400"
          >
            <Plus class="w-4 h-4 mr-2" />
            Browse Schemes
          </button>
        </div>
      </div>

      <!-- Application Modal -->
      <ApplicationModal
        v-if="showApplicationModal"
        :application="editingApplication"
        :schemes="availableSchemes"
        @close="closeApplicationModal"
        @save="handleApplicationSave"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { FileText, Clock, CheckCircle, XCircle, Shield, Building, Eye, Download, Plus, AlertCircle, Edit } from 'lucide-vue-next'
import { Button } from 'frappe-ui'
import { useSupport } from '../../composables/useSupport'
import ApplicationModal from '../../components/support/ApplicationModal.vue'
import { useAdvancedTheme } from '@/composables/useAdvancedTheme'

import { 
  getSchemeDisplayName, 
  getCoverageAmount, 
  formatCurrency,
  getApplicationStatusColor
} from '../../types/support'

// Support composable
const support = useSupport({ autoInitialize: true })

// Reactive data
const showApplicationModal = ref(false)
const editingApplication = ref(null)

// Computed properties
const applications = computed(() => support.applications.value)
const availableSchemes = computed(() => support.allSchemes.value)
const totalApplications = computed(() => applications.value.length)
const pendingApplications = computed(() => applications.value.filter(app => app.status === 'pending').length)
const approvedApplications = computed(() => applications.value.filter(app => app.status === 'approved').length)
const rejectedApplications = computed(() => applications.value.filter(app => app.status === 'rejected').length)

// Methods
function getStatusBadgeClass(status) {
  const classes = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    under_review: 'bg-blue-100 text-blue-800'
  }
  return classes[status] || 'bg-gray-100 text-gray-800'
}

function getStatusLabel(status) {
  const labels = {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    under_review: 'Under Review'
  }
  return labels[status] || status
}

function formatDate(dateString) {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function getSchemeType(application) {
  if (application.custom_scheme) {
    return application.custom_scheme_type?.toLowerCase() || 'other'
  }
  return application.scheme_type === 'Welfare Scheme' ? 'welfare' : 'insurance'
}

async function loadApplications() {
  try {
    await support.loadApplications(true) // Force refresh
  } catch (err) {
    console.error('Error loading applications:', err)
  }
}

async function loadAvailableSchemes() {
  try {
    await support.loadAllSchemes()
  } catch (err) {
    console.error('Error loading schemes:', err)
  }
}

function editApplication(application) {
  editingApplication.value = application
  showApplicationModal.value = true
}

function closeApplicationModal() {
  showApplicationModal.value = false
  editingApplication.value = null
}

async function handleApplicationSave(applicationData) {
  try {
    await loadApplications() // Refresh the applications list
    closeApplicationModal()
  } catch (err) {
    console.error('Error after saving application:', err)
  }
}

// Lifecycle
onMounted(async () => {
  try {
    // Initialize support system if not already done
    if (!support.state.value.isInitialized) {
      await support.initialize()
    }
    
    // Load applications and available schemes
    await Promise.all([
      support.loadApplications(),
      support.loadAllSchemes()
    ])
  } catch (error) {
    console.error('Error initializing applications data:', error)
  }
})

// Advanced theme management
const { currentTheme, isDark, setTheme, themes } = useAdvancedTheme()

// Theme utility methods
const getFinancialStatusClass = (type, intensity = '600') => {
  const baseClasses = {
    income: `text-green-${intensity} dark:text-green-400`,
    expense: `text-red-${intensity} dark:text-red-400`,
    medical: `text-blue-${intensity} dark:text-blue-400`,
    warning: `text-yellow-${intensity} dark:text-yellow-400`,
    alert: `text-orange-${intensity} dark:text-orange-400`,
    neutral: `text-gray-${intensity} dark:text-gray-400`
  }
  return baseClasses[type] || baseClasses.neutral
}

const getThemeSurfaceClass = (variant = 'primary') => {
  const variants = {
    primary: 'bg-white dark:bg-gray-800',
    secondary: 'bg-gray-50 dark:bg-gray-900',
    tertiary: 'bg-gray-100 dark:bg-gray-800'
  }
  return variants[variant] || variants.primary
}

const getThemeTextClass = (intensity = '600') => {
  const intensityMap = {
    '900': 'text-gray-900 dark:text-gray-100',
    '800': 'text-gray-800 dark:text-gray-200',
    '700': 'text-gray-700 dark:text-gray-300',
    '600': 'text-gray-600 dark:text-gray-400',
    '500': 'text-gray-500 dark:text-gray-400',
    '400': 'text-gray-400 dark:text-gray-500'
  }
  return intensityMap[intensity] || intensityMap['600']
}
</script>
