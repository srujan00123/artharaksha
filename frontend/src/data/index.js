// Data layer - Core modules only
// Modern architecture uses services + composables for business logic

// Core data modules (actively used across the app)
export * from './session'  // User session state - used in router, layouts, services
export * from './user'     // User resource - used in router, layouts, profile

// Modern Services and Composables are available via their respective index files:
// - Services: @/services 
// - Composables: @/composables