import { fileToBase64 } from 'frappe-ui'

// Re-export Frappe UI utilities
export { fileToBase64 }

// File upload helper with validation
export async function uploadFile(file, options = {}) {
    const { maxSize = 5 * 1024 * 1024, allowedTypes = ['image/*', 'application/pdf'] } = options

    // Validate file size
    if (file.size > maxSize) {
        throw new Error(`File size must be less than ${maxSize / (1024 * 1024)}MB`)
    }

    // Validate file type
    const isValidType = allowedTypes.some(type => {
        if (type.endsWith('*')) {
            return file.type.startsWith(type.slice(0, -1))
        }
        return file.type === type
    })

    if (!isValidType) {
        throw new Error(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`)
    }

    // Convert to base64
    return await fileToBase64(file)
} 