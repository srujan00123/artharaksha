/**
 * Household Composable
 * Reactive wrapper around household service with TypeScript support
 */

import { ref, computed, watch, onUnmounted, type Ref, type ComputedRef } from 'vue'
import { householdService, type HouseholdProfile, type HouseholdServiceOptions, type ProfileData } from '../services/household-service'
import { session } from '../data/session.js'

interface UseHouseholdReturn {
    // State
    profile: ComputedRef<HouseholdProfile | null>
    loading: ComputedRef<boolean>
    error: ComputedRef<string>

    // Computed
    hasProfile: ComputedRef<boolean>
    isLoadingProfile: ComputedRef<boolean>

    // Actions
    loadProfile: (options?: HouseholdServiceOptions) => Promise<void>
    refreshProfile: () => Promise<void>
    createProfile: (profileData: ProfileData) => Promise<void>
    updateProfile: (updates: Partial<ProfileData>) => Promise<void>
    clearCache: () => void

    // Utils
    initialize: () => void
}

export function useHousehold(): UseHouseholdReturn {
    // State
    const profile: Ref<HouseholdProfile | null> = ref(null)
    const loading: Ref<boolean> = ref(false)
    const error: Ref<string> = ref('')

    // Computed properties
    const hasProfile = computed(() => !!profile.value)
    const isLoadingProfile = computed(() => loading.value)

    // Actions
    const loadProfile = async (options: HouseholdServiceOptions = {}): Promise<void> => {
        try {
            loading.value = true
            error.value = ''

            const result = await householdService.getCurrentProfile(options)
            profile.value = result

        } catch (err) {
            console.error('Error loading household profile:', err)
            const errorMessage = err instanceof Error ? err.message : 'Failed to load household profile'
            error.value = errorMessage
            throw err
        } finally {
            loading.value = false
        }
    }

    const refreshProfile = async (): Promise<void> => {
        return await loadProfile({ forceReload: true })
    }

    const createProfile = async (profileData: ProfileData): Promise<void> => {
        try {
            loading.value = true
            await householdService.createProfile(profileData)
            await refreshProfile()
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create profile'
            error.value = errorMessage
            throw err
        } finally {
            loading.value = false
        }
    }

    const updateProfile = async (updates: Partial<ProfileData>): Promise<void> => {
        try {
            loading.value = true
            if (!profile.value) {
                throw new Error('No profile to update')
            }
            await householdService.updateProfile(profile.value.name, updates)
            await refreshProfile()
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update profile'
            error.value = errorMessage
            throw err
        } finally {
            loading.value = false
        }
    }

    const clearCache = (): void => {
        householdService.clearCache()
    }

    // Watch for user changes
    let userWatcher: (() => void) | null = null
    const setupUserWatcher = (): void => {
        userWatcher = watch(() => session.user, (newUser: string, oldUser: string) => {
            if (newUser !== oldUser) {
                profile.value = null
                error.value = ''
                householdService.reset()
                if (newUser) {
                    loadProfile()
                }
            }
        })
    }

    // Initialize
    const initialize = (): void => {
        setupUserWatcher()
    }

    // Cleanup
    onUnmounted(() => {
        if (userWatcher) {
            userWatcher()
        }
    })

    // Auto-initialize
    initialize()

    return {
        // State
        profile: computed(() => profile.value),
        loading: computed(() => loading.value),
        error: computed(() => error.value),

        // Computed
        hasProfile,
        isLoadingProfile,

        // Actions
        loadProfile,
        refreshProfile,
        createProfile,
        updateProfile,
        clearCache,

        // Utils
        initialize
    }
} 