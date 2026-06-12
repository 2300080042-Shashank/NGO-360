import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminDashboard from './pages/AdminDashboard';
import VolunteerManagement from './pages/VolunteerManagement';
import DonationsPage from './pages/DonationsPage';
import Profile from './pages/Profile';
import './index.css';

// Protected Route Component with role checks
const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (!token) return <Navigate to="/login" replace />;
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

// Layout with Sidebar Component
const DashboardLayout = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  return (
    <div className="app-container">
      <Sidebar role={user.role} />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="volunteers" element={
            <ProtectedRoute allowedRoles={['admin', 'volunteer']}>
              <VolunteerManagement />
            </ProtectedRoute>
          } />
          <Route path="donations" element={
            <ProtectedRoute allowedRoles={['admin', 'donor']}>
              <DonationsPage />
            </ProtectedRoute>
          } />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
