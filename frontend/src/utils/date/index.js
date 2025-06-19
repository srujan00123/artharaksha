// Timezone configuration
const FALLBACK_TIMEZONE = "Asia/Kolkata" // Default fallback for India

/**
 * Get client's timezone using browser APIs
 */
export function getClientTimezone() {
	try {
		return Intl.DateTimeFormat().resolvedOptions().timeZone
	} catch (error) {
		return FALLBACK_TIMEZONE
	}
}

/**
 * Get current date/time in client's timezone
 */
export function getClientTime() {
	const timezone = getClientTimezone()
	return new Date(new Date().toLocaleString("en-US", { timeZone: timezone }))
}

/**
 * Get current date in YYYY-MM-DD format in client's timezone
 */
export function getClientDateString() {
	const clientTime = getClientTime()
	return (
		clientTime.getFullYear() +
		"-" +
		String(clientTime.getMonth() + 1).padStart(2, "0") +
		"-" +
		String(clientTime.getDate()).padStart(2, "0")
	)
}

/**
 * Get current date and time in YYYY-MM-DDTHH:MM format for datetime-local input in client's timezone
 */
export function getClientDateTimeString() {
	const clientTime = getClientTime()
	return (
		clientTime.getFullYear() +
		"-" +
		String(clientTime.getMonth() + 1).padStart(2, "0") +
		"-" +
		String(clientTime.getDate()).padStart(2, "0") +
		"T" +
		String(clientTime.getHours()).padStart(2, "0") +
		":" +
		String(clientTime.getMinutes()).padStart(2, "0")
	)
}

/**
 * Convert any date to client's timezone and format for datetime-local input
 */
export function toClientDateTimeString(date) {
	const timezone = getClientTimezone()
	const clientDate = new Date(
		date.toLocaleString("en-US", { timeZone: timezone }),
	)
	return (
		clientDate.getFullYear() +
		"-" +
		String(clientDate.getMonth() + 1).padStart(2, "0") +
		"-" +
		String(clientDate.getDate()).padStart(2, "0") +
		"T" +
		String(clientDate.getHours()).padStart(2, "0") +
		":" +
		String(clientDate.getMinutes()).padStart(2, "0")
	)
}

/**
 * Get timezone offset information
 */
export function getTimezoneInfo() {
	try {
		const timezone = getClientTimezone()
		const now = new Date()
		const offset = now.getTimezoneOffset()

		return {
			timezone,
			offset,
			offsetHours: Math.floor(Math.abs(offset) / 60),
			offsetMinutes: Math.abs(offset) % 60,
			isDST: isDaylightSavingTime(now),
			abbreviation: getTimezoneAbbreviation(timezone),
		}
	} catch (error) {
		return {
			timezone: FALLBACK_TIMEZONE,
			offset: 0,
			offsetHours: 0,
			offsetMinutes: 0,
			isDST: false,
			abbreviation: "UTC",
		}
	}
}

// Legacy functions for backward compatibility - now use client timezone
export const getIndiaTime = getClientTime
export const getIndiaDateString = getClientDateString
export const getIndiaDateTimeString = getClientDateTimeString
export const toIndiaDateTimeString = toClientDateTimeString

// Custom date formatter
export function formatDate(dateString, options = {}) {
	try {
		// Handle null/undefined/empty values
		if (!dateString) {
			return "Invalid Date"
		}

		// Handle specific expense field issues where date might be a different field
		let dateValue = dateString
		if (typeof dateString === 'object' && dateString !== null) {
			// If it's an object, try to extract date from common fields
			dateValue = dateString.date_time || dateString.date || dateString.creation || dateString.modified
			if (!dateValue) {
				return "Invalid Date"
			}
		}

		// If it's a datetime string with space (e.g., "2024-01-15 10:30:00"), extract date part
		if (typeof dateValue === "string" && dateValue.includes(" ")) {
			dateValue = dateValue.split(" ")[0]
		}

		const timezone = getClientTimezone()
		const defaultOptions = {
			year: "numeric",
			month: "short",
			day: "numeric",
			timeZone: timezone,
		}

		const date = new Date(dateValue)
		
		// Check if the date is valid
		if (isNaN(date.getTime())) {
			return "Invalid Date"
		}

		return date.toLocaleDateString("en-IN", {
			...defaultOptions,
			...options,
		})
	} catch (error) {
		console.warn("Error formatting date:", error, "Original value:", dateString)
		return "Invalid Date"
	}
}

// Time ago formatter (e.g., "2 hours ago", "3 days ago")
export function getTimeAgo(dateString) {
	const now = getClientTime()
	const date = new Date(dateString)
	const diffInSeconds = Math.floor((now - date) / 1000)

	// Define time intervals in seconds
	const intervals = [
		{ label: "year", seconds: 31536000 },
		{ label: "month", seconds: 2592000 },
		{ label: "week", seconds: 604800 },
		{ label: "day", seconds: 86400 },
		{ label: "hour", seconds: 3600 },
		{ label: "minute", seconds: 60 },
		{ label: "second", seconds: 1 },
	]

	// Handle future dates
	if (diffInSeconds < 0) {
		return "Just now"
	}

	// Find the appropriate interval
	for (const interval of intervals) {
		const count = Math.floor(diffInSeconds / interval.seconds)
		if (count >= 1) {
			return `${count} ${interval.label}${count > 1 ? "s" : ""} ago`
		}
	}

	return "Just now"
}

// Date range utilities for filtering (using client timezone)
export function getDateRange(period) {
	const now = getClientTime()
	const todayStr = getClientDateString()

	switch (period) {
		case "today":
			return {
				from: todayStr,
				to: todayStr,
			}
		case "week":
			// Past 7 days including today
			const weekStart = new Date(now)
			weekStart.setDate(now.getDate() - 6) // 6 days ago + today = 7 days total
			const weekStartStr =
				weekStart.getFullYear() +
				"-" +
				String(weekStart.getMonth() + 1).padStart(2, "0") +
				"-" +
				String(weekStart.getDate()).padStart(2, "0")
			return {
				from: weekStartStr,
				to: todayStr,
			}
		case "month":
			// Past 30 days including today
			const monthStart = new Date(now)
			monthStart.setDate(now.getDate() - 29) // 29 days ago + today = 30 days total
			const monthStartStr =
				monthStart.getFullYear() +
				"-" +
				String(monthStart.getMonth() + 1).padStart(2, "0") +
				"-" +
				String(monthStart.getDate()).padStart(2, "0")
			return {
				from: monthStartStr,
				to: todayStr,
			}
		case "3months":
			// Past 90 days including today
			const threeMonthsStart = new Date(now)
			threeMonthsStart.setDate(now.getDate() - 89) // 89 days ago + today = 90 days total
			const threeMonthsStartStr =
				threeMonthsStart.getFullYear() +
				"-" +
				String(threeMonthsStart.getMonth() + 1).padStart(2, "0") +
				"-" +
				String(threeMonthsStart.getDate()).padStart(2, "0")
			return {
				from: threeMonthsStartStr,
				to: todayStr,
			}
		case "all":
			// Get all data from 1 year ago to today
			const yearStart = new Date(now)
			yearStart.setFullYear(now.getFullYear() - 1)
			const yearStartStr =
				yearStart.getFullYear() +
				"-" +
				String(yearStart.getMonth() + 1).padStart(2, "0") +
				"-" +
				String(yearStart.getDate()).padStart(2, "0")
			return {
				from: yearStartStr,
				to: todayStr,
			}
		default:
			// Default to past month including today
			const defaultStart = new Date(now)
			defaultStart.setDate(now.getDate() - 29)
			const defaultStartStr =
				defaultStart.getFullYear() +
				"-" +
				String(defaultStart.getMonth() + 1).padStart(2, "0") +
				"-" +
				String(defaultStart.getDate()).padStart(2, "0")
			return {
				from: defaultStartStr,
				to: todayStr,
			}
	}
}

// Get default past month filter (using client timezone)
export function getDefaultDateFilter() {
	return getDateRange("month")
}
