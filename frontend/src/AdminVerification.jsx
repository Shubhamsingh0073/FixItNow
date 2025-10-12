import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './AdminVerification.css';

const AdminVerification = () => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Get email from route state (passed from SignUp)
  const email = location.state?.email || 'your-email@gmail.com';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setError('Please enter a 6 digit code');
      return;
    }

    // Backend code verification can be added here
    alert('Admin verified!');
    navigate('/login');
  };

  return (
    <div className="admin-verification-login-bg">
      <div className="admin-verification-login-card">
        <h2 className="admin-title">Create Admin</h2>
        <p className="admin-desc">
          Verification code sent to <br /><b>{"main*****@gmail.com"}</b>
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            maxLength={6}
            pattern="\d{6}"
            value={code}
            onChange={e => setCode(e.target.value)}
            className="code-input"
            placeholder="6 digit code"
          />
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="verify-btn">
            Verify
          </button>
        </form>
        <button
          className="cancel-btn"
          type="button"
          onClick={() => navigate('/login')}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default AdminVerification;