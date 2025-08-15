import React from 'react'
import { Navigate } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'

function AdminRoute({ children }) {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/" replace />

  try {
    const decoded = jwtDecode(token)
    const now = Date.now() / 1000
    if (decoded.exp <= now) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      return <Navigate to="/" />
    }
    if (decoded.role !== 'admin') {
      return <Navigate to="/" /> // หรือไปหน้า /forbidden ก็ได้
    }
    return children
  } catch {
    return <Navigate to="/" />
  }
}

export default AdminRoute
