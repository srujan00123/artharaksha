/**
 * Page Title Composable
 * Manages page titles and meta descriptions with TypeScript support
 */

import { type Ref, ref, watch } from "vue"
import { type RouteLocationNormalized, useRoute } from "vue-router"

const baseTitle = "Artha Raksha"
const currentTitle: Ref<string> = ref(baseTitle)

// Page title mappings
const pageTitles: Record<string, string> = {
	// Dashboard
	Dashboard: "Dashboard",

	// Income Management
	IncomeManagement: "Income Management",
	IncomeReports: "Income Reports",

	// Expense Management
	ExpenseOverview: "Expense Overview",
	ExpenseAnalytics: "Expense Analytics",

	// Care & Support
	CareSupport: "Care & Support",
	HealthConditions: "Health Conditions",
	SchemesAndPrograms: "Schemes & Programs",
	SupportResources: "Support Resources",

	// Applications & Claims
	MyApplications: "My Applications",
	ClaimsAndBenefits: "Claims & Benefits",

	// Profile
	Profile: "Profile Settings",

	// Auth
	Login: "Login",
}

// Section descriptions for better SEO
const sectionDescriptions: Record<string, string> = {
	Dashboard:
		"Healthcare financial protection dashboard with expense tracking and welfare scheme management",
	IncomeManagement:
		"Manage and track your income sources for comprehensive financial planning",
	IncomeReports:
		"Detailed income analysis and reporting for financial insights",
	ExpenseOverview: "Track and analyze your medical and healthcare expenses",
	ExpenseAnalytics:
		"Comprehensive healthcare expense analytics with CHE analysis",
	CareSupport: "Access healthcare support programs and welfare schemes",
	HealthConditions: "Manage your health conditions and risk assessment",
	SchemesAndPrograms:
		"Discover and apply for welfare schemes and insurance programs",
	SupportResources: "Browse support pathways and healthcare resources",
	MyApplications: "Track your welfare scheme and insurance applications",
	ClaimsAndBenefits: "Manage your claims and benefit utilization",
	Profile: "Manage your profile and account settings",
	Login: "Sign in to your Artha Raksha account",
}

interface UsePageTitleReturn {
	currentTitle: Ref<string>
	setTitle: (title?: string) => void
	setCustomTitle: (customTitle: string) => void
	resetTitle: () => void
	getTitleForRoute: (routeName: string | symbol | null | undefined) => string
	updateMetaDescription: (description: string) => void
}

export function usePageTitle(): UsePageTitleReturn {
	const route = useRoute()

	// Set page title based on route
	const setTitle = (title?: string): void => {
		const fullTitle = title ? `${title} | ${baseTitle}` : baseTitle
		document.title = fullTitle
		currentTitle.value = fullTitle

		// Update meta description if available
		const routeName = route.name
		if (routeName && typeof routeName === "string") {
			const description = sectionDescriptions[routeName]
			if (description) {
				updateMetaDescription(description)
			}
		}
	}

	// Update meta description
	const updateMetaDescription = (description: string): void => {
		let metaDescription = document.querySelector('meta[name="description"]')
		if (metaDescription) {
			metaDescription.setAttribute("content", description)
		} else {
			metaDescription = document.createElement("meta")
			metaDescription.setAttribute("name", "description")
			metaDescription.setAttribute("content", description)
			document.head.appendChild(metaDescription)
		}
	}

	// Get title for current route
	const getTitleForRoute = (
		routeName: string | symbol | null | undefined,
	): string => {
		if (typeof routeName === "string") {
			return pageTitles[routeName] || routeName
		}
		return routeName?.toString() || "Unknown"
	}

	// Watch route changes and update title
	watch(
		() => route,
		(newRoute: RouteLocationNormalized) => {
			if (newRoute) {
				// Use route meta title if available, otherwise use mapping
				const pageTitle =
					(newRoute.meta?.title as string) || getTitleForRoute(newRoute.name)
				setTitle(pageTitle)

				// Use route meta description if available
				const routeName = newRoute.name
				const description =
					(newRoute.meta?.description as string) ||
					(typeof routeName === "string"
						? sectionDescriptions[routeName]
						: undefined)
				if (description) {
					updateMetaDescription(description)
				}
			}
		},
		{ immediate: true, deep: true },
	)

	// Custom title setter for dynamic content
	const setCustomTitle = (customTitle: string): void => {
		setTitle(customTitle)
	}

	// Reset to default title
	const resetTitle = (): void => {
		setTitle("")
	}

	return {
		currentTitle,
		setTitle,
		setCustomTitle,
		resetTitle,
		getTitleForRoute,
		updateMetaDescription,
	}
}
