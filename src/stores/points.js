import { defineStore } from 'pinia'
import { supabase, withServiceRole } from '@/supabase'

export const usePointsStore = defineStore('points', {
  state: () => ({
    users: [],
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
