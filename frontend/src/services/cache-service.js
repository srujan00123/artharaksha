/**
 * Centralized Cache Service
 * Handles all caching operations for the application
 */

const CACHE_VERSION = "1.0.2"
const MAX_CACHE_SIZE = 500
const DEFAULT_MAX_AGE = 5 * 60 * 1000 // 5 minutes for development (reasonable for testing)

export class CacheService {
	constructor(prefix = "artha") {
		this.prefix = prefix
		this.stats = { hits: 0, misses: 0, size: 0 }
	}

	/**
	 * Generate a cache key with user context
	 */
	generateKey(baseKey, userId = null) {
		const userSuffix = userId ? `-${userId}` : ""
		return `${this.prefix}-${baseKey}${userSuffix}`
	}

	/**
	 * Generate a filter-aware cache key
	 * Creates unique cache keys based on filter combinations
	 */
	generateFilterKey(baseKey, filters = {}, options = {}) {
		const { userId = null, profileId = null } = options

		// Extract relevant filter properties for cache key
		const filterParts = []

		// Date range filters (most important for cache separation)
		if (filters.dateFrom) filterParts.push(`from-${filters.dateFrom}`)
		if (filters.dateTo) filterParts.push(`to-${filters.dateTo}`)
		if (filters.period) filterParts.push(`period-${filters.period}`)

		// Other significant filters that affect server data
		if (filters.incomeType) filterParts.push(`type-${filters.incomeType}`)
		if (filters.isRecurring !== null && filters.isRecurring !== undefined) {
			filterParts.push(`recurring-${filters.isRecurring}`)
		}

		// Amount filters (if they affect server queries)
		if (filters.amountMin) filterParts.push(`min-${filters.amountMin}`)
		if (filters.amountMax) filterParts.push(`max-${filters.amountMax}`)

		// Create filter hash for cache key
		const filterHash = filterParts.length > 0 ? `-${filterParts.join("-")}` : ""
		const userSuffix = userId ? `-${userId}` : ""
		const profileSuffix = profileId ? `-${profileId}` : ""

		return `${this.prefix}-${baseKey}${userSuffix}${profileSuffix}${filterHash}`
	}

	/**
	 * Save data to cache with metadata
	 */
	set(key, data, options = {}) {
		try {
			const { maxAge = DEFAULT_MAX_AGE, userId, profileId } = options

			// Check data size for arrays to prevent localStorage overflow
			if (Array.isArray(data) && data.length > MAX_CACHE_SIZE) {
				return false
			}

			const cacheKey = this.generateKey(key, userId)
			const cacheData = {
				data,
				version: CACHE_VERSION,
				timestamp: Date.now(),
				userId: userId || "anonymous",
				profileId,
				maxAge,
			}

			localStorage.setItem(cacheKey, JSON.stringify(cacheData))
			return true
		} catch (error) {
			console.error("Cache set failed:", error)
			return false
		}
	}

	/**
	 * Save data to cache with filter-aware key
	 */
	setWithFilters(key, data, filters = {}, options = {}) {
		try {
			const { maxAge = DEFAULT_MAX_AGE, userId, profileId } = options

			// Check data size for arrays to prevent localStorage overflow
			if (Array.isArray(data) && data.length > MAX_CACHE_SIZE) {
				return false
			}

			const cacheKey = this.generateFilterKey(key, filters, {
				userId,
				profileId,
			})
			const cacheData = {
				data,
				version: CACHE_VERSION,
				timestamp: Date.now(),
				userId: userId || "anonymous",
				profileId,
				filters: { ...filters }, // Store filters for debugging
				maxAge,
			}

			localStorage.setItem(cacheKey, JSON.stringify(cacheData))
			return true
		} catch (error) {
			console.error("Cache setWithFilters failed:", error)
			return false
		}
	}

	/**
	 * Get data from cache with validation
	 */
	get(key, options = {}) {
		try {
			const {
				userId = null,
				profileId = null,
				maxAge = DEFAULT_MAX_AGE,
				validateUser = true,
				validateProfile = true,
			} = options

			const cacheKey = this.generateKey(key, userId)
			const cached = this.getRaw(cacheKey)

			if (!cached) {
				this.stats.misses++
				return null
			}

			// Version check
			if (cached.version !== CACHE_VERSION) {
				this.delete(key, { userId })
				this.stats.misses++
				return null
			}

			// Age check
			const age = Date.now() - cached.timestamp
			const maxCacheAge = cached.maxAge || maxAge
			if (age > maxCacheAge) {
				this.delete(key, { userId })
				this.stats.misses++
				return null
			}

			// User validation
			if (validateUser && userId && cached.userId !== userId) {
				this.delete(key, { userId })
				this.stats.misses++
				return null
			}

			// Profile validation
			if (validateProfile && profileId && cached.profileId !== profileId) {
				this.delete(key, { userId })
				this.stats.misses++
				return null
			}

			this.stats.hits++
			return cached.data
		} catch (error) {
			console.error("Cache get failed:", error)
			this.stats.misses++
			return null
		}
	}

	/**
	 * Get data from cache with filter-aware key
	 */
	getWithFilters(key, filters = {}, options = {}) {
		try {
			const {
				userId = null,
				profileId = null,
				maxAge = DEFAULT_MAX_AGE,
				validateUser = true,
				validateProfile = true,
			} = options

			const cacheKey = this.generateFilterKey(key, filters, {
				userId,
				profileId,
			})
			const cached = this.getRaw(cacheKey)

			if (!cached) {
				this.stats.misses++
				return null
			}

			// Version check
			if (cached.version !== CACHE_VERSION) {
				this.deleteWithFilters(key, filters, { userId, profileId })
				this.stats.misses++
				return null
			}

			// Age check
			const age = Date.now() - cached.timestamp
			const maxCacheAge = cached.maxAge || maxAge
			if (age > maxCacheAge) {
				this.deleteWithFilters(key, filters, { userId, profileId })
				this.stats.misses++
				return null
			}

			// User validation
			if (validateUser && userId && cached.userId !== userId) {
				this.deleteWithFilters(key, filters, { userId, profileId })
				this.stats.misses++
				return null
			}

			// Profile validation
			if (validateProfile && profileId && cached.profileId !== profileId) {
				this.deleteWithFilters(key, filters, { userId, profileId })
				this.stats.misses++
				return null
			}

			this.stats.hits++
			return cached.data
		} catch (error) {
			console.error("Cache getWithFilters failed:", error)
			this.stats.misses++
			return null
		}
	}

	/**
	 * Get raw cached data without validation
	 */
	getRaw(cacheKey) {
		try {
			const item = localStorage.getItem(cacheKey)
			return item ? JSON.parse(item) : null
		} catch (error) {
			console.error("Cache parse failed:", error)
			return null
		}
	}

	/**
	 * Delete specific cache entry
	 */
	delete(key, options = {}) {
		try {
			const { userId = null } = options
			const cacheKey = this.generateKey(key, userId)
			localStorage.removeItem(cacheKey)
			return true
		} catch (error) {
			console.error("Cache delete failed:", error)
			return false
		}
	}

	/**
	 * Delete specific filter-aware cache entry
	 */
	deleteWithFilters(key, filters = {}, options = {}) {
		try {
			const { userId = null, profileId = null } = options
			const cacheKey = this.generateFilterKey(key, filters, {
				userId,
				profileId,
			})
			localStorage.removeItem(cacheKey)
			return true
		} catch (error) {
			console.error("Cache deleteWithFilters failed:", error)
			return false
		}
	}

	/**
	 * Clear all cache entries matching pattern
	 */
	clearPattern(pattern) {
		try {
			const keysToRemove = []
			for (let i = 0; i < localStorage.length; i++) {
				const key = localStorage.key(i)
				if (key && key.includes(pattern)) {
					keysToRemove.push(key)
				}
			}

			keysToRemove.forEach((key) => localStorage.removeItem(key))
			this.stats = { hits: 0, misses: 0, size: 0 }
			return keysToRemove.length
		} catch (error) {
			console.error("Cache clear pattern failed:", error)
			return 0
		}
	}

	/**
	 * Clear all cache entries for a user
	 */
	clearUser(userId) {
		return this.clearPattern(`${this.prefix}-${userId}`)
	}

	/**
	 * Clear all cache entries for a specific key (all filter variations)
	 */
	clearKey(baseKey, options = {}) {
		const { userId = null, profileId = null } = options
		let pattern = `${this.prefix}-${baseKey}`

		if (userId) pattern += `-${userId}`
		if (profileId) pattern += `-${profileId}`

		return this.clearPattern(pattern)
	}

	/**
	 * Clear all application cache
	 */
	clearAll() {
		return this.clearPattern(this.prefix)
	}

	/**
	 * Get cache statistics
	 */
	getStats() {
		return { ...this.stats }
	}

	/**
	 * Debug information about cache entries
	 */
	debug(pattern = null) {
		const entries = []
		const searchPattern = pattern || this.prefix

		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i)
			if (key && key.includes(searchPattern)) {
				const cached = this.getRaw(key)
				if (cached) {
					entries.push({
						key,
						userId: cached.userId,
						profileId: cached.profileId,
						version: cached.version,
						timestamp: new Date(cached.timestamp).toISOString(),
						age: Math.round((Date.now() - cached.timestamp) / 1000 / 60),
						dataCount: Array.isArray(cached.data) ? cached.data.length : 1,
					})
				}
			}
		}

		return {
			entries,
			stats: this.getStats(),
			total: entries.length,
		}
	}

	/**
	 * Check if cache key exists and is valid
	 */
	has(key, options = {}) {
		const cached = this.get(key, options)
		return cached !== null
	}
}

// Create default instance
export const cacheService = new CacheService()

// Export cache keys constants
export const CACHE_KEYS = {
	// Expense cache keys
	EXPENSES: "expense-cache",
	EXPENSE_TYPES: "expense-types",
	EXPENSE_ANALYTICS: "expense-analytics",
	EXPENSE_MONTHLY: "expense-monthly-summary",
	EXPENSE_BREAKDOWN: "expense-breakdown",
	EXPENSE_MEDICAL_ANALYTICS: "expense-medical-analytics",
	EXPENSE_FILTERS: "expense-filters",
	EXPENSE_PREFERENCES: "expense-preferences",

	// Income cache keys - centralized and organized
	USER_INCOME: "user-income",
	USER_INCOME_ANALYTICS: "user-income-analytics",
	INCOME_LEDGER: "income-ledger",
	INCOME_TYPES: "income-types",
	INCOME_FILTERS: "income-filters",
	INCOME_PREFERENCES: "income-preferences",

	// Household cache keys
	HOUSEHOLD_PROFILE: "household-cache",

	// UI state cache keys
	GROUP_STATE: "group-state",
	FILTERS: "filters", // Generic filters
	PREFERENCES: "preferences", // Generic preferences

	// User cache keys
	USER_PROFILE: "user-profile",
	USER_PREFERENCES: "user-preferences",

	// Support cache keys
	HEALTH_CONDITIONS: "health-conditions",
	WELFARE_SCHEMES: "welfare-schemes",
	INSURANCE_SCHEMES: "insurance-schemes",
	ALL_SCHEMES: "all-schemes",
	SUPPORT_PATHWAYS: "support-pathways",
	ELIGIBLE_SCHEMES: "eligible-schemes",
	SUPPORT_RECOMMENDATIONS: "support-recommendations",
	SCHEME_APPLICATIONS: "scheme-applications",
	SCHEME_CLAIMS: "scheme-claims",
	USER_HEALTH_CONDITIONS: "user-health-conditions",
}
