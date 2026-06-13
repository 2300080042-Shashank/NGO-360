import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { FiMapPin, FiMail, FiPhone, FiGlobe, FiHeart, FiAward, FiCalendar, FiUsers } from 'react-icons/fi';

const API = window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://ngo-360.onrender.com';

const NgoProfile = () => {
  const { id } = useParams();
  const [org, setOrg] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNgoDetails = async () => {
      try {
        const [orgRes, campaignsRes, tasksRes] = await Promise.all([
          axios.get(`${API}/api/organizations/${id}`),
          axios.get(`${API}/api/campaigns?organizationId=${id}`),
          axios.get(`${API}/api/tasks?organizationId=${id}`)
        ]);

        setOrg(orgRes.data);
        setCampaigns(campaignsRes.data);
        setTasks(tasksRes.data);
      } catch (err) {
        console.error('Error fetching NGO profile data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNgoDetails();
  }, [id]);

  if (loading) {
    return <div className="p-12 text-center text-secondary">Loading NGO profile...</div>;
  }

  if (!org) {
    return <div className="p-12 text-center text-secondary">NGO profile not found.</div>;
  }

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '60px' }}>
      {/* Cover Image & Branding Header */}
      <div className="ngo-cover-banner" style={{ background: `url(${org.coverImage}) center/cover no-repeat` }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to bottom, rgba(11, 15, 25, 0.2), rgba(11, 15, 25, 0.9))' }}></div>
        <div className="ngo-branding-container">
          <img src={org.logo} alt="" style={{ width: '130px', height: '130px', borderRadius: '24px', border: '4px solid var(--bg-primary)', objectFit: 'cover', background: 'var(--bg-secondary)', boxShadow: 'var(--shadow-lg)' }} />
          <div style={{ paddingBottom: '16px' }}>
            <h1 className="text-4xl font-bold">{org.name}</h1>
            <p className="text-secondary flex items-center gap-1 mt-1"><FiMapPin /> {org.location}</p>
          </div>
        </div>
      </div>

      {/* Profile Details Area */}
      <div className="ngo-details-grid max-width-container">
        
        {/* Left Side: Description, Mission, Campaigns */}
        <div className="flex-col gap-8">
          
          {/* About & Mission */}
          <div className="glass-panel" style={{ padding: '32px' }}>
            <h3 className="text-2xl font-bold mb-4">About Us</h3>
            <p className="text-secondary mb-6" style={{ whiteSpace: 'pre-wrap' }}>{org.description}</p>
            
            {org.mission && (
              <>
                <h4 className="text-lg font-semibold mb-2 text-accent">Our Mission</h4>
                <p className="text-secondary italic">{org.mission}</p>
              </>
            )}
          </div>

          {/* Active Campaigns */}
          <div>
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <FiHeart className="text-danger" /> Active Campaigns ({campaigns.length})
            </h3>
            <div className="responsive-grid-cards">
              {campaigns.map(camp => {
                const pct = Math.min(100, Math.round((camp.amountRaised / camp.goalAmount) * 100));
                return (
                  <div key={camp._id} className="glass-card flex-col">
                    <img src={camp.image} alt={camp.title} className="card-img-top" style={{ height: '160px' }} />
                    <div className="card-body flex-1 flex-col mt-2">
                      <h4 className="font-bold text-base text-truncate">{camp.title}</h4>
                      <div className="progress-bar-container mt-4">
                        <div className="progress-bar-fill" style={{ width: `${pct}%` }}></div>
                      </div>
                      <div className="flex justify-between text-xs text-secondary mb-4">
                        <span>Raised: ₹{camp.amountRaised.toLocaleString()}</span>
                        <span>{pct}%</span>
                      </div>
                      <Link to={`/campaigns/${camp._id}`} className="btn btn-primary btn-sm w-full text-center">
                        View & Donate
                      </Link>
                    </div>
                  </div>
                );
              })}
              {campaigns.length === 0 && (
                <p className="text-secondary" style={{ gridColumn: '1 / -1' }}>No active campaigns published currently.</p>
              )}
            </div>
          </div>

          {/* Volunteer Opportunities */}
          <div>
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <FiAward className="text-success" /> Volunteer Opportunities ({tasks.length})
            </h3>
            <div className="responsive-grid-cards">
              {tasks.map(task => (
                <div key={task._id} className="glass-card flex-col">
                  <div className="card-body flex-1 flex-col">
                    <h4 className="font-bold text-base text-truncate">{task.title}</h4>
                    <p className="text-xs text-secondary line-clamp-3 my-3">{task.description}</p>
                    <div className="mt-auto flex-col gap-1 pt-3 text-xs text-secondary" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <span className="flex items-center gap-1"><FiMapPin /> {task.location || 'Remote'}</span>
                      <span className="flex items-center gap-1"><FiUsers /> {task.volunteers ? task.volunteers.length : 0} / {task.requiredVolunteers || 1} joined</span>
                    </div>
                    <Link to="/opportunities" className="btn btn-secondary btn-sm w-full text-center mt-3">
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
              {tasks.length === 0 && (
                <p className="text-secondary" style={{ gridColumn: '1 / -1' }}>No volunteer opportunities published currently.</p>
              )}
            </div>
          </div>

        </div>

        {/* Right Side: Contact Details */}
        <div className="flex-col gap-6" style={{ height: 'fit-content' }}>
          
          <div className="glass-panel" style={{ padding: '28px' }}>
            <h3 className="text-lg font-bold mb-6" style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>
              Contact Details
            </h3>

            <div className="flex-col gap-4">
              {org.contactDetails?.email && (
                <div className="flex items-center gap-3">
                  <FiMail className="text-accent" size={18} />
                  <div>
                    <span className="text-xs text-secondary block">Email</span>
                    <span className="text-sm font-semibold">{org.contactDetails.email}</span>
                  </div>
                </div>
              )}

              {org.contactDetails?.phone && (
                <div className="flex items-center gap-3">
                  <FiPhone className="text-success" size={18} />
                  <div>
                    <span className="text-xs text-secondary block">Phone</span>
                    <span className="text-sm font-semibold">{org.contactDetails.phone}</span>
                  </div>
                </div>
              )}

              {org.contactDetails?.website && (
                <div className="flex items-center gap-3">
                  <FiGlobe className="text-warning" size={18} />
                  <div>
                    <span className="text-xs text-secondary block">Website</span>
                    <a href={org.contactDetails.website.startsWith('http') ? org.contactDetails.website : `https://${org.contactDetails.website}`} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-accent">
                      {org.contactDetails.website}
                    </a>
                  </div>
                </div>
              )}

              {!org.contactDetails?.email && !org.contactDetails?.phone && !org.contactDetails?.website && (
                <p className="text-sm italic text-secondary text-center">No contact info provided.</p>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default NgoProfile;
