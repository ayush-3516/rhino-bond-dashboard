import { defineStore } from 'pinia'
import { supabase } from '../supabase'

export const useProductStore = defineStore('product', {
  state: () => ({
    products: [],
    loading: false,
    error: null
  }),
  actions: {
    async fetchProducts() {
      this.loading = true
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (error) throw error
        this.products = data
      } catch (error) {
        this.error = error
      } finally {
        this.loading = false
      }
    },
    async createProduct(product) {
      try {
        const { data, error } = await supabase
          .from('products')
          .insert([product])
          .select()
        
        if (error) throw error
        this.products.unshift(data[0])
      } catch (error) {
        this.error = error
      }
    },
    async updateProduct(id, updates) {
      try {
        const { data, error } = await supabase
          .from('products')
          .update(updates)
          .eq('id', id)
          .select()
        
        if (error) throw error
        const index = this.products.findIndex(p => p.id === id)
        if (index !== -1) {
          this.products.splice(index, 1, data[0])
        }
      } catch (error) {
        this.error = error
      }
    },
    async deleteProduct(id) {
      try {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', id)
        
        if (error) throw error
        this.products = this.products.filter(p => p.id !== id)
      } catch (error) {
        this.error = error
      }
    }
  }
})
