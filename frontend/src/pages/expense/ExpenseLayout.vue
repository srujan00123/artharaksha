<template>
  <div class="expense-layout">
    <!-- Child Route Content -->
    <div class="expense-content">
      <router-view 
        :loading="loading"
        :error="error"
        @add-expense="handleAddExpense"
        @refresh="handleRefresh"
      />
    </div>

    <!-- Expense Form Modal -->
    <ExpenseForm
      v-if="showExpenseForm"
      :expense="editingExpense"
      @close="handleCloseExpenseForm"
      @success="handleExpenseFormSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, provide, ref } from "vue"

// Components
import { ExpenseForm } from "../../components"

// Composables
import { useExpense } from "../../composables/useExpense"

// Initialize expense composable with new system
const {
	expenses,
	loading,
	error,
	initialize,
	refreshData,
} = useExpense()

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
			useCache: false 
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
			useCache: false 
		})
		// Close form
		handleCloseExpenseForm()
	} catch (error) {
		console.error("Failed to reload expenses after form success:", error)
	}
}

// Lifecycle
onMounted(async () => {
	// Initialize with analytics and default period
	await initialize({ 
		withAnalytics: true, 
		period: "this_month" 
	})
})
</script>

<style scoped>
.expense-layout {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8;
}
</style> 