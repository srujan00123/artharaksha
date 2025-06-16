<template>
  <div class="admin-notification-center">
    <div class="max-w-4xl mx-auto p-6">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">Admin Notification Center</h1>
      
      <!-- Role-based Notifications -->
      <div class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20-md p-6 mb-6">
        <h2 class="text-xl font-semibold mb-4 text-blue-600 dark:text-blue-400">👥 Role-based Notifications</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">Title</label>
              <input
                v-model="roleNotification.title"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:ring-blue-400 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                placeholder="Role-specific notification"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">Message</label>
              <textarea
                v-model="roleNotification.message"
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:ring-blue-400 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                placeholder="Message for specific roles..."
              ></textarea>
            </div>
          </div>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">Target Roles</label>
              <div class="space-y-2 border border-gray-300 dark:border-gray-600 rounded-lg p-3">
                <label v-for="role in availableRoles" :key="role" class="flex items-center">
                  <input
                    type="checkbox"
                    :value="role"
                    v-model="roleNotification.roles"
                    class="mr-2"
                  />
                  <span class="text-sm">{{ role }}</span>
                </label>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">Priority</label>
              <select
                v-model="roleNotification.type"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:ring-blue-400 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
              >
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="error">Critical</option>
                <option value="success">Success</option>
              </select>
            </div>
            <button
              @click="sendRoleNotification"
              :disabled="loading.role || roleNotification.roles.length === 0"
              class="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white dark:text-black px-4 py-2 rounded-lg transition-colors font-medium"
            >
              {{ loading.role ? 'Sending...' : `Send to ${roleNotification.roles.length} role(s)` }}
            </button>
          </div>
        </div>
      </div>

      <!-- Room-based Notifications -->
      <div class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20-md p-6 mb-6">
        <h2 class="text-xl font-semibold mb-4 text-green-600 dark:text-green-400">🏠 Room-based Notifications</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">Title</label>
              <input
                v-model="roomNotification.title"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:ring-green-400 focus:border-green-500 dark:focus:border-green-400"
                placeholder="Room notification"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">Message</label>
              <textarea
                v-model="roomNotification.message"
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:ring-green-400 focus:border-green-500 dark:focus:border-green-400"
                placeholder="Message for specific room..."
              ></textarea>
            </div>
          </div>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">Target Room</label>
              <select
                v-model="roomNotification.room"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:ring-green-400 focus:border-green-500 dark:focus:border-green-400"
              >
                <option value="">Select Room</option>
                <option value="all">All Users</option>
                <option value="admin">Administrators</option>
                <option value="artha_users">Artha Users</option>
                <option value="insights_users">Insights Users</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">Priority</label>
              <select
                v-model="roomNotification.type"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:ring-green-400 focus:border-green-500 dark:focus:border-green-400"
              >
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="error">Critical</option>
                <option value="success">Success</option>
              </select>
            </div>
            <button
              @click="sendRoomNotification"
              :disabled="loading.room || !roomNotification.room"
              class="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white dark:text-black px-4 py-2 rounded-lg transition-colors font-medium"
            >
              {{ loading.room ? 'Sending...' : 'Send to Room' }}
            </button>
          </div>
        </div>
      </div>

      <!-- User-specific Notifications -->
      <div class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20-md p-6 mb-6">
        <h2 class="text-xl font-semibold mb-4 text-purple-600 dark:text-purple-400">👤 User-specific Notifications</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">Title</label>
              <input
                v-model="userNotification.title"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:focus:border-purple-400"
                placeholder="Personal notification"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">Message</label>
              <textarea
                v-model="userNotification.message"
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:focus:border-purple-400"
                placeholder="Message for specific user..."
              ></textarea>
            </div>
          </div>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">Target User (Email)</label>
              <input
                v-model="userNotification.targetUser"
                type="email"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:focus:border-purple-400"
                placeholder="user@example.com"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">Priority</label>
              <select
                v-model="userNotification.type"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:focus:border-purple-400"
              >
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="error">Critical</option>
                <option value="success">Success</option>
              </select>
            </div>
            <button
              @click="sendUserNotification"
              :disabled="loading.user || !userNotification.targetUser"
              class="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white dark:text-black px-4 py-2 rounded-lg transition-colors font-medium"
            >
              {{ loading.user ? 'Sending...' : 'Send to User' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Recent Admin Actions -->
      <div class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20-md p-6">
        <h2 class="text-xl font-semibold mb-4">📊 Recent Admin Actions</h2>
        <div v-if="recentActions.length === 0" class="text-gray-500 dark:text-gray-400 dark:text-gray-500 text-center py-8">
          No recent admin actions
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="action in recentActions.slice(0, 10)"
            :key="action.id"
            class="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
          >
            <div class="flex justify-between items-start">
              <div class="flex-1">
                <h3 class="font-medium text-gray-900 dark:text-gray-100">{{ action.type }}</h3>
                <p class="text-gray-600 dark:text-gray-400 dark:text-gray-500 mt-1">{{ action.message }}</p>
                <div class="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
                  <span>{{ formatTime(action.timestamp) }}</span>
                  <span class="capitalize">{{ action.target }}</span>
                </div>
              </div>
              <div
                :class="[
                  'px-2 py-1 rounded-full text-xs font-medium',
                  action.success ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                ]"
              >
                {{ action.success ? 'Success' : 'Failed' }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAdvancedTheme } from "@/composables/useAdvancedTheme"
import { call } from "frappe-ui"
import { onMounted, reactive, ref } from "vue"

const loading = ref({
	role: false,
	room: false,
	user: false,
})

const roleNotification = reactive({
	title: "",
	message: "",
	roles: [],
	type: "info",
})

const roomNotification = reactive({
	title: "",
	message: "",
	room: "",
	type: "info",
})

const userNotification = reactive({
	title: "",
	message: "",
	targetUser: "",
	type: "info",
})

const availableRoles = ref([
	"Artha User",
	"Insights User",
	"System Manager",
	"Administrator",
])

const recentActions = ref([])

// Send role-based notification
const sendRoleNotification = async () => {
	loading.value.role = true
	try {
		const result = await call(
			"artha.api.notifications.send_role_based_notification",
			{
				roles: roleNotification.roles,
				title: roleNotification.title,
				message: roleNotification.message,
				notification_type: roleNotification.type,
			},
		)

		addRecentAction(
			"Role-based Notification",
			`Sent to ${roleNotification.roles.join(", ")}`,
			roleNotification.roles.join(", "),
			true,
		)

		// Reset form
		roleNotification.title = ""
		roleNotification.message = ""
		roleNotification.roles = []
		roleNotification.type = "info"
	} catch (error) {
		console.error("Error sending role notification:", error)
		addRecentAction(
			"Role-based Notification",
			"Failed to send",
			roleNotification.roles.join(", "),
			false,
		)
	} finally {
		loading.value.role = false
	}
}

// Send room notification
const sendRoomNotification = async () => {
	loading.value.room = true
	try {
		const result = await call(
			"artha.api.notifications.send_room_notification",
			{
				room: roomNotification.room,
				title: roomNotification.title,
				message: roomNotification.message,
				notification_type: roomNotification.type,
			},
		)

		addRecentAction(
			"Room Notification",
			`Sent to room: ${roomNotification.room}`,
			roomNotification.room,
			true,
		)

		// Reset form
		roomNotification.title = ""
		roomNotification.message = ""
		roomNotification.room = ""
		roomNotification.type = "info"
	} catch (error) {
		console.error("Error sending room notification:", error)
		addRecentAction(
			"Room Notification",
			"Failed to send",
			roomNotification.room,
			false,
		)
	} finally {
		loading.value.room = false
	}
}

// Send user notification
const sendUserNotification = async () => {
	loading.value.user = true
	try {
		const result = await call(
			"artha.api.notifications.send_user_notification",
			{
				target_user: userNotification.targetUser,
				title: userNotification.title,
				message: userNotification.message,
				notification_type: userNotification.type,
			},
		)

		addRecentAction(
			"User Notification",
			`Sent to user: ${userNotification.targetUser}`,
			userNotification.targetUser,
			true,
		)

		// Reset form
		userNotification.title = ""
		userNotification.message = ""
		userNotification.targetUser = ""
		userNotification.type = "info"
	} catch (error) {
		console.error("Error sending user notification:", error)
		addRecentAction(
			"User Notification",
			"Failed to send",
			userNotification.targetUser,
			false,
		)
	} finally {
		loading.value.user = false
	}
}

// Add recent action
const addRecentAction = (type, message, target, success) => {
	recentActions.value.unshift({
		id: Date.now(),
		type,
		message,
		target,
		success,
		timestamp: new Date(),
	})

	// Keep only last 20 actions
	if (recentActions.value.length > 20) {
		recentActions.value = recentActions.value.slice(0, 20)
	}
}

// Format time
const formatTime = (timestamp) => {
	return new Date(timestamp).toLocaleString()
}

onMounted(() => {
	// Load any initial data if needed
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

<style scoped>
.admin-notification-center {
  min-height: 100vh;
  background-color: #f9fafb;
}
</style> 