import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import DatasetsPage from './pages/DatasetsPage'
import TrainPage from './pages/TrainPage'
import PredictPage from './pages/PredictPage'
import AnalyticsPage from './pages/AnalyticsPage'

function PrivateRoute({ children }) {
  const { token } = useAuth()
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index               element={<DashboardPage />} />
          <Route path="datasets"     element={<DatasetsPage />} />
          <Route path="train"        element={<TrainPage />} />
          <Route path="predict"      element={<PredictPage />} />
          <Route path="analytics"    element={<AnalyticsPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
