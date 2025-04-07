import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://awjiacptrxnroaiijssk.supabase.co'
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3amlhY3B0cnhucm9haWlqc3NrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM4MzAzNDEsImV4cCI6MjA0OTQwNjM0MX0.qSe8RHd5xN6xfNu5li4FOfUpWSs-kMdMnQWcaJFXTFo'
const supabaseServiceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3amlhY3B0cnhucm9haWlqc3NrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzgzMDM0MSwiZXhwIjoyMDQ5NDA2MzQxfQ.T7MMk0III7jiXzriJALlehiRN4LdUBAS95MaN7LyndE'

// Create single client instance
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Create service role client instance with RLS bypass
const supabaseService = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: {
      getItem: (key) => localStorage.getItem(key),
      setItem: (key, value) => localStorage.setItem(key, value),
      removeItem: (key) => localStorage.removeItem(key),
    },
  },
  global: {
    headers: {
      Authorization: `Bearer ${supabaseServiceKey}`,
      apikey: supabaseServiceKey,
    },
  },
})

// Verify service role client authentication
const verifyServiceRole = async () => {
  try {
    console.log(
      'Attempting service role authentication with key:',
      supabaseServiceKey.slice(0, 10) + '...' + supabaseServiceKey.slice(-10),
    )

    const {
      data: { session },
      error,
    } = await supabaseService.auth.getSession()

    if (error) {
      console.error('Service role authentication error:', {
        message: error.message,
        code: error.code,
        status: error.status,
        url: supabaseUrl,
        key: supabaseServiceKey.slice(0, 10) + '...' + supabaseServiceKey.slice(-10),
      })
      return false
    }

    if (!session) {
      console.error('Service role client failed to authenticate: No session found', {
        url: supabaseUrl,
        key: supabaseServiceKey.slice(0, 10) + '...' + supabaseServiceKey.slice(-10),
      })
      return false
    }

    console.log('Service role authenticated successfully', {
      session: {
        access_token: session.access_token?.slice(0, 10) + '...',
        expires_at: session.expires_at,
        user: session.user?.id,
      },
    })
    return true
  } catch (err) {
    console.error('Service role authentication failed:', {
      message: err.message,
      stack: err.stack,
      url: supabaseUrl,
      key: supabaseServiceKey.slice(0, 10) + '...' + supabaseServiceKey.slice(-10),
    })
    return false
  }
}

// Run verification on initialization
verifyServiceRole()

// Method to execute queries with service role
const withServiceRole = async (operation) => {
  try {
    console.log('Initiating service role operation')
    const result = await operation(supabaseService)
    console.log('Service role operation completed:', result)
    return result
  } catch (error) {
    console.error('Service role operation failed:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      status: error.status,
    })
    throw error
  }
}

// Contact Messages Methods
const fetchContactMessages = async (filters = {}) => {
  const { topic, is_resolved, start_date, end_date, search } = filters

  let query = supabaseService
    .from('contact_messages')
    .select('*, users(name, email, phone)')
    .order('created_at', { ascending: false })

  if (topic) query = query.eq('topic', topic)
  if (is_resolved !== undefined) query = query.eq('is_resolved', is_resolved)
  if (start_date && end_date) {
    query = query.gte('created_at', start_date).lte('created_at', end_date)
  }
  if (search) {
    query = query.or(
      `name.ilike.%${search}%,email.ilike.%${search}%,message.ilike.%${search}%`
    )
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

const updateContactMessage = async (id, updates) => {
  const { data, error } = await supabaseService
    .from('contact_messages')
    .update({
      ...updates,
      replied_at: updates.admin_reply ? new Date().toISOString() : null
    })
    .eq('id', id)
    .select()

  if (error) throw error
  return data[0]
}

const deleteContactMessage = async (id) => {
  const { error } = await supabaseService
    .from('contact_messages')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}

export {
  deleteContactMessage,
  supabase,
  withServiceRole,
  verifyServiceRole,
  fetchContactMessages,
  updateContactMessage
}
