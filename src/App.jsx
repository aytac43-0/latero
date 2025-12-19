import { Routes, Route, Navigate } from "react-router-dom"
import Dashboard from "./components/Dashboard"
import Auth from "./components/Auth"
import ProtectedRoute from "./components/ProtectedRoute"
import AddItem from "./components/AddItem"
import { useAuth } from "./context/AuthContext"

function App() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/auth" element={user ? <Navigate to="/" /> : <Auth />} />

      <Route
        path="/add"
        element={
          <ProtectedRoute>
            <AddItem />
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
    </Routes>
  )
}

export default App
