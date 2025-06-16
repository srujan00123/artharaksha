<template>
  <div class="insights-recommendations">
    <!-- Header Section -->
    <div class="header-section mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100">AI Insights & Recommendations</h2>
          <p class="text-gray-600 dark:text-gray-400 dark:text-gray-500 mt-1">Smart analysis and personalized recommendations for your expenses</p>
        </div>
        <div class="flex items-center space-x-3">
          <span class="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30  text-sm font-medium rounded-full" :class="getFinancialStatusClass('warning', '800')">
            Coming Soon
          </span>
        </div>
      </div>
    </div>

    <!-- Coming Soon Content -->
    <div class="coming-soon-content">
      <div class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20-sm dark:shadow dark:shadow-gray-900/20-gray-900/20 border p-8">
        <div class="text-center">
          <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-6">
            <Lightbulb class="h-8 w-8  dark:text-blue-400" :class="getFinancialStatusClass('medical', '600')" />
          </div>
          
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Advanced Insights Coming Soon
          </h3>
          
          <p class="text-gray-600 dark:text-gray-400 dark:text-gray-500 max-w-md mx-auto mb-8">
            We're developing intelligent insights that will help you make better financial decisions based on your spending patterns and health needs.
          </p>

          <!-- Feature Preview Cards -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <!-- Spending Pattern Analysis -->
            <div class="bg-gray-50 dark:bg-gray-900 dark:bg-gray-100 rounded-lg p-6 text-left">
              <div class="flex items-center mb-3">
                <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <TrendingUp class="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <h4 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Smart Spending Analysis</h4>
              </div>
              <p class="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">
                AI-powered analysis of your spending patterns to identify trends, anomalies, and opportunities for savings.
              </p>
            </div>

            <!-- Health Budget Optimization -->
            <div class="bg-gray-50 dark:bg-gray-900 dark:bg-gray-100 rounded-lg p-6 text-left">
              <div class="flex items-center mb-3">
                <div class="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mr-3">
                  <Heart class="w-4 h-4  dark:text-green-400" :class="getFinancialStatusClass('income', '600')" />
                </div>
                <h4 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Health Budget Optimization</h4>
              </div>
              <p class="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">
                Personalized recommendations to optimize your health spending and reduce catastrophic health expenditure risk.
              </p>
            </div>

            <!-- Financial Planning -->
            <div class="bg-gray-50 dark:bg-gray-900 dark:bg-gray-100 rounded-lg p-6 text-left">
              <div class="flex items-center mb-3">
                <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mr-3">
                  <PieChart class="w-4 h-4  dark:text-blue-400" :class="getFinancialStatusClass('medical', '600')" />
                </div>
                <h4 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Smart Financial Planning</h4>
              </div>
              <p class="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">
                Predictive insights and recommendations for future health expenses and emergency fund planning.
              </p>
            </div>

            <!-- Government Scheme Matching -->
            <div class="bg-gray-50 dark:bg-gray-900 dark:bg-gray-100 rounded-lg p-6 text-left">
              <div class="flex items-center mb-3">
                <div class="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                  <Award class="w-4 h-4  dark:text-orange-400" :class="getFinancialStatusClass('alert', '600')" />
                </div>
                <h4 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Scheme Recommendations</h4>
              </div>
              <p class="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">
                Automatic matching with relevant government health schemes and insurance programs based on your profile.
              </p>
            </div>
          </div>

          <!-- Call to Action -->
          <div class="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p class="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-4">
              Meanwhile, continue tracking your expenses to build a comprehensive profile for better insights.
            </p>
            <router-link 
              to="/expenses/overview"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white dark:text-black bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Track More Expenses
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Award, Heart, Lightbulb, PieChart, TrendingUp } from "lucide-vue-next"
</script>

<style scoped>
.insights-recommendations {
  @apply max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8;
}
</style> 