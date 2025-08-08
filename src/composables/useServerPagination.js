import { ref, computed, reactive } from 'vue'
import { useAdvancedCache } from './useAdvancedCache'
import { useErrorRecovery } from './useErrorRecovery'

// Server-side pagination configuration
const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  CACHE_TTL: 5 * 60 * 1000, // 5 minutes
  PRELOAD_PAGES: 2, // Number of pages to preload ahead
  SEARCH_DEBOUNCE: 300,
  FILTER_DEBOUNCE: 200
}

export function useServerPagination(fetchFunction, options = {}) {
  const {
    pageSize = PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
    cacheKey = 'server_pagination',
    enablePreloading = true,
    enableSearch = true,
    enableFiltering = true,
    sortFields = [],
    defaultSort = null
  } = options

  const { get: getCached, set: setCache, invalidateByPattern } = useAdvancedCache()
  const { withRetry } = useErrorRecovery()

  // Reactive state
  const state = reactive({
    currentPage: 0,
    pageSize,
    totalItems: 0,
    totalPages: 0,
    loading: false,
    loadingMore: false,
    hasNextPage: false,
    hasPreviousPage: false,
    searchTerm: '',
    filters: {},
    sortBy: defaultSort,
    sortOrder: 'asc',
    error: null
  })

  const items = ref([])
  const metadata = ref({})
  const preloadedPages = new Set()

  // Computed properties
  const pagination = computed(() => ({
    currentPage: state.currentPage,
    pageSize: state.pageSize,
    totalItems: state.totalItems,
    totalPages: state.totalPages,
    hasNextPage: state.hasNextPage,
    hasPreviousPage: state.hasPreviousPage,
    startIndex: state.currentPage * state.pageSize + 1,
    endIndex: Math.min((state.currentPage + 1) * state.pageSize, state.totalItems)
  }))

  const isFirstPage = computed(() => state.currentPage === 0)
  const isLastPage = computed(() => state.currentPage >= state.totalPages - 1)

  // Generate cache key for current state
  const generateCacheKey = (page = state.currentPage) => {
    const params = {
      page,
      pageSize: state.pageSize,
      search: state.searchTerm,
      filters: state.filters,
      sortBy: state.sortBy,
      sortOrder: state.sortOrder
    }
    return `${cacheKey}_${JSON.stringify(params)}`
  }

  // Fetch data with caching and error recovery
  const fetchData = async (page = state.currentPage, useCache = true) => {
    const key = generateCacheKey(page)
    
    // Check cache first
    if (useCache) {
      const cached = getCached(key)
      if (cached) {
        return cached
      }
    }

    // Prepare request parameters
    const params = {
      page,
      pageSize: state.pageSize,
      search: state.searchTerm.trim(),
      filters: state.filters,
      sortBy: state.sortBy,
      sortOrder: state.sortOrder
    }

    try {
      const result = await withRetry(
        () => fetchFunction(params),
        {
          operationId: `fetch_${cacheKey}_page_${page}`,
          maxRetries: 3
        }
      )

      // Cache the result
      setCache(key, result, {
        ttl: PAGINATION_CONFIG.CACHE_TTL,
        tags: [cacheKey, `${cacheKey}_page_${page}`]
      })

      return result
    } catch (error) {
      console.error(`Failed to fetch ${cacheKey} page ${page}:`, error)
      throw error
    }
  }

  // Load page data
  const loadPage = async (page, isLoadMore = false) => {
    if (page < 0) return

    try {
      if (isLoadMore) {
        state.loadingMore = true
      } else {
        state.loading = true
      }
      
      state.error = null

      const result = await fetchData(page)
      
      // Update state
      if (isLoadMore) {
        // Append to existing items for infinite scroll
        items.value = [...items.value, ...(result.data || [])]
      } else {
        // Replace items for pagination
        items.value = result.data || []
        state.currentPage = page
      }

      // Update pagination metadata
      state.totalItems = result.totalItems || result.total || 0
      state.totalPages = Math.ceil(state.totalItems / state.pageSize)
      state.hasNextPage = page < state.totalPages - 1
      state.hasPreviousPage = page > 0
      
      // Store additional metadata
      metadata.value = {
        ...result.metadata,
        requestTime: Date.now(),
        cacheHit: false
      }

      // Preload adjacent pages if enabled
      if (enablePreloading && !isLoadMore) {
        preloadAdjacentPages(page)
      }

      return result

    } catch (error) {
      state.error = error
      throw error
    } finally {
      state.loading = false
      state.loadingMore = false
    }
  }

  // Preload adjacent pages for better UX
  const preloadAdjacentPages = async (currentPage) => {
    const pagesToPreload = []

    // Preload next pages
    for (let i = 1; i <= PAGINATION_CONFIG.PRELOAD_PAGES; i++) {
      const nextPage = currentPage + i
      if (nextPage < state.totalPages && !preloadedPages.has(nextPage)) {
        pagesToPreload.push(nextPage)
      }
    }

    // Preload previous pages
    for (let i = 1; i <= PAGINATION_CONFIG.PRELOAD_PAGES; i++) {
      const prevPage = currentPage - i
      if (prevPage >= 0 && !preloadedPages.has(prevPage)) {
        pagesToPreload.push(prevPage)
      }
    }

    // Execute preloading in background
    pagesToPreload.forEach(async (page) => {
      try {
        await fetchData(page, true)
        preloadedPages.add(page)
      } catch (error) {
        // Silently fail preloading
        console.warn(`Failed to preload page ${page}:`, error)
      }
    })
  }

  // Navigation methods
  const goToPage = async (page) => {
    if (page >= 0 && page < state.totalPages && page !== state.currentPage) {
      await loadPage(page)
    }
  }

  const goToFirstPage = async () => {
    await goToPage(0)
  }

  const goToLastPage = async () => {
    await goToPage(state.totalPages - 1)
  }

  const goToNextPage = async () => {
    if (state.hasNextPage) {
      await goToPage(state.currentPage + 1)
    }
  }

  const goToPreviousPage = async () => {
    if (state.hasPreviousPage) {
      await goToPage(state.currentPage - 1)
    }
  }

  // Load more for infinite scroll
  const loadMore = async () => {
    if (state.hasNextPage && !state.loadingMore) {
      const nextPage = state.currentPage + 1
      await loadPage(nextPage, true)
      state.currentPage = nextPage
    }
  }

  // Search functionality
  const setSearchTerm = (term) => {
    state.searchTerm = term
    invalidateSearchCache()
  }

  const clearSearch = () => {
    setSearchTerm('')
  }

  const search = async (term = state.searchTerm) => {
    state.searchTerm = term
    state.currentPage = 0
    invalidateSearchCache()
    await loadPage(0)
  }

  // Filtering functionality
  const setFilter = (key, value) => {
    if (value === null || value === undefined || value === '') {
      delete state.filters[key]
    } else {
      state.filters[key] = value
    }
    invalidateFilterCache()
  }

  const setFilters = (filters) => {
    state.filters = { ...filters }
    invalidateFilterCache()
  }

  const clearFilter = (key) => {
    delete state.filters[key]
    invalidateFilterCache()
  }

  const clearAllFilters = () => {
    state.filters = {}
    invalidateFilterCache()
  }

  const applyFilters = async () => {
    state.currentPage = 0
    await loadPage(0)
  }

  // Sorting functionality
  const setSort = async (field, order = 'asc') => {
    if (sortFields.length > 0 && !sortFields.includes(field)) {
      console.warn(`Sort field "${field}" is not in allowed fields:`, sortFields)
      return
    }

    state.sortBy = field
    state.sortOrder = order
    state.currentPage = 0
    invalidateSortCache()
    await loadPage(0)
  }

  const toggleSort = async (field) => {
    const newOrder = state.sortBy === field && state.sortOrder === 'asc' ? 'desc' : 'asc'
    await setSort(field, newOrder)
  }

  // Cache invalidation helpers
  const invalidateSearchCache = () => {
    invalidateByPattern(`${cacheKey}_.*search.*`)
  }

  const invalidateFilterCache = () => {
    invalidateByPattern(`${cacheKey}_.*filters.*`)
  }

  const invalidateSortCache = () => {
    invalidateByPattern(`${cacheKey}_.*sort.*`)
  }

  const invalidateAllCache = () => {
    invalidateByPattern(`${cacheKey}_.*`)
    preloadedPages.clear()
  }

  // Refresh current data
  const refresh = async () => {
    invalidateAllCache()
    await loadPage(state.currentPage, false)
  }

  // Reset to initial state
  const reset = () => {
    state.currentPage = 0
    state.totalItems = 0
    state.totalPages = 0
    state.loading = false
    state.loadingMore = false
    state.hasNextPage = false
    state.hasPreviousPage = false
    state.searchTerm = ''
    state.filters = {}
    state.sortBy = defaultSort
    state.sortOrder = 'asc'
    state.error = null
    items.value = []
    metadata.value = {}
    preloadedPages.clear()
    invalidateAllCache()
  }

  // Update page size
  const setPageSize = async (newPageSize) => {
    if (newPageSize <= 0 || newPageSize > PAGINATION_CONFIG.MAX_PAGE_SIZE) {
      console.warn(`Invalid page size: ${newPageSize}`)
      return
    }

    state.pageSize = newPageSize
    state.currentPage = 0
    invalidateAllCache()
    await loadPage(0)
  }

  // Get current state summary
  const getState = () => ({
    ...state,
    items: items.value,
    metadata: metadata.value,
    pagination: pagination.value
  })

  // Export configuration for debugging
  const getConfig = () => ({
    pageSize: state.pageSize,
    cacheKey,
    enablePreloading,
    enableSearch,
    enableFiltering,
    sortFields,
    defaultSort
  })

  return {
    // State
    items,
    metadata,
    state,
    pagination,
    isFirstPage,
    isLastPage,

    // Navigation
    goToPage,
    goToFirstPage,
    goToLastPage,
    goToNextPage,
    goToPreviousPage,
    loadMore,

    // Search
    setSearchTerm,
    clearSearch,
    search,

    // Filtering
    setFilter,
    setFilters,
    clearFilter,
    clearAllFilters,
    applyFilters,

    // Sorting
    setSort,
    toggleSort,

    // Data management
    loadPage,
    refresh,
    reset,
    setPageSize,

    // Cache management
    invalidateAllCache,
    invalidateSearchCache,
    invalidateFilterCache,
    invalidateSortCache,

    // Utilities
    getState,
    getConfig
  }
}

// Specialized hook for user management
export function useUserServerPagination() {
  return useServerPagination(
    async (params) => {
      // This would be replaced with actual API call
      const { supabase } = await import('@/supabase')
      
      let query = supabase
        .from('users')
        .select('*, points_balance', { count: 'exact' })

      // Apply search
      if (params.search) {
        query = query.or(`name.ilike.%${params.search}%,email.ilike.%${params.search}%,phone.ilike.%${params.search}%`)
      }

      // Apply filters
      Object.entries(params.filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          if (key === 'role') {
            query = query.eq('role', value)
          } else if (key === 'verified') {
            query = query.eq('admin_confirmation', value === 'true')
          }
        }
      })

      // Apply sorting
      if (params.sortBy) {
        query = query.order(params.sortBy, { ascending: params.sortOrder === 'asc' })
      } else {
        query = query.order('created_at', { ascending: false })
      }

      // Apply pagination
      const start = params.page * params.pageSize
      const end = start + params.pageSize - 1
      query = query.range(start, end)

      const { data, error, count } = await query

      if (error) throw error

      return {
        data: data || [],
        totalItems: count || 0,
        page: params.page,
        pageSize: params.pageSize,
        metadata: {
          searchTerm: params.search,
          filters: params.filters,
          sortBy: params.sortBy,
          sortOrder: params.sortOrder
        }
      }
    },
    {
      cacheKey: 'users_server_pagination',
      pageSize: 20,
      enablePreloading: true,
      enableSearch: true,
      enableFiltering: true,
      sortFields: ['name', 'email', 'created_at', 'points_balance', 'role'],
      defaultSort: 'created_at'
    }
  )
}
