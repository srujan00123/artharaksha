<template>
    <div class="dashboard-container max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 overflow-visible">
        <!-- Header Section -->
        <div class="dashboard-header mb-4 overflow-visible">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-xl font-bold text-gray-900 dark:text-slate-100">Dashboard</h1>
                    <p class="text-gray-600 dark:text-gray-400 dark:text-gray-500 mt-0.5 text-sm">{{ currentDate }}</p>
                </div>
                <div class="flex items-center space-x-2">
                    <button @click="refreshDashboard" :disabled="isLoading"
                        class="btn-primary inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg disabled:opacity-50 transition-colors">
                        <RefreshCw class="w-4 h-4 mr-2" />
                        Refresh Dashboard
                    </button>
                </div>
            </div>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="flex items-center justify-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span class="ml-3 text-gray-600 dark:text-gray-400 dark:text-gray-500">Loading dashboard...</span>
        </div>

        <!-- Error State -->
        <div v-else-if="hasError"
            class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
            <div class="flex">
                <AlertCircle class="h-5 w-5 text-red-400" />
                <div class="ml-3">
                    <h3 class="text-sm font-medium text-red-800 dark:text-red-200">Error loading dashboard</h3>
                    <p class="mt-1 text-sm text-red-700 dark:text-red-300">{{ errorMessage }}</p>
                    <div class="mt-2">
                        <button @click="refreshDashboard"
                            class="btn-danger inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg transition-colors">
                            <RefreshCw class="w-4 h-4 mr-2" />
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Dashboard Content -->
        <div v-else>
            <!-- Welcome Banner with User Info -->
            <div
                class="bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl p-3 sm:p-4 lg:p-5 text-white dark:text-black mb-4">
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <h1 class="text-lg sm:text-xl lg:text-2xl font-bold mb-1">
                            Welcome back, {{ userDisplayName }}!
                        </h1>
                        <p class="text-blue-100 text-sm sm:text-base mb-3 max-w-3xl leading-relaxed">
                            Your comprehensive healthcare financial protection dashboard. Track expenses, manage income,
                            monitor applications, and access welfare schemes.
                        </p>
                        <div class="flex items-center space-x-4 text-blue-100 text-sm">
                            <div class="flex items-center">
                                <Calendar class="w-4 h-4 mr-1" />
                                <span>{{ currentDate }}</span>
                            </div>
                            <div class="flex items-center">
                                <Clock class="w-4 h-4 mr-1" />
                                <span>Last updated: {{ lastUpdated }}</span>
                            </div>
                        </div>
                    </div>
                    <div class="hidden sm:block">
                        <div
                            class="w-12 h-12 bg-white dark:bg-gray-800 dark:bg-gray-200 bg-opacity-20 rounded-full flex items-center justify-center">
                            <User class="w-6 h-6 text-white dark:text-black" />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Date Range Filter -->
            <Card class="p-3 sm:p-4 mb-4 bg-white dark:bg-slate-800">
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100">Dashboard Filters</h3>
                        <p class="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Filter data by date
                            range or period</p>
                    </div>
                    <div class="flex flex-col sm:flex-row gap-2 sm:items-center">
                        <div class="flex items-center space-x-2">
                            <label
                                class="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">From:</label>
                            <input v-model="dashboardFilters.dateFrom" type="date"
                                class="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:ring-blue-400 dark:focus:ring-blue-400 focus:border-transparent"
                                @change="handleDateFilterChange" />
                        </div>
                        <div class="flex items-center space-x-2">
                            <label
                                class="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">To:</label>
                            <input v-model="dashboardFilters.dateTo" type="date"
                                class="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:ring-blue-400 dark:focus:ring-blue-400 focus:border-transparent"
                                @change="handleDateFilterChange" />
                        </div>
                        <div class="flex items-center space-x-2">
                            <label
                                class="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">Period:</label>
                            <select v-model="selectedPeriod" @change="handlePeriodChange"
                                class="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:ring-blue-400 dark:focus:ring-blue-400 focus:border-transparent">
                                <option v-for="option in periodOptions" :key="option.value" :value="option.value">
                                    {{ option.label }}
                                </option>
                            </select>
                        </div>
                        <div class="flex space-x-2">
                            <button @click="resetDateFilters"
                                class="btn-outline inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg transition-colors">
                                <RefreshCw class="w-4 h-4 mr-2" />
                                Reset
                            </button>
                            <button @click="applyCurrentMonthFilter"
                                class="btn-primary inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg transition-colors">
                                <Calendar class="w-4 h-4 mr-2" />
                                This Month
                            </button>
                        </div>
                    </div>
                </div>
            </Card>

            <!-- Key Metrics Overview -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                <!-- Monthly Income -->
                <MetricCard title="Total Income" :value="totalMonthlyIncome" :icon="TrendingUp" color="green"
                    :clickable="true" :show-progress="true" :progress-percentage="75" :currency="true"
                    @click="navigateToIncome">
                    <template #subtitle>
                        <span class="text-xs text-green-600 dark:text-green-400">{{
                            formatCurrency(totalRecurringIncomeValue) }} recurring</span>
                        <span class="text-xs text-gray-400 dark:text-gray-500">•</span>
                        <span class="text-xs text-blue-600 dark:text-blue-400">{{
                            formatCurrency(totalOneTimeIncomeValue) }} one-time</span>
                    </template>
                </MetricCard>

                <!-- Total Expenses -->
                <MetricCard title="Total Expenses" :value="totalExpenseAmountValue" :icon="PieChart" color="blue"
                    :clickable="true" :show-progress="true" :progress-percentage="expensePercentage" :currency="true"
                    :footer="`${expensePercentage}% of income`" @click="navigateToExpenses">
                    <template #subtitle>
                        <span class="text-xs text-blue-600 dark:text-blue-400">{{ medicalExpenseCount }} medical</span>
                        <span class="text-xs text-gray-400 dark:text-gray-500">•</span>
                        <span class="text-xs text-purple-600 dark:text-purple-400">{{ otherExpenseCount }} other</span>
                    </template>
                </MetricCard>

                <!-- Applications Status -->
                <MetricCard title="Applications" :value="totalApplications" :icon="FileText" color="orange"
                    :clickable="true" @click="navigateToApplications">
                    <template #subtitle>
                        <span class="text-xs text-orange-600 dark:text-orange-400">{{ pendingApplications }}
                            pending</span>
                        <span class="text-xs text-green-600 dark:text-green-400">{{ approvedApplications }}
                            approved</span>
                    </template>
                    <template #footer>
                        <div class="flex items-center justify-between">
                            <div class="flex space-x-1">
                                <div class="w-2 h-2 bg-orange-400 rounded-full" v-if="pendingApplications > 0"></div>
                                <div class="w-2 h-2 bg-green-400 rounded-full" v-if="approvedApplications > 0"></div>
                                <div class="w-2 h-2 bg-red-400 rounded-full" v-if="rejectedApplications > 0"></div>
                            </div>
                        </div>
                    </template>
                </MetricCard>

                <!-- Claims & Benefits -->
                <MetricCard title="Claims & Benefits" :value="totalBenefitsReceived" :icon="CreditCard" color="purple"
                    :clickable="true" :footer="`${claimsSuccessRate}% success rate`" :currency="true"
                    @click="navigateToClaims">
                    <template #subtitle>
                        <span class="text-xs text-purple-600 dark:text-purple-400">{{ totalClaims }} claims</span>
                        <span class="text-xs text-green-600 dark:text-green-400">{{ approvedClaims }} approved</span>
                    </template>
                </MetricCard>
            </div>

            <!-- CHE Alert -->
            <div v-if="cheRatio > 10"
                class="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-3 rounded-lg shadow dark:shadow-gray-900/20-sm dark:shadow dark:shadow-gray-900/20-gray-900/20 mb-4">
                <div class="flex">
                    <AlertTriangle class="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div class="ml-3 flex-1">
                        <h3 class="text-sm font-medium text-red-800 dark:text-red-200">Catastrophic Health Expenditure
                            Alert</h3>
                        <p class="mt-1 text-sm text-red-700 dark:text-red-300 leading-relaxed">
                            Your healthcare expenses ({{ cheRatio }}%) exceed the recommended threshold.
                            Consider exploring available welfare schemes and insurance options.
                        </p>
                        <div class="mt-3 flex flex-wrap gap-2">
                            <button @click="navigateToPrograms"
                                class="btn-warning inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg transition-colors">
                                <Shield class="w-4 h-4 mr-2" />
                                Browse Schemes
                            </button>
                            <button @click="navigateToApplications"
                                class="btn-danger inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg transition-colors">
                                <FileText class="w-4 h-4 mr-2" />
                                Apply for Support
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 🚀 FIXED: Quick Actions with proper loading states and household profile checks -->
            <Card class="p-3 sm:p-4 mb-4 bg-white dark:bg-slate-800">
                <div class="flex items-center justify-between mb-3">
                    <h3 class="text-base font-semibold text-gray-900 dark:text-slate-100">Quick Actions</h3>
                    <span class="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 hidden sm:block">Get things
                        done faster</span>
                </div>

                <!-- Profile Alert if no household profile -->
                <div v-if="!hasProfile && !householdLoading"
                    class="mb-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <div class="flex items-start">
                        <AlertTriangle class="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 mr-2 flex-shrink-0" />
                        <div class="flex-1">
                            <p class="text-sm font-medium text-amber-800 dark:text-amber-200">Profile Required</p>
                            <p class="text-sm text-amber-700 dark:text-amber-300 mt-1">Create a household profile to
                                access all features.</p>
                            <button @click="router.push('/profile/create')"
                                class="btn-primary inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg transition-colors mt-2">
                                <User class="w-4 h-4 mr-2" />
                                Create Profile
                            </button>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 lg:gap-3">
                    <!-- Add Expense -->
                    <QuickActionButton @click="navigateToExpenseForm" icon="Plus" label="Add Expense" color="blue"
                        :loading="quickActionLoading.expense" :disabled="!hasProfile && !householdLoading" />

                    <!-- Add Income -->
                    <QuickActionButton @click="navigateToIncomeForm" icon="TrendingUp" label="Add Income" color="green"
                        :loading="quickActionLoading.income" :disabled="!hasProfile && !householdLoading" />

                    <!-- New Application -->
                    <QuickActionButton @click="navigateToNewApplication" icon="FileText" label="New Application"
                        color="orange" :loading="quickActionLoading.application"
                        :disabled="!hasProfile && !householdLoading" />

                    <!-- Submit Claim -->
                    <QuickActionButton @click="navigateToNewClaim" icon="CreditCard" label="Submit Claim" color="purple"
                        :loading="quickActionLoading.claim" :disabled="!hasProfile && !householdLoading" />

                    <!-- Browse Schemes -->
                    <QuickActionButton @click="navigateToPrograms" icon="Shield" label="Browse Schemes" color="indigo"
                        :loading="quickActionLoading.program" />

                    <!-- Health Profile -->
                    <QuickActionButton @click="navigateToConditions" icon="Heart" label="Health Profile" color="pink"
                        :loading="quickActionLoading.health" :disabled="!hasProfile && !householdLoading" />
                </div>
            </Card>
        </div>

        <!-- Main Content Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4">
            <!-- Recent Activity (2/3 width) -->
            <div class="lg:col-span-2">
                <Card class="bg-white dark:bg-slate-800">
                    <div class="p-3 lg:p-4">
                        <div class="flex items-center justify-between mb-3">
                            <h3 class="text-base font-semibold text-gray-900 dark:text-slate-100">Recent Activity</h3>
                            <div class="flex space-x-2">
                                <div class="flex items-center space-x-2">
                                    <button @click="refreshDashboard" :disabled="isLoading"
                                        class="btn-primary inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg disabled:opacity-50 transition-colors">
                                        <RefreshCw class="w-4 h-4 mr-2" />
                                        Refresh
                                    </button>
                                </div>
                                <button @click="navigateToExpenses"
                                    class="btn-outline inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg transition-colors">
                                    View All
                                </button>
                            </div>
                        </div>

                        <div class="space-y-2">

                            <!-- Recent Expenses -->
                            <div v-for="expense in recentExpenses" :key="`expense-${expense.name}`"
                                class="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:bg-blue-900/30 transition-colors cursor-pointer"
                                @click="navigateToExpenseDetail(expense.name)">
                                <div class="flex items-center space-x-3">
                                    <div
                                        class="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                                        <PieChart class="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <p class="font-medium text-gray-900 dark:text-gray-100">{{ expense.category ||
                                            'Medical Expense' }}</p>
                                        <p class="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{{
                                            formatDate(expense.date_time) }}</p>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <p class="font-semibold text-gray-900 dark:text-gray-100">₹{{
                                        formatCurrency(expense.amount) }}</p>
                                    <p class="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">{{
                                        expense.provider || 'Healthcare' }}</p>
                                </div>
                            </div>

                            <!-- Recent Income -->
                            <div v-for="income in recentIncomeEntries" :key="`income-${income.name}`"
                                class="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:bg-green-900/30 transition-colors cursor-pointer"
                                @click="navigateToIncomeDetail(income.name)">
                                <div class="flex items-center space-x-3">
                                    <div
                                        class="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                        <TrendingUp class="w-4 h-4 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div>
                                        <p class="font-medium text-gray-900 dark:text-gray-100">{{ income.type ||
                                            'Income' }}</p>
                                        <p class="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{{
                                            formatDate(income.date_time) }}</p>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <p class="font-semibold text-green-600 dark:text-green-400">+₹{{
                                        formatCurrency(income.amount) }}</p>
                                    <p class="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">{{
                                        income.frequency || 'One-time' }}</p>
                                </div>
                            </div>

                            <!-- Recent Applications -->
                            <div v-for="application in recentApplications" :key="`app-${application.name}`"
                                class="flex items-center justify-between p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors cursor-pointer"
                                @click="navigateToApplicationDetail(application.name)">
                                <div class="flex items-center space-x-3">
                                    <div
                                        class="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                                        <FileText class="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                    </div>
                                    <div>
                                        <p class="font-medium text-gray-900 dark:text-gray-100">{{
                                            getSchemeDisplayName(application) }}</p>
                                        <p class="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{{
                                            formatDate(application.date_applied) }}</p>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <span :class="getStatusBadgeClass(application.status)"
                                        class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium">
                                        {{ getStatusLabel(application.status) }}
                                    </span>
                                </div>
                            </div>

                            <!-- Recent Claims -->
                            <div v-for="claim in recentClaims" :key="`claim-${claim.name}`"
                                class="flex items-center justify-between p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors cursor-pointer"
                                @click="navigateToClaimDetail(claim.name)">
                                <div class="flex items-center space-x-3">
                                    <div
                                        class="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                                        <CreditCard class="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div>
                                        <p class="font-medium text-gray-900 dark:text-gray-100">{{
                                            getSchemeDisplayName(claim) }}</p>
                                        <p class="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{{
                                            formatDate(claim.claim_date) }}</p>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <p class="font-semibold text-purple-600 dark:text-purple-400">₹{{
                                        formatCurrency(claim.approved_amount || claim.claim_amount) }}</p>
                                    <span :class="getStatusBadgeClass(claim.status)"
                                        class="inline-flex items-center px-1 py-0.5 rounded text-xs font-medium">
                                        {{ getStatusLabel(claim.status) }}
                                    </span>
                                </div>
                            </div>

                            <!-- Empty State -->
                            <div v-if="!hasRecentActivity"
                                class="text-center py-8 text-gray-500 dark:text-gray-400 dark:text-gray-500">
                                <Clock class="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                                <p class="text-lg font-medium">No recent activity</p>
                                <p class="text-sm">Start by adding an expense or income entry</p>
                                <div class="mt-4 flex justify-center space-x-3">
                                    <button @click="navigateToExpenseForm" :disabled="!hasProfile && !householdLoading"
                                        class="btn-primary inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
                                        <Plus class="w-4 h-4 mr-2" />
                                        Add Expense
                                    </button>
                                    <button @click="navigateToIncomeForm" :disabled="!hasProfile && !householdLoading"
                                        class="btn-success inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
                                        <TrendingUp class="w-4 h-4 mr-2" />
                                        Add Income
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            <!-- Financial Health Summary (1/3 width) -->
            <div class="lg:col-span-1">
                <Card class="bg-white dark:bg-slate-800">
                    <div class="p-3 lg:p-4">
                        <h3 class="text-base font-semibold text-gray-900 dark:text-slate-100 mb-3">Financial Health</h3>
                        <div class="space-y-3">
                            <!-- Healthcare Expense Ratio -->
                            <div>
                                <div class="flex items-center justify-between mb-1">
                                    <span
                                        class="text-sm font-medium text-gray-600 dark:text-gray-400 dark:text-gray-500">Healthcare
                                        Expense Ratio</span>
                                    <span class="text-sm font-bold text-gray-900 dark:text-gray-100">{{ cheRatio
                                        }}%</span>
                                </div>
                                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div class="h-2 rounded-full transition-all duration-300"
                                        :class="getCHEColorClass(cheRatio)"
                                        :style="`width: ${Math.min(cheRatio, 100)}%`">
                                    </div>
                                </div>
                                <p class="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-1">{{
                                    getCHEStatusText(cheRatio) }}</p>
                            </div>

                            <!-- Income vs Expenses -->
                            <div>
                                <div class="flex items-center justify-between mb-1">
                                    <span
                                        class="text-sm font-medium text-gray-600 dark:text-gray-400 dark:text-gray-500">Monthly
                                        Balance</span>
                                    <span class="text-sm font-bold"
                                        :class="monthlyBalance >= 0 ? 'text-green-600' : 'text-red-600'">
                                        {{ monthlyBalance >= 0 ? '+' : '' }}₹{{ formatCurrency(Math.abs(monthlyBalance))
                                        }}
                                    </span>
                                </div>
                                <div class="space-y-1">
                                    <div class="flex justify-between text-xs">
                                        <span class="text-green-600 dark:text-green-400">Income: {{
                                            formatCurrency(totalMonthlyIncome) }}</span>
                                        <span class="text-red-600 dark:text-red-400">Expenses: {{
                                            formatCurrency(totalExpenseAmountValue) }}</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Savings Rate -->
                            <div>
                                <div class="flex items-center justify-between mb-1">
                                    <span
                                        class="text-sm font-medium text-gray-600 dark:text-gray-400 dark:text-gray-500">Savings
                                        Rate</span>
                                    <span class="text-sm font-bold text-gray-900 dark:text-gray-100">{{ savingsRate
                                        }}%</span>
                                </div>
                                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div class="h-2 rounded-full transition-all duration-300"
                                        :class="savingsRate > 20 ? 'bg-green-500' : savingsRate > 10 ? 'bg-yellow-500' : 'bg-red-500'"
                                        :style="`width: ${Math.min(Math.abs(savingsRate), 100)}%`">
                                    </div>
                                </div>
                                <p class="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-1">
                                    {{ savingsRate > 20 ? 'Excellent' : savingsRate > 10 ? 'Good' : 'Needs improvement'
                                    }}
                                </p>
                            </div>

                            <!-- Support Programs -->
                            <div>
                                <div class="flex items-center justify-between mb-1">
                                    <span
                                        class="text-sm font-medium text-gray-600 dark:text-gray-400 dark:text-gray-500">Available
                                        Support</span>
                                    <button @click="navigateToPrograms"
                                        class="btn-outline inline-flex items-center px-2 py-1 text-xs font-medium rounded transition-colors">
                                        <Shield class="w-4 h-4 mr-1" />
                                        Browse
                                    </button>
                                </div>
                                <p class="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-1">{{
                                    eligibleSchemesCount }} schemes available</p>
                                <div class="space-y-1">
                                    <div class="flex justify-between text-xs">
                                        <span>Applications: {{ totalApplications }}</span>
                                        <span class="text-green-600 dark:text-green-400">{{ approvedApplications }}
                                            approved</span>
                                    </div>
                                    <div class="flex justify-between text-xs">
                                        <span>Claims: {{ totalClaims }}</span>
                                        <span class="text-purple-600 dark:text-purple-400">₹{{
                                            formatCurrency(totalBenefitsReceived) }} received</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Quick Health Actions -->
                            <div class="pt-3 border-t border-gray-200 dark:border-gray-700">
                                <h4 class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Quick Health
                                    Actions</h4>
                                <div class="space-y-1">
                                    <button @click="navigateToConditions"
                                        class="btn-outline w-full justify-start inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors">
                                        <Heart class="w-4 h-4 mr-2" />
                                        Manage Health Conditions
                                    </button>
                                    <button @click="navigateToExpenseAnalyzer"
                                        class="btn-outline w-full justify-start inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors">
                                        <BarChart class="w-4 h-4 mr-2" />
                                        Expense Analytics
                                    </button>
                                    <button @click="navigateToIncomeReports"
                                        class="btn-outline w-full justify-start inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors">
                                        <TrendingUp class="w-4 h-4 mr-2" />
                                        Income Reports
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    </div>
</template>

<script setup>
import QuickActionButton from "@/components/QuickActionButton.vue"
import { useAdvancedTheme } from "@/composables/useAdvancedTheme"
import { useExpense } from "@/composables/useExpense"
import { useHousehold } from "@/composables/useHousehold"
import { useIncome } from "@/composables/useIncome"

import { useSupport } from "@/composables/useSupport"
import { useUserStore } from "@/stores/user"
import { getSchemeDisplayName, getStatusLabel } from "@/types/support"
import {
    calculateCHE,
    formatCurrency,
    formatDate,
    getCHEColorClass,
    getCHEStatusText,
} from "@/utils"
import { Card } from "frappe-ui"
import {
    AlertCircle,
    AlertTriangle,
    BarChart,
    Calendar,
    ChevronRight,
    Clock,
    CreditCard,
    FileText,
    Heart,
    PieChart,
    Plus,
    RefreshCw,
    Shield,
    TrendingUp,
    User,
} from "lucide-vue-next"
import { computed, onMounted, ref, watch } from "vue"
import { useRouter } from "vue-router"

// Router for navigation
const router = useRouter()

// Use stores and composables
const userStore = useUserStore()

// Use composables with proper initialization
const income = useIncome({ autoInitialize: false })
const expense = useExpense({ autoInitialize: false })
const support = useSupport()
const household = useHousehold()

// Destructure composable methods and state properly
const {
    initialize: initializeIncome,
    getAnalytics,
    setPeriod,
    incomes,
    totalIncome,
    recurringIncome,
    oneTimeIncome,
    totalSources,
    filteredSources,
    loading: incomeLoading,
    error: incomeError,
    updateFilters: updateIncomeFilters,
    ledgerEntries,
} = income

const {
    initialize: initializeExpense,
    expenses,
    totalAmount: totalExpenseAmount,
    medicalExpenses,
    otherExpenses,
    loading: expenseLoading,
    error: expenseError,
    updateFilters: updateExpenseFilters,
} = expense

const {
    initialize: initializeSupport,
    applications,
    claims,
    eligibleSchemes,
    loading: supportLoading,
    errors: supportErrors,
} = support

const {
    profile: householdProfile,
    hasProfile,
    loading: householdLoading,
    error: householdError,
    loadProfile: loadHouseholdProfileData,
} = household

// 🚀 FIXED: Enhanced loading and error states
const isLoading = ref(true)
const hasError = ref(false)
const errorMessage = ref("")
const lastUpdated = ref("")

// 🚀 FIXED: Dashboard filters with proper initialization
const dashboardFilters = ref({
    dateFrom: "",
    dateTo: "",
    period: "this_month",
})

// 🚀 FIXED: Enhanced computed properties with proper null checks
const currentDate = computed(() =>
    new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    }),
)

// User info
const userDisplayName = computed(() => userStore.userDisplayName || "User")

// Updated: Use proper income composable values with ref handling
const totalMonthlyIncome = computed(() => {
    return totalIncome?.value || 0
})

const totalRecurringIncomeValue = computed(() => {
    return recurringIncome?.value || 0
})

const totalOneTimeIncomeValue = computed(() => {
    return oneTimeIncome?.value || 0
})

// 🚀 NEW: Calculate income progress percentage based on composition
const incomeProgressPercentage = computed(() => {
    const total = totalMonthlyIncome.value
    const recurring = totalRecurringIncomeValue.value

    if (total === 0) return 0

    // Simple calculation: show progress based on recurring vs total ratio
    const recurringRatio = recurring / total
    return Math.min(Math.round(recurringRatio * 100), 100)
})

// Analytics data for additional insights when needed
const analyticsData = computed(() => getAnalytics?.value || null)

const recurringIncomeCount = computed(() => {
    if (!filteredSources?.value) return 0
    return filteredSources.value.filter((source) => source.isRecurring).length
})

const recentIncomeEntries = computed(() => {
    if (!ledgerEntries?.value || !Array.isArray(ledgerEntries.value)) return []

    return ledgerEntries.value
        .sort((a, b) => {
            // Safe date comparison with fallback values
            const dateA = new Date(a.date_time || a.date || a.creation || 0)
            const dateB = new Date(b.date_time || b.date || b.creation || 0)
            return dateB - dateA
        })
        .slice(0, 5) // Increased to 5 for better recent activity
        .map((entry) => ({
            name: entry.name || entry.source_type,
            type: entry.source_type || "Income",
            amount: entry.amount || 0,
            frequency: entry.income_type === "recurring" ? "Monthly" : "One-time",
            date_time: entry.date_time || entry.date || entry.creation,
        }))
})

// 🚀 FIXED: Expense data with proper null safety
const totalExpenseAmountValue = computed(() => {
    return totalExpenseAmount?.value || 0
})

const totalExpenseCount = computed(() => {
    if (!expenses?.value || !Array.isArray(expenses.value)) return 0
    return expenses.value.length
})

const recentExpenses = computed(() => {
    if (!expenses?.value || !Array.isArray(expenses.value)) return []

    return expenses.value
        .sort((a, b) => {
            // Safe date comparison with fallback values
            const dateA = new Date(a.date_time || a.date || a.creation || 0)
            const dateB = new Date(b.date_time || b.date || b.creation || 0)
            return dateB - dateA
        })
        .slice(0, 5) // Increased to 5 for better recent activity
        .map((expense) => ({
            name: expense.name,
            category: expense.category || "Medical Expense",
            amount: expense.amount || 0,
            provider: expense.provider || "Healthcare",
            date_time: expense.date_time || expense.date || expense.creation,
        }))
})



// 🚀 FIXED: Medical and other expense counts
const medicalExpenseCount = computed(() => {
    if (!medicalExpenses?.value || !Array.isArray(medicalExpenses.value)) return 0
    return medicalExpenses.value.length
})

const otherExpenseCount = computed(() => {
    if (!otherExpenses?.value || !Array.isArray(otherExpenses.value)) return 0
    return otherExpenses.value.length
})

// 🚀 FIXED: Support data with proper null safety
const applicationsValue = computed(() => {
    return applications?.value || []
})

const claimsValue = computed(() => {
    return claims?.value || []
})

// 🚀 FIXED: Applications metrics
const totalApplications = computed(() => applicationsValue.value.length)
const pendingApplications = computed(
    () =>
        applicationsValue.value.filter(
            (app) => app.status === "pending" || app.status === "under_review",
        ).length,
)
const approvedApplications = computed(
    () =>
        applicationsValue.value.filter((app) => app.status === "approved").length,
)
const rejectedApplications = computed(
    () =>
        applicationsValue.value.filter((app) => app.status === "rejected").length,
)

// 🚀 FIXED: Claims metrics
const totalClaims = computed(() => claimsValue.value.length)
const approvedClaims = computed(
    () =>
        claimsValue.value.filter(
            (claim) => claim.status === "approved" || claim.status === "paid",
        ).length,
)
const totalBenefitsReceived = computed(() =>
    claimsValue.value.reduce(
        (total, claim) => total + (claim.approved_amount || 0),
        0,
    ),
)
const claimsSuccessRate = computed(() => {
    if (totalClaims.value === 0) return 0
    return Math.round((approvedClaims.value / totalClaims.value) * 100)
})

// 🚀 FIXED: Recent activity data
const recentApplications = computed(() => {
    return applicationsValue.value
        .sort((a, b) => new Date(b.date_applied) - new Date(a.date_applied))
        .slice(0, 2)
})

const recentClaims = computed(() => {
    return claimsValue.value
        .sort((a, b) => new Date(b.claim_date) - new Date(a.claim_date))
        .slice(0, 2)
})

const hasRecentActivity = computed(() => {
    return (
        recentExpenses.value.length > 0 ||
        recentIncomeEntries.value.length > 0 ||
        recentApplications.value.length > 0 ||
        recentClaims.value.length > 0
    )
})

// 🚀 FIXED: Financial calculations with null safety
const expensePercentage = computed(() => {
    if (totalMonthlyIncome.value === 0) return 0
    return Math.min(
        Math.round(
            (totalExpenseAmountValue.value / totalMonthlyIncome.value) * 100,
        ),
        100,
    )
})

const cheRatio = computed(() => {
    const annualIncome = totalMonthlyIncome.value * 12
    const annualExpenses = totalExpenseAmountValue.value * 12
    return calculateCHE(annualIncome, annualExpenses)
})

const monthlyBalance = computed(() => {
    return totalMonthlyIncome.value - totalExpenseAmountValue.value
})

const savingsRate = computed(() => {
    if (totalMonthlyIncome.value === 0) return 0
    return Math.round((monthlyBalance.value / totalMonthlyIncome.value) * 100)
})

// 🚀 FIXED: Eligible schemes count from support composable
const eligibleSchemesCount = computed(() => {
    return eligibleSchemes?.value?.length || 0
})

// Status badge helper
function getStatusBadgeClass(status) {
    const colors = {
        pending: "bg-yellow-100 text-yellow-800",
        under_review: "bg-blue-100 text-blue-800",
        approved: "bg-green-100 text-green-800",
        rejected: "bg-red-100 text-red-800",
        processing: "bg-blue-100 text-blue-800",
        paid: "bg-green-100 text-green-800",
    }
    return colors[status] || "bg-gray-100 text-gray-800"
}

// 🚀 FIXED: Enhanced navigation handlers with proper error handling
const navigateToIncome = () => {
    try {
        router.push("/income-management")
    } catch (error) {
        console.error("Navigation error:", error)
    }
}

const navigateToExpenses = () => {
    try {
        router.push("/expenses/overview")
    } catch (error) {
        console.error("Navigation error:", error)
    }
}

const navigateToExpenseAnalyzer = () => {
    try {
        router.push("/expenses/analyzer")
    } catch (error) {
        console.error("Navigation error:", error)
    }
}

const navigateToApplications = () => {
    try {
        router.push("/applications-claims/applications")
    } catch (error) {
        console.error("Navigation error:", error)
    }
}

const navigateToClaims = () => {
    try {
        router.push("/applications-claims/claims")
    } catch (error) {
        console.error("Navigation error:", error)
    }
}

const navigateToPrograms = () => {
    try {
        router.push("/care-support/programs")
    } catch (error) {
        console.error("Navigation error:", error)
    }
}

const navigateToConditions = () => {
    try {
        router.push("/care-support/conditions")
    } catch (error) {
        console.error("Navigation error:", error)
    }
}

const navigateToIncomeReports = () => {
    try {
        router.push("/income-management/reports")
    } catch (error) {
        console.error("Navigation error:", error)
    }
}

// 🚀 FIXED: Enhanced quick action navigation with loading states
const quickActionLoading = ref({
    expense: false,
    income: false,
    application: false,
    claim: false,
    program: false,
    health: false,
})

const navigateToExpenseForm = async () => {
    try {
        quickActionLoading.value.expense = true

        // Check if household profile exists
        if (!hasProfile.value) {
            // Redirect to profile creation first
            router.push("/profile/create?redirect=/expenses/overview&action=add")
            return
        }

        router.push("/expenses/overview?action=add")
    } catch (error) {
        console.error("Navigation error:", error)
        errorMessage.value = "Failed to navigate to expense form"
    } finally {
        quickActionLoading.value.expense = false
    }
}

const navigateToIncomeForm = async () => {
    try {
        quickActionLoading.value.income = true

        // Check if household profile exists
        if (!hasProfile.value) {
            // Redirect to profile creation first
            router.push("/profile/create?redirect=/income-management&action=add")
            return
        }

        router.push("/income-management?action=add")
    } catch (error) {
        console.error("Navigation error:", error)
        errorMessage.value = "Failed to navigate to income form"
    } finally {
        quickActionLoading.value.income = false
    }
}

const navigateToNewApplication = async () => {
    try {
        quickActionLoading.value.application = true

        // Check if household profile exists
        if (!hasProfile.value) {
            // Redirect to profile creation first
            router.push(
                "/profile/create?redirect=/applications-claims/applications&action=new",
            )
            return
        }

        router.push("/applications-claims/applications?action=new")
    } catch (error) {
        console.error("Navigation error:", error)
        errorMessage.value = "Failed to navigate to application form"
    } finally {
        quickActionLoading.value.application = false
    }
}

const navigateToNewClaim = async () => {
    try {
        quickActionLoading.value.claim = true

        // Check if household profile exists
        if (!hasProfile.value) {
            // Redirect to profile creation first
            router.push(
                "/profile/create?redirect=/applications-claims/claims&action=new",
            )
            return
        }

        router.push("/applications-claims/claims?action=new")
    } catch (error) {
        console.error("Navigation error:", error)
        errorMessage.value = "Failed to navigate to claim form"
    } finally {
        quickActionLoading.value.claim = false
    }
}

// Detail navigation
const navigateToExpenseDetail = (expenseId) => {
    try {
        router.push(`/expenses/detail/${expenseId}`)
    } catch (error) {
        console.error("Navigation error:", error)
    }
}

const navigateToIncomeDetail = (incomeId) => {
    try {
        router.push(`/income-management/detail/${incomeId}`)
    } catch (error) {
        console.error("Navigation error:", error)
    }
}

const navigateToApplicationDetail = (applicationId) => {
    try {
        router.push(`/applications-claims/applications/${applicationId}`)
    } catch (error) {
        console.error("Navigation error:", error)
    }
}

const navigateToClaimDetail = (claimId) => {
    try {
        router.push(`/applications-claims/claims/${claimId}`)
    } catch (error) {
        console.error("Navigation error:", error)
    }
}

// 🚀 FIXED: Enhanced filter handling
const handleDateFilterChange = async () => {
    try {
        const filters = {
            dateFrom: dashboardFilters.value.dateFrom,
            dateTo: dashboardFilters.value.dateTo,
            period: dashboardFilters.value.period,
        }

        await Promise.allSettled([
            updateIncomeFilters(filters),
            updateExpenseFilters(filters),
        ])

        lastUpdated.value = new Date().toLocaleTimeString()
    } catch (error) {
        console.error("Error applying date filters:", error)
        errorMessage.value = "Failed to apply filters"
    }
}

// Helper function to initialize date filters
const initializeDateFilters = () => {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    return {
        dateFrom: firstDay.toISOString().split("T")[0],
        dateTo: lastDay.toISOString().split("T")[0],
        period: "this_month",
    }
}

const resetDateFilters = async () => {
    const initial = initializeDateFilters()
    dashboardFilters.value = { ...initial }
    await handleDateFilterChange()
}

const applyCurrentMonthFilter = async () => {
    const initial = initializeDateFilters()
    dashboardFilters.value = { ...initial }
    await handleDateFilterChange()
}

// 🚀 FIXED: Enhanced data loading with proper error handling
const loadDashboardData = async () => {
    try {
        // Load data in parallel with proper error handling
        const results = await Promise.allSettled([
            initializeIncome({
                withAnalytics: true,
                period: dashboardFilters.value.period,
            }),
            initializeExpense({
                withAnalytics: true,
                forceRefresh: false,
            }),
            initializeSupport({
                withAnalytics: true,
            }),
            loadHouseholdProfileData(),
        ])

        // Check for any failures
        const failures = results.filter((result) => result.status === "rejected")
        if (failures.length > 0) {
            console.warn("Some dashboard data failed to load:", failures)
        }

        // Load additional support data if profile exists
        if (hasProfile.value) {
            await Promise.allSettled([
                support.loadEligibleSchemes(true),
                support.loadSupportRecommendations(true),
            ])
        }
    } catch (error) {
        console.error("Error loading dashboard data:", error)
        throw error
    }
}

// 🚀 FIXED: Enhanced refresh with better error handling
const refreshDashboard = async () => {
    try {
        isLoading.value = true
        hasError.value = false
        errorMessage.value = ""

        await loadDashboardData()
        lastUpdated.value = new Date().toLocaleTimeString()
    } catch (error) {
        hasError.value = true
        errorMessage.value = error.message || "Failed to refresh dashboard"
        console.error("Dashboard refresh error:", error)
    } finally {
        isLoading.value = false
    }
}

// Period filter state
const periodOptions = [
    { value: "this_month", label: "This Month" },
    { value: "last_month", label: "Last Month" },
    { value: "last_3_months", label: "Last 3 Months" },
    { value: "last_6_months", label: "Last 6 Months" },
    { value: "this_year", label: "This Year" },
]
const selectedPeriod = ref("this_month")

// 🚀 FIXED: Enhanced period change handler
const handlePeriodChange = async () => {
    try {
        dashboardFilters.value.period = selectedPeriod.value
        await Promise.allSettled([
            setPeriod(selectedPeriod.value),
            handleDateFilterChange(),
        ])
    } catch (error) {
        console.error("Error updating period:", error)
        errorMessage.value = "Failed to update period"
    }
}

// 🚀 FIXED: Watch for household profile changes
watch(hasProfile, async (newValue) => {
    if (newValue && !isLoading.value) {
        // Reload support data when profile becomes available
        try {
            await Promise.allSettled([
                support.loadEligibleSchemes(true),
                support.loadSupportRecommendations(true),
            ])
        } catch (error) {
            console.warn("Failed to load support data after profile creation:", error)
        }
    }
})

// 🚀 FIXED: Initialize dashboard filters on mount
onMounted(() => {
    const initial = initializeDateFilters()
    dashboardFilters.value = { ...initial }
})

// 🚀 FIXED: Enhanced lifecycle with better error handling
onMounted(async () => {
    try {
        isLoading.value = true
        hasError.value = false
        errorMessage.value = ""

        // Initialize all composables with proper error handling
        await loadDashboardData()

        lastUpdated.value = new Date().toLocaleTimeString()
    } catch (error) {
        hasError.value = true
        errorMessage.value =
            error instanceof Error ? error.message : "Failed to load dashboard"
        console.error("Dashboard initialization error:", error)
    } finally {
        isLoading.value = false
    }
})
</script>