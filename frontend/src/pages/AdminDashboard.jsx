import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FiUsers, FiHeart, FiCheckSquare, FiDollarSign } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const API = "https://ngo-360.onrender.com";

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'x-auth-token': token };
      
      const statsRes = await axios.get(`${API}/api/dashboard/stats`, { headers });
      setStats(statsRes.data);

      if (user.role === 'volunteer') {
        const tasksRes = await axios.get(`${API}/api/tasks`, { headers });
        setTasks(tasksRes.data);
      } else if (user.role === 'donor') {
        const [tasksRes, donationsRes] = await Promise.all([
          axios.get(`${API}/api/tasks`, { headers }),
          axios.get(`${API}/api/donations`, { headers })
        ]);
        setTasks(tasksRes.data);
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

  // Dummy chart data for UI purposes
  const chartData = [
    { name: 'Jan', donations: 4000, volunteers: 24 },
    { name: 'Feb', donations: 3000, volunteers: 13 },
    { name: 'Mar', donations: 2000, volunteers: 38 },
    { name: 'Apr', donations: 2780, volunteers: 39 },
    { name: 'May', donations: 1890, volunteers: 48 },
    { name: 'Jun', donations: 2390, volunteers: 38 },
  ];

  if (loading) return <div className="p-8 text-center text-secondary">Loading dashboard...</div>;

  // 1. ADMIN DASHBOARD VIEW
  if (user.role === 'admin') {
    return (
      <div className="animate-fade-in" style={{ padding: '0 20px' }}>
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-secondary mt-2">Welcome back. Here's what's happening today.</p>
        </header>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '40px' }}>
          <div className="glass-card flex items-center gap-6 hover:scale-105 transition-transform cursor-pointer" onClick={() => navigate('/volunteers')}>
            <div style={{ padding: '16px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', color: 'var(--accent)' }}>
              <FiUsers size={28} />
            </div>
            <div>
              <p className="text-secondary text-sm font-semibold text-uppercase">Total Volunteers</p>
              <h3 className="text-3xl font-bold mt-1">{stats?.totalVolunteers || 0}</h3>
            </div>
          </div>

          <div className="glass-card flex items-center gap-6 hover:scale-105 transition-transform cursor-pointer" onClick={() => navigate('/donations')}>
            <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', color: 'var(--success)' }}>
              <FiHeart size={28} />
            </div>
            <div>
              <p className="text-secondary text-sm font-semibold text-uppercase">Total Donors</p>
              <h3 className="text-3xl font-bold mt-1">{stats?.totalDonors || 0}</h3>
            </div>
          </div>

          <div className="glass-card flex items-center gap-6 hover:scale-105 transition-transform cursor-pointer" onClick={() => navigate('/donations')}>
            <div style={{ padding: '16px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '12px', color: 'var(--warning)' }}>
              <FiDollarSign size={28} />
            </div>
            <div>
              <p className="text-secondary text-sm font-semibold text-uppercase">Funds Raised</p>
              <h3 className="text-3xl font-bold mt-1">${stats?.totalFunds || 0}</h3>
            </div>
          </div>

          <div className="glass-card flex items-center gap-6 hover:scale-105 transition-transform cursor-pointer" onClick={() => navigate('/volunteers')}>
            <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', color: 'var(--danger)' }}>
              <FiCheckSquare size={28} />
            </div>
            <div>
              <p className="text-secondary text-sm font-semibold text-uppercase">Active Projects</p>
              <h3 className="text-3xl font-bold mt-1">{stats?.activeProjects || 0}</h3>
            </div>
          </div>
        </div>

        {/* Charts section */}
        <div className="glass-panel" style={{ padding: '24px', height: '400px' }}>
          <h3 className="text-xl font-bold mb-6">Impact Overview</h3>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{fill: 'var(--text-secondary)'}} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" orientation="left" stroke="var(--accent)" tick={{fill: 'var(--text-secondary)'}} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" stroke="var(--success)" tick={{fill: 'var(--text-secondary)'}} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}
                itemStyle={{ color: 'var(--text-primary)' }}
              />
              <Bar yAxisId="left" dataKey="donations" fill="var(--accent)" radius={[4, 4, 0, 0]} name="Donations ($)" />
              <Bar yAxisId="right" dataKey="volunteers" fill="var(--success)" radius={[4, 4, 0, 0]} name="Volunteers" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  // 2. VOLUNTEER DASHBOARD VIEW
  if (user.role === 'volunteer') {
    return (
      <div className="animate-fade-in" style={{ padding: '0 20px' }}>
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-secondary mt-2">Welcome back, {user.name}. Here are your task statistics.</p>
        </header>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '40px' }}>
          <div className="glass-card flex items-center gap-6">
            <div style={{ padding: '16px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', color: 'var(--accent)' }}>
              <FiCheckSquare size={28} />
            </div>
            <div>
              <p className="text-secondary text-sm font-semibold text-uppercase">Assigned Tasks</p>
              <h3 className="text-3xl font-bold mt-1">{stats?.totalTasks || 0}</h3>
            </div>
          </div>

          <div className="glass-card flex items-center gap-6">
            <div style={{ padding: '16px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '12px', color: 'var(--warning)' }}>
              <FiCheckSquare size={28} />
            </div>
            <div>
              <p className="text-secondary text-sm font-semibold text-uppercase">Active / Pending</p>
              <h3 className="text-3xl font-bold mt-1">{stats?.pendingTasks || 0}</h3>
            </div>
          </div>

          <div className="glass-card flex items-center gap-6">
            <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', color: 'var(--success)' }}>
              <FiCheckSquare size={28} />
            </div>
            <div>
              <p className="text-secondary text-sm font-semibold text-uppercase">Completed Tasks</p>
              <h3 className="text-3xl font-bold mt-1">{stats?.completedTasks || 0}</h3>
            </div>
          </div>
        </div>

        {/* My Tasks Section */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 className="text-xl font-bold mb-6">My Assigned Tasks</h3>
          <div className="flex-col gap-4">
            {tasks.map(task => (
              <div key={task._id} className="glass-card flex justify-between items-center">
                <div>
                  <h4 className="font-semibold text-lg">{task.title}</h4>
                  <p className="text-sm text-secondary mt-1">{task.description}</p>
                </div>
                <div className="flex items-center gap-4">
                  <select 
                    value={task.status} 
                    onChange={(e) => updateTaskStatus(task._id, e.target.value)}
                    style={{ background: 'rgba(0,0,0,0.2)', width: 'auto' }}
                  >
                    <option value="Pending">Pending</option>
                    <option value="In-progress">In-progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                  <span style={{ 
                    padding: '6px 12px', 
                    borderRadius: '20px', 
                    fontSize: '12px',
                    background: task.status === 'Completed' ? 'rgba(16, 185, 129, 0.2)' : task.status === 'In-progress' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                    color: task.status === 'Completed' ? 'var(--success)' : task.status === 'In-progress' ? 'var(--accent)' : 'var(--warning)'
                  }}>
                    {task.status}
                  </span>
                </div>
              </div>
            ))}
            {tasks.length === 0 && <p className="text-secondary text-center py-8">No tasks assigned to you yet.</p>}
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
          <p className="text-secondary mt-2">Welcome back, {user.name}. Thank you for your generous support.</p>
        </header>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '40px' }}>
          <div className="glass-card flex items-center gap-6 hover:scale-105 transition-transform cursor-pointer" onClick={() => navigate('/donations')}>
            <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', color: 'var(--success)' }}>
              <FiDollarSign size={28} />
            </div>
            <div>
              <p className="text-secondary text-sm font-semibold text-uppercase">My Contributions</p>
              <h3 className="text-3xl font-bold mt-1">${stats?.myTotalDonations || 0}</h3>
            </div>
          </div>

          <div className="glass-card flex items-center gap-6">
            <div style={{ padding: '16px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', color: 'var(--accent)' }}>
              <FiHeart size={28} />
            </div>
            <div>
              <p className="text-secondary text-sm font-semibold text-uppercase">Total NGO Funds</p>
              <h3 className="text-3xl font-bold mt-1">${stats?.totalFunds || 0}</h3>
            </div>
          </div>

          <div className="glass-card flex items-center gap-6">
            <div style={{ padding: '16px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '12px', color: 'var(--warning)' }}>
              <FiCheckSquare size={28} />
            </div>
            <div>
              <p className="text-secondary text-sm font-semibold text-uppercase">Active Projects</p>
              <h3 className="text-3xl font-bold mt-1">{stats?.activeProjects || 0}</h3>
            </div>
          </div>
        </div>

        {/* Split Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }}>
          
          {/* Left panel: Active Tasks */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 className="text-xl font-bold mb-6">Active NGO Projects & Tasks</h3>
            <div className="flex-col gap-4" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {tasks.map(task => (
                <div key={task._id} className="glass-card flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold text-base">{task.title}</h4>
                    <p className="text-xs text-secondary mt-1">{task.description}</p>
                    <p className="text-xs text-accent mt-2">
                      Assigned to: {task.assignedTo ? task.assignedTo.name : 'Unassigned'}
                    </p>
                  </div>
                  <span style={{ 
                    padding: '6px 12px', 
                    borderRadius: '20px', 
                    fontSize: '11px',
                    background: task.status === 'Completed' ? 'rgba(16, 185, 129, 0.2)' : task.status === 'In-progress' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(245, 158, 11, 0.2)',
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
            <h3 className="text-xl font-bold mb-6">My Donation History</h3>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <th style={{ padding: '12px 8px', color: 'var(--text-secondary)', fontSize: '12px' }}>Amount</th>
                    <th style={{ padding: '12px 8px', color: 'var(--text-secondary)', fontSize: '12px' }}>Project / Cause</th>
                  </tr>
                </thead>
                <tbody>
                  {donations.map((donation) => (
                    <tr key={donation._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '12px 8px' }}>
                        <span className="text-success font-bold">${donation.amount}</span>
                      </td>
                      <td style={{ padding: '12px 8px', fontSize: '13px' }}>
                        {donation.projectId ? (
                          <span style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent)', padding: '2px 8px', borderRadius: '12px', fontSize: '11px' }}>
                            {donation.projectId}
                          </span>
                        ) : (
                          <span className="text-secondary">General Fund</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {donations.length === 0 && (
                    <tr>
                      <td colSpan="2" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        No donations made yet.
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
