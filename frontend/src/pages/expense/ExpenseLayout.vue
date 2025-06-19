<template>
	<div class="expense-layout">
		<!-- Header Section Banner -->
		<div class="header-section mb-4 sm:mb-6">
			<div class="bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl p-4 sm:p-6 lg:p-8 text-white">
				<div class="flex flex-col sm:flex-row items-start justify-between gap-4">
					<div class="flex-1">
						<h1 class="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">
							Expense Management
						</h1>
						<p class="text-blue-100 text-sm sm:text-base lg:text-lg mb-2 sm:mb-4 max-w-3xl leading-relaxed">
							Track and manage your medical and healthcare expenses with detailed analytics
						</p>
					</div>
					<div class="hidden sm:block flex-shrink-0">
						<div
							class="w-12 h-12 sm:w-16 sm:h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
							<Receipt class="w-6 h-6 sm:w-8 sm:h-8 text-white" />
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Child Route Content -->
		<div class="expense-content">
			<router-view :loading="loading" :error="error" @add-expense="handleAddExpense" @refresh="handleRefresh" />
		</div>

		<!-- Expense Form Modal -->
		<ExpenseForm v-if="showExpenseForm" :expense="editingExpense" @close="handleCloseExpenseForm"
			@success="handleExpenseFormSuccess" />
	</div>
</template>

<script setup lang="ts">
import { Receipt } from "lucide-vue-next"
import { onMounted, provide, ref } from "vue"

// Components
import { ExpenseForm } from "../../components"

// Composables
import { useExpense } from "../../composables/useExpense"

// Initialize expense composable with proper options
const { expenses, loading, error, initialize, refreshData } = useExpense({
	autoInitialize: false,
})

// Local state for form management
const showExpenseForm = ref(false)
const editingExpense = ref(null)

// Provide state and actions to child components
provide("expenseState", {
	expenses,
	loading,
	error,
	showExpenseForm,
	editingExpense,
})

provide("expenseActions", {
	refreshData,
	openExpenseForm: () => {
		editingExpense.value = null
		showExpenseForm.value = true
	},
	closeExpenseForm: () => {
		showExpenseForm.value = false
		editingExpense.value = null
	},
	editExpense: (expense: any) => {
		editingExpense.value = expense
		showExpenseForm.value = true
	},
})

// Event Handlers
const handleRefresh = async () => {
	try {
		// Force refresh bypassing cache
		await refreshData({
			withAnalytics: true,
			useCache: false,
		})
	} catch (error) {
		console.error("Failed to refresh expenses:", error)
	}
}

const handleAddExpense = () => {
	editingExpense.value = null
	showExpenseForm.value = true
}

const handleCloseExpenseForm = () => {
	showExpenseForm.value = false
	editingExpense.value = null
}

const handleExpenseFormSuccess = async () => {
	try {
		// Refresh data after successful form submission
		await refreshData({
			withAnalytics: true,
			useCache: false,
		})
		// Close form
		handleCloseExpenseForm()
	} catch (error) {
		console.error("Failed to reload expenses after form success:", error)
	}
}

// Lifecycle
onMounted(async () => {
	try {
		// Initialize with analytics and default period
		await initialize({
			withAnalytics: true,
			period: "this_month",
		})
	} catch (error) {
		console.error("Failed to initialize expense layout:", error)
	}
})
</script>

<style scoped>
.expense-layout {
	@apply max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8;
}

/* Mobile-specific optimizations */
@media (max-width: 640px) {
	.expense-layout {
		@apply px-3 py-4;
	}
}
</style>