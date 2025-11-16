import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import './modern-auth.css';

const roleLabels = {
  customer: 'Customer',
  provider: 'Service Provider',
  admin: 'Admin'
};

const Login = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    userType: 'customer', // default role
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }

    // if general submit error exists, clear it when user types
    if (errors.submit) {
      setErrors((prev) => ({ ...prev, submit: '' }));
    }
  };

  // Toggle password show/hide
  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  // Validate form before submit
  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    return newErrors;
  };

  // Handle login submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await fetch('http://localhost:8087/users/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          role: formData.userType.toUpperCase() // Send "CUSTOMER", "PROVIDER", "ADMIN" in uppercase
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Map backend message to field-specific errors where possible
        const serverMessage = (data?.message || data?.error || '').toString().toLowerCase();
        if (serverMessage.includes('email')) {
          setErrors({ email: data.message || 'Invalid email' });
        } else if (serverMessage.includes('password')) {
          setErrors({ password: data.message || 'Invalid password' });
        } else if (serverMessage.includes('role') || serverMessage.includes('provider')) {
          setErrors({ submit: data.message || 'Invalid role' });
        } 
        setLoading(false);
        return;
      }

      // If user selected provider role, check verification status returned by backend.
      // Backend (user_login.java) includes a "verified" field when requested role is PROVIDER:
      // response.put("verified", service.getVerified().name());
      if (formData.userType === 'provider') {
        // Normalize verification status from response (could be in data.verified or nested)
        const rawStatus = (data?.verified || data?.user?.verified || data?.status || '').toString();
        const status = rawStatus.trim().toLowerCase();

        // If backend didn't include a status, treat as pending for safety (or you can allow)
        if (!status) {
          setErrors({ submit: 'Verification in progress. Wait for Admin approval.' });
          setLoading(false);
          return;
        }

        if (status.includes('pending')) {
          setErrors({ submit: 'Verification in progress. Wait for Admin approval.' });
          setLoading(false);
          return; // do not store token or navigate
        }

        if (status.includes('reject') || status.includes('rejected') || status.includes('declined')) {
          setErrors({ submit: 'Verification rejected, cannot login.' });
          setLoading(false);
          return; // do not store token or navigate
        }

        // allow login to continue only when approved/active
        if (!(status.includes('approve') || status.includes('approved') || status.includes('active'))) {
          // unknown status: be conservative
          setErrors({ submit: 'Verification in progress. Wait for Admin approval.' });
          setLoading(false);
          return;
        }
      }

      // At this point:
      // - non-provider users are accepted, or
      // - provider users are approved and can proceed.
      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      // Navigate based on role
      switch (formData.userType) {
        case 'customer':
          navigate('/customer-dashboard');
          break;
        case 'provider':
          navigate('/provider-dashboard');
          break;
        case 'admin':
          navigate('/admin-dashboard');
          break;
        default:
          navigate('/');
      }

      // Reset form
      setFormData({ email: '', password: '', userType: 'customer' });
    } catch (error) {
      console.error('Login error:', error);
      setErrors({ submit: 'An error occurred during login. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg">
      <div className="auth-card wider-auth-card">
        <div className="brand-section">
          <h1>Fix It Now</h1>
          <p>Please sign in to your account</p>
        </div>
        <div className="form-section">
          <form onSubmit={handleSubmit}>
            {/* Role Selector */}
            <div className="role-selector flex-equal">
              {['customer', 'provider', 'admin'].map((role) => (
                <button
                  key={role}
                  type="button"
                  className={`role-button ${formData.userType === role ? 'active' : ''}`}
                  onClick={() => setFormData((prev) => ({ ...prev, userType: role }))}
                >
                  <FaUser size={20} style={{ marginRight: 6 }} />
                  {roleLabels[role]}
                </button>
              ))}
            </div>

            {/* Email Input */}
            <div className="form-group">
              <div className="input-wrapper">
                <FaEnvelope className="input-icon" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              {errors.email && <div className="error-message">{errors.email}</div>}
            </div>

            {/* Password Input */}
            <div className="form-group">
              <div className="input-wrapper">
                <FaLock className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <span
                  className="password-toggle"
                  onClick={togglePasswordVisibility}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={0}
                  role="button"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') togglePasswordVisibility();
                  }}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
              {errors.password && <div className="error-message">{errors.password}</div>}
            </div>

            {/* Options */}
            <div className="form-options">
              <a
                href="#"
                className="forgot-password"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/forgot-password');
                }}
              >
                Forgot Password?
              </a>
            </div>

            {/* Submit Button */}
            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </button>

            {/* Error Message */}
            {errors.submit && <div className="error-message mt-2">{errors.submit}</div>}

            {/* Signup Link */}
            <div className="auth-link">
              Don't have an account?{' '}
              <button type="button" onClick={() => navigate('/signup')}>
                Sign up
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;