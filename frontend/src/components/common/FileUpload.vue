<template>
    <div class="space-y-4">
        <!-- Upload Area -->
        <div @drop="handleDrop" @dragover.prevent @dragenter.prevent :class="[
            'border-2 border-dashed rounded-lg p-4 sm:p-6 text-center transition-colors touch-manipulation',
            isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        ]">
            <input ref="fileInput" type="file" :accept="acceptedTypes.join(',')" :multiple="multiple"
                @change="handleFileSelect" class="hidden" />

            <div class="space-y-2">
                <Upload class="w-6 h-6 sm:w-8 sm:h-8 mx-auto text-gray-400 dark:text-gray-500" />
                <div>
                    <button @click="$refs.fileInput.click()"
                        class="text-blue-600 dark:text-blue-400 hover:text-blue-500 font-medium text-sm sm:text-base touch-manipulation">
                        Click to upload
                    </button>
                    <span class="text-gray-500 dark:text-gray-400 dark:text-gray-500 text-sm sm:text-base hidden sm:inline"> or drag and drop</span>
                </div>
                <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
                    {{ fileTypeText }} up to {{ maxSizeMB }}MB
                </p>
            </div>
        </div>

        <!-- Error Display -->
        <div v-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <div class="flex items-center">
                <AlertCircle class="w-4 h-4 text-red-500 mr-2" />
                <p class="text-red-700 dark:text-red-300 text-sm">{{ error }}</p>
            </div>
        </div>

        <!-- File Previews -->
        <div v-if="files.length > 0" class="space-y-3">
            <h4 class="text-sm font-medium text-gray-900 dark:text-gray-100">Uploaded Files</h4>
            <div class="space-y-2">
                <div v-for="(file, index) in files" :key="index"
                    class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 dark:bg-gray-100 rounded-lg">
                    <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText v-if="file.type?.includes('pdf')" class="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <Image v-else-if="file.type?.includes('image')" class="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <File v-else class="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{{ file.name }}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">{{ formatFileSize(file.size) }}</p>
                    </div>
                    <div class="flex items-center gap-2 flex-shrink-0">
                        <button v-if="file.type?.includes('image')" @click="previewFile(file)"
                            class="text-blue-600 dark:text-blue-400 hover:text-blue-500 text-xs sm:text-sm touch-manipulation px-2 py-1">
                            Preview
                        </button>
                        <button @click="removeFile(index)"
                            class="text-red-600 dark:text-red-400 hover:text-red-500 touch-manipulation p-1">
                            <X class="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Image Preview Modal -->
        <div v-if="previewImage" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            @click="previewImage = null">
            <div class="max-w-full max-h-full relative">
                <img :src="previewImage" class="max-w-full max-h-full rounded-lg object-contain" />
                <button @click="previewImage = null"
                    class="absolute top-2 right-2 bg-black bg-opacity-50 text-white dark:text-black rounded-full p-2 touch-manipulation">
                    <X class="w-5 h-5" />
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { useAdvancedTheme } from "@/composables/useAdvancedTheme"
import { uploadFile } from "@/utils"
import { AlertCircle, File, FileText, Image, Upload, X } from "lucide-vue-next"
import { computed, ref } from "vue"

const props = defineProps({
	acceptedTypes: {
		type: Array,
		default: () => ["image/*", "application/pdf"],
	},
	maxSizeMB: {
		type: Number,
		default: 5,
	},
	multiple: {
		type: Boolean,
		default: false,
	},
})

const emit = defineEmits(["upload", "remove", "error"])

const files = ref([])
const error = ref("")
const isDragging = ref(false)
const previewImage = ref(null)

const fileTypeText = computed(() => {
	const types = props.acceptedTypes.map((type) => {
		if (type === "image/*") return "Images"
		if (type === "application/pdf") return "PDF"
		return type
	})
	return types.join(", ")
})

async function processFiles(fileList) {
	error.value = ""
	const newFiles = Array.from(fileList)

	for (const file of newFiles) {
		try {
			// Validate and convert file
			const base64 = await uploadFile(file, {
				maxSize: props.maxSizeMB * 1024 * 1024,
				allowedTypes: props.acceptedTypes,
			})

			const fileData = {
				name: file.name,
				size: file.size,
				type: file.type,
				base64: base64,
				file: file,
			}

			if (props.multiple) {
				files.value.push(fileData)
			} else {
				files.value = [fileData]
			}

			emit("upload", fileData)
		} catch (err) {
			error.value = err.message
			emit("error", err.message)
			break
		}
	}
}

function handleFileSelect(event) {
	const selectedFiles = event.target.files
	if (selectedFiles?.length > 0) {
		processFiles(selectedFiles)
	}
}

function handleDrop(event) {
	event.preventDefault()
	isDragging.value = false

	const droppedFiles = event.dataTransfer.files
	if (droppedFiles?.length > 0) {
		processFiles(droppedFiles)
	}
}

function removeFile(index) {
	const removedFile = files.value[index]
	files.value.splice(index, 1)
	emit("remove", removedFile)
}

function previewFile(file) {
	if (file.type?.includes("image")) {
		previewImage.value = URL.createObjectURL(file.file)
	}
}

function formatFileSize(bytes) {
	const sizes = ["Bytes", "KB", "MB", "GB"]
	if (bytes === 0) return "0 Bytes"
	const i = Math.floor(Math.log(bytes) / Math.log(1024))
	return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i]
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