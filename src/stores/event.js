import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase, withServiceRole } from '../supabase'

export const useEventStore = defineStore('event', () => {
  const events = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function fetchEvents() {
    try {
      loading.value = true
      error.value = null

      const { data, error: supabaseError } = await supabase
        .from('events')
        .select('*')
        .order('start_date', { ascending: true })

      if (supabaseError) throw supabaseError

      events.value = data
    } catch (err) {
      error.value = err.message
      console.error('Error fetching events:', err)
    } finally {
      loading.value = false
    }
  }

  async function createEvent(eventData) {
    try {
      loading.value = true
      error.value = null

      // Validate and format dates
      const startDate = new Date(eventData.start_date).toISOString()
      const endDate = new Date(eventData.end_date).toISOString()

      // Ensure image_url is not null
      const imageUrl = eventData.image_url || ''

      const { data, error: supabaseError } = await withServiceRole(async (client) => {
        const result = await client
          .from('events')
          .insert([
            {
              title: eventData.title,
              description: eventData.description,
              start_date: startDate,
              end_date: endDate,
              image_url: imageUrl,
              is_active: true,
            },
          ])
          .select()

        console.log('Service role insert result:', result)
        return result
      })

      if (supabaseError) throw supabaseError

      events.value.push(data[0])
      return data[0]
    } catch (err) {
      error.value = err.message
      console.error('Error creating event:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteEvents(eventIds) {
    try {
      loading.value = true
      error.value = null

      const { error: supabaseError } = await withServiceRole(async (client) => {
        return await client
          .from('events')
          .delete()
          .in('id', eventIds)
      })

      if (supabaseError) throw supabaseError

      // Remove deleted events from local state
      events.value = events.value.filter(event => !eventIds.includes(event.id))
    } catch (err) {
      error.value = err.message
      console.error('Error deleting events:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    events,
    loading,
    error,
    fetchEvents,
    createEvent,
    deleteEvents,
  }
})
