import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiHeart, FiUser, FiHome, FiCompass, FiAward, FiLogOut } from 'react-icons/fi';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

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
      </div>
    </header>
  );
};

export default Navbar;
