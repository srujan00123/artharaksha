<template>
  <div class="flex h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
    <!-- Sidebar -->
    <div class="w-64 bg-white dark:bg-slate-900/80 dark:backdrop-blur-xl dark:border-r dark:border-slate-700/50 shadow-lg dark:shadow-2xl">
      <!-- Logo -->
      <div class="flex items-center justify-center h-16 px-4 border-b border-gray-200 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/50 dark:backdrop-blur-lg">
        <div class="flex items-center">
          <div class="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span class="text-white font-bold text-lg">A</span>
          </div>
          <span class="ml-2 text-xl font-bold text-gray-900 dark:text-slate-100">Artha</span>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="mt-8 px-4">
        <div class="space-y-2">
          <router-link
            v-for="item in navigation"
            :key="item.name"
            :to="item.href"
            :class="[
              item.current
                ? 'bg-blue-50 dark:bg-blue-500/20 dark:backdrop-blur-lg border-r-2 border-blue-500 text-blue-700 dark:text-blue-300 dark:shadow-lg dark:shadow-blue-500/20'
                : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 dark:hover:backdrop-blur-lg dark:hover:shadow-lg',
              'group flex items-center px-3 py-2 text-sm font-medium rounded-l-lg transition-all duration-300 ease-in-out'
            ]"
          >
            <component
              :is="item.icon"
              :class="[
                item.current
                  ? 'text-blue-500 dark:text-blue-400'
                  : 'text-gray-400 dark:text-slate-400 group-hover:text-gray-500 dark:group-hover:text-slate-300',
                'mr-3 h-5 w-5 transition-colors duration-300'
              ]"
            />
            {{ item.name }}
          </router-link>
        </div>
      </nav>
    </div>

    <!-- Main content -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Header -->
      <header class="bg-white dark:bg-slate-900/80 dark:backdrop-blur-xl shadow-sm dark:shadow-2xl dark:border-b dark:border-slate-700/50">
        <div class="flex items-center justify-between px-6 py-4">
          <div class="flex items-center space-x-4">
            <h1 class="text-2xl font-semibold text-gray-900 dark:text-slate-100">
              {{ currentPageTitle }}
            </h1>
          </div>

          <div class="flex items-center space-x-4">
            <!-- Theme Toggle -->
            <button
              @click="toggleTheme"
              class="p-2 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700/50 dark:hover:backdrop-blur-lg transition-all duration-300 hover:scale-105"
            >
              <SunIcon v-if="isDark" class="h-5 w-5" />
              <MoonIcon v-else class="h-5 w-5" />
            </button>

            <!-- Notifications -->
            <button class="p-2 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700/50 dark:hover:backdrop-blur-lg transition-all duration-300 hover:scale-105 relative">
              <BellIcon class="h-5 w-5" />
              <span class="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse"></span>
            </button>

            <!-- User Menu -->
            <div class="relative" ref="userMenuRef">
              <button
                @click="toggleUserMenu"
                class="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700/50 dark:hover:backdrop-blur-lg transition-all duration-300 hover:scale-105"
              >
                <div class="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shadow-lg">
                  {{ userInitials }}
                </div>
                <div class="text-left">
                  <p class="text-sm font-medium text-gray-900 dark:text-slate-100">{{ user.full_name }}</p>
                  <p class="text-xs text-gray-500 dark:text-slate-400">{{ user.email }}</p>
                </div>
                <ChevronDownIcon class="h-4 w-4 text-gray-400 dark:text-slate-400" />
              </button>

              <!-- User Dropdown -->
              <div
                v-if="showUserMenu"
                class="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800/90 dark:backdrop-blur-xl rounded-lg shadow-lg dark:shadow-2xl border border-gray-200 dark:border-slate-700/50 py-1 z-50"
              >
                <router-link
                  to="/profile"
                  class="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700/50 dark:hover:backdrop-blur-lg transition-all duration-300"
                >
                  <UserIcon class="mr-3 h-4 w-4" />
                  Profile
                </router-link>
                <router-link
                  to="/settings"
                  class="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700/50 dark:hover:backdrop-blur-lg transition-all duration-300"
                >
                  <CogIcon class="mr-3 h-4 w-4" />
                  Settings
                </router-link>
                <hr class="my-1 border-gray-200 dark:border-slate-700/50" />
                <button
                  @click="logout"
                  class="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 dark:hover:backdrop-blur-lg transition-all duration-300"
                >
                  <ArrowRightOnRectangleIcon class="mr-3 h-4 w-4" />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- Page content -->
      <main class="flex-1 overflow-auto bg-gray-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6">
        <div class="max-w-7xl mx-auto">
          <router-view />
        </div>
      </main>
    </div>
  </div>
</template>

<script>
import { useAuthStore } from "@/stores/auth"
import { useThemeStore } from "@/stores/theme"
import {
	ArrowRightOnRectangleIcon,
	BellIcon,
	ChartBarIcon,
	ChevronDownIcon,
	CogIcon,
	CreditCardIcon,
	DocumentTextIcon,
	HeartIcon,
	MoonIcon,
	SunIcon,
	UserIcon,
} from "@heroicons/vue/24/outline"
import { computed, onMounted, onUnmounted, ref } from "vue"
import { useRoute, useRouter } from "vue-router"

export default {
	name: "AppLayout",
	components: {
		ChartBarIcon,
		CreditCardIcon,
		HeartIcon,
		DocumentTextIcon,
		UserIcon,
		SunIcon,
		MoonIcon,
		BellIcon,
		ChevronDownIcon,
		CogIcon,
		ArrowRightOnRectangleIcon,
	},
	setup() {
		const router = useRouter()
		const route = useRoute()
		const authStore = useAuthStore()
		const themeStore = useThemeStore()

		const showUserMenu = ref(false)
		const userMenuRef = ref(null)

		const navigation = computed(() => [
			{
				name: "Dashboard",
				href: "/dashboard",
				icon: ChartBarIcon,
				current: route.path === "/dashboard",
			},
			{
				name: "Income",
				href: "/income",
				icon: CreditCardIcon,
				current: route.path.startsWith("/income"),
			},
			{
				name: "Expenses",
				href: "/expenses",
				icon: CreditCardIcon,
				current: route.path.startsWith("/expenses"),
			},
			{
				name: "Care & Support",
				href: "/care-support",
				icon: HeartIcon,
				current: route.path.startsWith("/care-support"),
			},
			{
				name: "Applications & Claims",
				href: "/applications",
				icon: DocumentTextIcon,
				current: route.path.startsWith("/applications"),
			},
			{
				name: "Profile",
				href: "/profile",
				icon: UserIcon,
				current: route.path === "/profile",
			},
		])

		const currentPageTitle = computed(() => {
			const currentNav = navigation.value.find((item) => item.current)
			return currentNav ? currentNav.name : "Dashboard"
		})

		const user = computed(() => authStore.user)
		const isDark = computed(() => themeStore.isDark)

		const userInitials = computed(() => {
			if (!user.value?.full_name) return "U"
			return user.value.full_name
				.split(" ")
				.map((name) => name[0])
				.join("")
				.toUpperCase()
				.slice(0, 2)
		})

		const toggleTheme = () => {
			themeStore.toggleTheme()
		}

		const toggleUserMenu = () => {
			showUserMenu.value = !showUserMenu.value
		}

		const logout = async () => {
			await authStore.logout()
			router.push("/login")
		}

		const handleClickOutside = (event) => {
			if (userMenuRef.value && !userMenuRef.value.contains(event.target)) {
				showUserMenu.value = false
			}
		}

		onMounted(() => {
			document.addEventListener("click", handleClickOutside)
		})

		onUnmounted(() => {
			document.removeEventListener("click", handleClickOutside)
		})

		return {
			navigation,
			currentPageTitle,
			user,
			userInitials,
			isDark,
			showUserMenu,
			userMenuRef,
			toggleTheme,
			toggleUserMenu,
			logout,
		}
	},
}
</script> 