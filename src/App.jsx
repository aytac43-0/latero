import { Routes, Route, Navigate } from "react-router-dom"
import Dashboard from "./components/Dashboard"
import Auth from "./components/Auth"
import ProtectedRoute from "./components/ProtectedRoute"
import AddItem from "./components/AddItem"
import Settings from "./components/Settings"
import ResetPassword from "./components/ResetPassword"
import Pricing from "./components/Pricing"
import AdminDashboard from "./components/AdminDashboard"
import { useAuth } from "./context/AuthContext"

function App() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/auth" element={user ? <Navigate to="/" /> : <Auth />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route
        path="/add"
        element={
          <ProtectedRoute>
            <AddItem />
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />

      <Route
        path="/pricing"
        element={
          <ProtectedRoute>
            <Pricing />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
