import { useState, useEffect } from 'react'
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
import OwnerProfile from './pages/OwnerProfile';
import UserBookings from './pages/UserBookings';


//test this route this import for test
// import TestPropertyDetail from './pages/TestPropertyDetail';

// admin
// App.jsx (ส่วน import)
import AdminRoute from './components/AdminRoute'
import AdminLayout from './components/admin/AdminLayout'
import DashboardHome from './components/admin/DashboardHome'
import ApprovalsPage from './components/admin/ApprovalsPage'
import CategoriesManager from './components/admin/CategoriesManager'
import OwnersManager from './components/admin/OwnersManager'
import UsersManager from './components/admin/UsersManager'
import AdminListings from './components/admin/AdminListings' // ✅ นำเข้า AdminListings
import AdminBookings from './components/admin/AdminBookings'  // ✅ ใหม่
import AdminSettings from './components/admin/AdminSettings' // ✅ ใหม่: หน้าตั้งค่า
import AdminReports from './components/admin/AdminReports'; // ✅ ใหม่


// owner
import BecomeOwner from './components/BecomeOwner'
import OwnerRoute from './components/OwnerRoute'

// ✅ ใช้ Layout กลาง + overview + add page
import OwnerLayout from './components/owner/OwnerLayout'
import OwnerOverview from './components/owner/OwnerOverview'
import AddProperty from './components/AddProperty'
import EditProperty from './components/owner/EditProperty'
import OwnerProperties from './components/owner/OwnerProperties'
import OwnerSettings from './components/owner/OwnerSettings';
import OwnerBookings from './components/owner/OwnerBookings';

//UI alert
import { Toaster } from "sonner";


function AppInner() {
  const [isAuth, setAuth] = useState(!!localStorage.getItem('token'))
  const location = useLocation()

  // ซ่อน Navbar เมื่ออยู่ใน /admin/* หรือ /owner/*
  // const hideNavbar =
  //   location.pathname.startsWith('/admin') ||
  //   location.pathname.startsWith('/owner') ||
  //   location.pathname === '/login' ||
  //   location.pathname === '/register' ||
  //   location.pathname.startsWith('/forgot')
  const pathname = location.pathname;

  // ซ่อนเฉพาะ /admin/* และ /owner/* เท่านั้น (ไม่ชน /owners/*)
  const isAdminArea = /^\/admin(\/|$)/.test(pathname);
  const isOwnerArea = /^\/owner(\/|$)/.test(pathname);
  const isAuthPages = ['/login', '/register'].includes(pathname) || pathname.startsWith('/forgot');

  const hideNavbar = isAdminArea || isOwnerArea || isAuthPages;

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
        <Route path="/owners/:slug" element={<OwnerProfile />} />

        {/* หน้าหัวใจ */}
        <Route
          path="/wishlist"
          element={
            <ProtectedRoute>
              <WishlistPage />
            </ProtectedRoute>
          }
        />

        {/* ✅ หน้าเช่าของฉัน */}
        <Route
          path="/bookings"
          element={
            <ProtectedRoute>
              <UserBookings />
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

        {/* admin ไม่ใช้แล้วอันนี้*/}
        {/* <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <AdminDashboard onLogout={() => setAuth(false)} />
            </AdminRoute>
          }
        /> */}

        {/* --- admin: ใช้ nested routes แบบใหม่ --- */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<DashboardHome />} />
          <Route path="listings" element={<AdminListings />} />
          <Route path="bookings" element={<AdminBookings />} />   {/* ✅ ใหม่ */}
          <Route path="approvals" element={<ApprovalsPage />} />
          <Route path="categories" element={<CategoriesManager />} />
          <Route path="owners" element={<OwnersManager />} />
          <Route path="users" element={<UsersManager />} />
          <Route path="settings" element={<AdminSettings />} /> {/* ✅ ใหม่: เส้นทางตั้งค่า */}
          <Route path="reports" element={<AdminReports />} />
        </Route>

        {/* redirect ชั่วคราวจากเส้นทางเก่า */}
        <Route path="/admin/dashboard" element={<Navigate to="/admin" replace />} />


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
          <Route path="settings" element={<OwnerSettings />} />
          <Route path="bookings" element={<OwnerBookings />} />
          {/* <Route path="messages" element={<OwnerMessages />} />
          <Route path="settings" element={<OwnerSettings />} /> */}
          {/* <Route path='/properties/:id' element={<OwnerPropertyDetail />} /> */}
        </Route>

      </Routes>
    </>
  )
}

export default function App() {

  const [toastTheme, setToastTheme] = useState(
    localStorage.getItem("theme") === "dark" ? "dark" : "light"
  );

  useEffect(() => {
    const update = () =>
      setToastTheme(localStorage.getItem("theme") === "dark" ? "dark" : "light");

    // ฟังเวลาเปลี่ยน localStorage หรือยิง custom event ตอน toggle
    window.addEventListener("storage", update);
    window.addEventListener("theme-changed", update);

    return () => {
      window.removeEventListener("storage", update);
      window.removeEventListener("theme-changed", update);
    };
  }, []);

  return (
    <Router>

      <Toaster
        position="top-right"
        richColors
        theme={toastTheme}   // << ใช้ค่าจาก localStorage แทน system  // auto ตาม light/dark ของระบบ/เว็บ
        closeButton
        duration={2500}        // แสดงสั้นๆ แล้วหายเอง
      />

      <AppInner />
    </Router>
  )
}
