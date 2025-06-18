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
            :disabled="loading || refreshing"
            class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow dark:shadow-gray-900/20-sm dark:shadow dark:shadow-gray-900/20-gray-900/20 text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 bg-white dark:bg-gray-800 dark:bg-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 dark:bg-gray-100 disabled:opacity-50 transition-colors"
          >
            <RefreshCw :class="{ 'animate-spin': loading || refreshing }" class="w-4 h-4 mr-2" />
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
import { onMounted, provide, ref } from "vue"

// Use the new expense composable system
import { useExpense } from "../../composables/useExpense"

// State
const refreshing = ref(false)

// Initialize expense composable with analytics
const { loading, error, initialize, refreshData } = useExpense()

// Event handlers
const handleRefresh = async () => {
	refreshing.value = true
	try {
		// Force refresh bypassing cache for analytics
		await refreshData({
			withAnalytics: true,
			useCache: false,
		})
		console.log("Analytics data refreshed successfully")
	} catch (err) {
		console.error("Failed to refresh analytics:", err)
	} finally {
		refreshing.value = false
	}
}

// Provide shared refresh function to child components
provide("analyticsRefresh", handleRefresh)

// Lifecycle
onMounted(async () => {
	// Initialize analytics with comprehensive data
	await initialize({
		withAnalytics: true,
		period: "this_month",
	})
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