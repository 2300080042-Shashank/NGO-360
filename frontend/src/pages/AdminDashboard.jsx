import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FiUsers, FiHeart, FiCheckSquare, FiDollarSign, FiPlus, FiAlertCircle, FiTrendingUp } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const API = window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://ngo-360.onrender.com';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Campaign Modal state
  const [showCampModal, setShowCampModal] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    title: '',
    description: '',
    goalAmount: '',
    category: 'Education',
    endDate: ''
  });

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'x-auth-token': token };
      
      const statsRes = await axios.get(`${API}/api/dashboard/stats`, { headers });
      setStats(statsRes.data);

      if (user.role === 'volunteer') {
        // Fetch tasks volunteer has joined
        const tasksRes = await axios.get(`${API}/api/tasks?joined=true`, { headers });
        setTasks(tasksRes.data);
      } else if (user.role === 'donor') {
        const [tasksRes, donationsRes] = await Promise.all([
          axios.get(`${API}/api/tasks?browse=true`), // Browse opportunities
          axios.get(`${API}/api/donations`, { headers }) // Donor history
        ]);
        setTasks(tasksRes.data.slice(0, 5));
        setDonations(donationsRes.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const updateTaskStatus = async (taskId, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/api/tasks/${taskId}`, { status }, {
        headers: { 'x-auth-token': token }
      });
      fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/api/campaigns`, newCampaign, {
        headers: { 'x-auth-token': token }
      });
      setShowCampModal(false);
      setNewCampaign({ title: '', description: '', goalAmount: '', category: 'Education', endDate: '' });
      alert('Campaign published successfully!');
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.msg || 'Error creating campaign.');
    }
  };

  const categories = ['Education', 'Healthcare', 'Environment', 'Disaster Relief', 'Animals', 'Hunger Relief', 'Others'];

  if (loading) return <div className="p-8 text-center text-secondary">Loading dashboard...</div>;

  // 1. ADMIN DASHBOARD VIEW
  if (user.role === 'admin') {
    // Check if the admin user has registered an NGO yet
    if (stats && !stats.hasOrg) {
      return (
        <div className="animate-fade-in" style={{ padding: '0 20px' }}>
          <header className="mb-8">
            <h1 className="text-3xl font-bold">NGO Admin Dashboard</h1>
            <p className="text-secondary mt-2">Welcome to the platform, {user.name}.</p>
          </header>

          <div className="glass-panel text-center" style={{ padding: '48px', maxWidth: '600px', margin: '40px auto' }}>
            <FiAlertCircle size={48} className="text-warning mb-4" />
            <h2 className="text-2xl font-bold mb-3">Complete NGO Profile Setup</h2>
            <p className="text-secondary mb-6">
              NGO360 is a multi-NGO platform. Before you can launch fundraising campaigns or publish volunteer opportunities, you must complete your organization registration.
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/profile')}>
              Set Up Organization Profile
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="animate-fade-in" style={{ padding: '0 20px' }}>
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-secondary mt-2">Workspace metrics for <strong>{stats?.orgName}</strong></p>
          </div>
          <div className="flex gap-3">
            <button className="btn btn-primary" onClick={() => setShowCampModal(true)}>
              <FiPlus /> New Campaign
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/volunteers')}>
              Manage Tasks
            </button>
          </div>
        </header>

        {/* Scoped Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          <div className="glass-card flex items-center gap-4 cursor-pointer" onClick={() => navigate('/donations')}>
            <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.12)', borderRadius: '12px', color: 'var(--success)' }}>
              <FiDollarSign size={24} />
            </div>
            <div>
              <p className="text-xs text-secondary font-semibold">Funds Raised</p>
              <h3 className="text-2xl font-bold mt-1">₹{stats?.totalFunds?.toLocaleString() || 0}</h3>
            </div>
          </div>

          <div className="glass-card flex items-center gap-4" onClick={() => navigate('/donations')}>
            <div style={{ padding: '12px', background: 'rgba(99, 102, 241, 0.12)', borderRadius: '12px', color: 'var(--accent)' }}>
              <FiHeart size={24} />
            </div>
            <div>
              <p className="text-xs text-secondary font-semibold">Total Donations</p>
              <h3 className="text-2xl font-bold mt-1">{stats?.totalDonations || 0}</h3>
            </div>
          </div>

          <div className="glass-card flex items-center gap-4 cursor-pointer" onClick={() => navigate('/volunteers')}>
            <div style={{ padding: '12px', background: 'rgba(245, 158, 11, 0.12)', borderRadius: '12px', color: 'var(--warning)' }}>
              <FiUsers size={24} />
            </div>
            <div>
              <p className="text-xs text-secondary font-semibold">Volunteers Engaged</p>
              <h3 className="text-2xl font-bold mt-1">{stats?.totalVolunteers || 0}</h3>
            </div>
          </div>

          <div className="glass-card flex items-center gap-4 cursor-pointer" onClick={() => navigate('/volunteers')}>
            <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.12)', borderRadius: '12px', color: 'var(--danger)' }}>
              <FiCheckSquare size={24} />
            </div>
            <div>
              <p className="text-xs text-secondary font-semibold">Active Tasks</p>
              <h3 className="text-2xl font-bold mt-1">{stats?.activeTasks || 0}</h3>
            </div>
          </div>
        </div>

        {/* Charts section */}
        <div className="glass-panel mb-8" style={{ padding: '24px', height: '380px' }}>
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <FiTrendingUp className="text-accent" /> Donation & Engagement Trends
          </h3>
          <ResponsiveContainer width="100%" height="80%">
            <BarChart data={stats?.trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="month" stroke="var(--text-secondary)" tick={{fill: 'var(--text-secondary)'}} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" orientation="left" stroke="var(--success)" tick={{fill: 'var(--text-secondary)'}} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" stroke="var(--accent)" tick={{fill: 'var(--text-secondary)'}} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}
                itemStyle={{ color: 'var(--text-primary)' }}
              />
              <Bar yAxisId="left" dataKey="donations" fill="var(--success)" radius={[4, 4, 0, 0]} name="Donations (₹)" />
              <Bar yAxisId="right" dataKey="volunteers" fill="var(--accent)" radius={[4, 4, 0, 0]} name="Engaged Volunteers" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Campaign Creation Modal */}
        {showCampModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="glass-panel" style={{ padding: '32px', width: '100%', maxWidth: '500px' }}>
              <h2 className="text-2xl font-bold mb-6">Launch New Campaign</h2>
              <form onSubmit={handleCreateCampaign} className="flex-col gap-4">
                <div>
                  <label className="text-sm font-semibold mb-2 block">Campaign Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Flood Relief Fund" 
                    value={newCampaign.title} 
                    onChange={e => setNewCampaign({...newCampaign, title: e.target.value})} 
                    required 
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-2 block">Description</label>
                  <textarea 
                    rows="3" 
                    placeholder="Describe the cause, what the funds will be used for..." 
                    value={newCampaign.description} 
                    onChange={e => setNewCampaign({...newCampaign, description: e.target.value})} 
                    required
                  ></textarea>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label className="text-sm font-semibold mb-2 block">Goal Amount (₹)</label>
                    <input 
                      type="number" 
                      min="1" 
                      placeholder="e.g. 50000" 
                      value={newCampaign.goalAmount} 
                      onChange={e => setNewCampaign({...newCampaign, goalAmount: e.target.value})} 
                      required 
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-2 block">Category</label>
                    <select 
                      value={newCampaign.category} 
                      onChange={e => setNewCampaign({...newCampaign, category: e.target.value})}
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold mb-2 block">End Date (Optional)</label>
                  <input 
                    type="date" 
                    value={newCampaign.endDate} 
                    onChange={e => setNewCampaign({...newCampaign, endDate: e.target.value})} 
                  />
                </div>
                <div className="flex justify-between mt-6">
                  <button type="button" className="btn" style={{ background: 'rgba(255,255,255,0.08)' }} onClick={() => setShowCampModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Publish Campaign</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. VOLUNTEER DASHBOARD VIEW
  if (user.role === 'volunteer') {
    return (
      <div className="animate-fade-in" style={{ padding: '0 20px' }}>
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-secondary mt-2">Welcome back, {user.name}. Track your task statistics.</p>
        </header>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '40px' }}>
          <div className="glass-card flex items-center gap-6">
            <div style={{ padding: '16px', background: 'rgba(99, 102, 241, 0.12)', borderRadius: '12px', color: 'var(--accent)' }}>
              <FiCheckSquare size={28} />
            </div>
            <div>
              <p className="text-secondary text-sm font-semibold">Total Registered Tasks</p>
              <h3 className="text-3xl font-bold mt-1">{stats?.totalTasks || 0}</h3>
            </div>
          </div>

          <div className="glass-card flex items-center gap-6">
            <div style={{ padding: '16px', background: 'rgba(245, 158, 11, 0.12)', borderRadius: '12px', color: 'var(--warning)' }}>
              <FiCheckSquare size={28} />
            </div>
            <div>
              <p className="text-secondary text-sm font-semibold">Active Opportunities</p>
              <h3 className="text-3xl font-bold mt-1">{stats?.pendingTasks || 0}</h3>
            </div>
          </div>

          <div className="glass-card flex items-center gap-6">
            <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.12)', borderRadius: '12px', color: 'var(--success)' }}>
              <FiCheckSquare size={28} />
            </div>
            <div>
              <p className="text-secondary text-sm font-semibold">Completed Works</p>
              <h3 className="text-3xl font-bold mt-1">{stats?.completedTasks || 0}</h3>
            </div>
          </div>
        </div>

        {/* My Tasks Section */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 className="text-xl font-bold mb-6">My Joined & Assigned Tasks</h3>
          <div className="flex-col gap-4">
            {tasks.map(task => (
              <div key={task._id} className="glass-card flex justify-between items-center" style={{ padding: '18px 24px' }}>
                <div>
                  <h4 className="font-semibold text-lg">{task.title}</h4>
                  <p className="text-sm text-secondary mt-1">{task.description}</p>
                  {task.organizationId && <p className="text-xs text-accent mt-2 font-semibold">by {task.organizationId.name}</p>}
                </div>
                <div className="flex items-center gap-4">
                  <select 
                    value={task.status} 
                    onChange={(e) => updateTaskStatus(task._id, e.target.value)}
                    style={{ background: 'rgba(0,0,0,0.25)', width: 'auto', padding: '6px 12px' }}
                  >
                    <option value="Pending">Pending</option>
                    <option value="In-progress">In-progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                  <span style={{ 
                    padding: '6px 12px', 
                    borderRadius: '20px', 
                    fontSize: '12px',
                    background: task.status === 'Completed' ? 'rgba(16, 185, 129, 0.15)' : task.status === 'In-progress' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: task.status === 'Completed' ? 'var(--success)' : task.status === 'In-progress' ? 'var(--accent)' : 'var(--warning)'
                  }}>
                    {task.status}
                  </span>
                </div>
              </div>
            ))}
            {tasks.length === 0 && <p className="text-secondary text-center py-8">No tasks joined or assigned to you yet.</p>}
          </div>
        </div>
      </div>
    );
  }

  // 3. DONOR DASHBOARD VIEW
  if (user.role === 'donor') {
    return (
      <div className="animate-fade-in" style={{ padding: '0 20px' }}>
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-secondary mt-2">Welcome back, {user.name}. Thank you for supporting community works.</p>
        </header>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '40px' }}>
          <div className="glass-card flex items-center gap-6 hover:scale-105 transition-transform cursor-pointer" onClick={() => navigate('/donations')}>
            <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.12)', borderRadius: '12px', color: 'var(--success)' }}>
              <FiDollarSign size={28} />
            </div>
            <div>
              <p className="text-secondary text-sm font-semibold">My Total Contributions</p>
              <h3 className="text-3xl font-bold mt-1">₹{stats?.myTotalDonations?.toLocaleString() || 0}</h3>
            </div>
          </div>

          <div className="glass-card flex items-center gap-6">
            <div style={{ padding: '16px', background: 'rgba(99, 102, 241, 0.12)', borderRadius: '12px', color: 'var(--accent)' }}>
              <FiHeart size={28} />
            </div>
            <div>
              <p className="text-secondary text-sm font-semibold">Campaigns Open</p>
              <h3 className="text-3xl font-bold mt-1">{stats?.totalCampaigns || 0}</h3>
            </div>
          </div>

          <div className="glass-card flex items-center gap-6">
            <div style={{ padding: '16px', background: 'rgba(245, 158, 11, 0.12)', borderRadius: '12px', color: 'var(--warning)' }}>
              <FiUsers size={28} />
            </div>
            <div>
              <p className="text-secondary text-sm font-semibold">Partner NGOs</p>
              <h3 className="text-3xl font-bold mt-1">{stats?.totalNgos || 0}</h3>
            </div>
          </div>
        </div>

        {/* Split Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }}>
          
          {/* Left panel: Active Volunteer Events to check out */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Active NGO Volunteering Events</h3>
              <Link to="/opportunities" className="text-sm font-semibold text-accent">Browse All</Link>
            </div>
            <div className="flex-col gap-4" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {tasks.map(task => (
                <div key={task._id} className="glass-card flex justify-between items-center" style={{ padding: '16px 20px' }}>
                  <div>
                    <h4 className="font-semibold text-base">{task.title}</h4>
                    <p className="text-xs text-secondary mt-1">{task.description}</p>
                    {task.organizationId && <p className="text-xs text-accent mt-2 font-semibold">by {task.organizationId.name}</p>}
                  </div>
                  <span style={{ 
                    padding: '6px 12px', 
                    borderRadius: '20px', 
                    fontSize: '11px',
                    background: task.status === 'Completed' ? 'rgba(16, 185, 129, 0.15)' : task.status === 'In-progress' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: task.status === 'Completed' ? 'var(--success)' : task.status === 'In-progress' ? 'var(--accent)' : 'var(--warning)'
                  }}>
                    {task.status}
                  </span>
                </div>
              ))}
              {tasks.length === 0 && <p className="text-secondary text-center py-8">No tasks found.</p>}
            </div>
          </div>

          {/* Right panel: Donation History */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">My Contribution Log</h3>
              <Link to="/donations" className="text-sm font-semibold text-accent">View All</Link>
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <th style={{ padding: '12px 8px', color: 'var(--text-secondary)', fontSize: '12px' }}>Amount</th>
                    <th style={{ padding: '12px 8px', color: 'var(--text-secondary)', fontSize: '12px' }}>Project/Campaign</th>
                    <th style={{ padding: '12px 8px', color: 'var(--text-secondary)', fontSize: '12px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {donations.map((donation) => (
                    <tr key={donation._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '12px 8px' }}>
                        <span className="text-success font-bold">₹{donation.amount}</span>
                      </td>
                      <td style={{ padding: '12px 8px', fontSize: '13px' }}>
                        {donation.campaignId ? (
                          <span className="badge badge-accent" style={{ fontSize: '10px', padding: '2px 8px' }}>
                            {donation.campaignId.title}
                          </span>
                        ) : donation.projectId ? (
                          <span className="badge badge-accent" style={{ fontSize: '10px', padding: '2px 8px' }}>
                            {donation.projectId}
                          </span>
                        ) : (
                          <span className="text-secondary">General Fund</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <span style={{ 
                          padding: '2px 8px', 
                          borderRadius: '12px', 
                          fontSize: '10px',
                          background: donation.status === 'Successful' ? 'rgba(16, 185, 129, 0.15)' : donation.status === 'Pending' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: donation.status === 'Successful' ? 'var(--success)' : donation.status === 'Pending' ? 'var(--warning)' : 'var(--danger)'
                        }}>
                          {donation.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {donations.length === 0 && (
                    <tr>
                      <td colSpan="3" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        No contributions registered.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    );
  }

  return null;
};

export default AdminDashboard;
