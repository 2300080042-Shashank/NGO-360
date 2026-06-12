import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { FiSearch, FiMapPin, FiCompass } from 'react-icons/fi';

const API = window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://ngo-360.onrender.com';

const BrowseNgos = () => {
  const [searchParams] = useSearchParams();
  const [ngos, setNgos] = useState([]);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchNgos = async () => {
    setLoading(true);
    try {
      let url = `${API}/api/organizations?`;
      if (search) url += `name=${encodeURIComponent(search)}&`;
      if (location) url += `location=${encodeURIComponent(location)}&`;

      const res = await axios.get(url);
      setNgos(res.data);
    } catch (err) {
      console.error('Error fetching NGOs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNgos();
  }, [search, location]);

  return (
    <div className="animate-fade-in" style={{ padding: '40px 24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      <header className="mb-8 text-center">
        <div className="flex justify-center mb-3">
          <div style={{ padding: '12px', background: 'rgba(99, 102, 241, 0.12)', borderRadius: '12px', color: 'var(--accent)' }}>
            <FiCompass size={28} />
          </div>
        </div>
        <h1 className="text-3xl font-bold">Browse NGO Organizations</h1>
        <p className="text-secondary mt-2">Discover verified partner organizations working on social causes in your area.</p>
      </header>

      {/* Filter Bar */}
      <div className="glass-panel mb-8" style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <FiSearch style={{ position: 'absolute', left: '16px', color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            placeholder="Search NGO by name..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            style={{ paddingLeft: '44px' }}
          />
        </div>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <FiMapPin style={{ position: 'absolute', left: '16px', color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            placeholder="Filter by city/state..." 
            value={location} 
            onChange={(e) => setLocation(e.target.value)} 
            style={{ paddingLeft: '44px' }}
          />
        </div>
      </div>

      {/* Grid Content */}
      {loading ? (
        <div className="text-center py-12 text-secondary">Loading organizations list...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {ngos.map(ngo => (
            <div key={ngo._id} className="glass-card flex-col">
              <img src={ngo.coverImage} alt={ngo.name} className="card-img-top" />
              <div className="card-body flex-col flex-1" style={{ position: 'relative' }}>
                <div className="flex items-center gap-3 mb-3">
                  <img src={ngo.logo} alt="" className="ngo-mini-logo" style={{ border: '2px solid var(--accent)' }} />
                  <div>
                    <h3 className="text-lg font-bold" style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {ngo.name}
                    </h3>
                    <span className="text-xs text-secondary flex items-center gap-1">
                      <FiMapPin /> {ngo.location}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-secondary line-clamp-3 mb-6">{ngo.description}</p>
                <div className="mt-auto">
                  <Link to={`/ngos/${ngo._id}`} className="btn btn-primary w-full text-center">
                    Visit Profile
                  </Link>
                </div>
              </div>
            </div>
          ))}
          {ngos.length === 0 && (
            <div className="text-center py-12 text-secondary" style={{ gridColumn: '1 / -1' }}>
              No partner NGOs match your current search details.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BrowseNgos;
