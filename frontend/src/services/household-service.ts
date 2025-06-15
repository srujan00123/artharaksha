/**
 * Household Service
 * Basic CRUD operations for household profiles
 * Handles household profile management with TypeScript support
 */

import { apiService, API_ENDPOINTS } from './api-service.js'
import { cacheService, CACHE_KEYS } from './cache-service.js'
import { session } from '../data/session.js'

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
    async getCurrentProfile(options: HouseholdServiceOptions = {}): Promise<HouseholdProfile | null> {
        const { useCache = true, forceReload = false } = options

        try {
            // Check cache first
            if (useCache && !forceReload) {
                const cached = cacheService.get(CACHE_KEYS.HOUSEHOLD_PROFILE, {
                    userId: session.user
                })
                if (cached) {
                    this.currentProfile = cached
                    return cached
                }
            }

            // Get profile from API
            const resource = apiService.createListResource({
                doctype: 'Household Profile',
                fields: ['*'],
                filters: { user: session.user }
            })

            await apiService.execute(resource.reload)
            const profiles = resource.data || []
            const profile = profiles.length > 0 ? profiles[0] : null

            // Cache the result
            if (useCache && profile) {
                cacheService.set(CACHE_KEYS.HOUSEHOLD_PROFILE, profile, {
                    userId: session.user
                })
            }

            this.currentProfile = profile
            return profile

        } catch (error) {
            console.error('HouseholdService: Failed to load household profile:', error)
            throw new Error(`Failed to load household profile: ${error.message}`)
        }
    }

    /**
     * Create household profile
     */
    async createProfile(profileData: ProfileData): Promise<HouseholdProfile> {
        try {
            const resource = apiService.createResource({
                url: API_ENDPOINTS.HOUSEHOLD.CREATE,
                params: {
                    doctype: 'Household Profile',
                    user: session.user,
                    ...profileData
                }
            })

            const result = await apiService.execute(resource.submit)

            // Clear cache to force reload
            this.clearCache()

            return result

        } catch (error) {
            console.error('HouseholdService: Failed to create household profile:', error)
            throw new Error(`Failed to create household profile: ${error.message}`)
        }
    }

    /**
     * Update household profile
     */
    async updateProfile(profileName: string, updates: Partial<ProfileData>): Promise<HouseholdProfile> {
        try {
            const resource = apiService.createResource({
                url: API_ENDPOINTS.HOUSEHOLD.UPDATE,
                params: {
                    doctype: 'Household Profile',
                    name: profileName,
                    ...updates
                }
            })

            const result = await apiService.execute(resource.submit)

            // Clear cache to force reload
            this.clearCache()

            return result

        } catch (error) {
            console.error('HouseholdService: Failed to update household profile:', error)
            throw new Error(`Failed to update household profile: ${error.message}`)
        }
    }

    /**
     * Clear cache
     */
    clearCache(userId: string | null = null): void {
        cacheService.delete(CACHE_KEYS.HOUSEHOLD_PROFILE, { userId: userId || session.user })
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
            console.error('HouseholdService: Failed to check profile existence:', error)
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
            cacheKeys: Object.keys(CACHE_KEYS)
        }
    }
}

// Create default instance
export const householdService = new HouseholdService()

// Profile validation constants
export const PROFILE_VALIDATION = {
    REQUIRED_FIELDS: ['name', 'user'],
    MAX_NAME_LENGTH: 140,
    VALID_STATUSES: ['Active', 'Inactive']
} as const

// Export types for use in other files
export type { HouseholdProfile, HouseholdServiceOptions, ProfileData } 