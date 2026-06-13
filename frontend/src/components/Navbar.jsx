import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiHeart, FiUser, FiHome, FiCompass, FiAward, FiLogOut, FiMenu, FiX, FiBell } from 'react-icons/fi';
import axios from 'axios';
import './Navbar.css';

const API = window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://ngo-360.onrender.com';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await axios.get(`${API}/api/notifications/unread-count`, {
        headers: { 'x-auth-token': token }
      });
      setUnreadCount(res.data.count);
    } catch (err) {
      console.error('Error fetching unread count', err);
    }
  };

  useEffect(() => {
    fetchUnreadCount();

    window.addEventListener('notificationsUpdated', fetchUnreadCount);
    return () => {
      window.removeEventListener('notificationsUpdated', fetchUnreadCount);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="public-navbar glass-panel">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <h2>NGO<span>360</span></h2>
        </Link>

        <nav className="navbar-links">
          <Link to="/" className={isActive('/') ? 'active' : ''}>
            <FiHome /> Home
          </Link>
          <Link to="/ngos" className={isActive('/ngos') ? 'active' : ''}>
            <FiCompass /> NGOs
          </Link>
          <Link to="/campaigns" className={isActive('/campaigns') ? 'active' : ''}>
            <FiHeart /> Campaigns
          </Link>
          <Link to="/opportunities" className={isActive('/opportunities') ? 'active' : ''}>
            <FiAward /> Volunteer
          </Link>
        </nav>

        <div className="navbar-actions">
          {token ? (
            <div className="user-profile-actions">
              <span className="welcome-name">Hi, {user.name}</span>
              <Link to="/notifications" className="btn-logout-icon" title="Notifications" style={{ position: 'relative' }}>
                <FiBell size={18} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    background: 'var(--danger)',
                    color: 'white',
                    borderRadius: '50%',
                    padding: '2px 5px',
                    fontSize: '8px',
                    fontWeight: 'bold',
                    lineHeight: 1
                  }}>
                    {unreadCount}
                  </span>
                )}
              </Link>
              <Link to="/dashboard" className="btn btn-primary btn-sm">
                Dashboard
              </Link>
              <button onClick={handleLogout} className="btn-logout-icon" title="Logout">
                <FiLogOut size={18} />
              </button>
            </div>
          ) : (
            <div className="auth-actions">
              <Link to="/login" className="login-link">Sign In</Link>
              <Link to="/signup" className="btn btn-primary">Get Started</Link>
            </div>
          )}
        </div>

        <button className="navbar-mobile-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle navigation menu">
          {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="navbar-mobile-menu glass-panel animate-fade-in">
          <Link to="/" onClick={() => setMobileMenuOpen(false)} className={isActive('/') ? 'active' : ''}>
            <FiHome /> Home
          </Link>
          <Link to="/ngos" onClick={() => setMobileMenuOpen(false)} className={isActive('/ngos') ? 'active' : ''}>
            <FiCompass /> NGOs
          </Link>
          <Link to="/campaigns" onClick={() => setMobileMenuOpen(false)} className={isActive('/campaigns') ? 'active' : ''}>
            <FiHeart /> Campaigns
          </Link>
          <Link to="/opportunities" onClick={() => setMobileMenuOpen(false)} className={isActive('/opportunities') ? 'active' : ''}>
            <FiAward /> Volunteer
          </Link>
          
          <div className="navbar-mobile-actions" style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '16px', marginTop: '16px' }}>
            {token ? (
              <div className="flex-col gap-4" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <span className="welcome-name" style={{ textAlign: 'center' }}>Hi, {user.name}</span>
                <Link to="/notifications" onClick={() => setMobileMenuOpen(false)} className="btn btn-secondary w-full text-center" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                  <FiBell /> Notifications
                  {unreadCount > 0 && (
                    <span style={{ 
                      background: 'var(--danger)', 
                      color: 'white', 
                      borderRadius: '10px', 
                      padding: '2px 6px', 
                      fontSize: '10px',
                      fontWeight: 'bold'
                    }}>
                      {unreadCount}
                    </span>
                  )}
                </Link>
                <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="btn btn-primary w-full text-center" style={{ display: 'flex' }}>
                  Dashboard
                </Link>
                <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="btn-logout w-full" style={{ justifyContent: 'center', display: 'flex', width: '100%' }}>
                  <FiLogOut /> Logout
                </button>
              </div>
            ) : (
              <div className="flex-col gap-4" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="login-link text-center" style={{ display: 'block', padding: '10px' }}>Sign In</Link>
                <Link to="/signup" onClick={() => setMobileMenuOpen(false)} className="btn btn-primary w-full text-center" style={{ display: 'flex' }}>Get Started</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
