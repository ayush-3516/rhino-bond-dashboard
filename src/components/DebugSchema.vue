<template>
  <div>
    <h2>QR Codes Table Schema</h2>
    <pre>{{ schema }}</pre>
  </div>
</template>

<script>
import { supabase } from '../supabase'

export default {
  data() {
    return {
      schema: null,
    }
  },
  async created() {
    try {
      const { data, error } = await supabase.rpc('get_table_schema', { table_name: 'qr_codes' })

      if (error) throw error
      this.schema = data
    } catch (error) {
      console.error('Error fetching schema:', error)
      this.schema = `Error: ${error.message}`
    }
  },
}
</script>

<style scoped>
pre {
  background: #f5f5f5;
  padding: 1rem;
  border-radius: 4px;
  max-width: 100%;
  overflow-x: auto;
}
</style>
