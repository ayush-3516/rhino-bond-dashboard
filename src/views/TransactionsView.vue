<script setup>
import { ref, onMounted } from 'vue'
import { usePointsStore } from '@/stores/points'
import AppHeader from '@/components/layout/AppHeader.vue'
import BaseLayout from '@/components/layout/BaseLayout.vue'

const pointsStore = usePointsStore()
const filters = ref({ ...pointsStore.transactionFilters })

const applyFilters = async () => {
  // Check if any filters are active
  const hasFilters = Object.values(filters.value).some(
    val => val !== null && val !== ''
  )

  if (hasFilters) {
    await pointsStore.fetchFilteredTransactions(filters.value)
  } else {
    await pointsStore.fetchTransactions()
  }
  await pointsStore.calculateSummaryStats()
}

onMounted(async () => {
  // Load all transactions initially
  await pointsStore.fetchTransactions()
  await pointsStore.calculateSummaryStats()
})
</script>

<template>
  <div class="transactions-view">
    <div class="filters-container">
      <div class="filter-group">
        <label>Type</label>
        <select v-model="filters.type">
          <option :value="null">All Types</option>
          <option value="earn">Earn</option>
          <option value="redeem">Redeem</option>
          <option value="airdrop">Airdrop</option>
        </select>
      </div>

      <div class="filter-group">
        <label>Date Range</label>
        <div class="date-range">
          <input type="date" v-model="filters.startDate" />
          <span>to</span>
          <input type="date" v-model="filters.endDate" />
        </div>
      </div>

      <div class="filter-group">
        <label>User ID</label>
        <input type="text" v-model="filters.userId" placeholder="Enter user ID" />
      </div>

      <button @click="applyFilters">Apply Filters</button>
    </div>

    <div class="summary-cards">
      <div class="card">
        <h3>Total Earned</h3>
        <p>{{ pointsStore.summaryStats.totalEarned }}</p>
      </div>
      <div class="card">
        <h3>Total Redeemed</h3>
        <p>{{ pointsStore.summaryStats.totalRedeemed }}</p>
      </div>
      <div class="card">
        <h3>Total Airdropped</h3>
        <p>{{ pointsStore.summaryStats.totalAirdropped }}</p>
      </div>
      <div class="card">
        <h3>Today's Points</h3>
        <p>{{ pointsStore.summaryStats.dailyPoints }}</p>
      </div>
      <div class="card">
        <h3>This Week</h3>
        <p>{{ pointsStore.summaryStats.weeklyPoints }}</p>
      </div>
      <div class="card">
        <h3>This Month</h3>
        <p>{{ pointsStore.summaryStats.monthlyPoints }}</p>
      </div>
      <div class="card">
        <h3>Avg/User</h3>
        <p>{{ pointsStore.summaryStats.avgPointsPerUser.toFixed(2) }}</p>
      </div>
    </div>

    <div class="transactions-table" v-if="pointsStore.transactions.length > 0">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Type</th>
            <th>Points</th>
            <th>User</th>
            <th>Product</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="tx in pointsStore.transactions" :key="tx.id">
            <td>{{ tx.id.slice(0, 8) }}...</td>
            <td>{{ tx.type }}</td>
            <td>{{ tx.points }}</td>
            <td>{{ tx.users?.name || 'N/A' }}</td>
            <td>{{ tx.products?.name || 'N/A' }}</td>
            <td>{{ new Date(tx.timestamp).toLocaleString() }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else>
      <p>No transactions found</p>
    </div>
  </div>
</template>

<style scoped>
.filters-container {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 2rem;
  align-items: flex-end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.date-range {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.card {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.card h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  color: #666;
}

.card p {
  margin: 0;
  font-size: 1.5rem;
  font-weight: bold;
}

.transactions-table {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

th {
  background-color: #f5f5f5;
  font-weight: 500;
}
</style>
