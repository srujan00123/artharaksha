<template>
  <div class="p-3 sm:p-4 lg:p-6 space-y-4 lg:space-y-6">
    <!-- Welcome Section -->
    <div class="bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl p-4 sm:p-6 lg:p-8 text-white">
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <h1 class="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">
            Welcome to Artha Raksha!
          </h1>
          <p class="text-blue-100 text-sm sm:text-base lg:text-lg mb-4 max-w-3xl leading-relaxed">
            Hello {{ session.user }}! Your comprehensive healthcare financial protection platform is ready to help you manage expenses, track income, and access welfare schemes.
          </p>
        </div>
        <div class="hidden sm:block">
          <div class="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <Heart class="w-8 h-8 text-white" />
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
      <Card class="p-4 sm:p-5 lg:p-6 bg-white dark:bg-slate-800 hover:shadow-lg transition-all duration-200">
        <div class="text-center">
          <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-3">
            <BarChart3 class="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 class="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">Dashboard</h3>
          <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4">View your financial overview</p>
          <Button variant="outline" size="sm" class="w-full" @click="$router.push('/dashboard')">
            View Dashboard
          </Button>
        </div>
      </Card>

      <Card class="p-4 sm:p-5 lg:p-6 bg-white dark:bg-slate-800 hover:shadow-lg transition-all duration-200">
        <div class="text-center">
          <div class="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mx-auto mb-3">
            <TrendingUp class="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <h3 class="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">Income</h3>
          <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4">Manage your income sources</p>
          <Button variant="outline" size="sm" class="w-full" @click="$router.push('/income')">
            Manage Income
          </Button>
        </div>
      </Card>

      <Card class="p-4 sm:p-5 lg:p-6 bg-white dark:bg-slate-800 hover:shadow-lg transition-all duration-200">
        <div class="text-center">
          <div class="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Receipt class="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <h3 class="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">Expenses</h3>
          <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4">Track your expenses</p>
          <Button variant="outline" size="sm" class="w-full" @click="$router.push('/expenses')">
            View Expenses
          </Button>
        </div>
      </Card>
    </div>

    <!-- Development Tools -->
    <Card class="p-4 sm:p-5 lg:p-6 bg-white dark:bg-slate-800">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Development Tools</h3>
        <span class="text-xs sm:text-sm text-gray-500 dark:text-gray-400">For testing purposes</span>
      </div>
      
      <div class="space-y-4">
        <div class="flex flex-col sm:flex-row gap-3">
          <Button 
            theme="gray" 
            variant="solid" 
            icon-left="code" 
            @click="ping.fetch" 
            :loading="ping.loading"
            class="flex-1"
          >
            Send Ping Request
          </Button>
          
          <Button @click="showDialog = true" variant="outline" class="flex-1">
            Open Dialog
          </Button>
          
          <Button @click="session.logout.submit()" variant="outline" class="flex-1 text-red-600 dark:text-red-400">
            Logout
          </Button>
        </div>

        <!-- Ping Response -->
        <div v-if="ping.data" class="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
          <p class="text-sm text-gray-700 dark:text-gray-300 mb-2">Ping Response:</p>
          <code class="text-xs text-gray-600 dark:text-gray-400">{{ ping.data }}</code>
        </div>

        <!-- Debug Info (collapsed by default) -->
        <details class="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
          <summary class="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">Debug Information</summary>
          <pre class="text-xs text-gray-600 dark:text-gray-400 mt-2 overflow-x-auto">{{ ping }}</pre>
        </details>
      </div>
    </Card>

    <!-- Dialog -->
    <Dialog title="Sample Dialog" v-model="showDialog">
      <div class="p-4">
        <p class="text-gray-700 dark:text-gray-300">This is a sample dialog for testing purposes.</p>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { useAdvancedTheme } from "@/composables/useAdvancedTheme"
import { session } from "@/data/session"
import { Button, Card, Dialog } from "frappe-ui"
import { createResource } from "frappe-ui"
import { BarChart3, Heart, Receipt, TrendingUp } from "lucide-vue-next"
import { ref } from "vue"

const ping = createResource({
	url: "ping",
	auto: true,
})

const showDialog = ref(false)

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
