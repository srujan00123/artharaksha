<template>
    <div class="p-3 sm:p-4 lg:p-6 space-y-4 lg:space-y-6">
        <!-- Loading State -->
        <div v-if="isLoading" class="flex items-center justify-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span class="ml-3 text-gray-600 dark:text-gray-400 dark:text-gray-500">Loading dashboard...</span>
        </div>

        <!-- Error State -->
        <div v-else-if="hasError" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <div class="flex">
                <AlertCircle class="h-5 w-5 text-red-400" />
                <div class="ml-3">
                    <h3 class="text-sm font-medium text-red-800 dark:text-red-200">Error loading dashboard</h3>
                    <p class="mt-1 text-sm text-red-700 dark:text-red-300">{{ errorMessage }}</p>
                    <div class="mt-3">
                        <Button variant="outline" size="sm" @click="refreshDashboard">
                            <RefreshCw class="w-4 h-4 mr-2" />
                            Retry
                        </Button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Dashboard Content -->
        <div v-else>
            <!-- Welcome Banner with User Info -->
            <div class="bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl p-4 sm:p-6 lg:p-8 text-white dark:text-black">
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <h1 class="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">
                            Welcome back, {{ userDisplayName }}!
                        </h1>
                        <p class="text-blue-100 text-sm sm:text-base lg:text-lg mb-4 max-w-3xl leading-relaxed">
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
                        <div class="w-16 h-16 bg-white dark:bg-gray-800 dark:bg-gray-200 bg-opacity-20 rounded-full flex items-center justify-center">
                            <User class="w-8 h-8 text-white dark:text-black" />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Date Range Filter -->
            <Card class="p-4 sm:p-5 lg:p-6 mb-6 bg-white dark:bg-slate-800">
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Dashboard Filters</h3>
                        <p class="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-1">Filter data by date range</p>
                    </div>
                    <div class="flex flex-col sm:flex-row gap-3 sm:items-center">
                        <div class="flex items-center space-x-2">
                            <label class="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">From:</label>
                            <input
                                v-model="dateFilters.dateFrom"
                                type="date"
                                class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:ring-blue-400 dark:focus:ring-blue-400 focus:border-transparent"
                                @change="handleDateFilterChange"
                            />
                        </div>
                        <div class="flex items-center space-x-2">
                            <label class="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">To:</label>
                            <input
                                v-model="dateFilters.dateTo"
                                type="date"
                                class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:ring-blue-400 dark:focus:ring-blue-400 focus:border-transparent"
                                @change="handleDateFilterChange"
                            />
                        </div>
                        <div class="flex space-x-2">
                            <Button variant="outline" size="sm" @click="resetDateFilters">
                                <RefreshCw class="w-4 h-4 mr-2" />
                                Reset
                            </Button>
                            <Button variant="outline" size="sm" @click="applyCurrentMonthFilter">
                                <Calendar class="w-4 h-4 mr-2" />
                                This Month
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>

            <!-- Key Metrics Overview -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-8">
                <!-- Monthly Income -->
                <Card class="p-4 sm:p-5 lg:p-6 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 bg-white dark:bg-slate-800" 
                      @click="navigateToIncome">
                <div class="flex items-center justify-between">
                        <div class="min-w-0 flex-1">
                            <p class="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 dark:text-gray-500">Monthly Income</p>
                            <p class="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
                                ₹{{ formatCurrency(totalMonthlyIncome) }}
                            </p>
                            <div class="flex items-center space-x-2 mt-1">
                                <p class="text-xs text-green-600 dark:text-green-400">{{ recurringIncomeCount }} recurring</p>
                                <span class="text-xs text-gray-400 dark:text-gray-500">•</span>
                                <p class="text-xs text-blue-600 dark:text-blue-400">₹{{ formatCurrency(totalRecurringIncome) }} total</p>
                            </div>
                        </div>
                        <div class="w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0 ml-3">
                            <TrendingUp class="w-5 h-5 sm:w-5.5 sm:h-5.5 lg:w-6 lg:h-6 text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                    <div class="mt-3 sm:mt-4 h-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                        <div class="h-2 bg-green-600 rounded-full transition-all duration-300" style="width: 100%"></div>
                    </div>
                </Card>

                <!-- Total Expenses -->
                <Card class="p-4 sm:p-5 lg:p-6 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 bg-white dark:bg-slate-800" 
                      @click="navigateToExpenses">
                    <div class="flex items-center justify-between">
                        <div class="min-w-0 flex-1">
                            <p class="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 dark:text-gray-500">Total Expenses</p>
                            <p class="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
                                ₹{{ formatCurrency(totalExpenseAmount) }}
                            </p>
                            <div class="flex items-center space-x-2 mt-1">
                                <p class="text-xs text-blue-600 dark:text-blue-400">{{ medicalExpenseCount }} medical</p>
                                <span class="text-xs text-gray-400 dark:text-gray-500">•</span>
                                <p class="text-xs text-purple-600 dark:text-purple-400">{{ otherExpenseCount }} other</p>
                            </div>
                        </div>
                        <div class="w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0 ml-3">
                            <PieChart class="w-5 h-5 sm:w-5.5 sm:h-5.5 lg:w-6 lg:h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                </div>
                    <div class="mt-3 sm:mt-4 h-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                        <div class="h-2 bg-blue-600 rounded-full transition-all duration-300" 
                             :style="`width: ${Math.min(expensePercentage, 100)}%`"></div>
                </div>
                    <p class="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-1">{{ expensePercentage }}% of income</p>
            </Card>

            <!-- Applications Status -->
                <Card class="p-4 sm:p-5 lg:p-6 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 bg-white dark:bg-slate-800" 
                      @click="navigateToApplications">
                <div class="flex items-center justify-between">
                        <div class="min-w-0 flex-1">
                            <p class="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 dark:text-gray-500">Applications</p>
                            <p class="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100">{{ totalApplications }}</p>
                            <div class="flex items-center space-x-2 mt-1">
                                <span class="text-xs text-orange-600 dark:text-orange-400">{{ pendingApplications }} pending</span>
                                <span class="text-xs text-green-600 dark:text-green-400">{{ approvedApplications }} approved</span>
                            </div>
                        </div>
                        <div class="w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center flex-shrink-0 ml-3">
                            <FileText class="w-5 h-5 sm:w-5.5 sm:h-5.5 lg:w-6 lg:h-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    </div>
                    <div class="flex items-center justify-between mt-3 sm:mt-4">
                        <div class="flex space-x-1">
                            <div class="w-2 h-2 bg-orange-400 rounded-full" v-if="pendingApplications > 0"></div>
                            <div class="w-2 h-2 bg-green-400 rounded-full" v-if="approvedApplications > 0"></div>
                            <div class="w-2 h-2 bg-red-400 rounded-full" v-if="rejectedApplications > 0"></div>
                </div>
                    <ChevronRight class="w-4 h-4 text-gray-400 dark:text-gray-500" />
                </div>
            </Card>

            <!-- Claims & Benefits -->
                <Card class="p-4 sm:p-5 lg:p-6 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 bg-white dark:bg-slate-800" 
                      @click="navigateToClaims">
                <div class="flex items-center justify-between">
                        <div class="min-w-0 flex-1">
                            <p class="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 dark:text-gray-500">Claims & Benefits</p>
                            <p class="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
                                ₹{{ formatCurrency(totalBenefitsReceived) }}
                            </p>
                            <div class="flex items-center space-x-2 mt-1">
                                <span class="text-xs text-purple-600 dark:text-purple-400">{{ totalClaims }} claims</span>
                                <span class="text-xs text-green-600 dark:text-green-400">{{ approvedClaims }} approved</span>
                            </div>
                        </div>
                        <div class="w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0 ml-3">
                            <CreditCard class="w-5 h-5 sm:w-5.5 sm:h-5.5 lg:w-6 lg:h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                    </div>
                    <div class="flex items-center justify-between mt-3 sm:mt-4">
                        <span class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">{{ claimsSuccessRate }}% success rate</span>
                        <ChevronRight class="w-4 h-4 text-gray-400 dark:text-gray-500" />
                </div>
            </Card>
        </div>

        <!-- CHE Alert -->
            <div v-if="cheRatio > 10" class="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-4 lg:p-6 rounded-lg shadow dark:shadow-gray-900/20-sm dark:shadow dark:shadow-gray-900/20-gray-900/20 mb-6">
                <div class="flex">
                    <AlertTriangle class="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div class="ml-3 flex-1">
                        <h3 class="text-sm font-medium text-red-800 dark:text-red-200">Catastrophic Health Expenditure Alert</h3>
                        <p class="mt-2 text-sm text-red-700 dark:text-red-300 leading-relaxed">
                            Your healthcare expenses ({{ cheRatio }}%) exceed the recommended threshold. 
                            Consider exploring available welfare schemes and insurance options.
                        </p>
                        <div class="mt-4 flex flex-wrap gap-3">
                            <Button variant="outline" size="sm" @click="navigateToPrograms">
                                <Shield class="w-4 h-4 mr-2" />
                                Browse Schemes
                            </Button>
                            <Button variant="outline" size="sm" @click="navigateToApplications">
                                <FileText class="w-4 h-4 mr-2" />
                                Apply for Support
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

        <!-- Quick Actions -->
            <Card class="p-4 sm:p-5 lg:p-6 mb-6 bg-white dark:bg-slate-800">
                <div class="flex items-center justify-between mb-4 lg:mb-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-slate-100">Quick Actions</h3>
                    <span class="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 hidden sm:block">Get things done faster</span>
                </div>
                <div class="quick-actions-row flex flex-wrap gap-3 lg:gap-4">
                    <div class="quick-action-box bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 flex-1 min-w-[140px] max-w-[180px] flex items-center justify-center">
                        <QuickActionButton
                            @click="navigateToExpenseForm"
                            icon="Plus"
                            label="Add Expense"
                            color="blue"
                            :loading="false"
                        />
                    </div>
                    <div class="quick-action-box bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 flex-1 min-w-[140px] max-w-[180px] flex items-center justify-center">
                        <QuickActionButton
                            @click="navigateToIncomeForm"
                            icon="TrendingUp"
                            label="Add Income"
                            color="green"
                            :loading="false"
                        />
                    </div>
                    <div class="quick-action-box bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 flex-1 min-w-[140px] max-w-[180px] flex items-center justify-center">
                        <QuickActionButton
                            @click="navigateToNewApplication"
                            icon="FileText"
                            label="New Application"
                            color="orange"
                            :loading="false"
                        />
                    </div>
                    <div class="quick-action-box bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 flex-1 min-w-[140px] max-w-[180px] flex items-center justify-center">
                        <QuickActionButton
                            @click="navigateToNewClaim"
                            icon="CreditCard"
                            label="Submit Claim"
                            color="purple"
                            :loading="false"
                        />
                    </div>
                    <div class="quick-action-box bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 flex-1 min-w-[140px] max-w-[180px] flex items-center justify-center">
                        <QuickActionButton
                            @click="navigateToPrograms"
                            icon="Shield"
                            label="Browse Schemes"
                            color="indigo"
                            :loading="false"
                        />
                    </div>
                    <div class="quick-action-box bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 flex-1 min-w-[140px] max-w-[180px] flex items-center justify-center">
                        <QuickActionButton
                            @click="navigateToConditions"
                            icon="Heart"
                            label="Health Profile"
                            color="pink"
                            :loading="false"
                        />
                    </div>
                </div>
            </Card>
        </div>

        <!-- Main Content Grid -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                <!-- Recent Activity (2/3 width) -->
                <div class="lg:col-span-2">
            <Card class="bg-white dark:bg-slate-800">
                <div class="p-4 lg:p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-slate-100">Recent Activity</h3>
                                <div class="flex space-x-2">
                                    <Button variant="outline" size="sm" @click="refreshDashboard">
                                        <RefreshCw class="w-4 h-4 mr-2" />
                                        Refresh
                                    </Button>
                                    <Button variant="outline" size="sm" @click="navigateToExpenses">
                            View All
                                    </Button>
                                </div>
                    </div>
                            
                            <div class="space-y-3">
                                <!-- Recent Expenses -->
                                <div v-for="expense in recentExpenses" :key="`expense-${expense.name}`"
                                    class="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:bg-blue-900/30 transition-colors cursor-pointer"
                                    @click="navigateToExpenseDetail(expense.name)">
                            <div class="flex items-center space-x-3">
                                <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                                    <PieChart class="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                            <p class="font-medium text-gray-900 dark:text-gray-100">{{ expense.category || 'Medical Expense' }}</p>
                                    <p class="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{{ formatDate(expense.date) }}</p>
                                </div>
                            </div>
                            <div class="text-right">
                                <p class="font-semibold text-gray-900 dark:text-gray-100">₹{{ formatCurrency(expense.amount) }}</p>
                                        <p class="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">{{ expense.provider || 'Healthcare' }}</p>
                                    </div>
                                </div>

                                <!-- Recent Income -->
                                <div v-for="income in recentIncomeEntries" :key="`income-${income.name}`"
                                    class="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:bg-green-900/30 transition-colors cursor-pointer"
                                    @click="navigateToIncomeDetail(income.name)">
                                    <div class="flex items-center space-x-3">
                                        <div class="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                            <TrendingUp class="w-4 h-4 text-green-600 dark:text-green-400" />
                                        </div>
                                        <div>
                                            <p class="font-medium text-gray-900 dark:text-gray-100">{{ income.type || 'Income' }}</p>
                                            <p class="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{{ formatDate(income.date) }}</p>
                                        </div>
                                    </div>
                                    <div class="text-right">
                                        <p class="font-semibold text-green-600 dark:text-green-400">+₹{{ formatCurrency(income.amount) }}</p>
                                        <p class="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">{{ income.frequency || 'One-time' }}</p>
                            </div>
                        </div>

                        <!-- Recent Applications -->
                                <div v-for="application in recentApplications" :key="`app-${application.name}`"
                                    class="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors cursor-pointer"
                                    @click="navigateToApplicationDetail(application.name)">
                            <div class="flex items-center space-x-3">
                                <div class="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                                    <FileText class="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                </div>
                                <div>
                                    <p class="font-medium text-gray-900 dark:text-gray-100">{{ getSchemeDisplayName(application) }}</p>
                                    <p class="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{{ formatDate(application.date_applied) }}</p>
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
                                    class="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors cursor-pointer"
                                    @click="navigateToClaimDetail(claim.name)">
                            <div class="flex items-center space-x-3">
                                        <div class="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                                            <CreditCard class="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <p class="font-medium text-gray-900 dark:text-gray-100">{{ getSchemeDisplayName(claim) }}</p>
                                    <p class="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{{ formatDate(claim.claim_date) }}</p>
                                </div>
                            </div>
                            <div class="text-right">
                                        <p class="font-semibold text-purple-600 dark:text-purple-400">₹{{ formatCurrency(claim.approved_amount || claim.claim_amount) }}</p>
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
                                        <Button variant="outline" size="sm" @click="navigateToExpenseForm">
                                            <Plus class="w-4 h-4 mr-2" />
                                            Add Expense
                                        </Button>
                                        <Button variant="outline" size="sm" @click="navigateToIncomeForm">
                                            <TrendingUp class="w-4 h-4 mr-2" />
                                            Add Income
                                        </Button>
                                    </div>
                        </div>
                    </div>
                </div>
            </Card>
                </div>

                <!-- Financial Health Summary (1/3 width) -->
                <div class="lg:col-span-1">
            <Card class="bg-white dark:bg-slate-800">
                <div class="p-4 lg:p-6">
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Financial Health</h3>
                    <div class="space-y-6">
                        <!-- Healthcare Expense Ratio -->
                        <div>
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-sm font-medium text-gray-600 dark:text-gray-400 dark:text-gray-500">Healthcare Expense Ratio</span>
                                <span class="text-sm font-bold text-gray-900 dark:text-gray-100">{{ cheRatio }}%</span>
                            </div>
                            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div class="h-2 rounded-full transition-all duration-300"
                                            :class="getCHEColorClass(cheRatio)" 
                                            :style="`width: ${Math.min(cheRatio, 100)}%`">
                                </div>
                            </div>
                            <p class="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-1">{{ getCHEStatusText(cheRatio) }}</p>
                        </div>

                                <!-- Income vs Expenses -->
                        <div>
                            <div class="flex items-center justify-between mb-2">
                                        <span class="text-sm font-medium text-gray-600 dark:text-gray-400 dark:text-gray-500">Monthly Balance</span>
                                        <span class="text-sm font-bold" :class="monthlyBalance >= 0 ? 'text-green-600' : 'text-red-600'">
                                            {{ monthlyBalance >= 0 ? '+' : '' }}₹{{ formatCurrency(Math.abs(monthlyBalance)) }}
                                        </span>
                                    </div>
                                    <div class="space-y-2">
                                        <div class="flex justify-between text-xs">
                                            <span class="text-green-600 dark:text-green-400">Income: ₹{{ formatCurrency(totalMonthlyIncome) }}</span>
                                            <span class="text-red-600 dark:text-red-400">Expenses: ₹{{ formatCurrency(totalExpenseAmount) }}</span>
                            </div>
                            </div>
                        </div>

                                <!-- Savings Rate -->
                        <div>
                            <div class="flex items-center justify-between mb-2">
                                        <span class="text-sm font-medium text-gray-600 dark:text-gray-400 dark:text-gray-500">Savings Rate</span>
                                        <span class="text-sm font-bold text-gray-900 dark:text-gray-100">{{ savingsRate }}%</span>
                            </div>
                            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                        <div class="h-2 rounded-full transition-all duration-300"
                                            :class="savingsRate > 20 ? 'bg-green-500' : savingsRate > 10 ? 'bg-yellow-500' : 'bg-red-500'"
                                            :style="`width: ${Math.min(Math.abs(savingsRate), 100)}%`">
                                        </div>
                            </div>
                                    <p class="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-1">
                                        {{ savingsRate > 20 ? 'Excellent' : savingsRate > 10 ? 'Good' : 'Needs improvement' }}
                                    </p>
                        </div>

                        <!-- Support Programs -->
                        <div>
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-sm font-medium text-gray-600 dark:text-gray-400 dark:text-gray-500">Available Support</span>
                                        <Button variant="outline" size="sm" @click="navigateToPrograms">
                                    <Shield class="w-4 h-4 mr-1" />
                                    Browse
                                        </Button>
                                    </div>
                                    <p class="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">{{ eligibleSchemesCount }} schemes available</p>
                                    <div class="space-y-1">
                                        <div class="flex justify-between text-xs">
                                            <span>Applications: {{ totalApplications }}</span>
                                            <span class="text-green-600 dark:text-green-400">{{ approvedApplications }} approved</span>
                                        </div>
                                        <div class="flex justify-between text-xs">
                                            <span>Claims: {{ totalClaims }}</span>
                                            <span class="text-purple-600 dark:text-purple-400">₹{{ formatCurrency(totalBenefitsReceived) }} received</span>
                                        </div>
                                    </div>
                                </div>

                                <!-- Quick Health Actions -->
                                <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <h4 class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Quick Health Actions</h4>
                                    <div class="space-y-2">
                                        <Button variant="outline" size="sm" class="w-full justify-start" @click="navigateToConditions">
                                            <Heart class="w-4 h-4 mr-2" />
                                            Manage Health Conditions
                                        </Button>
                                        <Button variant="outline" size="sm" class="w-full justify-start" @click="navigateToExpenseAnalyzer">
                                            <BarChart class="w-4 h-4 mr-2" />
                                            Expense Analytics
                                        </Button>
                                        <Button variant="outline" size="sm" class="w-full justify-start" @click="navigateToIncomeReports">
                                            <TrendingUp class="w-4 h-4 mr-2" />
                                            Income Reports
                                        </Button>
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
import { useIncome } from "@/composables/useIncome"
import { useSupport } from "@/composables/useSupport"
import { useExpenseStore } from "@/stores/expense"
import { useSupportStore } from "@/stores/support"
import { useUserStore } from "@/stores/user"
import { getSchemeDisplayName, getStatusLabel } from "@/types/support"
import {
	calculateCHE,
	formatCurrency,
	formatDate,
	getCHEColorClass,
	getCHEStatusText,
} from "@/utils"
import { Button, Card } from "frappe-ui"
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
import { computed, onMounted, ref } from "vue"
import { useRouter } from "vue-router"

// Router for navigation
const router = useRouter()

// Use stores and composables
const userStore = useUserStore()
const expenseStore = useExpenseStore()
const supportStore = useSupportStore()

// Use composables
const income = useIncome()
const expenseComposable = useExpense()
const supportComposable = useSupport()

// Loading and error states
const isLoading = ref(true)
const hasError = ref(false)
const errorMessage = ref("")
const lastUpdated = ref("")

// Date filters - initialize with current month
const initializeDateFilters = () => {
	const now = new Date()
	const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
	const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)

	return {
		dateFrom: firstDay.toISOString().split("T")[0],
		dateTo: lastDay.toISOString().split("T")[0],
	}
}

const dateFilters = ref(initializeDateFilters())

// Static data
const eligibleSchemesCount = ref(12)
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

// Income data from composable
const totalMonthlyIncome = computed(() => {
	const value = income.totalMonthlyIncome
	return typeof value === "object" && value?.value !== undefined
		? value.value
		: value || 0
})
const totalRecurringIncome = computed(() => {
	const value = income.totalRecurringIncome
	return typeof value === "object" && value?.value !== undefined
		? value.value
		: value || 0
})
const totalOneTimeIncome = computed(() => {
	const value = income.totalOneTimeIncome
	return typeof value === "object" && value?.value !== undefined
		? value.value
		: value || 0
})
const recurringIncomeCount = computed(() => {
	const incomes = income.incomes
	const incomeArray =
		typeof incomes === "object" && incomes?.value !== undefined
			? incomes.value
			: incomes || []
	let recurringCount = 0
	incomeArray.forEach((income) => {
		if (income.sources) {
			recurringCount += income.sources.filter(
				(source) => source.isRecurring,
			).length
		}
	})
	return recurringCount
})
const recentIncomeEntries = computed(() => {
	const incomes = income.incomes
	const incomeArray =
		typeof incomes === "object" && incomes?.value !== undefined
			? incomes.value
			: incomes || []
	const allSources = []
	incomeArray.forEach((income) => {
		if (income.sources) {
			income.sources.forEach((source) => {
				allSources.push({
					name: source.type,
					type: source.type,
					amount: source.amount,
					frequency: source.isRecurring ? "monthly" : "one-time",
					date: income.creation || new Date().toISOString(),
				})
			})
		}
	})
	return allSources
		.sort((a, b) => new Date(b.date) - new Date(a.date))
		.slice(0, 3)
})

// Expense data from composable
const totalExpenseAmount = computed(() => {
	const value = expenseComposable.totalExpenseAmount
	return typeof value === "object" && value?.value !== undefined
		? value.value
		: value || 0
})
const totalExpenseCount = computed(() => {
	const expenses = expenseComposable.expenses
	const expenseArray =
		typeof expenses === "object" && expenses?.value !== undefined
			? expenses.value
			: expenses || []
	return expenseArray.length
})
const recentExpenses = computed(() => {
	const expenses = expenseComposable.expenses
	const expenseArray =
		typeof expenses === "object" && expenses?.value !== undefined
			? expenses.value
			: expenses || []
	return expenseArray
		.sort((a, b) => new Date(b.date) - new Date(a.date))
		.slice(0, 3)
		.map((expense) => ({
			name: expense.name,
			category: expense.category,
			amount: expense.amount,
			provider: expense.provider,
			date: expense.date,
		}))
})

// Medical and other expense counts - use groupedExpenses from composable
const medicalExpenseCount = computed(() => {
	const grouped = expenseComposable.groupedExpenses
	if (typeof grouped === "object" && grouped?.value !== undefined) {
		return grouped.value?.medical?.count || 0
	}
	return grouped?.medical?.count || 0
})

const otherExpenseCount = computed(() => {
	const grouped = expenseComposable.groupedExpenses
	if (typeof grouped === "object" && grouped?.value !== undefined) {
		return grouped.value?.other?.count || 0
	}
	return grouped?.other?.count || 0
})

// Support data from composable
const applications = computed(() => {
	const apps = supportComposable.applications
	return typeof apps === "object" && apps?.value !== undefined
		? apps.value
		: apps || []
})
const claims = computed(() => {
	const claimsData = supportComposable.claims
	return typeof claimsData === "object" && claimsData?.value !== undefined
		? claimsData.value
		: claimsData || []
})

// Applications metrics
const totalApplications = computed(() => applications.value.length)
const pendingApplications = computed(
	() =>
		applications.value.filter(
			(app) => app.status === "pending" || app.status === "under_review",
		).length,
)
const approvedApplications = computed(
	() => applications.value.filter((app) => app.status === "approved").length,
)
const rejectedApplications = computed(
	() => applications.value.filter((app) => app.status === "rejected").length,
)

// Claims metrics
const totalClaims = computed(() => claims.value.length)
const approvedClaims = computed(
	() =>
		claims.value.filter(
			(claim) => claim.status === "approved" || claim.status === "paid",
		).length,
)
const totalBenefitsReceived = computed(() =>
	claims.value.reduce(
		(total, claim) => total + (claim.approved_amount || 0),
		0,
	),
)
const claimsSuccessRate = computed(() => {
	if (totalClaims.value === 0) return 0
	return Math.round((approvedClaims.value / totalClaims.value) * 100)
})

// Recent activity data
const recentApplications = computed(() => {
	return applications.value
		.sort((a, b) => new Date(b.date_applied) - new Date(a.date_applied))
		.slice(0, 2)
})

const recentClaims = computed(() => {
	return claims.value
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

// Financial calculations
const expensePercentage = computed(() => {
	if (totalMonthlyIncome.value === 0) return 0
	return Math.min(
		Math.round((totalExpenseAmount.value / totalMonthlyIncome.value) * 100),
		100,
	)
})

const cheRatio = computed(() => {
	const annualIncome = totalMonthlyIncome.value * 12
	const annualExpenses = totalExpenseAmount.value * 12
	return calculateCHE(annualIncome, annualExpenses)
})

const monthlyBalance = computed(() => {
	return totalMonthlyIncome.value - totalExpenseAmount.value
})

const savingsRate = computed(() => {
	if (totalMonthlyIncome.value === 0) return 0
	return Math.round((monthlyBalance.value / totalMonthlyIncome.value) * 100)
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

// Navigation handlers
function navigateToIncome() {
	router.push("/income-management")
}

function navigateToExpenses() {
	router.push("/expenses/overview")
}

function navigateToExpenseAnalyzer() {
	router.push("/expenses/analyzer")
}

function navigateToApplications() {
	router.push("/applications-claims/applications")
}

function navigateToClaims() {
	router.push("/applications-claims/claims")
}

function navigateToPrograms() {
	router.push("/care-support/programs")
}

function navigateToConditions() {
	router.push("/care-support/conditions")
}

function navigateToIncomeReports() {
	router.push("/income-management/reports")
}

// Quick action navigation
function navigateToExpenseForm() {
	router.push("/expenses/overview?action=add")
}

function navigateToIncomeForm() {
	router.push("/income-management?action=add")
}

function navigateToNewApplication() {
	router.push("/applications-claims/applications?action=new")
}

function navigateToNewClaim() {
	router.push("/applications-claims/claims?action=new")
}

// Detail navigation
function navigateToExpenseDetail(expenseId) {
	router.push(`/expenses/detail/${expenseId}`)
}

function navigateToIncomeDetail(incomeId) {
	router.push(`/income-management/detail/${incomeId}`)
}

function navigateToApplicationDetail(applicationId) {
	router.push(`/applications-claims/applications/${applicationId}`)
}

function navigateToClaimDetail(claimId) {
	router.push(`/applications-claims/claims/${claimId}`)
}

// Date filter handlers
const handleDateFilterChange = async () => {
	try {
		// Apply filters to all composables
		const filters = {
			dateFrom: dateFilters.value.dateFrom,
			dateTo: dateFilters.value.dateTo,
		}

		await Promise.all([
			income.updateFilters(filters),
			expenseComposable.updateFilters(filters),
			supportComposable.updateFilters &&
				supportComposable.updateFilters(filters),
		])

		lastUpdated.value = new Date().toLocaleTimeString()
	} catch (error) {
		console.error("Error applying date filters:", error)
	}
}

const resetDateFilters = async () => {
	dateFilters.value = initializeDateFilters()
	await handleDateFilterChange()
}

const applyCurrentMonthFilter = async () => {
	dateFilters.value = initializeDateFilters()
	await handleDateFilterChange()
}

// Refresh dashboard
async function refreshDashboard() {
	isLoading.value = true
	hasError.value = false
	errorMessage.value = ""

	try {
		await loadDashboardData()
		lastUpdated.value = new Date().toLocaleTimeString()
	} catch (error) {
		hasError.value = true
		errorMessage.value = error.message || "Failed to refresh dashboard"
	} finally {
		isLoading.value = false
	}
}

// Load dashboard data
async function loadDashboardData() {
	try {
		// Load all dashboard data in parallel
		await Promise.all([
			userStore.initialize(),
			income.initialize({ withAnalytics: true, forceRefresh: false }),
			income.fetchIncomes(true),
			expenseComposable.initialize && expenseComposable.initialize(),
			supportComposable.initialize && supportComposable.initialize(),
		])
	} catch (error) {
		console.error("Error loading dashboard data:", error)
		throw error
	}
}

// Lifecycle
onMounted(async () => {
	try {
		await loadDashboardData()
		lastUpdated.value = new Date().toLocaleTimeString()
	} catch (error) {
		hasError.value = true
		errorMessage.value = error.message || "Failed to load dashboard"
		console.error("Dashboard initialization error:", error)
	} finally {
		isLoading.value = false
	}
})

// Advanced theme management
const { currentTheme, isDark, setTheme, themes } = useAdvancedTheme()

// Theme utility methods
const getFinancialStatusClass = (type, intensity = "600") => {
	const baseClasses = {
		income: `text-green-${intensity} dark:text-green-400`,
		expense: `text-red-${intensity} dark:text-red-400`,
		medical: `text-blue-${intensity} dark:text-blue-400`,
		warning: `text-yellow-${intensity} dark:text-yellow-400`,
		alert: `text-orange-${intensity} dark:text-orange-400`,
		neutral: `text-gray-${intensity} dark:text-gray-400`,
	}
	return baseClasses[type] || baseClasses.neutral
}

const getThemeSurfaceClass = (variant = "primary") => {
	const variants = {
		primary: "bg-white dark:bg-gray-800",
		secondary: "bg-gray-50 dark:bg-gray-900",
		tertiary: "bg-gray-100 dark:bg-gray-800",
	}
	return variants[variant] || variants.primary
}

const getThemeTextClass = (intensity = "600") => {
	const intensityMap = {
		900: "text-gray-900 dark:text-gray-100",
		800: "text-gray-800 dark:text-gray-200",
		700: "text-gray-700 dark:text-gray-300",
		600: "text-gray-600 dark:text-gray-400",
		500: "text-gray-500 dark:text-gray-400",
		400: "text-gray-400 dark:text-gray-500",
	}
	return intensityMap[intensity] || intensityMap["600"]
}
</script>