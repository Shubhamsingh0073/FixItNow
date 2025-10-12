import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import './modern-auth.css';

const SignUpPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'CUSTOMER'
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    // Fullname validation
    if (!formData.name.trim()) {
      newErrors.name = 'Fullname is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Fullname must be at least 3 characters';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8087/users/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role // CUSTOMER/PROVIDER/ADMIN
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ submit: data.message || 'Signup failed. Please try again.' });
        setLoading(false);
        return;
      }

      if (formData.role === 'ADMIN') {
        // Redirect to admin verification, pass email in location state
        navigate('/admin-verify', { state: { email: formData.email } });
      } else {
        alert('Registration successful! Please login to continue.');
        navigate('/login');
      }
    } catch (error) {
      setErrors({ submit: 'An error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg">
      <div className="auth-card wider-auth-card">
        <div className="brand-section">
          <h1>Fix It Now</h1>
          <p>Join our service & repair network today!!</p>
        </div>
        <div className="form-section">
          <form onSubmit={handleSubmit}>
            {/* Fullname */}
            <div className="form-group">
              <div className="input-wrapper">
                <FaUser className="input-icon" />
                <input
                  type="text"
                  name="name"
                  placeholder="Full name"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
              {errors.name && (
                <div className="error-message">{errors.name}</div>
              )}
            </div>
            {/* Email */}
            <div className="form-group">
              <div className="input-wrapper">
                <FaEnvelope className="input-icon" />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              {errors.email && (
                <div className="error-message">{errors.email}</div>
              )}
            </div>
            {/* Password */}
            <div className="form-group">
              <div className="input-wrapper">
                <FaLock className="input-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <span
                  className="password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={0}
                  role="button"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setShowPassword(prev => !prev);
                  }}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
              {errors.password && (
                <div className="error-message">{errors.password}</div>
              )}
            </div>
            {/* Confirm Password */}
            <div className="form-group">
              <div className="input-wrapper">
                <FaLock className="input-icon" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                <span
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  tabIndex={0}
                  role="button"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setShowConfirmPassword(prev => !prev);
                  }}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
              {errors.confirmPassword && (
                <div className="error-message">{errors.confirmPassword}</div>
              )}
            </div>
            {/* Role Selector */}
            <div className="role-selector flex-equal">
              <button
                type="button"
                className={`role-button ${formData.role === 'CUSTOMER' ? 'active' : ''}`}
                onClick={() => setFormData({...formData, role: 'CUSTOMER'})}
              >
                <FaUser /> Customer
              </button>
              <button
                type="button"
                className={`role-button ${formData.role === 'PROVIDER' ? 'active' : ''}`}
                onClick={() => setFormData({...formData, role: 'PROVIDER'})}
              >
                <FaUser /> Service Provider
              </button>
              <button
                type="button"
                className={`role-button ${formData.role === 'ADMIN' ? 'active' : ''}`}
                onClick={() => setFormData({...formData, role: 'ADMIN'})}
              >
                <FaUser /> Admin
              </button>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="auth-button"
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
            {/* Error message for backend errors */}
            {errors.submit && (
              <div className="error-message">{errors.submit}</div>
            )}
            <div className="auth-link">
              Already have an account?{' '}
              <button type="button" onClick={() => navigate('/login')}>Log In</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SignUpPage;