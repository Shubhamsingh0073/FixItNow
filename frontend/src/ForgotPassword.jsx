import React, { useState } from 'react';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './modern-auth.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [phase, setPhase] = useState('check'); // 'check' | 'reset' | 'done'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (e) => /^\S+@\S+\.\S+$/.test(e);

  const handleCheckEmail = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !validateEmail(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8087/users/forgot/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      if (res.ok) {
        // email exists — show reset form
        setPhase('reset');
      } else if (res.status === 404) {
        setError('No user found with this email. Please sign up.');
      } else {
        const text = await res.text().catch(() => '');
        setError('Server error: ' + (text || res.status));
      }
    } catch (err) {
      console.error(err);
      setError('Network error. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    // basic password policy
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8087/users/forgot/reset`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          newPassword: newPassword,
        }),
      });

      if (res.ok) {
        setPhase('done');
        // after a short delay, navigate to login
        setTimeout(() => navigate('/login'), 1800);
      } else if (res.status === 404) {
        setError('Account not found. Please sign up.');
        setPhase('check');
      } else {
        const json = await res.json().catch(() => null);
        setError((json && json.message) || 'Failed to reset password.');
      }
    } catch (err) {
      console.error(err);
      setError('Network error. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <div className="brand-section">
          <div className="logo"><span>IC</span></div>
          <h1>Forgot Password?</h1>
          <p>Enter your email to reset the password</p>
        </div>

        <div className="form-section">
          {phase === 'done' ? (
            <div style={{ textAlign: 'center', color: '#2f855a', fontSize: '1.1rem' }}>
              <p>Password updated successfully. Redirecting to login...</p>
            </div>
          ) : phase === 'check' ? (
            <form onSubmit={handleCheckEmail}>
              <div className="form-group">
                <div className="input-wrapper">
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-label="Email"
                  />
                  <FaEnvelope className="input-icon" aria-hidden="true" />
                </div>
                {error && <div className="error-message">{error}</div>}
              </div>
              <button type="submit" className={`auth-button${loading ? ' loading' : ''}`} disabled={loading}>
                {loading ? 'Checking...' : 'Continue'}
              </button>
            </form>
          ) : (
            // phase === 'reset'
            <form onSubmit={handleResetPassword}>
              <div className="form-group">
                <div className="input-wrapper">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    name="newPassword"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    aria-label="New password"
                  />
                  <FaLock className="input-icon" aria-hidden="true" />
                  <button
                    type="button"
                    className="password-toggle"
                    aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                    onClick={() => setShowNewPassword((s) => !s)}
                  >
                    {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <div className="input-wrapper">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    aria-label="Confirm password"
                  />
                  <FaLock className="input-icon" aria-hidden="true" />
                  <button
                    type="button"
                    className="password-toggle"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    onClick={() => setShowConfirmPassword((s) => !s)}
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              {error && <div className="error-message">{error}</div>}

              <button type="submit" className={`auth-button${loading ? ' loading' : ''}`} disabled={loading}>
                {loading ? 'Saving...' : 'Save New Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;