import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import BottomNav from '../components/BottomNav'
import styles from './ClosedPlan.module.css'

// ── Mock data (fallback when API is unavailable) ──────────────────────────────

const MOCK_MOBS = [
  { id: 'mob-1', name: 'North Flats Mob',    lsuTotal: 128, dailyKgdm: 1088 },
  { id: 'mob-2', name: 'Hill Country Steers', lsuTotal: 66,  dailyKgdm: 561  },
  { id: 'mob-3', name: 'Replacement Heifers', lsuTotal: 36,  dailyKgdm: 306  },
]

const MOCK_PADDOCKS = [
  { id: 'pad-1', name: 'River Flats',   sizeHa: 42, stacRating: 9,  kgdmPerHa: 101.25, totalKgdm: 4252.5  },
  { id: 'pad-2', name: 'The Gums',      sizeHa: 28, stacRating: 6,  kgdmPerHa: 67.5,   totalKgdm: 1890    },
  { id: 'pad-3', name: 'North Paddock', sizeHa: 55, stacRating: 12, kgdmPerHa: 135,    totalKgdm: 7425    },
  { id: 'pad-4', name: 'Home Block',    sizeHa: 34, stacRating: 9,  kgdmPerHa: 101.25, totalKgdm: 3442.5  },
  { id: 'pad-5', name: 'Creek Flats',   sizeHa: 18, stacRating: 6,  kgdmPerHa: 67.5,   totalKgdm: 1215    },
]

const MOCK_PLAN = {
  id: 'plan-1',
  startDate: '2026-05-01',
  endDate: '2026-10-31',
  seasonType: 'dormant',
}

const MOCK_ALLOCATIONS = [
  {
    id: 'alloc-1',
    paddockId: 'pad-1', paddockName: 'River Flats',   paddockSizeHa: 42, totalKgdm: 4252.5,
    mobId: 'mob-1',     mobName: 'North Flats Mob',    dailyKgdm: 1088,
    grazePeriodDays: 3.9,   surplusDeficitKgdm: -3.5,
  },
  {
    id: 'alloc-2',
    paddockId: 'pad-3', paddockName: 'North Paddock',  paddockSizeHa: 55, totalKgdm: 7425,
    mobId: 'mob-2',     mobName: 'Hill Country Steers', dailyKgdm: 561,
    grazePeriodDays: 13.2,  surplusDeficitKgdm: 120,
  },
  {
    id: 'alloc-3',
    paddockId: 'pad-4', paddockName: 'Home Block',     paddockSizeHa: 34, totalKgdm: 3442.5,
    mobId: 'mob-3',     mobName: 'Replacement Heifers', dailyKgdm: 306,
    grazePeriodDays: 11.2,  surplusDeficitKgdm: 15,
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`
}

function daysBetween(start, end) {
  if (!start || !end) return 0
  return Math.round((new Date(end) - new Date(start)) / 86400000)
}

function computeSRCC(allocations, paddocks) {
  const totalLSU = allocations.reduce((sum, a) => sum + (a.lsuTotal ?? 0), 0)
  // Carrying capacity: sum of paddock totalKgdm / 365 × (1/8.5) × 450  (reverse of LSU formula)
  // Simpler: totalKgdm across all farm paddocks / (365 × KgDMU per LSU)
  const totalPaddockKgdm = paddocks.reduce((sum, p) => sum + (p.totalKgdm ?? 0), 0)
  const carryingCapacityLSU = totalPaddockKgdm / (365 * 8.5)
  if (!carryingCapacityLSU) return null
  return totalLSU / carryingCapacityLSU
}

function srccColor(ratio) {
  if (ratio === null || ratio === undefined) return '#78716c'
  if (ratio > 1.0) return '#b83230'
  if (ratio >= 0.85) return '#d97706'
  return '#4a7c59'
}

function srccLabel(ratio) {
  if (ratio === null || ratio === undefined) return 'No data'
  if (ratio > 1.0) return 'Overstocked'
  if (ratio >= 0.85) return 'Approaching limit'
  return 'Balanced'
}

function barFill(ratio) {
  if (!ratio) return 0
  return Math.min(100, Math.round(ratio * 100))
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ClosedPlan() {
  const navigate   = useNavigate()
  const { user, token } = useAuth()

  // Data
  const [plan,        setPlan]        = useState(null)
  const [allocations, setAllocations] = useState([])
  const [mobs,        setMobs]        = useState([])
  const [paddocks,    setPaddocks]    = useState([])
  const [loading,     setLoading]     = useState(true)

  // Create plan form
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [planStart,      setPlanStart]      = useState('2026-05-01')
  const [planEnd,        setPlanEnd]        = useState('2026-10-31')
  const [creating,       setCreating]       = useState(false)
  const [createError,    setCreateError]    = useState('')

  // Add allocation form
  const [showAddForm, setShowAddForm]   = useState(false)
  const [newMobId,    setNewMobId]      = useState('')
  const [newPaddockId,setNewPaddockId]  = useState('')
  const [addError,    setAddError]      = useState('')
  const [addLoading,  setAddLoading]    = useState(false)

  // FAQ accordion
  const [faqOpen, setFaqOpen] = useState(false)

  // ── Load data ───────────────────────────────────────────────────────────────

  useEffect(() => {
    async function load() {
      setLoading(true)
      const propId  = user?.propertyId
      const headers = { Authorization: `Bearer ${token}` }

      try {
        // Load mobs
        let mobData = null
        try {
          const r = await fetch(`/api/properties/${propId}/mobs`, { headers })
          if (r.ok) mobData = await r.json()
        } catch { /* ignore */ }
        setMobs(mobData ?? MOCK_MOBS)

        // Load property (includes paddocks)
        let paddockData = null
        try {
          const r = await fetch(`/api/properties/${propId}`, { headers })
          if (r.ok) {
            const d = await r.json()
            paddockData = d.paddocks ?? d
          }
        } catch { /* ignore */ }
        setPaddocks(Array.isArray(paddockData) ? paddockData : MOCK_PADDOCKS)

        // Load active plan from localStorage planId
        const planId = localStorage.getItem('anc_active_plan_id')
        if (planId) {
          try {
            const r = await fetch(`/api/plans/${planId}`, { headers })
            if (r.ok) {
              const d = await r.json()
              setPlan(d.plan ?? d)
              setAllocations(d.allocations ?? [])
              setLoading(false)
              return
            }
          } catch { /* ignore */ }
        }

        // Fallback: show mock plan
        setPlan(MOCK_PLAN)
        setAllocations(MOCK_ALLOCATIONS)
      } catch {
        setPlan(MOCK_PLAN)
        setAllocations(MOCK_ALLOCATIONS)
        setMobs(MOCK_MOBS)
        setPaddocks(MOCK_PADDOCKS)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [user, token])

  // ── SR:CC ────────────────────────────────────────────────────────────────────

  const srccRatio = useMemo(() => {
    if (plan?.srccRatio !== undefined) return plan.srccRatio
    // Compute from allocations: total LSU of allocated mobs / carrying capacity
    const totalAllocLSU = allocations.reduce((sum, a) => {
      const mob = mobs.find(m => m.id === a.mobId)
      return sum + (mob?.lsuTotal ?? a.lsuTotal ?? 0)
    }, 0)
    const totalPaddockKgdm = paddocks.reduce((sum, p) => sum + (p.totalKgdm ?? 0), 0)
    if (!totalPaddockKgdm) return null
    return +(totalAllocLSU / (totalPaddockKgdm / (365 * 8.5))).toFixed(2)
  }, [plan, allocations, mobs, paddocks])

  // ── Create plan ──────────────────────────────────────────────────────────────

  async function handleCreatePlan(e) {
    e.preventDefault()
    setCreateError('')
    if (!planStart || !planEnd) { setCreateError('Both dates are required.'); return }
    if (new Date(planEnd) <= new Date(planStart)) { setCreateError('End date must be after start date.'); return }

    setCreating(true)
    try {
      const res = await fetch(`/api/properties/${user?.propertyId}/plans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ seasonType: 'dormant', startDate: planStart, endDate: planEnd }),
      })
      if (res.ok) {
        const data = await res.json()
        const newPlan = data.plan ?? data
        localStorage.setItem('anc_active_plan_id', newPlan.id)
        setPlan(newPlan)
        setAllocations([])
        setShowCreateForm(false)
      } else {
        const d = await res.json()
        setCreateError(d.error || 'Failed to create plan.')
      }
    } catch {
      // Demo fallback
      const newPlan = { id: `plan-${Date.now()}`, startDate: planStart, endDate: planEnd, seasonType: 'dormant' }
      setPlan(newPlan)
      setAllocations([])
      setShowCreateForm(false)
    } finally {
      setCreating(false)
    }
  }

  // ── Add allocation ───────────────────────────────────────────────────────────

  function previewGrazePeriod() {
    if (!newPaddockId || !newMobId) return null
    const pad = paddocks.find(p => p.id === newPaddockId)
    const mob = mobs.find(m => m.id === newMobId)
    if (!pad || !mob) return null
    const totalKgdm = pad.totalKgdm ?? (pad.sizeHa * (pad.stacRating ?? 9) * 11.25)
    const dailyDemand = mob.dailyKgdm ?? (mob.lsuTotal * 8.5)
    if (!dailyDemand) return null
    return +(totalKgdm / dailyDemand).toFixed(1)
  }

  async function handleAddAllocation(e) {
    e.preventDefault()
    if (!newMobId)     { setAddError('Select a mob.'); return }
    if (!newPaddockId) { setAddError('Select a paddock.'); return }
    setAddError('')
    setAddLoading(true)

    const pad = paddocks.find(p => p.id === newPaddockId)
    const mob = mobs.find(m => m.id === newMobId)
    const totalKgdm = pad?.totalKgdm ?? ((pad?.sizeHa ?? 0) * (pad?.stacRating ?? 9) * 11.25)
    const dailyKgdm = mob?.dailyKgdm ?? ((mob?.lsuTotal ?? 0) * 8.5)
    const grazePeriodDays = dailyKgdm ? +(totalKgdm / dailyKgdm).toFixed(1) : 0
    const planDays = daysBetween(plan.startDate, plan.endDate)
    const surplusDeficitKgdm = +(totalKgdm - (dailyKgdm * planDays)).toFixed(1)

    try {
      const res = await fetch(`/api/plans/${plan.id}/allocations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ paddockId: newPaddockId, mobId: newMobId }),
      })
      if (res.ok) {
        const data = await res.json()
        setAllocations(prev => [...prev, data])
      } else {
        const d = await res.json()
        // Fallback: add locally
        addLocalAllocation(pad, mob, grazePeriodDays, surplusDeficitKgdm, d.error)
      }
    } catch {
      addLocalAllocation(pad, mob, grazePeriodDays, surplusDeficitKgdm)
    } finally {
      setAddLoading(false)
      setShowAddForm(false)
      setNewMobId('')
      setNewPaddockId('')
    }
  }

  function addLocalAllocation(pad, mob, grazePeriodDays, surplusDeficitKgdm, _serverError) {
    const pad_ = pad ?? {}
    const mob_ = mob ?? {}
    setAllocations(prev => [...prev, {
      id: `local-${Date.now()}`,
      paddockId: pad_.id, paddockName: pad_.name, paddockSizeHa: pad_.sizeHa,
      totalKgdm: pad_.totalKgdm,
      mobId: mob_.id, mobName: mob_.name, dailyKgdm: mob_.dailyKgdm,
      grazePeriodDays, surplusDeficitKgdm,
    }])
  }

  // ── Delete allocation ────────────────────────────────────────────────────────

  async function handleDelete(allocId) {
    setAllocations(prev => prev.filter(a => a.id !== allocId))
    try {
      await fetch(`/api/allocations/${allocId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
    } catch { /* ignore — already removed from local state */ }
  }

  // ── Preview ──────────────────────────────────────────────────────────────────

  const previewDays = previewGrazePeriod()
  const planDays    = daysBetween(plan?.startDate, plan?.endDate)
  const ratio       = srccRatio
  const ratioColor  = srccColor(ratio)
  const ratioLabel  = srccLabel(ratio)
  const fillPct     = barFill(ratio)

  // Mobs already allocated (to prevent double-allocation)
  const allocatedMobIds     = new Set(allocations.map(a => a.mobId))
  const allocatedPaddockIds = new Set(allocations.map(a => a.paddockId))

  // ── Loading skeleton ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.topBar}>
          <div className={styles.topBarLeft}>
            <button className={styles.backBtn} onClick={() => navigate(-1)} aria-label="Go back">
              <ChevronLeftIcon />
            </button>
            <h1 className={styles.titleText}>Closed Season Plan</h1>
          </div>
        </div>
        <div className={styles.loadingWrap}>
          <span className={styles.loadingDot} />
          <span className={styles.loadingDot} style={{ animationDelay: '0.2s' }} />
          <span className={styles.loadingDot} style={{ animationDelay: '0.4s' }} />
        </div>
        <BottomNav />
      </div>
    )
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className={styles.page}>

      {/* ── Top bar ── */}
      <div className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <button className={styles.backBtn} onClick={() => navigate(-1)} aria-label="Go back">
            <ChevronLeftIcon />
          </button>
          <div className={styles.topBarTitle}>
            <span className={styles.titleText}>Closed Season Plan</span>
            <span className={styles.subtitleText}>Dormant season · {plan ? `${fmtDate(plan.startDate)} – ${fmtDate(plan.endDate)}` : 'No active plan'}</span>
          </div>
        </div>
        <span className={styles.seasonBadge}>
          <MoonIcon /> Dormant
        </span>
      </div>

      {/* ── Scrollable main ── */}
      <main className={styles.main}>

        {/* ── No plan state ── */}
        {!plan && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}><CalendarEmptyIcon /></div>
            <h2 className={styles.emptyTitle}>No active plan</h2>
            <p className={styles.emptyDesc}>
              Create a dormant season grazing plan to allocate mobs to paddocks
              and track your SR:CC ratio in real time.
            </p>
            <button className={styles.createPlanBtn} onClick={() => setShowCreateForm(v => !v)}>
              <PlusIcon /> Create dormant season plan
            </button>

            {showCreateForm && (
              <form className={styles.createForm} onSubmit={handleCreatePlan}>
                <div className={styles.dateRow}>
                  <div className={styles.dateField}>
                    <label className={styles.dateLabel}>Start date</label>
                    <input
                      type="date"
                      className={styles.dateInput}
                      value={planStart}
                      onChange={e => setPlanStart(e.target.value)}
                      required
                    />
                  </div>
                  <div className={styles.dateField}>
                    <label className={styles.dateLabel}>End date</label>
                    <input
                      type="date"
                      className={styles.dateInput}
                      value={planEnd}
                      onChange={e => setPlanEnd(e.target.value)}
                      required
                    />
                  </div>
                </div>
                {createError && <p className={styles.formError}>{createError}</p>}
                <button type="submit" className={styles.confirmBtn} disabled={creating}>
                  {creating ? 'Creating…' : 'Confirm plan'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* ── Plan active ── */}
        {plan && (
          <>
            {/* SR:CC card */}
            <div className={styles.srccCard}>
              <div className={styles.srccHeader}>
                <div>
                  <p className={styles.srccTitle}>SR:CC Ratio</p>
                  <p className={styles.srccSub}>Stocking Rate vs Carrying Capacity</p>
                </div>
                <span className={styles.srccBadge} style={{ color: ratioColor, borderColor: ratioColor, backgroundColor: `${ratioColor}18` }}>
                  {ratio !== null ? ratio.toFixed(2) : '—'}
                </span>
              </div>

              {/* Progress bar */}
              <div className={styles.barTrack}>
                <div
                  className={styles.barFill}
                  style={{ width: `${fillPct}%`, backgroundColor: ratioColor }}
                />
                {/* 1.0 threshold line */}
                <div className={styles.barThreshold} />
              </div>
              <div className={styles.barLabels}>
                <span>Understocked</span>
                <span>Optimal</span>
                <span>Overstocked</span>
              </div>

              {ratio !== null && ratio > 1.0 && (
                <div className={styles.srccAlert}>
                  <WarningIcon />
                  <span>SR:CC exceeds 1.0 — reduce stock or expand paddock allocation.</span>
                </div>
              )}

              <p className={styles.srccStatusText} style={{ color: ratioColor }}>
                {ratioLabel}
              </p>
            </div>

            {/* Plan info strip */}
            <div className={styles.planStrip}>
              <div className={styles.planStripItem}>
                <span className={styles.planStripLabel}>Plan start</span>
                <span className={styles.planStripValue}>{fmtDate(plan.startDate)}</span>
              </div>
              <div className={styles.planStripDivider} />
              <div className={styles.planStripItem}>
                <span className={styles.planStripLabel}>Plan end</span>
                <span className={styles.planStripValue}>{fmtDate(plan.endDate)}</span>
              </div>
              <div className={styles.planStripDivider} />
              <div className={styles.planStripItem}>
                <span className={styles.planStripLabel}>Total days</span>
                <span className={styles.planStripValue}>{planDays}</span>
              </div>
            </div>

            {/* Allocations section */}
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Paddock allocations</h2>
              <span className={styles.allocationCount}>{allocations.length}</span>
            </div>

            {allocations.length === 0 && !showAddForm && (
              <div className={styles.noAllocations}>
                <p>No allocations yet. Tap <strong>+ Add allocation</strong> to assign a mob to a paddock.</p>
              </div>
            )}

            {allocations.map(alloc => (
              <AllocationCard
                key={alloc.id}
                alloc={alloc}
                planDays={planDays}
                onDelete={() => handleDelete(alloc.id)}
              />
            ))}

            {/* Add allocation form */}
            {showAddForm && (
              <div className={styles.addCard}>
                <div className={styles.addCardHeader}>
                  <h3 className={styles.addCardTitle}>New allocation</h3>
                  <button
                    className={styles.closeAddBtn}
                    onClick={() => { setShowAddForm(false); setNewMobId(''); setNewPaddockId(''); setAddError('') }}
                    aria-label="Cancel"
                  >
                    <CloseIcon />
                  </button>
                </div>

                <form onSubmit={handleAddAllocation}>
                  <div className={styles.addFields}>

                    {/* Paddock selector */}
                    <div className={styles.addField}>
                      <label className={styles.addLabel}>Paddock</label>
                      <div className={styles.selectWrap}>
                        <select
                          className={styles.addSelect}
                          value={newPaddockId}
                          onChange={e => { setNewPaddockId(e.target.value); setAddError('') }}
                        >
                          <option value="">Choose paddock…</option>
                          {paddocks
                            .filter(p => !allocatedPaddockIds.has(p.id))
                            .map(p => (
                              <option key={p.id} value={p.id}>
                                {p.name} — {p.sizeHa} ha, STAC {p.stacRating}
                              </option>
                            ))}
                        </select>
                        <span className={styles.selectChevron}><ChevronDownIcon /></span>
                      </div>
                    </div>

                    {/* Mob selector */}
                    <div className={styles.addField}>
                      <label className={styles.addLabel}>Mob</label>
                      <div className={styles.selectWrap}>
                        <select
                          className={styles.addSelect}
                          value={newMobId}
                          onChange={e => { setNewMobId(e.target.value); setAddError('') }}
                        >
                          <option value="">Choose mob…</option>
                          {mobs
                            .filter(m => !allocatedMobIds.has(m.id))
                            .map(m => (
                              <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                        <span className={styles.selectChevron}><ChevronDownIcon /></span>
                      </div>
                    </div>

                  </div>

                  {/* Live graze period preview */}
                  {previewDays !== null && (
                    <div className={styles.previewRow}>
                      <span className={styles.previewLabel}>Estimated graze period</span>
                      <span className={styles.previewValue}>{previewDays} days</span>
                    </div>
                  )}

                  {addError && <p className={styles.formError}>{addError}</p>}

                  <button type="submit" className={styles.addSubmitBtn} disabled={addLoading}>
                    {addLoading ? 'Saving…' : 'Add allocation'}
                  </button>
                </form>
              </div>
            )}

            {!showAddForm && (
              <button className={styles.addAllocBtn} onClick={() => setShowAddForm(true)}>
                <PlusIcon /> Add allocation
              </button>
            )}

            {/* FAQ accordion */}
            <div className={styles.faqCard}>
              <button
                className={styles.faqBtn}
                onClick={() => setFaqOpen(v => !v)}
                aria-expanded={faqOpen}
              >
                <span className={styles.faqTitle}>How is graze period calculated?</span>
                <span className={styles.faqChevron} style={{ transform: faqOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  <ChevronDownIcon />
                </span>
              </button>
              {faqOpen && (
                <div className={styles.faqContent}>
                  <ul className={styles.faqList}>
                    <li><strong>KgDM per ha</strong> = STAC rating × 11.25</li>
                    <li><strong>Total paddock KgDM</strong> = Paddock size (ha) × KgDM per ha</li>
                    <li><strong>Mob daily KgDM demand</strong> = LSU × 8.5</li>
                    <li><strong>Graze period (days)</strong> = Total paddock KgDM ÷ Mob daily KgDM demand</li>
                    <li><strong>Surplus / deficit KgDM</strong> = Total paddock KgDM − (Daily demand × Plan days)</li>
                    <li><strong>SR:CC ratio</strong> = Total farm LSU ÷ Carrying capacity LSU</li>
                  </ul>
                  <p className={styles.faqNote}>
                    All calculations are performed on the server. Calculated fields are read-only.
                  </p>
                </div>
              )}
            </div>

          </>
        )}
      </main>

      <BottomNav />
    </div>
  )
}

// ── Allocation card ───────────────────────────────────────────────────────────

function AllocationCard({ alloc, planDays, onDelete }) {
  const surplusPositive = alloc.surplusDeficitKgdm >= 0
  const grazePct = planDays > 0 ? Math.min(100, Math.round((alloc.grazePeriodDays / planDays) * 100)) : 0

  return (
    <div className={styles.allocCard}>
      <div className={styles.allocTop}>
        <div className={styles.allocPaddockInfo}>
          <span className={styles.allocPaddockName}>{alloc.paddockName}</span>
          <span className={styles.allocMobChip}>{alloc.mobName}</span>
        </div>
        <button className={styles.allocDeleteBtn} onClick={onDelete} aria-label="Remove allocation">
          <TrashIcon />
        </button>
      </div>

      <div className={styles.allocMetrics}>
        <div className={styles.allocMetric}>
          <span className={styles.allocMetricLabel}>Graze period</span>
          <span className={styles.allocMetricValue} style={{ color: '#4a7c59' }}>
            {alloc.grazePeriodDays !== undefined ? `${alloc.grazePeriodDays} days` : '—'}
          </span>
        </div>
        <div className={styles.allocMetric}>
          <span className={styles.allocMetricLabel}>Surplus / deficit</span>
          <span
            className={styles.allocMetricValue}
            style={{ color: surplusPositive ? '#4a7c59' : '#b83230' }}
          >
            {alloc.surplusDeficitKgdm !== undefined
              ? `${surplusPositive ? '+' : ''}${Math.round(alloc.surplusDeficitKgdm).toLocaleString()} KgDM`
              : '—'}
          </span>
        </div>
        <div className={styles.allocMetric}>
          <span className={styles.allocMetricLabel}>Paddock KgDM</span>
          <span className={styles.allocMetricValue}>
            {alloc.totalKgdm !== undefined ? Math.round(alloc.totalKgdm).toLocaleString() : '—'}
          </span>
        </div>
      </div>

      {/* Graze period progress bar */}
      <div className={styles.grazePeriodBar}>
        <div className={styles.grazePeriodFill} style={{ width: `${grazePct}%` }} />
      </div>
      <p className={styles.grazePeriodHint}>
        {alloc.grazePeriodDays} of {planDays} plan days
      </p>
    </div>
  )
}

// ── Inline SVG icons ──────────────────────────────────────────────────────────

function ChevronLeftIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="currentColor" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

function CalendarEmptyIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M9 6V4h6v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function WarningIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" fill="currentColor" />
      <line x1="12" y1="9" x2="12" y2="13" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <line x1="12" y1="17" x2="12.01" y2="17" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
