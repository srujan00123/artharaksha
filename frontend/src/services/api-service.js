/**
 * API Service - Robust & Redundancy-Free
 * Centralized API endpoint management with consistent error handling
 */

// API Endpoints - Centralized endpoint definitions
export const API_ENDPOINTS = {
	INCOME: {
		USER_INCOME: "artha.api.income.get_user_income",
		TYPES: "artha.api.income.get_income_types",
		CREATE_OR_UPDATE: "artha.api.income.create_or_update_income",
		VALIDATE: "artha.api.income.validate_income_data",
		DASHBOARD_METRICS: "artha.api.income.get_income_dashboard_metrics",
		MONTHLY_SUMMARY: "artha.api.income.get_monthly_income_summary",
		INSIGHTS: "artha.api.income.get_income_insights",
		CREATE_DIRECT_LEDGER: "artha.api.income.create_direct_ledger_entry",
		UPDATE_LEDGER_ENTRY: "artha.api.income.update_ledger_entry",
		DELETE_LEDGER_ENTRY: "artha.api.income.delete_ledger_entry",
		CREATE_LEDGER_ENTRY: "artha.api.income.create_ledger_entry",
		UPDATE_RECURRING_LEDGER: "artha.api.income.update_recurring_ledger_entries",
	},
	EXPENSE: {
		USER_EXPENSES: "artha.api.expense.get_user_expenses",
		TYPES: "artha.api.expense.get_expense_types",
		CREATE: "artha.api.expense.create_expense",
		UPDATE: "artha.api.expense.update_expense",
		DELETE: "artha.api.expense.delete_expense",
		DASHBOARD_METRICS: "artha.api.expense.get_expense_dashboard_metrics",
		VALIDATE: "artha.api.expense.validate_expense_data",
	},
	AUTH: {
		LOGIN: "login",
		LOGOUT: "logout",
		SESSION: "artha.api.auth.get_session_user",
	},
	PROFILE: {
		GET: "artha.api.profile.get_user_profile",
		UPDATE: "artha.api.profile.update_user_profile",
		HOUSEHOLD: "artha.api.profile.get_household_profile",
	},
	SUPPORT: {
		HEALTH_CONDITIONS: "artha.api.support.get_health_conditions",
		WELFARE_SCHEMES: "artha.api.support.get_welfare_schemes",
		INSURANCE_SCHEMES: "artha.api.support.get_insurance_schemes",
		ALL_SCHEMES: "artha.api.support.get_all_schemes",
		PATHWAYS: "artha.api.support.get_support_pathways",
		HOUSEHOLD_PROFILE: "artha.api.support.get_household_profile",
		ELIGIBLE_SCHEMES: "artha.api.support.get_eligible_schemes",
		RECOMMENDATIONS: "artha.api.support.get_support_recommendations",
		UPDATE_HEALTH_CONDITIONS: "artha.api.support.update_health_conditions",
		GET_APPLICATIONS: "artha.api.support.get_scheme_applications",
		CREATE_APPLICATION: "artha.api.support.create_scheme_application",
		UPDATE_APPLICATION: "artha.api.support.update_scheme_application",
		DELETE_APPLICATION: "artha.api.support.delete_scheme_application",
		GET_CLAIMS: "artha.api.support.get_scheme_claims",
		CREATE_CLAIM: "artha.api.support.create_scheme_claim",
		UPDATE_CLAIM: "artha.api.support.update_scheme_claim",
		DELETE_CLAIM: "artha.api.support.delete_scheme_claim",
	},
}

/**
 * API Service Class
 * Provides consistent error handling and request management
 */
class ApiService {
	constructor() {
		this.requestCount = 0
		this.activeRequests = new Set()
	}

	/**
	 * Execute a frappe-ui call with consistent error handling
	 * @param {Promise} callPromise - The frappe-ui call promise
	 * @param {Object} options - Optional configuration
	 * @returns {Promise} - The API response
	 */
	async execute(callPromise, options = {}) {
		const requestId = ++this.requestCount
		
		try {
			this.activeRequests.add(requestId)
			
			// Set default timeout if not specified
			const timeout = options.timeout || 30000 // 30 seconds default
			
			// Create timeout promise
			const timeoutPromise = new Promise((_, reject) => {
				setTimeout(() => {
					reject(new Error(`Request timeout after ${timeout}ms`))
				}, timeout)
			})

			// Race between the API call and timeout
			const response = await Promise.race([callPromise, timeoutPromise])

			// Handle frappe-ui response format
			if (response && typeof response === 'object') {
				// Check for frappe error format
				if (response.exc_type || response.exception) {
					throw new Error(response.exception || response.exc_type || 'API Error')
				}
				
				// Return the message if it exists, otherwise return the whole response
				return response.message || response
			}

			return response
		} catch (error) {
			// Enhanced error handling
			if (error.name === 'AbortError') {
				throw new Error('Request was cancelled')
			}
			
			if (error.message?.includes('timeout')) {
				throw new Error('Request timed out. Please check your connection and try again.')
			}
			
			if (error.message?.includes('Network Error') || error.message?.includes('Failed to fetch')) {
				throw new Error('Network error. Please check your internet connection.')
			}
			
			// Handle frappe authentication errors
			if (error.message?.includes('Not permitted') || error.message?.includes('Forbidden')) {
				throw new Error('You do not have permission to perform this action.')
			}
			
			if (error.message?.includes('Session Expired') || error.message?.includes('Unauthorized')) {
				throw new Error('Your session has expired. Please log in again.')
			}

			// Handle validation errors
			if (error.message?.includes('ValidationError') || error.message?.includes('Invalid')) {
				throw new Error(error.message || 'Invalid data provided.')
			}

			// Default error handling
			throw new Error(error.message || 'An unexpected error occurred.')
		} finally {
			this.activeRequests.delete(requestId)
		}
	}

	/**
	 * Cancel all active requests (useful for cleanup)
	 */
	cancelAllRequests() {
		this.activeRequests.clear()
	}

	/**
	 * Get the number of active requests
	 */
	getActiveRequestCount() {
		return this.activeRequests.size
	}

	/**
	 * Check if there are any active requests
	 */
	hasActiveRequests() {
		return this.activeRequests.size > 0
	}
}

// Export singleton instance
export const apiService = new ApiService()

// Legacy exports for backward compatibility
export default apiService
