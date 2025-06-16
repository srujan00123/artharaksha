<template>
  <div class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
    <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <!-- Background overlay -->
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="$emit('close')"></div>

      <!-- Modal panel -->
      <div class="inline-block align-bottom bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg text-left overflow-hidden shadow dark:shadow-gray-900/20-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
        <!-- Header -->
        <div class="bg-white dark:bg-gray-800 dark:bg-gray-200 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div class="flex items-start justify-between">
            <div class="flex items-center space-x-3">
              <component 
                :is="scheme.scheme_source === 'insurance' ? Shield : Building" 
                class="w-8 h-8"
                :class="scheme.scheme_source === 'insurance' ? 'text-orange-600' : 'text-blue-600'"
              />
              <div>
                <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100" id="modal-title">
                  {{ scheme.scheme_name }}
                </h3>
                <div class="flex items-center space-x-2 mt-1">
                  <span
                    :class="getSchemeTypeBadgeClass(scheme.type)"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  >
                    {{ scheme.type }}
                  </span>
                  <span
                    :class="getSchemeSourceBadgeClass(scheme.scheme_source)"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  >
                    {{ scheme.scheme_source === 'welfare' ? 'Welfare Scheme' : 'Insurance Scheme' }}
                  </span>
                  <span
                    v-if="scheme.is_eligible !== undefined"
                    :class="getEligibilityBadgeClass(scheme)"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  >
                    {{ getEligibilityLabel(scheme) }}
                  </span>
                </div>
              </div>
            </div>
            <button
              @click="$emit('close')"
              class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-md text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:ring-blue-400 dark:focus:ring-blue-400"
            >
              <X class="h-6 w-6" />
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="bg-white dark:bg-gray-800 dark:bg-gray-200 px-4 pb-4 sm:p-6 sm:pt-0">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Main Content -->
            <div class="lg:col-span-2 space-y-6">
              <!-- Description -->
              <div>
                <h4 class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Description</h4>
                <p class="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">{{ scheme.description }}</p>
              </div>

              <!-- Coverage Amount -->
              <div v-if="scheme.coverage_amount || scheme.amount_range">
                <h4 class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Coverage Amount</h4>
                <div class="flex items-center space-x-2">
                  <DollarSign class="h-5 w-5 text-green-600 dark:text-green-400" />
                  <span class="text-2xl font-bold text-green-600 dark:text-green-400">
                    <template v-if="scheme.amount_range && scheme.amount_min && scheme.amount_max">
                      ₹{{ formatCurrency(scheme.amount_min) }} - ₹{{ formatCurrency(scheme.amount_max) }}
                    </template>
                    <template v-else-if="scheme.coverage_amount">
                      ₹{{ formatCurrency(scheme.coverage_amount) }}
                    </template>
                  </span>
                </div>
              </div>

              <!-- Benefits -->
              <div v-if="getBenefits(scheme) && getBenefits(scheme).length > 0">
                <h4 class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Benefits</h4>
                <div class="space-y-2">
                  <div
                    v-for="benefit in getBenefits(scheme)"
                    :key="benefit.description"
                    class="flex items-start space-x-2"
                  >
                    <CheckCircle class="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span class="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">{{ benefit.description }}</span>
                  </div>
                </div>
              </div>

              <!-- Eligibility Criteria -->
              <div v-if="getEligibility(scheme) && getEligibility(scheme).length > 0">
                <h4 class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Eligibility Criteria</h4>
                <div class="space-y-2">
                  <div
                    v-for="criteria in getEligibility(scheme)"
                    :key="criteria.description"
                    class="flex items-start space-x-2"
                  >
                    <Info class="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span class="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">{{ criteria.description }}</span>
                  </div>
                </div>
              </div>

              <!-- Required Documents -->
              <div v-if="getDocuments(scheme) && getDocuments(scheme).length > 0">
                <h4 class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Required Documents</h4>
                <div class="space-y-2">
                  <div
                    v-for="document in getDocuments(scheme)"
                    :key="document.description"
                    class="flex items-start space-x-2"
                  >
                    <FileText class="h-4 w-4 text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
                    <span class="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">{{ document.description }}</span>
                  </div>
                </div>
              </div>

              <!-- Target Groups (for welfare schemes) -->
              <div v-if="scheme.target_groups && scheme.target_groups.length > 0">
                <h4 class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Target Groups</h4>
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="group in scheme.target_groups"
                    :key="group.target_group"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
                  >
                    {{ group.target_group }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Sidebar -->
            <div class="space-y-6">
              <!-- Eligibility Status -->
              <div v-if="scheme.eligibility_status && scheme.eligibility_status.length > 0">
                <h4 class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Your Eligibility Status</h4>
                <div class="space-y-3">
                  <div
                    v-for="status in scheme.eligibility_status"
                    :key="status.criteria"
                    class="border border-gray-200 dark:border-gray-700 rounded-lg p-3"
                  >
                    <div class="flex items-center justify-between mb-1">
                      <span class="text-xs font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">{{ status.criteria }}</span>
                      <span
                        :class="status.met ? 'text-green-600' : status.met === false ? 'text-red-600' : 'text-yellow-600'"
                        class="text-xs font-medium"
                      >
                        {{ status.met ? '✓ Met' : status.met === false ? '✗ Not Met' : '? Check' }}
                      </span>
                    </div>
                    <div class="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">
                      <div>Required: {{ status.required }}</div>
                      <div>Current: {{ status.current }}</div>
                    </div>
                  </div>
                </div>

                <!-- Eligibility Score -->
                <div v-if="scheme.eligibility_score !== undefined" class="mt-4">
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">Eligibility Score</span>
                    <span class="text-xs font-medium text-gray-900 dark:text-gray-100">
                      {{ Math.round(scheme.eligibility_score * 100) }}%
                    </span>
                  </div>
                  <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      class="h-2 rounded-full"
                      :class="scheme.eligibility_score >= 0.8 ? 'bg-green-600' : 
                             scheme.eligibility_score >= 0.5 ? 'bg-yellow-600' : 'bg-red-600'"
                      :style="{ width: `${scheme.eligibility_score * 100}%` }"
                    ></div>
                  </div>
                </div>
              </div>

              <!-- Quick Info -->
              <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Quick Info</h4>
                <div class="space-y-2 text-xs">
                  <div class="flex justify-between">
                    <span class="text-gray-500 dark:text-gray-400 dark:text-gray-500">Type:</span>
                    <span class="font-medium">{{ scheme.type }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-500 dark:text-gray-400 dark:text-gray-500">Source:</span>
                    <span class="font-medium">{{ scheme.scheme_source === 'welfare' ? 'Welfare' : 'Insurance' }}</span>
                  </div>
                  <div v-if="scheme.coverage_amount || scheme.amount_range" class="flex justify-between">
                    <span class="text-gray-500 dark:text-gray-400 dark:text-gray-500">Coverage:</span>
                    <span class="font-medium">
                      <template v-if="scheme.amount_range && scheme.amount_min && scheme.amount_max">
                        ₹{{ formatCurrency(scheme.amount_min) }} - ₹{{ formatCurrency(scheme.amount_max) }}
                      </template>
                      <template v-else-if="scheme.coverage_amount">
                        ₹{{ formatCurrency(scheme.coverage_amount) }}
                      </template>
                    </span>
                  </div>
                  <div v-if="scheme.creation" class="flex justify-between">
                    <span class="text-gray-500 dark:text-gray-400 dark:text-gray-500">Added:</span>
                    <span class="font-medium">{{ formatDate(scheme.creation) }}</span>
                  </div>
                </div>
              </div>

              <!-- Application -->
              <div v-if="scheme.apply_url || scheme.apply_link">
                <Button
                  @click="applyToScheme"
                  variant="solid"
                  class="w-full"
                  :class="scheme.is_eligible ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'"
                >
                  <ExternalLink class="h-4 w-4 mr-2" />
                  Apply for this {{ scheme.scheme_source === 'welfare' ? 'Scheme' : 'Insurance' }}
                </Button>
              </div>

              <!-- Contact Information -->
              <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Need Help?</h4>
                <div class="space-y-2 text-xs text-gray-600 dark:text-gray-400 dark:text-gray-500">
                  <p>If you have questions about this {{ scheme.scheme_source === 'welfare' ? 'welfare scheme' : 'insurance scheme' }}, contact:</p>
                  <div class="flex items-center space-x-2">
                    <Phone class="h-3 w-3" />
                    <span>Support Helpline: 1800-XXX-XXXX</span>
                  </div>
                  <div class="flex items-center space-x-2">
                    <Mail class="h-3 w-3" />
                    <span>support@artha.gov.in</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="bg-gray-50 dark:bg-gray-900 dark:bg-gray-100 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <Button
            v-if="scheme.apply_url || scheme.apply_link"
            @click="applyToScheme"
            variant="solid"
            class="w-full sm:w-auto sm:ml-3"
            :class="scheme.is_eligible ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'"
          >
            <ExternalLink class="h-4 w-4 mr-2" />
            Apply Now
          </Button>
          <Button
            @click="$emit('close')"
            variant="outline"
            class="mt-3 w-full sm:mt-0 sm:w-auto"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAdvancedTheme } from "@/composables/useAdvancedTheme"
import { Button } from "frappe-ui"
import {
	Building,
	CheckCircle,
	DollarSign,
	ExternalLink,
	FileText,
	Info,
	Mail,
	Phone,
	Shield,
	X,
} from "lucide-vue-next"
import { formatCurrency } from "../../utils"

// Props
const props = defineProps({
	scheme: {
		type: Object,
		required: true,
	},
})

// Emits
const emit = defineEmits(["close"])

// Methods
function getSchemeTypeBadgeClass(type) {
	return type === "Government"
		? "bg-blue-100 text-blue-800"
		: "bg-purple-100 text-purple-800"
}

function getSchemeSourceBadgeClass(source) {
	return source === "welfare"
		? "bg-green-100 text-green-800"
		: "bg-orange-100 text-orange-800"
}

function getEligibilityBadgeClass(scheme) {
	if (scheme.is_eligible) {
		return "bg-green-100 text-green-800"
	} else if (scheme.eligibility_score > 0) {
		return "bg-yellow-100 text-yellow-800"
	} else {
		return "bg-red-100 text-red-800"
	}
}

function getEligibilityLabel(scheme) {
	if (scheme.is_eligible) {
		return "Eligible"
	} else if (scheme.eligibility_score > 0) {
		return "Partially Eligible"
	} else {
		return "Not Eligible"
	}
}

function formatDate(dateString) {
	if (!dateString) return "N/A"
	return new Date(dateString).toLocaleDateString("en-IN", {
		year: "numeric",
		month: "short",
		day: "numeric",
	})
}

function applyToScheme() {
	const url = props.scheme.apply_url || props.scheme.apply_link
	if (url) {
		window.open(url, "_blank")
	}
}

// Helper methods to handle different field names between welfare and insurance schemes
function getBenefits(scheme) {
	return (
		scheme.scheme_benefits || scheme.scheme_benefit || scheme.benefits || []
	)
}

function getEligibility(scheme) {
	return scheme.scheme_eligibility || scheme.eligibility || []
}

function getDocuments(scheme) {
	return (
		scheme.scheme_documents || scheme.scheme_document || scheme.documents || []
	)
}

// Advanced theme management
const { currentTheme, isDark, setTheme, themes } = useAdvancedTheme()

// Theme utility methods
const getFinancialStatusClass = (type, intensity = "600") => {
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

const getThemeSurfaceClass = (variant = "primary") => {
	const variants = {
		primary: "bg-white dark:bg-gray-800",
		secondary: "bg-gray-50 dark:bg-gray-900",
		tertiary: "bg-gray-100 dark:bg-gray-800",
	}
	return variants[variant] || variants.primary
}

const getThemeTextClass = (intensity = "600") => {
	const intensityMap = {
		900: "text-gray-900 dark:text-gray-100",
		800: "text-gray-800 dark:text-gray-200",
		700: "text-gray-700 dark:text-gray-300",
		600: "text-gray-600 dark:text-gray-400",
		500: "text-gray-500 dark:text-gray-400",
		400: "text-gray-400 dark:text-gray-500",
	}
	return intensityMap[intensity] || intensityMap["600"]
}
</script> 