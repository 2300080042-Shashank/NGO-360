import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FiPlus } from 'react-icons/fi';

const API = "https://ngo-360.onrender.com";

const VolunteerManagement = () => {
  const [tasks, setTasks] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', assignedTo: '' });

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'x-auth-token': token };
      
      if (user.role === 'admin') {
        const [tasksRes, volRes] = await Promise.all([
          axios.get(`${API}/api/tasks`, { headers }),
          axios.get(`${API}/api/volunteers`, { headers })
        ]);
        setTasks(tasksRes.data);
        setVolunteers(volRes.data);
      } else {
        const tasksRes = await axios.get(`${API}/api/tasks`, { headers });
        setTasks(tasksRes.data);
        setVolunteers([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/api/tasks`, newTask, {
        headers: { 'x-auth-token': token }
      });
      setShowTaskModal(false);
      setNewTask({ title: '', description: '', assignedTo: '' });
      fetchData();
    } catch (err) {
      console.error(err);
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
          <h1 className="text-3xl font-bold">{user.role === 'admin' ? 'Volunteer Management' : 'My Tasks'}</h1>
          <p className="text-secondary mt-2">{user.role === 'admin' ? 'Manage volunteers and assign operations tasks.' : 'View and update your assigned tasks.'}</p>
        </div>
        {user.role === 'admin' && (
          <button className="btn btn-primary" onClick={() => setShowTaskModal(true)}>
            <FiPlus /> Assign Task
          </button>
        )}
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: user.role === 'admin' ? '2fr 1fr' : '1fr', gap: '24px' }}>
        {/* Task List */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 className="text-xl font-bold mb-6">{user.role === 'admin' ? 'Recent Tasks' : 'My Assigned Tasks'}</h3>
          <div className="flex-col gap-4">
            {tasks.map(task => (
              <div key={task._id} className="glass-card flex justify-between items-center">
                <div>
                  <h4 className="font-semibold text-lg">{task.title}</h4>
                  <p className="text-sm text-secondary mt-1">{task.description}</p>
                  <p className="text-xs text-accent mt-2">
                    Assigned to: {task.assignedTo ? task.assignedTo.name : 'Unassigned'}
                  </p>
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
            {tasks.length === 0 && <p className="text-secondary text-center py-8">No tasks found.</p>}
          </div>
        </div>

        {/* Volunteers List */}
        {user.role === 'admin' && (
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 className="text-xl font-bold mb-6">Active Volunteers</h3>
            <div className="flex-col gap-4">
              {volunteers.map(vol => (
                <div key={vol._id} className="glass-card">
                  <div className="flex items-center gap-4">
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                      {vol.userId.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-semibold">{vol.userId.name}</h4>
                      <p className="text-xs text-secondary">{vol.userId.email}</p>
                    </div>
                  </div>
                  {vol.skills && vol.skills.length > 0 && (
                    <div className="mt-4 flex gap-2 flex-wrap">
                      {vol.skills.map((skill, idx) => (
                        <span key={idx} style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>{skill}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ padding: '32px', width: '100%', maxWidth: '500px' }}>
            <h2 className="text-2xl font-bold mb-6">Assign New Task</h2>
            <form onSubmit={handleCreateTask} className="flex-col gap-4">
              <div>
                <label className="text-sm font-semibold mb-2 block">Task Title</label>
                <input type="text" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} required />
              </div>
              <div>
                <label className="text-sm font-semibold mb-2 block">Description</label>
                <textarea rows="3" value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} required></textarea>
              </div>
              <div>
                <label className="text-sm font-semibold mb-2 block">Assign To</label>
                <select value={newTask.assignedTo} onChange={e => setNewTask({...newTask, assignedTo: e.target.value})} required>
                  <option value="">Select Volunteer...</option>
                  {volunteers.map(vol => (
                    <option key={vol.userId._id} value={vol.userId._id}>{vol.userId.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-between mt-6">
                <button type="button" className="btn" style={{ background: 'rgba(255,255,255,0.1)' }} onClick={() => setShowTaskModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VolunteerManagement;
