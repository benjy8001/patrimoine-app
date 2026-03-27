import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { useAuth } from './hooks/useAuth'
import AppLayout from './components/layout/AppLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import AssetList from './pages/AssetList'
import AssetDetail from './pages/AssetDetail'
import AssetForm from './pages/AssetForm'
import Liabilities from './pages/Liabilities'
import History from './pages/History'
import Income from './pages/Income'
import Reminders from './pages/Reminders'
import Tax from './pages/Tax'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Platforms from './pages/Platforms'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, initialized } = useAuthStore()
  if (!initialized) return <div className="flex items-center justify-center h-screen">Chargement...</div>
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  useAuth()
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="assets" element={<AssetList />} />
        <Route path="assets/new" element={<AssetForm />} />
        <Route path="assets/:id" element={<AssetDetail />} />
        <Route path="assets/:id/edit" element={<AssetForm />} />
        <Route path="platforms" element={<Platforms />} />
        <Route path="liabilities" element={<Liabilities />} />
        <Route path="history" element={<History />} />
        <Route path="income" element={<Income />} />
        <Route path="reminders" element={<Reminders />} />
        <Route path="tax" element={<Tax />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
