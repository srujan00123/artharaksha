<template>
    <div class="relative">
        <!-- Notification Bell Button -->
        <button @click="toggleNotifications"
            class="relative p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <Bell class="w-5 h-5" />
            <!-- Notification Badge -->
            <span v-if="unreadCount > 0"
                class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                {{ unreadCount > 99 ? '99+' : unreadCount }}
            </span>
            <!-- Connection Status Indicator -->
            <span v-if="!isConnected"
                class="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs rounded-full h-3 w-3 animate-pulse"
                title="Disconnected">
            </span>
        </button>

        <!-- Notification Dropdown -->
        <div v-show="showNotifications"
            class="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-hidden">
            <!-- Header -->
            <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div class="flex items-center space-x-2">
                    <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Notifications</h3>
                    <!-- Connection Status -->
                    <div class="flex items-center space-x-1">
                        <div class="w-2 h-2 rounded-full" 
                             :class="isConnected ? 'bg-green-500' : 'bg-red-500'"
                             :title="isConnected ? 'Connected' : 'Disconnected'"></div>
                        <span class="text-xs text-gray-500 dark:text-gray-400">
                            {{ isConnected ? 'Live' : 'Offline' }}
                        </span>
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    <button v-if="unreadCount > 0" @click="markAllAsRead"
                        class="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800">
                        Mark all read
                    </button>
                    <button @click="clearAllNotifications"
                        class="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700">
                        Clear all
                    </button>
                </div>
            </div>

            <!-- Connection Error Banner -->
            <div v-if="connectionError" 
                 class="px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
                <div class="flex items-center space-x-2">
                    <AlertTriangle class="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                    <span class="text-xs text-yellow-700 dark:text-yellow-300">
                        {{ connectionError }}
                    </span>
                </div>
            </div>

            <!-- Notifications List -->
            <div class="max-h-80 overflow-y-auto">
                <div v-if="notificationsList.length === 0" class="px-4 py-8 text-center">
                    <Bell class="w-8 h-8 mx-auto text-gray-400 dark:text-gray-500 mb-2" />
                    <p class="text-sm text-gray-500 dark:text-gray-400">No notifications yet</p>
                    <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {{ isConnected ? 'Connected and ready' : 'Waiting for connection...' }}
                    </p>
                </div>

                <div v-else class="divide-y divide-gray-100 dark:divide-gray-700">
                    <div v-for="notification in notificationsList" :key="notification.id"
                        class="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                        :class="{ 'bg-blue-50 dark:bg-blue-900/20': !notification.read }"
                        @click="markAsRead(notification)">
                        <div class="flex items-start space-x-3">
                            <!-- Icon based on type -->
                            <div class="flex-shrink-0 mt-0.5">
                                <component :is="getNotificationIcon(notification.type)" class="w-5 h-5"
                                    :class="getNotificationIconColor(notification.type)" />
                            </div>

                            <!-- Content -->
                            <div class="flex-1 min-w-0">
                                <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {{ notification.title }}
                                </p>
                                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    {{ notification.message }}
                                </p>
                                <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                    {{ formatTime(notification.timestamp) }}
                                </p>
                            </div>

                            <!-- Unread indicator -->
                            <div v-if="!notification.read" class="flex-shrink-0">
                                <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <div class="flex items-center justify-between">
                    <button @click="addTestNotification"
                        class="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 font-medium">
                        Test notification
                    </button>
                    <div class="text-xs text-gray-400 dark:text-gray-500">
                        {{ notificationsList.length }} total
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { call } from "frappe-ui"
import {
	AlertCircle,
	AlertTriangle,
	Bell,
	CheckCircle,
	Info,
} from "lucide-vue-next"
import { computed, onMounted, onUnmounted, ref } from "vue"
import { useNotifications } from "../../composables/useNotifications"

// Local state
const showNotifications = ref(false)

// Composable for notification management
const notificationsComposable = useNotifications()

// Computed properties
const notificationsList = computed(() => {
	try {
		return notificationsComposable.notifications.value || []
	} catch (error) {
		console.error("Failed to get notifications list:", error)
		return []
	}
})

const isConnected = computed(() => {
	try {
		return notificationsComposable.isConnected.value
	} catch (error) {
		console.error("Failed to get connection status:", error)
		return false
	}
})

const connectionError = computed(() => {
	try {
		return notificationsComposable.connectionError.value
	} catch (error) {
		console.error("Failed to get connection error:", error)
		return null
	}
})

const unreadCount = computed(() => {
	try {
		return notificationsList.value.filter((n) => !n.read).length
	} catch (error) {
		console.error("Failed to calculate unread count:", error)
		return 0
	}
})

// Methods
const toggleNotifications = () => {
	showNotifications.value = !showNotifications.value
}

const markAsRead = async (notification) => {
	try {
		await notificationsComposable.markAsRead(notification.id)
	} catch (error) {
		console.error("Failed to mark notification as read:", error)
	}
}

const markAllAsRead = async () => {
	try {
		await notificationsComposable.markAllAsRead()
	} catch (error) {
		console.error("Failed to mark all notifications as read:", error)
	}
}

const clearAllNotifications = async () => {
	try {
		await notificationsComposable.clearAll()
	} catch (error) {
		console.error("Failed to clear all notifications:", error)
	}
}

const addTestNotification = () => {
	try {
		notificationsComposable.addTestNotification()
	} catch (error) {
		console.error("Failed to add test notification:", error)
	}
}

const getNotificationIcon = (type) => {
	const iconMap = {
		success: CheckCircle,
		error: AlertCircle,
		warning: AlertTriangle,
		info: Info,
		default: Bell,
	}
	return iconMap[type] || iconMap.default
}

const getNotificationIconColor = (type) => {
	const colorMap = {
		success: "text-green-500",
		error: "text-red-500",
		warning: "text-yellow-500",
		info: "text-blue-500",
		default: "text-gray-500",
	}
	return colorMap[type] || colorMap.default
}

const formatTime = (timestamp) => {
	try {
		const now = new Date()
		const time = new Date(timestamp)
		const diffInMinutes = Math.floor((now - time) / (1000 * 60))

		if (diffInMinutes < 1) return "Just now"
		if (diffInMinutes < 60) return `${diffInMinutes}m ago`
		if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
		return `${Math.floor(diffInMinutes / 1440)}d ago`
	} catch (error) {
		console.error("Failed to format time:", error)
		return "Unknown time"
	}
}

// Close dropdown when clicking outside
const handleClickOutside = (event) => {
	try {
		if (!event.target.closest(".relative")) {
			showNotifications.value = false
		}
	} catch (error) {
		console.error("Failed to handle click outside:", error)
	}
}

onMounted(() => {
	try {
		document.addEventListener("click", handleClickOutside)

		// Initialize notification system
		notificationsComposable.initialize().then(() => {
			console.log("🔔 NotificationCenter initialized successfully")
		}).catch((error) => {
			console.error("NotificationCenter initialization failed:", error)
		})
	} catch (error) {
		console.error("Failed to mount NotificationCenter:", error)
	}
})

onUnmounted(() => {
	try {
		document.removeEventListener("click", handleClickOutside)
		console.log("🧹 NotificationCenter cleaned up")
	} catch (error) {
		console.error("Failed to unmount NotificationCenter:", error)
	}
})
</script> 