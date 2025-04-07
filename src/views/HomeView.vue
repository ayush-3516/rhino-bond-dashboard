<template>
  <div class="home">
    <h1>Dashboard Overview</h1>

    <div class="metrics-grid">
      <div class="metric-card">
        <h3>Total Users</h3>
        <p>{{ userCount }}</p>
        <small>{{ kycApprovedCount }} KYC Approved</small>
      </div>

      <div class="metric-card">
        <h3>Active Agents</h3>
        <p>{{ activeAgentsCount }}</p>
      </div>

      <div class="metric-card">
        <h3>Points Activity</h3>
        <p>{{ pointsEarned - pointsRedeemed }}</p>
        <small>+{{ pointsEarned }} / -{{ pointsRedeemed }}</small>
      </div>

      <div class="metric-card">
        <h3>Active QR Codes</h3>
        <p>{{ activeQrCodes }}</p>
      </div>

      <div class="metric-card">
        <h3>Pending Messages</h3>
        <p>{{ pendingMessagesCount }}</p>
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
        <h3>Redemption Products</h3>
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
const kycApprovedCount = ref(0)
const activeAgentsCount = ref(0)
const activeQrCodes = ref(0)
const pointsEarned = ref(0)
const pointsRedeemed = ref(0)
const pendingMessagesCount = ref(0)
const upcomingEventsCount = ref(0)
const pointsChart = ref(null)
const redemptionsChart = ref(null)
const isLoading = ref(true)

// Fetch initial data
onMounted(async () => {
  try {
    await fetchMetrics()
    await setupCharts()
  } catch (error) {
    console.error('Dashboard error:', error)
  } finally {
    isLoading.value = false
  }
})

async function fetchMetrics() {
  // Get user counts
  const [
    { count: userCountVal },
    { count: kycApprovedVal },
    { count: activeAgentsVal },
    { count: qrCount },
    { data: pointsData },
    { count: messagesCount },
    { count: eventsCount }
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact' }),
    supabase.from('users').select('*', { count: 'exact' }).eq('kyc_status', true),
    supabase.from('users').select('*', { count: 'exact' }).eq('role', 'agent').eq('is_active', true),
    supabase.from('qr_codes').select('*', { count: 'exact' }).eq('is_active', true),
    supabase.from('points_transactions').select('points, type'),
    supabase.from('contact_messages').select('*', { count: 'exact' }).eq('is_resolved', false),
    supabase.from('events').select('*', { count: 'exact' }).gt('end_date', new Date().toISOString()).eq('is_active', true)
  ])

  userCount.value = userCountVal
  kycApprovedCount.value = kycApprovedVal
  activeAgentsCount.value = activeAgentsVal
  activeQrCodes.value = qrCount
  pendingMessagesCount.value = messagesCount
  upcomingEventsCount.value = eventsCount

  // Calculate points
  pointsEarned.value = (pointsData || [])
    .filter(t => t.type === 'earn')
    .reduce((sum, t) => sum + t.points, 0)

  pointsRedeemed.value = (pointsData || [])
    .filter(t => t.type === 'redeem')
    .reduce((sum, t) => sum + t.points, 0)
}

async function setupCharts() {
  // Fetch points activity data
  const { data: pointsData } = await supabase
    .from('points_transactions')
    .select('created_at, points, type')
    .order('created_at', { ascending: true })

  // Group points by month and type
  const pointsByMonth = (pointsData || []).reduce((acc, transaction) => {
    const month = new Date(transaction.created_at).toLocaleString('default', { month: 'short' })
    if (!acc[month]) {
      acc[month] = { earn: 0, redeem: 0 }
    }
    acc[month][transaction.type] += transaction.points
    return acc
  }, {})

  const months = Object.keys(pointsByMonth)

  new Chart(pointsChart.value, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [
        {
          label: 'Points Earned',
          data: months.map(m => pointsByMonth[m].earn),
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        },
        {
          label: 'Points Redeemed',
          data: months.map(m => pointsByMonth[m].redeem),
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        x: { stacked: true },
        y: { stacked: true }
      }
    }
  })

  // Fetch redemption products data
  const { data: productsData } = await supabase
    .from('redemption_products')
    .select('name, points_required')
    .eq('is_active', true)

  new Chart(redemptionsChart.value, {
    type: 'doughnut',
    data: {
      labels: productsData?.map(p => p.name) || [],
      datasets: [{
        label: 'Points Required',
        data: productsData?.map(p => p.points_required) || [],
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'right'
        }
      }
    }
  })
}
</script>

<style scoped>
.home {
  padding: 2rem;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
  margin: 2rem 0;
}

.metric-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.metric-card:hover {
  transform: translateY(-2px);
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
  color: var(--primary-color);
}

.metric-card small {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.8rem;
  color: #888;
}

.charts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.chart-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chart-card h3 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  color: #666;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}
</style>
