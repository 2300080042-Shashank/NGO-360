import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { FiMenu } from 'react-icons/fi';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminDashboard from './pages/AdminDashboard';
import VolunteerManagement from './pages/VolunteerManagement';
import DonationsPage from './pages/DonationsPage';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';

// Import New Public Pages
import LandingPage from './pages/LandingPage';
import BrowseNgos from './pages/BrowseNgos';
import BrowseCampaigns from './pages/BrowseCampaigns';
import BrowseTasks from './pages/BrowseTasks';
import NgoProfile from './pages/NgoProfile';
import CampaignDetails from './pages/CampaignDetails';

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

// Dashboard Layout (Dashboard Side Navigation)
const DashboardLayout = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  return (
    <div className="app-container">
      <div className="mobile-header">
        <button className="hamburger-btn" onClick={() => setSidebarOpen(true)} aria-label="Open navigation sidebar">
          <FiMenu size={24} />
        </button>
        <h2 className="logo-text" style={{ fontSize: '1.4rem', margin: 0 }}>NGO<span style={{ color: 'var(--accent)' }}>360</span></h2>
        <div style={{ width: '40px' }}></div>
      </div>

      <Sidebar role={user.role} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>
      )}

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

// Public Layout (Top Navigation Header)
const PublicLayout = () => {
  return (
    <div className="public-layout-wrapper" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </main>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Authentication Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Public Browsing Routes */}
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<LandingPage />} />
          <Route path="ngos" element={<BrowseNgos />} />
          <Route path="ngos/:id" element={<NgoProfile />} />
          <Route path="campaigns" element={<BrowseCampaigns />} />
          <Route path="campaigns/:id" element={<CampaignDetails />} />
          <Route path="opportunities" element={<BrowseTasks />} />
        </Route>

        {/* Private Dashboard Routes */}
        <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
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
          <Route path="notifications" element={<Notifications />} />
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
