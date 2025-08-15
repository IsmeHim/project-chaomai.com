import React from 'react'
import { Navigate } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'

function PublicRoute({ children }) {
  const token = localStorage.getItem('token')
  if (!token) return children

  try {
    const d = jwtDecode(token)
    const now = Date.now() / 1000
    if (d.exp <= now) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      return children
    }
    // ถ้ามี role แล้วส่งไปที่เหมาะสม
    if (d.role === 'admin') return <Navigate to="/admin/dashboard" />
    if (d.role === 'owner')  return <Navigate to="/owner/dashboard" />  // 👈 owner
    return <Navigate to="/" />
  } catch {
    return children
  }
}

export default PublicRoute
