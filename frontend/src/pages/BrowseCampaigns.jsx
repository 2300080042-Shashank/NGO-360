import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { FiSearch, FiHeart, FiTag } from 'react-icons/fi';

const API = window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://ngo-360.onrender.com';

const BrowseCampaigns = () => {
  const [searchParams] = useSearchParams();
  const [campaigns, setCampaigns] = useState([]);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      let url = `${API}/api/campaigns?`;
      if (search) url += `title=${encodeURIComponent(search)}&`;
      if (category) url += `category=${encodeURIComponent(category)}&`;

      const res = await axios.get(url);
      setCampaigns(res.data);
    } catch (err) {
      console.error('Error fetching campaigns', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [search, category]);

  const categories = ['Education', 'Healthcare', 'Environment', 'Disaster Relief', 'Animals', 'Hunger Relief', 'Others'];

  return (
    <div className="animate-fade-in" style={{ padding: '40px 24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      <header className="mb-8 text-center">
        <div className="flex justify-center mb-3">
          <div style={{ padding: '12px', background: 'rgba(99, 102, 241, 0.12)', borderRadius: '12px', color: 'var(--accent)' }}>
            <FiHeart size={28} />
          </div>
        </div>
        <h1 className="text-3xl font-bold">Active Fundraising Campaigns</h1>
        <p className="text-secondary mt-2">Support verified charity campaigns. Every donation helps make a change.</p>
      </header>

      {/* Filter Bar */}
      <div className="glass-panel mb-8" style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <FiSearch style={{ position: 'absolute', left: '16px', color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            placeholder="Search campaigns..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            style={{ paddingLeft: '44px' }}
          />
        </div>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <FiTag style={{ position: 'absolute', left: '16px', color: 'var(--text-secondary)', zIndex: 10 }} />
          <select 
            value={category} 
            onChange={(e) => setCategory(e.target.value)} 
            style={{ paddingLeft: '44px' }}
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid Content */}
      {loading ? (
        <div className="text-center py-12 text-secondary">Loading campaigns...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {campaigns.map(camp => {
            const pct = Math.min(100, Math.round((camp.amountRaised / camp.goalAmount) * 100));
            return (
              <div key={camp._id} className="glass-card flex-col">
                <img src={camp.image} alt={camp.title} className="card-img-top" />
                <span className="badge badge-accent category-badge">{camp.category}</span>
                <div className="card-body flex-1 flex-col mt-4">
                  <h3 className="text-lg font-bold mb-2 text-truncate">{camp.title}</h3>
                  <p className="text-sm text-secondary line-clamp-3 mb-4">{camp.description}</p>
                  
                  <div className="mt-auto">
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>Raised: ₹{camp.amountRaised.toLocaleString()}</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="progress-bar-container">
                      <div className="progress-bar-fill" style={{ width: `${pct}%` }}></div>
                    </div>
                    <div className="flex justify-between text-xs text-secondary mb-4">
                      <span>Goal: ₹{camp.goalAmount.toLocaleString()}</span>
                      {camp.organizationId && <span className="ngo-tag">by {camp.organizationId.name}</span>}
                    </div>
                    <Link to={`/campaigns/${camp._id}`} className="btn btn-primary w-full text-center">
                      Donate Now
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
          {campaigns.length === 0 && (
            <div className="text-center py-12 text-secondary" style={{ gridColumn: '1 / -1' }}>
              No fundraising campaigns match your search.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BrowseCampaigns;
