/**
 * Toast Utility
 * Simple toast notifications for the Artha app
 */

// Simple toast implementation using browser notifications or console
class ToastService {
	constructor() {
		this.toasts = []
		this.container = null
		this.init()
	}

	init() {
		// Create toast container if it doesn't exist
		if (typeof window !== "undefined" && !this.container) {
			this.container = document.createElement("div")
			this.container.id = "toast-container"
			this.container.className = "fixed top-4 right-4 z-50 space-y-2"
			document.body.appendChild(this.container)
		}
	}

	show(message, type = "info", duration = 3000) {
		if (typeof window === "undefined") {
			console.log(`[${type.toUpperCase()}] ${message}`)
			return
		}

		const toast = document.createElement("div")
		toast.className = this.getToastClasses(type)
		toast.innerHTML = `
            <div class="flex items-center">
                <div class="flex-shrink-0">
                    ${this.getIcon(type)}
                </div>
                <div class="ml-3">
                    <p class="text-sm font-medium text-gray-900">${message}</p>
                </div>
                <div class="ml-auto pl-3">
                    <button class="inline-flex text-gray-400 hover:text-gray-600" onclick="this.parentElement.parentElement.remove()">
                        <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>
        `

		this.container.appendChild(toast)

		// Auto remove after duration
		setTimeout(() => {
			if (toast.parentElement) {
				toast.remove()
			}
		}, duration)

		// Add slide-in animation
		setTimeout(() => {
			toast.classList.add("translate-x-0")
			toast.classList.remove("translate-x-full")
		}, 10)
	}

	getToastClasses(type) {
		const baseClasses =
			"transform transition-all duration-300 translate-x-full max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden"

		const typeClasses = {
			success: "border-l-4 border-green-400",
			error: "border-l-4 border-red-400",
			warning: "border-l-4 border-yellow-400",
			info: "border-l-4 border-blue-400",
		}

		return `${baseClasses} ${typeClasses[type] || typeClasses.info} p-4`
	}

	getIcon(type) {
		const icons = {
			success: `<svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>`,
			error: `<svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>`,
			warning: `<svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>`,
			info: `<svg class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
            </svg>`,
		}

		return icons[type] || icons.info
	}

	success(message, duration) {
		this.show(message, "success", duration)
	}

	error(message, duration) {
		this.show(message, "error", duration)
	}

	warning(message, duration) {
		this.show(message, "warning", duration)
	}

	info(message, duration) {
		this.show(message, "info", duration)
	}
}

// Create singleton instance
const toastService = new ToastService()

// Export convenience methods
export const toast = {
	success: (message, duration) => toastService.success(message, duration),
	error: (message, duration) => toastService.error(message, duration),
	warning: (message, duration) => toastService.warning(message, duration),
	info: (message, duration) => toastService.info(message, duration),
	show: (message, type, duration) => toastService.show(message, type, duration),
}

export default toast
