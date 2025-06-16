/**
 * Expense Utilities - New Modular Architecture
 * Pure utility functions only
 * Uses consistent types from types/expense.ts
 */

import {
	MEDICAL_EXPENSE_CATEGORIES as MEDICAL_CATEGORIES,
	OTHER_EXPENSE_CATEGORIES as OTHER_CATEGORIES,
	isProcessedExpenseItem,
} from "../../types/expense"

// Enhanced category configuration with UI metadata
export const MEDICAL_EXPENSE_CATEGORIES = MEDICAL_CATEGORIES.map((cat) => ({
	...cat,
	icon: getIconForCategory(cat.value, "medical"),
	color: getColorForCategory(cat.value, "medical"),
}))

export const OTHER_EXPENSE_CATEGORIES = OTHER_CATEGORIES.map((cat) => ({
	...cat,
	icon: getIconForCategory(cat.value, "other"),
	color: getColorForCategory(cat.value, "other"),
}))

/**
 * Get icon for category
 */
function getIconForCategory(category, type) {
	const iconMap = {
		// Medical icons
		Consultation: "Stethoscope",
		Medication: "Pill",
		"Laboratory Tests": "Microscope",
		Imaging: "Camera",
		Surgery: "Scissors",
		Therapy: "Heart",
		Emergency: "AlertTriangle",
		// Other icons
		Food: "Coffee",
		Transportation: "Car",
		Utilities: "Zap",
		Rent: "Home",
		Education: "GraduationCap",
		Entertainment: "Music",
		Shopping: "ShoppingBag",
		Travel: "MapPin",
		Other: "MoreHorizontal",
	}
	return iconMap[category] || "Calculator"
}

/**
 * Get color for category
 */
function getColorForCategory(category, type) {
	const colorMap = {
		// Medical colors
		Consultation: "blue",
		Medication: "green",
		"Laboratory Tests": "purple",
		Imaging: "indigo",
		Surgery: "red",
		Therapy: "orange",
		Emergency: "red",
		// Other colors
		Food: "orange",
		Transportation: "blue",
		Utilities: "yellow",
		Rent: "green",
		Education: "purple",
		Entertainment: "pink",
		Shopping: "teal",
		Travel: "indigo",
		Other: "gray",
	}
	return colorMap[category] || "gray"
}

/**
 * Get category display information
 */
export function getCategoryInfo(category, type = "medical") {
	const categories =
		type === "medical" ? MEDICAL_EXPENSE_CATEGORIES : OTHER_EXPENSE_CATEGORIES
	return (
		categories.find((cat) => cat.value === category) || {
			value: category,
			label: category,
			icon: "Calculator",
			color: "gray",
		}
	)
}

/**
 * Extract expense date from various possible fields
 */
export function extractExpenseDate(expense) {
	try {
		// Try different date fields in order of preference
		const dateFields = ["date", "date_time", "creation", "modified"]

		for (const field of dateFields) {
			if (expense[field]) {
				const date = new Date(expense[field])
				if (!isNaN(date.getTime())) {
					return date
				}
			}
		}

		// If no valid date found, return current date
		return new Date()
	} catch (error) {
		return new Date()
	}
}

/**
 * Validate a processed expense object
 * Uses type guard from types/expense.ts
 */
export function validateProcessedExpense(expense) {
	try {
		// Use the type guard first
		if (!isProcessedExpenseItem(expense)) {
			return false
		}

		// Additional business logic validation
		const amount = Number.parseFloat(expense.amount)
		if (isNaN(amount) || amount < 0) {
			return false
		}

		if (!/^\d{4}-\d{2}-\d{2}/.test(expense.date)) {
			return false
		}

		const expenseDate = new Date(expense.date)
		const currentYear = new Date().getFullYear()
		const expenseYear = expenseDate.getFullYear()

		if (expenseYear < 1900 || expenseYear > currentYear + 1) {
			return false
		}

		return true
	} catch (error) {
		return false
	}
}

/**
 * Format amount for display
 */
export function formatAmount(amount, currency = "INR", locale = "en-IN") {
	try {
		const numAmount = Number.parseFloat(amount)
		if (isNaN(numAmount)) return "₹0"

		return new Intl.NumberFormat(locale, {
			style: "currency",
			currency: currency,
			minimumFractionDigits: 0,
			maximumFractionDigits: 2,
		}).format(numAmount)
	} catch (error) {
		return `₹${amount || 0}`
	}
}

/**
 * Format date for display in expense context
 */
export function formatExpenseDate(date, locale = "en-IN") {
	try {
		return new Date(date).toLocaleDateString(locale, {
			day: "2-digit",
			month: "short",
			year: "numeric",
		})
	} catch (error) {
		return date
	}
}

/**
 * Get expense summary statistics
 */
export function getExpenseSummary(expenses) {
	if (!Array.isArray(expenses)) return null

	const medical = expenses.filter((e) => e.type === "medical")
	const other = expenses.filter((e) => e.type === "other")

	const medicalTotal = medical.reduce(
		(sum, e) => sum + (Number.parseFloat(e.amount) || 0),
		0,
	)
	const otherTotal = other.reduce(
		(sum, e) => sum + (Number.parseFloat(e.amount) || 0),
		0,
	)
	const total = medicalTotal + otherTotal

	return {
		total: {
			count: expenses.length,
			amount: total,
			formatted: formatAmount(total),
		},
		medical: {
			count: medical.length,
			amount: medicalTotal,
			formatted: formatAmount(medicalTotal),
			percentage: total > 0 ? Math.round((medicalTotal / total) * 100) : 0,
		},
		other: {
			count: other.length,
			amount: otherTotal,
			formatted: formatAmount(otherTotal),
			percentage: total > 0 ? Math.round((otherTotal / total) * 100) : 0,
		},
	}
}

/**
 * Search expenses by term
 */
export function searchExpenses(expenses, searchTerm) {
	if (!Array.isArray(expenses) || !searchTerm?.trim()) return expenses

	const term = searchTerm.toLowerCase().trim()
	return expenses.filter(
		(expense) =>
			expense.category?.toLowerCase().includes(term) ||
			expense.description?.toLowerCase().includes(term) ||
			String(expense.amount).includes(term) ||
			expense.date?.includes(term),
	)
}

/**
 * Sort expenses by field
 */
export function sortExpenses(expenses, sortBy = "date", sortOrder = "desc") {
	if (!Array.isArray(expenses)) return []

	return [...expenses].sort((a, b) => {
		let aVal, bVal

		switch (sortBy) {
			case "amount":
				aVal = Number.parseFloat(a.amount) || 0
				bVal = Number.parseFloat(b.amount) || 0
				break
			case "category":
				aVal = a.category || ""
				bVal = b.category || ""
				break
			case "date":
			default:
				aVal = a.date || ""
				bVal = b.date || ""
				break
		}

		if (sortOrder === "desc") {
			return aVal > bVal ? -1 : aVal < bVal ? 1 : 0
		} else {
			return aVal < bVal ? -1 : aVal > bVal ? 1 : 0
		}
	})
}

// Insurance and condition constants
export const INSURANCE_SCHEMES = {
	pmjay: {
		name: "PM-JAY (Ayushman Bharat)",
		coverage: 500000,
		type: "government",
	},
	esis: { name: "ESIS", coverage: 100000, type: "government" },
	private: {
		name: "Private Health Insurance",
		coverage: 1000000,
		type: "private",
	},
	employer: {
		name: "Employer Health Insurance",
		coverage: 500000,
		type: "employer",
	},
}

export const CONDITION_SEVERITY = {
	mild: { label: "Mild", color: "green", priority: 1 },
	moderate: { label: "Moderate", color: "yellow", priority: 2 },
	severe: { label: "Severe", color: "red", priority: 3 },
	critical: { label: "Critical", color: "red", priority: 4 },
}

export function validateExpenseData(expense) {
	try {
		// Basic type guard
		if (!expense || typeof expense !== "object") {
			return false
		}

		// Check required fields
		if (typeof expense.amount !== "number" || expense.amount <= 0) {
			return false
		}

		// Validate date
		const date = extractExpenseDate(expense)
		if (!date || isNaN(date.getTime())) {
			return false
		}

		// Check if date is within reasonable range (not too far in past/future)
		const now = new Date()
		const fiveYearsAgo = new Date(
			now.getFullYear() - 5,
			now.getMonth(),
			now.getDate(),
		)
		const oneYearFromNow = new Date(
			now.getFullYear() + 1,
			now.getMonth(),
			now.getDate(),
		)

		if (date < fiveYearsAgo || date > oneYearFromNow) {
			return false
		}

		return true
	} catch (error) {
		return false
	}
}
