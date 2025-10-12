import React, { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaSearch, FaTools, FaStar, FaPhone, FaEnvelope, FaUser, FaHome, FaCalendarAlt, FaUserCircle, FaSignOutAlt, FaQuestionCircle, FaRegComments, FaRegThumbsUp } from 'react-icons/fa';
import './CustomerDashboard.css';

const categories = [
  { id: 'all', name: 'All Services' },
  { id: 'plumbing', name: 'Plumbing' },
  { id: 'electrical', name: 'Electrical' },
  { id: 'carpentry', name: 'Carpentry' },
  { id: 'cleaning', name: 'Cleaning' },
  { id: 'appliance', name: 'Appliance Repair' }
];

// Simulated provider cards
const mockServiceProviders = [
  {
    id: 1,
    name: "John's Plumbing",
    category: "plumbing",
    rating: 4.8,
    reviews: 127,
    distance: "2.3 km",
    phone: "+1234567890",
    email: "john@example.com",
    description: "Expert plumbing services with 15 years of experience",
    available: true
  },
  {
    id: 2,
    name: "Jane's Electrical",
    category: "electrical",
    rating: 4.6,
    reviews: 99,
    distance: "4.1 km",
    phone: "+1987654321",
    email: "jane@example.com",
    description: "Certified electrical solutions for homes and offices",
    available: false
  },
  {
    id: 3,
    name: "Alex Carpentry",
    category: "carpentry",
    rating: 4.7,
    reviews: 87,
    distance: "3.2 km",
    phone: "+1472583690",
    email: "alex@example.com",
    description: "Professional carpentry for custom furniture & repairs",
    available: true
  },
  {
    id: 4,
    name: "CleanPro Services",
    category: "cleaning",
    rating: 4.5,
    reviews: 76,
    distance: "1.9 km",
    phone: "+1357924680",
    email: "cleanpro@example.com",
    description: "Trusted cleaning solutions for homes and offices",
    available: true
  },
  {
    id: 5,
    name: "FixMyAppliance",
    category: "appliance",
    rating: 4.4,
    reviews: 61,
    distance: "5.0 km",
    phone: "+1122334455",
    email: "fixmyappliance@example.com",
    description: "Reliable appliance repair with fast turnaround",
    available: true
  }
];

// Simulated bookings
const mockCurrentBookings = [
  { ...mockServiceProviders[0], bookingDate: "2025-10-06" },
  { ...mockServiceProviders[3], bookingDate: "2025-10-07" }
];
const mockPastBookings = [
  { ...mockServiceProviders[1], bookingDate: "2025-09-25" },
  { ...mockServiceProviders[2], bookingDate: "2025-09-20" }
];

const CustomerDashboard = () => {
  const [location, setLocation] = useState(null);
  const [serviceProviders, setServiceProviders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentUser, setCurrentUser] = useState({ name: 'Customer Name', email: 'customer@email.com', phone: '' });
  const [activePage, setActivePage] = useState('home');
  const [phoneInput, setPhoneInput] = useState('');

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

    // Get current user from localStorage
    const userData = JSON.parse(localStorage.getItem('currentUser'));
    if (userData) {
      setCurrentUser(userData);
      setPhoneInput(userData.phone || '');
    }

    setServiceProviders(mockServiceProviders);
  }, []);

  // Filtering providers for Home page search
  const filteredProviders = serviceProviders.filter(provider => {
    const matchesSearch = provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || provider.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }).slice(0, 5); // Only show 5 cards

  const handleConnect = (provider) => {
    alert(`Connecting to ${provider.name}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    window.location.href = '/login';
  };

  const handlePhoneSave = () => {
    setCurrentUser(prev => ({ ...prev, phone: phoneInput }));
    localStorage.setItem('currentUser', JSON.stringify({ ...currentUser, phone: phoneInput }));
    alert("Phone number saved!");
  };

  // Card component
  const ProviderCard = ({ provider, showBookingDate }) => (
    <div className="provider-card">
      <div className="provider-info">
        <h3>{provider.name}</h3>
        <div className="rating">
          <FaStar /> {provider.rating} ({provider.reviews} reviews)
        </div>
        <p className="distance"><FaMapMarkerAlt /> {provider.distance}</p>
        <p className="description">{provider.description}</p>
        <div className="contact-info">
          <p><FaPhone /> {provider.phone}</p>
          <p><FaEnvelope /> {provider.email}</p>
        </div>
        {showBookingDate && (
          <div className="booking-date">
            <FaCalendarAlt /> {provider.bookingDate}
          </div>
        )}
      </div>
      <button
        className="connect-button"
        onClick={() => handleConnect(provider)}
        disabled={!provider.available}
      >
        {provider.available ? 'Connect Now' : 'Currently Unavailable'}
      </button>
    </div>
  );

  return (
    <div className="dashboard-root">
      {/* Side Panel */}
      <div className="sidebar">
        <div className="sidebar-title">FixItNow</div>
        <div className="sidebar-subtitle">CUSTOMER</div>
        <nav className="sidebar-nav">
          <button className={activePage === 'home' ? 'active' : ''}
                  onClick={() => setActivePage('home')}>
            <FaHome /> Home
          </button>
          <button className={activePage === 'bookings' ? 'active' : ''}
                  onClick={() => setActivePage('bookings')}>
            <FaCalendarAlt /> Bookings
          </button>
          <button className={activePage === 'profile' ? 'active' : ''}
                  onClick={() => setActivePage('profile')}>
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
              <h1 className="dashboard-header-bold-white">Find Services Near You</h1>
              {location && (
                <p>
                  <FaMapMarkerAlt /> Your location: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                </p>
              )}
            </div>
            <div className="search-section">
              <div className="search-bar">
                <FaSearch />
                <input
                  type="text"
                  placeholder="Search for services..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="categories no-scroll">
                {categories.map(category => (
                  <button
                    key={category.id}
                    className={`category-button compact-btn ${selectedCategory === category.id ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <FaTools />
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="providers-grid">
              {filteredProviders.map(provider => (
                <ProviderCard key={provider.id} provider={provider} />
              ))}
            </div>
          </div>
        )}

        {/* Bookings */}
        {activePage === 'bookings' && (
          <div className="bookings-page">
            <h2 className="dashboard-header-bold-white">Current Bookings</h2>
            <div className="providers-grid">
              {mockCurrentBookings.map(provider => (
                <ProviderCard key={provider.id} provider={provider} showBookingDate />
              ))}
            </div>
            <h2 className="dashboard-header-bold-white">Past Bookings</h2>
            <div className="providers-grid">
              {mockPastBookings.map(provider => (
                <ProviderCard key={provider.id} provider={provider} showBookingDate />
              ))}
            </div>
          </div>
        )}

        {/* Profile */}
        {activePage === 'profile' && (
          <div className="profile-page">
            {/* Section 1: Profile Info */}
            <div className="profile-info-box">
              <div className="profile-info-left">
                <FaUserCircle size={90} />
              </div>
              <div className="profile-info-right">
                <div className="profile-info-item"><strong>Name:</strong> {currentUser.name}</div>
                <div className="profile-info-item"><strong>Email:</strong> {currentUser.email}</div>
                <div className="profile-info-item phone-box-wide">
                  <label htmlFor="phone"><strong>Phone Number:</strong></label>
                  <input
                    id="phone"
                    type="tel"
                    placeholder="Add phone number"
                    value={phoneInput}
                    onChange={e => setPhoneInput(e.target.value)}
                  />
                  <button className="save-phone-button" onClick={handlePhoneSave}>Save</button>
                </div>
              </div>
            </div>
            {/* Section 2: Actions */}
            <div className="profile-actions-box">
              <button className="profile-wide-action-btn">
                <FaQuestionCircle className="profile-action-icon" /> Help
              </button>
              <button className="profile-wide-action-btn">
                <FaRegThumbsUp className="profile-action-icon" /> Reviews & Ratings
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

export default CustomerDashboard;