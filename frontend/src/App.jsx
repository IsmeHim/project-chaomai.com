import { useState } from 'react'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom'

// Components
import Navbar from './components/Navbar'
import Home from './components/Home'
import LoginForm from './components/LoginForm'
import RegisterForm from './components/RegisterForm'
import Dashboard from './components/Dashboard'
import ProtectedRoute from './components/ProtectedRoute'
import PublicRoute from './components/PublicRoute'
// admin
import AdminRoute from './components/AdminRoute'
import AdminDashboard from './components/AdminDashboard'
// owner
import OwnerRoute from './components/OwnerRoute'
import OwnerDashboard from './components/OwnerDashboard'

function AppInner() {
  const [isAuth, setAuth] = useState(!!localStorage.getItem('token'))
  const location = useLocation()

  // ซ่อน Navbar เมื่ออยู่ใน /admin/* หรือ /owner/*
  const hideNavbar =
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/owner') ||
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname.startsWith('/forgot')

  return (
    <>
      {!hideNavbar && <Navbar isAuth={isAuth} setAuth={setAuth} />}

      <Routes>
        <Route path="/" element={<Home />} />

        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginForm setAuth={setAuth} />
            </PublicRoute>
          }
        />

        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterForm />
            </PublicRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard setAuth={setAuth} />
            </ProtectedRoute>
          }
        />

        {/* admin */}
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <AdminDashboard onLogout={() => setAuth(false)} />
            </AdminRoute>
          }
        />

        {/* owner */}
        <Route
          path="/owner/dashboard"
          element={
            <OwnerRoute>
              <OwnerDashboard />
            </OwnerRoute>
          }
        />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <Router>
      <AppInner />
    </Router>
  )
}
