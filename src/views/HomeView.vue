<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <div class="dashboard-title">
        <h1>Dashboard</h1>
        <p class="subtitle">Welcome to the Rhino Bond management dashboard</p>
      </div>
      <div class="dashboard-actions">
        <div class="date-display">
          <span class="date-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </span>
          <span>{{ currentDate }}</span>
        </div>
        <button class="refresh-btn" @click="refreshDashboard" :disabled="isLoading">
          <span class="refresh-icon" :class="{ 'rotating': isLoading }">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"></path>
            </svg>
          </span>
          <span>{{ isLoading ? 'Refreshing...' : 'Refresh' }}</span>
        </button>
      </div>
    </div>

    <WelcomeBanner />
    
    <div v-if="isLoading" class="loading-container">
      <div class="spinner"></div>
      <p>Loading dashboard data...</p>
    </div>

    <div v-else>
      <!-- Key Metrics Section -->
      <div class="metrics-section">
        <div class="section-title">
          <h2>Key Metrics</h2>
        </div>
        <div class="metrics-grid">
          <div class="metric-card user-metrics">
            <div class="metric-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <div class="metric-content">
              <h3>Users</h3>
              <p class="metric-value">{{ userCount }}</p>
              <div class="metric-details">
                <span class="badge">{{ kycApprovedCount }} KYC Approved</span>
                <span class="metric-trend positive" v-if="userTrend > 0">+{{ userTrend }}%</span>
                <span class="metric-trend negative" v-else-if="userTrend < 0">{{ userTrend }}%</span>
              </div>
            </div>
          </div>

          <div class="metric-card agent-metrics">
            <div class="metric-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
                <path d="M12 11v4"></path>
                <path d="M9 17h6"></path>
              </svg>
            </div>
            <div class="metric-content">
              <h3>Active Agents</h3>
              <p class="metric-value">{{ activeAgentsCount }}</p>
              <div class="metric-details">
                <span class="badge">{{ agentCodesCount }} Agent Codes</span>
              </div>
            </div>
          </div>

          <div class="metric-card points-metrics">
            <div class="metric-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M16 8l-8 8"></path>
                <path d="M8 8l8 8"></path>
              </svg>
            </div>
            <div class="metric-content">
              <h3>Points Balance</h3>
              <p class="metric-value">{{ totalPointsBalance }}</p>
              <div class="metric-details">
                <span class="badge positive">+{{ pointsEarned }} Earned</span>
                <span class="badge negative">-{{ pointsRedeemed }} Redeemed</span>
              </div>
            </div>
          </div>

          <div class="metric-card qr-metrics">
            <div class="metric-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <rect x="7" y="7" width="3" height="3"></rect>
                <rect x="14" y="7" width="3" height="3"></rect>
                <rect x="7" y="14" width="3" height="3"></rect>
                <rect x="14" y="14" width="3" height="3"></rect>
              </svg>
            </div>
            <div class="metric-content">
              <h3>QR Codes</h3>
              <p class="metric-value">{{ activeQrCodes }}</p>
              <div class="metric-details">
                <span class="badge">{{ scannedQrCodes }} Scanned</span>
                <span class="metric-trend positive" v-if="qrCodeTrend > 0">+{{ qrCodeTrend }}%</span>
                <span class="metric-trend negative" v-else-if="qrCodeTrend < 0">{{ qrCodeTrend }}%</span>
              </div>
            </div>
          </div>

          <div class="metric-card message-metrics">
            <div class="metric-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <div class="metric-content">
              <h3>Contact Messages</h3>
              <p class="metric-value">{{ pendingMessagesCount }}</p>
              <div class="metric-details">
                <span class="badge">{{ resolvedMessagesCount }} Resolved</span>
                <router-link to="/contact-messages" class="action-link">View All</router-link>
              </div>
            </div>
          </div>

          <div class="metric-card event-metrics">
            <div class="metric-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
                <path d="M8 14h.01"></path>
                <path d="M12 14h.01"></path>
                <path d="M16 14h.01"></path>
                <path d="M8 18h.01"></path>
                <path d="M12 18h.01"></path>
                <path d="M16 18h.01"></path>
              </svg>
            </div>
            <div class="metric-content">
              <h3>Upcoming Events</h3>
              <p class="metric-value">{{ upcomingEventsCount }}</p>
              <div class="metric-details">
                <span v-if="nextEventDays !== null" class="badge">Next in {{ nextEventDays }} days</span>
                <router-link to="/events" class="action-link">View Calendar</router-link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="charts-section">
        <div class="section-title">
          <h2>Analytics</h2>
        </div>
        <div class="charts-grid">
          <div class="chart-card points-chart">
            <div class="chart-header">
              <h3>Points Activity Over Time</h3>
              <div class="chart-actions">
                <select v-model="pointsChartTimeframe" @change="updatePointsChart">
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="90days">Last 90 Days</option>
                  <option value="1year">Last Year</option>
                </select>
              </div>
            </div>
            <canvas ref="pointsChart"></canvas>
          </div>

          <div class="chart-card redemptions-chart">
            <div class="chart-header">
              <h3>Redemption Products</h3>
              <div class="chart-actions">
                <button class="chart-toggle" :class="{ active: redemptionChartView === 'points' }" @click="redemptionChartView = 'points'">Points</button>
                <button class="chart-toggle" :class="{ active: redemptionChartView === 'stock' }" @click="redemptionChartView = 'stock'">Stock</button>
              </div>
            </div>
            <canvas ref="redemptionsChart"></canvas>
          </div>
        </div>
      </div>

      <!-- Recent Activity Section -->
      <div class="recent-activity-section">
        <div class="section-title">
          <h2>Recent Activity</h2>
          <router-link to="/transactions" class="view-all-link">
            View All
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </router-link>
        </div>
        <div class="recent-activity-list">
          <div v-if="recentTransactions.length === 0" class="no-activity">
            No recent transactions found
          </div>
          <div v-else v-for="transaction in recentTransactions" :key="transaction.id" class="activity-item">
            <div class="activity-icon" :class="getTransactionTypeClass(transaction.type)">
              <svg v-if="transaction.type === 'earn'" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <polyline points="19 12 12 19 5 12"></polyline>
              </svg>
              <svg v-else-if="transaction.type === 'redeem'" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="19" x2="12" y2="5"></line>
                <polyline points="5 12 12 5 19 12"></polyline>
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 8v4"></path>
                <path d="M12 16h.01"></path>
              </svg>
            </div>
            <div class="activity-content">
              <div class="activity-header">
                <div class="activity-title">
                  <h4>{{ getTransactionTitle(transaction) }}</h4>
                  <span class="activity-date">{{ formatDate(transaction.timestamp) }}</span>
                </div>
                <div :class="['activity-points', transaction.type === 'earn' ? 'positive' : 'negative']">
                  {{ transaction.type === 'earn' ? '+' : '-' }}{{ transaction.points }} points
                </div>
              </div>
              <div class="activity-details">
                <span v-if="transaction.username" class="activity-user">{{ transaction.username }}</span>
                <span v-if="transaction.productName" class="activity-product">{{ transaction.productName }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import Chart from 'chart.js/auto'
import { supabase } from '../supabase'
import WelcomeBanner from '../components/WelcomeBanner.vue'
import { format, differenceInDays, parseISO, subDays, formatDistance } from 'date-fns'

// State variables
const isLoading = ref(true)
const currentDate = ref(format(new Date(), 'MMMM d, yyyy'))

// Metrics
const userCount = ref(0)
const kycApprovedCount = ref(0)
const activeAgentsCount = ref(0)
const agentCodesCount = ref(0)
const activeQrCodes = ref(0)
const scannedQrCodes = ref(0)
const pointsEarned = ref(0)
const pointsRedeemed = ref(0)
const pendingMessagesCount = ref(0)
const resolvedMessagesCount = ref(0)
const upcomingEventsCount = ref(0)
const nextEventDate = ref(null)

// Trends (simulated for now)
const userTrend = ref(5.2)
const qrCodeTrend = ref(2.8)

// Chart references and settings
const pointsChart = ref(null)
const redemptionsChart = ref(null)
const pointsChartTimeframe = ref('30days')
const redemptionChartView = ref('points')
const pointsChartInstance = ref(null)
const redemptionsChartInstance = ref(null)

// Recent transactions
const recentTransactions = ref([])

// Computed values
const totalPointsBalance = computed(() => pointsEarned.value - pointsRedeemed.value)
const nextEventDays = computed(() => {
  if (nextEventDate.value) {
    return differenceInDays(parseISO(nextEventDate.value), new Date())
  }
  return null
})

// Lifecycle hooks
onMounted(async () => {
  try {
    await fetchMetrics()
    await fetchRecentTransactions()
    await setupCharts()
  } catch (error) {
    console.error('Dashboard error:', error)
  } finally {
    isLoading.value = false
  }
})

// Fetch all dashboard metrics
async function fetchMetrics() {
  // Get all required data counts
  const [
    { count: userCountVal },
    { count: kycApprovedVal },
    { count: activeAgentsVal },
    { count: agentCodesVal },
    { count: activeQrVal },
    { count: scannedQrVal },
    { data: pointsData },
    { count: pendingMessagesVal },
    { count: resolvedMessagesVal },
    { count: eventsCountVal },
    { data: nextEventData }
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact' }),
    supabase.from('users').select('*', { count: 'exact' }).eq('kyc_status', true),
    supabase.from('users').select('*', { count: 'exact' }).eq('role', 'agent').eq('is_active', true),
    supabase.from('agent_codes').select('*', { count: 'exact' }).eq('is_active', true),
    supabase.from('qr_codes').select('*', { count: 'exact' }).eq('is_active', true),
    supabase.from('qr_codes').select('*', { count: 'exact' }).eq('is_scanned', true),
    supabase.from('points_transactions').select('points, type'),
    supabase.from('contact_messages').select('*', { count: 'exact' }).eq('is_resolved', false),
    supabase.from('contact_messages').select('*', { count: 'exact' }).eq('is_resolved', true),
    supabase.from('events').select('*', { count: 'exact' }).gt('end_date', new Date().toISOString()).eq('is_active', true),
    supabase.from('events')
      .select('start_date')
      .gt('start_date', new Date().toISOString())
      .eq('is_active', true)
      .order('start_date', { ascending: true })
      .limit(1)
  ])

    // Update state with fetched values
  userCount.value = userCountVal
  kycApprovedCount.value = kycApprovedVal
  activeAgentsCount.value = activeAgentsVal
  agentCodesCount.value = agentCodesVal
  activeQrCodes.value = activeQrVal
  scannedQrCodes.value = scannedQrVal
  pendingMessagesCount.value = pendingMessagesVal
  resolvedMessagesCount.value = resolvedMessagesVal
  upcomingEventsCount.value = eventsCountVal
  
  // Update next event date if available
  if (nextEventData && nextEventData.length > 0) {
    nextEventDate.value = nextEventData[0].start_date
  }

  // Calculate points totals
  pointsEarned.value = (pointsData || [])
    .filter(t => t.type === 'earn' || t.type === 'airdrop')
    .reduce((sum, t) => sum + t.points, 0)

  pointsRedeemed.value = (pointsData || [])
    .filter(t => t.type === 'redeem')
    .reduce((sum, t) => sum + t.points, 0)
}

// Fetch recent transactions with user and product details
async function fetchRecentTransactions() {
  const { data } = await supabase
    .from('points_transactions')
    .select(`
      id,
      user_id,
      type,
      points,
      timestamp,
      product_id,
      qr_code_id,
      agent_id,
      users:user_id(name),
      products:product_id(name),
      redemption_products:product_id(name)
    `)
    .order('timestamp', { ascending: false })
    .limit(5)

  if (data) {
    recentTransactions.value = data.map(transaction => ({
      ...transaction,
      username: transaction.users?.name,
      productName: transaction.products?.name || transaction.redemption_products?.name
    }))
  }
}

// Set up charts based on data
async function setupCharts() {
  await setupPointsChart()
  await setupRedemptionsChart()
}

// Set up points activity chart
async function setupPointsChart() {
  // Calculate date range based on selected timeframe
  const endDate = new Date()
  let startDate
  
  switch (pointsChartTimeframe.value) {
    case '7days':
      startDate = subDays(endDate, 7)
      break
    case '90days':
      startDate = subDays(endDate, 90)
      break
    case '1year':
      startDate = subDays(endDate, 365)
      break
    case '30days':
    default:
      startDate = subDays(endDate, 30)
      break
  }

  // Fetch points activity data
  const { data: pointsData } = await supabase
    .from('points_transactions')
    .select('timestamp, points, type')
    .gte('timestamp', startDate.toISOString())
    .order('timestamp', { ascending: true })

  // Process data for chart display
  const dateFormat = pointsChartTimeframe.value === '1year' ? 'MMM' : 'MMM d'
  const labels = []
  const earnData = []
  const redeemData = []
  const airdropData = []
  
  // Group data by date
  const pointsByDate = {}
  
  // Initialize date points with all dates in the range
  let currentDate = new Date(startDate)
  while (currentDate <= endDate) {
    const dateKey = format(currentDate, dateFormat)
    if (!pointsByDate[dateKey]) {
      pointsByDate[dateKey] = { earn: 0, redeem: 0, airdrop: 0 }
    }
    currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1))
  }
  
  // Add actual points data
  pointsData?.forEach(transaction => {
    const dateKey = format(new Date(transaction.timestamp), dateFormat)
    if (!pointsByDate[dateKey]) {
      pointsByDate[dateKey] = { earn: 0, redeem: 0, airdrop: 0 }
    }
    pointsByDate[dateKey][transaction.type] += transaction.points
  })
  
  // Convert to arrays for chart
  Object.keys(pointsByDate).sort().forEach(date => {
    labels.push(date)
    earnData.push(pointsByDate[date].earn)
    redeemData.push(pointsByDate[date].redeem)
    airdropData.push(pointsByDate[date].airdrop)
  })

  // Create or update chart
  if (pointsChartInstance.value) {
    pointsChartInstance.value.destroy()
  }

  pointsChartInstance.value = new Chart(pointsChart.value, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Points Earned',
          data: earnData,
          backgroundColor: 'rgba(54, 162, 235, 0.7)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        },
        {
          label: 'Points Airdropped',
          data: airdropData,
          backgroundColor: 'rgba(75, 192, 192, 0.7)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        },
        {
          label: 'Points Redeemed',
          data: redeemData,
          backgroundColor: 'rgba(255, 99, 132, 0.7)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          mode: 'index',
          intersect: false
        },
        legend: {
          position: 'top'
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        }
      }
    }
  })
}

// Set up redemption products chart
async function setupRedemptionsChart() {
  // Fetch redemption products data
  const { data: productsData } = await supabase
    .from('redemption_products')
    .select('name, points_required, stock, is_active')
    .eq('is_active', true)
    .order('points_required', { ascending: false })
    .limit(10)

  // Create chart data based on selected view
  const labels = productsData?.map(p => p.name) || []
  const data = productsData?.map(p => 
    redemptionChartView.value === 'points' ? p.points_required : p.stock
  ) || []
  
  // Create or update chart
  if (redemptionsChartInstance.value) {
    redemptionsChartInstance.value.destroy()
  }

  redemptionsChartInstance.value = new Chart(redemptionsChart.value, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        label: redemptionChartView.value === 'points' ? 'Points Required' : 'Stock Available',
        data: data,
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
          '#41B883',
          '#E46651',
          '#00D8FF',
          '#DD1B16'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            boxWidth: 12
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.raw;
              const datasetLabel = context.dataset.label || '';
              return `${label}: ${value} ${datasetLabel.toLowerCase()}`;
            }
          }
        }
      }
    }
  })
}

// Chart update function
async function updatePointsChart() {
  await setupPointsChart()
}

// Update charts when redemption view changes
async function updateRedemptionChart() {
  await setupRedemptionsChart()
}

// Dashboard refresh function
async function refreshDashboard() {
  isLoading.value = true
  try {
    await fetchMetrics()
    await fetchRecentTransactions()
    await setupCharts()
  } catch (error) {
    console.error('Dashboard refresh error:', error)
  } finally {
    isLoading.value = false
  }
}

// Format date for display
function formatDate(dateString) {
  if (!dateString) return 'Unknown'
  try {
    const date = parseISO(dateString)
    return formatDistance(date, new Date(), { addSuffix: true })
  } catch (error) {
    return 'Invalid date'
  }
}

// Get transaction type class for styling
function getTransactionTypeClass(type) {
  switch (type) {
    case 'earn':
      return 'earn'
    case 'redeem':
      return 'redeem'
    case 'airdrop':
      return 'airdrop'
    default:
      return 'default'
  }
}

// Get transaction title
function getTransactionTitle(transaction) {
  switch (transaction.type) {
    case 'earn':
      return `Points Earned${transaction.productName ? ` - ${transaction.productName}` : ''}`
    case 'redeem':
      return `Points Redeemed${transaction.productName ? ` - ${transaction.productName}` : ''}`
    case 'airdrop':
      return 'Points Airdropped'
    default:
      return 'Transaction'
  }
}
</script>

<style scoped>
/* Dashboard Layout */
.dashboard {
  padding: 2rem;
  max-width: 1600px;
  margin: 0 auto;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.dashboard-title h1 {
  margin: 0;
  font-size: 2rem;
  font-weight: 600;
  color: var(--color-secondary);
}

.subtitle {
  margin: 0.5rem 0 0 0;
  font-size: 1rem;
  color: #666;
}

.dashboard-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.date-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(0, 220, 130, 0.1);
  border-radius: 0.5rem;
  font-size: 0.9rem;
  color: #666;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid var(--color-primary);
  border-radius: 0.5rem;
  background: transparent;
  color: var(--color-primary);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.refresh-btn:hover {
  background: var(--color-primary);
  color: white;
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.refresh-icon {
  display: inline-flex;
}

.rotating {
  animation: rotate 1.5s infinite linear;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Loading State */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(0, 220, 130, 0.2);
  border-radius: 50%;
  border-top-color: var(--color-primary);
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Section Styling */
.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-title h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 500;
  color: var(--color-secondary);
}

.view-all-link {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.9rem;
  color: var(--color-primary);
  text-decoration: none;
  transition: all 0.2s;
}

.view-all-link:hover {
  opacity: 0.8;
}

/* Metrics Section */
.metrics-section {
  margin-bottom: 2rem;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.metric-card {
  display: flex;
  padding: 1.5rem;
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s, box-shadow 0.2s;
}

.metric-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.metric-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  margin-right: 1rem;
  color: white;
}

.user-metrics .metric-icon {
  background: linear-gradient(135deg, #5b8def, #0063f7);
}

.agent-metrics .metric-icon {
  background: linear-gradient(135deg, #4facfe, #00f2fe);
}

.points-metrics .metric-icon {
  background: linear-gradient(135deg, #43e97b, #38f9d7);
}

.qr-metrics .metric-icon {
  background: linear-gradient(135deg, #fa709a, #fee140);
}

.message-metrics .metric-icon {
  background: linear-gradient(135deg, #ff5858, #f09819);
}

.event-metrics .metric-icon {
  background: linear-gradient(135deg, #a18cd1, #fbc2eb);
}

.metric-content {
  flex: 1;
}

.metric-card h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 500;
  color: #666;
}

.metric-value {
  margin: 0.5rem 0;
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--color-secondary);
}

.metric-details {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
}

.badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  border-radius: 0.25rem;
  background: #f5f5f5;
  color: #666;
}

.badge.positive {
  background: rgba(0, 220, 130, 0.1);
  color: #00a653;
}

.badge.negative {
  background: rgba(255, 99, 132, 0.1);
  color: #e53e3e;
}

.metric-trend {
  font-size: 0.8rem;
  font-weight: 600;
}

.metric-trend.positive {
  color: #00a653;
}

.metric-trend.negative {
  color: #e53e3e;
}

.action-link {
  font-size: 0.8rem;
  color: var(--color-primary);
  text-decoration: none;
}

.action-link:hover {
  text-decoration: underline;
}

/* Charts Section */
.charts-section {
  margin-bottom: 2rem;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
  gap: 1.5rem;
}

.chart-card {
  background: white;
  padding: 1.5rem;
  border-radius: 0.75rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.chart-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 500;
  color: #666;
}

.chart-actions {
  display: flex;
  align-items: center;
}

.chart-actions select {
  padding: 0.25rem 0.5rem;
  border: 1px solid #e0e0e0;
  border-radius: 0.25rem;
  font-size: 0.8rem;
  background: #f8f8f8;
}

.chart-toggle {
  padding: 0.25rem 0.5rem;
  background: #f8f8f8;
  border: 1px solid #e0e0e0;
  border-radius: 0.25rem;
  font-size: 0.8rem;
  cursor: pointer;
  margin-left: 0.5rem;
}

.chart-toggle.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.points-chart canvas,
.redemptions-chart canvas {
  height: 300px;
}

/* Recent Activity Section */
.recent-activity-section {
  margin-bottom: 2rem;
}

.recent-activity-list {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.activity-item {
  display: flex;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #f0f0f0;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  margin-right: 1rem;
  color: white;
  flex-shrink: 0;
}

.activity-icon.earn {
  background: rgba(0, 220, 130, 0.8);
}

.activity-icon.redeem {
  background: rgba(255, 99, 132, 0.8);
}

.activity-icon.airdrop {
  background: rgba(75, 192, 192, 0.8);
}

.activity-icon.default {
  background: rgba(153, 102, 255, 0.8);
}

.activity-content {
  flex: 1;
}

.activity-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.activity-title {
  margin-right: 1rem;
}

.activity-title h4 {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-secondary);
}

.activity-date {
  display: block;
  font-size: 0.75rem;
  color: #888;
  margin-top: 0.25rem;
}

.activity-points {
  font-size: 0.9rem;
  font-weight: 600;
  white-space: nowrap;
}

.activity-points.positive {
  color: #00a653;
}

.activity-points.negative {
  color: #e53e3e;
}

.activity-details {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: #666;
}

.activity-user,
.activity-product {
  padding: 0.125rem 0.375rem;
  background: #f5f5f5;
  border-radius: 0.25rem;
}

.no-activity {
  padding: 2rem;
  text-align: center;
  color: #888;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .dashboard {
    padding: 1rem;
  }

  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .dashboard-actions {
    margin-top: 1rem;
    width: 100%;
    justify-content: space-between;
  }

  .metrics-grid {
    grid-template-columns: 1fr;
  }

  .charts-grid {
    grid-template-columns: 1fr;
  }
}
</style>
