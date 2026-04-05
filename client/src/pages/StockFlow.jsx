import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import BottomNav from '../components/BottomNav'
import styles from './StockFlow.module.css'

// ── Constants ──────────────────────────────────────────────────────────────

const WEIGHT_RANGES = {
  Calves: { min: 30, max: 200, label: 'Calves' },
  Weaners: { min: 80, max: 300, label: 'Weaners' },
  Cows: { min: 350, max: 700, label: 'Cows' },
  Bulls: { min: 350, max: 900, label: 'Bulls' },
  'Cull Cows': { min: 200, max: 650, label: 'Cull Cows' },
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Dormant: Jul(7) Aug(8) Sep(9) Oct(10)
// Growing: Nov(11) Dec(12) Jan(1) Feb(2) Mar(3) Apr(4) May(5) Jun(6)
function getSeasonType(month) {
  return [7, 8, 9, 10].includes(month) ? 'dormant' : 'growing'
}

// Financial year: Jul → Jun
// If current month >= July, start year = current year, else current year - 1
function getFinancialYearMonths() {
  const now = new Date()
  const currentMonth = now.getMonth() + 1 // 1-based
  const currentYear = now.getFullYear()
  const startYear = currentMonth >= 7 ? currentYear : currentYear - 1

  const months = []
  // Jul-Dec of startYear
  for (let m = 7; m <= 12; m++) {
    months.push({ month: m, year: startYear, name: MONTH_NAMES[m - 1] })
  }
  // Jan-Jun of startYear+1
  for (let m = 1; m <= 6; m++) {
    months.push({ month: m, year: startYear + 1, name: MONTH_NAMES[m - 1] })
  }
  return { months, startYear }
}

// ── Mock data (fallback) ──────────────────────────────────────────────────

const MOCK_MOBS = [
  { id: '1', name: 'Dry Cows', stockClasses: ['Cows'] },
  { id: '2', name: 'Steers', stockClasses: ['Weaners'] },
  { id: '3', name: 'Heifers', stockClasses: ['Cows'] },
  { id: '4', name: 'Bulls', stockClasses: ['Bulls'] },
]

function buildMockEntries(startYear) {
  const map = {}

  // Jul startYear: Dry Cows / Cows — 120 animals, 480kg
  const k1 = `1-Cows-7-${startYear}`
  map[k1] = {
    id: `mock-${k1}`,
    mobId: '1',
    stockClass: 'Cows',
    month: 7,
    year: startYear,
    seasonType: 'dormant',
    numberOfAnimals: 120,
    averageWeightKg: 480,
    lsu: 128.0,
    kgdmu: 1088,
    kgdmTotal: 130560,
  }

  // Aug startYear: Dry Cows / Cows — 120 animals, 320kg (below 350 min → warning)
  const k2 = `1-Cows-8-${startYear}`
  map[k2] = {
    id: `mock-${k2}`,
    mobId: '1',
    stockClass: 'Cows',
    month: 8,
    year: startYear,
    seasonType: 'dormant',
    numberOfAnimals: 120,
    averageWeightKg: 320,
    lsu: 85.3,
    kgdmu: null,
    kgdmTotal: 1152,
  }

  // Nov startYear: Dry Cows / Cows — 115 animals, 510kg
  const k3 = `1-Cows-11-${startYear}`
  map[k3] = {
    id: `mock-${k3}`,
    mobId: '1',
    stockClass: 'Cows',
    month: 11,
    year: startYear,
    seasonType: 'growing',
    numberOfAnimals: 115,
    averageWeightKg: 510,
    lsu: 130.3,
    kgdmu: 15.3,
    kgdmTotal: 1760,
  }

  return map
}

// ── Helpers ───────────────────────────────────────────────────────────────

function entryKey(mobId, stockClass, month, year) {
  return `${mobId}-${stockClass}-${month}-${year}`
}

function formatNum(val, decimals = 1) {
  if (val == null || val === '' || isNaN(Number(val))) return '—'
  return Number(val).toFixed(decimals)
}

// ── Main component ────────────────────────────────────────────────────────

export default function StockFlow() {
  const { user, token } = useAuth()
  const navigate = useNavigate()

  const { months, startYear } = useMemo(() => getFinancialYearMonths(), [])

  const [mobs, setMobs] = useState([])
  const [selectedMobId, setSelectedMobId] = useState(null)
  const [entries, setEntries] = useState({})   // key → entry object
  const [localInputs, setLocalInputs] = useState({}) // key → { numberOfAnimals, averageWeightKg }
  const [saving, setSaving] = useState({})     // key → bool
  const [faqOpen, setFaqOpen] = useState(false)
  const [apiError, setApiError] = useState(false)

  const propertyId = user?.propertyId
  const firstName = user?.name?.split(' ')[0] || 'G'

  // ── Load mobs ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }
    if (!propertyId) return

    fetch(`/api/properties/${propertyId}/mobs`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error('failed')
        return r.json()
      })
      .then((data) => {
        const list = Array.isArray(data) ? data : []
        if (list.length === 0) throw new Error('empty')
        setMobs(list)
        setSelectedMobId(list[0].id)
      })
      .catch(() => {
        setApiError(true)
        setMobs(MOCK_MOBS)
        setSelectedMobId(MOCK_MOBS[0].id)
        setEntries(buildMockEntries(startYear))
      })
  }, [token, propertyId, navigate, startYear])

  // ── Load stock flow when mob changes ─────────────────────────────────

  useEffect(() => {
    if (!selectedMobId || !token) return
    if (apiError) return // already using mock data

    fetch(`/api/mobs/${selectedMobId}/stock-flow`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error('failed')
        return r.json()
      })
      .then((data) => {
        const list = Array.isArray(data) ? data : []
        const map = {}
        list.forEach((entry) => {
          const k = entryKey(entry.mobId, entry.stockClass, entry.month, entry.year)
          map[k] = entry
        })
        setEntries((prev) => ({ ...prev, ...map }))
        // Sync localInputs from loaded data
        setLocalInputs((prev) => {
          const next = { ...prev }
          list.forEach((entry) => {
            const k = entryKey(entry.mobId, entry.stockClass, entry.month, entry.year)
            if (!next[k]) {
              next[k] = {
                numberOfAnimals: entry.numberOfAnimals != null ? String(entry.numberOfAnimals) : '',
                averageWeightKg: entry.averageWeightKg != null ? String(entry.averageWeightKg) : '',
              }
            }
          })
          return next
        })
      })
      .catch(() => {
        // Silently fall back — mock entries already set if apiError
      })
  }, [selectedMobId, token, apiError])

  // ── Sync localInputs when entries change (from API responses) ─────────

  useEffect(() => {
    setLocalInputs((prev) => {
      const next = { ...prev }
      Object.entries(entries).forEach(([k, entry]) => {
        if (!next[k]) {
          next[k] = {
            numberOfAnimals: entry.numberOfAnimals != null ? String(entry.numberOfAnimals) : '',
            averageWeightKg: entry.averageWeightKg != null ? String(entry.averageWeightKg) : '',
          }
        }
      })
      return next
    })
  }, [entries])

  // ── Selected mob object ──────────────────────────────────────────────

  const selectedMob = useMemo(
    () => mobs.find((m) => m.id === selectedMobId) || null,
    [mobs, selectedMobId]
  )

  // Stock classes for the selected mob
  const stockClasses = useMemo(() => {
    if (!selectedMob) return []
    return Array.isArray(selectedMob.stockClasses) ? selectedMob.stockClasses : []
  }, [selectedMob])

  // ── Input handlers ────────────────────────────────────────────────────

  function handleInputChange(key, field, value) {
    setLocalInputs((prev) => ({
      ...prev,
      [key]: { ...(prev[key] || {}), [field]: value },
    }))
  }

  const saveEntry = useCallback(
    async (key, stockClass, month, year) => {
      const inputs = localInputs[key] || {}
      const numberOfAnimals = inputs.numberOfAnimals
      const averageWeightKg = inputs.averageWeightKg

      // Only save if both fields have values
      if (!numberOfAnimals || !averageWeightKg) return

      const n = Number(numberOfAnimals)
      const w = Number(averageWeightKg)
      if (isNaN(n) || isNaN(w) || n <= 0 || w <= 0) return

      if (!token || !selectedMobId || apiError) {
        // Offline / mock: compute locally and store
        const lsu = (n * w) / 450
        const kgdmu = lsu * 8.5
        const kgdmTotal = kgdmu * n
        setEntries((prev) => ({
          ...prev,
          [key]: {
            ...prev[key],
            mobId: selectedMobId,
            stockClass,
            month,
            year,
            seasonType: getSeasonType(month),
            numberOfAnimals: n,
            averageWeightKg: w,
            lsu: Math.round(lsu * 10) / 10,
            kgdmu: Math.round(kgdmu * 10) / 10,
            kgdmTotal: Math.round(kgdmTotal),
          },
        }))
        return
      }

      setSaving((prev) => ({ ...prev, [key]: true }))
      try {
        const res = await fetch(`/api/mobs/${selectedMobId}/stock-flow`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            stockClass,
            month,
            year,
            seasonType: getSeasonType(month),
            numberOfAnimals: n,
            averageWeightKg: w,
          }),
        })
        if (res.ok) {
          const data = await res.json()
          setEntries((prev) => ({ ...prev, [key]: { ...prev[key], ...data } }))
        }
      } catch {
        // Silently ignore network errors — values remain in localInputs
      } finally {
        setSaving((prev) => ({ ...prev, [key]: false }))
      }
    },
    [localInputs, token, selectedMobId, apiError]
  )

  // ── Weight range warnings ─────────────────────────────────────────────

  const weightWarnings = useMemo(() => {
    const warnings = []
    if (!selectedMobId) return warnings

    months.forEach(({ month, year, name }) => {
      stockClasses.forEach((sc) => {
        const k = entryKey(selectedMobId, sc, month, year)
        const inputs = localInputs[k] || {}
        const w = Number(inputs.averageWeightKg)
        if (!inputs.averageWeightKg || isNaN(w)) return
        const range = WEIGHT_RANGES[sc]
        if (!range) return
        if (w < range.min) {
          warnings.push({
            key: k,
            message: `${name} ${year} — ${sc}: ${w}kg is below typical range (${range.min}kg – ${range.max}kg).`,
          })
        } else if (w > range.max) {
          warnings.push({
            key: k,
            message: `${name} ${year} — ${sc}: ${w}kg is above typical range (${range.min}kg – ${range.max}kg).`,
          })
        }
      })
    })
    return warnings
  }, [localInputs, months, stockClasses, selectedMobId])

  // ── Derived display values ─────────────────────────────────────────────

  function getEntry(stockClass, month, year) {
    const k = entryKey(selectedMobId, stockClass, month, year)
    return entries[k] || null
  }

  function getInputs(stockClass, month, year) {
    const k = entryKey(selectedMobId, stockClass, month, year)
    return localInputs[k] || { numberOfAnimals: '', averageWeightKg: '' }
  }

  function isOutOfRange(stockClass, month, year) {
    const k = entryKey(selectedMobId, stockClass, month, year)
    const inputs = localInputs[k] || {}
    const w = Number(inputs.averageWeightKg)
    if (!inputs.averageWeightKg || isNaN(w)) return false
    const range = WEIGHT_RANGES[stockClass]
    if (!range) return false
    return w < range.min || w > range.max
  }

  // ── Group months by season for rendering ──────────────────────────────

  const monthGroups = useMemo(() => {
    const groups = []
    let current = null
    months.forEach((m) => {
      const season = getSeasonType(m.month)
      if (!current || current.season !== season) {
        current = { season, months: [m] }
        groups.push(current)
      } else {
        current.months.push(m)
      }
    })
    return groups
  }, [months])

  // ── Render ────────────────────────────────────────────────────────────

  const endYear = startYear + 1

  return (
    <div className={styles.page}>

      {/* ── Top bar ── */}
      <header className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <button
            className={styles.backBtn}
            onClick={() => navigate('/dashboard')}
            aria-label="Back to dashboard"
          >
            <ChevronLeftIcon />
          </button>
          <div className={styles.topBarTitle}>
            <span className={styles.titleText}>Stock flow planner</span>
            <span className={styles.subtitleText}>JUL {startYear} — JUN {endYear}</span>
          </div>
        </div>
        <div className={styles.topBarRight}>
          <button className={styles.iconBtn} aria-label="Notifications">
            <BellIcon />
          </button>
          <div className={styles.avatar} aria-label="User avatar">
            <span className={styles.avatarInitial}>{firstName[0]?.toUpperCase()}</span>
          </div>
        </div>
      </header>

      {/* ── Scrollable content ── */}
      <main className={styles.main}>

        {/* Season indicator banners */}
        <div className={styles.seasonGrid}>
          <div className={styles.seasonCardDormant}>
            <span className={styles.accentBarDormant} />
            <div>
              <p className={styles.seasonLabelDormant}>JUL – OCT</p>
              <p className={styles.seasonHeadingDormant}>Dormant</p>
            </div>
          </div>
          <div className={styles.seasonCardGrowing}>
            <span className={styles.accentBarGrowing} />
            <div>
              <p className={styles.seasonLabelGrowing}>NOV – JUN</p>
              <p className={styles.seasonHeadingGrowing}>Growing</p>
            </div>
          </div>
        </div>

        {/* Mob selector tabs */}
        <div className={styles.mobTabsWrapper} role="tablist" aria-label="Select mob">
          {mobs.map((mob) => (
            <button
              key={mob.id}
              role="tab"
              aria-selected={mob.id === selectedMobId}
              className={`${styles.mobTab} ${mob.id === selectedMobId ? styles.mobTabActive : ''}`}
              onClick={() => setSelectedMobId(mob.id)}
            >
              {mob.name}
            </button>
          ))}
        </div>

        {/* Data table */}
        {selectedMob && (
          <div className={styles.tableCard}>
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr className={styles.tableHeaderRow}>
                    <th className={`${styles.th} ${styles.thClass}`}>CLASS</th>
                    <th className={styles.th}>NO.</th>
                    <th className={styles.th}>AV WT (KG)</th>
                    <th className={styles.th}>LSU</th>
                    <th className={styles.th}>KgDMU</th>
                    <th className={styles.th}>KgDM TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {monthGroups.map(({ season, months: groupMonths }) =>
                    groupMonths.map((monthInfo) => (
                      <MonthSection
                        key={`${monthInfo.month}-${monthInfo.year}`}
                        monthInfo={monthInfo}
                        season={season}
                        stockClasses={stockClasses}
                        selectedMobId={selectedMobId}
                        getEntry={getEntry}
                        getInputs={getInputs}
                        isOutOfRange={isOutOfRange}
                        saving={saving}
                        localInputs={localInputs}
                        handleInputChange={handleInputChange}
                        saveEntry={saveEntry}
                        entryKey={entryKey}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Weight range warning card */}
        {weightWarnings.length > 0 && (
          <div className={styles.warningCard}>
            <span className={styles.warningIcon} aria-hidden="true">
              <WarningTriangleIcon />
            </span>
            <div>
              <p className={styles.warningTitle}>Weight Range Warning</p>
              {weightWarnings.map((w) => (
                <p key={w.key} className={styles.warningDesc}>{w.message}</p>
              ))}
            </div>
          </div>
        )}

        {/* FAQ accordion */}
        <div className={styles.faqCard}>
          <button
            className={styles.faqBtn}
            onClick={() => setFaqOpen((o) => !o)}
            aria-expanded={faqOpen}
          >
            <span className={styles.faqTitle}>How are these calculated?</span>
            <span
              className={styles.faqChevron}
              style={{ transform: faqOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
              aria-hidden="true"
            >
              <ChevronDownIcon />
            </span>
          </button>
          {faqOpen && (
            <div className={styles.faqContent}>
              <ul className={styles.faqList}>
                <li>LSU = (No. of Animals × Average Weight) ÷ 450</li>
                <li>KgDMU = LSU × 8.5</li>
                <li>KgDM Total = KgDMU × No. of Animals</li>
              </ul>
              <p className={styles.faqNote}>Calculated fields update after saving each row.</p>
            </div>
          )}
        </div>

      </main>

      {/* FAB */}
      <button
        className={styles.fab}
        aria-label="Add stock flow entry"
        onClick={() => {
          // Scroll to top of table to prompt user to fill in a row
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
      >
        <PlusIcon />
      </button>

      <BottomNav />
    </div>
  )
}

// ── MonthSection sub-component ─────────────────────────────────────────────

function MonthSection({
  monthInfo,
  season,
  stockClasses,
  selectedMobId,
  getEntry,
  getInputs,
  isOutOfRange,
  saving,
  localInputs,
  handleInputChange,
  saveEntry,
  entryKey,
}) {
  const { month, year, name } = monthInfo
  const isDormant = season === 'dormant'

  return (
    <>
      {/* Month header row */}
      <tr className={isDormant ? styles.monthRowDormant : styles.monthRowGrowing}>
        <td colSpan={6} className={isDormant ? styles.monthCellDormant : styles.monthCellGrowing}>
          <div className={styles.monthCellInner}>
            <span aria-hidden="true">
              {isDormant ? <CalendarIcon /> : <LeafCircleIcon />}
            </span>
            <span className={styles.monthLabel}>
              {name.toUpperCase()} {year}
              {' • '}
              <span className={isDormant ? styles.seasonTagDormant : styles.seasonTagGrowing}>
                {isDormant ? 'Dormant' : 'Growing'}
              </span>
            </span>
          </div>
        </td>
      </tr>

      {/* Data rows — one per stock class */}
      {stockClasses.map((sc) => {
        const k = entryKey(selectedMobId, sc, month, year)
        const entry = getEntry(sc, month, year)
        const inputs = getInputs(sc, month, year)
        const outOfRange = isOutOfRange(sc, month, year)
        const isSaving = saving[k]

        return (
          <tr key={k} className={styles.dataRow}>
            {/* CLASS (sticky) */}
            <td className={styles.tdClass}>{sc}</td>

            {/* NO. (editable) */}
            <td className={styles.tdInput}>
              <div className={styles.inputWrap}>
                <input
                  type="number"
                  min="0"
                  className={styles.cellInput}
                  value={inputs.numberOfAnimals}
                  onChange={(e) =>
                    handleInputChange(k, 'numberOfAnimals', e.target.value)
                  }
                  onBlur={() => saveEntry(k, sc, month, year)}
                  aria-label={`Number of animals, ${sc}, ${name} ${year}`}
                  placeholder="—"
                />
              </div>
            </td>

            {/* AV WT (editable, with error state) */}
            <td className={styles.tdInput}>
              <div className={styles.inputWrap}>
                <input
                  type="number"
                  min="0"
                  className={`${styles.cellInput} ${outOfRange ? styles.cellInputError : ''}`}
                  value={inputs.averageWeightKg}
                  onChange={(e) =>
                    handleInputChange(k, 'averageWeightKg', e.target.value)
                  }
                  onBlur={() => saveEntry(k, sc, month, year)}
                  aria-label={`Average weight kg, ${sc}, ${name} ${year}`}
                  placeholder="—"
                />
                {outOfRange && (
                  <span className={styles.errorBadge} aria-label="Out of range">!</span>
                )}
              </div>
            </td>

            {/* LSU (read-only) */}
            <td className={styles.tdReadonly}>
              {isSaving ? <span className={styles.savingDot} /> : formatNum(entry?.lsu)}
            </td>

            {/* KgDMU (read-only) */}
            <td className={styles.tdReadonly}>
              {isSaving ? null : formatNum(entry?.kgdmu)}
            </td>

            {/* KgDM Total (read-only, highlighted) */}
            <td className={styles.tdTotal}>
              {isSaving ? null : formatNum(entry?.kgdmTotal, 0)}
            </td>
          </tr>
        )
      })}
    </>
  )
}

// ── Icons ─────────────────────────────────────────────────────────────────

function ChevronLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg width="16" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 22c1.1 0 2-.9 2-2h-4a2 2 0 0 0 2 2zm6-6V11c0-3.07-1.64-5.64-4.5-6.32V4a1.5 1.5 0 0 0-3 0v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" fill="currentColor" />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg width="12" height="8" viewBox="0 0 12 8" fill="none" aria-hidden="true">
      <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 1v12M1 7h12" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg width="12" height="13" viewBox="0 0 12 13" fill="none" aria-hidden="true">
      <rect x="0.5" y="1.5" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M0.5 5h11" stroke="currentColor" strokeWidth="1.2" />
      <path d="M4 0.5v2M8 0.5v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function LeafCircleIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
      <circle cx="5.5" cy="5.5" r="5" stroke="currentColor" strokeWidth="1" />
      <path d="M5.5 8C4 6.5 3.5 5 5 4c.5-.5 1.5-.5 2 0 .5.5.5 1.5 0 2-1 1-1.5 2-1.5 2z" fill="currentColor" />
    </svg>
  )
}

function WarningTriangleIcon() {
  return (
    <svg width="22" height="19" viewBox="0 0 22 19" fill="none" aria-hidden="true">
      <path d="M1 18h20L11 1 1 18zm11-3h-2v-2h2v2zm0-4h-2V7h2v4z" fill="#b83230" />
    </svg>
  )
}
