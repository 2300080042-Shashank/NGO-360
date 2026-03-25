import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminDashboard from './pages/AdminDashboard';
import VolunteerManagement from './pages/VolunteerManagement';
import DonationsPage from './pages/DonationsPage';
import './index.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
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
          <Route path="volunteers" element={<VolunteerManagement />} />
          <Route path="donations" element={<DonationsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
