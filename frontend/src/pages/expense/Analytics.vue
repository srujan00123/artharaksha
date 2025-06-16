<template>
  <div class="expense-analytics">
    <!-- Header Section -->
    <div class="header-section mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Expense Analytics</h1>
          <p class="text-gray-600 dark:text-gray-400 dark:text-gray-500 mt-1">Comprehensive analysis of your spending patterns and health expenditure</p>
        </div>
        <div class="flex items-center space-x-3">
          <button 
            @click="handleRefresh"
            :disabled="refreshing"
            class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow dark:shadow-gray-900/20-sm dark:shadow dark:shadow-gray-900/20-gray-900/20 text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 bg-white dark:bg-gray-800 dark:bg-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 dark:bg-gray-100 disabled:opacity-50 transition-colors"
          >
            <RefreshCw :class="{ 'animate-spin': refreshing }" class="w-4 h-4 mr-2" />
            Refresh All
          </button>
        </div>
      </div>
    </div>

    <!-- Analytics Content -->
    <div class="analytics-content">
      <router-view 
        :loading="loading"
        :error="error"
        @refresh="handleRefresh"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { RefreshCw } from "lucide-vue-next"
import { computed, onMounted, provide, ref } from "vue"

// Data-flow integration
import { useExpense } from "../../composables/useExpense"
import { expenseService } from "../../services/expense-service.js"

// State
const refreshing = ref(false)
const loading = ref(false)
const error = ref("")

// Initialize expense composable for data management
const { loadExpenses, refreshExpenses, clearCache } = useExpense({
	enableAdvancedAnalysis: false,
})

// Event handlers
const handleRefresh = async () => {
	refreshing.value = true
	try {
		// Clear cache and refresh all data
		clearCache()
		expenseService.clearCache()

		// Refresh expenses data
		await refreshExpenses()

		console.log("Analytics data refreshed successfully")
	} catch (err) {
		error.value = err.message || "Failed to refresh analytics data"
		console.error("Failed to refresh analytics:", err)
	} finally {
		refreshing.value = false
	}
}

// Provide shared refresh function to child components
provide("analyticsRefresh", handleRefresh)

// Lifecycle
onMounted(async () => {
	// Initialize analytics section
	console.log("Expense Analytics initialized")

	// Load initial data
	try {
		loading.value = true
		await loadExpenses({ useCache: true })
	} catch (err) {
		error.value = err.message || "Failed to load initial analytics data"
		console.error("Failed to load initial analytics data:", err)
	} finally {
		loading.value = false
	}
})
</script>

<style scoped>
.expense-analytics {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8;
}

.analytics-content {
  @apply min-h-screen;
}
</style> 