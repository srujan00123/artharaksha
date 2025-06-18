/**
 * Household Service
 * Basic CRUD operations for household profiles
 * Handles household profile management with TypeScript support
 */

import { call, createListResource } from "frappe-ui"
import { session } from "../data/session.js"
import { API_ENDPOINTS, apiService } from "./api-service.js"
import { CACHE_KEYS, cacheService } from "./cache-service.js"

// Define types for household service
interface HouseholdProfile {
	name: string
	user: string
	creation: string
	modified: string
	[key: string]: any
}

interface HouseholdServiceOptions {
	useCache?: boolean
	forceReload?: boolean
}

interface ProfileData {
	[key: string]: any
}

export class HouseholdService {
	private currentProfile: HouseholdProfile | null = null

	/**
	 * Get current user's household profile
	 */
	async getCurrentProfile(
		options: HouseholdServiceOptions = {},
	): Promise<HouseholdProfile | null> {
		const { useCache = true, forceReload = false } = options

		try {
			// Check cache first
			if (useCache && !forceReload) {
				const cached = cacheService.get(CACHE_KEYS.HOUSEHOLD_PROFILE)
				if (cached) {
					this.currentProfile = cached
					return cached
				}
			}

			// Get profile from API using frappe-ui call
			const result = await apiService.execute(
				call("frappe.client.get_list", {
					doctype: "Household Profile",
					fields: ["*"],
					filters: { user: session.user },
				}),
			)

			const profiles = result || []
			const profile = profiles.length > 0 ? profiles[0] : null

			// If no profile found, return null
			if (!profile) {
				console.warn(
					"HouseholdService: No household profile found for current user",
				)
				this.currentProfile = null
				return null
			}

			// Cache the result
			if (useCache && profile) {
				cacheService.set(CACHE_KEYS.HOUSEHOLD_PROFILE, profile)
			}

			this.currentProfile = profile
			return profile
		} catch (error) {
			console.error(
				"HouseholdService: Failed to load household profile:",
				error,
			)
			// Don't throw error - let calling services handle gracefully
			return null
		}
	}

	/**
	 * Create household profile
	 */
	async createProfile(profileData: ProfileData): Promise<HouseholdProfile> {
		try {
			const result = await apiService.execute(
				call("frappe.client.insert", {
					doc: {
						doctype: "Household Profile",
						user: session.user,
						...profileData,
					},
				}),
			)

			// Clear cache to force reload
			this.clearCache()

			return result
		} catch (error) {
			console.error(
				"HouseholdService: Failed to create household profile:",
				error,
			)
			throw new Error(`Failed to create household profile: ${error.message}`)
		}
	}

	/**
	 * Update household profile
	 */
	async updateProfile(
		profileName: string,
		updates: Partial<ProfileData>,
	): Promise<HouseholdProfile> {
		try {
			const result = await apiService.execute(
				call("frappe.client.set_value", {
					doctype: "Household Profile",
					name: profileName,
					fieldname: updates,
				}),
			)

			// Clear cache to force reload
			this.clearCache()

			return result
		} catch (error) {
			console.error(
				"HouseholdService: Failed to update household profile:",
				error,
			)
			throw new Error(`Failed to update household profile: ${error.message}`)
		}
	}

	/**
	 * Clear cache
	 */
	clearCache(): void {
		cacheService.delete(CACHE_KEYS.HOUSEHOLD_PROFILE)
	}

	/**
	 * Reset service state
	 */
	reset(): void {
		this.currentProfile = null
		this.clearCache()
	}

	/**
	 * Get cached profile
	 */
	getCachedProfile(): HouseholdProfile | null {
		return this.currentProfile
	}

	/**
	 * Check if profile exists for current user
	 */
	async hasProfile(): Promise<boolean> {
		try {
			const profile = await this.getCurrentProfile()
			return profile !== null
		} catch (error) {
			console.error(
				"HouseholdService: Failed to check profile existence:",
				error,
			)
			return false
		}
	}

	/**
	 * Get profile statistics
	 */
	getProfileStats(): Record<string, any> {
		return {
			hasCurrentProfile: !!this.currentProfile,
			currentUserId: session.user,
			cacheKeys: Object.keys(CACHE_KEYS),
		}
	}
}

// Create default instance
export const householdService = new HouseholdService()

// Profile validation constants
export const PROFILE_VALIDATION = {
	REQUIRED_FIELDS: ["name", "user"],
	MAX_NAME_LENGTH: 140,
	VALID_STATUSES: ["Active", "Inactive"],
} as const

// Export types for use in other files
export type { HouseholdProfile, HouseholdServiceOptions, ProfileData }
