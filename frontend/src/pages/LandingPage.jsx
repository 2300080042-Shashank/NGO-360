import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiSearch, FiHeart, FiAward, FiUsers, FiMapPin, FiTrendingUp } from 'react-icons/fi';
import './LandingPage.css';

const API = window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://ngo-360.onrender.com';

const LandingPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [ngos, setNgos] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('ngos');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLandingData = async () => {
      try {
        const [statsRes, ngosRes, campaignsRes, tasksRes] = await Promise.all([
          axios.get(`${API}/api/dashboard/public-stats`),
          axios.get(`${API}/api/organizations`),
          axios.get(`${API}/api/campaigns`),
          axios.get(`${API}/api/tasks?browse=true`) // guest browse tasks
        ]);

        setStats(statsRes.data);
        setNgos(ngosRes.data.slice(0, 3));
        setCampaigns(campaignsRes.data.slice(0, 3));
        setTasks(tasksRes.data.slice(0, 3));
      } catch (err) {
        console.error('Error fetching landing page data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLandingData();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    if (searchType === 'ngos') {
      navigate(`/ngos?search=${encodeURIComponent(searchQuery)}`);
    } else if (searchType === 'campaigns') {
      navigate(`/campaigns?search=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate(`/opportunities?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="landing-page-container animate-fade-in">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <span className="hero-badge">Empowering Communities Globally</span>
          <h1 className="hero-title">
            Connect. Volunteer. Donate.<br />
            <span>Make an Impact.</span>
          </h1>
          <p className="hero-subtitle">
            NGO360 is a transparent, production-style community platform connecting multiple verified non-profit organizations with passionate volunteers and generous donors.
          </p>

          {/* Combined Search Bar */}
          <form onSubmit={handleSearch} className="search-form-hero glass-panel">
            <select 
              value={searchType} 
              onChange={(e) => setSearchType(e.target.value)} 
              className="search-select"
            >
              <option value="ngos">Search NGOs</option>
              <option value="campaigns">Search Campaigns</option>
              <option value="tasks">Search Volunteering</option>
            </select>
            <div className="search-input-wrapper">
              <FiSearch className="search-icon" />
              <input 
                type="text" 
                placeholder={`Search by name, location, cause...`} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
            <button type="submit" className="btn btn-primary search-btn">Search</button>
          </form>

          <div className="hero-buttons mt-8">
            <Link to="/campaigns" className="btn btn-primary btn-lg">Support a Cause</Link>
            <Link to="/opportunities" className="btn btn-secondary btn-lg">Become a Volunteer</Link>
          </div>
        </div>
        <div className="hero-glow"></div>
      </section>

      {/* Platform Statistics */}
      <section className="stats-section">
        <div className="stats-grid max-width-container">
          <div className="stat-item glass-panel">
            <div className="stat-icon-wrap accent">
              <FiHeart size={24} />
            </div>
            <div className="stat-info">
              <h3>₹{stats?.totalFunds?.toLocaleString() || '0'}</h3>
              <p>Total Funds Raised</p>
            </div>
          </div>

          <div className="stat-item glass-panel">
            <div className="stat-icon-wrap success">
              <FiUsers size={24} />
            </div>
            <div className="stat-info">
              <h3>{(stats?.totalVolunteers || 0).toLocaleString()}</h3>
              <p>Registered Volunteers</p>
            </div>
          </div>

          <div className="stat-item glass-panel">
            <div className="stat-icon-wrap warning">
              <FiTrendingUp size={24} />
            </div>
            <div className="stat-info">
              <h3>{(stats?.totalNgos || 0).toLocaleString()}</h3>
              <p>Verified Partner NGOs</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured NGOs */}
      <section className="listings-section max-width-container">
        <div className="section-header">
          <div>
            <h2>Partner Organizations</h2>
            <p className="text-secondary">Verified NGOs making real-world changes across location hubs</p>
          </div>
          <Link to="/ngos" className="view-all-link">Browse All NGOs &rarr;</Link>
        </div>

        <div className="grid grid-3 gap-6">
          {ngos.map(ngo => (
            <div key={ngo._id} className="glass-card flex-col">
              <img src={ngo.coverImage} alt={ngo.name} className="card-img-top" />
              <div className="card-body flex-1 flex-col">
                <div className="flex items-center gap-3 mb-3">
                  <img src={ngo.logo} alt="" className="ngo-mini-logo" />
                  <div>
                    <h3 className="text-lg font-bold text-truncate">{ngo.name}</h3>
                    <span className="text-xs text-secondary flex items-center gap-1">
                      <FiMapPin /> {ngo.location}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-secondary line-clamp-3 mb-4">{ngo.description}</p>
                <div className="mt-auto">
                  <Link to={`/ngos/${ngo._id}`} className="btn btn-secondary w-full text-center">
                    View Profile
                  </Link>
                </div>
              </div>
            </div>
          ))}
          {!loading && ngos.length === 0 && (
            <p className="text-secondary col-span-3 text-center py-12">No NGOs registered yet.</p>
          )}
        </div>
      </section>

      {/* Active Campaigns */}
      <section className="listings-section bg-alt">
        <div className="max-width-container">
          <div className="section-header">
            <div>
              <h2>Urgent Fundraising Campaigns</h2>
              <p className="text-secondary">Help raise critical funding for immediate community support</p>
            </div>
            <Link to="/campaigns" className="view-all-link">View All Campaigns &rarr;</Link>
          </div>

          <div className="grid grid-3 gap-6">
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
            {!loading && campaigns.length === 0 && (
              <p className="text-secondary col-span-3 text-center py-12">No active campaigns found.</p>
            )}
          </div>
        </div>
      </section>

      {/* Volunteer Opportunities */}
      <section className="listings-section max-width-container">
        <div className="section-header">
          <div>
            <h2>Volunteer Tasks & Events</h2>
            <p className="text-secondary">Lend a hand and donate your skills to ongoing charity efforts</p>
          </div>
          <Link to="/opportunities" className="view-all-link">Browse All Tasks &rarr;</Link>
        </div>

        <div className="grid grid-3 gap-6">
          {tasks.map(task => (
            <div key={task._id} className="glass-card flex-col">
              <div className="card-body flex-1 flex-col">
                <span className="badge badge-success mb-3">Active Event</span>
                <h3 className="text-lg font-bold mb-2 text-truncate">{task.title}</h3>
                <p className="text-sm text-secondary line-clamp-3 mb-4">{task.description}</p>
                
                <div className="mt-auto flex-col gap-3">
                  <div className="flex items-center gap-2 text-xs text-secondary">
                    <FiMapPin /> {task.location || 'Remote'}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-secondary">
                    <FiUsers /> {task.volunteers ? task.volunteers.length : 0} / {task.requiredVolunteers || 1} Volunteers Joined
                  </div>
                  
                  {task.skillsNeeded && task.skillsNeeded.length > 0 && (
                    <div className="flex gap-2 flex-wrap mt-2">
                      {task.skillsNeeded.map((skill, i) => (
                        <span key={i} className="skill-chip">{skill}</span>
                      ))}
                    </div>
                  )}

                  <Link to={`/opportunities`} className="btn btn-secondary w-full text-center mt-3">
                    Participate &rarr;
                  </Link>
                </div>
              </div>
            </div>
          ))}
          {!loading && tasks.length === 0 && (
            <p className="text-secondary col-span-3 text-center py-12">No volunteer opportunities found.</p>
          )}
        </div>
      </section>

      {/* Success Stories Section */}
      <section className="success-stories-section max-width-container">
        <h2 className="text-center mb-12">Success Stories</h2>
        <div className="grid grid-2 gap-8">
          {stats?.successStories?.map((story) => (
            <div key={story.id} className="glass-panel story-card">
              <img src={story.image} alt={story.title} className="story-img" />
              <div className="story-body">
                <h3>{story.title}</h3>
                <p className="story-desc text-secondary mt-2">{story.description}</p>
                <div className="story-footer mt-4 flex justify-between items-center text-xs">
                  <span className="text-success font-semibold">Raised: ₹{story.raised.toLocaleString()}</span>
                  <span className="text-accent">{story.ngo}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer mt-16">
        <div className="max-width-container footer-grid">
          <div>
            <h3>NGO<span>360</span></h3>
            <p className="text-secondary mt-2">Connecting non-profits, volunteers, and donors globally to make a sustainable, positive difference.</p>
          </div>
          <div>
            <h4>Browse</h4>
            <ul>
              <li><Link to="/ngos">All NGOs</Link></li>
              <li><Link to="/campaigns">Campaigns</Link></li>
              <li><Link to="/opportunities">Volunteer Tasks</Link></li>
            </ul>
          </div>
          <div>
            <h4>Legal</h4>
            <ul>
              <li><a href="#privacy">Privacy Policy</a></li>
              <li><a href="#terms">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom text-center text-secondary text-xs mt-8">
          &copy; {new Date().getFullYear()} NGO360. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
