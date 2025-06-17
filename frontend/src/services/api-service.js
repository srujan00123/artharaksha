/**
 * Centralized API Service
 * Handles all API communications with error handling and retry logic
 */

import {
	createDocumentResource,
	createListResource,
	createResource,
} from "frappe-ui"

export class ApiService {
	constructor() {
		this.defaultRetries = 2
		this.defaultTimeout = 30000
	}

	/**
	 * Create a generic resource with standard configuration
	 */
	createResource(config) {
		return createResource({
			auto: false,
			...config,
		})
	}

	/**
	 * Create a document resource with standard configuration
	 */
	createDocumentResource(config) {
		return createDocumentResource({
			auto: false,
			...config,
		})
	}

	/**
	 * Create a list resource with standard configuration
	 */
	createListResource(config) {
		return createListResource({
			auto: true,
			realtime: true,
			...config,
		})
	}

	/**
	 * Execute API call with retry logic
	 */
	async execute(resourceOrPromise, options = {}) {
		const {
			retries = this.defaultRetries,
			timeout = this.defaultTimeout,
			onRetry = null,
		} = options

		let lastError

		for (let attempt = 0; attempt <= retries; attempt++) {
			try {
				if (typeof resourceOrPromise === "function") {
					return await this.withTimeout(resourceOrPromise(), timeout)
				} else if (resourceOrPromise?.submit) {
					return await this.withTimeout(resourceOrPromise.submit(), timeout)
				} else if (resourceOrPromise?.reload) {
					return await this.withTimeout(resourceOrPromise.reload(), timeout)
				} else {
					return await this.withTimeout(resourceOrPromise, timeout)
				}
			} catch (error) {
				lastError = error

				if (attempt < retries) {
					const delay = Math.pow(2, attempt) * 1000 // Exponential backoff
					if (onRetry) {
						onRetry(attempt + 1, error)
					}
					await this.delay(delay)
				} else {
					break
				}
			}
		}

		throw lastError
	}

	/**
	 * Add timeout to promise
	 */
	withTimeout(promise, timeout) {
		return Promise.race([
			promise,
			new Promise((_, reject) =>
				setTimeout(() => reject(new Error("Request timeout")), timeout),
			),
		])
	}

	/**
	 * Delay execution
	 */
	delay(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms))
	}

	/**
	 * Handle API errors with standardized format
	 */
	handleError(error, context = "") {
		const errorInfo = {
			message: error.message || "Unknown error",
			context,
			timestamp: new Date().toISOString(),
			type: this.getErrorType(error),
		}

		// Log error for debugging
		console.error(`API Error [${context}]:`, errorInfo)

		return errorInfo
	}

	/**
	 * Determine error type for better handling
	 */
	getErrorType(error) {
		if (
			error.message?.includes("PermissionError") ||
			error.message?.includes("403")
		) {
			return "permission"
		}
		if (error.message?.includes("timeout")) {
			return "timeout"
		}
		if (
			error.message?.includes("Network") ||
			error.message?.includes("fetch")
		) {
			return "network"
		}
		if (error.message?.includes("ValidationError")) {
			return "validation"
		}
		return "unknown"
	}

	/**
	 * Check if error is retryable
	 */
	isRetryableError(error) {
		const type = this.getErrorType(error)
		return ["timeout", "network"].includes(type)
	}
}

// Create default instance
export const apiService = new ApiService()

// API endpoints constants
export const API_ENDPOINTS = {
	EXPENSE: {
		TYPES: "artha.api.expense.get_expense_types",
		USER_EXPENSES: "artha.api.expense.get_user_expenses",
		CREATE: "artha.api.expense.create_expense",
		UPDATE: "artha.api.expense.update_expense",
		DELETE: "artha.api.expense.delete_expense",
		VALIDATE: "artha.api.expense.validate_expense_data",
		DASHBOARD_METRICS: "artha.api.expense.get_expense_dashboard_metrics",
	},
	HOUSEHOLD: {
		LIST: "frappe.client.get_list",
		GET: "frappe.client.get",
		CREATE: "frappe.client.insert",
		UPDATE: "frappe.client.set_value",
		DELETE: "frappe.client.delete",
	},
	INCOME: {
		LIST: "frappe.client.get_list",
		GET: "frappe.client.get",
		CREATE: "frappe.client.insert",
		UPDATE: "frappe.client.set_value",
		DELETE: "frappe.client.delete",
		TYPES: "artha.api.income.get_income_types",
		USER_INCOME: "artha.api.income.get_user_income",
		CREATE_OR_UPDATE: "artha.api.income.create_or_update_income",
		VALIDATE: "artha.api.income.validate_income_data",
	},
	USER: {
		LIST: "frappe.client.get_list",
		GET: "frappe.client.get",
		CREATE: "frappe.client.insert",
		UPDATE: "frappe.client.set_value",
		DELETE: "frappe.client.delete",
		PROFILE: "artha.api.auth.get_current_user_profile",
		UPDATE_PROFILE: "artha.api.auth.update_user_profile",
		CHANGE_PASSWORD: "frappe.core.doctype.user.user.update_password",
		UPLOAD_FILE: "upload_file",
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
		// Scheme Applications
		GET_APPLICATIONS: "artha.api.support.get_scheme_applications",
		CREATE_APPLICATION: "artha.api.support.create_scheme_application",
		UPDATE_APPLICATION: "artha.api.support.update_scheme_application",
		DELETE_APPLICATION: "artha.api.support.delete_scheme_application",
		// Scheme Claims
		GET_CLAIMS: "artha.api.support.get_scheme_claims",
		CREATE_CLAIM: "artha.api.support.create_scheme_claim",
		UPDATE_CLAIM: "artha.api.support.update_scheme_claim",
		DELETE_CLAIM: "artha.api.support.delete_scheme_claim",
	},
}

// Error types for consistent error handling
export const ERROR_TYPES = {
	PERMISSION: "permission",
	TIMEOUT: "timeout",
	NETWORK: "network",
	VALIDATION: "validation",
	UNKNOWN: "unknown",
}
