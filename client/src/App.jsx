import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Setup from './pages/Setup'
import StockFlow from './pages/StockFlow'
import FeedDemand from './pages/FeedDemand'
import Reports from './pages/Reports'
import LogEvent from './pages/LogEvent'
import ClosedPlan from './pages/ClosedPlan'
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
      <Route path="/log-event" element={<LogEvent />} />
      <Route path="/stock-flow" element={<StockFlow />} />
      <Route path="/feed-demand" element={<FeedDemand />} />
      <Route path="/closed-plan" element={<ClosedPlan />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/admin/properties" element={<ComingSoon name="All Properties (Admin)" />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
