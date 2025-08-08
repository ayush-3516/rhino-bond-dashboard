<template>
  <div 
    ref="scrollContainer"
    class="virtual-scroll-container"
    @scroll="handleScroll"
    :style="{ height: containerHeight + 'px' }"
  >
    <!-- Virtual spacer for items above visible area -->
    <div :style="{ height: topSpacerHeight + 'px' }"></div>
    
    <!-- Visible items -->
    <div 
      v-for="(item, index) in visibleItems" 
      :key="getItemKey(item, startIndex + index)"
      ref="itemRefs"
      class="virtual-item"
      :data-index="startIndex + index"
    >
      <slot 
        :item="item" 
        :index="startIndex + index"
        :isVisible="true"
      ></slot>
    </div>
    
    <!-- Virtual spacer for items below visible area -->
    <div :style="{ height: bottomSpacerHeight + 'px' }"></div>
    
    <!-- Loading indicator for infinite scroll -->
    <div v-if="isLoading && hasMore" class="loading-indicator">
      <div class="loading-spinner"></div>
      <span>Loading more items...</span>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'

export default {
  name: 'VirtualScrollList',
  props: {
    items: {
      type: Array,
      required: true
    },
    itemHeight: {
      type: Number,
      default: 100
    },
    containerHeight: {
      type: Number,
      default: 600
    },
    buffer: {
      type: Number,
      default: 5
    },
    getItemKey: {
      type: Function,
      default: (item, index) => item.id || index
    },
    hasMore: {
      type: Boolean,
      default: false
    },
    isLoading: {
      type: Boolean,
      default: false
    },
    loadThreshold: {
      type: Number,
      default: 200 // pixels from bottom to trigger load
    }
  },
  emits: ['loadMore', 'scrollUpdate'],
  setup(props, { emit }) {
    const scrollContainer = ref(null)
    const itemRefs = ref([])
    const scrollTop = ref(0)
    const measuredItemHeights = ref(new Map())
    const isScrolling = ref(false)
    let scrollTimer = null
    let resizeObserver = null

    // Calculate visible range
    const visibleRange = computed(() => {
      const itemHeight = props.itemHeight
      const containerHeight = props.containerHeight
      const buffer = props.buffer

      const startIndex = Math.max(
        0,
        Math.floor(scrollTop.value / itemHeight) - buffer
      )
      
      const visibleCount = Math.ceil(containerHeight / itemHeight) + buffer * 2
      const endIndex = Math.min(
        props.items.length - 1,
        startIndex + visibleCount
      )

      return { startIndex, endIndex, visibleCount }
    })

    const startIndex = computed(() => visibleRange.value.startIndex)
    const endIndex = computed(() => visibleRange.value.endIndex)
    
    const visibleItems = computed(() => {
      return props.items.slice(startIndex.value, endIndex.value + 1)
    })

    // Calculate spacer heights
    const topSpacerHeight = computed(() => {
      let height = 0
      for (let i = 0; i < startIndex.value; i++) {
        height += measuredItemHeights.value.get(i) || props.itemHeight
      }
      return height
    })

    const bottomSpacerHeight = computed(() => {
      let height = 0
      for (let i = endIndex.value + 1; i < props.items.length; i++) {
        height += measuredItemHeights.value.get(i) || props.itemHeight
      }
      return height
    })

    const totalHeight = computed(() => {
      let height = 0
      for (let i = 0; i < props.items.length; i++) {
        height += measuredItemHeights.value.get(i) || props.itemHeight
      }
      return height
    })

    // Handle scroll events
    const handleScroll = (event) => {
      scrollTop.value = event.target.scrollTop
      isScrolling.value = true

      // Emit scroll update
      emit('scrollUpdate', {
        scrollTop: scrollTop.value,
        scrollHeight: event.target.scrollHeight,
        clientHeight: event.target.clientHeight,
        startIndex: startIndex.value,
        endIndex: endIndex.value
      })

      // Check if we need to load more items
      const { scrollHeight, clientHeight } = event.target
      const distanceFromBottom = scrollHeight - scrollTop.value - clientHeight
      
      if (distanceFromBottom < props.loadThreshold && props.hasMore && !props.isLoading) {
        emit('loadMore')
      }

      // Clear scroll timer
      if (scrollTimer) {
        clearTimeout(scrollTimer)
      }

      // Set timer to detect end of scrolling
      scrollTimer = setTimeout(() => {
        isScrolling.value = false
      }, 150)
    }

    // Measure item heights after render
    const measureItems = async () => {
      await nextTick()
      
      if (itemRefs.value && itemRefs.value.length > 0) {
        itemRefs.value.forEach((el) => {
          if (el) {
            const index = parseInt(el.dataset.index)
            const height = el.offsetHeight
            measuredItemHeights.value.set(index, height)
          }
        })
      }
    }

    // Setup resize observer for dynamic height measurement
    const setupResizeObserver = () => {
      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver((entries) => {
          entries.forEach((entry) => {
            const element = entry.target
            const index = parseInt(element.dataset.index)
            if (!isNaN(index)) {
              measuredItemHeights.value.set(index, element.offsetHeight)
            }
          })
        })
      }
    }

    // Scroll to specific item
    const scrollToItem = (index) => {
      if (scrollContainer.value) {
        let scrollTop = 0
        for (let i = 0; i < index; i++) {
          scrollTop += measuredItemHeights.value.get(i) || props.itemHeight
        }
        scrollContainer.value.scrollTop = scrollTop
      }
    }

    // Scroll to top
    const scrollToTop = () => {
      if (scrollContainer.value) {
        scrollContainer.value.scrollTop = 0
      }
    }

    // Watch for visible items changes and measure heights
    watch(visibleItems, () => {
      nextTick(() => {
        measureItems()
        
        // Observe new items
        if (resizeObserver && itemRefs.value) {
          itemRefs.value.forEach((el) => {
            if (el) {
              resizeObserver.observe(el)
            }
          })
        }
      })
    }, { flush: 'post' })

    onMounted(() => {
      setupResizeObserver()
      measureItems()
    })

    onUnmounted(() => {
      if (scrollTimer) {
        clearTimeout(scrollTimer)
      }
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
    })

    return {
      scrollContainer,
      itemRefs,
      visibleItems,
      startIndex,
      endIndex,
      topSpacerHeight,
      bottomSpacerHeight,
      totalHeight,
      isScrolling,
      handleScroll,
      scrollToItem,
      scrollToTop,
      measureItems
    }
  }
}
</script>

<style scoped>
.virtual-scroll-container {
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
}

.virtual-item {
  width: 100%;
}

.loading-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  gap: 10px;
  color: #666;
  font-size: 14px;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #e3e3e3;
  border-top: 2px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Smooth scrolling for better UX */
.virtual-scroll-container {
  scroll-behavior: smooth;
}

/* Custom scrollbar styling */
.virtual-scroll-container::-webkit-scrollbar {
  width: 8px;
}

.virtual-scroll-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.virtual-scroll-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.virtual-scroll-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
