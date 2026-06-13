import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FiHome, FiUsers, FiHeart, FiCheckSquare, FiLogOut, FiUser, FiX, FiBell } from 'react-icons/fi';
import axios from 'axios';
import './Sidebar.css';

const API = window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://ngo-360.onrender.com';

const Sidebar = ({ role, isOpen, onClose }) => {
  const navigate = useNavigate();
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
    if (onClose) onClose();
    navigate('/login');
  };

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  return (
    <div className={`sidebar glass-panel ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <h2 className="logo-text">NGO<span className="logo-suffix">360</span></h2>
        <button className="sidebar-close-btn" onClick={onClose} aria-label="Close sidebar">
          <FiX size={20} />
        </button>
      </div>
      
      <nav className="sidebar-nav">
        <ul>
          <li>
            <NavLink to="/dashboard" onClick={handleLinkClick} className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
              <FiHome /> <span className="nav-text">Dashboard</span>
            </NavLink>
          </li>
          
          {(role === 'admin' || role === 'volunteer') && (
            <li>
              <NavLink to="/volunteers" onClick={handleLinkClick} className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
                <FiUsers /> <span className="nav-text">{role === 'admin' ? 'Volunteers' : 'My Tasks'}</span>
              </NavLink>
            </li>
          )}
          
          {role !== 'volunteer' && (
            <li>
              <NavLink to="/donations" onClick={handleLinkClick} className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
                <FiHeart /> <span className="nav-text">Donations</span>
              </NavLink>
            </li>
          )}

          <li>
            <NavLink to="/notifications" onClick={handleLinkClick} className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'} style={{ position: 'relative' }}>
              <FiBell /> 
              <span className="nav-text">Notifications</span>
              {unreadCount > 0 && (
                <span className="unread-badge">
                  {unreadCount}
                </span>
              )}
            </NavLink>
          </li>

          <li>
            <NavLink to="/profile" onClick={handleLinkClick} className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
              <FiUser /> <span className="nav-text">Profile</span>
            </NavLink>
          </li>
        </ul>
      </nav>

      <div className="sidebar-footer">
        <button className="btn-logout" onClick={handleLogout}>
          <FiLogOut /> <span className="nav-text">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
