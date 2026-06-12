import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FiUser, FiPhone, FiMail, FiKey, FiBriefcase, FiCalendar, FiEye, FiSettings, FiBriefcase as FiNgo } from 'react-icons/fi';

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

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

  // Organization settings for NGO Admin
  const [org, setOrg] = useState(null);
  const [orgLoading, setOrgLoading] = useState(false);
  const [orgForm, setOrgForm] = useState({
    name: '',
    logo: '',
    coverImage: '',
    description: '',
    mission: '',
    location: '',
    contactEmail: '',
    contactPhone: '',
    website: ''
  });
  const [orgMessage, setOrgMessage] = useState({ type: '', text: '' });

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchProfile();
    if (user.role === 'admin') {
      fetchMyOrganization();
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

  const fetchMyOrganization = async () => {
    setOrgLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/api/organizations/my`, {
        headers: { 'x-auth-token': token }
      });
      setOrg(res.data);
      setOrgForm({
        name: res.data.name || '',
        logo: res.data.logo || '',
        coverImage: res.data.coverImage || '',
        description: res.data.description || '',
        mission: res.data.mission || '',
        location: res.data.location || '',
        contactEmail: res.data.contactDetails?.email || '',
        contactPhone: res.data.contactDetails?.phone || '',
        website: res.data.contactDetails?.website || ''
      });
    } catch (err) {
      // 404 is expected if they haven't set up an NGO yet
      if (err.response?.status !== 404) {
        console.error('Error fetching NGO details', err);
      }
      setOrg(null);
    } finally {
      setOrgLoading(false);
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

      const updatedUser = { ...user, name: res.data.name };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      setMessage({ type: 'success', text: 'Profile details saved.' });
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
      setPasswordMessage({ type: 'success', text: 'Password updated successfully!' });
    } catch (err) {
      console.error(err);
      setPasswordMessage({ type: 'error', text: err.response?.data?.msg || 'Error changing password.' });
    }
  };

  const handleOrgSubmit = async (e) => {
    e.preventDefault();
    setOrgMessage({ type: '', text: '' });

    const payload = {
      name: orgForm.name,
      logo: orgForm.logo || undefined,
      coverImage: orgForm.coverImage || undefined,
      description: orgForm.description,
      mission: orgForm.mission,
      location: orgForm.location,
      contactDetails: {
        email: orgForm.contactEmail,
        phone: orgForm.contactPhone,
        website: orgForm.website
      }
    };

    try {
      const token = localStorage.getItem('token');
      if (org) {
        // Update
        const res = await axios.put(`${API}/api/organizations/${org._id}`, payload, {
          headers: { 'x-auth-token': token }
        });
        setOrg(res.data);
        setOrgMessage({ type: 'success', text: 'NGO Profile details updated successfully!' });
      } else {
        // Create
        const res = await axios.post(`${API}/api/organizations`, payload, {
          headers: { 'x-auth-token': token }
        });
        setOrg(res.data);
        setOrgMessage({ type: 'success', text: 'NGO Profile created! You can now publish campaigns and tasks.' });
      }
    } catch (err) {
      console.error(err);
      setOrgMessage({ type: 'error', text: err.response?.data?.msg || 'Error saving organization details.' });
    }
  };

  if (loading) return <div className="p-8 text-center text-secondary">Loading profile...</div>;

  return (
    <div className="animate-fade-in" style={{ padding: '0 20px' }}>
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Profile & Settings</h1>
        <p className="text-secondary mt-2">Manage your credentials, preferences, and organization listings.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: user.role === 'admin' ? '1fr 1fr' : '1.2fr 0.8fr', gap: '24px' }}>
        
        {/* Left Side: General Profile Details */}
        <div className="flex-col gap-6">
          <div className="glass-panel" style={{ padding: '28px' }}>
            <div className="flex items-center gap-3 mb-6" style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
              <FiUser size={22} className="text-accent" />
              <h3 className="text-xl font-bold">Personal Account Settings</h3>
            </div>

            {message.text && (
              <div style={{ 
                padding: '12px 16px', 
                borderRadius: '8px', 
                marginBottom: '20px', 
                background: message.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                color: message.type === 'success' ? 'var(--success)' : 'var(--danger)',
                border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
              }}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleProfileUpdate} className="flex-col gap-4">
              <div>
                <label className="text-xs text-secondary font-semibold mb-2 block">Full Name</label>
                <input 
                  type="text" 
                  value={profile.name} 
                  onChange={e => setProfile({...profile, name: e.target.value})} 
                  required 
                />
              </div>
              
              <div>
                <label className="text-xs text-secondary font-semibold mb-2 block">Email (Non-editable)</label>
                <input 
                  type="email" 
                  value={profile.email} 
                  disabled 
                  style={{ opacity: 0.6 }}
                />
              </div>

              <div>
                <label className="text-xs text-secondary font-semibold mb-2 block">Phone Number</label>
                <input 
                  type="text" 
                  value={profile.phone} 
                  onChange={e => setProfile({...profile, phone: e.target.value})} 
                  placeholder="+91 9999999999"
                />
              </div>

              {profile.role === 'volunteer' && (
                <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '16px', marginTop: '8px' }}>
                  <h4 className="text-sm font-semibold mb-4 text-accent">Volunteer Customizations</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label className="text-xs text-secondary font-semibold mb-2 block">Skills (Comma-separated)</label>
                      <input 
                        type="text" 
                        value={Array.isArray(profile.skills) ? profile.skills.join(', ') : profile.skills} 
                        onChange={e => setProfile({...profile, skills: e.target.value})}
                        placeholder="e.g. Cooking, Coding, Graphic Design"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-secondary font-semibold mb-2 block">Availability</label>
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

              <button type="submit" className="btn btn-primary mt-4" style={{ width: 'fit-content' }}>
                Save Account Info
              </button>
            </form>
          </div>

          {/* Change Password Panel */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div className="flex items-center gap-3 mb-6" style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
              <FiKey size={20} className="text-warning" />
              <h3 className="text-lg font-bold">Change Account Password</h3>
            </div>

            {passwordMessage.text && (
              <div style={{ 
                padding: '10px 14px', 
                borderRadius: '8px', 
                marginBottom: '16px', 
                fontSize: '13px',
                background: passwordMessage.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                color: passwordMessage.type === 'success' ? 'var(--success)' : 'var(--danger)',
                border: `1px solid ${passwordMessage.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
              }}>
                {passwordMessage.text}
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="flex-col gap-4">
              <div>
                <label className="text-xs text-secondary font-semibold mb-2 block">New Password</label>
                <input 
                  type="password" 
                  value={passwordForm.newPassword} 
                  onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})} 
                  placeholder="Min 6 characters"
                  required 
                />
              </div>
              <div>
                <label className="text-xs text-secondary font-semibold mb-2 block">Confirm New Password</label>
                <input 
                  type="password" 
                  value={passwordForm.confirmPassword} 
                  onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} 
                  placeholder="Verify new password"
                  required 
                />
              </div>
              <button type="submit" className="btn btn-secondary mt-2" style={{ width: 'fit-content' }}>
                Update Password
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Organization (NGO) Profile Onboarding/Edit (Admin Only) */}
        {user.role === 'admin' && (
          <div className="glass-panel" style={{ padding: '28px' }}>
            <div className="flex items-center gap-3 mb-6" style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
              <FiSettings size={22} className="text-success" />
              <h3 className="text-xl font-bold">NGO Organization Profile</h3>
            </div>

            {orgLoading ? (
              <p className="text-secondary">Loading NGO profile data...</p>
            ) : (
              <>
                {orgMessage.text && (
                  <div style={{ 
                    padding: '12px 16px', 
                    borderRadius: '8px', 
                    marginBottom: '20px', 
                    background: orgMessage.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                    color: orgMessage.type === 'success' ? 'var(--success)' : 'var(--danger)',
                    border: `1px solid ${orgMessage.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                  }}>
                    {orgMessage.text}
                  </div>
                )}

                <form onSubmit={handleOrgSubmit} className="flex-col gap-4">
                  <div>
                    <label className="text-xs text-secondary font-semibold mb-2 block">NGO Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Green Earth Foundation" 
                      value={orgForm.name} 
                      onChange={e => setOrgForm({...orgForm, name: e.target.value})}
                      required 
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label className="text-xs text-secondary font-semibold mb-2 block">Logo URL</label>
                      <input 
                        type="url" 
                        placeholder="Image URL" 
                        value={orgForm.logo} 
                        onChange={e => setOrgForm({...orgForm, logo: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-secondary font-semibold mb-2 block">Cover Image URL</label>
                      <input 
                        type="url" 
                        placeholder="Image URL" 
                        value={orgForm.coverImage} 
                        onChange={e => setOrgForm({...orgForm, coverImage: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-secondary font-semibold mb-2 block">NGO Location</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Mumbai, Maharashtra" 
                      value={orgForm.location} 
                      onChange={e => setOrgForm({...orgForm, location: e.target.value})}
                      required 
                    />
                  </div>

                  <div>
                    <label className="text-xs text-secondary font-semibold mb-2 block">Mission Statement</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Bridging digital gaps for slum children." 
                      value={orgForm.mission} 
                      onChange={e => setOrgForm({...orgForm, mission: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="text-xs text-secondary font-semibold mb-2 block">Description</label>
                    <textarea 
                      rows="4" 
                      placeholder="Give a brief summary of NGO work, goals, and history..." 
                      value={orgForm.description} 
                      onChange={e => setOrgForm({...orgForm, description: e.target.value})}
                      required
                    ></textarea>
                  </div>

                  <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '16px', marginTop: '8px' }}>
                    <h4 className="text-sm font-semibold mb-4 text-accent">NGO Contact Info</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label className="text-xs text-secondary font-semibold mb-2 block">Contact Email</label>
                        <input 
                          type="email" 
                          placeholder="email@ngo.org" 
                          value={orgForm.contactEmail} 
                          onChange={e => setOrgForm({...orgForm, contactEmail: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-secondary font-semibold mb-2 block">Phone</label>
                        <input 
                          type="text" 
                          placeholder="+91..." 
                          value={orgForm.contactPhone} 
                          onChange={e => setOrgForm({...orgForm, contactPhone: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="text-xs text-secondary font-semibold mb-2 block">Website URL</label>
                      <input 
                        type="text" 
                        placeholder="www.ngo.org" 
                        value={orgForm.website} 
                        onChange={e => setOrgForm({...orgForm, website: e.target.value})}
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-success mt-4">
                    {org ? 'Save NGO Profile' : 'Register NGO'}
                  </button>
                </form>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default Profile;
