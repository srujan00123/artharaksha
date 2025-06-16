import "./index.css"

import { createPinia } from "pinia"
import { createApp } from "vue"
import App from "./App.vue"
import router from "./router"

import {
	Button,
	Card,
	Input,
	frappeRequest,
	pageMetaPlugin,
	resourcesPlugin,
	setConfig,
} from "frappe-ui"

const app = createApp(App)
const pinia = createPinia()

setConfig("resourceFetcher", frappeRequest)

app.use(pinia)
app.use(router)
app.use(resourcesPlugin)
app.use(pageMetaPlugin) // Enable reactive page titles

app.component("Button", Button)
app.component("Card", Card)
app.component("Input", Input)

app.mount("#app")
