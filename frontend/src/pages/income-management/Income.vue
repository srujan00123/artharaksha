<template>
  <div class="income-management">
    <!-- Header Section -->
    <div class="header-section mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Income Management</h1>
          <p class="text-gray-600 dark:text-gray-400 mt-1">Manage your household income sources and track monthly earnings</p>
        </div>
        <div class="flex items-center space-x-3">
          <button 
            @click="openIncomeForm"
            :disabled="loading"
            class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Plus class="w-4 h-4 mr-2" />
            Add Income Source
          </button>
          <button 
            @click="handleRefresh"
            :disabled="loading"
            class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw class="w-4 h-4 mr-2" />
            Refresh
          </button>
          <!-- View Toggle -->
          <div class="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button 
              @click="currentView = 'sources'"
              :class="[
                'px-3 py-1 text-sm font-medium rounded-md transition-colors',
                currentView === 'sources' 
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              ]"
            >
              Sources
            </button>
            <button 
              @click="switchToLedgerView"
              :class="[
                'px-3 py-1 text-sm font-medium rounded-md transition-colors',
                currentView === 'ledger' 
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              ]"
            >
              Ledger
            </button>
            <button 
              @click="currentView = 'insights'"
              :class="[
                'px-3 py-1 text-sm font-medium rounded-md transition-colors',
                currentView === 'insights' 
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              ]"
            >
              Insights
            </button>
          </div>
          <!-- Bulk Actions -->
          <div v-if="selectedItems.length > 0" class="flex items-center space-x-2">
            <span class="text-sm text-gray-600 dark:text-gray-400">
              {{ selectedItems.length }} selected
            </span>
            <button 
              @click="showBulkActions = true"
              class="inline-flex items-center px-3 py-1 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700 transition-colors"
            >
              <Settings class="w-4 h-4 mr-1" />
              Actions
            </button>
          </div>
          <!-- Export Options -->
          <div class="relative">
            <button 
              @click="showExportMenu = !showExportMenu"
              class="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Download class="w-4 h-4 mr-2" />
              Export
            </button>
            <div v-if="showExportMenu" v-click-outside="() => showExportMenu = false" class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50">
              <div class="py-1">
                <button @click="exportData('csv')" class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                  Export as CSV
                </button>
                <button @click="exportData('pdf')" class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                  Export as PDF
                </button>
                <button @click="exportData('excel')" class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                  Export as Excel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Summary Cards with enhanced data -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <DollarSign class="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Monthly Income</p>
              <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">₹{{ actualMonthlyIncome.toLocaleString('en-IN') }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ analytics?.summary?.total_sources || 0 }} sources</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <Repeat class="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Recurring Income</p>
              <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">₹{{ recurringIncome.toLocaleString('en-IN') }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ recurringPercentage.toFixed(1) }}% of total
              </p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                <Calendar class="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">One-time Income</p>
              <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">₹{{ oneTimeIncome.toLocaleString('en-IN') }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">This period</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                <TrendingUp class="w-4 h-4 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Growth Rate</p>
              <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {{ growthRate >= 0 ? '+' : '' }}{{ growthRate.toFixed(1) }}%
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">vs last period</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Filter Section -->
    <IncomeFilter 
      :total-count="totalSources"
      :filtered-count="currentView === 'sources' ? displayedSources.length : filteredLedgerEntries.length"
      :income-types="incomeTypes"
      :current-view="currentView"
      class="mb-6"
    />

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p class="text-gray-600 dark:text-gray-400 ml-3">Loading income data...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <AlertCircle class="h-5 w-5 text-red-400" />
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800 dark:text-red-200">Error Loading Income Data</h3>
            <p class="text-sm text-red-700 dark:text-red-300 mt-1">{{ error }}</p>
          </div>
        </div>
        <div class="mt-4">
          <button 
            @click="handleRefresh"
            class="bg-red-100 dark:bg-red-900/30 hover:bg-red-200 text-red-800 dark:text-red-200 px-3 py-1 rounded text-sm transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>

    <!-- Content Section -->
    <div v-else class="income-content">
      <!-- Sources View -->
      <div v-if="currentView === 'sources'">
        <!-- Empty State -->
        <div v-if="displayedSources.length === 0" class="empty-state">
          <div class="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
            <DollarSign class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
              {{ totalSources === 0 ? 'No income sources found' : 'No income sources match your filters' }}
            </h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {{ totalSources === 0 ? 'Get started by adding your first income source.' : 'Try adjusting your filters or add a new income source.' }}
            </p>
            <div class="mt-6">
              <button 
                v-if="totalSources === 0"
                @click="openIncomeForm"
                class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <Plus class="w-4 h-4 mr-2" />
                Add Income Source
              </button>
              <button 
                v-else
                @click="clearFilters"
                class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        <!-- Income Sources List -->
        <div v-else class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
          <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-base font-medium text-gray-900 dark:text-gray-100">Income Sources</h3>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Showing {{ displayedSources.length }} of {{ totalSources }} source{{ totalSources !== 1 ? 's' : '' }} • ₹{{ actualMonthlyIncome.toLocaleString('en-IN') }} monthly
                </p>
              </div>
              <div class="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  :checked="selectedItems.length === displayedSources.length && displayedSources.length > 0"
                  :indeterminate="selectedItems.length > 0 && selectedItems.length < displayedSources.length"
                  @change="toggleSelectAll"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                >
                <span class="text-sm text-gray-600 dark:text-gray-400">Select all</span>
              </div>
            </div>
          </div>
          
          <!-- Table Header (Desktop) -->
          <div class="hidden md:grid grid-cols-12 gap-4 px-4 py-2 bg-gray-50 dark:bg-gray-900 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b">
            <div class="col-span-1"></div>
            <div class="col-span-3">Income Type</div>
            <div class="col-span-2">Amount</div>
            <div class="col-span-2">Frequency</div>
            <div class="col-span-2">Status</div>
            <div class="col-span-1">Date Added</div>
            <div class="col-span-1 text-right">Actions</div>
          </div>
          
          <!-- Table Rows -->
          <div class="divide-y divide-gray-100 dark:divide-gray-700">
            <div 
              v-for="source in displayedSources" 
              :key="source.sourceId"
              class="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              :class="{ 'bg-blue-50 dark:bg-blue-900/20': selectedItems.includes(source.sourceId) }"
            >
              <!-- Mobile Layout -->
              <div class="md:hidden space-y-2">
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      :checked="selectedItems.includes(source.sourceId)"
                      @change="handleSourceSelection(source.sourceId, $event.target.checked)"
                      class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    >
                    <h4 class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ source.type }}</h4>
                  </div>
                  <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">₹{{ source.amount.toLocaleString('en-IN') }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-2">
                    <span 
                      v-if="source.isRecurring"
                      class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
                    >
                      {{ formatFrequency(source.frequency) }}
                      <span v-if="source.stop_date" class="ml-2 text-xs text-gray-500">(ends {{ formatDate(source.stop_date) }})</span>
                    </span>
                    <span 
                      v-else
                      class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                    >
                      One-time
                    </span>
                    <span 
                      class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                      :class="source.isRecurring ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'"
                    >
                      {{ source.isRecurring ? 'Active' : 'Completed' }}
                    </span>
                  </div>
                  <span class="text-xs text-gray-500 dark:text-gray-400">{{ formatDate(source.dateTime) }}</span>
                </div>
                <div class="flex items-center justify-end space-x-1">
                  <button 
                    @click="editIncomeSource(source)"
                    class="p-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                    title="Edit income source"
                  >
                    <Edit2 class="w-3 h-3" />
                  </button>
                  <button 
                    @click="deleteIncomeSourceHandler(source)"
                    class="p-1.5 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    title="Delete income source"
                  >
                    <Trash2 class="w-3 h-3" />
                  </button>
                </div>
              </div>

              <!-- Desktop Layout -->
              <div class="hidden md:contents">
                <div class="col-span-1 flex items-center">
                  <input 
                    type="checkbox" 
                    :checked="selectedItems.includes(source.sourceId)"
                    @change="handleSourceSelection(source.sourceId, $event.target.checked)"
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  >
                </div>
                <div class="col-span-3 flex items-center">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mr-3">
                      <DollarSign class="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ source.type }}</span>
                  </div>
                </div>
                <div class="col-span-2 flex items-center">
                  <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">₹{{ source.amount.toLocaleString('en-IN') }}</span>
                </div>
                <div class="col-span-2 flex items-center">
                  <span 
                    v-if="source.isRecurring"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
                  >
                    {{ formatFrequency(source.frequency) }}
                    <span v-if="source.stop_date" class="ml-2 text-xs text-gray-500">(ends {{ formatDate(source.stop_date) }})</span>
                  </span>
                  <span 
                    v-else
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                  >
                    One-time
                  </span>
                </div>
                <div class="col-span-2 flex items-center">
                  <span 
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="source.isRecurring ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'"
                  >
                    {{ source.isRecurring ? 'Active' : 'Completed' }}
                  </span>
                </div>
                <div class="col-span-1 flex items-center">
                  <span class="text-sm text-gray-500 dark:text-gray-400">{{ formatDate(source.dateTime) }}</span>
                </div>
                <div class="col-span-1 flex items-center justify-end space-x-1">
                  <button 
                    @click="editIncomeSource(source)"
                    class="p-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                    title="Edit income source"
                  >
                    <Edit2 class="w-3 h-3" />
                  </button>
                  <button 
                    @click="deleteIncomeSourceHandler(source)"
                    class="p-1.5 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    title="Delete income source"
                  >
                    <Trash2 class="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Ledger View -->
      <div v-if="currentView === 'ledger'">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
          <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-base font-medium text-gray-900 dark:text-gray-100">Income Ledger</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              All income entries • {{ filteredLedgerEntries.length }} transactions
            </p>
          </div>
          <div class="p-4">
            <p class="text-center text-gray-500 dark:text-gray-400">
              Ledger view implementation pending - will show flattened income entries with edit capabilities
            </p>
          </div>
        </div>
      </div>

      <!-- Insights View -->
      <div v-if="currentView === 'insights'">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
          <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-base font-medium text-gray-900 dark:text-gray-100">Income Insights</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              AI-powered insights and recommendations
            </p>
          </div>
          <div class="p-4">
            <p class="text-center text-gray-500 dark:text-gray-400">
              Insights view implementation pending - will show analytics and recommendations
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <IncomeForm 
      v-if="showIncomeForm"
      :is-open="showIncomeForm"
      :editing-source="editingSource"
      @close="closeIncomeForm"
      @submit="handleIncomeSubmit"
    />

    <!-- Bulk Actions Modal -->
    <div v-if="showBulkActions" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full mx-4">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">Bulk Actions</h3>
        </div>
        <div class="p-6">
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {{ selectedItems.length }} item(s) selected
          </p>
          <div class="space-y-2">
            <button 
              @click="handleBulkDelete(selectedItems)"
              class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
            >
              Delete Selected
            </button>
            <button 
              @click="handleBulkExport('csv')"
              class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded"
            >
              Export Selected as CSV
            </button>
          </div>
        </div>
        <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button 
            @click="showBulkActions = false"
            class="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- Ledger Entry Edit Modal -->
    <div v-if="showLedgerModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full mx-4">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">Edit Ledger Entry</h3>
        </div>
        <div class="p-6">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Ledger entry editing functionality will be implemented here.
          </p>
        </div>
        <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-2">
          <button 
            @click="closeLedgerModal"
            class="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            Cancel
          </button>
          <button 
            @click="handleLedgerSubmit({})"
            class="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
	AlertCircle,
	Calendar,
	DollarSign,
	Download,
	Edit2,
	Hash,
	Plus,
	RefreshCw,
	Repeat,
	Settings,
	Trash2,
	TrendingUp,
} from "lucide-vue-next"
import { computed, onMounted, ref, watch } from "vue"

// Components
import { IncomeFilter, IncomeForm } from "../../components/income"

// Note: These components would need to be created separately
// import { IncomeSourcesView, IncomeLedgerView, IncomeInsightsView, BulkActionsModal, LedgerEntryModal } from "../../components/income"

// Composables
import { useIncome } from "../../composables/useIncome"
import type {
	AddIncomeSourcePayload,
	DeleteIncomeSourcePayload,
	FlattenedLedgerEntry,
	IncomeFormUIData,
	IncomeSourceFormData,
	ProcessedIncomeItem,
	UpdateIncomeSourcePayload,
} from "../../types/income"
import { safeArray } from "../../types/income"

const {
	incomes,
	incomeTypes,
	loading,
	error,
	totalIncome,
	recurringIncome,
	oneTimeIncome,
	totalSources,
	allSources,
	filteredSources,
	filteredLedgerEntries,
	analytics,
	incomeInsights,
	fetchIncome,
	fetchIncomeWithAnalytics,
	fetchIncomeLedger,
	fetchIncomeInsights,
	addIncomeSource,
	updateIncomeSource,
	deleteIncomeSource,
	updateFilters,
	clearFilters,
	refreshData,
	invalidateCache,
	initialize,
} = useIncome()

// View management
const currentView = ref<'sources' | 'ledger' | 'insights'>('sources')
const showIncomeForm = ref(false)
const editingSource = ref<ProcessedIncomeItem | null>(null)
const showBulkActions = ref(false)
const showLedgerModal = ref(false)
const editingLedgerEntry = ref<FlattenedLedgerEntry | null>(null)
const showExportMenu = ref(false)

// Selection management
const selectedItems = ref<string[]>([])
const selectedLedgerItems = ref<string[]>([])

// Enhanced computed properties
const actualMonthlyIncome = computed(() => {
	// Calculate from analytics or fallback to totalIncome from recurring sources only
	if (analytics.value?.recurring_income) {
		return analytics.value.recurring_income
	}
	// Fallback: calculate from recurring sources
	return safeArray(incomes.value).reduce((total, income) => {
		const recurringAmount = safeArray(income.income_source)
			.filter(source => source.recur === 1 || source.recur === true)
			.reduce((subtotal, source) => subtotal + Number(source.income || 0), 0)
		return total + recurringAmount
	}, 0)
})

const recurringPercentage = computed(() => {
	const total = actualMonthlyIncome.value + oneTimeIncome.value
	return total > 0 ? (recurringIncome.value / total) * 100 : 0
})

const growthRate = computed(() => {
	const trends = analytics.value?.monthly_trends || []
	if (trends.length < 2) return 0
	
	const recent = trends[trends.length - 1]?.total || 0
	const previous = trends[trends.length - 2]?.total || 0
	
	return previous > 0 ? ((recent - previous) / previous) * 100 : 0
})

// Convert allSources to displayable format with better error handling
const displayedSources = computed(() => {
	return safeArray(filteredSources.value).map((source, index) => ({
		sourceId: source.name || `source-${index}`,
		incomeId: "",
		type: source.type || "Unknown",
		amount: Number(source.income || 0),
		isRecurring: source.recur === 1 || source.recur === true,
		dateTime: source.date_time || "",
		frequency: source.recur_frequency || "",
		stop_date: source.stop_date,
		name: source.name,
		createdAt: "",
		updatedAt: "",
	}))
})

// View switching
const switchToLedgerView = async () => {
	currentView.value = 'ledger'
	if (filteredLedgerEntries.value.length === 0) {
		await fetchIncomeLedger()
	}
}

// Selection handlers
const handleSourceSelection = (sourceId: string, selected: boolean) => {
	if (selected) {
		if (!selectedItems.value.includes(sourceId)) {
			selectedItems.value.push(sourceId)
		}
	} else {
		const index = selectedItems.value.indexOf(sourceId)
		if (index > -1) {
			selectedItems.value.splice(index, 1)
		}
	}
}

const handleLedgerSelection = (entryId: string, selected: boolean) => {
	if (selected) {
		if (!selectedLedgerItems.value.includes(entryId)) {
			selectedLedgerItems.value.push(entryId)
		}
	} else {
		const index = selectedLedgerItems.value.indexOf(entryId)
		if (index > -1) {
			selectedLedgerItems.value.splice(index, 1)
		}
	}
}

// Bulk operations
const handleBulkDelete = async (itemIds: string[]) => {
	if (currentView.value === 'sources') {
		for (const sourceId of itemIds) {
			const source = displayedSources.value.find(s => s.sourceId === sourceId)
			if (source) {
				await deleteIncomeSourceHandler(source)
			}
		}
	} else if (currentView.value === 'ledger') {
		// Handle bulk ledger deletion
		for (const entryId of itemIds) {
			await deleteLedgerEntry(entryId)
		}
	}
	selectedItems.value = []
	selectedLedgerItems.value = []
	showBulkActions.value = false
}

const handleBulkUpdate = async (updateData: any) => {
	// Implementation for bulk updates
	console.log('Bulk update:', updateData)
	showBulkActions.value = false
}

const handleBulkExport = async (format: 'csv' | 'pdf' | 'excel') => {
	const itemsToExport = currentView.value === 'sources' 
		? displayedSources.value.filter(s => selectedItems.value.includes(s.sourceId))
		: filteredLedgerEntries.value.filter(e => selectedLedgerItems.value.includes(e.name))
	
	await exportData(format, itemsToExport)
	showBulkActions.value = false
}

// Export functionality
const exportData = async (format: 'csv' | 'pdf' | 'excel', customData?: any[]) => {
	const dataToExport = customData || (currentView.value === 'sources' ? displayedSources.value : filteredLedgerEntries.value)
	
	try {
		if (format === 'csv') {
			await exportToCSV(dataToExport)
		} else if (format === 'pdf') {
			await exportToPDF(dataToExport)
		} else if (format === 'excel') {
			await exportToExcel(dataToExport)
		}
	} catch (error) {
		console.error(`Export failed:`, error)
		alert(`Failed to export data as ${format.toUpperCase()}`)
	}
	showExportMenu.value = false
}

const exportToCSV = async (data: any[]) => {
	const csvContent = convertToCSV(data)
	downloadFile(csvContent, `income-${currentView.value}-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv')
}

const exportToPDF = async (data: any[]) => {
	// Implementation would require a PDF library like jsPDF
	console.log('PDF export not implemented yet')
}

const exportToExcel = async (data: any[]) => {
	// Implementation would require a library like xlsx
	console.log('Excel export not implemented yet')
}

const convertToCSV = (data: any[]): string => {
	if (data.length === 0) return ''
	
	const headers = Object.keys(data[0])
	const csvRows = [
		headers.join(','),
		...data.map(row => headers.map(header => {
			const value = row[header]
			return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
		}).join(','))
	]
	
	return csvRows.join('\n')
}

const downloadFile = (content: string, filename: string, mimeType: string) => {
	const blob = new Blob([content], { type: mimeType })
	const url = URL.createObjectURL(blob)
	const link = document.createElement('a')
	link.href = url
	link.download = filename
	document.body.appendChild(link)
	link.click()
	document.body.removeChild(link)
	URL.revokeObjectURL(url)
}

const exportLedgerData = async (format: 'csv' | 'pdf' | 'excel') => {
	await exportData(format)
}

// Ledger management
const editLedgerEntry = (entry: FlattenedLedgerEntry) => {
	editingLedgerEntry.value = entry
	showLedgerModal.value = true
}

const deleteLedgerEntry = async (entryId: string) => {
	if (confirm('Are you sure you want to delete this ledger entry?')) {
		try {
			// Implementation would call backend API to delete ledger entry
			console.log('Delete ledger entry:', entryId)
			await invalidateCache({ ledgerData: true })
		} catch (error) {
			console.error('Failed to delete ledger entry:', error)
			alert('Failed to delete ledger entry. Please try again.')
		}
	}
}

const closeLedgerModal = () => {
	showLedgerModal.value = false
	editingLedgerEntry.value = null
}

const handleLedgerSubmit = async (ledgerData: any) => {
	try {
		// Implementation would call backend API to update ledger entry
		console.log('Update ledger entry:', ledgerData)
		await invalidateCache({ ledgerData: true })
		closeLedgerModal()
	} catch (error) {
		console.error('Failed to update ledger entry:', error)
		alert('Failed to update ledger entry. Please try again.')
	}
}

// Utility functions
const formatDate = (dateString: string) => {
	if (!dateString) return "N/A"
	try {
		return new Date(dateString).toLocaleDateString("en-IN", {
			year: "numeric",
			month: "short",
			day: "numeric",
		})
	} catch {
		return "N/A"
	}
}

const formatFrequency = (frequency?: string) => {
	if (!frequency) return "Monthly"

	const frequencyMap: Record<string, string> = {
		daily: "Daily",
		weekly: "Weekly",
		"bi-weekly": "Bi-weekly",
		monthly: "Monthly",
		quarterly: "Quarterly",
		"semi-annually": "Semi-annually",
		annually: "Annually",
		yearly: "Yearly",
	}

	return (
		frequencyMap[frequency] ||
		frequency.charAt(0).toUpperCase() + frequency.slice(1)
	)
}

const handleRefresh = async () => {
	await refreshData({ withAnalytics: true, withInsights: true })
}

const openIncomeForm = () => {
	editingSource.value = null
	showIncomeForm.value = true
}

const closeIncomeForm = () => {
	showIncomeForm.value = false
	editingSource.value = null
}

const editIncomeSource = (source: ProcessedIncomeItem) => {
	editingSource.value = {
		...source,
		isRecurring: source.isRecurring || false,
		frequency: source.frequency || "",
	}
	showIncomeForm.value = true
}

const handleIncomeSubmit = async (formData: IncomeFormUIData) => {
	try {
		// Find the main income record (there should be only one per household)
		const mainIncomeRecord = incomes.value[0]
		if (!mainIncomeRecord) {
			throw new Error("No income record found for household")
		}

		// Prepare income source data in correct format
		const sourceData: IncomeSourceFormData = {
			type: formData.type,
			income: formData.amount,
			recur: formData.isRecurring,
			date_time: formData.dateTime,
			recur_frequency: formData.frequency,
			stop_date: formData.stop_date,
		}

		if (editingSource.value) {
			// Update existing source
			const payload: UpdateIncomeSourcePayload = {
				income_source: [sourceData],
				income_name: mainIncomeRecord.name,
				source_name: editingSource.value.sourceId,
			}
			await updateIncomeSource(payload)
		} else {
			// Add new source
			const payload: AddIncomeSourcePayload = {
				income_source: [sourceData],
				income_name: mainIncomeRecord.name,
			}
			await addIncomeSource(payload)
		}

		await invalidateCache({ incomeData: true, analytics: true })
		closeIncomeForm()
	} catch (error) {
		console.error("Failed to save income:", error)
		alert("Failed to save income. Please try again.")
		throw error
	}
}

const deleteIncomeSourceHandler = async (source: ProcessedIncomeItem) => {
	if (
		confirm(
			`Are you sure you want to delete the ${source.type} income source (₹${source.amount.toLocaleString("en-IN")})?`,
		)
	) {
		try {
			// Find the main income record
			const mainIncomeRecord = incomes.value[0]
			if (!mainIncomeRecord) {
				throw new Error("No income record found for household")
			}

			const payload: DeleteIncomeSourcePayload = {
				income_source: [],
				income_name: mainIncomeRecord.name,
				action: "delete",
				source_name: source.sourceId,
			}
			await deleteIncomeSource(payload)
			await invalidateCache({ incomeData: true, analytics: true })
		} catch (error) {
			console.error("Failed to delete income source:", error)
			alert("Failed to delete income source. Please try again.")
		}
	}
}

// Toggle select all functionality
const toggleSelectAll = (event: Event) => {
	const target = event.target as HTMLInputElement
	if (target.checked) {
		selectedItems.value = displayedSources.value.map(source => source.sourceId)
	} else {
		selectedItems.value = []
	}
}

// Watch for view changes to clear selections
watch(currentView, () => {
	selectedItems.value = []
	selectedLedgerItems.value = []
})

onMounted(async () => {
	await initialize({ withAnalytics: true, forceRefresh: false })
})
</script>

<style scoped>
.income-management {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8;
}
</style>