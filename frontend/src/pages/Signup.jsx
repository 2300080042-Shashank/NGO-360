import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';

const API = window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://ngo-360.onrender.com';

const Signup = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'donor' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API}/api/auth/register`, formData);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/dashboard');
    } catch (err) {
      console.error('Signup error:', err, err.response?.data);
      setError(err.response?.data?.msg || err.message || 'An error occurred');
    }
  };

  return (
    <div className="auth-container">
      <div className="glass-panel auth-box animate-fade-in" style={{ maxWidth: '500px' }}>
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold mb-2">Create Account</h2>
          <p className="text-secondary">Join NGO360 today to make an impact</p>
        </div>
        
        {error && <div className="error-msg mb-4">{error}</div>}
        
        <form onSubmit={handleSubmit} className="flex-col gap-4">
          <div>
            <label className="text-sm font-semibold mb-2 block">Full Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required />
          </div>
          <div className="mt-4">
            <label className="text-sm font-semibold mb-2 block">Email Address</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required />
          </div>
          <div className="mt-4">
            <label className="text-sm font-semibold mb-2 block">Password</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} required />
          </div>
          <div className="mt-4">
            <label className="text-sm font-semibold mb-2 block">I am a...</label>
            <select name="role" value={formData.role} onChange={handleChange}>
              <option value="donor">Donor</option>
              <option value="volunteer">Volunteer</option>
              <option value="admin">NGO Admin</option>
            </select>
          </div>
          
          <button type="submit" className="btn btn-primary w-full mt-6 text-lg">Sign Up</button>
        </form>
        
        <div className="text-center mt-6 text-sm text-secondary">
          Already have an account? <Link to="/login" className="font-semibold text-accent">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
