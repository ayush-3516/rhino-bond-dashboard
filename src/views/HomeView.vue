<template>
  <div class="home">
    <h1>Dashboard Overview</h1>

    <div class="metrics-grid">
      <div class="metric-card">
        <h3>Total Users</h3>
        <p>{{ userCount }}</p>
      </div>

      <div class="metric-card">
        <h3>Active QR Codes</h3>
        <p>{{ activeQrCodes }}</p>
      </div>

      <div class="metric-card">
        <h3>Points Redeemed</h3>
        <p>{{ pointsRedeemed }}</p>
      </div>

      <div class="metric-card">
        <h3>Upcoming Events</h3>
        <p>{{ upcomingEventsCount }}</p>
      </div>
    </div>

    <div class="charts">
      <div class="chart-card">
        <h3>Points Activity</h3>
        <canvas ref="pointsChart"></canvas>
      </div>

      <div class="chart-card">
        <h3>Product Redemptions</h3>
        <canvas ref="redemptionsChart"></canvas>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Chart from 'chart.js/auto'
import { supabase } from '../supabase'

const userCount = ref(0)
const activeQrCodes = ref(0)
const pointsRedeemed = ref(0)
const upcomingEventsCount = ref(0)
const pointsChart = ref(null)
const redemptionsChart = ref(null)

// Fetch initial data
onMounted(async () => {
  await fetchMetrics()
  await setupCharts()
})

async function fetchMetrics() {
  // Get user count
  const { count: userCountVal } = await supabase.from('users').select('*', { count: 'exact' })
  userCount.value = userCountVal

  // Get active QR codes
  const { count: qrCount } = await supabase
    .from('qr_codes')
    .select('*', { count: 'exact' })
    .eq('is_active', true)
  activeQrCodes.value = qrCount

  // Get points redeemed
  const { data: redeemedData } = await supabase
    .from('points_transactions')
    .select('points')
    .eq('type', 'redeem')
  pointsRedeemed.value = (redeemedData || []).reduce((sum, t) => sum + t.points, 0)

  // Get upcoming events
  const { count: eventsCount } = await supabase
    .from('events')
    .select('*', { count: 'exact' })
    .gt('end_date', new Date().toISOString())
    .eq('is_active', true)
  upcomingEventsCount.value = eventsCount
}

async function setupCharts() {
  // Fetch points activity data
  const { data: pointsData } = await supabase
    .from('points_transactions')
    .select('created_at, points')
    .order('created_at', { ascending: true })

  // Group points by month
  const pointsByMonth = (pointsData || []).reduce((acc, transaction) => {
    const month = new Date(transaction.created_at).toLocaleString('default', { month: 'short' })
    acc[month] = (acc[month] || 0) + transaction.points
    return acc
  }, {})

  new Chart(pointsChart.value, {
    type: 'line',
    data: {
      labels: Object.keys(pointsByMonth),
      datasets: [
        {
          label: 'Points Activity',
          data: Object.values(pointsByMonth),
          fill: false,
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1,
        },
      ],
    },
  })

  // Fetch product redemptions data
  const { data: redemptionsData } = await supabase.from('redemptions').select('product_name')

  // Count redemptions by product
  const redemptionsByProduct = (redemptionsData || []).reduce((acc, redemption) => {
    acc[redemption.product_name] = (acc[redemption.product_name] || 0) + 1
    return acc
  }, {})

  new Chart(redemptionsChart.value, {
    type: 'bar',
    data: {
      labels: Object.keys(redemptionsByProduct),
      datasets: [
        {
          label: 'Redemptions',
          data: Object.values(redemptionsByProduct),
          backgroundColor: [
            'rgba(255, 99, 132, 0.2)',
            'rgba(54, 162, 235, 0.2)',
            'rgba(255, 206, 86, 0.2)',
            'rgba(75, 192, 192, 0.2)',
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
          ],
          borderWidth: 1,
        },
      ],
    },
  })
}
</script>

<style scoped>
.home {
  padding: 2rem;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin: 2rem 0;
}

.metric-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.metric-card h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  color: #666;
}

.metric-card p {
  margin: 0;
  font-size: 2rem;
  font-weight: bold;
}

.charts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.chart-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.chart-card h3 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  color: #666;
}
</style>
