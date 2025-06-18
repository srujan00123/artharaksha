/**
 * User Store
 * Manages user profile data and preferences
 */

import { call, createResource } from "frappe-ui"
import { defineStore } from "pinia"
import { session } from "../data/session.js"
import { API_ENDPOINTS } from "../services/api-service.js"
import { CACHE_KEYS, cacheService } from "../services/cache-service.js"
import type { User } from "../types/Core/User"

// Cache configuration
const CACHE_EXPIRY = {
	USER_PROFILE: 10 * 60 * 1000, // 10 minutes
	USER_PREFERENCES: 30 * 60 * 1000, // 30 minutes
}

// User preferences interface
interface UserPreferences {
	emailNotifications: boolean
	cheAlerts: boolean
	monthlyReports: boolean
	language: string
	timeZone: string
	theme: "Light" | "Dark" | "Automatic"
}

// Store state interface
interface UserStoreState {
	currentUser: User | null
	preferences: UserPreferences
	loading: boolean
	error: string
	lastFetch: number | null
}

// Default preferences
const getDefaultPreferences = (): UserPreferences => ({
	emailNotifications: true,
	cheAlerts: true,
	monthlyReports: false,
	language: "en",
	timeZone: "Asia/Kolkata",
	theme: "Light",
})

export const useUserStore = defineStore("user", {
	state: (): UserStoreState => ({
		currentUser: null,
		preferences: getDefaultPreferences(),
		loading: false,
		error: "",
		lastFetch: null,
	}),

	getters: {
		// User display information
		userDisplayName: (state): string => {
			if (state.currentUser?.full_name) {
				return state.currentUser.full_name
			}
			if (state.currentUser?.email) {
				const email = state.currentUser.email
				if (email.includes("@")) {
					return email
						.split("@")[0]
						.replace(/[._]/g, " ")
						.replace(/\b\w/g, (l) => l.toUpperCase())
				}
				return email
			}
			return "User"
		},

		userInitials: (state): string => {
			const name =
				state.currentUser?.full_name || state.currentUser?.email || "User"
			if (name === "User") return "U"
			return name
				.split(" ")
				.map((word) => word[0])
				.join("")
				.substring(0, 2)
				.toUpperCase()
		},

		// Check if user data is loaded
		isLoaded: (state): boolean => {
			return !!state.currentUser && !!state.lastFetch
		},

		// Check if cache is valid
		isCacheValid: (state): boolean => {
			if (!state.lastFetch) return false
			return Date.now() - state.lastFetch < CACHE_EXPIRY.USER_PROFILE
		},
	},

	actions: {
		/**
		 * Load current user profile
		 */
		async loadUserProfile(forceRefresh = false): Promise<User | null> {
			try {
				// Check cache first
				if (!forceRefresh && this.isCacheValid && this.currentUser) {
					return this.currentUser
				}

				// Check cache service
				if (!forceRefresh) {
					const cached = cacheService.get(CACHE_KEYS.USER_PROFILE)
					if (cached) {
						this.currentUser = cached
						this.lastFetch = Date.now()
						return cached
					}
				}

				this.loading = true
				this.error = ""

				// Try custom profile endpoint first (more efficient)
				try {
					const userData = await call(
						API_ENDPOINTS.AUTH.GET_CURRENT_USER_PROFILE,
					)

					if (userData) {
						this.currentUser = userData as User
						this.lastFetch = Date.now()

						// Cache the user data
						cacheService.set(CACHE_KEYS.USER_PROFILE, userData, {
							maxAge: CACHE_EXPIRY.USER_PROFILE,
						})

						return this.currentUser
					}
				} catch (profileError) {
					console.warn(
						"Custom profile endpoint failed, falling back to standard get:",
						profileError,
					)

					// Fallback to standard frappe.client.get endpoint
					const userData = await call("frappe.client.get", {
						doctype: "User",
						name: session.user,
						fields: [
							"name",
							"email",
							"first_name",
							"middle_name",
							"last_name",
							"full_name",
							"phone",
							"mobile_no",
							"location",
							"bio",
							"user_image",
							"language",
							"time_zone",
							"desk_theme",
							"enabled",
							"user_type",
							"last_active",
							"creation",
							"modified",
						],
					})

					if (userData) {
						this.currentUser = userData as User
						this.lastFetch = Date.now()

						// Cache the user data
						cacheService.set(CACHE_KEYS.USER_PROFILE, userData, {
							maxAge: CACHE_EXPIRY.USER_PROFILE,
						})

						return this.currentUser
					}
				}

				throw new Error("Failed to load user profile")
			} catch (error: any) {
				this.error = error.message || "Failed to load user profile"
				console.error("Failed to load user profile:", error)
				throw error
			} finally {
				this.loading = false
			}
		},

		/**
		 * Update user profile
		 */
		async updateUserProfile(updates: Partial<User>): Promise<User> {
			try {
				this.loading = true
				this.error = ""

				// Use the custom update profile endpoint if available
				try {
					await call("artha.api.auth.update_user_profile", updates)
				} catch (customError) {
					console.warn(
						"Custom profile update failed, using standard method:",
						customError,
					)

					// Fallback to standard frappe.client.set_value for multiple fields
					for (const [field, value] of Object.entries(updates)) {
						await call("frappe.client.set_value", {
							doctype: "User",
							name: session.user,
							fieldname: field,
							value: value,
						})
					}
				}

				// Reload user data
				await this.loadUserProfile(true)

				return this.currentUser!
			} catch (error: any) {
				this.error = error.message || "Failed to update user profile"
				console.error("Failed to update user profile:", error)
				throw error
			} finally {
				this.loading = false
			}
		},

		/**
		 * Load user preferences
		 */
		async loadUserPreferences(forceRefresh = false): Promise<UserPreferences> {
			try {
				// Check cache first
				if (!forceRefresh) {
					const cached = cacheService.get(CACHE_KEYS.USER_PREFERENCES)
					if (cached) {
						this.preferences = { ...getDefaultPreferences(), ...cached }
						return this.preferences
					}
				}

				// Load from user document
				if (this.currentUser) {
					const preferences: UserPreferences = {
						emailNotifications: true, // Default, could be stored in custom field
						cheAlerts: true, // Default, could be stored in custom field
						monthlyReports: false, // Default, could be stored in custom field
						language: this.currentUser.language || "en",
						timeZone: this.currentUser.time_zone || "Asia/Kolkata",
						theme: this.currentUser.desk_theme || "Light",
					}

					this.preferences = preferences

					// Cache preferences
					cacheService.set(CACHE_KEYS.USER_PREFERENCES, preferences, {
						maxAge: CACHE_EXPIRY.USER_PREFERENCES,
					})

					return preferences
				}

				return getDefaultPreferences()
			} catch (error: any) {
				console.error("Failed to load user preferences:", error)
				return getDefaultPreferences()
			}
		},

		/**
		 * Update user preferences
		 */
		async updateUserPreferences(
			updates: Partial<UserPreferences>,
		): Promise<void> {
			try {
				this.preferences = { ...this.preferences, ...updates }

				// Update relevant user fields
				const userUpdates: Partial<User> = {}
				if (updates.language) userUpdates.language = updates.language
				if (updates.timeZone) userUpdates.time_zone = updates.timeZone
				if (updates.theme) userUpdates.desk_theme = updates.theme

				// Update user document if needed
				if (Object.keys(userUpdates).length > 0) {
					await this.updateUserProfile(userUpdates)
				}

				// Cache updated preferences
				cacheService.set(CACHE_KEYS.USER_PREFERENCES, this.preferences, {
					maxAge: CACHE_EXPIRY.USER_PREFERENCES,
				})
			} catch (error: any) {
				console.error("Failed to update user preferences:", error)
				throw error
			}
		},

		/**
		 * Change user password
		 */
		async changePassword(
			oldPassword: string,
			newPassword: string,
		): Promise<void> {
			try {
				this.loading = true
				this.error = ""

				// Use standard password change endpoint
				await call("frappe.client.change_password", {
					new_password: newPassword,
					old_password: oldPassword,
				})
			} catch (error: any) {
				this.error = error.message || "Failed to change password"
				console.error("Failed to change password:", error)
				throw error
			} finally {
				this.loading = false
			}
		},

		/**
		 * Upload user image
		 */
		async uploadUserImage(file: File): Promise<string> {
			try {
				this.loading = true
				this.error = ""

				// Upload file using standard upload endpoint
				const formData = new FormData()
				formData.append("file", file, file.name)
				formData.append("doctype", "User")
				formData.append("docname", session.user || "")
				formData.append("fieldname", "user_image")
				formData.append("is_private", "0")

				const response = await fetch("/api/method/upload_file", {
					method: "POST",
					body: formData,
					headers: {
						"X-Frappe-CSRF-Token": (window as any).csrf_token,
					},
				})

				if (!response.ok) {
					throw new Error("Upload failed")
				}

				const uploadResult = await response.json()
				const fileUrl = uploadResult.message?.file_url || uploadResult.file_url

				// Update user with new image using standard update endpoint
				await this.updateUserProfile({
					user_image: fileUrl,
				})

				return fileUrl
			} catch (error: any) {
				this.error = error.message || "Failed to upload user image"
				console.error("Failed to upload user image:", error)
				throw error
			} finally {
				this.loading = false
			}
		},

		/**
		 * Clear cache and reset state
		 */
		clearCache(): void {
			this.currentUser = null
			this.preferences = getDefaultPreferences()
			this.lastFetch = null
			this.error = ""

			// Clear cache service
			cacheService.delete(CACHE_KEYS.USER_PROFILE)
			cacheService.delete(CACHE_KEYS.USER_PREFERENCES)
		},

		/**
		 * Reset store state
		 */
		reset(): void {
			this.currentUser = null
			this.preferences = getDefaultPreferences()
			this.loading = false
			this.error = ""
			this.lastFetch = null
		},

		/**
		 * Initialize store
		 */
		async initialize(): Promise<void> {
			if (session.user && session.user !== "Guest") {
				try {
					await this.loadUserProfile()
					await this.loadUserPreferences()
				} catch (error) {
					console.error("Failed to initialize user store:", error)
				}
			}
		},
	},
})
