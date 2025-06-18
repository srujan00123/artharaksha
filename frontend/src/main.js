import "./index.css"

import { createPinia } from "pinia"
import { createApp } from "vue"
import App from "./App.vue"
import router from "./router"

// Initialize theme early
const initializeTheme = () => {
	const stored = localStorage.getItem("theme")
	if (stored === "dark") {
		document.documentElement.classList.add("dark")
	} else {
		document.documentElement.classList.remove("dark")
	}
}

// Initialize theme before app mounts
initializeTheme()

import {
	Button,
	Input,
	frappeRequest,
	pageMetaPlugin,
	resourcesPlugin,
	setConfig,
} from "frappe-ui"

// Import our custom UI components
import { Card, MetricCard } from "./components/ui"

const app = createApp(App)
const pinia = createPinia()

setConfig("resourceFetcher", frappeRequest)

app.use(pinia)
app.use(router)
app.use(resourcesPlugin)
app.use(pageMetaPlugin) // Enable reactive page titles

// Register components globally
app.component("Button", Button)
app.component("Card", Card)
app.component("MetricCard", MetricCard)
app.component("Input", Input)
app.mount("#app")
