import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FiPlus, FiUsers, FiClock, FiMapPin, FiCalendar } from 'react-icons/fi';

const API = window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://ngo-360.onrender.com';

const VolunteerManagement = () => {
  const [tasks, setTasks] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [org, setOrg] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assignedTo: '',
    location: '',
    date: '',
    requiredVolunteers: '1',
    skillsNeeded: ''
  });

  // Search and Filter States
  const [taskSearch, setTaskSearch] = useState('');
  const [taskStatus, setTaskStatus] = useState('');
  const [volunteerName, setVolunteerName] = useState('');
  const [volunteerSkill, setVolunteerSkill] = useState('');

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'x-auth-token': token };

      let tasksUrl = `${API}/api/tasks?`;
      if (taskSearch) tasksUrl += `title=${encodeURIComponent(taskSearch)}&`;
      if (taskStatus) tasksUrl += `status=${encodeURIComponent(taskStatus)}&`;

      if (user.role === 'admin') {
        // Fetch current admin's NGO first to filter tasks
        try {
          const orgRes = await axios.get(`${API}/api/organizations/my`, { headers });
          setOrg(orgRes.data);
          tasksUrl += `organizationId=${orgRes.data._id}&`;
        } catch (orgErr) {
          console.warn('NGO Profile not registered yet for this admin.');
          setOrg(null);
        }

        let volsUrl = `${API}/api/volunteers?`;
        if (volunteerName) volsUrl += `name=${encodeURIComponent(volunteerName)}&`;
        if (volunteerSkill) volsUrl += `skill=${encodeURIComponent(volunteerSkill)}&`;

        const [tasksRes, volRes] = await Promise.all([
          axios.get(tasksUrl, { headers }),
          axios.get(volsUrl, { headers })
        ]);
        setTasks(tasksRes.data);
        setVolunteers(volRes.data);
      } else {
        // Volunteer: fetch tasks assigned/joined
        tasksUrl += `joined=true&`;
        const tasksRes = await axios.get(tasksUrl, { headers });
        setTasks(tasksRes.data);
        setVolunteers([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [taskSearch, taskStatus, volunteerName, volunteerSkill]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (user.role === 'admin' && !org) {
      alert('Please complete your NGO organization profile in Settings first.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/api/tasks`, newTask, {
        headers: { 'x-auth-token': token }
      });
      setShowTaskModal(false);
      setNewTask({
        title: '',
        description: '',
        assignedTo: '',
        location: '',
        date: '',
        requiredVolunteers: '1',
        skillsNeeded: ''
      });
      alert('Volunteer opportunity published successfully!');
      fetchData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.msg || 'Error creating task.');
    }
  };

  const updateTaskStatus = async (taskId, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/api/tasks/${taskId}`, { status }, {
        headers: { 'x-auth-token': token }
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '0 20px' }}>
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">{user.role === 'admin' ? 'Volunteer Management' : 'My Volunteering Work'}</h1>
          <p className="text-secondary mt-2">
            {user.role === 'admin' 
              ? `Publish volunteer opportunities and track volunteer participation for ${org?.name || 'your NGO'}.`
              : 'Track status and update your progress for joined or assigned volunteer opportunities.'}
          </p>
        </div>
        {user.role === 'admin' && (
          <button className="btn btn-primary" onClick={() => setShowTaskModal(true)}>
            <FiPlus /> Create Opportunity
          </button>
        )}
      </header>

      {user.role === 'admin' && !org && (
        <div className="glass-panel text-center mb-8" style={{ padding: '24px', borderLeft: '4px solid var(--warning)' }}>
          <p className="text-warning font-semibold">NGO Organization profile not registered yet. Please register your NGO profile under settings in order to start assigning tasks.</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: user.role === 'admin' ? '2fr 1fr' : '1fr', gap: '24px' }}>
        
        {/* Task List */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 className="text-xl font-bold mb-6">{user.role === 'admin' ? 'Published Opportunities' : 'My Tasks'}</h3>
          
          {/* Tasks Filter Bar */}
          <div className="flex gap-4 mb-6" style={{ background: 'rgba(255,255,255,0.01)', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
            <input 
              type="text" 
              placeholder="Search by title..." 
              value={taskSearch} 
              onChange={e => setTaskSearch(e.target.value)} 
              style={{ flex: 2 }}
            />
            <select 
              value={taskStatus} 
              onChange={e => setTaskStatus(e.target.value)}
              style={{ flex: 1 }}
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div className="flex-col gap-4">
            {tasks.map(task => (
              <div key={task._id} className="glass-card flex justify-between items-center" style={{ padding: '20px 24px' }}>
                <div style={{ flex: 1, marginRight: '16px' }}>
                  <h4 className="font-semibold text-lg">{task.title}</h4>
                  <p className="text-sm text-secondary mt-1">{task.description}</p>
                  
                  <div className="flex flex-wrap gap-4 mt-3 text-xs text-secondary">
                    {task.location && (
                      <span className="flex items-center gap-1"><FiMapPin /> {task.location}</span>
                    )}
                    {task.date && (
                      <span className="flex items-center gap-1"><FiClock /> {new Date(task.date).toLocaleDateString()}</span>
                    )}
                    <span className="flex items-center gap-1"><FiUsers /> {task.volunteers ? task.volunteers.length : 0} Joined</span>
                  </div>

                  {task.assignedTo && (
                    <p className="text-xs text-accent mt-2">
                      Assigned To: {task.assignedTo.name} ({task.assignedTo.email})
                    </p>
                  )}
                  {task.volunteers && task.volunteers.length > 0 && (
                    <div className="mt-2 text-xs" style={{ background: 'rgba(255,255,255,0.02)', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)', display: 'inline-block' }}>
                      <strong className="text-accent">Joined Volunteers:</strong>{' '}
                      {task.volunteers.map(v => v.name).join(', ')}
                    </div>
                  )}
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
                    fontSize: '11px',
                    background: task.status === 'Completed' ? 'rgba(16, 185, 129, 0.15)' : task.status === 'In-progress' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: task.status === 'Completed' ? 'var(--success)' : task.status === 'In-progress' ? 'var(--accent)' : 'var(--warning)'
                  }}>
                    {task.status}
                  </span>
                </div>
              </div>
            ))}
            {tasks.length === 0 && <p className="text-secondary text-center py-8">No opportunities found.</p>}
          </div>
        </div>

        {/* Volunteers List */}
        {user.role === 'admin' && (
          <div className="glass-panel" style={{ padding: '24px', height: 'fit-content' }}>
            <h3 className="text-xl font-bold mb-6">Active Platform Volunteers</h3>
            
            {/* Volunteers Filter Bar */}
            <div className="flex-col gap-2 mb-6" style={{ background: 'rgba(255,255,255,0.01)', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
              <input 
                type="text" 
                placeholder="Search volunteer name..." 
                value={volunteerName} 
                onChange={e => setVolunteerName(e.target.value)} 
                style={{ fontSize: '13px' }}
              />
              <input 
                type="text" 
                placeholder="Search skills..." 
                value={volunteerSkill} 
                onChange={e => setVolunteerSkill(e.target.value)} 
                style={{ fontSize: '13px', marginTop: '8px' }}
              />
            </div>

            <div className="flex-col gap-4" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {volunteers.map(vol => (
                <div key={vol._id} className="glass-card" style={{ padding: '16px' }}>
                  <div className="flex items-center gap-3">
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px' }}>
                      {vol.userId?.name?.charAt(0) || 'V'}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{vol.userId?.name || 'Volunteer'}</h4>
                      <p className="text-xs text-secondary">{vol.userId?.email || ''}</p>
                    </div>
                  </div>
                  {vol.skills && vol.skills.length > 0 && (
                    <div className="mt-3 flex gap-1.5 flex-wrap">
                      {vol.skills.map((skill, idx) => (
                        <span key={idx} className="skill-chip" style={{ fontSize: '10px', padding: '1px 6px' }}>{skill}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {volunteers.length === 0 && <p className="text-secondary text-center py-8">No volunteers found.</p>}
            </div>
          </div>
        )}
      </div>

      {/* Task Creation Modal */}
      {showTaskModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ padding: '32px', width: '100%', maxWidth: '500px' }}>
            <h2 className="text-2xl font-bold mb-6">Publish Volunteer Opportunity</h2>
            <form onSubmit={handleCreateTask} className="flex-col gap-4">
              <div>
                <label className="text-sm font-semibold mb-2 block">Opportunity Title</label>
                <input type="text" placeholder="e.g. Tree Plantation Drive" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} required />
              </div>
              
              <div>
                <label className="text-sm font-semibold mb-2 block">Description</label>
                <textarea rows="3" placeholder="Describe the tasks, shifts, expectations..." value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} required></textarea>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="text-sm font-semibold mb-2 block">Location</label>
                  <input type="text" placeholder="e.g. Connaught Place, Delhi" value={newTask.location} onChange={e => setNewTask({...newTask, location: e.target.value})} required />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-2 block">Event Date</label>
                  <input type="date" value={newTask.date} onChange={e => setNewTask({...newTask, date: e.target.value})} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="text-sm font-semibold mb-2 block">Volunteers Needed</label>
                  <input type="number" min="1" value={newTask.requiredVolunteers} onChange={e => setNewTask({...newTask, requiredVolunteers: e.target.value})} required />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-2 block">Direct Assign (Optional)</label>
                  <select value={newTask.assignedTo} onChange={e => setNewTask({...newTask, assignedTo: e.target.value})}>
                    <option value="">Public Sign-up (Open to all)</option>
                    {volunteers.map(vol => (
                      <option key={vol.userId?._id} value={vol.userId?._id}>{vol.userId?.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">Skills Needed (Comma-separated)</label>
                <input type="text" placeholder="e.g. Organizing, Photography" value={newTask.skillsNeeded} onChange={e => setNewTask({...newTask, skillsNeeded: e.target.value})} />
              </div>

              <div className="flex justify-between mt-6">
                <button type="button" className="btn" style={{ background: 'rgba(255,255,255,0.08)' }} onClick={() => setShowTaskModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Publish Event</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VolunteerManagement;
