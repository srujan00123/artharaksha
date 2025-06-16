import './index.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'

// Initialize theme early
const initializeTheme = () => {
  const stored = localStorage.getItem('theme')
  if (stored === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

// Initialize theme before app mounts
initializeTheme()

import {
  Button,
  Card,
  Input,
  setConfig,
  frappeRequest,
  resourcesPlugin,
  pageMetaPlugin,
} from 'frappe-ui'

let app = createApp(App)
const pinia = createPinia()

setConfig('resourceFetcher', frappeRequest)

app.use(pinia)
app.use(router)
app.use(resourcesPlugin)
app.use(pageMetaPlugin) // Enable reactive page titles

app.component('Button', Button)
app.component('Card', Card)
app.component('Input', Input)

app.mount('#app')
