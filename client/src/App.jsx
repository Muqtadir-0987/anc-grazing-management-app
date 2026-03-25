import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Setup from './pages/Setup'

// Placeholder pages — to be replaced screen by screen
const Placeholder = ({ name }) => (
  <div style={{ padding: '120px 24px 100px', fontFamily: 'sans-serif', color: '#4a4e4a' }}>
    <h2>{name}</h2>
    <p>Coming soon.</p>
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
