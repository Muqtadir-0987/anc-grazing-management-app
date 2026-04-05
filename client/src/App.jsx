import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Setup from './pages/Setup'
import BottomNav from './components/BottomNav'

// Placeholder pages — to be replaced screen by screen
const Placeholder = ({ name }) => (
  <div style={{ paddingTop: 100, paddingBottom: 100, paddingLeft: 24, paddingRight: 24, fontFamily: 'var(--font-body)', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
    <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-primary)', marginBottom: 8 }}>{name}</h2>
    <p>Coming in the next sprint.</p>
    <BottomNav />
  </div>
)

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/log-event" element={<Placeholder name="Field Event Log" />} />
      <Route path="/stock-flow" element={<Placeholder name="Stock Flow Planner" />} />
      <Route path="/feed-demand" element={<Placeholder name="Feed Demand Summary" />} />
      <Route path="/closed-plan" element={<Placeholder name="Closed Season Grazing Plan" />} />
      <Route path="/reports" element={<Placeholder name="Reports" />} />
      <Route path="/setup" element={<Setup />} />
      <Route path="/admin/properties" element={<Placeholder name="All Properties (Admin)" />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
