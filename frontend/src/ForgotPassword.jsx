import React, { useState } from 'react';
import { FaEnvelope } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './modern-auth.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Simulated user database
  const existingUsers = ['user1@example.com', 'user2@example.com', 'test@demo.com'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (existingUsers.includes(email.trim().toLowerCase())) {
        setSubmitted(true);
        setTimeout(() => {
          navigate('/login');
        }, 2500);
      } else {
        setError('No user found with this email. Redirecting to signup...');
        setTimeout(() => {
          navigate('/signup');
        }, 2000);
      }
    }, 1500);
    // In real app, call your API here
    // await fetch('/api/auth/forgot-password', { ... })
  };

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <div className="brand-section">
          <div className="logo">
            <span>IC</span>
          </div>
          <h1>Forgot Password?</h1>
          <p>Enter your email to receive a login link</p>
        </div>
        <div className="form-section">
          {submitted ? (
            <div style={{textAlign: 'center', color: '#4a5568', fontSize: '1.1rem'}}>
              <p>We have sent a login link to <b>{email}</b>.<br/>Please check your inbox!</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <div className="input-wrapper">
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                  <FaEnvelope />
                </div>
                {error && <div className="error-message">{error}</div>}
              </div>
              <button type="submit" className={`auth-button${loading ? ' loading' : ''}`} disabled={loading}>
                {loading ? 'Sending...' : 'Send Login Link'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
