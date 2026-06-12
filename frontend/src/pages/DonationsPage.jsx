import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FiDollarSign } from 'react-icons/fi';

const API = window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://ngo-360.onrender.com';

const DonationsPage = () => {
  const [donations, setDonations] = useState([]);
  const [amount, setAmount] = useState('');
  const [projectId, setProjectId] = useState('');
  
  // Search and Filter States
  const [search, setSearch] = useState('');
  const [project, setProject] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchDonations = async () => {
    try {
      const token = localStorage.getItem('token');
      let url = `${API}/api/donations?`;
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (project) url += `project=${encodeURIComponent(project)}&`;
      if (minAmount) url += `minAmount=${encodeURIComponent(minAmount)}&`;
      if (maxAmount) url += `maxAmount=${encodeURIComponent(maxAmount)}&`;

      const res = await axios.get(url, {
        headers: { 'x-auth-token': token }
      });
      setDonations(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, [search, project, minAmount, maxAmount]);

  const handleDonate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/api/donations`, { amount: Number(amount), projectId }, {
        headers: { 'x-auth-token': token }
      });
      setAmount('');
      setProjectId('');
      fetchDonations();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '0 20px' }}>
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Donations & Impact</h1>
        <p className="text-secondary mt-2">Track contributions and make new donations to support projects.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '24px' }}>
        
        {/* Donation Form */}
        {user.role === 'donor' && (
          <div className="glass-panel" style={{ padding: '24px', height: 'fit-content' }}>
            <div className="flex items-center gap-3 mb-6">
              <div style={{ padding: '12px', background: 'var(--success)', borderRadius: '12px', color: '#fff' }}>
                <FiDollarSign size={24} />
              </div>
              <h3 className="text-xl font-bold">Make a Donation</h3>
            </div>
            
            <form onSubmit={handleDonate} className="flex-col gap-4">
              <div>
                <label className="text-sm font-semibold mb-2 block">Amount ($)</label>
                <input 
                  type="number" 
                  min="1" 
                  value={amount} 
                  onChange={e => setAmount(e.target.value)} 
                  placeholder="e.g. 100"
                  required 
                />
              </div>
              <div>
                <label className="text-sm font-semibold mb-2 block">Project (Optional)</label>
                <input 
                  type="text" 
                  value={projectId} 
                  onChange={e => setProjectId(e.target.value)} 
                  placeholder="e.g. Clean Water Initiative"
                />
              </div>
              <button type="submit" className="btn btn-success w-full mt-4 text-lg">
                Donate Now
              </button>
            </form>
          </div>
        )}

        {/* Donations List */}
        <div className="glass-panel" style={{ padding: '24px', gridColumn: user.role === 'donor' ? 'auto' : '1 / -1' }}>
          <h3 className="text-xl font-bold mb-6">Recent Donations</h3>
          
          {/* Donations Filter Bar */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
            gap: '12px', 
            marginBottom: '24px',
            background: 'rgba(255,255,255,0.02)', 
            padding: '16px', 
            borderRadius: '12px', 
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            <div>
              <label className="text-xs text-secondary mb-1 block">Search Project/Donor</label>
              <input 
                type="text" 
                placeholder="Search..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                style={{ padding: '8px 12px', fontSize: '13px' }}
              />
            </div>
            <div>
              <label className="text-xs text-secondary mb-1 block">Project ID</label>
              <input 
                type="text" 
                placeholder="Filter project..." 
                value={project} 
                onChange={e => setProject(e.target.value)} 
                style={{ padding: '8px 12px', fontSize: '13px' }}
              />
            </div>
            <div>
              <label className="text-xs text-secondary mb-1 block">Min Amount ($)</label>
              <input 
                type="number" 
                placeholder="Min..." 
                value={minAmount} 
                onChange={e => setMinAmount(e.target.value)} 
                style={{ padding: '8px 12px', fontSize: '13px' }}
              />
            </div>
            <div>
              <label className="text-xs text-secondary mb-1 block">Max Amount ($)</label>
              <input 
                type="number" 
                placeholder="Max..." 
                value={maxAmount} 
                onChange={e => setMaxAmount(e.target.value)} 
                style={{ padding: '8px 12px', fontSize: '13px' }}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: '600' }}>Donor Info</th>
                  <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: '600' }}>Amount</th>
                  <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: '600' }}>Project</th>
                  <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: '600' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {donations.map((donation) => (
                  <tr key={donation._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '16px' }}>
                      <div className="font-semibold">{donation.donorId?.name}</div>
                      <div className="text-xs text-secondary">{donation.donorId?.email}</div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span className="text-success font-bold text-lg">${donation.amount}</span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      {donation.projectId ? (
                        <span style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent)', padding: '4px 10px', borderRadius: '20px', fontSize: '12px' }}>
                          {donation.projectId}
                        </span>
                      ) : (
                        <span className="text-secondary text-sm">General Fund</span>
                      )}
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                      {new Date(donation.date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {donations.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      No donations found.
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
};

export default DonationsPage;
