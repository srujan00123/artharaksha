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
 * Now uses localStorage for persistence across page refreshes
 */
class CacheService {
	constructor() {
		this.storagePrefix = 'artha_cache_';
		this.metaKey = 'artha_cache_meta';
		this.filterCache = new Map(); // In-memory cache for filter mappings
		this.timers = new Map(); // TTL timers
		this.stats = this.loadStats() || {
			hits: 0,
			misses: 0,
			sets: 0,
			evictions: 0,
		};

		// Initialize from localStorage
		this.initializeFromStorage();
		
		// Start cleanup interval
		this.startCleanupInterval();
	}

	/**
	 * Initialize cache from localStorage
	 */
	initializeFromStorage() {
		try {
			const meta = this.getStorageMeta();
			if (meta && meta.filterMappings) {
				// Restore filter mappings
				for (const [baseKey, keys] of Object.entries(meta.filterMappings)) {
					this.filterCache.set(baseKey, new Set(keys));
				}
			}
			
			// Clean up expired entries on initialization
			this.cleanup();
		} catch (error) {
			console.warn('Failed to initialize cache from storage:', error);
			this.clearStorage();
		}
	}

	/**
	 * Get storage metadata
	 */
	getStorageMeta() {
		try {
			const meta = localStorage.getItem(this.metaKey);
			return meta ? JSON.parse(meta) : null;
		} catch (error) {
			console.warn('Failed to parse cache metadata:', error);
			return null;
		}
	}

	/**
	 * Save storage metadata
	 */
	saveStorageMeta() {
		try {
			const filterMappings = {};
			for (const [baseKey, keySet] of this.filterCache.entries()) {
				filterMappings[baseKey] = Array.from(keySet);
			}
			
			const meta = {
				filterMappings,
				lastCleanup: Date.now(),
				version: '1.0'
			};
			
			localStorage.setItem(this.metaKey, JSON.stringify(meta));
		} catch (error) {
			console.warn('Failed to save cache metadata:', error);
		}
	}

	/**
	 * Load stats from localStorage
	 */
	loadStats() {
		try {
			const stats = localStorage.getItem(this.storagePrefix + 'stats');
			return stats ? JSON.parse(stats) : null;
		} catch (error) {
			console.warn('Failed to load cache stats:', error);
			return null;
		}
	}

	/**
	 * Save stats to localStorage
	 */
	saveStats() {
		try {
			localStorage.setItem(this.storagePrefix + 'stats', JSON.stringify(this.stats));
		} catch (error) {
			console.warn('Failed to save cache stats:', error);
		}
	}

	/**
	 * Clear all localStorage entries
	 */
	clearStorage() {
		try {
			const keys = Object.keys(localStorage);
			for (const key of keys) {
				if (key.startsWith(this.storagePrefix) || key === this.metaKey) {
					localStorage.removeItem(key);
				}
			}
		} catch (error) {
			console.warn('Failed to clear cache storage:', error);
		}
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

		try {
			// Check cache size and evict if necessary
			if (this.size() >= CACHE_CONFIG.MAX_CACHE_SIZE) {
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

			// Save to localStorage
			const storageKey = this.storagePrefix + key;
			localStorage.setItem(storageKey, JSON.stringify(entry));
			
			this.stats.sets++;
			this.saveStats();

			// Set TTL timer
			if (maxAge > 0) {
				const timer = setTimeout(() => {
					this.delete(key);
				}, maxAge);
				this.timers.set(key, timer);
			}
		} catch (error) {
			console.warn('Failed to set cache entry:', error);
			// Fall back to in-memory if localStorage fails
			if (error.name === 'QuotaExceededError') {
				this.evictOldest();
				// Try again after eviction
				try {
					const storageKey = this.storagePrefix + key;
					localStorage.setItem(storageKey, JSON.stringify({
						value,
						timestamp: Date.now(),
						maxAge,
						accessed: Date.now(),
					}));
				} catch (retryError) {
					console.warn('Cache storage quota exceeded, skipping cache set');
				}
			}
		}
	}

	/**
	 * Get cache entry
	 * @param {string} key - Cache key
	 * @returns {*} - Cached value or null
	 */
	get(key) {
		try {
			const storageKey = this.storagePrefix + key;
			const stored = localStorage.getItem(storageKey);
			
			if (!stored) {
				this.stats.misses++;
				this.saveStats();
				return null;
			}

			const entry = JSON.parse(stored);

			// Check if expired
			if (this.isExpired(entry)) {
				this.delete(key);
				this.stats.misses++;
				this.saveStats();
				return null;
			}

			// Update access time and save back to storage
			entry.accessed = Date.now();
			localStorage.setItem(storageKey, JSON.stringify(entry));
			
			this.stats.hits++;
			this.saveStats();
			return entry.value;
		} catch (error) {
			console.warn('Failed to get cache entry:', error);
			this.stats.misses++;
			this.saveStats();
			return null;
		}
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
		
		// Save metadata to localStorage
		this.saveStorageMeta();
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
		try {
			const storageKey = this.storagePrefix + key;
			const stored = localStorage.getItem(storageKey);
			if (!stored) return false;
			
			const entry = JSON.parse(stored);
			if (this.isExpired(entry)) {
				this.delete(key);
				return false;
			}
			
			return true;
		} catch (error) {
			console.warn('Failed to check cache entry:', error);
			return false;
		}
	}

	/**
	 * Delete cache entry
	 * @param {string} key - Cache key
	 */
	delete(key) {
		try {
			const storageKey = this.storagePrefix + key;
			const existed = localStorage.getItem(storageKey) !== null;
			localStorage.removeItem(storageKey);
			
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

			if (existed) {
				this.stats.evictions++;
				this.saveStats();
				this.saveStorageMeta();
			}
			
			return existed;
		} catch (error) {
			console.warn('Failed to delete cache entry:', error);
			return false;
		}
	}

	/**
	 * Clear cache entries by key pattern
	 * @param {string} pattern - Pattern to match (supports wildcards)
	 */
	clearPattern(pattern) {
		const regex = new RegExp(pattern.replace(/\*/g, ".*"));
		const keysToDelete = [];

		for (const key of this.keys()) {
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
		try {
			// Clear all timers
			for (const timer of this.timers.values()) {
				clearTimeout(timer);
			}

			// Clear localStorage entries
			this.clearStorage();
			
			this.filterCache.clear();
			this.timers.clear();
			
			const currentSize = this.size();
			this.stats.evictions += currentSize;
			this.saveStats();
		} catch (error) {
			console.warn('Failed to clear cache:', error);
		}
	}

	/**
	 * Get cache statistics
	 * @returns {Object} - Cache statistics
	 */
	getStats() {
		return {
			...this.stats,
			size: this.size(),
			hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
		};
	}

	/**
	 * Get all cache keys
	 * @returns {Array} - Array of cache keys
	 */
	keys() {
		try {
			const keys = Object.keys(localStorage);
			return keys
				.filter(key => key.startsWith(this.storagePrefix))
				.map(key => key.substring(this.storagePrefix.length));
		} catch (error) {
			console.warn('Failed to get cache keys:', error);
			return [];
		}
	}

	/**
	 * Get cache size
	 * @returns {number} - Number of cache entries
	 */
	size() {
		try {
			const keys = Object.keys(localStorage);
			return keys.filter(key => key.startsWith(this.storagePrefix)).length;
		} catch (error) {
			console.warn('Failed to get cache size:', error);
			return 0;
		}
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
		try {
			let oldestKey = null;
			let oldestTime = Infinity;

			const keys = this.keys();
			for (const key of keys) {
				const storageKey = this.storagePrefix + key;
				const stored = localStorage.getItem(storageKey);
				if (stored) {
					try {
						const entry = JSON.parse(stored);
						if (entry.accessed < oldestTime) {
							oldestTime = entry.accessed;
							oldestKey = key;
						}
					} catch (parseError) {
						// Invalid entry, delete it
						localStorage.removeItem(storageKey);
					}
				}
			}

			if (oldestKey) {
				this.delete(oldestKey);
			}
		} catch (error) {
			console.warn('Failed to evict oldest cache entry:', error);
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
		try {
			const expiredKeys = [];
			const keys = this.keys();

			for (const key of keys) {
				const storageKey = this.storagePrefix + key;
				const stored = localStorage.getItem(storageKey);
				if (stored) {
					try {
						const entry = JSON.parse(stored);
						if (this.isExpired(entry)) {
							expiredKeys.push(key);
						}
					} catch (parseError) {
						// Invalid entry, mark for deletion
						expiredKeys.push(key);
					}
				}
			}

			expiredKeys.forEach(key => this.delete(key));
			
			if (expiredKeys.length > 0) {
				console.debug(`Cache cleanup: removed ${expiredKeys.length} expired entries`);
			}
		} catch (error) {
			console.warn('Failed to cleanup cache:', error);
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
		try {
			const result = {};
			const keys = this.keys();
			
			for (const key of keys) {
				if (key.startsWith(prefix)) {
					const storageKey = this.storagePrefix + key;
					const stored = localStorage.getItem(storageKey);
					if (stored) {
						try {
							const entry = JSON.parse(stored);
							if (!this.isExpired(entry)) {
								result[key] = entry.value;
							}
						} catch (parseError) {
							// Invalid entry, skip it
							continue;
						}
					}
				}
			}
			
			return result;
		} catch (error) {
			console.warn('Failed to get cache entries by prefix:', error);
			return {};
		}
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

	/**
	 * Debug method to show cache contents in localStorage
	 * @returns {Object} - Debug information
	 */
	debug() {
		try {
			const keys = this.keys();
			const entries = {};
			const meta = this.getStorageMeta();
			
			for (const key of keys) {
				const storageKey = this.storagePrefix + key;
				const stored = localStorage.getItem(storageKey);
				if (stored) {
					try {
						const entry = JSON.parse(stored);
						entries[key] = {
							value: entry.value,
							timestamp: new Date(entry.timestamp).toISOString(),
							accessed: new Date(entry.accessed).toISOString(),
							maxAge: entry.maxAge,
							expired: this.isExpired(entry)
						};
					} catch (parseError) {
						entries[key] = { error: 'Invalid JSON' };
					}
			}
		}

		return {
			entries,
				meta,
				stats: this.stats,
				totalKeys: keys.length,
				storageUsed: this.getStorageUsage()
			};
		} catch (error) {
			console.warn('Failed to debug cache:', error);
			return { error: error.message };
		}
	}

	/**
	 * Get approximate localStorage usage for cache
	 * @returns {Object} - Storage usage info
	 */
	getStorageUsage() {
		try {
			let totalSize = 0;
			const keys = Object.keys(localStorage);
			const cacheKeys = keys.filter(key => key.startsWith(this.storagePrefix) || key === this.metaKey);
			
			for (const key of cacheKeys) {
				const value = localStorage.getItem(key);
				if (value) {
					totalSize += key.length + value.length;
				}
			}
			
			return {
				totalKeys: cacheKeys.length,
				approximateBytes: totalSize,
				approximateKB: Math.round(totalSize / 1024 * 100) / 100
			};
		} catch (error) {
			return { error: error.message };
		}
	}
}

// Export singleton instance
export const cacheService = new CacheService();

// Export for testing
export { CacheService, CACHE_CONFIG };

// Legacy default export
export default cacheService;

// Global debug helper for development
if (typeof window !== 'undefined') {
	window.debugCache = () => {
		console.log('=== Artha Cache Debug ===');
		console.log(cacheService.debug());
		console.log('=== localStorage keys ===');
		console.log(Object.keys(localStorage).filter(key => key.startsWith('artha_cache_') || key === 'artha_cache_meta'));
	};
}
