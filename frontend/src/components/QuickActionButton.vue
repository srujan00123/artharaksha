<template>
	<button :class="buttonClasses" :disabled="loading || disabled" @click="handleClick"
		class="flex flex-col items-center p-3 sm:p-4 h-auto min-h-[80px] space-y-2 border rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 hover:shadow-md">
		<div v-if="loading" class="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-current"></div>
		<component v-else :is="iconComponent" class="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
		<span class="text-xs sm:text-sm font-medium text-center leading-tight">{{ label }}</span>
	</button>
</template>

<script setup>
import { useAdvancedTheme } from "@/composables/useAdvancedTheme"
import { computed } from "vue"

import {
	AlertCircle,
	AlertTriangle,
	ArrowDown,
	ArrowLeft,
	ArrowRight,
	ArrowUp,
	BarChart,
	Bell,
	Book,
	Building,
	Calendar,
	Camera,
	Car,
	Check,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	ChevronUp,
	Clock,
	Copy,
	CreditCard,
	Download,
	Edit,
	Eye,
	EyeOff,
	FileText,
	Filter,
	Flag,
	Heart,
	HelpCircle,
	Home,
	Info,
	Link,
	Lock,
	Mail,
	MapPin,
	Menu,
	MoreHorizontal,
	MoreVertical,
	Music,
	Phone,
	PieChart,
	Plane,
	Plus,
	RefreshCw,
	Save,
	Search,
	Settings,
	Share,
	Shield,
	Star,
	Tag,
	Trash,
	TrendingUp,
	Unlock,
	Upload,
	User,
	Video,
	X,
} from "lucide-vue-next"

const props = defineProps({
	icon: {
		type: String,
		required: true,
	},
	label: {
		type: String,
		required: true,
	},
	color: {
		type: String,
		default: "blue",
		validator: (value) =>
			[
				"blue",
				"green",
				"orange",
				"purple",
				"indigo",
				"pink",
				"red",
				"yellow",
				"gray",
			].includes(value),
	},
	loading: {
		type: Boolean,
		default: false,
	},
	disabled: {
		type: Boolean,
		default: false,
	},
})

const emit = defineEmits(["click"])

// Icon component mapping
const iconComponents = {
	Plus,
	TrendingUp,
	FileText,
	CreditCard,
	Shield,
	Heart,
	BarChart,
	PieChart,
	User,
	Settings,
	Download,
	Upload,
	Search,
	Filter,
	Calendar,
	Clock,
	Bell,
	Mail,
	Phone,
	MapPin,
	Home,
	Building,
	Car,
	Plane,
	Camera,
	Video,
	Music,
	Book,
	Star,
	Flag,
	Tag,
	Link,
	Lock,
	Unlock,
	Eye,
	EyeOff,
	Edit,
	Trash,
	Copy,
	Share,
	Save,
	Refresh: RefreshCw,
	RefreshCw,
	ArrowLeft,
	ArrowRight,
	ArrowUp,
	ArrowDown,
	ChevronLeft,
	ChevronRight,
	ChevronUp,
	ChevronDown,
	Check,
	X,
	AlertCircle,
	AlertTriangle,
	Info,
	HelpCircle,
	Menu,
	MoreHorizontal,
	MoreVertical,
}

const iconComponent = computed(() => {
	return iconComponents[props.icon] || Plus
})

const buttonClasses = computed(() => {
	const baseClasses = "border-gray-300"
	const colorClasses = {
		blue: "hover:bg-blue-50 hover:border-blue-200 focus:ring-blue-500 text-blue-600",
		green:
			"hover:bg-green-50 hover:border-green-200 focus:ring-green-500 text-green-600",
		orange:
			"hover:bg-orange-50 hover:border-orange-200 focus:ring-orange-500 text-orange-600",
		purple:
			"hover:bg-purple-50 hover:border-purple-200 focus:ring-purple-500 text-purple-600",
		indigo:
			"hover:bg-indigo-50 hover:border-indigo-200 focus:ring-indigo-500 text-indigo-600",
		pink: "hover:bg-pink-50 hover:border-pink-200 focus:ring-pink-500 text-pink-600",
		red: "hover:bg-red-50 hover:border-red-200 focus:ring-red-500 text-red-600",
		yellow:
			"hover:bg-yellow-50 hover:border-yellow-200 focus:ring-yellow-500 text-yellow-600",
		gray: "hover:bg-gray-50 hover:border-gray-200 focus:ring-gray-500 text-gray-600",
	}

	const disabledClasses = "opacity-50 cursor-not-allowed"

	let classes = `${baseClasses} ${colorClasses[props.color] || colorClasses.blue}`

	if (props.loading || props.disabled) {
		classes += ` ${disabledClasses}`
	}

	return classes
})

function handleClick() {
	if (!props.loading && !props.disabled) {
		emit("click")
	}
}

// Advanced theme management
const { currentTheme, isDark, setTheme, themes } = useAdvancedTheme()

// Theme utility methods
const getFinancialStatusClass = (type, intensity = "600") => {
	const baseClasses = {
		income: `text-green-${intensity} dark:text-green-400`,
		expense: `text-red-${intensity} dark:text-red-400`,
		medical: `text-blue-${intensity} dark:text-blue-400`,
		warning: `text-yellow-${intensity} dark:text-yellow-400`,
		alert: `text-orange-${intensity} dark:text-orange-400`,
		neutral: `text-gray-${intensity} dark:text-gray-400`,
	}
	return baseClasses[type] || baseClasses.neutral
}

const getThemeSurfaceClass = (variant = "primary") => {
	const variants = {
		primary: "bg-white dark:bg-gray-800",
		secondary: "bg-gray-50 dark:bg-gray-900",
		tertiary: "bg-gray-100 dark:bg-gray-800",
	}
	return variants[variant] || variants.primary
}

const getThemeTextClass = (intensity = "600") => {
	const intensityMap = {
		900: "text-gray-900 dark:text-gray-100",
		800: "text-gray-800 dark:text-gray-200",
		700: "text-gray-700 dark:text-gray-300",
		600: "text-gray-600 dark:text-gray-400",
		500: "text-gray-500 dark:text-gray-400",
		400: "text-gray-400 dark:text-gray-500",
	}
	return intensityMap[intensity] || intensityMap["600"]
}
</script>