import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FiUser, FiPhone, FiMail, FiKey, FiBriefcase, FiCalendar, FiEye, FiSettings } from 'react-icons/fi';

const API = window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://ngo-360.onrender.com';

const Profile = () => {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    skills: [],
    availability: ''
  });
  
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  const [allProfiles, setAllProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchProfile();
    if (user.role === 'admin') {
      fetchAllProfiles();
    }
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/api/auth/profile`, {
        headers: { 'x-auth-token': token }
      });
      setProfile({
        name: res.data.name || '',
        email: res.data.email || '',
        phone: res.data.phone || '',
        role: res.data.role || '',
        skills: res.data.skills || [],
        availability: res.data.availability || ''
      });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to load profile details.' });
    } finally {
      setLoading(false);
    }
  };

  const fetchAllProfiles = async () => {
    setProfilesLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/api/auth/profiles`, {
        headers: { 'x-auth-token': token }
      });
      setAllProfiles(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setProfilesLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const payload = {
        name: profile.name,
        phone: profile.phone,
        skills: profile.skills,
        availability: profile.availability
      };

      const res = await axios.put(`${API}/api/auth/profile`, payload, {
        headers: { 'x-auth-token': token }
      });

      setProfile(prev => ({
        ...prev,
        name: res.data.name,
        phone: res.data.phone,
        skills: res.data.skills || [],
        availability: res.data.availability || ''
      }));

      // Update name in localstorage so other components update
      const updatedUser = { ...user, name: res.data.name };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      
      // Refresh admin user list if admin
      if (user.role === 'admin') {
        fetchAllProfiles();
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err.response?.data?.msg || 'Error updating profile.' });
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordMessage({ type: '', text: '' });

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Passwords do not match!' });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/api/auth/profile`, { password: passwordForm.newPassword }, {
        headers: { 'x-auth-token': token }
      });

      setPasswordForm({ newPassword: '', confirmPassword: '' });
      setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
    } catch (err) {
      console.error(err);
      setPasswordMessage({ type: 'error', text: err.response?.data?.msg || 'Error changing password.' });
    }
  };

  if (loading) return <div className="p-8 text-center text-secondary">Loading profile...</div>;

  return (
    <div className="animate-fade-in" style={{ padding: '0 20px' }}>
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Profile Settings</h1>
        <p className="text-secondary mt-2">Manage your account credentials and personalization preferences.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: user.role === 'admin' ? '1.1fr 0.9fr' : '1.2fr 0.8fr', gap: '24px' }}>
        
        {/* Profile Edit Panel */}
        <div className="glass-panel" style={{ padding: '28px' }}>
          <div className="flex items-center gap-3 mb-6" style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
            <FiSettings size={22} className="text-accent" />
            <h3 className="text-xl font-bold">Edit Personal Details</h3>
          </div>

          {message.text && (
            <div style={{ 
              padding: '12px 16px', 
              borderRadius: '8px', 
              marginBottom: '20px', 
              background: message.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: message.type === 'success' ? 'var(--success)' : 'var(--danger)',
              border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
            }}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleProfileUpdate} className="flex-col gap-4">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label className="text-sm font-semibold mb-2 block">Full Name</label>
                <input 
                  type="text" 
                  value={profile.name} 
                  onChange={e => setProfile({...profile, name: e.target.value})} 
                  required 
                />
              </div>
              <div>
                <label className="text-sm font-semibold mb-2 block">Email (Non-editable)</label>
                <input 
                  type="email" 
                  value={profile.email} 
                  disabled 
                  style={{ opacity: 0.6, cursor: 'not-allowed' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label className="text-sm font-semibold mb-2 block">Phone Number</label>
                <input 
                  type="text" 
                  value={profile.phone} 
                  onChange={e => setProfile({...profile, phone: e.target.value})} 
                  placeholder="e.g. +1 555-0199"
                />
              </div>
              <div>
                <label className="text-sm font-semibold mb-2 block">Account Role</label>
                <input 
                  type="text" 
                  value={profile.role.toUpperCase()} 
                  disabled 
                  style={{ opacity: 0.6, cursor: 'not-allowed' }}
                />
              </div>
            </div>

            {profile.role === 'volunteer' && (
              <div style={{ borderTop: '1px solid var(--glass-border)', marginTop: '16px', paddingTop: '16px' }}>
                <h4 className="text-md font-semibold mb-4 text-accent">Volunteer Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '16px' }}>
                  <div>
                    <label className="text-sm font-semibold mb-2 block">Skills (Comma-separated)</label>
                    <input 
                      type="text" 
                      value={Array.isArray(profile.skills) ? profile.skills.join(', ') : profile.skills} 
                      onChange={e => setProfile({...profile, skills: e.target.value})}
                      placeholder="e.g. Fundraising, Mentoring, Design"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-2 block">Availability</label>
                    <select 
                      value={profile.availability} 
                      onChange={e => setProfile({...profile, availability: e.target.value})}
                    >
                      <option value="">Select availability...</option>
                      <option value="Weekends">Weekends</option>
                      <option value="Evenings">Evenings</option>
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Flexible">Flexible</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            <button type="submit" className="btn btn-primary mt-4 align-self-start" style={{ width: 'fit-content' }}>
              Save Changes
            </button>
          </form>
        </div>

        {/* Right side options: Password Change or Admin Profiles List */}
        <div className="flex-col gap-6">
          
          {/* Security / Password Change */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div className="flex items-center gap-3 mb-6" style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
              <FiKey size={20} className="text-warning" />
              <h3 className="text-lg font-bold">Change Password</h3>
            </div>

            {passwordMessage.text && (
              <div style={{ 
                padding: '10px 14px', 
                borderRadius: '8px', 
                marginBottom: '16px', 
                fontSize: '13px',
                background: passwordMessage.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: passwordMessage.type === 'success' ? 'var(--success)' : 'var(--danger)',
                border: `1px solid ${passwordMessage.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
              }}>
                {passwordMessage.text}
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="flex-col gap-4">
              <div>
                <label className="text-sm font-semibold mb-2 block">New Password</label>
                <input 
                  type="password" 
                  value={passwordForm.newPassword} 
                  onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})} 
                  placeholder="Min 6 characters"
                  required 
                />
              </div>
              <div>
                <label className="text-sm font-semibold mb-2 block">Confirm New Password</label>
                <input 
                  type="password" 
                  value={passwordForm.confirmPassword} 
                  onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} 
                  placeholder="Confirm password"
                  required 
                />
              </div>
              <button type="submit" className="btn mt-2" style={{ background: 'rgba(245, 158, 11, 0.2)', color: 'var(--warning)', border: '1px solid rgba(245, 158, 11, 0.4)' }}>
                Update Password
              </button>
            </form>
          </div>

          {/* Admin: View All User Profiles */}
          {user.role === 'admin' && (
            <div className="glass-panel" style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div className="flex items-center gap-3 mb-6" style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
                <FiUser size={20} className="text-success" />
                <h3 className="text-lg font-bold">All User Profiles</h3>
              </div>

              {profilesLoading ? (
                <p className="text-secondary text-sm">Loading all user profiles...</p>
              ) : (
                <div style={{ maxHeight: '250px', overflowY: 'auto', flex: 1 }} className="flex-col gap-3">
                  {allProfiles.map(p => (
                    <div 
                      key={p._id} 
                      className="glass-card flex justify-between items-center" 
                      style={{ 
                        padding: '12px 16px', 
                        cursor: 'pointer', 
                        border: selectedProfile?._id === p._id ? '1px solid var(--accent)' : '1px solid rgba(255, 255, 255, 0.05)',
                        background: selectedProfile?._id === p._id ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.02)'
                      }}
                      onClick={() => setSelectedProfile(p)}
                    >
                      <div>
                        <h4 className="font-semibold text-sm">{p.name}</h4>
                        <p className="text-xs text-secondary">{p.email}</p>
                      </div>
                      <span style={{ 
                        padding: '2px 8px', 
                        borderRadius: '12px', 
                        fontSize: '10px',
                        background: p.role === 'admin' ? 'rgba(239, 68, 68, 0.15)' : p.role === 'volunteer' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                        color: p.role === 'admin' ? 'var(--danger)' : p.role === 'volunteer' ? 'var(--accent)' : 'var(--success)'
                      }}>
                        {p.role.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      {/* Admin: View Selected Profile Read-only Modal/Panel */}
      {user.role === 'admin' && selectedProfile && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel animate-fade-in" style={{ padding: '32px', width: '100%', maxWidth: '500px' }}>
            <div className="flex justify-between items-center mb-6" style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
              <div className="flex items-center gap-3">
                <FiEye size={22} className="text-accent" />
                <h3 className="text-xl font-bold">User Profile Viewer</h3>
              </div>
              <span style={{ 
                padding: '4px 10px', 
                borderRadius: '12px', 
                fontSize: '11px',
                background: selectedProfile.role === 'admin' ? 'rgba(239, 68, 68, 0.2)' : selectedProfile.role === 'volunteer' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                color: selectedProfile.role === 'admin' ? 'var(--danger)' : selectedProfile.role === 'volunteer' ? 'var(--accent)' : 'var(--success)'
              }}>
                {selectedProfile.role.toUpperCase()}
              </span>
            </div>

            <div className="flex-col gap-4">
              <div>
                <span className="text-xs text-secondary block">Full Name</span>
                <span className="text-base font-semibold">{selectedProfile.name}</span>
              </div>
              
              <div>
                <span className="text-xs text-secondary block">Email Address</span>
                <span className="text-base font-semibold flex items-center gap-2">
                  <FiMail size={14} className="text-secondary" /> {selectedProfile.email}
                </span>
              </div>

              <div>
                <span className="text-xs text-secondary block">Phone Number</span>
                <span className="text-base font-semibold flex items-center gap-2">
                  <FiPhone size={14} className="text-secondary" /> {selectedProfile.phone || 'Not provided'}
                </span>
              </div>

              {selectedProfile.role === 'volunteer' && (
                <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '12px', marginTop: '6px' }} className="flex-col gap-3">
                  <div>
                    <span className="text-xs text-secondary block mb-1">Skills</span>
                    {selectedProfile.skills && selectedProfile.skills.length > 0 ? (
                      <div className="flex gap-2 flex-wrap">
                        {selectedProfile.skills.map((skill, idx) => (
                          <span key={idx} style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm italic text-secondary">No skills listed</span>
                    )}
                  </div>
                  <div>
                    <span className="text-xs text-secondary block">Availability</span>
                    <span className="text-sm font-semibold flex items-center gap-2 mt-1">
                      <FiCalendar size={14} className="text-secondary" /> {selectedProfile.availability || 'Not provided'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-8">
              <button className="btn" style={{ background: 'rgba(255,255,255,0.1)' }} onClick={() => setSelectedProfile(null)}>
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
