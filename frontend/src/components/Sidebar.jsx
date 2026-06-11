import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FiHome, FiUsers, FiHeart, FiCheckSquare, FiLogOut } from 'react-icons/fi';
import './Sidebar.css';

const Sidebar = ({ role }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="sidebar glass-panel">
      <div className="sidebar-header">
        <h2 className="logo-text">NGO<span>360</span></h2>
      </div>
      
      <nav className="sidebar-nav">
        <ul>
          <li>
            <NavLink to="/dashboard" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
              <FiHome /> Dashboard
            </NavLink>
          </li>
          
          {(role === 'admin' || role === 'volunteer') && (
            <li>
              <NavLink to="/volunteers" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
                <FiUsers /> {role === 'admin' ? 'Volunteers' : 'My Tasks'}
              </NavLink>
            </li>
          )}
          
          {role !== 'volunteer' && (
            <li>
              <NavLink to="/donations" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
                <FiHeart /> Donations
              </NavLink>
            </li>
          )}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <button className="btn-logout" onClick={handleLogout}>
          <FiLogOut /> Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
