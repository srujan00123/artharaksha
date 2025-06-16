/**
 * Services Index
 * Central export point for all services
 */

// Services
export * from "./api-service.js"
export * from "./cache-service.js"
export * from "./expense-service.ts"
export * from "./household-service.ts"
export * from "./income-service.ts"
export * from "./support-service.ts"

// Default service instances for convenience
export { apiService } from "./api-service.js"
export { cacheService } from "./cache-service.js"
export { expenseService } from "./expense-service.ts"
export { householdService } from "./household-service.ts"
export { incomeService } from "./income-service.ts"
export { supportService } from "./support-service.ts"
