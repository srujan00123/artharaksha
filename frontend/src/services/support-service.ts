/**
 * Support Service
 * Handles all support-related business logic and API operations including
 * welfare schemes, insurance schemes, health conditions, and support pathways
 * Uses consistent types from types/support.ts
 */

import { call } from 'frappe-ui'
import { cacheService } from './cache-service.js'
import { apiService, API_ENDPOINTS } from './api-service.js'
import { session } from '../data/session.js'
import type {
    ProcessedHealthCondition,
    ProcessedWelfareScheme,
    ProcessedInsuranceScheme,
    ProcessedSupportPathway,
    ProcessedHouseholdProfile,
    SupportServiceOptions,
    SupportRecommendations,
    SchemeApplication,
    SchemeClaim,
    ApplicationFormData,
    ClaimFormData,
    SupportFilters,
    EligibilityResult,
    ProfileCompleteness,
    RiskLevel,
    SupportServiceData
} from '../types/support'
import {
    isProcessedHealthCondition,
    isProcessedWelfareScheme,
    isProcessedSupportPathway,
    isProcessedHouseholdProfile,
    calculateRiskLevel,
    calculateProfileCompleteness
} from '../types/support'

// Cache configuration
const CACHE_EXPIRY = {
    HEALTH_CONDITIONS: 30 * 60 * 1000, // 30 minutes
    WELFARE_SCHEMES: 15 * 60 * 1000,   // 15 minutes
    INSURANCE_SCHEMES: 15 * 60 * 1000, // 15 minutes
    ALL_SCHEMES: 15 * 60 * 1000,       // 15 minutes
    SUPPORT_PATHWAYS: 30 * 60 * 1000,  // 30 minutes
    HOUSEHOLD_PROFILE: 5 * 60 * 1000,  // 5 minutes
    ELIGIBLE_SCHEMES: 10 * 60 * 1000,  // 10 minutes
    RECOMMENDATIONS: 10 * 60 * 1000,   // 10 minutes
    APPLICATIONS: 5 * 60 * 1000,       // 5 minutes
    CLAIMS: 5 * 60 * 1000              // 5 minutes
}

const SUPPORT_CACHE_KEYS = {
    HEALTH_CONDITIONS: 'support-health-conditions',
    WELFARE_SCHEMES: 'support-welfare-schemes',
    INSURANCE_SCHEMES: 'support-insurance-schemes',
    ALL_SCHEMES: 'support-all-schemes',
    SUPPORT_PATHWAYS: 'support-pathways',
    HOUSEHOLD_PROFILE: 'support-household-profile',
    ELIGIBLE_SCHEMES: 'support-eligible-schemes',
    RECOMMENDATIONS: 'support-recommendations',
    APPLICATIONS: 'support-applications',
    CLAIMS: 'support-claims'
}

export class SupportService {
    private currentData: SupportServiceData

    constructor() {
        this.currentData = {
            healthConditions: [],
            welfareSchemes: [],
            insuranceSchemes: [],
            allSchemes: [],
            supportPathways: [],
            householdProfile: null,
            eligibleSchemes: [],
            recommendations: null,
            applications: [],
            claims: []
        }
    }

    /**
     * Get all health conditions with caching
     */
    async getHealthConditions(useCache: boolean = true, forceRefresh: boolean = false): Promise<ProcessedHealthCondition[]> {
        try {
            // Check cache first
            if (useCache && !forceRefresh) {
                const cached = cacheService.get(SUPPORT_CACHE_KEYS.HEALTH_CONDITIONS, {
                    userId: session.user,
                    maxAge: CACHE_EXPIRY.HEALTH_CONDITIONS
                })
                if (cached) {
                    this.currentData.healthConditions = cached
                    return cached
                }
            }

            const conditions = await apiService.execute(() =>
                call(API_ENDPOINTS.SUPPORT.HEALTH_CONDITIONS)
            ) || []

            const processedConditions: ProcessedHealthCondition[] = conditions.map(condition => ({
                ...condition,
                isSelected: false,
                userSeverity: condition.default_severity || 'mild'
            }))

            // Cache the result
            if (useCache) {
                cacheService.set(SUPPORT_CACHE_KEYS.HEALTH_CONDITIONS, processedConditions, {
                    userId: session.user,
                    maxAge: CACHE_EXPIRY.HEALTH_CONDITIONS
                })
            }

            this.currentData.healthConditions = processedConditions
            return processedConditions
        } catch (error) {
            console.error('SupportService: Failed to fetch health conditions:', error)
            throw new Error(`Failed to load health conditions: ${error.message}`)
        }
    }

    /**
     * Get welfare schemes with filtering and caching
     */
    async getWelfareSchemes(filters: SupportFilters | null = null, options: SupportServiceOptions = {}): Promise<ProcessedWelfareScheme[]> {
        const { useCache = true, forceReload = false } = options
        const cacheKey = filters ? `${SUPPORT_CACHE_KEYS.WELFARE_SCHEMES}-${JSON.stringify(filters)}` : SUPPORT_CACHE_KEYS.WELFARE_SCHEMES

        try {
            // Check cache first
            if (useCache && !forceReload) {
                const cached = cacheService.get(cacheKey, {
                    userId: session.user,
                    maxAge: CACHE_EXPIRY.WELFARE_SCHEMES
                })
                if (cached) {
                    this.currentData.welfareSchemes = cached
                    return cached
                }
            }

            const response = await apiService.execute(() => call(API_ENDPOINTS.SUPPORT.WELFARE_SCHEMES, { filters }))
            const schemes = response || []

            // Transform and validate data
            const processedSchemes: ProcessedWelfareScheme[] = schemes.map(scheme => ({
                ...scheme,
                isBookmarked: false,
                applicationStatus: 'not_applied',
                is_eligible: undefined,
                eligibility_status: [],
                eligibility_score: 0,
                scheme_source: 'welfare'
            }))

            // Cache the result
            if (useCache) {
                cacheService.set(cacheKey, processedSchemes, {
                    userId: session.user,
                    maxAge: CACHE_EXPIRY.WELFARE_SCHEMES
                })
            }

            this.currentData.welfareSchemes = processedSchemes
            return processedSchemes

        } catch (error) {
            console.error('SupportService: Failed to fetch welfare schemes:', error)
            throw new Error(`Failed to load welfare schemes: ${error.message}`)
        }
    }

    /**
     * Get insurance schemes with filtering and caching
     */
    async getInsuranceSchemes(filters: SupportFilters | null = null, options: SupportServiceOptions = {}): Promise<ProcessedInsuranceScheme[]> {
        const { useCache = true, forceReload = false } = options
        const cacheKey = filters ? `${SUPPORT_CACHE_KEYS.INSURANCE_SCHEMES}-${JSON.stringify(filters)}` : SUPPORT_CACHE_KEYS.INSURANCE_SCHEMES

        try {
            // Check cache first
            if (useCache && !forceReload) {
                const cached = cacheService.get(cacheKey, {
                    userId: session.user,
                    maxAge: CACHE_EXPIRY.INSURANCE_SCHEMES
                })
                if (cached) {
                    this.currentData.insuranceSchemes = cached
                    return cached
                }
            }

            const response = await apiService.execute(() => call(API_ENDPOINTS.SUPPORT.INSURANCE_SCHEMES, { filters }))
            const schemes = response || []

            // Transform and validate data
            const processedSchemes: ProcessedInsuranceScheme[] = schemes.map(scheme => ({
                ...scheme,
                isBookmarked: false,
                applicationStatus: 'not_applied',
                is_eligible: undefined,
                eligibility_status: [],
                eligibility_score: 0,
                scheme_source: 'insurance'
            }))

            // Cache the result
            if (useCache) {
                cacheService.set(cacheKey, processedSchemes, {
                    userId: session.user,
                    maxAge: CACHE_EXPIRY.INSURANCE_SCHEMES
                })
            }

            this.currentData.insuranceSchemes = processedSchemes
            return processedSchemes

        } catch (error) {
            console.error('SupportService: Failed to fetch insurance schemes:', error)
            throw new Error(`Failed to load insurance schemes: ${error.message}`)
        }
    }

    /**
     * Get all schemes (welfare + insurance) with filtering and caching
     */
    async getAllSchemes(filters: SupportFilters | null = null, options: SupportServiceOptions = {}): Promise<(ProcessedWelfareScheme | ProcessedInsuranceScheme)[]> {
        const { useCache = true, forceReload = false } = options
        const cacheKey = filters ? `${SUPPORT_CACHE_KEYS.ALL_SCHEMES}-${JSON.stringify(filters)}` : SUPPORT_CACHE_KEYS.ALL_SCHEMES

        try {
            // Check cache first
            if (useCache && !forceReload) {
                const cached = cacheService.get(cacheKey, {
                    userId: session.user,
                    maxAge: CACHE_EXPIRY.ALL_SCHEMES
                })
                if (cached) {
                    this.currentData.allSchemes = cached
                    return cached
                }
            }

            // Get both welfare and insurance schemes in parallel
            const [welfareSchemes, insuranceSchemes] = await Promise.all([
                this.getWelfareSchemes(filters, { useCache, forceReload }),
                this.getInsuranceSchemes(filters, { useCache, forceReload })
            ])

            const allSchemes = [...welfareSchemes, ...insuranceSchemes]

            // Cache the combined result
            if (useCache) {
                cacheService.set(cacheKey, allSchemes, {
                    userId: session.user,
                    maxAge: CACHE_EXPIRY.ALL_SCHEMES
                })
            }

            this.currentData.allSchemes = allSchemes
            return allSchemes

        } catch (error) {
            console.error('SupportService: Failed to fetch all schemes:', error)
            throw new Error(`Failed to load schemes: ${error.message}`)
        }
    }

    /**
     * Get support pathways with filtering and caching
     */
    async getSupportPathways(filters: SupportFilters | null = null, options: SupportServiceOptions = {}): Promise<ProcessedSupportPathway[]> {
        const { useCache = true, forceReload = false } = options
        const cacheKey = filters ? `${SUPPORT_CACHE_KEYS.SUPPORT_PATHWAYS}-${JSON.stringify(filters)}` : SUPPORT_CACHE_KEYS.SUPPORT_PATHWAYS

        try {
            // Check cache first
            if (useCache && !forceReload) {
                const cached = cacheService.get(cacheKey, {
                    userId: session.user,
                    maxAge: CACHE_EXPIRY.SUPPORT_PATHWAYS
                })
                if (cached) {
                    this.currentData.supportPathways = cached
                    return cached
                }
            }

            const response = await apiService.execute(() => call(API_ENDPOINTS.SUPPORT.PATHWAYS, { filters }))
            const pathways = response || []

            // Transform and validate data
            const processedPathways: ProcessedSupportPathway[] = pathways.map(pathway => ({
                ...pathway,
                isBookmarked: false,
                completionStatus: 'not_started',
                progress: 0
            }))

            // Cache the result
            if (useCache) {
                cacheService.set(cacheKey, processedPathways, {
                    userId: session.user,
                    maxAge: CACHE_EXPIRY.SUPPORT_PATHWAYS
                })
            }

            this.currentData.supportPathways = processedPathways
            return processedPathways

        } catch (error) {
            console.error('SupportService: Failed to fetch support pathways:', error)
            throw new Error(`Failed to load support pathways: ${error.message}`)
        }
    }

    /**
     * Get household profile with caching
     */
    async getHouseholdProfile(options: SupportServiceOptions = {}): Promise<ProcessedHouseholdProfile | null> {
        const { useCache = true, forceReload = false } = options

        try {
            // Check cache first
            if (useCache && !forceReload) {
                const cached = cacheService.get(SUPPORT_CACHE_KEYS.HOUSEHOLD_PROFILE, {
                    userId: session.user,
                    maxAge: CACHE_EXPIRY.HOUSEHOLD_PROFILE
                })
                if (cached) {
                    this.currentData.householdProfile = cached
                    return cached
                }
            }

            const response = await apiService.execute(() => call(API_ENDPOINTS.SUPPORT.HOUSEHOLD_PROFILE))

            if (!response) {
                this.currentData.householdProfile = null
                return null
            }

            // Transform and validate data
            const processedProfile: ProcessedHouseholdProfile = {
                ...response,
                completeness: calculateProfileCompleteness(response),
                riskLevel: calculateRiskLevel(response),
                missingFields: this.getMissingFields(response)
            }

            // Cache the result
            if (useCache) {
                cacheService.set(SUPPORT_CACHE_KEYS.HOUSEHOLD_PROFILE, processedProfile, {
                    userId: session.user,
                    maxAge: CACHE_EXPIRY.HOUSEHOLD_PROFILE
                })
            }

            this.currentData.householdProfile = processedProfile
            return processedProfile

        } catch (error) {
            console.error('SupportService: Failed to fetch household profile:', error)
            throw new Error(`Failed to load household profile: ${error.message}`)
        }
    }

    /**
     * Get eligible schemes based on household profile
     */
    async getEligibleSchemes(options: SupportServiceOptions = {}): Promise<EligibilityResult[]> {
        const { useCache = true, forceReload = false } = options

        try {
            // Check cache first
            if (useCache && !forceReload) {
                const cached = cacheService.get(SUPPORT_CACHE_KEYS.ELIGIBLE_SCHEMES, {
                    userId: session.user,
                    maxAge: CACHE_EXPIRY.ELIGIBLE_SCHEMES
                })
                if (cached) {
                    this.currentData.eligibleSchemes = cached
                    return cached
                }
            }

            const response = await apiService.execute(() => call(API_ENDPOINTS.SUPPORT.ELIGIBLE_SCHEMES))
            const eligibleSchemes: EligibilityResult[] = response || []

            // Cache the result
            if (useCache) {
                cacheService.set(SUPPORT_CACHE_KEYS.ELIGIBLE_SCHEMES, eligibleSchemes, {
                    userId: session.user,
                    maxAge: CACHE_EXPIRY.ELIGIBLE_SCHEMES
                })
            }

            this.currentData.eligibleSchemes = eligibleSchemes
            return eligibleSchemes

        } catch (error) {
            console.error('SupportService: Failed to fetch eligible schemes:', error)
            throw new Error(`Failed to load eligible schemes: ${error.message}`)
        }
    }

    /**
     * Get support recommendations based on profile and health conditions
     */
    async getSupportRecommendations(options: SupportServiceOptions = {}): Promise<SupportRecommendations | null> {
        const { useCache = true, forceReload = false } = options

        try {
            // Check cache first
            if (useCache && !forceReload) {
                const cached = cacheService.get(SUPPORT_CACHE_KEYS.RECOMMENDATIONS, {
                    userId: session.user,
                    maxAge: CACHE_EXPIRY.RECOMMENDATIONS
                })
                if (cached) {
                    this.currentData.recommendations = cached
                    return cached
                }
            }

            const response = await apiService.execute(() => call(API_ENDPOINTS.SUPPORT.RECOMMENDATIONS))
            const recommendations: SupportRecommendations | null = response || null

            // Cache the result
            if (useCache && recommendations) {
                cacheService.set(SUPPORT_CACHE_KEYS.RECOMMENDATIONS, recommendations, {
                    userId: session.user,
                    maxAge: CACHE_EXPIRY.RECOMMENDATIONS
                })
            }

            this.currentData.recommendations = recommendations
            return recommendations

        } catch (error) {
            console.error('SupportService: Failed to fetch support recommendations:', error)
            throw new Error(`Failed to load support recommendations: ${error.message}`)
        }
    }

    /**
     * Update health conditions for the user
     */
    async updateHealthConditions(healthConditions: ProcessedHealthCondition[]): Promise<void> {
        try {
            await apiService.execute(() => call(API_ENDPOINTS.SUPPORT.UPDATE_HEALTH_CONDITIONS, {
                health_conditions: healthConditions
            }))

            // Update local cache
            this.currentData.healthConditions = healthConditions
            cacheService.set(SUPPORT_CACHE_KEYS.HEALTH_CONDITIONS, healthConditions, {
                userId: session.user,
                maxAge: CACHE_EXPIRY.HEALTH_CONDITIONS
            })

            // Clear dependent caches including household profile
            this.clearCache(['household_profile', 'eligible_schemes', 'recommendations', 'all_schemes', 'welfare_schemes'])

        } catch (error) {
            console.error('SupportService: Failed to update health conditions:', error)
            throw new Error(`Failed to update health conditions: ${error.message}`)
        }
    }

    /**
     * Get scheme applications
     */
    async getSchemeApplications(options: SupportServiceOptions = {}): Promise<SchemeApplication[]> {
        const { useCache = true, forceReload = false } = options

        try {
            // Check cache first
            if (useCache && !forceReload) {
                const cached = cacheService.get(SUPPORT_CACHE_KEYS.APPLICATIONS, {
                    userId: session.user,
                    maxAge: CACHE_EXPIRY.APPLICATIONS
                })
                if (cached) {
                    this.currentData.applications = cached
                    return cached
                }
            }

            const response = await apiService.execute(() => call(API_ENDPOINTS.SUPPORT.GET_APPLICATIONS))
            const applications: SchemeApplication[] = response || []

            // Cache the result
            if (useCache) {
                cacheService.set(SUPPORT_CACHE_KEYS.APPLICATIONS, applications, {
                    userId: session.user,
                    maxAge: CACHE_EXPIRY.APPLICATIONS
                })
            }

            this.currentData.applications = applications
            return applications

        } catch (error) {
            console.error('SupportService: Failed to fetch scheme applications:', error)
            throw new Error(`Failed to load scheme applications: ${error.message}`)
        }
    }

    /**
     * Create new scheme application
     */
    async createSchemeApplication(applicationData: ApplicationFormData): Promise<SchemeApplication> {
        try {
            const response = await apiService.execute(() => call(API_ENDPOINTS.SUPPORT.CREATE_APPLICATION, applicationData))
            const newApplication: SchemeApplication = response

            // Update local cache
            this.currentData.applications.unshift(newApplication)
            this.clearCache(['applications'])

            return newApplication

        } catch (error) {
            console.error('SupportService: Failed to create scheme application:', error)
            throw new Error(`Failed to create scheme application: ${error.message}`)
        }
    }

    /**
     * Update existing scheme application
     */
    async updateSchemeApplication(applicationName: string, applicationData: Partial<ApplicationFormData>): Promise<SchemeApplication> {
        try {
            const response = await apiService.execute(() => call(API_ENDPOINTS.SUPPORT.UPDATE_APPLICATION, {
                name: applicationName,
                ...applicationData
            }))
            const updatedApplication: SchemeApplication = response

            // Update local cache
            const index = this.currentData.applications.findIndex(app => app.name === applicationName)
            if (index !== -1) {
                this.currentData.applications[index] = updatedApplication
            }
            this.clearCache(['applications'])

            return updatedApplication

        } catch (error) {
            console.error('SupportService: Failed to update scheme application:', error)
            throw new Error(`Failed to update scheme application: ${error.message}`)
        }
    }

    /**
     * Get scheme claims
     */
    async getSchemeClaims(options: SupportServiceOptions = {}): Promise<SchemeClaim[]> {
        const { useCache = true, forceReload = false } = options

        try {
            // Check cache first
            if (useCache && !forceReload) {
                const cached = cacheService.get(SUPPORT_CACHE_KEYS.CLAIMS, {
                    userId: session.user,
                    maxAge: CACHE_EXPIRY.CLAIMS
                })
                if (cached) {
                    this.currentData.claims = cached
                    return cached
                }
            }

            const response = await apiService.execute(() => call(API_ENDPOINTS.SUPPORT.GET_CLAIMS))
            const claims: SchemeClaim[] = response || []

            // Cache the result
            if (useCache) {
                cacheService.set(SUPPORT_CACHE_KEYS.CLAIMS, claims, {
                    userId: session.user,
                    maxAge: CACHE_EXPIRY.CLAIMS
                })
            }

            this.currentData.claims = claims
            return claims

        } catch (error) {
            console.error('SupportService: Failed to fetch scheme claims:', error)
            throw new Error(`Failed to load scheme claims: ${error.message}`)
        }
    }

    /**
     * Create new scheme claim
     */
    async createSchemeClaim(claimData: ClaimFormData): Promise<SchemeClaim> {
        try {
            const response = await apiService.execute(() => call(API_ENDPOINTS.SUPPORT.CREATE_CLAIM, claimData))
            const newClaim: SchemeClaim = response

            // Update local cache
            this.currentData.claims.unshift(newClaim)
            this.clearCache(['claims'])

            return newClaim

        } catch (error) {
            console.error('SupportService: Failed to create scheme claim:', error)
            throw new Error(`Failed to create scheme claim: ${error.message}`)
        }
    }

    /**
     * Update existing scheme claim
     */
    async updateSchemeClaim(claimName: string, claimData: Partial<ClaimFormData>): Promise<SchemeClaim> {
        try {
            const response = await apiService.execute(() => call(API_ENDPOINTS.SUPPORT.UPDATE_CLAIM, {
                name: claimName,
                ...claimData
            }))
            const updatedClaim: SchemeClaim = response

            // Update local cache
            const index = this.currentData.claims.findIndex(claim => claim.name === claimName)
            if (index !== -1) {
                this.currentData.claims[index] = updatedClaim
            }
            this.clearCache(['claims'])

            return updatedClaim

        } catch (error) {
            console.error('SupportService: Failed to update scheme claim:', error)
            throw new Error(`Failed to update scheme claim: ${error.message}`)
        }
    }

    /**
     * Delete scheme application
     */
    async deleteSchemeApplication(applicationName: string): Promise<void> {
        try {
            await apiService.execute(() => call(API_ENDPOINTS.SUPPORT.DELETE_APPLICATION, { name: applicationName }))

            // Update local cache
            const index = this.currentData.applications.findIndex(app => app.name === applicationName)
            if (index !== -1) {
                this.currentData.applications.splice(index, 1)
            }
            this.clearCache(['applications'])

        } catch (error) {
            console.error('SupportService: Failed to delete scheme application:', error)
            throw new Error(`Failed to delete scheme application: ${error.message}`)
        }
    }

    /**
     * Delete scheme claim
     */
    async deleteSchemeClaim(claimName: string): Promise<void> {
        try {
            await apiService.execute(() => call(API_ENDPOINTS.SUPPORT.DELETE_CLAIM, { name: claimName }))

            // Update local cache
            const index = this.currentData.claims.findIndex(claim => claim.name === claimName)
            if (index !== -1) {
                this.currentData.claims.splice(index, 1)
            }
            this.clearCache(['claims'])

        } catch (error) {
            console.error('SupportService: Failed to delete scheme claim:', error)
            throw new Error(`Failed to delete scheme claim: ${error.message}`)
        }
    }

    /**
     * Get application status
     */
    getApplicationStatus(application: SchemeApplication): string {
        return application.status || 'pending'
    }

    /**
     * Get application status label
     */
    getApplicationStatusLabel(application: SchemeApplication): string {
        const status = this.getApplicationStatus(application)
        const labels: Record<string, string> = {
            'pending': 'Pending Review',
            'approved': 'Approved',
            'rejected': 'Rejected',
            'under_review': 'Under Review',
            'requires_documents': 'Documents Required'
        }
        return labels[status] || status
    }

    /**
     * Check if application can be edited
     */
    canEditApplication(application: SchemeApplication): boolean {
        const status = this.getApplicationStatus(application)
        return ['pending', 'requires_documents'].includes(status)
    }

    /**
     * Check if application can be cancelled
     */
    canCancelApplication(application: SchemeApplication): boolean {
        const status = this.getApplicationStatus(application)
        return !['approved', 'rejected'].includes(status)
    }

    /**
     * Get claim status label
     */
    getClaimStatusLabel(status: string): string {
        const labels: Record<string, string> = {
            'pending': 'Pending Review',
            'approved': 'Approved',
            'rejected': 'Rejected',
            'paid': 'Paid',
            'under_review': 'Under Review'
        }
        return labels[status] || status
    }

    /**
     * Check if claim can be edited
     */
    canEditClaim(claim: SchemeClaim): boolean {
        const status = claim.status || 'pending'
        return ['pending', 'under_review'].includes(status)
    }

    /**
     * Check if claim can be cancelled
     */
    canCancelClaim(claim: SchemeClaim): boolean {
        const status = claim.status || 'pending'
        return !['approved', 'rejected', 'paid'].includes(status)
    }

    /**
     * Calculate profile completeness
     */
    calculateProfileCompleteness(profile: ProcessedHouseholdProfile): ProfileCompleteness {
        return calculateProfileCompleteness(profile)
    }

    /**
     * Calculate risk level
     */
    calculateRiskLevel(profile: ProcessedHouseholdProfile): RiskLevel {
        return calculateRiskLevel(profile)
    }

    /**
     * Get missing fields from profile
     */
    getMissingFields(profile: ProcessedHouseholdProfile): string[] {
        const requiredFields = [
            'household_size',
            'monthly_income',
            'primary_occupation',
            'education_level',
            'housing_type',
            'location'
        ]

        return requiredFields.filter(field => !profile[field])
    }

    /**
     * Clear cache for specific data types
     */
    clearCache(dataTypes: string[] | null = null): void {
        const targetUserId = session.user

        if (!dataTypes) {
            // Clear all support-related caches
            Object.values(SUPPORT_CACHE_KEYS).forEach(key => {
                cacheService.delete(key, { userId: targetUserId })
            })
        } else {
            // Clear specific caches
            dataTypes.forEach(dataType => {
                const cacheKey = SUPPORT_CACHE_KEYS[dataType.toUpperCase()]
                if (cacheKey) {
                    cacheService.delete(cacheKey, { userId: targetUserId })
                }
            })
        }
    }

    /**
     * Reset service state
     */
    reset(): void {
        this.currentData = {
            healthConditions: [],
            welfareSchemes: [],
            insuranceSchemes: [],
            allSchemes: [],
            supportPathways: [],
            householdProfile: null,
            eligibleSchemes: [],
            recommendations: null,
            applications: [],
            claims: []
        }
        this.clearCache()
    }

    /**
     * Get cache statistics
     */
    getCacheStats(): Record<string, any> {
        return {
            currentDataCounts: {
                healthConditions: this.currentData.healthConditions.length,
                welfareSchemes: this.currentData.welfareSchemes.length,
                insuranceSchemes: this.currentData.insuranceSchemes.length,
                allSchemes: this.currentData.allSchemes.length,
                supportPathways: this.currentData.supportPathways.length,
                eligibleSchemes: this.currentData.eligibleSchemes.length,
                applications: this.currentData.applications.length,
                claims: this.currentData.claims.length,
                hasProfile: !!this.currentData.householdProfile,
                hasRecommendations: !!this.currentData.recommendations
            },
            cacheKeys: Object.keys(SUPPORT_CACHE_KEYS),
            cacheExpiry: CACHE_EXPIRY
        }
    }

    /**
     * Initialize service with basic data
     */
    async initialize(): Promise<void> {
        try {
            // Load essential data in parallel
            await Promise.allSettled([
                this.getHealthConditions(),
                this.getHouseholdProfile(),
                this.getSchemeApplications(),
                this.getSchemeClaims()
            ])
        } catch (error) {
            console.error('SupportService: Failed to initialize:', error)
            // Don't throw error to allow partial initialization
        }
    }

    /**
     * Get current service data
     */
    getCurrentData(): SupportServiceData {
        return { ...this.currentData }
    }
}

// Export singleton instance
export const supportService = new SupportService() 