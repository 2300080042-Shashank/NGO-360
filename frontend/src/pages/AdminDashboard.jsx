import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FiUsers, FiHeart, FiCheckSquare, FiDollarSign } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const API = "https://ngo-360.onrender.com";

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API}/api/dashboard/stats`, {
          headers: { 'x-auth-token': token }
        });
        setStats(res.data);
      } catch (err) {
        console.error('Error fetching stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

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

        <div className="glass-card flex items-center gap-6 hover:scale-105 transition-transform cursor-pointer" onClick={() => alert('Projects page coming soon!')}>
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
};

export default AdminDashboard;
