import { useState, useEffect } from 'react'

function parseToken(token) {
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    // Reject expired tokens
    if (payload.exp && payload.exp * 1000 < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

export function useAuth() {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('anc_auth_token')
    return parseToken(token)
  })

  const token = localStorage.getItem('anc_auth_token')

  function login(newToken) {
    localStorage.setItem('anc_auth_token', newToken)
    setUser(parseToken(newToken))
  }

  function logout() {
    localStorage.removeItem('anc_auth_token')
    localStorage.removeItem('anc_mobs')
    localStorage.removeItem('anc_stock_classes')
    localStorage.removeItem('anc_event_types')
    localStorage.removeItem('anc_offline_queue')
    setUser(null)
  }

  function isAdmin() {
    return user?.role === 'admin'
  }

  return { user, token, login, logout, isAdmin }
}
