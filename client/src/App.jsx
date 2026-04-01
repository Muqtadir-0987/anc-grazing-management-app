import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Setup from './pages/Setup'
import BottomNav from './components/BottomNav'

const ComingSoon = ({ name }) => (
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
      <Route path="/setup" element={<Setup />} />
      <Route path="/log-event" element={<ComingSoon name="Field Event Log" />} />
      <Route path="/stock-flow" element={<ComingSoon name="Stock Flow Planner" />} />
      <Route path="/feed-demand" element={<ComingSoon name="Feed Demand Summary" />} />
      <Route path="/closed-plan" element={<ComingSoon name="Closed Season Grazing Plan" />} />
      <Route path="/reports" element={<ComingSoon name="Reports" />} />
      <Route path="/admin/properties" element={<ComingSoon name="All Properties (Admin)" />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
