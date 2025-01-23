import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/supabase'

export const usePriceStore = defineStore('price', () => {
  const products = ref([])
  const loading = ref(false)
  const error = ref(null)

  const fetchProductsWithPrices = async () => {
    try {
      loading.value = true
      const { data, error: fetchError } = await supabase
        .from('products')
        .select(`
          *,
          product_prices (
            id,
            variation,
            price,
            created_at
          )
        `)
      
      if (fetchError) throw fetchError
      products.value = data
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  const addPrice = async (productId, priceData) => {
    try {
      const { data, error: insertError } = await supabase
        .from('product_prices')
        .insert({
          product_id: productId,
          variation: priceData.variation,
          price: priceData.price
        })
        .select()
      
      if (insertError) throw insertError
      
      // Update local state
      const product = products.value.find(p => p.id === productId)
      if (product) {
        product.product_prices.push(data[0])
      }
    } catch (err) {
      error.value = err.message
    }
  }

  const getPrices = (productId) => {
    const product = products.value.find(p => p.id === productId)
    return product ? product.product_prices : []
  }

  const deletePrice = async (priceId) => {
    try {
      const { error: deleteError } = await supabase
        .from('product_prices')
        .delete()
        .eq('id', priceId)
      
      if (deleteError) throw deleteError
      
      // Update local state
      products.value = products.value.map(product => ({
        ...product,
        product_prices: product.product_prices.filter(price => price.id !== priceId)
      }))
    } catch (err) {
      error.value = err.message
      throw err // Re-throw to propagate to component
    }
  }

  const updatePrice = async (priceId, priceData) => {
    try {
      const { data, error: updateError } = await supabase
        .from('product_prices')
        .update({
          price: priceData.price
        })
        .eq('id', priceId)
        .select()
      
      if (updateError) throw updateError
      
      // Update local state
      products.value = products.value.map(product => ({
        ...product,
        product_prices: product.product_prices.map(price => 
          price.id === priceId ? { ...price, price: priceData.price } : price
        )
      }))
      
      return data[0]
    } catch (err) {
      error.value = err.message
      throw err // Re-throw to propagate to component
    }
  }

  return {
    products,
    loading,
    error,
    fetchProductsWithPrices,
    addPrice,
    getPrices,
    deletePrice,
    updatePrice
  }
})
