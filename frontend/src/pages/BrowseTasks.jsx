import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { FiSearch, FiMapPin, FiAward, FiUsers, FiClock, FiCheck } from 'react-icons/fi';

const API = window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://ngo-360.onrender.com';

const BrowseTasks = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchTasks = async () => {
    setLoading(true);
    try {
      let url = `${API}/api/tasks?browse=true&`;
      if (search) url += `title=${encodeURIComponent(search)}&`;
      if (location) url += `location=${encodeURIComponent(location)}&`;

      // Pass token if exists to let backend calculate roles or user status
      const headers = token ? { 'x-auth-token': token } : {};
      const res = await axios.get(url, { headers });
      setTasks(res.data);
    } catch (err) {
      console.error('Error fetching volunteer tasks', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [search, location]);

  const handleParticipate = async (taskId) => {
    if (!token) {
      alert('Please sign in to join volunteer events.');
      navigate('/login');
      return;
    }

    if (user.role !== 'volunteer') {
      alert('Only users registered as Volunteers can participate in opportunities.');
      return;
    }

    try {
      await axios.post(`${API}/api/tasks/${taskId}/participate`, {}, {
        headers: { 'x-auth-token': token }
      });
      alert('Successfully registered as a participant! Check your dashboard under "My Tasks" to track status.');
      fetchTasks();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.msg || 'Error signing up for the volunteer task.');
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '40px 24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      <header className="mb-8 text-center">
        <div className="flex justify-center mb-3">
          <div style={{ padding: '12px', background: 'rgba(99, 102, 241, 0.12)', borderRadius: '12px', color: 'var(--accent)' }}>
            <FiAward size={28} />
          </div>
        </div>
        <h1 className="text-3xl font-bold">Volunteer Opportunities</h1>
        <p className="text-secondary mt-2">Find and participate in local social works. Lend your skills to helper causes.</p>
      </header>

      {/* Filter Bar */}
      <div className="glass-panel mb-8 responsive-grid-2-col" style={{ padding: '16px', gridTemplateColumns: '1.5fr 1fr' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <FiSearch style={{ position: 'absolute', left: '16px', color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            placeholder="Search volunteering events by title..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            style={{ paddingLeft: '44px' }}
          />
        </div>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <FiMapPin style={{ position: 'absolute', left: '16px', color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            placeholder="Filter by location/city..." 
            value={location} 
            onChange={(e) => setLocation(e.target.value)} 
            style={{ paddingLeft: '44px' }}
          />
        </div>
      </div>

      {/* Grid Content */}
      {loading ? (
        <div className="text-center py-12 text-secondary">Loading volunteer opportunities...</div>
      ) : (
        <div className="responsive-grid-cards">
          {tasks.map(task => {
            const hasJoined = task.volunteers && task.volunteers.some(v => v._id === user.id || v === user.id);
            const isFull = task.volunteers && task.volunteers.length >= (task.requiredVolunteers || 1);
            
            return (
              <div key={task._id} className="glass-card flex-col">
                <div className="card-body flex-1 flex-col">
                  <div className="flex justify-between items-start mb-3">
                    <span className="badge badge-accent">Volunteer Opportunity</span>
                    <span className={`badge ${task.status === 'Completed' ? 'badge-success' : 'badge-warning'}`}>
                      {task.status}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-bold mb-2 text-truncate">{task.title}</h3>
                  {task.organizationId && (
                    <p className="text-xs text-accent mb-3" style={{ fontWeight: '600' }}>
                      by {task.organizationId.name}
                    </p>
                  )}
                  <p className="text-sm text-secondary line-clamp-3 mb-4">{task.description}</p>
                  
                  <div className="mt-auto flex-col gap-2 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="flex items-center gap-2 text-xs text-secondary">
                      <FiMapPin /> {task.location || 'Remote'}
                    </div>
                    {task.date && (
                      <div className="flex items-center gap-2 text-xs text-secondary">
                        <FiClock /> {new Date(task.date).toLocaleDateString()}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-secondary">
                      <FiUsers /> {task.volunteers ? task.volunteers.length : 0} / {task.requiredVolunteers || 1} Volunteers Joined
                    </div>
                    
                    {task.skillsNeeded && task.skillsNeeded.length > 0 && (
                      <div className="flex gap-2 flex-wrap mt-2 mb-4">
                        {task.skillsNeeded.map((skill, i) => (
                          <span key={i} className="skill-chip">{skill}</span>
                        ))}
                      </div>
                    )}

                    {hasJoined ? (
                      <button className="btn btn-success w-full mt-3" disabled style={{ opacity: 0.8, cursor: 'not-allowed' }}>
                        <FiCheck /> Joined
                      </button>
                    ) : isFull ? (
                      <button className="btn btn-secondary w-full mt-3" disabled style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                        Opportunity Full
                      </button>
                    ) : token && user.role !== 'volunteer' ? (
                      <button className="btn btn-secondary w-full mt-3" disabled style={{ opacity: 0.6 }} title="Only Volunteers can participate">
                        Participate (Volunteers Only)
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleParticipate(task._id)} 
                        className="btn btn-primary w-full mt-3"
                      >
                        Participate
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {tasks.length === 0 && (
            <div className="text-center py-12 text-secondary" style={{ gridColumn: '1 / -1' }}>
              No volunteer opportunities match your search query.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BrowseTasks;
