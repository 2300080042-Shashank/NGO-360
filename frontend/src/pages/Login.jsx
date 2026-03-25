import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', formData);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.msg || 'An error occurred');
    }
  };

  return (
    <div className="auth-container">
      <div className="glass-panel auth-box animate-fade-in">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold mb-2">Welcome Back</h2>
          <p className="text-secondary">Sign in to your NGO360 account</p>
        </div>
        
        {error && <div className="error-msg mb-4">{error}</div>}
        
        <form onSubmit={handleSubmit} className="flex-col gap-4">
          <div>
            <label className="text-sm font-semibold mb-2 block">Email Address</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required />
          </div>
          <div className="mt-4">
            <label className="text-sm font-semibold mb-2 block">Password</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} required />
          </div>
          <button type="submit" className="btn btn-primary w-full mt-6 text-lg">Sign In</button>
        </form>
        
        <div className="text-center mt-6 text-sm text-secondary">
          Don't have an account? <Link to="/signup" className="font-semibold text-accent">Sign up</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
