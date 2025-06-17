<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { useIncome } from "../composables/useIncome"
import type { IncomeAnalytics } from "../types/income"

const { initialize, getAnalytics, setPeriod } = useIncome()

const selectedPeriod = ref<
	"this_month" | "last_month" | "last_3_months" | "last_6_months" | "this_year"
>("this_month")
const isLoading = ref(true)
const error = ref<string | null>(null)

const analytics = computed(() => getAnalytics.value)

const handlePeriodChange = async (period: typeof selectedPeriod.value) => {
	try {
		isLoading.value = true
		error.value = null
		await setPeriod(period)
	} catch (err) {
		error.value = err instanceof Error ? err.message : "Failed to update period"
	} finally {
		isLoading.value = false
	}
}

onMounted(async () => {
	try {
		isLoading.value = true
		error.value = null
		await initialize({ withAnalytics: true, period: selectedPeriod.value })
	} catch (err) {
		error.value =
			err instanceof Error ? err.message : "Failed to load dashboard data"
	} finally {
		isLoading.value = false
	}
})
</script>

<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h1>Dashboard</h1>
      <div class="period-selector">
        <select v-model="selectedPeriod" @change="handlePeriodChange(selectedPeriod)">
          <option value="this_month">This Month</option>
          <option value="last_month">Last Month</option>
          <option value="last_3_months">Last 3 Months</option>
          <option value="last_6_months">Last 6 Months</option>
          <option value="this_year">This Year</option>
        </select>
      </div>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <div v-if="isLoading" class="loading">
      Loading dashboard data...
    </div>

    <div v-else-if="analytics" class="dashboard-content">
      <div class="summary-cards">
        <div class="card">
          <h3>Total Income</h3>
          <p class="amount">{{ analytics.totalIncome }}</p>
        </div>
        <div class="card">
          <h3>Recurring Income</h3>
          <p class="amount">{{ analytics.recurringIncome }}</p>
        </div>
        <div class="card">
          <h3>One-Time Income</h3>
          <p class="amount">{{ analytics.oneTimeIncome }}</p>
        </div>
      </div>

      <div class="analytics-section">
        <div class="monthly-trends">
          <h2>Monthly Trends</h2>
          <!-- Add your chart component here -->
          <div class="chart-placeholder">
            {{ analytics.monthlyTrends.length }} months of data available
          </div>
        </div>

        <div class="income-by-type">
          <h2>Income by Type</h2>
          <div class="type-breakdown">
            <div v-for="(amount, type) in analytics.incomeByType" :key="type" class="type-item">
              <span class="type-name">{{ type }}</span>
              <span class="type-amount">{{ amount }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="summary-section">
        <h2>Summary</h2>
        <div class="summary-details">
          <p>Total Sources: {{ analytics.summary.total_sources }}</p>
          <p>Average Source Amount: {{ analytics.summary.average_source_amount }}</p>
          <p>Top Income Type: {{ analytics.summary.top_income_type }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  padding: 2rem;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.period-selector select {
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.error-message {
  color: red;
  padding: 1rem;
  background-color: #fff5f5;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.card h3 {
  margin: 0 0 0.5rem 0;
  color: #666;
}

.amount {
  font-size: 1.5rem;
  font-weight: bold;
  color: #2c3e50;
  margin: 0;
}

.analytics-section {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
}

.monthly-trends,
.income-by-type {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.chart-placeholder {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border-radius: 4px;
  color: #666;
}

.type-breakdown {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.type-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 4px;
}

.type-name {
  color: #666;
}

.type-amount {
  font-weight: bold;
  color: #2c3e50;
}

.summary-section {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.summary-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.summary-details p {
  margin: 0;
  color: #666;
}

@media (max-width: 768px) {
  .analytics-section {
    grid-template-columns: 1fr;
  }
}
</style> 