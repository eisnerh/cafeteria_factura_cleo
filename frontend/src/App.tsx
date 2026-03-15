import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { LogoProvider } from './contexts/LogoContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import Tables from './pages/Tables'
import Clients from './pages/Clients'
import Expenses from './pages/Expenses'
import Invoices from './pages/Invoices'
import InvoiceDetail from './pages/InvoiceDetail'
import Reservations from './pages/Reservations'
import Reports from './pages/Reports'
import Users from './pages/Users'
import Settings from './pages/Settings'
import POS from './pages/POS'
import CashRegister from './pages/CashRegister'
import NotFound from './pages/NotFound'
import './App.css'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/pos" element={<ProtectedRoute><POS /></ProtectedRoute>} />
      <Route path="/orders" element={<Navigate to="/pos?tab=historial" replace />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="tables" element={<Tables />} />
        <Route path="cash-register" element={<CashRegister />} />
        <Route path="clients" element={<Clients />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="invoices/:id" element={<InvoiceDetail />} />
        <Route path="reservations" element={<Reservations />} />
        <Route path="reports" element={<Reports />} />
        <Route path="users" element={<Users />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <LogoProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </LogoProvider>
    </AuthProvider>
  )
}
