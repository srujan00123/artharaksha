/**
 * Income Service - Exact Backend API Alignment
 * No backward compatibility - works directly with backend API structure
 */

import { call } from "frappe-ui"
import type {
	CreateIncomeResponse,
	GetUserIncomeResponse,
	IncomeAnalytics,
	IncomeFilters,
	IncomeFormData,
	IncomeRecord,
	IncomeServiceOptions,
	IncomeTypeRecord,
	ValidationResponse,
	convertIncomeAmount,
} from "../types/income"
import { CACHE_KEYS, cacheService } from "./cache-service.js"

class IncomeService {
	/**
	 * Get user income records (exact backend API response)
	 */
	async getUserIncome(
		options: IncomeServiceOptions = {},
	): Promise<IncomeRecord[]> {
		try {
			const {
				filters,
				include_analytics = false,
				forceRefresh = false,
				useCache = true,
			} = options

			// Generate cache key based on filters
			const cacheKey = useCache
				? cacheService.generateFilterKey(CACHE_KEYS.USER_INCOME, filters || {})
				: null

			// Check cache first (unless force refresh)
			if (cacheKey && !forceRefresh) {
				const cached = cacheService.getWithFilters(
					CACHE_KEYS.USER_INCOME,
					filters || {},
				)
				if (cached) {
					console.log("Income Service: Returning cached data")
					return cached
				}
			}

			console.log("Income Service: Fetching from API with filters:", filters)

			// Call backend API exactly as defined in income.py
			const response = await call("artha.api.income.get_user_income", {
				filters: filters ? JSON.stringify(filters) : null,
				include_analytics: include_analytics,
			})

			let incomeRecords: IncomeRecord[] = []

			// Handle response format from backend
			if (include_analytics && response?.income_records) {
				incomeRecords = response.income_records
			} else if (Array.isArray(response)) {
				incomeRecords = response
			} else {
				console.warn('Income Service: Unexpected response format:', response)
				return []
			}

			// Cache the result if caching is enabled
			if (cacheKey && useCache) {
				cacheService.setWithFilters(CACHE_KEYS.USER_INCOME, filters || {}, incomeRecords)
			}

			console.log(`Income Service: Fetched ${incomeRecords.length} income records`)
			return incomeRecords
		} catch (error) {
			console.error("Income Service: Error fetching user income:", error)
			throw new Error(`Failed to fetch income data: ${error.message}`)
		}
	}

	/**
	 * Get user income with analytics (exact backend API response)
	 */
	async getUserIncomeWithAnalytics(
		options: IncomeServiceOptions = {},
	): Promise<{ incomes: IncomeRecord[]; analytics: IncomeAnalytics }> {
		try {
			const { filters, forceRefresh = false, useCache = true } = options

			// Generate cache keys
			const incomeKey = useCache
				? cacheService.generateFilterKey(CACHE_KEYS.USER_INCOME, filters || {})
				: null
			const analyticsKey = useCache
				? cacheService.generateFilterKey(
					CACHE_KEYS.USER_INCOME_ANALYTICS,
					filters || {},
				)
				: null

			// Check cache first (unless force refresh)
			if (incomeKey && analyticsKey && !forceRefresh) {
				const cachedIncomes = cacheService.getWithFilters(
					CACHE_KEYS.USER_INCOME,
					filters || {},
				)
				const cachedAnalytics = cacheService.getWithFilters(
					CACHE_KEYS.USER_INCOME_ANALYTICS,
					filters || {},
				)

				if (cachedIncomes && cachedAnalytics) {
					console.log("Income Service: Returning cached income and analytics")
					return { incomes: cachedIncomes, analytics: cachedAnalytics }
				}
			}

			console.log("Income Service: Fetching income with analytics from API")

			// Call backend API with analytics
			const response: GetUserIncomeResponse = await call(
				"artha.api.income.get_user_income",
				{
					filters: filters ? JSON.stringify(filters) : null,
					include_analytics: true,
				},
			)

			// Use exact backend response structure
			const incomes = response.income_records || []
			const analytics = response.analytics || {
				total_income: 0,
				recurring_income: 0,
				one_time_income: 0,
				income_by_type: {},
				monthly_trends: [],
				summary: {
					total_sources: 0,
					average_source_amount: 0,
					top_income_type: "",
				},
			}

			// Cache the results if caching is enabled
			if (useCache) {
				if (incomeKey) {
					cacheService.setWithFilters(
						CACHE_KEYS.USER_INCOME,
						filters || {},
						incomes,
					)
				}
				if (analyticsKey) {
					cacheService.setWithFilters(
						CACHE_KEYS.USER_INCOME_ANALYTICS,
						filters || {},
						analytics,
					)
				}
			}

			console.log(
				`Income Service: Processed ${incomes.length} incomes with analytics`,
			)
			return { incomes, analytics }
		} catch (error) {
			console.error(
				"Income Service: Error fetching income with analytics:",
				error,
			)
			throw new Error(`Failed to fetch income analytics: ${error.message}`)
		}
	}

	/**
	 * Get income types (exact backend API response)
	 */
	async getIncomeTypes(
		options: IncomeServiceOptions = {},
	): Promise<IncomeTypeRecord[]> {
		try {
			const { forceRefresh = false, useCache = true } = options

			// Check cache first
			if (useCache && !forceRefresh) {
				const cached = cacheService.get(CACHE_KEYS.INCOME_TYPES)
				if (cached) {
					console.log("Income Service: Returning cached income types")
					return cached
				}
			}

			console.log("Income Service: Fetching income types from API")

			const response = await call("artha.api.income.get_income_types")
			const incomeTypes: IncomeTypeRecord[] = response || []

			// Cache the result
			if (useCache) {
				cacheService.set(
					CACHE_KEYS.INCOME_TYPES,
					incomeTypes,
					24 * 60 * 60 * 1000,
				) // 24 hours
			}

			console.log(`Income Service: Fetched ${incomeTypes.length} income types`)
			return incomeTypes
		} catch (error) {
			console.error("Income Service: Error fetching income types:", error)
			throw new Error(`Failed to fetch income types: ${error.message}`)
		}
	}

	/**
	 * Create or update income record (exact backend API parameters)
	 */
	async createOrUpdateIncome(
		incomeData: IncomeFormData,
	): Promise<CreateIncomeResponse> {
		try {
			console.log("Income Service: Creating/updating income:", incomeData)

			// Call backend API with exact parameter structure
			const response: CreateIncomeResponse = await call(
				"artha.api.income.create_or_update_income",
				{
					monthly_income: incomeData.monthly_income,
					income_source: JSON.stringify(incomeData.income_source),
					income_name: incomeData.income_name || null,
				},
			)

			console.log("Income Service: Backend response:", response)

			// Clear relevant caches
			this.clearCache()

			console.log("Income Service: Successfully created/updated income")
			return response
		} catch (error) {
			console.error("Income Service: Error creating/updating income:", error)
			throw new Error(`Failed to save income: ${error.message}`)
		}
	}

	/**
	 * Delete income record
	 */
	async deleteIncome(incomeId: string): Promise<void> {
		try {
			console.log("Income Service: Deleting income:", incomeId)

			await call("frappe.client.delete", {
				doctype: "Income",
				name: incomeId,
			})

			// Clear relevant caches
			this.clearCache()

			console.log("Income Service: Successfully deleted income")
		} catch (error) {
			console.error("Income Service: Error deleting income:", error)
			throw new Error(`Failed to delete income: ${error.message}`)
		}
	}

	/**
	 * Get income analytics for a specific period (exact backend API)
	 */
	async getIncomeAnalytics(
		period = "last_3_months",
		filters?: IncomeFilters,
	): Promise<IncomeAnalytics> {
		try {
			const analyticsFilters = { ...filters, period }

			// Use the unified endpoint
			const result = await this.getUserIncomeWithAnalytics({
				filters: analyticsFilters,
			})
			return result.analytics
		} catch (error) {
			console.error("Income Service: Error fetching analytics:", error)
			throw new Error(`Failed to fetch income analytics: ${error.message}`)
		}
	}

	/**
	 * Validate income data before saving (exact backend API)
	 */
	async validateIncomeData(
		incomeData: IncomeFormData,
	): Promise<ValidationResponse> {
		try {
			const response: ValidationResponse = await call(
				"artha.api.income.validate_income_data",
				{
					monthly_income: incomeData.monthly_income,
					income_source: JSON.stringify(incomeData.income_source),
				},
			)

			return (
				response || {
					is_valid: false,
					errors: { general: "Validation failed" },
				}
			)
		} catch (error) {
			console.error("Income Service: Error validating income data:", error)
			return {
				is_valid: false,
				errors: { general: `Validation error: ${error.message}` },
			}
		}
	}

	/**
	 * Clear all income-related caches
	 */
	clearCache(): void {
		console.log("Income Service: Clearing all caches")
		cacheService.delete(CACHE_KEYS.USER_INCOME)
		cacheService.delete(CACHE_KEYS.USER_INCOME_ANALYTICS)
		cacheService.delete(CACHE_KEYS.INCOME_TYPES)

		// Clear filter-specific caches using clearKey method
		cacheService.clearKey(CACHE_KEYS.USER_INCOME)
		cacheService.clearKey(CACHE_KEYS.USER_INCOME_ANALYTICS)
	}
}

// Export singleton instance
export const incomeService = new IncomeService()
