import React, { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaUserCircle, FaPhone, FaEnvelope, FaHome, FaCalendarAlt, FaSignOutAlt, FaQuestionCircle, FaRegComments } from 'react-icons/fa';
import './ProviderDashboard.css';

// Mock data for customers
const mockCustomers = [
  {
    id: 1,
    name: 'Alice Johnson',
    phone: '+1234567890',
    email: 'alice@email.com',
    category: 'Plumbing'
  },
  {
    id: 2,
    name: 'Bob Smith',
    phone: '+1987654321',
    email: 'bob@email.com',
    category: 'Electrical'
  },
  {
    id: 3,
    name: 'Carol Lee',
    phone: '+1472583690',
    email: 'carol@email.com',
    category: 'Carpentry'
  },
  {
    id: 4,
    name: 'David King',
    phone: '+1357924680',
    email: 'david@email.com',
    category: 'Cleaning'
  },
  {
    id: 5,
    name: 'Emma Brown',
    phone: '+1122334455',
    email: 'emma@email.com',
    category: 'Appliance Repair'
  }
];

// Mock bookings
const mockPastBookings = [
  { ...mockCustomers[1], status: 'Completed', bookingDate: '2025-09-25' },
  { ...mockCustomers[2], status: 'Completed', bookingDate: '2025-09-20' },
];

// Mock provider profile
const initialProvider = {
  name: 'Provider Name',
  email: 'provider@email.com',
  phone: '',
  description: '123 Main St, Springfield. Open Mon-Sat 9am-6pm. Call us for emergency repairs, installations, and maintenance. We have 20+ years experience and certified professionals.',
  rating: 4.6,
  reviews: [
    { user: 'Alice', stars: 5, text: 'Great work, very professional!' },
    { user: 'Bob', stars: 4, text: 'Quick and reliable service.' },
    { user: 'Carol', stars: 5, text: 'Excellent communication and job done perfectly.' },
    { user: 'David', stars: 3, text: 'Arrived late but completed the job as expected.' }
  ]
};

const bookingStatusOptions = ['Pending', 'In Progress', 'Completed'];

const ProviderDashboard = () => {
  // Location state
  const [location, setLocation] = useState(null);

  // Sidebar navigation
  const [activePage, setActivePage] = useState('home');
  const [requests, setRequests] = useState(mockCustomers);
  const [acceptedRequest, setAcceptedRequest] = useState(null);
  const [currentBookingStatus, setCurrentBookingStatus] = useState('Pending');
  const [provider, setProvider] = useState(initialProvider);
  const [phoneInput, setPhoneInput] = useState(provider.phone);
  const [descriptionInput, setDescriptionInput] = useState(provider.description);

  // Location request on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, []);

  // Accept request
  const handleAcceptRequest = (customer) => {
    setAcceptedRequest({
      ...customer,
      status: currentBookingStatus,
      bookingDate: '2025-10-06'
    });
    setRequests(requests.filter(req => req.id !== customer.id));
    setActivePage('home');
  };

  // Change status in bookings
  const handleBookingStatusChange = (newStatus) => {
    setCurrentBookingStatus(newStatus);
    setAcceptedRequest(prev => prev ? { ...prev, status: newStatus } : null);
  };

  // Save phone/description in profile
  const handleProfileSave = () => {
    setProvider(prev => ({
      ...prev,
      phone: phoneInput,
      description: descriptionInput
    }));
    alert('Profile updated!');
  };

  // Logout
  const handleLogout = () => {
    window.location.href = '/login';
  };

  // Card for customer request (Home and Past Bookings Small Card)
  const CustomerSmallCard = ({ customer, showAccept, acceptedStatus }) => (
    <div className={`provider-customer-card small-card ${acceptedStatus ? 'accepted-card' : ''}`}>
      <div className="card-profile">
        <FaUserCircle size={38} />
      </div>
      <div className="card-info">
        <div className="card-info-item"><strong>Name:</strong> {customer.name}</div>
        <div className="card-info-item"><strong>Email:</strong> {customer.email}</div>
        <div className="card-info-item"><strong>Phone:</strong> {customer.phone}</div>
        <div className="card-info-item"><strong>Category:</strong> {customer.category}</div>
        {customer.bookingDate && (
          <div className="card-info-item"><FaCalendarAlt /> {customer.bookingDate}</div>
        )}
        {acceptedStatus && (
          <div className="card-info-item accepted-status">
            Status:
            <span className={`accepted-status-label status-${customer.status.toLowerCase().replace(/ /g, '-')}`}>{customer.status}</span>
          </div>
        )}
        {showAccept && (
          <div className="accept-btn-row">
            <button className="accept-request-btn" onClick={() => handleAcceptRequest(customer)}>Accept Request</button>
          </div>
        )}
      </div>
    </div>
  );

  // Card for accepted/current booking (Wide Card)
  const CustomerWideCard = ({ customer, acceptedStatus }) => (
    <div className={`provider-customer-card wide-card ${acceptedStatus ? 'accepted-card' : ''}`}>
      <div className="card-profile">
        <FaUserCircle size={56} />
      </div>
      <div className="card-info">
        <div className="card-info-item"><strong>Name:</strong> {customer.name}</div>
        <div className="card-info-item"><strong>Email:</strong> {customer.email}</div>
        <div className="card-info-item"><strong>Phone:</strong> {customer.phone}</div>
        <div className="card-info-item"><strong>Category:</strong> {customer.category}</div>
        {customer.bookingDate && (
          <div className="card-info-item"><FaCalendarAlt /> {customer.bookingDate}</div>
        )}
        {acceptedStatus && (
          <div className="card-info-item accepted-status">
            Status:
            <span className={`accepted-status-label status-${customer.status.toLowerCase().replace(/ /g, '-')}`}>{customer.status}</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="provider-dashboard-root">
      {/* Side Panel */}
      <div className="sidebar">
        <div className="sidebar-title">FixItNow</div>
        <div className="sidebar-subtitle">Provider</div>
        <nav className="sidebar-nav">
          <button className={activePage === 'home' ? 'active' : ''} onClick={() => setActivePage('home')}>
            <FaHome /> Home
          </button>
          <button className={activePage === 'bookings' ? 'active' : ''} onClick={() => setActivePage('bookings')}>
            <FaCalendarAlt /> Bookings
          </button>
          <button className={activePage === 'profile' ? 'active' : ''} onClick={() => setActivePage('profile')}>
            <FaUserCircle /> Profile
          </button>
        </nav>
        <div className="sidebar-bottom">
          <button className="logout-button" onClick={handleLogout}>
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-main">
        {/* Home */}
        {activePage === 'home' && (
          <div>
            <div className="dashboard-header">
              <h1 className="dashboard-header-bold-white">Customers Near You</h1>
              {location && (
                <p>
                  <FaMapMarkerAlt /> Your location: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                </p>
              )}
            </div>
            {acceptedRequest && (
              <div>
                <CustomerWideCard customer={acceptedRequest} acceptedStatus />
              </div>
            )}
            <div style={{ marginTop: acceptedRequest ? '2.2rem' : 0 }}>
              <h2 className="dashboard-header-bold-white" style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Customer Requests</h2>
              <div className="providers-grid">
                {requests.slice(0, 5).map(customer => (
                  <CustomerSmallCard key={customer.id} customer={customer} showAccept />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Bookings */}
        {activePage === 'bookings' && (
          <div className="bookings-page">
            <h2 className="dashboard-header-bold-white">Current Bookings</h2>
            <div className="providers-grid">
              {acceptedRequest && (
                <div className="provider-customer-card wide-card accepted-card">
                  <div className="card-profile">
                    <FaUserCircle size={56} />
                  </div>
                  <div className="card-info">
                    <div className="card-info-item"><strong>Name:</strong> {acceptedRequest.name}</div>
                    <div className="card-info-item"><strong>Email:</strong> {acceptedRequest.email}</div>
                    <div className="card-info-item"><strong>Phone:</strong> {acceptedRequest.phone}</div>
                    <div className="card-info-item"><strong>Category:</strong> {acceptedRequest.category}</div>
                    <div className="card-info-item"><FaCalendarAlt /> {acceptedRequest.bookingDate}</div>
                  </div>
                  <div className="booking-status-dropdown">
                    <label htmlFor="booking-status-select"><strong>Status:</strong></label>
                    <select
                      id="booking-status-select"
                      value={currentBookingStatus}
                      onChange={e => handleBookingStatusChange(e.target.value)}
                    >
                      {bookingStatusOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
            <h2 className="dashboard-header-bold-white">Past Bookings</h2>
            <div className="providers-grid">
              {mockPastBookings.map(customer => (
                <CustomerSmallCard key={customer.id} customer={customer} />
              ))}
            </div>
          </div>
        )}

        {/* Profile */}
        {activePage === 'profile' && (
          <div className="profile-page">
            {/* Section 1: Profile Info */}
            <div className="profile-info-box wide-profile-box">
              <div className="profile-info-left">
                <FaUserCircle size={90} />
              </div>
              <div className="profile-info-right">
                <div className="profile-info-item"><strong>Name:</strong> {provider.name}</div>
                <div className="profile-info-item"><strong>Email:</strong> {provider.email}</div>
                <div className="profile-info-item phone-box-wide">
                  <label htmlFor="phone"><strong>Phone Number:</strong></label>
                  <input
                    id="phone"
                    type="tel"
                    placeholder="Add phone number"
                    value={phoneInput}
                    onChange={e => setPhoneInput(e.target.value)}
                  />
                </div>
                <div className="profile-info-item description-box">
                  <label htmlFor="description"><strong>Description:</strong></label>
                  <textarea
                    id="description"
                    rows={3}
                    placeholder="Add provider shop details"
                    value={descriptionInput}
                    onChange={e => setDescriptionInput(e.target.value)}
                  />
                </div>
                <button className="save-phone-button" style={{marginTop:'1rem'}} onClick={handleProfileSave}>Save</button>
              </div>
            </div>
            {/* Section 2: Reviews and actions */}
            <div className="profile-actions-box wide-profile-box">
              <h2 className="profile-reviews-heading">Reviews & Ratings</h2>
              <div className="profile-rating-row">
                <span className="profile-rating-stars">
                  {Array.from({ length: 5 }, (_, i) => (
                    <span key={i} className={provider.rating >= i + 1 ? 'filled-star' : 'empty-star'}>★</span>
                  ))}
                </span>
                <span className="profile-rating-value">{provider.rating} / 5</span>
              </div>
              <div className="profile-reviews-list">
                {provider.reviews.map((rev, idx) => (
                  <div className="profile-review" key={idx}>
                    <span className="profile-review-stars">
                      {Array.from({ length: 5 }, (_, i) => (
                        <span key={i} className={rev.stars >= i + 1 ? 'filled-star' : 'empty-star'}>★</span>
                      ))}
                    </span>
                    <span className="profile-review-user">{rev.user}:</span>
                    <span className="profile-review-text">{rev.text}</span>
                  </div>
                ))}
              </div>
              <button className="profile-wide-action-btn">
                <FaQuestionCircle className="profile-action-icon" /> Help
              </button>
              <button className="profile-wide-action-btn">
                <FaRegComments className="profile-action-icon" /> FAQ
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProviderDashboard;