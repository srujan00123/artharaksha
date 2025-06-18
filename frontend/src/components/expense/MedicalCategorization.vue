<template>
  <div class="medical-categorization">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Medical Expense Analysis
        </h2>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          WHO-compliant categorization and detailed breakdown
        </p>
      </div>
      <div class="flex items-center space-x-2">
        <button 
          @click="toggleView"
          :disabled="!hasData"
          class="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <BarChart3 class="w-4 h-4 mr-2" />
          {{ viewMode === 'cards' ? 'Chart View' : 'Card View' }}
        </button>
        <button 
          @click="exportData"
          :disabled="!hasData"
          class="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Download class="w-4 h-4 mr-2" />
          Export
        </button>
      </div>
    </div>

    <!-- No Data State -->
    <div v-if="!hasData" class="text-center py-12">
      <Heart class="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
      <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
        No Medical Expenses Found
      </h3>
      <p class="text-gray-500 dark:text-gray-400">
        Medical expenses will appear here once you add them
      </p>
    </div>

    <!-- Main Content -->
    <div v-else>
      <!-- Quick Stats Bar -->
      <div class="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 mb-6">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {{ directMedicalPercentage.toFixed(1) }}%
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400">Direct Medical</p>
          </div>
          <div>
            <p class="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {{ indirectMedicalPercentage.toFixed(1) }}%
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400">Indirect Medical</p>
          </div>
          <div>
            <p class="text-2xl font-bold text-green-600 dark:text-green-400">
              {{ totalTransactions }}
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400">Total Transactions</p>
          </div>
          <div>
            <p class="text-2xl font-bold text-red-600 dark:text-red-400">
              ₹{{ averageTransactionAmount.toLocaleString() }}
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400">Avg. Amount</p>
          </div>
        </div>
      </div>

      <!-- Content Views -->
      <div v-if="viewMode === 'cards'" class="cards-view">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Direct Medical Categories -->
          <CategorySection
            title="Direct Medical Expenses"
            :categories="directMedicalCategories"
            :total-amount="directMedicalAmount"
            color-scheme="blue"
            icon="stethoscope"
            description="Healthcare services and treatments"
            @category-selected="selectCategory"
          />

          <!-- Indirect Medical Categories -->
          <CategorySection
            title="Indirect Medical Expenses"
            :categories="indirectMedicalCategories"
            :total-amount="indirectMedicalAmount"
            color-scheme="purple"
            icon="car"
            description="Transportation, accommodation, and related costs"
            @category-selected="selectCategory"
          />
        </div>
      </div>

      <!-- Chart View -->
      <div v-else class="chart-view">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Distribution Chart -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-6">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Direct vs Indirect Distribution
            </h3>
            <div class="h-64">
              <apexchart
                type="donut"
                :options="distributionChartOptions"
                :series="distributionChartSeries"
                height="100%"
              />
            </div>
          </div>

          <!-- Category Breakdown Chart -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-6">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Top Categories
            </h3>
            <div class="h-64">
              <apexchart
                type="bar"
                :options="categoryChartOptions"
                :series="categoryChartSeries"
                height="100%"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Category Details Modal -->
    <CategoryDetailsModal
      v-if="selectedCategory"
      :category="selectedCategory"
      @close="selectedCategory = null"
    />
  </div>
</template>

<script setup lang="ts">
import { BarChart3, Download, Heart } from "lucide-vue-next"
import { computed, ref } from "vue"
import VueApexCharts from "vue3-apexcharts"
import type { FlattenedExpenseEntry } from "../../types/expense"
import CategoryDetailsModal from "./CategoryDetailsModal.vue"
import CategorySection from "./CategorySection.vue"

const apexchart = VueApexCharts

// Props
interface Props {
	medicalExpenses: FlattenedExpenseEntry[]
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
	categorySelected: [category: CategoryBreakdown]
	exportRequested: [data: ExportData]
}>()

// Types
interface CategoryBreakdown {
	category: string
	type: "direct" | "indirect"
	count: number
	totalAmount: number
	averageAmount: number
	percentage: number
	expenses: FlattenedExpenseEntry[]
}

interface ExportData {
	summary: {
		totalMedical: number
		directMedical: number
		indirectMedical: number
		directPercentage: number
		indirectPercentage: number
		totalTransactions: number
		averageAmount: number
	}
	directCategories: CategoryBreakdown[]
	indirectCategories: CategoryBreakdown[]
}

// Local state
const viewMode = ref<"cards" | "charts">("cards")
const selectedCategory = ref<CategoryBreakdown | null>(null)

// Computed properties
const hasData = computed(() => props.medicalExpenses.length > 0)

const directMedicalExpenses = computed(() =>
	props.medicalExpenses.filter((expense) => expense.is_direct === true),
)

const indirectMedicalExpenses = computed(() =>
	props.medicalExpenses.filter((expense) => expense.is_direct === false),
)

const totalMedicalAmount = computed(() =>
	props.medicalExpenses.reduce(
		(sum, expense) => sum + (expense.amount || 0),
		0,
	),
)

const directMedicalAmount = computed(() =>
	directMedicalExpenses.value.reduce(
		(sum, expense) => sum + (expense.amount || 0),
		0,
	),
)

const indirectMedicalAmount = computed(() =>
	indirectMedicalExpenses.value.reduce(
		(sum, expense) => sum + (expense.amount || 0),
		0,
	),
)

const directMedicalPercentage = computed(() =>
	totalMedicalAmount.value > 0
		? (directMedicalAmount.value / totalMedicalAmount.value) * 100
		: 0,
)

const indirectMedicalPercentage = computed(() =>
	totalMedicalAmount.value > 0
		? (indirectMedicalAmount.value / totalMedicalAmount.value) * 100
		: 0,
)

const totalTransactions = computed(() => props.medicalExpenses.length)

const averageTransactionAmount = computed(() =>
	totalTransactions.value > 0
		? Math.round(totalMedicalAmount.value / totalTransactions.value)
		: 0,
)

// Category breakdowns using shared logic
const createCategoryBreakdown = (
	expenses: FlattenedExpenseEntry[],
	type: "direct" | "indirect",
	totalAmount: number,
): CategoryBreakdown[] => {
	const categoryMap = new Map<string, FlattenedExpenseEntry[]>()

	for (const expense of expenses) {
		const category = expense.category || "Uncategorized"
		if (!categoryMap.has(category)) {
			categoryMap.set(category, [])
		}
		const categoryExpenses = categoryMap.get(category)
		if (categoryExpenses) {
			categoryExpenses.push(expense)
		}
	}

	return Array.from(categoryMap.entries())
		.map(([category, categoryExpenses]) => {
			const categoryTotal = categoryExpenses.reduce(
				(sum, expense) => sum + (expense.amount || 0),
				0,
			)
			return {
				category,
				type,
				count: categoryExpenses.length,
				totalAmount: categoryTotal,
				averageAmount: Math.round(categoryTotal / categoryExpenses.length),
				percentage: totalAmount > 0 ? (categoryTotal / totalAmount) * 100 : 0,
				expenses: categoryExpenses.sort(
					(a, b) =>
						new Date(b.date_time).getTime() - new Date(a.date_time).getTime(),
				),
			}
		})
		.sort((a, b) => b.totalAmount - a.totalAmount)
}

const directMedicalCategories = computed(() =>
	createCategoryBreakdown(
		directMedicalExpenses.value,
		"direct",
		directMedicalAmount.value,
	),
)

const indirectMedicalCategories = computed(() =>
	createCategoryBreakdown(
		indirectMedicalExpenses.value,
		"indirect",
		indirectMedicalAmount.value,
	),
)

// Chart configurations
const distributionChartOptions = computed(() => ({
	chart: {
		type: "donut",
		height: 280,
	},
	labels: ["Direct Medical", "Indirect Medical"],
	colors: ["#3b82f6", "#8b5cf6"],
	legend: {
		position: "bottom",
		fontSize: "12px",
	},
	tooltip: {
		y: {
			formatter: (value: number) => `₹${value.toLocaleString()}`,
		},
	},
	plotOptions: {
		pie: {
			donut: {
				size: "45%",
				labels: {
					show: true,
					total: {
						show: true,
						label: "Total Medical",
						formatter: () => `₹${totalMedicalAmount.value.toLocaleString()}`,
					},
				},
			},
		},
	},
	dataLabels: {
		enabled: true,
		formatter: (val: number) => `${val.toFixed(1)}%`,
		style: {
			fontSize: "11px",
		},
	},
}))

const distributionChartSeries = computed(() => [
	directMedicalAmount.value,
	indirectMedicalAmount.value,
])

const categoryChartOptions = computed(() => {
	const topCategories = [
		...directMedicalCategories.value.slice(0, 3),
		...indirectMedicalCategories.value.slice(0, 3),
	]
		.sort((a, b) => b.totalAmount - a.totalAmount)
		.slice(0, 6)

	return {
		chart: {
			type: "bar",
			height: 280,
		},
		plotOptions: {
			bar: {
				horizontal: true,
				columnWidth: "55%",
				endingShape: "rounded",
			},
		},
		dataLabels: {
			enabled: false,
		},
		xaxis: {
			categories: topCategories.map((cat) => cat.category),
			labels: {
				style: {
					fontSize: "10px",
				},
			},
		},
		yaxis: {
			title: {
				text: "Amount (₹)",
				style: {
					fontSize: "12px",
				},
			},
			labels: {
				formatter: (value: number) => `₹${value.toLocaleString()}`,
				style: {
					fontSize: "10px",
				},
			},
		},
		colors: topCategories.map((cat) =>
			cat.type === "direct" ? "#3b82f6" : "#8b5cf6",
		),
		tooltip: {
			y: {
				formatter: (val: number) => `₹${val.toLocaleString()}`,
			},
		},
	}
})

const categoryChartSeries = computed(() => {
	const topCategories = [
		...directMedicalCategories.value.slice(0, 3),
		...indirectMedicalCategories.value.slice(0, 3),
	]
		.sort((a, b) => b.totalAmount - a.totalAmount)
		.slice(0, 6)

	return [
		{
			name: "Amount",
			data: topCategories.map((cat) => cat.totalAmount),
		},
	]
})

// Methods
const toggleView = () => {
	if (hasData.value) {
		viewMode.value = viewMode.value === "cards" ? "charts" : "cards"
	}
}

const selectCategory = (category: CategoryBreakdown) => {
	selectedCategory.value = category
	emit("categorySelected", category)
}

const exportData = () => {
	if (!hasData.value) return

	const exportData: ExportData = {
		summary: {
			totalMedical: totalMedicalAmount.value,
			directMedical: directMedicalAmount.value,
			indirectMedical: indirectMedicalAmount.value,
			directPercentage: directMedicalPercentage.value,
			indirectPercentage: indirectMedicalPercentage.value,
			totalTransactions: totalTransactions.value,
			averageAmount: averageTransactionAmount.value,
		},
		directCategories: directMedicalCategories.value,
		indirectCategories: indirectMedicalCategories.value,
	}
	emit("exportRequested", exportData)
}
</script>

<style scoped>
.medical-categorization {
  @apply w-full;
}

.cards-view,
.chart-view {
  @apply transition-all duration-300;
}
</style> 