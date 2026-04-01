import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import styles from './Setup.module.css'

const STAC_OPTIONS = [3, 6, 9, 12]
// KgDM/ha = STAC × 11.25
const kgdmPerHa = (stac) => stac * 11.25

const STEPS = [
  { number: 1, label: 'Property details' },
  { number: 2, label: 'Paddocks' },
  { number: 3, label: 'Mobs and classes' },
]

const STOCK_CLASSES = ['Calves', 'Weaners', 'Cows', 'Bulls', 'Cull Cows']

// ── Empty form state ──
const EMPTY_FORM = { name: '', sizeHa: '', stacRating: null }

function loadPaddocks() {
  try {
    const stored = localStorage.getItem('anc_demo_paddocks')
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function savePaddocksToStorage(paddocks) {
  localStorage.setItem('anc_demo_paddocks', JSON.stringify(paddocks))
}

export default function Setup() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState(2)
  const [paddocks, setPaddocks] = useState(() => loadPaddocks())
  const [showAddForm, setShowAddForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [formErrors, setFormErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState('')

  // Persist paddocks to localStorage whenever they change
  useEffect(() => {
    savePaddocksToStorage(paddocks)
  }, [paddocks])

  // ── Form validation ──
  function validate() {
    const errors = {}
    if (!form.name.trim()) errors.name = 'Paddock name is required.'
    if (!form.sizeHa || isNaN(Number(form.sizeHa)) || Number(form.sizeHa) <= 0)
      errors.sizeHa = 'Enter a valid size greater than 0.'
    if (!form.stacRating) errors.stacRating = 'Select a STAC rating.'
    return errors
  }

  // ── Save paddock (add or update) — DEMO MODE: local state only ──
  function handleSave() {
    const errors = validate()
    if (Object.keys(errors).length) {
      setFormErrors(errors)
      return
    }
    setFormErrors({})
    setSaving(true)
    setServerError('')

    const payload = {
      name: form.name.trim(),
      sizeHa: Number(form.sizeHa),
      stacRating: form.stacRating,
    }

    if (editingId) {
      setPaddocks((prev) =>
        prev.map((p) => (p.id === editingId ? { ...p, ...payload } : p))
      )
    } else {
      const newPaddock = { id: `local-${Date.now()}`, ...payload }
      setPaddocks((prev) => [...prev, newPaddock])
    }
    setSaving(false)
    cancelForm()
  }

  function cancelForm() {
    setForm(EMPTY_FORM)
    setFormErrors({})
    setEditingId(null)
    setShowAddForm(false)
    setServerError('')
  }

  function startEdit(paddock) {
    setForm({
      name: paddock.name,
      sizeHa: String(paddock.sizeHa),
      stacRating: paddock.stacRating,
    })
    setEditingId(paddock.id)
    setShowAddForm(true)
    setFormErrors({})
  }

  function handleDelete(id) {
    if (!window.confirm('Delete this paddock?')) return
    setPaddocks((prev) => prev.filter((p) => p.id !== id))
  }

  function handleContinue() {
    if (step === 2) setStep(3)
    else navigate('/dashboard')
  }

  function handleBack() {
    if (step === 2) setStep(1)
    else if (step === 3) setStep(2)
    else navigate('/dashboard')
  }

  return (
    <div className={styles.page}>
      {/* ── Top app bar ── */}
      <header className={styles.topBar}>
        <div className={styles.topBarBrand}>
          <span className={styles.brandIcon} aria-hidden="true">
            <LeafIconSmall />
          </span>
          <span className={styles.brandName}>ANC Grazing</span>
        </div>
        <button className={styles.iconBtn} aria-label="Notifications">
          <BellIcon />
        </button>
      </header>

      {/* ── Scrollable content ── */}
      <main className={styles.main}>
        {/* Stepper */}
        <div className={styles.stepper}>
          {STEPS.map((s, i) => {
            const isComplete = s.number < step
            const isActive = s.number === step
            return (
              <div key={s.number} className={styles.stepGroup}>
                <div
                  className={`${styles.stepItem} ${isActive ? styles.stepActive : ''} ${!isActive && !isComplete ? styles.stepInactive : ''}`}
                >
                  <div className={`${styles.stepCircle} ${isComplete ? styles.stepCircleDone : ''} ${isActive ? styles.stepCircleActive : ''} ${!isComplete && !isActive ? styles.stepCircleInactive : ''}`}>
                    {isComplete ? <CheckIcon /> : <span>{s.number}</span>}
                  </div>
                  <span className={styles.stepLabel}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`${styles.stepDivider} ${isComplete ? styles.stepDividerDone : ''}`} />
                )}
              </div>
            )
          })}
        </div>

        {/* ── Step 2: Paddocks ── */}
        <div className={step === 2 ? undefined : styles.dimmed}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Your paddocks</h2>
            <button
              className={styles.addBtn}
              onClick={() => {
                setShowAddForm(true)
                setEditingId(null)
                setForm(EMPTY_FORM)
              }}
              disabled={step !== 2}
            >
              <span aria-hidden="true">+</span> Add paddock
            </button>
          </div>

          <div className={styles.paddockList}>
            {paddocks.map((paddock) => (
              <PaddockCard
                key={paddock.id}
                paddock={paddock}
                onEdit={() => startEdit(paddock)}
                onDelete={() => handleDelete(paddock.id)}
              />
            ))}

            {/* Inline add / edit form */}
            {showAddForm && (
              <div className={styles.addForm}>
                <div className={styles.formGrid}>
                  {/* Paddock name */}
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} htmlFor="paddock-name">
                      Paddock Name
                    </label>
                    <input
                      id="paddock-name"
                      className={`${styles.fieldInput} ${formErrors.name ? styles.fieldInputError : ''}`}
                      placeholder="e.g. River Flats"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    />
                    {formErrors.name && <p className={styles.fieldError}>{formErrors.name}</p>}
                  </div>

                  {/* Size */}
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} htmlFor="paddock-size">
                      Size (ha)
                    </label>
                    <input
                      id="paddock-size"
                      type="number"
                      min="0"
                      step="0.1"
                      className={`${styles.fieldInput} ${formErrors.sizeHa ? styles.fieldInputError : ''}`}
                      placeholder="0.0"
                      value={form.sizeHa}
                      onChange={(e) => setForm((f) => ({ ...f, sizeHa: e.target.value }))}
                    />
                    {formErrors.sizeHa && <p className={styles.fieldError}>{formErrors.sizeHa}</p>}
                  </div>
                </div>

                {/* STAC rating */}
                <div className={styles.stacGroup}>
                  <span className={styles.fieldLabel}>STAC Rating</span>
                  <div className={styles.stacBtns}>
                    {STAC_OPTIONS.map((val) => (
                      <button
                        key={val}
                        type="button"
                        className={`${styles.stacBtn} ${form.stacRating === val ? styles.stacBtnActive : ''}`}
                        onClick={() => setForm((f) => ({ ...f, stacRating: val }))}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                  {formErrors.stacRating && (
                    <p className={styles.fieldError}>{formErrors.stacRating}</p>
                  )}
                </div>

                {serverError && <p className={styles.serverError}>{serverError}</p>}

                {/* Form actions */}
                <div className={styles.formActions}>
                  <button className={styles.cancelBtn} onClick={cancelForm}>
                    Cancel
                  </button>
                  <button
                    className={styles.savePaddockBtn}
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? 'Saving…' : 'Save Paddock'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Step 3 preview (dimmed) ── */}
        <div className={`${styles.stepPreview} ${step >= 3 ? '' : styles.dimmed}`}>
          <div className={styles.stepPreviewDivider} />
          <h2 className={styles.sectionTitle}>Mobs and classes</h2>
          {step === 3 ? (
            <MobsForm />
          ) : (
            <div className={styles.previewFields}>
              <div className={styles.previewField}>
                <span className={styles.fieldLabel}>Mob Name</span>
                <div className={styles.previewInput}>Enter name</div>
              </div>
              <div className={styles.previewField}>
                <span className={styles.fieldLabel}>Stock Class</span>
                <div className={styles.chipRow}>
                  {STOCK_CLASSES.map((c) => (
                    <span key={c} className={styles.chip}>{c}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── Sticky footer ── */}
      <footer className={styles.footer}>
        <button className={styles.backBtn} onClick={handleBack}>
          Back
        </button>
        <button className={styles.continueBtn} onClick={handleContinue}>
          Continue
        </button>
      </footer>
    </div>
  )
}

// ── Paddock card (existing paddock) ──
function PaddockCard({ paddock, onEdit, onDelete }) {
  const calculated = kgdmPerHa(paddock.stacRating)

  return (
    <div className={styles.paddockCard}>
      <div className={styles.paddockCardTop}>
        <div>
          <p className={styles.paddockName}>{paddock.name}</p>
          <p className={styles.paddockSize}>Size: {paddock.sizeHa} ha</p>
        </div>
        <div className={styles.paddockActions}>
          <button className={styles.iconBtn} onClick={onEdit} aria-label="Edit paddock">
            <PencilIcon />
          </button>
          <button className={styles.iconBtn} onClick={onDelete} aria-label="Delete paddock">
            <TrashIcon />
          </button>
        </div>
      </div>

      <div className={styles.paddockCardBottom}>
        <div className={styles.stacReadRow}>
          <span className={styles.fieldLabel}>STAC Rating</span>
          <div className={styles.stacPills}>
            {STAC_OPTIONS.map((val) => (
              <span
                key={val}
                className={`${styles.stacPill} ${paddock.stacRating === val ? styles.stacPillActive : ''}`}
              >
                {val}
              </span>
            ))}
          </div>
        </div>

        <div className={styles.calculatedBox}>
          <span className={styles.calculatedLabel}>Calculated</span>
          <p className={styles.calculatedValue}>
            <span className={styles.calculatedNumber}>{calculated.toFixed(2)}</span>
            <span className={styles.calculatedUnit}> KgDM/ha</span>
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Mobs form (step 3) — DEMO MODE: local state only ──
function MobsForm() {
  const [mobName, setMobName] = useState('')
  const [selectedClasses, setSelectedClasses] = useState([])
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  function toggleClass(cls) {
    setSelectedClasses((prev) =>
      prev.includes(cls) ? prev.filter((c) => c !== cls) : [...prev, cls]
    )
  }

  function handleSaveMob() {
    if (!mobName.trim()) {
      setError('Mob name is required.')
      return
    }
    setError('')
    setMobName('')
    setSelectedClasses([])
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className={styles.mobsForm}>
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel} htmlFor="mob-name">Mob Name</label>
        <input
          id="mob-name"
          className={styles.fieldInput}
          placeholder="Enter name"
          value={mobName}
          onChange={(e) => setMobName(e.target.value)}
        />
      </div>
      <div className={styles.fieldGroup}>
        <span className={styles.fieldLabel}>Stock Class</span>
        <div className={styles.chipRow}>
          {STOCK_CLASSES.map((cls) => (
            <button
              key={cls}
              type="button"
              className={`${styles.chip} ${selectedClasses.includes(cls) ? styles.chipActive : ''}`}
              onClick={() => toggleClass(cls)}
            >
              {cls}
            </button>
          ))}
        </div>
      </div>
      {error && <p className={styles.fieldError}>{error}</p>}
      {saved && <p className={styles.successMsg}>Mob saved!</p>}
      <button className={styles.savePaddockBtn} onClick={handleSaveMob}>
        Save Mob
      </button>
    </div>
  )
}

// ── Icons ──

function LeafIconSmall() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2-8 2 1-3 5-3 5-3H17z" fill="currentColor" />
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

function CheckIcon() {
  return (
    <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
      <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PencilIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="16" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 19c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor" />
    </svg>
  )
}
