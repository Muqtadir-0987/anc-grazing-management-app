import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import styles from './LogEvent.module.css'

// ── Mock fallback data ────────────────────────────────────────────────────────

const MOCK_MOBS = [
  { id: 'mob-1', name: 'North Flats Mob', headCount: 142 },
  { id: 'mob-2', name: 'Hill Country Steers', headCount: 78 },
  { id: 'mob-3', name: 'Replacement Heifers', headCount: 45 },
]

const MOCK_STOCK_CLASSES = [
  'Calves', 'Weaners', 'Cows', 'Bulls', 'Cull Cows',
]

const EVENT_TYPES = [
  { id: 'death',       label: 'Death',      icon: <SkullIcon /> },
  { id: 'purchase',    label: 'Purchase',   icon: <PurchaseIcon /> },
  { id: 'sale',        label: 'Sale',       icon: <SaleIcon /> },
  { id: 'transfer',    label: 'Transfer',   icon: <TransferIcon /> },
  { id: 'vaccination', label: 'Vaccination',icon: <VaccineIcon /> },
  { id: 'treatment',   label: 'Treatment',  icon: <TreatmentIcon /> },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

function loadCache(key) {
  try { return JSON.parse(localStorage.getItem(key)) || null } catch { return null }
}

function loadQueue() {
  return loadCache('anc_offline_queue') || []
}

function saveQueue(q) {
  localStorage.setItem('anc_offline_queue', JSON.stringify(q))
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function LogEvent() {
  const navigate = useNavigate()
  const { user, token } = useAuth()

  // Data from cache or API
  const [mobs, setMobs] = useState([])
  const [stockClasses, setStockClasses] = useState([])

  // Form state
  const [eventType, setEventType]     = useState('vaccination')
  const [mobId, setMobId]             = useState('')
  const [stockClass, setStockClass]   = useState('')
  const [quantity, setQuantity]       = useState(1)
  const [date, setDate]               = useState(todayISO())
  const [notes, setNotes]             = useState('')

  // UI state
  const [loading, setLoading]         = useState(false)
  const [fieldError, setFieldError]   = useState({}) // { mob, stockClass, quantity, date }
  const [successBanner, setSuccessBanner] = useState(false)
  const [isOnline, setIsOnline]       = useState(navigator.onLine)
  const [queueLength, setQueueLength] = useState(loadQueue().length)

  // ── Load mobs + stock classes ───────────────────────────────────────────────

  useEffect(() => {
    const cachedMobs = loadCache('anc_mobs')
    const cachedClasses = loadCache('anc_stock_classes')

    if (cachedMobs && cachedMobs.length > 0) {
      setMobs(cachedMobs)
    } else {
      // Try API
      if (user?.propertyId && token) {
        fetch(`/api/properties/${user.propertyId}/mobs`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then(r => r.ok ? r.json() : null)
          .then(data => {
            if (data) {
              setMobs(data)
              localStorage.setItem('anc_mobs', JSON.stringify(data))
            } else {
              setMobs(MOCK_MOBS)
            }
          })
          .catch(() => setMobs(MOCK_MOBS))
      } else {
        setMobs(MOCK_MOBS)
      }
    }

    if (cachedClasses && cachedClasses.length > 0) {
      setStockClasses(cachedClasses)
    } else {
      if (token) {
        fetch('/api/stock-classes', {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then(r => r.ok ? r.json() : null)
          .then(data => {
            if (data) {
              setStockClasses(data.map(c => c.name || c))
              localStorage.setItem('anc_stock_classes', JSON.stringify(data.map(c => c.name || c)))
            } else {
              setStockClasses(MOCK_STOCK_CLASSES)
            }
          })
          .catch(() => setStockClasses(MOCK_STOCK_CLASSES))
      } else {
        setStockClasses(MOCK_STOCK_CLASSES)
      }
    }
  }, [user, token])

  // ── Online/offline listeners ────────────────────────────────────────────────

  const flushQueue = useCallback(async () => {
    const queue = loadQueue()
    if (queue.length === 0) return
    const authToken = token || localStorage.getItem('anc_auth_token')
    const remaining = []
    for (const event of queue) {
      try {
        const res = await fetch('/api/events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(event),
        })
        if (!res.ok) remaining.push(event)
      } catch {
        remaining.push(event)
      }
    }
    saveQueue(remaining)
    setQueueLength(remaining.length)
  }, [token])

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true)
      flushQueue()
    }
    function handleOffline() {
      setIsOnline(false)
    }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [flushQueue])

  // ── Derived ─────────────────────────────────────────────────────────────────

  const selectedMob = mobs.find(m => m.id === mobId)
  const maxQuantity = selectedMob?.headCount ?? 9999

  // ── Validation ──────────────────────────────────────────────────────────────

  function validate() {
    const errors = {}
    if (!mobId) errors.mob = 'Please select a mob.'
    if (!stockClass) errors.stockClass = 'Please select a stock class.'
    if (!quantity || quantity < 1) errors.quantity = 'Quantity must be at least 1.'
    if (quantity > maxQuantity) errors.quantity = `Cannot exceed ${maxQuantity} total in mob.`
    if (!date) errors.date = 'Please enter a date.'
    return errors
  }

  // ── Submit ───────────────────────────────────────────────────────────────────

  async function handleSubmit(e) {
    e.preventDefault()
    const errors = validate()
    if (Object.keys(errors).length > 0) {
      setFieldError(errors)
      return
    }
    setFieldError({})
    setLoading(true)

    const payload = {
      mobId,
      stockClass,
      eventType,
      quantity: Number(quantity),
      date,
      notes: notes.trim() || undefined,
    }

    if (!isOnline) {
      // Queue offline
      const queue = loadQueue()
      queue.push({ ...payload, _queuedAt: new Date().toISOString() })
      saveQueue(queue)
      setQueueLength(queue.length)
      setLoading(false)
      resetForm()
      setSuccessBanner('queued')
      setTimeout(() => setSuccessBanner(false), 4000)
      return
    }

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (!res.ok) {
        // Server validation error — show next to relevant field
        const msg = data.error || 'Save failed. Please try again.'
        if (msg.toLowerCase().includes('quantity') || msg.toLowerCase().includes('exceed')) {
          setFieldError({ quantity: msg })
        } else {
          setFieldError({ _form: msg })
        }
        return
      }

      resetForm()
      setSuccessBanner('saved')
      setTimeout(() => setSuccessBanner(false), 4000)
    } catch {
      // Network failure — queue it
      const queue = loadQueue()
      queue.push({ ...payload, _queuedAt: new Date().toISOString() })
      saveQueue(queue)
      setQueueLength(queue.length)
      resetForm()
      setSuccessBanner('queued')
      setTimeout(() => setSuccessBanner(false), 4000)
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setMobId('')
    setStockClass('')
    setQuantity(1)
    setDate(todayISO())
    setNotes('')
    setFieldError({})
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className={styles.page}>
      {/* Top bar */}
      <div className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <button
            className={styles.backBtn}
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <ChevronLeftIcon />
          </button>
          <h1 className={styles.titleText}>Log field event</h1>
        </div>
        <span className={styles.speedPill}>&lt;&nbsp;60 sec</span>
      </div>

      {/* Offline queue banner */}
      {queueLength > 0 && (
        <div className={styles.queueBanner}>
          <CloudIcon />
          <span>
            {queueLength} event{queueLength !== 1 ? 's' : ''} queued — will sync when online.
          </span>
        </div>
      )}

      {/* Success banner */}
      {successBanner === 'saved' && (
        <div className={styles.successBanner}>
          <CheckCircleIcon />
          <span>Event saved successfully.</span>
        </div>
      )}
      {successBanner === 'queued' && (
        <div className={styles.queuedBanner}>
          <CloudIcon />
          <span>Saved offline — will sync when signal returns.</span>
        </div>
      )}

      {/* Scrollable content */}
      <main className={styles.main}>
        {/* Event type grid */}
        <section className={styles.section}>
          <p className={styles.sectionLabel}>Event type</p>
          <div className={styles.eventGrid}>
            {EVENT_TYPES.map(({ id, label, icon }) => (
              <button
                key={id}
                type="button"
                className={`${styles.eventTile} ${eventType === id ? styles.eventTileActive : ''}`}
                onClick={() => setEventType(id)}
              >
                <span className={`${styles.eventIconCircle} ${eventType === id ? styles.eventIconCircleActive : ''}`}>
                  {icon}
                </span>
                <span className={`${styles.eventLabel} ${eventType === id ? styles.eventLabelActive : ''}`}>
                  {label}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Form */}
        <form className={styles.form} onSubmit={handleSubmit} noValidate>

          {/* Form-level error */}
          {fieldError._form && (
            <p className={styles.formError}>{fieldError._form}</p>
          )}

          {/* Mob selector */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="mob">
              Select mob
            </label>
            <div className={styles.selectWrap}>
              <select
                id="mob"
                className={`${styles.select} ${fieldError.mob ? styles.selectError : ''}`}
                value={mobId}
                onChange={e => { setMobId(e.target.value); setFieldError(prev => ({ ...prev, mob: undefined })) }}
              >
                <option value="">Choose mob…</option>
                {mobs.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
              <span className={styles.selectChevron}><ChevronDownIcon /></span>
            </div>
            {selectedMob && (
              <p className={styles.fieldHint}>Current head count: {selectedMob.headCount.toLocaleString()}</p>
            )}
            {fieldError.mob && <p className={styles.fieldError}>{fieldError.mob}</p>}
          </div>

          {/* Stock class selector */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="stockClass">
              Stock class
            </label>
            <div className={styles.selectWrap}>
              <select
                id="stockClass"
                className={`${styles.select} ${fieldError.stockClass ? styles.selectError : ''}`}
                value={stockClass}
                onChange={e => { setStockClass(e.target.value); setFieldError(prev => ({ ...prev, stockClass: undefined })) }}
              >
                <option value="">Choose class…</option>
                {stockClasses.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <span className={styles.selectChevron}><ChevronDownIcon /></span>
            </div>
            {fieldError.stockClass && <p className={styles.fieldError}>{fieldError.stockClass}</p>}
          </div>

          {/* Quantity stepper */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="quantity">
              Quantity
            </label>
            <div className={styles.stepper}>
              <button
                type="button"
                className={styles.stepperBtn}
                onClick={() => setQuantity(q => Math.max(1, Number(q) - 1))}
                aria-label="Decrease quantity"
              >
                <MinusIcon />
              </button>
              <input
                id="quantity"
                type="number"
                inputMode="numeric"
                className={`${styles.stepperInput} ${fieldError.quantity ? styles.stepperInputError : ''}`}
                value={quantity}
                min={1}
                onChange={e => {
                  setQuantity(e.target.value)
                  setFieldError(prev => ({ ...prev, quantity: undefined }))
                }}
              />
              <button
                type="button"
                className={styles.stepperBtn}
                onClick={() => setQuantity(q => Number(q) + 1)}
                aria-label="Increase quantity"
              >
                <PlusIcon />
              </button>
            </div>
            {fieldError.quantity ? (
              <p className={`${styles.fieldHint} ${styles.fieldHintError}`}>
                <WarningIcon /> {fieldError.quantity}
              </p>
            ) : selectedMob ? (
              <p className={styles.fieldHint}>
                <WarningSmallIcon /> Cannot exceed {maxQuantity.toLocaleString()} total in mob.
              </p>
            ) : null}
          </div>

          {/* Date of event */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="date">
              Date of event
            </label>
            <div className={styles.dateWrap}>
              <input
                id="date"
                type="date"
                className={`${styles.dateInput} ${fieldError.date ? styles.selectError : ''}`}
                value={date}
                onChange={e => { setDate(e.target.value); setFieldError(prev => ({ ...prev, date: undefined })) }}
              />
              <span className={styles.dateIcon}><CalendarIcon /></span>
            </div>
            {fieldError.date && <p className={styles.fieldError}>{fieldError.date}</p>}
          </div>

          {/* Notes */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="notes">
              Notes <span className={styles.optional}>(Optional)</span>
            </label>
            <textarea
              id="notes"
              className={styles.textarea}
              rows={3}
              placeholder="Add treatment details, dose per kg, etc…"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          {/* Save button */}
          <button
            type="submit"
            className={styles.saveBtn}
            disabled={loading}
          >
            <CheckIcon />
            {loading ? 'Saving…' : 'Save event'}
          </button>

          {/* Offline notice */}
          <p className={styles.offlineNote}>
            <CloudSmallIcon />
            <em>Saved events sync automatically when online.</em>
          </p>

        </form>
      </main>
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

function CloudIcon() {
  return (
    <svg width="18" height="14" viewBox="0 0 24 18" fill="none" aria-hidden="true">
      <path d="M19 18H6a5 5 0 0 1-.5-9.98A7 7 0 1 1 19 18z" fill="currentColor" />
    </svg>
  )
}

function CloudSmallIcon() {
  return (
    <svg width="14" height="11" viewBox="0 0 24 18" fill="none" aria-hidden="true">
      <path d="M19 18H6a5 5 0 0 1-.5-9.98A7 7 0 1 1 19 18z" fill="currentColor" />
    </svg>
  )
}

function CheckCircleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <polyline points="22 4 12 14.01 9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function MinusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

function WarningIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" fill="currentColor" />
      <line x1="12" y1="9" x2="12" y2="13" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <line x1="12" y1="17" x2="12.01" y2="17" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function WarningSmallIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" fill="#705c30" />
      <line x1="12" y1="9" x2="12" y2="13" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <line x1="12" y1="17" x2="12.01" y2="17" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

// ── Event type icons ──────────────────────────────────────────────────────────

function SkullIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2C7.03 2 3 6.03 3 11c0 3.1 1.56 5.83 3.94 7.5V21h2.06v-1h2v1h2v-1h2v1h2.06v-2.5C19.44 16.83 21 14.1 21 11c0-4.97-4.03-9-9-9z" fill="currentColor" />
      <circle cx="9" cy="11" r="1.5" fill="white" />
      <circle cx="15" cy="11" r="1.5" fill="white" />
      <path d="M10 17h4" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function PurchaseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" fill="currentColor" />
    </svg>
  )
}

function SaleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z" fill="currentColor" />
    </svg>
  )
}

function TransferIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7.5 21H2V9h5.5v12zm7.25-18h-5.5v18h5.5V3zM22 11h-5.5v10H22V11z" fill="currentColor" />
    </svg>
  )
}

function VaccineIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6.15 8.91l5.66-5.66 1.06 1.06-1.06 1.06 3.54 3.54 1.06-1.06 1.06 1.06-5.66 5.66-1.06-1.06 1.06-1.06L9.27 9.97l-1.06 1.06L7.15 9.97l1.06-1.06-1.06-1z" fill="currentColor" />
      <path d="M5 20l4-4-1.5-1.5L3.5 18.5 5 20z" fill="currentColor" />
      <path d="M11.5 16.5l2-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M14 14l2-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function TreatmentIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z" fill="currentColor" />
    </svg>
  )
}
