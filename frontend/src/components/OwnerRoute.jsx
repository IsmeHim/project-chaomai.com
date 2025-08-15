import React from 'react'
import { Navigate } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'

export default function OwnerRoute({ children }) {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/login" />

  try {
    const d = jwtDecode(token)
    const now = Date.now() / 1000
    if (d.exp <= now) throw new Error('expired')
    if (d.role !== 'owner') return <Navigate to="/" />
    return children
  } catch {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    return <Navigate to="/login" />
  }
}
