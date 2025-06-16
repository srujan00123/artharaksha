// Custom currency formatter for Indian format
export function formatCurrency(amount) {
	return new Intl.NumberFormat("en-IN").format(amount)
}

// CHE (Catastrophic Health Expenditure) calculations
export function calculateCHE(annualIncome, annualExpenses) {
	if (!annualIncome || annualIncome <= 0) return 0
	return Math.round((annualExpenses / annualIncome) * 100)
}

// Get color class based on CHE ratio
export function getCHEColorClass(ratio) {
	if (ratio > 25) return "bg-red-500"
	if (ratio > 10) return "bg-yellow-500"
	return "bg-green-500"
}

// Get CHE status text
export function getCHEStatusText(ratio) {
	if (ratio > 25) return "Critical: Expenses exceed 25% of annual income"
	if (ratio > 10) return "Warning: Expenses exceed 10% of annual income"
	return "Healthy: Expenses below 10% of annual income"
}
