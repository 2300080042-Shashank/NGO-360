import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FiBell, FiCheck, FiTrash2, FiClock, FiAlertCircle } from 'react-icons/fi';

const API = window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://ngo-360.onrender.com';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/api/notifications`, {
        headers: { 'x-auth-token': token }
      });
      setNotifications(res.data);
    } catch (err) {
      console.error('Error fetching notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/api/notifications/read-all`, {}, {
        headers: { 'x-auth-token': token }
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      // Dispatch custom event to sync sidebar and navbar counts
      window.dispatchEvent(new Event('notificationsUpdated'));
    } catch (err) {
      console.error('Error marking all as read', err);
    }
  };

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/api/notifications/${id}/read`, {}, {
        headers: { 'x-auth-token': token }
      });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      // Dispatch custom event
      window.dispatchEvent(new Event('notificationsUpdated'));
    } catch (err) {
      console.error('Error marking as read', err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/api/notifications/${id}`, {
        headers: { 'x-auth-token': token }
      });
      setNotifications(prev => prev.filter(n => n._id !== id));
      // Dispatch custom event
      window.dispatchEvent(new Event('notificationsUpdated'));
    } catch (err) {
      console.error('Error deleting notification', err);
    }
  };

  const getTypeStyle = (type) => {
    switch (type) {
      case 'success':
        return { borderLeft: '4px solid var(--success)', bg: 'rgba(16, 185, 129, 0.04)', color: 'var(--success)' };
      case 'warning':
        return { borderLeft: '4px solid var(--warning)', bg: 'rgba(245, 158, 11, 0.04)', color: 'var(--warning)' };
      case 'danger':
        return { borderLeft: '4px solid var(--danger)', bg: 'rgba(239, 68, 68, 0.04)', color: 'var(--danger)' };
      default:
        return { borderLeft: '4px solid var(--accent)', bg: 'rgba(99, 102, 241, 0.04)', color: 'var(--accent)' };
    }
  };

  if (loading) return <div className="p-8 text-center text-secondary">Loading notifications...</div>;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="animate-fade-in" style={{ padding: '0 20px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      <header className="flex justify-between items-center mb-8 flex-mobile-col" style={{ alignItems: 'flex-start' }}>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FiBell className="text-accent" /> Notifications
          </h1>
          <p className="text-secondary mt-2">
            You have {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}.
          </p>
        </div>
        {unreadCount > 0 && (
          <button 
            className="btn btn-secondary btn-sm flex items-center gap-1.5 mobile-w-full mt-4" 
            onClick={markAllAsRead}
          >
            <FiCheck /> Mark All Read
          </button>
        )}
      </header>

      <div className="flex-col gap-4" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {notifications.map(notif => {
          const style = getTypeStyle(notif.type);
          return (
            <div 
              key={notif._id} 
              className="glass-card flex justify-between items-start gap-4 transition-all"
              style={{ 
                padding: '20px', 
                borderLeft: style.borderLeft,
                background: notif.isRead ? 'rgba(255, 255, 255, 0.01)' : style.bg,
                borderColor: notif.isRead ? 'var(--glass-border)' : 'rgba(99, 102, 241, 0.2)'
              }}
            >
              <div style={{ flex: 1 }}>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-semibold text-lg" style={{ margin: 0, color: notif.isRead ? 'var(--text-primary)' : '#fff' }}>
                    {notif.title}
                  </h4>
                  {!notif.isRead && (
                    <span style={{ 
                      padding: '2px 8px', 
                      borderRadius: '10px', 
                      fontSize: '10px', 
                      fontWeight: 'bold', 
                      background: style.color, 
                      color: '#000' 
                    }}>
                      NEW
                    </span>
                  )}
                </div>
                <p className="text-sm text-secondary mt-2" style={{ color: notif.isRead ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                  {notif.message}
                </p>
                <div className="flex items-center gap-1 text-xs text-secondary mt-3">
                  <FiClock /> {new Date(notif.createdAt).toLocaleString()}
                </div>
              </div>

              <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
                {!notif.isRead && (
                  <button 
                    onClick={() => markAsRead(notif._id)} 
                    className="btn-logout-icon" 
                    title="Mark as Read"
                    style={{ color: 'var(--success)' }}
                  >
                    <FiCheck size={16} />
                  </button>
                )}
                <button 
                  onClick={() => deleteNotification(notif._id)} 
                  className="btn-logout-icon" 
                  title="Delete Alert"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
        
        {notifications.length === 0 && (
          <div className="glass-panel text-center" style={{ padding: '48px' }}>
            <FiAlertCircle size={48} className="text-secondary mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Alerts Yet</h2>
            <p className="text-secondary">We'll notify you when actions relating to your volunteer requests, tasks, or donations are published.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
