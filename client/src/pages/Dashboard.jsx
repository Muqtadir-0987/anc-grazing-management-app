import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import BottomNav from '../components/BottomNav'
import styles from './Dashboard.module.css'

// Greeting based on time of day
function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function Dashboard() {
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // DEMO MODE — mock data, no backend required
    setData({
      propertyName: 'Granite Downs',
      seasonType: 'dormant',
      feedDaysRemaining: 47,
      totalKgdmDemand: 3840,
      totalLsu: 320,
      activePaddocks: 6,
      srcc: 0.91,
      srccStatus: 'balanced',
      alerts: [
        'SR:CC at 0.91 — approaching threshold. Review paddock allocation for North Flats mob.',
      ],
      mobs: [
        { id: '1', name: 'North Flats Mob', headCount: 120, paddockName: 'Paddock 14B' },
        { id: '2', name: 'Hill Country Steers', headCount: 85, paddockName: 'Ridge View' },
        { id: '3', name: 'Replacement Heifers', headCount: 115, paddockName: 'The Gums' },
      ],
    })
    setLoading(false)
  }, [])

  if (loading) return <LoadingScreen />
  if (error) return <ErrorScreen message={error} />

  const {
    propertyName = 'My Property',
    seasonType = 'dormant',
    feedDaysRemaining = 0,
    totalKgdmDemand = 0,
    totalLsu = 0,
    activePaddocks = 0,
    srcc = 0,
    srccStatus = 'balanced',
    mobs = [],
    alerts = [],
  } = data || {}

  const isOverstocked = srccStatus === 'overstocked' || srcc > 1.0
  // Clamp fill to 100% so bar doesn't overflow
  const srccFillPct = Math.min(srcc * 100, 100)
  const firstName = user?.name?.split(' ')[0] || 'Grazier'

  return (
    <div className={styles.page}>
      {/* ── Top app bar ── */}
      <header className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <span className={styles.greeting}>{getGreeting()}, {firstName}</span>
          <span className={styles.propertyName}>{propertyName}</span>
        </div>
        <div className={styles.topBarRight}>
          <span className={styles.seasonBadge}>
            {seasonType === 'dormant' ? 'Dormant season' : 'Growing season'}
          </span>
          <div className={styles.avatarWrap} aria-label="User avatar">
            <span className={styles.avatarInitials}>{firstName[0]}</span>
          </div>
        </div>
      </header>

      {/* ── Scrollable content ── */}
      <main className={styles.main}>
        {/* Alert strip */}
        {alerts.map((alert, i) => (
          <div key={i} className={`${styles.alertStrip} ${isOverstocked ? styles.alertRed : styles.alertAmber}`}>
            <span className={styles.alertIcon} aria-hidden="true">
              <WarningIcon />
            </span>
            <p className={styles.alertText}>{alert}</p>
          </div>
        ))}

        {/* Fallback alert for SR:CC approaching threshold (from design) */}
        {alerts.length === 0 && srcc >= 0.85 && srcc < 1.0 && (
          <div className={styles.alertStrip}>
            <span className={styles.alertIcon} aria-hidden="true">
              <WarningIcon />
            </span>
            <p className={styles.alertText}>
              SR:CC at {srcc.toFixed(2)} — approaching threshold. Review paddock allocation.
            </p>
          </div>
        )}
        {alerts.length === 0 && isOverstocked && (
          <div className={`${styles.alertStrip} ${styles.alertRed}`}>
            <span className={styles.alertIcon} aria-hidden="true">
              <WarningIcon />
            </span>
            <p className={styles.alertText}>
              SR:CC at {srcc.toFixed(2)} — property is overstocked. Action required.
            </p>
          </div>
        )}

        {/* Metric grid */}
        <div className={styles.metricGrid}>
          <MetricCard
            label="Feed days remaining"
            value={feedDaysRemaining}
            unit="days"
            valueColor="green"
          />
          <MetricCard
            label="Total KgDM demand"
            value={totalKgdmDemand.toLocaleString()}
          />
          <MetricCard label="Total LSU" value={totalLsu} />
          <MetricCard label="Active paddocks" value={activePaddocks} />
        </div>

        {/* SR:CC ratio */}
        <div className={styles.srccCard}>
          <div className={styles.srccHeader}>
            <div>
              <h2 className={styles.srccTitle}>SR:CC ratio</h2>
              <p className={styles.srccSubtitle}>Stocking Rate vs Carrying Capacity</p>
            </div>
            <span className={`${styles.srccValue} ${isOverstocked ? styles.srccValueRed : styles.srccValueAmber}`}>
              {srcc.toFixed(2)}
            </span>
          </div>
          <div className={styles.srccBarTrack}>
            <div
              className={`${styles.srccBarFill} ${isOverstocked ? styles.srccBarRed : styles.srccBarAmber}`}
              style={{ width: `${srccFillPct}%` }}
            />
          </div>
          <div className={styles.srccLabels}>
            <span>Understocked</span>
            <span>Optimal</span>
            <span>Overstocked</span>
          </div>
        </div>

        {/* Mobs list */}
        <section className={styles.mobsSection}>
          <div className={styles.mobsHeader}>
            <h2 className={styles.mobsTitle}>Mobs</h2>
            <button className={styles.viewAllBtn} onClick={() => navigate('/stock-flow')}>
              View all <ChevronIcon />
            </button>
          </div>
          <div className={styles.mobList}>
            {mobs.length === 0 ? (
              <p className={styles.emptyText}>No mobs set up yet.</p>
            ) : (
              mobs.map((mob) => <MobCard key={mob.id} mob={mob} />)
            )}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  )
}

function MetricCard({ label, value, unit, valueColor }) {
  return (
    <div className={styles.metricCard}>
      <span className={styles.metricLabel}>{label}</span>
      <div className={styles.metricValueRow}>
        <span className={`${styles.metricValue} ${valueColor === 'green' ? styles.metricValueGreen : ''}`}>
          {value}
        </span>
        {unit && <span className={styles.metricUnit}>{unit}</span>}
      </div>
    </div>
  )
}

// Colour dot per mob — cycles through a palette
const MOB_COLORS = ['#4a7c59', '#705c30', '#a8a29e', '#3b6d11', '#b45309']

function MobCard({ mob, index = 0 }) {
  const dotColor = MOB_COLORS[index % MOB_COLORS.length]
  return (
    <div className={styles.mobCard}>
      <div className={styles.mobLeft}>
        <span className={styles.mobDot} style={{ backgroundColor: dotColor }} />
        <div>
          <p className={styles.mobName}>{mob.name}</p>
          <p className={styles.mobMeta}>
            {mob.headCount} Head{mob.paddockName ? ` • ${mob.paddockName}` : ''}
          </p>
        </div>
      </div>
      <span className={styles.mobChevron} aria-hidden="true">
        <DotsIcon />
      </span>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className={styles.centred}>
      <p>Loading dashboard…</p>
    </div>
  )
}

function ErrorScreen({ message }) {
  return (
    <div className={styles.centred}>
      <p className={styles.errorText}>Could not load dashboard: {message}</p>
    </div>
  )
}

// ── Icons ──

function WarningIcon() {
  return (
    <svg width="22" height="19" viewBox="0 0 24 21" fill="none" aria-hidden="true">
      <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" fill="currentColor" />
    </svg>
  )
}

function ChevronIcon() {
  return (
    <svg width="5" height="8" viewBox="0 0 5 8" fill="none" aria-hidden="true">
      <path d="M1 1l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function DotsIcon() {
  return (
    <svg width="4" height="16" viewBox="0 0 4 16" fill="none" aria-hidden="true">
      <circle cx="2" cy="2" r="1.5" fill="currentColor" />
      <circle cx="2" cy="8" r="1.5" fill="currentColor" />
      <circle cx="2" cy="14" r="1.5" fill="currentColor" />
    </svg>
  )
}
