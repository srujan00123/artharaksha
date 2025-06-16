<template>
    <div class="h-screen bg-gray-50 dark:bg-slate-900 flex flex-col overflow-hidden">
        <!-- Main Top Navbar -->
        <header class="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700">
            <div class="flex items-center justify-between px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
                <!-- Left side: Logo + Main Navigation -->
                <div class="flex items-center space-x-4 sm:space-x-6 min-w-0 flex-1">
                    <!-- Logo -->
                    <div class="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
                        <div class="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center">
                            <img src="/logo.svg" alt="Artha Raksha Logo" class="w-full h-full object-contain" />
                        </div>
                        <h1 class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white truncate">Artha Raksha</h1>
                    </div>

                    <!-- Main navigation tabs -->
                    <div class="hidden md:flex space-x-1 flex-1 justify-center">
                        <button v-for="tab in mainTabs" :key="tab.name" @click="navigateToSection(tab.path)"
                            class="flex items-center space-x-2 px-3 lg:px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap"
                            :class="isInSection(tab.section)
                                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700'">
                            <component :is="tab.icon" class="w-4 h-4" />
                            <span class="hidden lg:inline">{{ tab.label }}</span>
                        </button>
                    </div>
                </div>

                <!-- Right side: User menu -->
                <div class="flex items-center space-x-1 sm:space-x-2 lg:space-x-4 flex-shrink-0">
                    <!-- Theme Toggle -->
                    <ThemeToggle />
                    <!-- Notification Center -->
                    <NotificationCenter />
                    <div class="relative" data-profile-dropdown>
                        <button @click="profileDropdownOpen = !profileDropdownOpen"
                            class="flex items-center space-x-2 lg:space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700">
                            <div class="w-8 h-8 bg-blue-500 dark:bg-blue-600 rounded-full flex items-center justify-center">
                                <span class="text-sm font-medium text-white">
                                    {{ userInitials }}
                                </span>
                            </div>
                            <div class="hidden sm:block text-left">
                                <div class="text-sm font-medium text-gray-700 dark:text-gray-200 max-w-24 truncate">{{ userDisplayName }}
                                </div>
                                <div class="text-xs text-gray-500 dark:text-gray-400 max-w-24 truncate">{{ session.user }}</div>
                            </div>
                            <ChevronDown class="w-4 h-4 text-gray-400 dark:text-gray-500 hidden sm:block" />
                        </button>

                        <!-- Profile dropdown -->
                        <div v-show="profileDropdownOpen"
                            class="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-600 py-1 z-50">
                            <div class="px-4 py-3 border-b border-gray-100 dark:border-slate-600">
                                <div class="text-sm font-medium text-gray-900 dark:text-white">{{ userDisplayName }}</div>
                                <div class="text-xs text-gray-500 dark:text-gray-400">{{ session.user }}</div>
                            </div>
                            <router-link to="/profile"
                                class="flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700"
                                @click="profileDropdownOpen = false">
                                <User class="w-4 h-4 mr-3" />
                                Profile Settings
                            </router-link>
                            <button @click="handleLogout"
                                class="w-full flex items-center px-4 py-3 text-sm text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900">
                                <LogOut class="w-4 h-4 mr-3" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </header>

        <!-- Mobile Main Navigation (below header on mobile) -->
        <div class="md:hidden bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
            <div class="px-3 py-3">
                <div class="flex space-x-1 overflow-x-auto scrollbar-hide">
                    <button v-for="tab in mainTabs" :key="tab.name" @click="navigateToSection(tab.path)"
                        class="flex items-center space-x-2 px-4 py-3 text-sm font-medium rounded-lg whitespace-nowrap flex-shrink-0 min-w-0"
                        :class="isInSection(tab.section)
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700'">
                        <component :is="tab.icon" class="w-5 h-5" />
                        <span class="truncate">{{ tab.label }}</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- Secondary Navigation Bar -->
        <nav class="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 shadow-sm">
            <div class="px-3 sm:px-4 lg:px-6">
                <div class="flex items-center justify-between py-2 sm:py-3">
                    <!-- Section title and breadcrumb -->
                    <div class="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                        <h2 class="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">{{ currentSectionTitle }}
                        </h2>
                        <span class="text-gray-400 dark:text-gray-500 hidden sm:inline">•</span>
                        <span class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate hidden sm:inline">{{
                            currentPageTitle }}</span>
                    </div>
                </div>

                <!-- Secondary navigation items -->
                <div class="flex space-x-1 overflow-x-auto pb-3 scrollbar-hide">
                    <router-link v-for="item in currentSecondaryItems" :key="item.name" :to="item.path"
                        class="flex items-center space-x-2 px-3 sm:px-4 py-2 sm:py-3 text-sm font-medium rounded-lg whitespace-nowrap flex-shrink-0 min-w-0"
                        :class="isActiveRoute(item.path)
                            ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-700'">
                        <component :is="item.icon" class="w-4 h-4" />
                        <span class="truncate">{{ item.label }}</span>
                    </router-link>
                </div>
            </div>
        </nav>

        <!-- Page content -->
        <main class="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-900">
            <router-view />
        </main>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { session } from '@/data/session'
import { userResource } from '@/data/user'
import NotificationCenter from '@/components/common/NotificationCenter.vue'
import ThemeToggle from '@/components/common/ThemeToggle.vue'
import { useAdvancedTheme } from '@/composables/useAdvancedTheme'

import {
	BarChart3,
	BookOpen,
	Building,
	Calculator,
	Calendar,
	ChevronDown,
	CreditCard,
	DollarSign,
	FileText,
	HandHeart,
	Heart,
	LayoutDashboard,
	LogOut,
	PieChart,
	Receipt,
	Shield,
	Stethoscope,
	TrendingUp,
	User,
	Users,
} from "lucide-vue-next"

const route = useRoute()
const router = useRouter()
const profileDropdownOpen = ref(false)
// Development mode check
const isDevelopment = computed(() => {
    return process.env.NODE_ENV === 'development' || import.meta.env.DEV
})

// Main navigation sections
const mainTabs = [
    {
        name: 'dashboard',
        label: 'Dashboard',
        path: '/dashboard',
        section: 'main',
        icon: BarChart3
    },
    {
        name: 'income',
        label: 'Income',
        path: '/income',
        section: 'income',
        icon: TrendingUp
    },
    {
        name: 'expenses',
        label: 'Expenses',
        path: '/expenses',
        section: 'expenses',
        icon: TrendingUp
    },
    {
        name: 'care-support',
        label: 'Care & Support',
        path: '/care-support',
        section: 'care-support',
        icon: Heart
    },
    {
        name: 'applications-claims',
        label: 'Applications & Claims',
        path: '/applications-claims',
        section: 'applications-claims',
        icon: FileText
    },
    {
        name: 'profile',
        label: 'Profile',
        path: '/profile',
        section: 'profile',
        icon: User
    }
]

// Secondary navigation items - cached as constant
const secondaryItems = {
    dashboard: [
        { name: 'overview', label: 'Overview', path: '/dashboard', icon: LayoutDashboard }
    ],
    income: [
        { name: 'management', label: 'Management', path: '/income/management', icon: DollarSign },
        { name: 'reports', label: 'Reports', path: '/income/reports', icon: BarChart3 }
    ],
    expenses: [
        { name: 'overview', label: 'Overview', path: '/expenses/overview', icon: Receipt },
        { name: 'categories', label: 'Categories', path: '/expenses/analytics/categories', icon: BarChart3 },
        { name: 'medical', label: 'Medical Analytics', path: '/expenses/analytics/medical', icon: Heart },
        { name: 'trends', label: 'Trends', path: '/expenses/analytics/trends', icon: TrendingUp }
    ],
    'care-support': [
        { name: 'conditions', label: 'Health Conditions', path: '/care-support/conditions', icon: Stethoscope },
        { name: 'programs', label: 'Schemes & Programs', path: '/care-support/programs', icon: Building },
        { name: 'resources', label: 'Support Resources', path: '/care-support/resources', icon: BookOpen }
    ],
    'applications-claims': [
        { name: 'applications', label: 'My Applications', path: '/applications-claims/applications', icon: FileText },
        { name: 'claims', label: 'Claims & Benefits', path: '/applications-claims/claims', icon: CreditCard }
    ]
}

// Get current section based on route
const currentSection = computed(() => {
    const path = route.path
    if (path.startsWith('/income')) return 'income'
    if (path.startsWith('/expenses')) return 'expenses'
    if (path.startsWith('/care-support')) return 'care-support'
    if (path.startsWith('/applications-claims')) return 'applications-claims'
    if (path.startsWith('/profile')) return 'profile'
    return 'main'
})

const currentSectionTitle = computed(() => {
    const sectionTitles = {
        main: 'Dashboard',
        income: 'Income Management',
        expenses: 'Expense Management',
        'care-support': 'Care & Support',
        'applications-claims': 'Applications & Claims',
        profile: 'Profile Settings'
    }
    return sectionTitles[currentSection.value] || 'Dashboard'
})

const currentSecondaryItems = computed(() => {
    return secondaryItems[currentSection.value] || secondaryItems.dashboard
})

function getCurrentPageTitle() {
    const currentItem = currentSecondaryItems.value.find(item => item.path === route.path)
    return currentItem ? currentItem.label : 'Page'
}

function isActiveRoute(path) {
	return route.path === path
}

function isInSection(section) {
	return currentSection.value === section
}

function navigateToSection(path) {
	router.push(path)
}

// Optimized user profile data
const userDisplayName = computed(() => {
	if (userResource.data?.full_name) {
		return userResource.data.full_name
	}
	if (session.user) {
		const email = session.user
		if (email.includes("@")) {
			return email
				.split("@")[0]
				.replace(/[._]/g, " ")
				.replace(/\b\w/g, (l) => l.toUpperCase())
		}
		return email
	}
	return "User"
})

const userInitials = computed(() => {
	const name = userDisplayName.value
	if (name === "User") return "U"
	return name
		.split(" ")
		.map((word) => word[0])
		.join("")
		.substring(0, 2)
		.toUpperCase()
})

// Handle logout
function handleLogout() {
	profileDropdownOpen.value = false
	session.logout.submit()
}

// Close dropdown when clicking outside
function handleClickOutside(event) {
    const dropdown = event.target.closest('.relative')
    if (!dropdown) {
        profileDropdownOpen.value = false
    }
}

// Lifecycle management
onMounted(() => {
    document.addEventListener('click', handleClickOutside)
    if (!userResource.data && session.isLoggedIn) {
        userResource.fetch()
    }
    
    // Note: Notifications are initialized by NotificationCenter component
})

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
    
    // Note: Notifications cleanup is handled by NotificationCenter component
})

// Advanced theme management
const { currentTheme, isDark, setTheme, themes } = useAdvancedTheme()

// Theme utility methods
const getFinancialStatusClass = (type, intensity = '600') => {
  const baseClasses = {
    income: `text-green-${intensity} dark:text-green-400`,
    expense: `text-red-${intensity} dark:text-red-400`,
    medical: `text-blue-${intensity} dark:text-blue-400`,
    warning: `text-yellow-${intensity} dark:text-yellow-400`,
    alert: `text-orange-${intensity} dark:text-orange-400`,
    neutral: `text-gray-${intensity} dark:text-gray-400`
  }
  return baseClasses[type] || baseClasses.neutral
}

const getThemeSurfaceClass = (variant = 'primary') => {
  const variants = {
    primary: 'bg-white dark:bg-gray-800',
    secondary: 'bg-gray-50 dark:bg-gray-900',
    tertiary: 'bg-gray-100 dark:bg-gray-800'
  }
  return variants[variant] || variants.primary
}

const getThemeTextClass = (intensity = '600') => {
  const intensityMap = {
    '900': 'text-gray-900 dark:text-gray-100',
    '800': 'text-gray-800 dark:text-gray-200',
    '700': 'text-gray-700 dark:text-gray-300',
    '600': 'text-gray-600 dark:text-gray-400',
    '500': 'text-gray-500 dark:text-gray-400',
    '400': 'text-gray-400 dark:text-gray-500'
  }
  return intensityMap[intensity] || intensityMap['600']
}
</script>

<style scoped>
/* Hide scrollbar but keep functionality */
.scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
    display: none;
}
</style>