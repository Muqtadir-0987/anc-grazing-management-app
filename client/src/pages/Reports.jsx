import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import BottomNav from '../components/BottomNav'
import styles from './Reports.module.css'

// ── Constants ───────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const MONTH_ABBR = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

const PROPERTIES = [
  'Green Valley Estates',
  'Granite Downs',
  'Riverbend Estate',
]

const RECENT_REPORTS = [
  { id: 1, title: 'April Monthly Performance', date: 'May 02, 2024', size: '2.4 MB', type: 'pdf' },
  { id: 2, title: 'Q1 Strategic Grazing Plan', date: 'April 05, 2024', size: '5.1 MB', type: 'csv' },
  { id: 3, title: 'Weekly Summary: March Week 4', date: 'March 31, 2024', size: '1.2 MB', type: 'pdf' },
  { id: 4, title: 'March Monthly Performance', date: 'March 01, 2024', size: '2.6 MB', type: 'pdf' },
  { id: 5, title: 'Weekly Summary: Feb Week 4', date: 'Feb 28, 2024', size: '1.1 MB', type: 'pdf' },
]

const now = new Date()

// ── Helpers ──────────────────────────────────────────────────────────────────

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function pad(n) {
  return String(n).padStart(2, '0')
}

function computePeriodLabel(reportType, selectedMonth, selectedYear, selectedWeek) {
  const monthName = MONTH_ABBR[selectedMonth]
  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth)

  if (reportType === 'weekly') {
    const starts = [1, 8, 15, 22]
    const ends = [7, 14, 21, daysInMonth]
    const start = starts[selectedWeek - 1]
    const end = ends[selectedWeek - 1]
    return `${monthName} ${pad(start)} - ${monthName} ${pad(end)}`
  }

  if (reportType === 'monthly') {
    return `${monthName} 01 - ${monthName} ${pad(daysInMonth)}`
  }

  // quarterly: 3-month window aligned to quarters
  const quarterStart = Math.floor(selectedMonth / 3) * 3
  const qEnd = (quarterStart + 2) % 12
  const qEndYear = quarterStart + 2 > 11 ? selectedYear + 1 : selectedYear
  return `${MONTH_ABBR[quarterStart]} ${selectedYear} - ${MONTH_ABBR[qEnd]} ${qEndYear}`
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Reports() {
  const { user } = useAuth()

  const initial = user?.name?.split(' ')[0]?.[0]?.toUpperCase() || 'A'

  const [reportType, setReportType] = useState('weekly')
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth())
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [selectedWeek, setSelectedWeek] = useState(1)
  const [selectedProperty, setSelectedProperty] = useState('Green Valley Estates')

  function prevMonth() {
    if (selectedMonth === 0) {
      setSelectedMonth(11)
      setSelectedYear((y) => y - 1)
    } else {
      setSelectedMonth((m) => m - 1)
    }
  }

  function nextMonth() {
    if (selectedMonth === 11) {
      setSelectedMonth(0)
      setSelectedYear((y) => y + 1)
    } else {
      setSelectedMonth((m) => m + 1)
    }
  }

  const periodLabel = computePeriodLabel(reportType, selectedMonth, selectedYear, selectedWeek)

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
          <h1 className={styles.pageTitle}>Reports</h1>
          <p className={styles.pageSubtitle}>
            Generate detailed grazing insights, stocking rates, and pasture health
            summaries for your records.
          </p>
        </div>

        {/* Property selector (admin-only — always shown for now) */}
        <div className={styles.propertySelectorSection}>
          <label htmlFor="property-select" className={styles.propertySelectorLabel}>
            Select Property (Admin)
          </label>
          <div className={styles.selectWrapper}>
            <select
              id="property-select"
              className={styles.propertySelect}
              value={selectedProperty}
              onChange={(e) => setSelectedProperty(e.target.value)}
            >
              {PROPERTIES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <span className={styles.selectChevron} aria-hidden="true">
              <ChevronDownIcon />
            </span>
          </div>
        </div>

        {/* ── Section: Report Type ── */}
        <section className={styles.section}>
          <h2 className={styles.sectionHeading}>Report Type</h2>

          <div className={styles.reportTypeCards}>
            {/* Weekly */}
            <button
              className={`${styles.reportCard} ${reportType === 'weekly' ? styles.reportCardSelected : ''}`}
              onClick={() => setReportType('weekly')}
              aria-pressed={reportType === 'weekly'}
            >
              <span className={styles.cardBadge}>
                {reportType === 'weekly' ? <CheckCircleIcon /> : <EmptyCircleIcon />}
              </span>
              <span className={styles.cardIcon}><WeeklyIcon /></span>
              <span className={styles.cardTitle}>Weekly summary</span>
              <span className={styles.cardDesc}>Detailed move logs and pasture usage.</span>
            </button>

            {/* Monthly */}
            <button
              className={`${styles.reportCard} ${reportType === 'monthly' ? styles.reportCardSelected : ''}`}
              onClick={() => setReportType('monthly')}
              aria-pressed={reportType === 'monthly'}
            >
              <span className={styles.cardBadge}>
                {reportType === 'monthly' ? <CheckCircleIcon /> : <EmptyCircleIcon />}
              </span>
              <span className={styles.cardIcon}><MonthlyIcon /></span>
              <span className={styles.cardTitle}>Monthly report</span>
              <span className={styles.cardDesc}>Pasture growth and stocking density.</span>
            </button>

            {/* Quarterly */}
            <button
              className={`${styles.reportCard} ${reportType === 'quarterly' ? styles.reportCardSelected : ''}`}
              onClick={() => setReportType('quarterly')}
              aria-pressed={reportType === 'quarterly'}
            >
              <span className={styles.cardBadge}>
                {reportType === 'quarterly' ? <CheckCircleIcon /> : <EmptyCircleIcon />}
              </span>
              <span className={styles.cardIcon}><QuarterlyIcon /></span>
              <span className={styles.cardTitle}>Quarterly report</span>
              <span className={styles.cardDesc}>Strategic seasonal performance analysis.</span>
            </button>
          </div>
        </section>

        {/* ── Section: Time Period ── */}
        <section className={styles.section}>
          <h2 className={styles.sectionHeading}>Time Period</h2>

          <div className={styles.timePeriodCard}>
            {/* Month navigator */}
            <div className={styles.monthNav}>
              <button
                className={styles.monthNavBtn}
                onClick={prevMonth}
                aria-label="Previous month"
              >
                <ChevronLeftIcon />
              </button>

              <div className={styles.monthNavCentre}>
                <span className={styles.monthNavLabel}>
                  {MONTH_NAMES[selectedMonth]} {selectedYear}
                </span>
                <span className={styles.monthNavSub}>ACTIVE PERIOD</span>
              </div>

              <button
                className={styles.monthNavBtn}
                onClick={nextMonth}
                aria-label="Next month"
              >
                <ChevronRightIcon />
              </button>
            </div>

            {/* Week selector — visible for weekly only */}
            {reportType === 'weekly' && (
              <div className={styles.weekSelector} role="group" aria-label="Select week">
                {[1, 2, 3, 4].map((w) => (
                  <button
                    key={w}
                    className={`${styles.weekPill} ${selectedWeek === w ? styles.weekPillActive : ''}`}
                    onClick={() => setSelectedWeek(w)}
                    aria-pressed={selectedWeek === w}
                  >
                    Week {w}
                  </button>
                ))}
              </div>
            )}

            {reportType === 'monthly' && (
              <div className={styles.periodNote}>Full month selected</div>
            )}

            {reportType === 'quarterly' && (
              <div className={styles.periodNote}>Full quarter selected</div>
            )}
          </div>
        </section>

        {/* ── Section: Report Preview Panel ── */}
        <section className={styles.section}>
          <div className={styles.previewCard}>
            {/* Header row */}
            <div className={styles.previewHeaderRow}>
              <DocumentIcon size={18} />
              <h2 className={styles.previewHeading}>Report Preview</h2>
            </div>

            {/* Property name */}
            <div className={styles.previewPropertyRow}>
              <span className={styles.previewFieldLabel}>PROPERTY NAME</span>
              <span className={styles.previewPropertyName}>{selectedProperty}</span>
            </div>

            {/* 2-col grid: period + mob count */}
            <div className={styles.previewGrid}>
              <div className={styles.previewGridItem}>
                <span className={styles.previewFieldLabel}>PERIOD</span>
                <span className={styles.previewFieldValue}>{periodLabel}</span>
              </div>
              <div className={styles.previewGridItem}>
                <span className={styles.previewFieldLabel}>MOB COUNT</span>
                <span className={styles.previewFieldValue}>12 Mobs / 450 Heads</span>
              </div>
            </div>

            {/* 2-col grid: SR:CC + KgDM */}
            <div className={styles.previewGrid}>
              <div className={styles.previewGridItem}>
                <span className={styles.previewFieldLabel}>AVG SR:CC</span>
                <span className={`${styles.previewFieldValue} ${styles.srccAmber}`}>0.85</span>
              </div>
              <div className={styles.previewGridItem}>
                <span className={styles.previewFieldLabel}>KGDM SUMMARY</span>
                <span className={styles.previewFieldValue}>2,450 kg/ha</span>
              </div>
            </div>

            {/* Key events row */}
            <div className={styles.keyEventsRow}>
              <span className={styles.keyEventsLabel}>Key Events Recorded</span>
              <span className={styles.keyEventsBadge}>08</span>
            </div>

            {/* Export buttons */}
            <div className={styles.exportButtons}>
              <button
                className={styles.exportBtnPdf}
                onClick={() => window.alert('Generating PDF report…')}
                aria-label="Export as PDF"
              >
                <PdfIcon white />
                <span>Export as PDF</span>
              </button>
              <button
                className={styles.exportBtnCsv}
                onClick={() => window.alert('Generating CSV report…')}
                aria-label="Export as CSV"
              >
                <CsvIcon />
                <span>Export as CSV</span>
              </button>
            </div>
          </div>
        </section>

        {/* ── Section: Recent Reports ── */}
        <section className={styles.section}>
          <div className={styles.recentHeaderRow}>
            <h2 className={styles.recentHeading}>Recent Reports</h2>
            <button className={styles.viewAllBtn} aria-label="View all reports">
              View all
              <ChevronSmallIcon />
            </button>
          </div>

          <div className={styles.recentList}>
            {RECENT_REPORTS.map((report) => (
              <div key={report.id} className={styles.reportItem}>
                {/* Left */}
                <div className={styles.reportItemLeft}>
                  <div className={styles.reportIconBadge} aria-hidden="true">
                    {report.type === 'csv' ? <CsvIconSmall /> : <DocumentIcon size={16} />}
                  </div>
                  <div className={styles.reportItemText}>
                    <span className={styles.reportItemTitle}>{report.title}</span>
                    <span className={styles.reportItemMeta}>
                      Generated on {report.date} &bull; {report.size}
                    </span>
                  </div>
                </div>

                {/* Right */}
                <div className={styles.reportItemRight}>
                  <button
                    className={styles.iconBtn}
                    aria-label={`Download ${report.title}`}
                  >
                    <DownloadIcon />
                  </button>
                  <button
                    className={styles.iconBtn}
                    aria-label={`More options for ${report.title}`}
                  >
                    <DotsVerticalIcon />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>

      <BottomNav />
    </div>
  )
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function BellIcon() {
  return (
    <svg width="16" height="20" viewBox="0 0 24 26" fill="none" aria-hidden="true">
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

function WeeklyIcon() {
  return (
    <svg width="25" height="20" viewBox="0 0 25 20" fill="none" aria-hidden="true">
      <rect x="1" y="2" width="23" height="17" rx="2.5" stroke="#4a7c59" strokeWidth="1.6" />
      <path d="M7 1v3M18 1v3M1 8h23" stroke="#4a7c59" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M5 12h5M5 15.5h8M15 12h5" stroke="#4a7c59" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function MonthlyIcon() {
  return (
    <svg width="22" height="25" viewBox="0 0 22 25" fill="none" aria-hidden="true">
      <rect x="1" y="2.5" width="20" height="21" rx="2.5" stroke="#4a7c59" strokeWidth="1.6" />
      <path d="M7 1v3M15 1v3M1 9h20" stroke="#4a7c59" strokeWidth="1.6" strokeLinecap="round" />
      <rect x="4" y="12" width="3" height="3" rx="0.5" fill="#4a7c59" />
      <rect x="9.5" y="12" width="3" height="3" rx="0.5" fill="#4a7c59" />
      <rect x="15" y="12" width="3" height="3" rx="0.5" fill="#4a7c59" />
      <rect x="4" y="17" width="3" height="3" rx="0.5" fill="#4a7c59" />
      <rect x="9.5" y="17" width="3" height="3" rx="0.5" fill="#4a7c59" />
    </svg>
  )
}

function QuarterlyIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="20" height="20" rx="2.5" stroke="#4a7c59" strokeWidth="1.6" />
      <path d="M5 16V11M9.5 16V7M14 16V9M18 16V5" stroke="#4a7c59" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function CheckCircleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="10" fill="#4a7c59" />
      <path d="M5.5 10.5l3 3 6-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function EmptyCircleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="9" stroke="#c4c8bc" strokeWidth="1.5" />
    </svg>
  )
}

function ChevronLeftIcon() {
  return (
    <svg width="7" height="12" viewBox="0 0 7 12" fill="none" aria-hidden="true">
      <path d="M6 1L1 6l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg width="7" height="12" viewBox="0 0 7 12" fill="none" aria-hidden="true">
      <path d="M1 1l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg width="12" height="7" viewBox="0 0 12 7" fill="none" aria-hidden="true">
      <path d="M1 1l5 5 5-5" stroke="#2e3230" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function DocumentIcon({ size = 18 }) {
  const w = size
  const h = Math.round(size * (20 / 16))
  return (
    <svg width={w} height={h} viewBox="0 0 16 20" fill="none" aria-hidden="true">
      <path
        d="M9 1H3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7L9 1z"
        stroke="#4a7c59"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9 1v6h6" stroke="#4a7c59" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 11h6M5 14h4" stroke="#4a7c59" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function PdfIcon({ white }) {
  const stroke = white ? 'white' : '#4a7c59'
  const fill = white ? 'white' : '#4a7c59'
  return (
    <svg width="15" height="15" viewBox="0 0 16 20" fill="none" aria-hidden="true">
      <path
        d="M9 1H3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7L9 1z"
        stroke={stroke}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9 1v6h6" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <text x="3.5" y="16" fontSize="5.5" fontWeight="700" fill={fill} fontFamily="sans-serif">PDF</text>
    </svg>
  )
}

function CsvIcon() {
  return (
    <svg width="15" height="12" viewBox="0 0 24 20" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="22" height="18" rx="2" stroke="#4a7c59" strokeWidth="1.8" />
      <path d="M1 7h22M8 7v12M16 7v12" stroke="#4a7c59" strokeWidth="1.5" strokeLinecap="round" />
      <text x="3.5" y="5.5" fontSize="4" fontWeight="700" fill="#4a7c59" fontFamily="sans-serif">CSV</text>
    </svg>
  )
}

function CsvIconSmall() {
  return (
    <svg width="16" height="20" viewBox="0 0 24 20" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="22" height="18" rx="2" stroke="#4a7c59" strokeWidth="1.8" />
      <path d="M1 7h22M8 7v12M16 7v12" stroke="#4a7c59" strokeWidth="1.5" strokeLinecap="round" />
      <text x="3.5" y="5.5" fontSize="4" fontWeight="700" fill="#4a7c59" fontFamily="sans-serif">CSV</text>
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 1v9M4 7l4 4 4-4" stroke="#4a7c59" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M1 13h14" stroke="#4a7c59" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function DotsVerticalIcon() {
  return (
    <svg width="4" height="16" viewBox="0 0 4 16" fill="none" aria-hidden="true">
      <circle cx="2" cy="2" r="1.5" fill="#4a4e4a" />
      <circle cx="2" cy="8" r="1.5" fill="#4a4e4a" />
      <circle cx="2" cy="14" r="1.5" fill="#4a4e4a" />
    </svg>
  )
}

function ChevronSmallIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden="true">
      <path d="M2 1.5l3.5 3L2 7.5" stroke="#4a7c59" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
