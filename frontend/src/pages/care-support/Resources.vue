<template>
    <div class="p-4 lg:p-6">
        <!-- Header -->
        <div class="mb-4 sm:mb-6">
            <h1 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Support Resources</h1>
            <p class="text-gray-600 dark:text-gray-400 dark:text-gray-500 mt-2 text-sm sm:text-base">Find support pathways and personalized recommendations for your needs</p>
        </div>

          <!-- Loading State -->
      <div v-if="support.loading.value.supportPathways || support.loading.value.supportRecommendations" 
           class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span class="ml-3 text-gray-600 dark:text-gray-400 dark:text-gray-500">Loading support resources...</span>
      </div>

      <!-- Error State -->
      <div v-else-if="support.errors.value.supportPathways || support.errors.value.supportRecommendations" 
           class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
        <div class="flex">
          <AlertCircle class="h-5 w-5 text-red-400" />
          <div class="ml-3">
            <h3 class="text-sm font-medium  dark:text-red-200" :class="getFinancialStatusClass('expense', '800')">Error Loading Data</h3>
            <p class="mt-1 text-sm  dark:text-red-300" :class="getFinancialStatusClass('expense', '700')">
              {{ support.errors.value.supportPathways || support.errors.value.supportRecommendations }}
            </p>
          </div>
        </div>
      </div>

            <!-- Main Content -->
        <div v-else class="space-y-4 sm:space-y-6">
            <!-- Summary Cards -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <Heart class="h-8 w-8  dark:text-red-400" :class="getFinancialStatusClass('expense', '600')" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500">Health-Based Support</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ healthBasedSupportCount }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <DollarSign class="h-8 w-8  dark:text-green-400" :class="getFinancialStatusClass('income', '600')" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500">Income-Based Support</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ incomeBasedSupportCount }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <Users class="h-8 w-8  dark:text-blue-400" :class="getFinancialStatusClass('medical', '600')" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500">General Support</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ generalSupportCount }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Personalized Recommendations -->
      <div v-if="hasRecommendations" class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
        <div class="flex items-center mb-4">
          <Lightbulb class="h-6 w-6  dark:text-blue-400 mr-3" :class="getFinancialStatusClass('medical', '600')" />
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Personalized Recommendations</h2>
        </div>
        <p class="text-gray-600 dark:text-gray-400 dark:text-gray-500 mb-4">Based on your health conditions and household profile, here are support resources tailored for you:</p>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Health-Based Recommendations -->
          <div v-if="support.supportRecommendations.value.health_based_support.length > 0" 
               class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg p-4 border border-red-200 dark:border-red-800">
            <div class="flex items-center mb-3">
              <Heart class="h-5 w-5  dark:text-red-400 mr-2" :class="getFinancialStatusClass('expense', '600')" />
              <h3 class="font-medium text-gray-900 dark:text-gray-100">Health Support</h3>
            </div>
            <div class="space-y-2">
              <div
                v-for="pathway in support.supportRecommendations.value.health_based_support.slice(0, 3)"
                :key="pathway.name"
                class="text-sm"
              >
                <button
                  @click="viewPathwayDetails(pathway)"
                  class="text-blue-600 dark:text-blue-400 hover: dark:text-blue-200 font-medium" :class="getFinancialStatusClass('medical', '800')"
                >
                  {{ pathway.title }}
                </button>
                <p class="text-gray-500 dark:text-gray-400 dark:text-gray-500 text-xs mt-1">{{ pathway.description?.substring(0, 80) }}...</p>
              </div>
            </div>
          </div>

          <!-- Income-Based Recommendations -->
          <div v-if="support.supportRecommendations.value.income_based_support.length > 0" 
               class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg p-4 border border-green-200 dark:border-green-800">
            <div class="flex items-center mb-3">
              <DollarSign class="h-5 w-5  dark:text-green-400 mr-2" :class="getFinancialStatusClass('income', '600')" />
              <h3 class="font-medium text-gray-900 dark:text-gray-100">Financial Support</h3>
            </div>
            <div class="space-y-2">
              <div
                v-for="scheme in support.supportRecommendations.value.income_based_support.slice(0, 3)"
                :key="scheme.name"
                class="text-sm"
              >
                <button
                  @click="viewSchemeDetails(scheme)"
                  class="text-blue-600 dark:text-blue-400 hover: dark:text-blue-200 font-medium" :class="getFinancialStatusClass('medical', '800')"
                >
                  {{ scheme.scheme_name }}
                </button>
                <p class="text-gray-500 dark:text-gray-400 dark:text-gray-500 text-xs mt-1">{{ scheme.description?.substring(0, 80) }}...</p>
              </div>
            </div>
          </div>

          <!-- General Recommendations -->
          <div v-if="support.supportRecommendations.value.general_support.length > 0" 
               class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <div class="flex items-center mb-3">
              <Users class="h-5 w-5  dark:text-blue-400 mr-2" :class="getFinancialStatusClass('medical', '600')" />
              <h3 class="font-medium text-gray-900 dark:text-gray-100">General Support</h3>
            </div>
            <div class="space-y-2">
              <div
                v-for="pathway in support.supportRecommendations.value.general_support.slice(0, 3)"
                :key="pathway.name"
                class="text-sm"
              >
                <button
                  @click="viewPathwayDetails(pathway)"
                  class="text-blue-600 dark:text-blue-400 hover: dark:text-blue-200 font-medium" :class="getFinancialStatusClass('medical', '800')"
                >
                  {{ pathway.title }}
                </button>
                <p class="text-gray-500 dark:text-gray-400 dark:text-gray-500 text-xs mt-1">{{ pathway.description?.substring(0, 80) }}...</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Support Pathways -->
      <div class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg border border-gray-200 dark:border-gray-700">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-lg font-medium text-gray-900 dark:text-gray-100">All Support Pathways</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-1">Browse available support resources and pathways</p>
        </div>

        <div class="p-4 sm:p-6">
          <div v-if="support.supportPathways.value.length > 0" class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div
              v-for="pathway in support.supportPathways.value"
              :key="pathway.name"
              class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 sm:p-6 hover:border-blue-300 dark:border-blue-700 hover:shadow dark:shadow-gray-900/20-md transition-all"
            >
              <!-- Pathway Header -->
              <div class="mb-4">
                <div class="flex-1">
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 break-words">
                    {{ pathway.title }}
                  </h3>
                  <p class="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500 mb-3 break-words">
                    {{ pathway.description }}
                  </p>
                </div>
              </div>

              <!-- Target Groups -->
              <div v-if="pathway.target_groups && pathway.target_groups.length > 0" class="mb-4">
                <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">Target Groups:</h4>
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="group in pathway.target_groups.slice(0, 3)"
                    :key="group.target_group || group.name"
                    class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900/30  dark:text-blue-300 break-words" :class="getFinancialStatusClass('medical', '700')"
                  >
                    {{ group.target_group || group.name || 'Target Group' }}
                  </span>
                  <span
                    v-if="pathway.target_groups.length > 3"
                    class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-800 dark:bg-gray-200 text-gray-500 dark:text-gray-400 dark:text-gray-500"
                  >
                    +{{ pathway.target_groups.length - 3 }} more
                  </span>
                </div>
              </div>

              <!-- Benefits -->
              <div v-if="pathway.benefits && pathway.benefits.length > 0" class="mb-4">
                <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">Support Benefits:</h4>
                <div class="space-y-2">
                  <div
                    v-for="benefit in pathway.benefits.slice(0, 4)"
                    :key="benefit.benefit_name || benefit.description"
                    class="flex items-start space-x-2"
                  >
                    <CheckCircle class="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-gray-900 dark:text-gray-100 break-words">
                        {{ benefit.benefit_name || 'Support Benefit' }}
                      </p>
                      <p v-if="benefit.description" class="text-xs text-gray-600 dark:text-gray-400 dark:text-gray-500 mt-1 break-words">
                        {{ benefit.description }}
                      </p>
                    </div>
                  </div>
                  <div v-if="pathway.benefits.length > 4" class="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 pl-6">
                    +{{ pathway.benefits.length - 4 }} more benefits
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-gray-100 dark:border-gray-700 gap-2">
                <button
                  @click="viewPathwayDetails(pathway)"
                  class="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded-md text-gray-700 dark:text-gray-300 dark:text-gray-600 bg-white dark:bg-gray-800 dark:bg-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 dark:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:ring-blue-400 dark:focus:ring-blue-400"
                >
                  View Details
                </button>
                <div class="flex items-center space-x-2">
                  <button
                    @click="contactSupport(pathway)"
                    class="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white dark:text-black bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:ring-green-400"
                  >
                    <Phone class="h-3 w-3 mr-1" />
                    Contact
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="text-center py-12">
            <MapPin class="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
            <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Support Pathways Found</h3>
            <p class="text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-6">No support pathways are available at the moment.</p>
          </div>
        </div>
        </div>
    </div>

    <!-- Pathway Details Modal -->
    <PathwayDetailsModal
      v-if="selectedPathway"
      :pathway="selectedPathway"
      @close="selectedPathway = null"
    />

    <!-- Scheme Details Modal -->
    <SchemeDetailsModal
      v-if="selectedScheme"
      :scheme="selectedScheme"
      @close="selectedScheme = null"
    />
    </div>
</template>

<script setup>
import { useAdvancedTheme } from "@/composables/useAdvancedTheme"
import {
	AlertCircle,
	CheckCircle,
	DollarSign,
	Heart,
	Lightbulb,
	MapPin,
	Phone,
	Users,
} from "lucide-vue-next"
import { computed, onMounted, ref } from "vue"
import PathwayDetailsModal from "../../components/support/PathwayDetailsModal.vue"
import SchemeDetailsModal from "../../components/support/SchemeDetailsModal.vue"
import { useSupport } from "../../composables/useSupport"

// Support composable
const support = useSupport({ autoInitialize: true })

// Reactive data
const selectedPathway = ref(null)
const selectedScheme = ref(null)

// Computed properties
const healthBasedSupportCount = computed(
	() => support.supportRecommendations.value.health_based_support.length,
)

const incomeBasedSupportCount = computed(
	() => support.supportRecommendations.value.income_based_support.length,
)

const generalSupportCount = computed(
	() => support.supportRecommendations.value.general_support.length,
)

const hasRecommendations = computed(
	() => support.totalRecommendations.value > 0,
)

// Methods
const viewPathwayDetails = (pathway) => {
	selectedPathway.value = pathway
}

const viewSchemeDetails = (scheme) => {
	selectedScheme.value = scheme
}

const contactSupport = (pathway) => {
	// Find contact information from benefits
	const contactBenefit = pathway.benefits?.find(
		(benefit) => benefit.contact_info,
	)
	if (contactBenefit) {
		// Try to open phone dialer or email client
		const contact = contactBenefit.contact_info
		if (contact.includes("@")) {
			window.location.href = `mailto:${contact}`
		} else if (contact.match(/[\d\-\+\(\)\s]/)) {
			window.location.href = `tel:${contact.replace(/\D/g, "")}`
		} else {
			alert(`Contact Information: ${contact}`)
		}
	} else {
		alert("Contact information not available for this pathway.")
	}
}

// Lifecycle
onMounted(async () => {
	try {
		// Initialize support system if not already done
		if (!support.state.value.isInitialized) {
			await support.initialize()
		}

		// Load support pathways and recommendations
		await Promise.all([
			support.loadSupportPathways(),
			support.loadSupportRecommendations(),
		])
	} catch (error) {
		console.error("Error loading support resources:", error)
	}
})

// Advanced theme management
const { currentTheme, isDark, setTheme, themes } = useAdvancedTheme()

function getFinancialStatusClass(type, intensity = "600") {
	const baseClasses = {
		income: `text-green-${intensity} dark:text-green-400`,
		expense: `text-red-${intensity} dark:text-red-400`,
		medical: `text-blue-${intensity} dark:text-blue-400`,
		warning: `text-yellow-${intensity} dark:text-yellow-400`,
		alert: `text-orange-${intensity} dark:text-orange-400`,
		neutral: `text-gray-${intensity} dark:text-gray-400`,
	}
	return baseClasses[type] || baseClasses.neutral
}
</script>