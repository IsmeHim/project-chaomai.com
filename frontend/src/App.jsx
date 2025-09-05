import { useState } from 'react'
import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom'

import Navbar from './components/Navbar'
import Home from './components/Home'
import LoginForm from './components/LoginForm'
import RegisterForm from './components/RegisterForm'
import Dashboard from './components/Dashboard'
import ProtectedRoute from './components/ProtectedRoute'
import PublicRoute from './components/PublicRoute'
import Forbidden from './components/Forbidden'

// pages
import PropertyDetail from './pages/PropertyDetail';
import AllProperties from "./pages/AllProperties";
import CategoryListing from './pages/CategoryListing';
import WishlistPage from './pages/WishlistPage';
import SearchPage from './pages/SearchPage';

//test this route this import for test
// import TestPropertyDetail from './pages/TestPropertyDetail';

// admin
import AdminRoute from './components/AdminRoute'
import AdminDashboard from './components/AdminDashboard'

// owner
import BecomeOwner from './components/BecomeOwner'
import OwnerRoute from './components/OwnerRoute'

// ✅ ใช้ Layout กลาง + overview + add page
import OwnerLayout from './components/owner/OwnerLayout'
import OwnerOverview from './components/owner/OwnerOverview'
import AddProperty from './components/AddProperty'
import EditProperty from './components/owner/EditProperty'
import OwnerProperties from './components/owner/OwnerProperties'


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
        {/* public */}
        <Route path="/" element={<Home />} />
        <Route path="/categories/:slug" element={<CategoryListing />} />
        <Route path="/property/:slug" element={<PropertyDetail />} />
        <Route path="/properties" element={<AllProperties />} />
        <Route path="/properties/:id" element={<PropertyDetail />} />
        <Route path="/search" element={<SearchPage />} />
        {/* <Route path="/test-property/:id" element={<TestPropertyDetail />} /> */} {/*this route for test */}
        <Route path="/forbidden" element={<Forbidden />} />

        {/* หน้าหัวใจ */}
        <Route
          path="/wishlist"
          element={
            <ProtectedRoute>
              <WishlistPage />
            </ProtectedRoute>
          }
        />

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

        {/* become owner */}
        <Route
          path="/become-owner"
          element={
            <ProtectedRoute>
              <BecomeOwner setAuth={setAuth} />
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

        {/* ✅ owner ทั้งหมดใช้ OwnerLayout เดียวกัน */}
        <Route
          path="/owner/dashboard"
          element={
            <OwnerRoute>
              <OwnerLayout />
            </OwnerRoute>
          }
        >
          {/* /owner -> overview (แทน owner/dashboard เดิม) */}
          <Route index element={<OwnerOverview />} />

          {/* // ใส่เพจ owner อื่นๆ ตรงนี้ได้ เช่น */}
          <Route path="properties" element={<OwnerProperties />} />
          {/* /owner/properties/new -> AddProperty (ได้ TopBar/Sidebar อัตโนมัติ) */}
          <Route path="properties/new" element={<AddProperty />} />
          {/* ✅ เส้นทางหน้าแก้ไข */}
          <Route path="properties/:id/edit" element={<EditProperty />} />
          {/* <Route path="bookings" element={<OwnerBookings />} />
          <Route path="messages" element={<OwnerMessages />} />
          <Route path="settings" element={<OwnerSettings />} /> */}
          {/* <Route path='/properties/:id' element={<OwnerPropertyDetail />} /> */}
        </Route>

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
