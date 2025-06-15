<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 dark:bg-gray-100 py-6">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Claims & Benefits</h1>
            <p class="mt-2 text-gray-600 dark:text-gray-400 dark:text-gray-500">Track your claims and benefit utilization</p>
          </div>
          <button
            @click="showClaimModal = true"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white dark:text-black bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:ring-blue-400 dark:focus:ring-blue-400"
          >
            <Plus class="w-4 h-4 mr-2" />
            New Claim
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20 p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <CreditCard class="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500">Total Claims</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-gray-100">{{ totalClaims }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20 p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <Clock class="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500">Processing</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-gray-100">{{ processingClaims }}</p>
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
              <p class="text-2xl font-semibold text-gray-900 dark:text-gray-100">{{ approvedClaims }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20 p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <DollarSign class="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500">Total Benefits</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-gray-100">₹{{ formatCurrency(totalBenefits) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="support.loading.value.claims" class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span class="ml-3 text-gray-600 dark:text-gray-400 dark:text-gray-500">Loading claims...</span>
      </div>

      <!-- Error State -->
      <div v-else-if="support.errors.value.claims" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
        <div class="flex">
          <AlertCircle class="h-5 w-5 text-red-400" />
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800 dark:text-red-200">Error Loading Claims</h3>
            <p class="mt-1 text-sm text-red-700 dark:text-red-300">{{ support.errors.value.claims }}</p>
            <button
              @click="loadClaims"
              class="mt-2 inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded-md text-gray-700 dark:text-gray-300 dark:text-gray-600 bg-white dark:bg-gray-800 dark:bg-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 dark:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:ring-blue-400 dark:focus:ring-blue-400"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>

      <!-- Claims List -->
      <div v-else class="space-y-6">
        <div
          v-for="claim in claims"
          :key="claim.name"
          class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20 hover:shadow dark:shadow-gray-900/20-md transition-shadow dark:shadow-gray-900/20"
        >
          <div class="p-6">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center space-x-3 mb-2">
                  <component 
                    :is="getSchemeType(claim) === 'insurance' ? Shield : Heart" 
                    class="w-6 h-6"
                    :class="getSchemeType(claim) === 'insurance' ? 'text-orange-600' : 'text-blue-600'"
                  />
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ getSchemeDisplayName(claim) }}</h3>
                  <span
                    :class="getStatusBadgeClass(claim.status)"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  >
                    {{ claim.statusLabel || getStatusLabel(claim.status) }}
                  </span>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p class="text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500">Claim Date</p>
                    <p class="text-sm text-gray-900 dark:text-gray-100">{{ formatDate(claim.claim_date) }}</p>
                  </div>
                  <div v-if="claim.approved_amount">
                    <p class="text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500">Approved Amount</p>
                    <p class="text-sm font-semibold text-green-600 dark:text-green-400">₹{{ formatCurrency(claim.approved_amount) }}</p>
                  </div>
                  <div v-if="claim.status">
                    <p class="text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500">Status</p>
                    <p class="text-sm text-gray-900 dark:text-gray-100">{{ claim.statusLabel || getStatusLabel(claim.status) }}</p>
                  </div>
                </div>
              </div>

              <div class="flex items-center space-x-2">
                <button
                  @click="editClaim(claim)"
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
                  v-if="claim.status === 'approved' || claim.status === 'paid'"
                  class="p-2 text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400 dark:text-green-400 transition-colors"
                >
                  <Download class="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="claims.length === 0" class="text-center py-12">
          <CreditCard class="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
          <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No claims found</h3>
          <p class="text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-6">You haven't submitted any claims yet</p>
          <button
            @click="$router.push('/care-support/programs')"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white dark:text-black bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:ring-blue-400 dark:focus:ring-blue-400"
          >
            <Plus class="w-4 h-4 mr-2" />
            View Your Benefits
          </button>
        </div>
      </div>

      <!-- Claim Modal -->
      <ClaimModal
        v-if="showClaimModal"
        :claim="editingClaim"
        :schemes="availableSchemes"
        @close="closeClaimModal"
        @save="handleClaimSave"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { CreditCard, Clock, CheckCircle, DollarSign, Shield, Heart, Eye, Download, Plus, AlertCircle, Edit } from 'lucide-vue-next'
import { Button } from 'frappe-ui'
import { useSupport } from '../../composables/useSupport'
import ClaimModal from '../../components/support/ClaimModal.vue'
import { useAdvancedTheme } from '@/composables/useAdvancedTheme'

import { 
  getSchemeDisplayName, 
  formatCurrency,
  getClaimStatusColor
} from '../../types/support'

// Support composable
const support = useSupport({ autoInitialize: true })

// Reactive data
const showClaimModal = ref(false)
const editingClaim = ref(null)

// Computed properties
const claims = computed(() => support.claims.value)
const availableSchemes = computed(() => support.allSchemes.value)
const totalClaims = computed(() => claims.value.length)
const processingClaims = computed(() => claims.value.filter(claim => claim.status === 'processing').length)
const approvedClaims = computed(() => claims.value.filter(claim => claim.status === 'approved').length)
const totalBenefits = computed(() => 
  claims.value
    .filter(claim => claim.approved_amount)
    .reduce((sum, claim) => sum + claim.approved_amount, 0)
)

// Methods
function getStatusBadgeClass(status) {
  const classes = {
    submitted: 'bg-blue-100 text-blue-800',
    processing: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    paid: 'bg-green-100 text-green-800'
  }
  return classes[status] || 'bg-gray-100 text-gray-800'
}

function getStatusLabel(status) {
  const labels = {
    submitted: 'Submitted',
    processing: 'Processing',
    approved: 'Approved',
    rejected: 'Rejected',
    paid: 'Paid'
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

function getSchemeType(claim) {
  if (claim.is_custom) {
    return claim.custom_scheme_type?.toLowerCase() || 'other'
  }
  return claim.scheme_type === 'Welfare Scheme' ? 'welfare' : 'insurance'
}

async function loadClaims() {
  try {
    await support.loadClaims(true) // Force refresh
  } catch (err) {
    console.error('Error loading claims:', err)
  }
}

async function loadAvailableSchemes() {
  try {
    await support.loadAllSchemes()
  } catch (err) {
    console.error('Error loading schemes:', err)
  }
}

function closeClaimModal() {
  showClaimModal.value = false
  editingClaim.value = null
}

function editClaim(claim) {
  editingClaim.value = claim
  showClaimModal.value = true
}

async function handleClaimSave(claimData) {
  try {
    await loadClaims() // Refresh the claims list
    closeClaimModal()
  } catch (err) {
    console.error('Error after saving claim:', err)
  }
}

// Lifecycle
onMounted(async () => {
  try {
    // Initialize support system if not already done
    if (!support.state.value.isInitialized) {
      await support.initialize()
    }
    
    // Load claims and available schemes
    await Promise.all([
      support.loadClaims(),
      support.loadAllSchemes()
    ])
  } catch (error) {
    console.error('Error initializing claims data:', error)
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
