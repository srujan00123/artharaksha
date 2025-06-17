/**
 * Cache Service - Robust & Redundancy-Free
 * Advanced caching system with TTL, filtering, and pattern matching
 * Provides consistent caching across all data layers
 */

// Cache configuration
const CACHE_CONFIG = {
	DEFAULT_TTL: 5 * 60 * 1000, // 5 minutes
	MAX_CACHE_SIZE: 1000, // Maximum number of cache entries
	CLEANUP_INTERVAL: 10 * 60 * 1000, // 10 minutes
};

// Cache keys - Centralized key definitions
export const CACHE_KEYS = {
	// Income related
	USER_INCOME: "user_income",
	USER_INCOME_ANALYTICS: "user_income_analytics",
	INCOME_LEDGER: "income_ledger",
	INCOME_TYPES: "income_types",
	INCOME_FILTERS: "income_filters",
	INCOME_DASHBOARD: "income_dashboard",

	// Expense related
	USER_EXPENSES: "user_expenses",
	USER_EXPENSES_ANALYTICS: "user_expenses_analytics",
	EXPENSE_TYPES: "expense_types",
	EXPENSE_FILTERS: "expense_filters",
	EXPENSE_DASHBOARD: "expense_dashboard",

	// Profile related
	USER_PROFILE: "user_profile",
	HOUSEHOLD_PROFILE: "household_profile",

	// Support related
	HEALTH_CONDITIONS: "health_conditions",
	WELFARE_SCHEMES: "welfare_schemes",
	INSURANCE_SCHEMES: "insurance_schemes",
	SUPPORT_PATHWAYS: "support_pathways",
};

/**
 * Cache Service Class
 * Provides advanced caching with TTL, pattern matching, and filter-based keys
 */
class CacheService {
	constructor() {
		this.cache = new Map();
		this.filterCache = new Map(); // Separate cache for filtered data
		this.timers = new Map(); // TTL timers
		this.stats = {
			hits: 0,
			misses: 0,
			sets: 0,
			evictions: 0,
		};

		// Start cleanup interval
		this.startCleanupInterval();
	}

	/**
	 * Generate a cache key for filtered data
	 * @param {string} baseKey - Base cache key
	 * @param {Object} filters - Filter object
	 * @returns {string} - Generated cache key
	 */
	generateFilterKey(baseKey, filters) {
		if (!filters || Object.keys(filters).length === 0) {
			return baseKey;
		}

		// Sort filters for consistent key generation
		const sortedFilters = Object.keys(filters)
			.sort()
			.reduce((result, key) => {
				const value = filters[key];
				if (value !== null && value !== undefined && value !== "") {
					result[key] = value;
				}
				return result;
			}, {});

		const filterString = JSON.stringify(sortedFilters);
		const filterHash = this.hashString(filterString);
		return `${baseKey}_${filterHash}`;
	}

	/**
	 * Simple string hash function
	 * @param {string} str - String to hash
	 * @returns {string} - Hash value
	 */
	hashString(str) {
		let hash = 0;
		if (str.length === 0) return hash.toString();
		
		for (let i = 0; i < str.length; i++) {
			const char = str.charCodeAt(i);
			hash = ((hash << 5) - hash) + char;
			hash = hash & hash; // Convert to 32-bit integer
		}
		return Math.abs(hash).toString(36);
	}

	/**
	 * Set cache entry with TTL
	 * @param {string} key - Cache key
	 * @param {*} value - Value to cache
	 * @param {Object} options - Cache options
	 */
	set(key, value, options = {}) {
		const { maxAge = CACHE_CONFIG.DEFAULT_TTL } = options;

		// Check cache size and evict if necessary
		if (this.cache.size >= CACHE_CONFIG.MAX_CACHE_SIZE) {
			this.evictOldest();
		}

		// Clear existing timer if any
		if (this.timers.has(key)) {
			clearTimeout(this.timers.get(key));
		}

		// Create cache entry
		const entry = {
			value,
			timestamp: Date.now(),
			maxAge,
			accessed: Date.now(),
		};

		this.cache.set(key, entry);
		this.stats.sets++;

		// Set TTL timer
		if (maxAge > 0) {
			const timer = setTimeout(() => {
				this.delete(key);
			}, maxAge);
			this.timers.set(key, timer);
		}
	}

	/**
	 * Get cache entry
	 * @param {string} key - Cache key
	 * @returns {*} - Cached value or null
	 */
	get(key) {
		const entry = this.cache.get(key);

		if (!entry) {
			this.stats.misses++;
			return null;
		}

		// Check if expired
		if (this.isExpired(entry)) {
			this.delete(key);
			this.stats.misses++;
			return null;
		}

		// Update access time
		entry.accessed = Date.now();
		this.stats.hits++;
		return entry.value;
	}

	/**
	 * Set cache entry with filters
	 * @param {string} baseKey - Base cache key
	 * @param {*} value - Value to cache
	 * @param {Object} filters - Filter object
	 * @param {Object} options - Cache options
	 */
	setWithFilters(baseKey, value, filters, options = {}) {
		const key = this.generateFilterKey(baseKey, filters);
		this.set(key, value, options);

		// Also store in filter cache for pattern matching
		if (!this.filterCache.has(baseKey)) {
			this.filterCache.set(baseKey, new Set());
		}
		this.filterCache.get(baseKey).add(key);
	}

	/**
	 * Get cache entry with filters
	 * @param {string} baseKey - Base cache key
	 * @param {Object} filters - Filter object
	 * @returns {*} - Cached value or null
	 */
	getWithFilters(baseKey, filters) {
		const key = this.generateFilterKey(baseKey, filters);
		return this.get(key);
	}

	/**
	 * Check if cache entry exists
	 * @param {string} key - Cache key
	 * @returns {boolean} - True if exists and not expired
	 */
	has(key) {
		const entry = this.cache.get(key);
		if (!entry) return false;
		
		if (this.isExpired(entry)) {
			this.delete(key);
			return false;
		}
		
		return true;
	}

	/**
	 * Delete cache entry
	 * @param {string} key - Cache key
	 */
	delete(key) {
		const deleted = this.cache.delete(key);
		
		if (this.timers.has(key)) {
			clearTimeout(this.timers.get(key));
			this.timers.delete(key);
		}

		// Clean up filter cache references
		for (const [baseKey, keySet] of this.filterCache.entries()) {
			if (keySet.has(key)) {
				keySet.delete(key);
				if (keySet.size === 0) {
					this.filterCache.delete(baseKey);
				}
			}
		}

		if (deleted) {
			this.stats.evictions++;
		}
		
		return deleted;
	}

	/**
	 * Clear cache entries by key pattern
	 * @param {string} pattern - Pattern to match (supports wildcards)
	 */
	clearPattern(pattern) {
		const regex = new RegExp(pattern.replace(/\*/g, ".*"));
		const keysToDelete = [];

		for (const key of this.cache.keys()) {
			if (regex.test(key)) {
				keysToDelete.push(key);
			}
		}

		keysToDelete.forEach(key => this.delete(key));
		return keysToDelete.length;
	}

	/**
	 * Clear all cache entries for a specific key
	 * @param {string} baseKey - Base cache key
	 */
	clearKey(baseKey) {
		// Clear the base key
		this.delete(baseKey);

		// Clear all filtered variants
		if (this.filterCache.has(baseKey)) {
			const keySet = this.filterCache.get(baseKey);
			for (const key of keySet) {
				this.delete(key);
			}
			this.filterCache.delete(baseKey);
		}

		// Also clear by pattern for safety
		this.clearPattern(`${baseKey}_*`);
	}

	/**
	 * Clear all cache entries
	 */
	clear() {
		// Clear all timers
		for (const timer of this.timers.values()) {
			clearTimeout(timer);
		}

		this.cache.clear();
		this.filterCache.clear();
		this.timers.clear();
		this.stats.evictions += this.cache.size;
	}

	/**
	 * Get cache statistics
	 * @returns {Object} - Cache statistics
	 */
	getStats() {
		return {
			...this.stats,
			size: this.cache.size,
			hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
		};
	}

	/**
	 * Get all cache keys
	 * @returns {Array} - Array of cache keys
	 */
	keys() {
		return Array.from(this.cache.keys());
	}

	/**
	 * Get cache size
	 * @returns {number} - Number of cache entries
	 */
	size() {
		return this.cache.size;
	}

	/**
	 * Check if cache entry is expired
	 * @param {Object} entry - Cache entry
	 * @returns {boolean} - True if expired
	 */
	isExpired(entry) {
		if (entry.maxAge <= 0) return false; // No expiration
		return Date.now() - entry.timestamp > entry.maxAge;
	}

	/**
	 * Evict oldest cache entry (LRU)
	 */
	evictOldest() {
		let oldestKey = null;
		let oldestTime = Infinity;

		for (const [key, entry] of this.cache.entries()) {
			if (entry.accessed < oldestTime) {
				oldestTime = entry.accessed;
				oldestKey = key;
			}
		}

		if (oldestKey) {
			this.delete(oldestKey);
		}
	}

	/**
	 * Start cleanup interval for expired entries
	 */
	startCleanupInterval() {
		setInterval(() => {
			this.cleanup();
		}, CACHE_CONFIG.CLEANUP_INTERVAL);
	}

	/**
	 * Clean up expired entries
	 */
	cleanup() {
		const expiredKeys = [];

		for (const [key, entry] of this.cache.entries()) {
			if (this.isExpired(entry)) {
				expiredKeys.push(key);
			}
		}

		expiredKeys.forEach(key => this.delete(key));
		
		if (expiredKeys.length > 0) {
			console.debug(`Cache cleanup: removed ${expiredKeys.length} expired entries`);
		}
	}

	/**
	 * Preload cache with data
	 * @param {Object} data - Data to preload { key: value }
	 * @param {Object} options - Cache options
	 */
	preload(data, options = {}) {
		for (const [key, value] of Object.entries(data)) {
			this.set(key, value, options);
		}
	}

	/**
	 * Get cache entries by prefix
	 * @param {string} prefix - Key prefix
	 * @returns {Object} - Object with matching entries
	 */
	getByPrefix(prefix) {
		const result = {};
		
		for (const [key, entry] of this.cache.entries()) {
			if (key.startsWith(prefix) && !this.isExpired(entry)) {
				result[key] = entry.value;
			}
		}
		
		return result;
	}

	/**
	 * Invalidate cache entries by tags
	 * @param {Array} tags - Tags to invalidate
	 */
	invalidateByTags(tags) {
		// This would require storing tags with entries
		// For now, we'll use pattern matching
		tags.forEach(tag => {
			this.clearPattern(`*${tag}*`);
		});
	}
}

// Export singleton instance
export const cacheService = new CacheService();

// Export for testing
export { CacheService, CACHE_CONFIG };

// Legacy default export
export default cacheService;
