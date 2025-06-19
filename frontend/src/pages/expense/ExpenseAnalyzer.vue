<template>
  <div class="expense-analyzer">
    <!-- Header Section -->
    <div class="header-section mb-4 sm:mb-6">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Expense Overview</h1>
          <p class="text-gray-600 dark:text-gray-400 dark:text-gray-500 mt-1 text-sm sm:text-base">Track and manage your
            expenses</p>
        </div>
        <div
          class="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
          <button @click="handleAddExpense" :disabled="state.loading"
            class="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white dark:text-black rounded-lg shadow dark:shadow-gray-900/20-sm dark:shadow dark:shadow-gray-900/20-gray-900/20 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors min-h-[44px] touch-manipulation">
            <Plus class="w-4 h-4 mr-2" />
            <span class="hidden sm:inline">Add Expense</span>
            <span class="sm:hidden">Add</span>
          </button>
          <button @click="handleRefresh" :disabled="state.loading"
            class="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow dark:shadow-gray-900/20-sm dark:shadow dark:shadow-gray-900/20-gray-900/20 text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 bg-white dark:bg-gray-800 dark:bg-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 dark:bg-gray-100 disabled:opacity-50 transition-colors min-h-[44px] touch-manipulation">
            <RefreshCw class="w-4 h-4 mr-2" />
            <span class="hidden sm:inline">Refresh</span>
            <span class="sm:hidden">Refresh</span>
          </button>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-4 sm:mt-6">
        <div
          class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20-sm dark:shadow dark:shadow-gray-900/20-gray-900/20 border p-3 sm:p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <FileText class="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div class="ml-3">
              <p class="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500">Total
                Expenses</p>
              <p class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">{{ state.summary.totalItems
              }}</p>
            </div>
          </div>
        </div>

        <div
          class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20-sm dark:shadow dark:shadow-gray-900/20-gray-900/20 border p-3 sm:p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <DollarSign class="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div class="ml-3">
              <p class="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500">Total Amount
              </p>
              <p class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">₹{{
                state.summary.totalAmount.toLocaleString() }}</p>
            </div>
          </div>
        </div>

        <div
          class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20-sm dark:shadow dark:shadow-gray-900/20-gray-900/20 border p-3 sm:p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <Heart class="w-4 h-4 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <div class="ml-3">
              <p class="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500">Medical</p>
              <p class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">{{
                state.groupedExpenses.medical.count }}</p>
            </div>
          </div>
        </div>

        <div
          class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20-sm dark:shadow dark:shadow-gray-900/20-gray-900/20 border p-3 sm:p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <ShoppingBag class="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div class="ml-3">
              <p class="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500">Other</p>
              <p class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">{{
                state.groupedExpenses.other.count }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Filter Section -->
    <ExpenseFilter :loading="state.loading" :total-count="state.rawExpenses.length"
      :filtered-count="state.filteredExpenses.length" @update:filters="handleFiltersUpdate"
      @reset="handleFiltersReset" />

    <!-- Profile Warning -->
    <div v-if="showProfileWarning" class="profile-warning mb-4 sm:mb-6">
      <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div class="flex flex-col sm:flex-row items-start gap-3">
          <div class="flex items-start flex-1">
            <div class="flex-shrink-0">
              <AlertTriangle class="h-5 w-5 text-yellow-400" />
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-yellow-800 dark:text-yellow-200">No Household Profile Found</h3>
              <p class="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                You need to set up your household profile to track expenses and get CHE analysis.
              </p>
            </div>
          </div>
          <div class="w-full sm:w-auto">
            <button @click="$router.push('/profile')"
              class="w-full sm:w-auto bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 text-yellow-800 dark:text-yellow-200 px-3 py-2 rounded text-sm transition-colors min-h-[44px] touch-manipulation">
              Set Up Profile
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Content Section -->
    <div class="expense-content mt-4 sm:mt-6">
      <!-- Loading State -->
      <div v-if="state.loading" class="loading-state">
        <div class="flex items-center justify-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p class="text-gray-600 dark:text-gray-400 dark:text-gray-500 ml-3">Loading expenses...</p>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="state.error" class="error-state">
        <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div class="flex flex-col sm:flex-row items-start gap-3">
            <div class="flex items-start flex-1">
              <div class="flex-shrink-0">
                <AlertCircle class="h-5 w-5 text-red-400" />
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-red-800 dark:text-red-200">Error Loading Expenses</h3>
                <p class="text-sm text-red-700 dark:text-red-300 mt-1">{{ state.error }}</p>
              </div>
            </div>
            <div class="w-full sm:w-auto">
              <button @click="handleRefresh"
                class="w-full sm:w-auto bg-red-100 dark:bg-red-900/30 hover:bg-red-200 text-red-800 dark:text-red-200 px-3 py-2 rounded text-sm transition-colors min-h-[44px] touch-manipulation">
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="state.isEmpty" class="empty-state">
        <div
          class="text-center py-12 bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20-sm dark:shadow dark:shadow-gray-900/20-gray-900/20 border">
          <FileText class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
          <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No expenses found</h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 px-4">
            {{ state.hasFilters ? 'No expenses match your current filters.' : 'Get started by adding your first' }}
          </p>
          <div class="mt-6 flex flex-col sm:flex-row gap-3 justify-center px-4">
            <button v-if="state.hasFilters" @click="handleFiltersReset"
              class="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow dark:shadow-gray-900/20-sm dark:shadow dark:shadow-gray-900/20-gray-900/20 text-sm font-medium rounded-lg text-white dark:text-black bg-blue-600 hover:bg-blue-700 transition-colors min-h-[44px] touch-manipulation">
              Clear Filters
            </button>
            <button @click="handleAddExpense"
              class="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow dark:shadow-gray-900/20-sm dark:shadow dark:shadow-gray-900/20-gray-900/20 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 dark:text-gray-600 bg-white dark:bg-gray-800 dark:bg-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 dark:bg-gray-100 transition-colors min-h-[44px] touch-manipulation">
              <Plus class="w-4 h-4 mr-2" />
              Add Expense
            </button>
          </div>
        </div>
      </div>

      <!-- Expense Groups with Pagination -->
      <div v-else class="expense-groups space-y-4">
        <!-- Medical Expenses Group -->
        <div v-if="paginatedMedicalExpenses.total > 0"
          class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20-sm dark:shadow dark:shadow-gray-900/20-gray-900/20 border">
          <Disclosure v-slot="{ open }" :defaultOpen="true">
            <DisclosureButton
              class="flex w-full justify-between items-center px-3 sm:px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 dark:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:ring-blue-400 focus-visible:ring-opacity-75 rounded-t-lg transition-colors touch-manipulation min-h-[44px]">
              <div class="flex items-center">
                <div class="w-6 h-6 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mr-3">
                  <Heart class="w-3 h-3 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 class="text-sm sm:text-base font-medium">Medical Expenses</h3>
                  <p class="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">{{
                    paginatedMedicalExpenses.total }} items • ₹{{ state.groupedExpenses.medical.total.toLocaleString()
                    }}</p>
                </div>
              </div>
              <ChevronUp :class="open ? 'rotate-180 transform' : ''"
                class="h-4 w-4 text-gray-500 dark:text-gray-400 dark:text-gray-500 transition-transform duration-200" />
            </DisclosureButton>
            <DisclosurePanel class="px-0 pb-0">
              <!-- Table Content - Mobile Responsive -->
              <div class="overflow-x-auto">
                <!-- Desktop Table Header -->
                <div
                  class="hidden md:grid grid-cols-12 gap-4 px-3 sm:px-4 py-2 bg-gray-50 dark:bg-gray-900 dark:bg-gray-100 text-xs font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500 uppercase tracking-wider border-b">
                  <div class="col-span-3">Category</div>
                  <div class="col-span-3">Description</div>
                  <div class="col-span-2">Date</div>
                  <div class="col-span-2 text-right">Amount</div>
                  <div class="col-span-2 text-right">Actions</div>
                </div>

                <!-- Table Rows -->
                <div class="divide-y divide-gray-100 dark:divide-gray-700">
                  <div v-for="expense in paginatedMedicalExpenses.items" :key="expense.id"
                    class="p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 dark:bg-gray-100 transition-colors">
                    <!-- Mobile Layout -->
                    <div class="md:hidden space-y-3">
                      <div class="flex items-center justify-between">
                        <h4 class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ expense.category }}</h4>
                        <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">₹{{
                          expense.amount.toLocaleString() }}</span>
                      </div>
                      <p class="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500" v-if="expense.description">
                        {{ expense.description }}</p>
                      <div class="flex items-center justify-between">
                        <div class="flex items-center text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">
                          <span>{{ formatDate(expense.date) }}</span>
                          <span v-if="expense.hasReceipt"
                            class="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                            <Receipt class="w-2.5 h-2.5 mr-1" />
                            Receipt
                          </span>
                        </div>
                        <div class="flex items-center space-x-1">
                          <button @click="handleEditExpense(expense)"
                            class="p-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:text-blue-200 hover:bg-blue-50 dark:bg-blue-900/20 rounded transition-colors min-h-[44px] min-w-[44px] touch-manipulation"
                            title="Edit expense">
                            <Edit2 class="w-4 h-4" />
                          </button>
                          <button @click="handleDeleteExpense(expense)"
                            class="p-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:text-red-200 hover:bg-red-50 dark:bg-red-900/20 rounded transition-colors min-h-[44px] min-w-[44px] touch-manipulation"
                            title="Delete expense">
                            <Trash2 class="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <!-- Desktop Layout -->
                    <div class="hidden md:grid grid-cols-12 gap-4 items-center">
                      <div class="col-span-3 flex items-center">
                        <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ expense.category }}</span>
                        <span v-if="expense.hasReceipt"
                          class="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                          <Receipt class="w-2.5 h-2.5 mr-1" />
                          Receipt
                        </span>
                      </div>
                      <div class="col-span-3 flex items-center">
                        <span class="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">{{ expense.description
                          || '-' }}</span>
                      </div>
                      <div class="col-span-2 flex items-center">
                        <span class="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{{
                          formatDate(expense.date) }}</span>
                      </div>
                      <div class="col-span-2 flex items-center justify-end">
                        <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">₹{{
                          expense.amount.toLocaleString() }}</span>
                      </div>
                      <div class="col-span-2 flex items-center justify-end space-x-1">
                        <button @click="handleEditExpense(expense)"
                          class="p-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:text-blue-200 hover:bg-blue-50 dark:bg-blue-900/20 rounded transition-colors"
                          title="Edit expense">
                          <Edit2 class="w-3 h-3" />
                        </button>
                        <button @click="handleDeleteExpense(expense)"
                          class="p-1.5 text-red-600 dark:text-red-400 hover:text-red-800 dark:text-red-200 hover:bg-red-50 dark:bg-red-900/20 rounded transition-colors"
                          title="Delete expense">
                          <Trash2 class="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Medical Expenses Pagination -->
              <div v-if="paginatedMedicalExpenses.totalPages > 1"
                class="px-3 sm:px-4 py-3 border-t bg-gray-50 dark:bg-gray-900 dark:bg-gray-100">
                <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div
                    class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 text-center sm:text-left">
                    Showing {{ paginatedMedicalExpenses.start }} to {{ paginatedMedicalExpenses.end }} of {{
                      paginatedMedicalExpenses.total }} medical expenses
                  </div>
                  <div class="flex items-center space-x-2">
                    <button @click="medicalPage = Math.max(1, medicalPage - 1)" :disabled="medicalPage === 1"
                      class="px-3 py-1 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-600 dark:bg-gray-800 dark:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] touch-manipulation">
                      Previous
                    </button>
                    <span class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 px-2">
                      {{ medicalPage }} of {{ paginatedMedicalExpenses.totalPages }}
                    </span>
                    <button @click="medicalPage = Math.min(paginatedMedicalExpenses.totalPages, medicalPage + 1)"
                      :disabled="medicalPage === paginatedMedicalExpenses.totalPages"
                      class="px-3 py-1 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-600 dark:bg-gray-800 dark:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] touch-manipulation">
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </DisclosurePanel>
          </Disclosure>
        </div>

        <!-- Other Expenses Group -->
        <div v-if="paginatedOtherExpenses.total > 0"
          class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20-sm dark:shadow dark:shadow-gray-900/20-gray-900/20 border">
          <Disclosure v-slot="{ open }" :defaultOpen="true">
            <DisclosureButton
              class="flex w-full justify-between items-center px-3 sm:px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 dark:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:ring-blue-400 focus-visible:ring-opacity-75 rounded-t-lg transition-colors touch-manipulation min-h-[44px]">
              <div class="flex items-center">
                <div class="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <ShoppingBag class="w-3 h-3 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 class="text-sm sm:text-base font-medium">Other Expenses</h3>
                  <p class="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">{{ paginatedOtherExpenses.total
                  }} items • ₹{{ state.groupedExpenses.other.total.toLocaleString() }}</p>
                </div>
              </div>
              <ChevronUp :class="open ? 'rotate-180 transform' : ''"
                class="h-4 w-4 text-gray-500 dark:text-gray-400 dark:text-gray-500 transition-transform duration-200" />
            </DisclosureButton>
            <DisclosurePanel class="px-0 pb-0">
              <!-- Table Content - Mobile Responsive -->
              <div class="overflow-x-auto">
                <!-- Desktop Table Header -->
                <div
                  class="hidden md:grid grid-cols-12 gap-4 px-3 sm:px-4 py-2 bg-gray-50 dark:bg-gray-900 dark:bg-gray-100 text-xs font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500 uppercase tracking-wider border-b">
                  <div class="col-span-3">Category</div>
                  <div class="col-span-3">Description</div>
                  <div class="col-span-2">Date</div>
                  <div class="col-span-2 text-right">Amount</div>
                  <div class="col-span-2 text-right">Actions</div>
                </div>

                <!-- Table Rows -->
                <div class="divide-y divide-gray-100 dark:divide-gray-700">
                  <div v-for="expense in paginatedOtherExpenses.items" :key="expense.id"
                    class="p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 dark:bg-gray-100 transition-colors">
                    <!-- Mobile Layout -->
                    <div class="md:hidden space-y-3">
                      <div class="flex items-center justify-between">
                        <h4 class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ expense.category }}</h4>
                        <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">₹{{
                          expense.amount.toLocaleString() }}</span>
                      </div>
                      <p class="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500" v-if="expense.description">
                        {{ expense.description }}</p>
                      <div class="flex items-center justify-between">
                        <span class="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">{{
                          formatDate(expense.date) }}</span>
                        <div class="flex items-center space-x-1">
                          <button @click="handleEditExpense(expense)"
                            class="p-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:text-blue-200 hover:bg-blue-50 dark:bg-blue-900/20 rounded transition-colors min-h-[44px] min-w-[44px] touch-manipulation"
                            title="Edit expense">
                            <Edit2 class="w-4 h-4" />
                          </button>
                          <button @click="handleDeleteExpense(expense)"
                            class="p-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:text-red-200 hover:bg-red-50 dark:bg-red-900/20 rounded transition-colors min-h-[44px] min-w-[44px] touch-manipulation"
                            title="Delete expense">
                            <Trash2 class="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <!-- Desktop Layout -->
                    <div class="hidden md:grid grid-cols-12 gap-4 items-center">
                      <div class="col-span-3 flex items-center">
                        <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ expense.category }}</span>
                      </div>
                      <div class="col-span-3 flex items-center">
                        <span class="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">{{ expense.description
                          || '-' }}</span>
                      </div>
                      <div class="col-span-2 flex items-center">
                        <span class="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{{
                          formatDate(expense.date) }}</span>
                      </div>
                      <div class="col-span-2 flex items-center justify-end">
                        <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">₹{{
                          expense.amount.toLocaleString() }}</span>
                      </div>
                      <div class="col-span-2 flex items-center justify-end space-x-1">
                        <button @click="handleEditExpense(expense)"
                          class="p-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:text-blue-200 hover:bg-blue-50 dark:bg-blue-900/20 rounded transition-colors"
                          title="Edit expense">
                          <Edit2 class="w-3 h-3" />
                        </button>
                        <button @click="handleDeleteExpense(expense)"
                          class="p-1.5 text-red-600 dark:text-red-400 hover:text-red-800 dark:text-red-200 hover:bg-red-50 dark:bg-red-900/20 rounded transition-colors"
                          title="Delete expense">
                          <Trash2 class="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Other Expenses Pagination -->
              <div v-if="paginatedOtherExpenses.totalPages > 1"
                class="px-3 sm:px-4 py-3 border-t bg-gray-50 dark:bg-gray-900 dark:bg-gray-100">
                <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div
                    class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 text-center sm:text-left">
                    Showing {{ paginatedOtherExpenses.start }} to {{ paginatedOtherExpenses.end }} of {{
                      paginatedOtherExpenses.total }} other expenses
                  </div>
                  <div class="flex items-center space-x-2">
                    <button @click="otherPage = Math.max(1, otherPage - 1)" :disabled="otherPage === 1"
                      class="px-3 py-1 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-600 dark:bg-gray-800 dark:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] touch-manipulation">
                      Previous
                    </button>
                    <span class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 px-2">
                      {{ otherPage }} of {{ paginatedOtherExpenses.totalPages }}
                    </span>
                    <button @click="otherPage = Math.min(paginatedOtherExpenses.totalPages, otherPage + 1)"
                      :disabled="otherPage === paginatedOtherExpenses.totalPages"
                      class="px-3 py-1 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-600 dark:bg-gray-800 dark:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] touch-manipulation">
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </DisclosurePanel>
          </Disclosure>
        </div>
      </div>
    </div>

    <!-- Expense Form Modal -->
    <ExpenseForm v-if="showExpenseForm" :expense="editingExpense" @close="handleCloseExpenseForm"
      @success="handleExpenseFormSuccess" />
  </div>
</template>

<script setup lang="ts">
import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/vue"
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  ChevronUp,
  DollarSign,
  Edit2,
  FileText,
  Heart,
  Plus,
  Receipt,
  RefreshCw,
  ShoppingBag,
  Tag,
  Trash2,
} from "lucide-vue-next"
import { computed, onMounted, ref } from "vue"
import type {
  ExpenseFilters,
  FlattenedExpenseEntry,
  ProcessedExpenseItem,
} from "../../types/expense"

// Components
import { ExpenseFilter, ExpenseForm } from "../../components"

// Composables
import { useExpense } from "../../composables/useExpense"
import { useHousehold } from "../../composables/useHousehold"

// Initialize the expense composable with new system
const { expenses, analytics, loading, error, initialize, refreshData } =
  useExpense()

// Initialize household composable
const household = useHousehold()

// Pagination state
const medicalPage = ref(1)
const otherPage = ref(1)
const itemsPerPage = 20

// Local state for form management
const showExpenseForm = ref(false)
const editingExpense = ref<ProcessedExpenseItem | null>(null)

// Household profile status
const showProfileWarning = computed(
  () => !household.hasProfile.value && !household.isLoadingProfile.value,
)

// Computed properties for filtered and grouped expenses
const medicalExpenses = computed(() => {
  return expenses.value.filter(
    (expense: FlattenedExpenseEntry) => expense.type === "medical",
  )
})

const otherExpenses = computed(() => {
  return expenses.value.filter(
    (expense: FlattenedExpenseEntry) => expense.type === "other",
  )
})

const directMedicalExpenses = computed(() => {
  return medicalExpenses.value.filter(
    (expense: FlattenedExpenseEntry) => expense.is_direct === true,
  )
})

const indirectMedicalExpenses = computed(() => {
  return medicalExpenses.value.filter(
    (expense: FlattenedExpenseEntry) => expense.is_direct === false,
  )
})

// Amount calculations
const totalAmount = computed(() => {
  return expenses.value.reduce(
    (sum: number, expense: FlattenedExpenseEntry) => sum + expense.amount,
    0,
  )
})

const medicalAmount = computed(() => {
  return medicalExpenses.value.reduce(
    (sum: number, expense: FlattenedExpenseEntry) => sum + expense.amount,
    0,
  )
})

const otherAmount = computed(() => {
  return otherExpenses.value.reduce(
    (sum: number, expense: FlattenedExpenseEntry) => sum + expense.amount,
    0,
  )
})

const directMedicalAmount = computed(() => {
  return directMedicalExpenses.value.reduce(
    (sum: number, expense: FlattenedExpenseEntry) => sum + expense.amount,
    0,
  )
})

const indirectMedicalAmount = computed(() => {
  return indirectMedicalExpenses.value.reduce(
    (sum: number, expense: FlattenedExpenseEntry) => sum + expense.amount,
    0,
  )
})

const expenseCount = computed(() => expenses.value.length)

// Convert FlattenedExpenseEntry to ProcessedExpenseItem for compatibility
const processExpense = (
  expense: FlattenedExpenseEntry,
  index = 0,
): ProcessedExpenseItem => {
  return {
    id: expense.name,
    name: expense.name,
    type: expense.type,
    category: expense.category,
    description: expense.description || "",
    amount: expense.amount,
    date: expense.date_time.split(" ")[0], // Extract date part
    hasReceipt: !!expense.proof_of_payment,
    receiptUrl: expense.proof_of_payment || null,
    isDirect: expense.is_direct,
    creation: expense.creation,
    parent: expense.parent,
    household_profile: expense.household_profile,
    rawData: expense,
    docIndex: index,
    expenseIndex: index,
  }
}

// Pagination computed properties
const paginatedMedicalExpenses = computed(() => {
  const items = medicalExpenses.value.map(processExpense)
  const total = items.length
  const totalPages = Math.ceil(total / itemsPerPage)
  const start = (medicalPage.value - 1) * itemsPerPage + 1
  const end = Math.min(medicalPage.value * itemsPerPage, total)
  const paginatedItems = items.slice(
    (medicalPage.value - 1) * itemsPerPage,
    medicalPage.value * itemsPerPage,
  )

  return {
    items: paginatedItems,
    total,
    totalPages,
    start,
    end,
  }
})

const paginatedOtherExpenses = computed(() => {
  const items = otherExpenses.value.map(processExpense)
  const total = items.length
  const totalPages = Math.ceil(total / itemsPerPage)
  const start = (otherPage.value - 1) * itemsPerPage + 1
  const end = Math.min(otherPage.value * itemsPerPage, total)
  const paginatedItems = items.slice(
    (otherPage.value - 1) * itemsPerPage,
    otherPage.value * itemsPerPage,
  )

  return {
    items: paginatedItems,
    total,
    totalPages,
    start,
    end,
  }
})

// State object for template compatibility
const state = computed(() => ({
  loading: loading.value,
  error: error.value,
  rawExpenses: expenses.value,
  filteredExpenses: expenses.value,
  isEmpty: expenses.value.length === 0,
  hasFilters: false, // This would need to be implemented based on actual filters
  showExpenseForm: showExpenseForm.value,
  editingExpense: editingExpense.value,
  groupedExpenses: {
    medical: {
      items: medicalExpenses.value.map(processExpense),
      count: medicalExpenses.value.length,
      total: medicalAmount.value,
    },
    other: {
      items: otherExpenses.value.map(processExpense),
      count: otherExpenses.value.length,
      total: otherAmount.value,
    },
  },
  summary: {
    totalItems: expenseCount.value,
    totalAmount: totalAmount.value,
    medicalAmount: medicalAmount.value,
    otherAmount: otherAmount.value,
    allExpensesCount: expenses.value.length,
  },
}))

// Utility functions
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

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

const handleFiltersUpdate = async (newFilters: Partial<ExpenseFilters>) => {
  try {
    // Reset pagination when filters change
    medicalPage.value = 1
    otherPage.value = 1
    // Refresh with new filters
    await refreshData({
      withAnalytics: true,
      useCache: true,
    })
  } catch (error) {
    console.error("Failed to update filters:", error)
  }
}

const handleFiltersReset = async () => {
  try {
    // Reset pagination when filters are reset
    medicalPage.value = 1
    otherPage.value = 1
    // Refresh with cleared filters
    await refreshData({
      withAnalytics: true,
      useCache: true,
    })
  } catch (error) {
    console.error("Failed to reset filters:", error)
  }
}

const handleCacheInvalidated = async () => {
  try {
    // Force refresh bypassing cache
    await refreshData({
      withAnalytics: true,
      useCache: false,
    })
  } catch (error) {
    console.error("Failed to invalidate and refresh cache:", error)
    // If it's a household profile error, show a more user-friendly message
    if (error.message && error.message.includes("No household profile found")) {
      console.warn(
        "ExpenseAnalyzer: No household profile found, please ensure your profile is set up correctly",
      )
    }
  }
}

const handleAddExpense = () => {
  showExpenseForm.value = true
  editingExpense.value = null
}

const handleEditExpense = (expense: ProcessedExpenseItem) => {
  // Convert ProcessedExpenseItem back to FlattenedExpenseEntry for the form
  editingExpense.value = expense.rawData
  showExpenseForm.value = true
}

const handleDeleteExpense = async (expense: ProcessedExpenseItem) => {
  if (confirm("Are you sure you want to delete this expense?")) {
    try {
      // TODO: Implement delete functionality in the new system
      console.log("Delete expense:", expense)
      // After successful deletion, refresh data
      await refreshData({
        withAnalytics: true,
        useCache: false,
      })
    } catch (error) {
      console.error("Failed to delete expense:", error)
    }
  }
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

// Initialize data
onMounted(async () => {
  try {
    // Load household profile first
    await household.loadProfile()

    // If no profile exists, show warning but don't load expenses
    if (!household.profile.value) {
      console.warn("No household profile found")
      return
    }

    // Initialize expenses with analytics
    await initialize({
      withAnalytics: true,
      period: "this_month",
    })
  } catch (error) {
    console.error("Failed to initialize ExpenseAnalyzer:", error)
  }
})
</script>

<style scoped>
.expense-analyzer {
  @apply max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8;
}

/* Mobile-specific optimizations */
@media (max-width: 640px) {
  .expense-analyzer {
    @apply px-3 py-4;
  }

  .overflow-x-auto {
    -webkit-overflow-scrolling: touch;
  }

  .touch-manipulation {
    touch-action: manipulation;
  }
}

/* Focus states for better accessibility */
.touch-manipulation:focus-visible {
  @apply ring-2 ring-blue-500 ring-offset-2;
}
</style>