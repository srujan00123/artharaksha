<template>
  <div 
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" 
    @click="closeModal"
  >
    <div 
      class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden" 
      @click.stop
    >
      <!-- Modal Header -->
      <div class="p-6 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div 
              :class="iconBackgroundClass" 
              class="w-10 h-10 rounded-lg flex items-center justify-center"
            >
              <component 
                :is="getCategoryIcon(category.category)" 
                :class="iconColorClass" 
                class="w-5 h-5" 
              />
            </div>
            <div>
              <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {{ category.category }}
              </h2>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ getTypeLabel(category.type) }} • 
                {{ category.count }} {{ category.count === 1 ? 'transaction' : 'transactions' }} • 
                ₹{{ category.averageAmount.toLocaleString() }} average
              </p>
            </div>
          </div>
          <button 
            @click="closeModal"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Modal Content -->
      <div class="p-6 overflow-y-auto max-h-96">
        <h3 class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
          Recent Transactions
        </h3>
        <div class="space-y-3">
          <div 
            v-for="expense in displayExpenses" 
            :key="expense.id || expense.name"
            class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
          >
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
                {{ expense.description || expense.category }}
              </p>
              <div class="flex items-center space-x-2 mt-1">
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ formatDate(expense.date_time || expense.date) }}
                </p>
                <span 
                  v-if="expense.provider" 
                  class="text-xs text-gray-500 dark:text-gray-400"
                >
                  • {{ expense.provider }}
                </span>
                <span 
                  v-if="expense.is_direct !== null && expense.is_direct !== undefined" 
                  :class="getTypeTagClass(expense.is_direct)"
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                >
                  {{ expense.is_direct ? 'Direct' : 'Indirect' }}
                </span>
              </div>
            </div>
            <div class="text-right">
              <p class="text-sm font-semibold text-gray-900 dark:text-gray-100">
                ₹{{ expense.amount.toLocaleString() }}
              </p>
              <div class="flex items-center space-x-1 mt-1">
                <span 
                  v-if="expense.hasReceipt || expense.proof_of_payment" 
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                >
                  Receipt
                </span>
              </div>
            </div>
          </div>
          
          <!-- Show more indicator -->
          <div v-if="category.expenses.length > maxDisplayExpenses" class="text-center pt-3">
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Showing {{ maxDisplayExpenses }} of {{ category.expenses.length }} transactions
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
	Bed,
	Building2,
	Car,
	Heart,
	Home,
	Phone,
	Pill,
	Plane,
	ShoppingBag,
	Stethoscope,
	Syringe,
	Utensils,
	X,
} from "lucide-vue-next"
import { computed } from "vue"

// Props
interface Props {
	category: CategoryBreakdown
}

interface CategoryBreakdown {
	category: string
	type: string
	count: number
	totalAmount: number
	averageAmount: number
	percentage: number
	expenses: Array<{
		id?: string
		name?: string
		category: string
		amount: number
		date_time?: string
		date?: string
		description?: string
		provider?: string
		is_direct?: boolean
		hasReceipt?: boolean
		proof_of_payment?: string
	}>
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
	close: []
}>()

// Constants
const maxDisplayExpenses = 10

// Computed properties
const displayExpenses = computed(() =>
	props.category.expenses.slice(0, maxDisplayExpenses),
)

const iconBackgroundClass = computed(() => {
	const type = props.category.type
	if (type === "direct" || type === "direct_medical") {
		return "bg-blue-100 dark:bg-blue-900/30"
	}
	if (type === "indirect" || type === "indirect_medical") {
		return "bg-purple-100 dark:bg-purple-900/30"
	}
	return "bg-green-100 dark:bg-green-900/30"
})

const iconColorClass = computed(() => {
	const type = props.category.type
	if (type === "direct" || type === "direct_medical") {
		return "text-blue-600 dark:text-blue-400"
	}
	if (type === "indirect" || type === "indirect_medical") {
		return "text-purple-600 dark:text-purple-400"
	}
	return "text-green-600 dark:text-green-400"
})

// Methods
const closeModal = () => {
	emit("close")
}

const getTypeLabel = (type: string): string => {
	switch (type) {
		case "direct":
		case "direct_medical":
			return "Direct Medical"
		case "indirect":
		case "indirect_medical":
			return "Indirect Medical"
		case "other":
			return "Other Expense"
		default:
			return "Medical"
	}
}

const getTypeTagClass = (isDirect: boolean): string => {
	if (isDirect) {
		return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200"
	}
	return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200"
}

const getCategoryIcon = (category: string) => {
	const categoryLower = category.toLowerCase()

	if (
		categoryLower.includes("medicine") ||
		categoryLower.includes("drug") ||
		categoryLower.includes("pharmacy")
	) {
		return Pill
	}
	if (categoryLower.includes("hospital") || categoryLower.includes("clinic")) {
		return Building2
	}
	if (categoryLower.includes("bed") || categoryLower.includes("admission")) {
		return Bed
	}
	if (
		categoryLower.includes("injection") ||
		categoryLower.includes("vaccine")
	) {
		return Syringe
	}
	if (
		categoryLower.includes("transport") ||
		categoryLower.includes("travel") ||
		categoryLower.includes("flight")
	) {
		return categoryLower.includes("flight") ? Plane : Car
	}
	if (
		categoryLower.includes("accommodation") ||
		categoryLower.includes("hotel")
	) {
		return Home
	}
	if (categoryLower.includes("food") || categoryLower.includes("meal")) {
		return Utensils
	}
	if (
		categoryLower.includes("phone") ||
		categoryLower.includes("communication")
	) {
		return Phone
	}

	return Heart
}

const formatDate = (dateString: string): string => {
	if (!dateString) return ""

	try {
		return new Date(dateString).toLocaleDateString("en-IN", {
			year: "numeric",
			month: "short",
			day: "numeric",
		})
	} catch {
		return dateString
	}
}
</script>

<style scoped>
/* Modal backdrop animation */
.fixed {
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Modal content animation */
.bg-white {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style> 