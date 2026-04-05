import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import BottomNav from '../components/BottomNav'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from 'chart.js'
import styles from './FeedDemand.module.css'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip)

// ── Mock data (fallback when API is unavailable) ──────────────────────────

const MOCK_DATA = {
  propertyName: 'Riverbend Estate',
  periodFrom: 'May 2024',
  periodTo: 'Apr 2026',
  dormantTotal: 142500,
  growingTotal: 388200,
  dormantPeriod: 'Nov – Mar period',
  growingPeriod: 'Apr – Oct period',
  feedDaysRemaining: 47,
  mobs: [
    { name: 'Main Steers (A)', dormant: 42200, growing: 112000 },
    { name: 'Replacement Heifers', dormant: 31500, growing: 88400 },
    { name: 'Breeder Herd B', dormant: 68800, growing: 187800 },
  ],
}

// 24 months of cumulative KgDM data starting May 2024
const CHART_DATA = [
  0, 8500, 18200, 29100, 42500, 58300, 78000, 102000, 130500, 163000,
  198000, 236000, 276000, 318000, 362000, 408000, 440000, 455000, 465000, 472000,
  478000, 483000, 488000, 530700,
]

// Chart.js inline plugin for season band backgrounds
const seasonBandsPlugin = {
  id: 'seasonBands',
  beforeDraw(chart) {
    const { ctx, chartArea } = chart
    if (!chartArea) return
    const { left, right, top, bottom } = chartArea
    const totalWidth = right - left
    const bandWidth = totalWidth / 4

    const bands = [
      { x: left, color: 'rgba(112,92,48,0.08)' },
      { x: left + bandWidth, color: 'rgba(74,124,89,0.08)' },
      { x: left + bandWidth * 2, color: 'rgba(112,92,48,0.08)' },
      { x: left + bandWidth * 3, color: 'rgba(74,124,89,0.08)' },
    ]

    ctx.save()
    bands.forEach(({ x, color }) => {
      ctx.fillStyle = color
      ctx.fillRect(x, top, bandWidth, bottom - top)
    })
    ctx.restore()
  },
}

export default function FeedDemand() {
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const initial = user?.name?.split(' ')[0]?.[0]?.toUpperCase() || 'A'

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }

    const propertyId = user?.propertyId
    if (!propertyId) {
      setData(MOCK_DATA)
      setLoading(false)
      return
    }

    fetch(`/api/properties/${propertyId}/feed-demand`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('API error')
        return res.json()
      })
      .then((json) => setData(json))
      .catch(() => setData(MOCK_DATA))
      .finally(() => setLoading(false))
  }, [token, user, navigate])

  if (loading) {
    return (
      <div className={styles.centred}>
        <p className={styles.loadingText}>Loading feed demand…</p>
      </div>
    )
  }

  const {
    propertyName,
    periodFrom,
    periodTo,
    dormantTotal,
    growingTotal,
    dormantPeriod,
    growingPeriod,
    feedDaysRemaining,
    mobs,
  } = data || MOCK_DATA

  // Compute mob totals and grand totals
  const mobsWithTotals = mobs.map((mob) => ({
    ...mob,
    total: mob.dormant + mob.growing,
  }))

  const grandDormant = mobsWithTotals.reduce((sum, m) => sum + m.dormant, 0)
  const grandGrowing = mobsWithTotals.reduce((sum, m) => sum + m.growing, 0)
  const grandTotal = grandDormant + grandGrowing

  // Chart.js configuration
  const chartLabels = Array.from({ length: 24 }, (_, i) => i.toString())

  const chartDataConfig = {
    labels: chartLabels,
    datasets: [
      {
        data: CHART_DATA,
        borderColor: '#4a7c59',
        borderWidth: 2.5,
        pointRadius: 0,
        tension: 0.4,
        fill: true,
        backgroundColor: 'rgba(74,124,89,0.08)',
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
    scales: {
      x: { display: false },
      y: { display: false },
    },
    elements: {
      line: { tension: 0.4 },
    },
  }

  return (
    <div className={styles.page}>
      {/* ── Top bar ── */}
      <header className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <div className={styles.avatar} aria-label="User avatar">
            <span className={styles.avatarInitial}>{initial}</span>
          </div>
          <span className={styles.brandName}>ANC Grazing</span>
        </div>
        <button className={styles.bellBtn} aria-label="Notifications">
          <BellIcon />
        </button>
      </header>

      {/* ── Main scrollable content ── */}
      <main className={styles.main}>
        {/* Page header */}
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Feed demand summary</h1>
          <div className={styles.metaRow}>
            <LocationPinIcon />
            <span className={styles.metaText}>{propertyName}</span>
          </div>
          <div className={styles.metaRow}>
            <CalendarIcon />
            <span className={styles.metaText}>
              {periodFrom} - {periodTo}
            </span>
          </div>
        </div>

        {/* Season total cards */}
        <div className={styles.seasonCards}>
          {/* Dormant season card */}
          <div className={styles.dormantCard}>
            <p className={styles.seasonLabel}>DORMANT SEASON TOTAL</p>
            <div className={styles.seasonValueRow}>
              <span className={styles.seasonValueDormant}>
                {dormantTotal.toLocaleString()}
              </span>
              <span className={styles.seasonUnit}>KgDM</span>
            </div>
            <div className={styles.seasonFooter}>
              <SunIcon />
              <span className={styles.seasonFooterTextDormant}>{dormantPeriod}</span>
            </div>
          </div>

          {/* Growing season card */}
          <div className={styles.growingCard}>
            <p className={styles.seasonLabelGrowing}>GROWING SEASON TOTAL</p>
            <div className={styles.seasonValueRow}>
              <span className={styles.seasonValueGrowing}>
                {growingTotal.toLocaleString()}
              </span>
              <span className={styles.seasonUnit}>KgDM</span>
            </div>
            <div className={styles.seasonFooter}>
              <LeafIcon />
              <span className={styles.seasonFooterTextGrowing}>{growingPeriod}</span>
            </div>
          </div>
        </div>

        {/* Cumulative demand chart section */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div className={styles.chartTitleStack}>
              <span className={styles.chartTitleLine1}>Cumulative</span>
              <span className={styles.chartTitleLine2}>Demand</span>
            </div>
            <div className={styles.chartForecastStack}>
              <span className={styles.forecastLine1}>24-MONTH</span>
              <span className={styles.forecastLine2}>FORECAST</span>
            </div>
          </div>

          {/* Chart area */}
          <div className={styles.chartAreaWrap}>
            <Line
              data={chartDataConfig}
              options={chartOptions}
              plugins={[seasonBandsPlugin]}
            />
            {/* Forecast pivot label */}
            <span className={styles.forecastPivotLabel}>Forecast Pivot</span>
          </div>

          {/* X-axis labels */}
          <div className={styles.xAxisLabels} aria-hidden="true">
            <span>MAY '24</span>
            <span>NOV '24</span>
            <span>MAY '25</span>
            <span>NOV '25</span>
            <span>APR '26</span>
          </div>

          {/* Feed days remaining */}
          <div className={styles.feedDaysRow}>
            <div className={styles.feedDaysLeft}>
              <GrainIcon />
              <div className={styles.feedDaysText}>
                <span className={styles.feedDaysLabel}>Feed days remaining</span>
                <span className={styles.feedDaysSubtext}>Based on current stock levels</span>
              </div>
            </div>
            <div className={styles.feedDaysRight}>
              <span className={styles.feedDaysValue}>{feedDaysRemaining}</span>
              <span className={styles.feedDaysUnit}>DAYS</span>
            </div>
          </div>
        </div>

        {/* Mob breakdown table */}
        <div className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <h2 className={styles.tableTitle}>Mob Breakdown</h2>
          </div>

          <div className={styles.tableScrollWrap}>
            <table className={styles.table}>
              <thead>
                <tr className={styles.tableHeadRow}>
                  <th className={styles.thMobName}>MOB NAME</th>
                  <th className={styles.thRight}>DORMANT (KG)</th>
                  <th className={styles.thRight}>GROWING (KG)</th>
                  <th className={styles.thRight}>TOTAL (KgDM)</th>
                </tr>
              </thead>
              <tbody>
                {mobsWithTotals.map((mob, i) => (
                  <tr key={i} className={styles.tableBodyRow}>
                    <td className={styles.tdMobName}>{mob.name}</td>
                    <td className={styles.tdRight}>{mob.dormant.toLocaleString()}</td>
                    <td className={styles.tdRight}>{mob.growing.toLocaleString()}</td>
                    <td className={styles.tdRightGreen}>{mob.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className={styles.tableFootRow}>
                  <td className={styles.tdFootLabel}>
                    <span className={styles.grandTotalsLabel}>Grand</span>
                    <span className={styles.grandTotalsLabel}>Totals</span>
                  </td>
                  <td className={styles.tdFootRight}>{grandDormant.toLocaleString()}</td>
                  <td className={styles.tdFootRight}>{grandGrowing.toLocaleString()}</td>
                  <td className={styles.tdFootRightGreen}>{grandTotal.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Export buttons */}
        <div className={styles.exportButtons}>
          <button
            className={styles.exportBtn}
            onClick={() => window.alert('Export coming soon.')}
            aria-label="Export as PDF"
          >
            <PdfIcon />
            <span>Export as PDF</span>
          </button>
          <button
            className={styles.exportBtn}
            onClick={() => window.alert('Export coming soon.')}
            aria-label="Export as CSV"
          >
            <CsvIcon />
            <span>Export as CSV</span>
          </button>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}

// ── Icons ─────────────────────────────────────────────────────────────────

function BellIcon() {
  return (
    <svg width="22" height="24" viewBox="0 0 24 26" fill="none" aria-hidden="true">
      <path
        d="M12 2a7 7 0 0 0-7 7v4l-2 2v1h18v-1l-2-2V9a7 7 0 0 0-7-7z"
        stroke="currentColor"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10 20a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.8" fill="none" />
    </svg>
  )
}

function LocationPinIcon() {
  return (
    <svg width="12" height="15" viewBox="0 0 12 15" fill="none" aria-hidden="true">
      <path
        d="M6 0C3.24 0 1 2.24 1 5c0 3.75 5 10 5 10s5-6.25 5-10c0-2.76-2.24-5-5-5zm0 6.5A1.5 1.5 0 1 1 6 3.5 1.5 1.5 0 0 1 6 6.5z"
        fill="#4a4e4a"
      />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1" y="2" width="14" height="13" rx="2" stroke="#4a4e4a" strokeWidth="1.5" />
      <path d="M5 1v2M11 1v2M1 6h14" stroke="#4a4e4a" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="5" stroke="#705c30" strokeWidth="1.8" />
      <path
        d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
        stroke="#705c30"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function LeafIcon() {
  return (
    <svg width="18" height="20" viewBox="0 0 18 20" fill="none" aria-hidden="true">
      <path
        d="M3 17C3 17 4 9 10 7C16 5 17 3 17 3C17 3 17 11 11 13C8 14 6 16 5 19"
        stroke="#4a7c59"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 19C5 19 7 14 11 13"
        stroke="#4a7c59"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function GrainIcon() {
  return (
    <svg width="28" height="31" viewBox="0 0 28 31" fill="none" aria-hidden="true">
      <ellipse cx="14" cy="8" rx="6" ry="7" stroke="#b45309" strokeWidth="1.8" fill="rgba(180,83,9,0.12)" />
      <path
        d="M8 15c0 0-2 3-2 6h16c0-3-2-6-2-6"
        stroke="#b45309"
        strokeWidth="1.8"
        fill="rgba(180,83,9,0.08)"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M6 21h16" stroke="#b45309" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M7 25h14" stroke="#b45309" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 28.5h12" stroke="#b45309" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function PdfIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="1" width="13" height="17" rx="1.5" stroke="#4a7c59" strokeWidth="1.8" />
      <path d="M16 1l5 5v15a1.5 1.5 0 0 1-1.5 1.5H8.5" stroke="#4a7c59" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M16 1v5h5" stroke="#4a7c59" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <text x="5.5" y="14" fontSize="5.5" fontWeight="700" fill="#4a7c59" fontFamily="sans-serif">PDF</text>
    </svg>
  )
}

function CsvIcon() {
  return (
    <svg width="20" height="16" viewBox="0 0 24 20" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="22" height="18" rx="2" stroke="#4a7c59" strokeWidth="1.8" />
      <path d="M1 7h22M8 7v12M16 7v12" stroke="#4a7c59" strokeWidth="1.5" strokeLinecap="round" />
      <text x="3.5" y="5.5" fontSize="4" fontWeight="700" fill="#4a7c59" fontFamily="sans-serif">CSV</text>
    </svg>
  )
}
