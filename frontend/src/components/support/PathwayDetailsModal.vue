<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
      <div class="p-6">
        <!-- Header -->
        <div class="flex justify-between items-start mb-6">
          <div>
            <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ pathway?.name }}</h2>
            <p class="text-gray-600 dark:text-gray-400 dark:text-gray-500 mt-1">{{ pathway?.organization }}</p>
          </div>
          <button
            @click="$emit('close')"
            class="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:text-gray-500 transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <!-- Description -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Description</h3>
          <p class="text-gray-700 dark:text-gray-300 dark:text-gray-600 leading-relaxed">{{ pathway?.description }}</p>
        </div>

        <!-- Support Type -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Support Type</h3>
          <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                :class="getSupportTypeClass(pathway?.support_type)">
            {{ pathway?.support_type }}
          </span>
        </div>

        <!-- Benefits -->
        <div class="mb-6" v-if="pathway?.benefits">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Benefits & Services</h3>
          <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div class="text-green-800 dark:text-green-200" v-html="formatBenefits(pathway.benefits)"></div>
          </div>
        </div>

        <!-- Eligibility Criteria -->
        <div class="mb-6" v-if="pathway?.eligibility_criteria">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Eligibility Criteria</h3>
          <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div class="text-blue-800 dark:text-blue-200" v-html="formatCriteria(pathway.eligibility_criteria)"></div>
          </div>
        </div>

        <!-- Contact Information -->
        <div class="mb-6" v-if="pathway?.contact_info">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Contact Information</h3>
          <div class="bg-gray-50 dark:bg-gray-900 dark:bg-gray-100 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div class="space-y-2">
              <div v-if="pathway.contact_info.phone" class="flex items-center">
                <svg class="w-5 h-5 text-gray-500 dark:text-gray-400 dark:text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                </svg>
                <span class="text-gray-700 dark:text-gray-300 dark:text-gray-600">{{ pathway.contact_info.phone }}</span>
              </div>
              <div v-if="pathway.contact_info.email" class="flex items-center">
                <svg class="w-5 h-5 text-gray-500 dark:text-gray-400 dark:text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
                <a :href="`mailto:${pathway.contact_info.email}`" class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:text-blue-200">
                  {{ pathway.contact_info.email }}
                </a>
              </div>
              <div v-if="pathway.contact_info.address" class="flex items-start">
                <svg class="w-5 h-5 text-gray-500 dark:text-gray-400 dark:text-gray-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                <span class="text-gray-700 dark:text-gray-300 dark:text-gray-600">{{ pathway.contact_info.address }}</span>
              </div>
              <div v-if="pathway.contact_info.website" class="flex items-center">
                <svg class="w-5 h-5 text-gray-500 dark:text-gray-400 dark:text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path>
                </svg>
                <a :href="pathway.contact_info.website" target="_blank" class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:text-blue-200">
                  {{ pathway.contact_info.website }}
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- Operating Hours -->
        <div class="mb-6" v-if="pathway?.operating_hours">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Operating Hours</h3>
          <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p class="text-yellow-800">{{ pathway.operating_hours }}</p>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            v-if="pathway?.contact_info?.phone"
            @click="callSupport"
            class="flex-1 bg-green-600 text-white dark:text-black px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
            </svg>
            Call Now
          </button>
          
          <button
            @click="sharePathway"
            class="flex-1 bg-blue-600 text-white dark:text-black px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"></path>
            </svg>
            Share
          </button>
          
          <button
            @click="bookmarkPathway"
            class="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 dark:text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 dark:bg-gray-100 transition-colors flex items-center justify-center"
            :class="{ 'bg-yellow-50 border-yellow-300 text-yellow-700': isBookmarked }"
          >
            <svg class="w-5 h-5 mr-2" :fill="isBookmarked ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path>
            </svg>
            {{ isBookmarked ? 'Bookmarked' : 'Bookmark' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PathwayDetailsModal',
  props: {
    isOpen: {
      type: Boolean,
      default: false
    },
    pathway: {
      type: Object,
      default: null
    }
  },
  emits: ['close'],
  data() {
    return {
      isBookmarked: false
    }
  },
  watch: {
    pathway: {
      handler(newPathway) {
        if (newPathway) {
          this.checkBookmarkStatus()
        }
      },
      immediate: true
    }
  },
  methods: {
    getSupportTypeClass(type) {
      const typeClasses = {
        'Healthcare': 'bg-red-100 text-red-800',
        'Financial': 'bg-green-100 text-green-800',
        'Social': 'bg-blue-100 text-blue-800',
        'Educational': 'bg-purple-100 text-purple-800',
        'Legal': 'bg-yellow-100 text-yellow-800',
        'Emergency': 'bg-red-100 text-red-800',
        'Counseling': 'bg-indigo-100 text-indigo-800'
      }
      return typeClasses[type] || 'bg-gray-100 text-gray-800'
    },
    
    formatBenefits(benefits) {
      if (typeof benefits === 'string') {
        return benefits.replace(/\n/g, '<br>')
      }
      if (Array.isArray(benefits)) {
        return benefits.map(benefit => `• ${benefit}`).join('<br>')
      }
      return benefits
    },
    
    formatCriteria(criteria) {
      if (typeof criteria === 'string') {
        return criteria.replace(/\n/g, '<br>')
      }
      if (Array.isArray(criteria)) {
        return criteria.map(criterion => `• ${criterion}`).join('<br>')
      }
      return criteria
    },
    
    callSupport() {
      if (this.pathway?.contact_info?.phone) {
        window.location.href = `tel:${this.pathway.contact_info.phone}`
      }
    },
    
    sharePathway() {
      if (navigator.share) {
        navigator.share({
          title: this.pathway?.name,
          text: `Check out this support pathway: ${this.pathway?.name}`,
          url: window.location.href
        }).catch(console.error)
      } else {
        // Fallback: copy to clipboard
        const text = `${this.pathway?.name}\n${this.pathway?.description}\n\nContact: ${this.pathway?.contact_info?.phone || this.pathway?.contact_info?.email || 'N/A'}`
        navigator.clipboard.writeText(text).then(() => {
          alert('Pathway details copied to clipboard!')
        }).catch(() => {
          alert('Unable to share. Please copy the details manually.')
        })
      }
    },
    
    bookmarkPathway() {
      this.isBookmarked = !this.isBookmarked
      
      // Store bookmark in localStorage
      const bookmarks = JSON.parse(localStorage.getItem('pathwayBookmarks') || '[]')
      
      if (this.isBookmarked) {
        if (!bookmarks.includes(this.pathway?.name)) {
          bookmarks.push(this.pathway?.name)
        }
      } else {
        const index = bookmarks.indexOf(this.pathway?.name)
        if (index > -1) {
          bookmarks.splice(index, 1)
        }
      }
      
      localStorage.setItem('pathwayBookmarks', JSON.stringify(bookmarks))
    },
    
    checkBookmarkStatus() {
      if (this.pathway?.name) {
        const bookmarks = JSON.parse(localStorage.getItem('pathwayBookmarks') || '[]')
        this.isBookmarked = bookmarks.includes(this.pathway.name)
      }
    }
  }
}
</script>

<style scoped>
/* Custom scrollbar for modal content */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style> 