import { defineStore } from 'pinia'
import { supabase, withServiceRole } from '@/supabase'
import { format, subDays } from 'date-fns'

export const usePointsStore = defineStore('points', {
  state: () => ({
    users: [],
    transactions: [],
    transactionFilters: {
      type: null,
      startDate: null,
      endDate: null,
      userId: null,
      agentId: null,
      productId: null,
      qrCodeId: null
    },
    summaryStats: {
      totalEarned: 0,
      totalRedeemed: 0,
      totalAirdropped: 0,
      monthlyPoints: 0,
      weeklyPoints: 0,
      dailyPoints: 0,
      avgPointsPerUser: 0
    },
    isLoading: false,
    error: null
  }),
  actions: {
    async fetchUsers() {
      try {
        return await withServiceRole(async (client) => {
          let allUsers = []
          let currentPage = 0
          const pageSize = 100

          while (true) {
            const { data, error } = await client
              .from('users')
              .select('id, name, email, points_balance')
              .order('created_at', { ascending: false })
              .range(currentPage * pageSize, (currentPage + 1) * pageSize - 1)

            if (error) throw error

            allUsers = [...allUsers, ...data]

            if (data.length < pageSize) {
              break
            }

            currentPage++
          }

          return allUsers
        })
      } catch (error) {
        console.error('Error fetching users:', error)
        throw error
      }
    },

    async searchUsers(query) {
      try {
        return await withServiceRole(async (client) => {
          const { data, error } = await client
            .from('users')
            .select('id, name, email, points_balance')
            .textSearch('fts', query, {
              type: 'websearch',
              config: 'english'
            })
            .limit(50)

          if (error) throw error
          return data
        })
      } catch (error) {
        console.error('Error searching users:', error)
        throw error
      }
    },

    async fetchTransactions() {
      try {
        this.isLoading = true
        return await withServiceRole(async (client) => {
          console.log('Fetching all transactions from Supabase...')

          // Fetch transactions with detailed error handling
          const { data, error, count } = await client
            .from('points_transactions')
            .select(`
              id,
              type,
              points,
              timestamp,
              user_id,
              users!points_transactions_user_id_fkey(name, email),
              agent_id,
              agents:users!points_transactions_agent_fkey(name),
              product_id,
              products:redemption_products!points_transactions_product_id_fkey(name),
              qr_code_id,
              qr_codes!points_transactions_qr_code_id_fkey(id)
            `, { count: 'exact' })
            .order('timestamp', { ascending: false })

          if (error) {
            console.error('Error fetching transactions:', {
              message: error.message,
              code: error.code,
              details: error.details,
              hint: error.hint
            })
            throw error
          }

          console.log(`Successfully fetched ${count} transactions`)
          this.transactions = data || []
          return data || []
        })
      } catch (error) {
        this.error = error
        console.error('Error fetching transactions:', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async fetchFilteredTransactions(filters = {}) {
      try {
        this.isLoading = true
        return await withServiceRole(async (client) => {
          let query = client
            .from('points_transactions')
            .select(`
              id,
              type,
              points,
              timestamp,
              user_id,
              users!points_transactions_user_id_fkey(name, email),
              agent_id,
              agents:users!points_transactions_agent_fkey(name),
              product_id,
              products:redemption_products!points_transactions_product_id_fkey(name),
              qr_code_id,
              qr_codes!points_transactions_qr_code_id_fkey(id)
            `)
            .order('timestamp', { ascending: false })

          // Apply filters with proper null checks and formatting
          if (filters?.type) {
            query = query.eq('type', filters.type)
          }
          if (filters?.startDate) {
            query = query.gte('timestamp', format(new Date(filters.startDate), 'yyyy-MM-dd'))
          }
          if (filters?.endDate) {
            query = query.lte('timestamp', format(new Date(filters.endDate), 'yyyy-MM-dd'))
          }
          if (filters?.userId) {
            query = query.eq('user_id', filters.userId)
          }
          if (filters?.agentId) {
            query = query.eq('agent_id', filters.agentId)
          }
          if (filters?.productId) {
            query = query.eq('product_id', filters.productId)
          }
          if (filters?.qrCodeId) {
            query = query.eq('qr_code_id', filters.qrCodeId)
          }

          const { data, error } = await query

          if (error) throw error
          this.transactions = data
          return data
        })
      } catch (error) {
        this.error = error
        console.error('Error fetching filtered transactions:', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async calculateSummaryStats() {
      try {
        this.isLoading = true
        return await withServiceRole(async (client) => {
          // Get current date ranges
          const today = new Date()
          const yesterday = subDays(today, 1)
          const weekAgo = subDays(today, 7)
          const monthAgo = subDays(today, 30)

          // Fetch aggregated data
          const { data: totals, error: totalsError } = await client
            .from('points_transactions')
            .select('type, points')
            .neq('points', 0)

          if (totalsError) throw totalsError

          // Calculate totals by type
          const summary = {
            totalEarned: 0,
            totalRedeemed: 0,
            totalAirdropped: 0
          }

          totals.forEach(t => {
            if (t.type === 'earn') summary.totalEarned += t.points
            if (t.type === 'redeem') summary.totalRedeemed += Math.abs(t.points)
            if (t.type === 'airdrop') summary.totalAirdropped += t.points
          })

          // Get time-based aggregates using direct queries
          const { data: dailyPoints, error: dailyError } = await client
            .from('points_transactions')
            .select('points')
            .gte('timestamp', format(today, 'yyyy-MM-dd'))

          const { data: weeklyPoints, error: weeklyError } = await client
            .from('points_transactions')
            .select('points')
            .gte('timestamp', format(weekAgo, 'yyyy-MM-dd'))

          const { data: monthlyPoints, error: monthlyError } = await client
            .from('points_transactions')
            .select('points')
            .gte('timestamp', format(monthAgo, 'yyyy-MM-dd'))

          if (dailyError || weeklyError || monthlyError) {
            throw dailyError || weeklyError || monthlyError
          }

          // Calculate averages
          const { count: userCount } = await client
            .from('users')
            .select('*', { count: 'exact', head: true })

          // Update store state
          this.summaryStats = {
            ...summary,
            dailyPoints: dailyPoints?.reduce((sum, t) => sum + t.points, 0) || 0,
            weeklyPoints: weeklyPoints?.reduce((sum, t) => sum + t.points, 0) || 0,
            monthlyPoints: monthlyPoints?.reduce((sum, t) => sum + t.points, 0) || 0,
            avgPointsPerUser: userCount ? summary.totalEarned / userCount : 0
          }

          return this.summaryStats
        })
      } catch (error) {
        this.error = error
        console.error('Error calculating summary stats:', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async exportTransactions(format = 'csv') {
      try {
        this.isLoading = true
        return await withServiceRole(async (client) => {
          const { data, error } = await client
            .rpc('export_transactions', {
              format,
              type_filter: this.transactionFilters.type,
              start_date: this.transactionFilters.startDate,
              end_date: this.transactionFilters.endDate,
              user_id: this.transactionFilters.userId,
              agent_id: this.transactionFilters.agentId,
              product_id: this.transactionFilters.productId,
              qr_code_id: this.transactionFilters.qrCodeId
            })

          if (error) throw error
          return data
        })
      } catch (error) {
        this.error = error
        console.error('Error exporting transactions:', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async airdropPoints({ userIds, points }) {
      try {
        return await withServiceRole(async (client) => {
          // Validate inputs
          if (!Array.isArray(userIds) || userIds.length === 0) {
            throw new Error('No users selected for airdrop')
          }

          if (!Number.isInteger(points) || points <= 0) {
            throw new Error('Points must be a positive integer')
          }

          // Validate UUID format
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
          const invalidIds = userIds.filter(id => !uuidRegex.test(id))
          if (invalidIds.length > 0) {
            throw new Error(`Invalid user IDs: ${invalidIds.join(', ')}`)
          }

          // Create transaction records
          const transactions = userIds.map(userId => ({
            user_id: userId,
            type: 'airdrop',
            points: points
          }))

          const { error: transactionError } = await client
            .from('points_transactions')
            .insert(transactions)

          if (transactionError) throw transactionError

          // Update users' points balance
          const { error: updateError } = await client.rpc('update_points_balance', {
            user_ids: userIds,
            points: points
          })

          if (updateError) throw updateError

          return true
        })
      } catch (error) {
        console.error('Error airdropping points:', error)
        throw error
      }
    }
  }
})
