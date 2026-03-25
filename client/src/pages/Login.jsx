import { useState } from 'react'
import styles from './Login.module.css'
import logoIcon from '../assets/logo-icon.svg'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Sign in failed. Please try again.')
        return
      }

      localStorage.setItem('anc_auth_token', data.token)
      window.location.href = '/dashboard'
    } catch {
      setError('Unable to connect. Please check your internet connection.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      {/* Green hero header */}
      <div className={styles.hero}>
        <div className={styles.logoWrap}>
          <div className={styles.logoIconWrap}>
            <img src={logoIcon} alt="ANC logo" className={styles.logoIcon} />
          </div>
          <h1 className={styles.appName}>ANC Grazing</h1>
          <p className={styles.orgName}>Australian Natural Capital</p>
        </div>
        <div className={styles.heroCurve} />
      </div>

      {/* Login card */}
      <div className={styles.card}>
        <div className={styles.cardInner}>
          <h2 className={styles.signInHeading}>Sign in</h2>

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div className={styles.fieldGroup}>
              <label htmlFor="email" className={styles.label}>
                Email address
              </label>
              <input
                id="email"
                type="email"
                className={styles.input}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            {/* Password */}
            <div className={styles.fieldGroup}>
              <div className={styles.passwordLabelRow}>
                <label htmlFor="password" className={styles.label}>
                  Password
                </label>
                <button type="button" className={styles.forgotLink}>
                  Forgot?
                </button>
              </div>
              <div className={styles.passwordWrap}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className={styles.input}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className={styles.togglePassword}
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOffIcon />
                  ) : (
                    <EyeIcon />
                  )}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span className={styles.checkboxLabel}>Keep me logged in</span>
            </label>

            {/* Error message */}
            {error && <p className={styles.errorMessage}>{error}</p>}

            {/* Submit */}
            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {/* Footer */}
          <div className={styles.footer}>
            <p className={styles.footerText}>
              Don't have an account?<br />
              Contact your{' '}
              <span className={styles.footerLink}>ANC advisor</span>.
            </p>

            <div className={styles.footerDivider}>
              <div className={styles.footerIcons}>
                <LeafIcon />
                <MountainIcon />
                <TractorIcon />
              </div>
              <p className={styles.footerTagline}>Regenerative Management System</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Inline SVG icons — no icon library dependency needed

function EyeIcon() {
  return (
    <svg width="20" height="14" viewBox="0 0 20 14" fill="none" aria-hidden="true">
      <path d="M10 0C5.5 0 1.73 2.89 0 7c1.73 4.11 5.5 7 10 7s8.27-2.89 10-7c-1.73-4.11-5.5-7-10-7zm0 11.67A4.67 4.67 0 1 1 10 2.33a4.67 4.67 0 0 1 0 9.34zm0-7.47a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6z" fill="currentColor" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg width="20" height="18" viewBox="0 0 20 18" fill="none" aria-hidden="true">
      <path d="M10 4.2c2.58 0 4.67 2.09 4.67 4.67 0 .6-.12 1.17-.32 1.7l2.73 2.73A11.1 11.1 0 0 0 20 8.87C18.27 4.76 14.5 1.87 10 1.87c-1.2 0-2.34.21-3.41.59l2.02 2.02c.45-.18.9-.28 1.39-.28zM1.4 0 0 1.4l2.35 2.35A11.08 11.08 0 0 0 0 8.87c1.73 4.11 5.5 7 10 7 1.41 0 2.76-.28 4-.77l2.9 2.9 1.4-1.4L1.4 0zM5.8 4.4l1.58 1.58A4.57 4.57 0 0 0 7 7.2a4.67 4.67 0 0 0 6.2 4.42l1.38 1.38c-.77.33-1.6.53-2.58.53A4.67 4.67 0 0 1 5.33 8.87c0-.98.3-1.88.8-2.63L5.8 4.4z" fill="currentColor" />
    </svg>
  )
}

function LeafIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2-8 2 1-3 5-3 5-3H17z" fill="currentColor" />
    </svg>
  )
}

function MountainIcon() {
  return (
    <svg width="22" height="12" viewBox="0 0 24 14" fill="none" aria-hidden="true">
      <path d="M14 6l-3.75 5h7.5L14 6zm-7 8l5-7.5L7 14H2L7 6l3 4.5" fill="currentColor" />
    </svg>
  )
}

function TractorIcon() {
  return (
    <svg width="22" height="17" viewBox="0 0 24 20" fill="none" aria-hidden="true">
      <path d="M5 13a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 6a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm13-3a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm0 4a1 1 0 1 1 0-2 1 1 0 0 1 0 2zM2 9V3h8l4 6H2zm2-2h7.5L9 4H4v3zm14.5 1H16V5h-2V3h2.5A1.5 1.5 0 0 1 18 4.5V8h1.5a1.5 1.5 0 0 1 1.5 1.5V13h-2v-3.5A.5.5 0 0 0 18.5 9z" fill="currentColor" />
    </svg>
  )
}
