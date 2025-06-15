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
import { computed, onMounted, provide } from 'vue'

// Components
import { ExpenseForm } from '../../components'

// Composables
import { useExpense } from '../../composables/useExpense'

// Initialize composable
const composableResult = useExpense({ enableAdvancedAnalysis: true }) as any
const state = composableResult.state
const actions = composableResult.actions

// Computed properties for child components
const loading = computed(() => state.loading)
const error = computed(() => state.error)
const showExpenseForm = computed(() => state.showExpenseForm)
const editingExpense = computed(() => state.editingExpense)

// Provide state and actions to child components
provide('expenseState', state)
provide('expenseActions', actions)

// Event Handlers
const handleRefresh = async () => {
  try {
    await actions.refreshExpenses()
  } catch (error) {
    console.error('Failed to refresh expenses:', error)
  }
}

const handleAddExpense = () => {
  actions.openExpenseForm()
}

const handleCloseExpenseForm = () => {
  actions.closeExpenseForm()
}

const handleExpenseFormSuccess = async () => {
  try {
    await actions.loadExpenses()
  } catch (error) {
    console.error('Failed to reload expenses after form success:', error)
  }
}

// Lifecycle
onMounted(async () => {
  try {
    await actions.initialize()
  } catch (error) {
    console.error('ExpenseLayout: Initialization failed:', error)
  }
})
</script>

<style scoped>
.expense-layout {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8;
}
</style> 