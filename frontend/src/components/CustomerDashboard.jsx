import React, { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaSearch, FaTools, FaStar, FaPhone, FaEnvelope, FaUser, FaHome, FaCalendarAlt, FaUserCircle, FaSignOutAlt, FaQuestionCircle, FaRegComments, FaRegThumbsUp, FaEdit, FaTimes, FaCheck } from 'react-icons/fa';
import './CustomerDashboard.css';

const categories = [
  { id: 'all', name: 'All Services' },
  { id: 'plumbing', name: 'Plumbing' },
  { id: 'electrical', name: 'Electrical' },
  { id: 'carpentry', name: 'Carpentry' },
  { id: 'cleaning', name: 'Cleaning' },
  { id: 'appliance', name: 'Appliance Repair' }
];

const mockPastBookings = [
  // You can keep this for testing or remove if you want to fetch bookings from backend
  // { ...mockServiceProviders[1], bookingDate: "2025-09-25" },
  // { ...mockServiceProviders[2], bookingDate: "2025-09-20" }
];

const CustomerDashboard = () => {
  // Location state (address as text)
  const [location, setLocation] = useState('');
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [locationInput, setLocationInput] = useState('');
  const [latLng, setLatLng] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // This will be set from backend (dynamic)
  const [serviceProviders, setServiceProviders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentUser, setCurrentUser] = useState({ name: 'Customer Name', email: 'customer@email.com', phone: '' });
  const [activePage, setActivePage] = useState('home');
  const [phoneInput, setPhoneInput] = useState('');
  const [connectedProvider, setConnectedProvider] = useState(null);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        // Fetch all providers from backend. Assumes array of provider objects.
        const res = await fetch('http://localhost:8087/users/providers');
        if (!res.ok) throw new Error('Failed to fetch providers');
        const providers = await res.json();

        // If the backend returns a single object, convert it to array:
        const providersArray = Array.isArray(providers) ? providers : [providers];

        setServiceProviders(providersArray);
      } catch (error) {
        console.error('Error fetching providers:', error);
        setServiceProviders([]);
      }
    };

    fetchProviders();
  }, []);

  // Location function (OpenStreetMap, editable)
  useEffect(() => {
    setIsLoadingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setLatLng({ lat, lng });

          // Fetch address from OpenStreetMap Nominatim
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
            .then(response => response.json())
            .then(data => {
              setLocation(data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
              setLocationInput(data.display_name || '');
              setIsLoadingLocation(false);
            })
            .catch(err => {
              setLocation(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
              setIsLoadingLocation(false);
            });
        },
        (error) => {
          setLocation('Location permission denied or unavailable.');
          setIsLoadingLocation(false);
        }
      );
    } else {
      setLocation('Geolocation not supported.');
      setIsLoadingLocation(false);
    }
    // Only run once on mount
    // eslint-disable-next-line
  }, []);

  // Filtering providers for Home page search (category logic updated)
  const filteredProviders = serviceProviders.filter(provider => {
    // Category filtering based on provider name (case-insensitive)
    let matchesCategory = true;
    if (selectedCategory !== 'all') {
      matchesCategory = provider.name && provider.name.toLowerCase().includes(selectedCategory);
    }
    // Search filtering by location/address (case-insensitive)
    const matchesSearch = (provider.location || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Remove connected provider from "other services"
  const otherProviders = connectedProvider
    ? filteredProviders.filter(p => p.id !== connectedProvider.id)
    : filteredProviders;

  const handleConnect = (provider) => {
    setConnectedProvider(provider);
    setActivePage('home');
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

  // Edit Location Button
  const handleEditLocation = () => {
    setLocationInput(location);
    setIsEditingLocation(true);
  };

  // Save Location Button
  const handleSaveLocation = () => {
    setLocation(locationInput);
    setIsEditingLocation(false);
  };

  // Wide Card for connected provider
  const WideProviderCard = ({ provider, showBookingDate }) => (
    <div className="customer-wide-card" style={{
      width: "100%",
      background: "#fff",
      borderRadius: "1rem",
      boxShadow: "0 2px 16px rgba(80,36,143,0.12)",
      marginBottom: "2rem",
      padding: "2.1rem 2.8rem",
      display: "flex",
      alignItems: "center",
      gap: "2.8rem",
      justifyContent: "flex-start"
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: "1.37rem", marginBottom: "0.5rem" }}>
          {provider.name}
        </div>
        {(provider.rating || provider.reviews) && (
          <div style={{ marginBottom: "0.4rem", display: "flex", alignItems: "center" }}>
            <FaStar style={{ color: "#fbbf24", marginRight: "0.25rem" }} />
            {provider.rating} ({provider.reviews} reviews)
          </div>
        )}
        <div style={{ marginBottom: "0.4rem", display: "flex", alignItems: "center" }}>
          <FaMapMarkerAlt style={{ marginRight: "0.5em" }} /> 
          {provider.location}
        </div>
        <div style={{ marginBottom: "0.4rem", color: "#555" }}>
          <strong>Description:</strong> {provider.description}
        </div>
        <div style={{ marginBottom: "0.4rem", color: "#555" }}>
          <strong>Availability:</strong> 
          {provider.availability?.from ? provider.availability.from : ''} 
          {provider.availability?.to ? ` to ${provider.availability.to}` : ''}
        </div>
        <div style={{ marginBottom: "0.3rem", display: "flex", alignItems: "center" }}>
          <FaPhone style={{ marginRight: "0.5em" }} /> {provider.phone} &nbsp;
        </div>
        <div style={{ marginBottom: "0.5rem", display: "flex", alignItems: "center" }}> 
          <FaEnvelope style={{ marginRight: "0.5em" }}/> {provider.email}
        </div>
        {showBookingDate && (
          <div style={{ marginTop: "0.5rem", fontWeight: 500, display: "flex", alignItems: "center" }}>
            <FaCalendarAlt style={{ marginRight: "0.5em" }} />
            {provider.bookingDate || "2025-10-13"}
          </div>
        )}
      </div>
    </div>
  );
  
  // Card component for other services
  const ProviderCard = ({ provider, showBookingDate }) => (
    <div className="provider-card">
      <div className="provider-info">
        <h3>{provider.name}</h3>
        {(provider.rating || provider.reviews) && (
          <div className="rating">
            <FaStar /> {provider.rating} ({provider.reviews} reviews)
          </div>
        )}
        <p className="distance" style={{ display: "flex", alignItems: "center", gap: "0.5em" }}>
          <FaMapMarkerAlt /> {provider.location}</p>
        <p style={{ display: "flex", alignItems: "center", gap: "0.5em" }}>
          <FaPhone /> {provider.phone}</p>
        <p style={{ display: "flex", alignItems: "center", gap: "0.5em" }}>
          <FaEnvelope /> {provider.email}</p>
        <p className="description">
          <strong>Description:</strong> {provider.description}</p>
        <p><strong>Availability:</strong> 
          {provider.availability?.from ? provider.availability.from : ''} 
          {provider.availability?.to ? ` to ${provider.availability.to}` : ''}
        </p>
        {showBookingDate && (
          <div className="booking-date">
            <FaCalendarAlt /> {provider.bookingDate}
          </div>
        )}
      </div>
      <button
        className="connect-button"
        onClick={() => handleConnect(provider)}
        disabled={provider.available === false}
      >
        {provider.available === false ? 'Currently Unavailable' : 'Connect Now'}
      </button>
    </div>
  );
  

  useEffect(() => {
    // Get current user from localStorage
    const userData = JSON.parse(localStorage.getItem('currentUser'));
    if (userData) {
      setCurrentUser(userData);
      setPhoneInput(userData.phone || '');
    }
    // Providers are fetched from backend in first useEffect
  }, []);

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
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                  margin: "1.4em 0 1.2em 0"
                }}
              >
                <FaMapMarkerAlt style={{ fontSize: "1.2em", marginRight: "0.7em", color: "#222" }} />
                {!isEditingLocation ? (
                  <>
                    <div style={{
                      flex: 1,
                      textAlign: "center",
                      fontWeight: 600,
                      fontSize: "1em",
                      color: "#f0f0f0ea"
                    }}>
                      {isLoadingLocation ? "Fetching location..." : location}
                    </div>
                    <button
                      className="edit-location-btn"
                      style={{
                        width: "38px",
                        height: "38px",
                        minWidth: "38px",
                        maxWidth: "38px",
                        border: "none",
                        borderRadius: "10px",
                        marginLeft: "1em",
                        background: "#7c4dff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer"
                      }}
                      onClick={handleEditLocation}
                      title="Edit address"
                    >
                      <FaEdit style={{ fontSize: "1.18em", color: "#fff" }} />
                    </button>
                  </>
                ) : (
                  <>
                    <input
                      type="text"
                      value={locationInput}
                      onChange={e => setLocationInput(e.target.value)}
                      placeholder="Enter your address"
                      style={{
                        flex: 1,
                        textAlign: "center",
                        padding: "0.5em",
                        borderRadius: "0.5em",
                        fontSize: "1em",
                        marginRight: "1em",
                        marginLeft: "0.4em"
                      }}
                    />
                    <button
                      className="edit-location-btn"
                      style={{
                        width: "38px",
                        height: "38px",
                        minWidth: "38px",
                        maxWidth: "38px",
                        border: "none",
                        borderRadius: "10px",
                        background: "#4fd1c5",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: "0.5em",
                        cursor: "pointer"
                      }}
                      onClick={handleSaveLocation}
                      title="Save address"
                    >
                      <FaCheck style={{ fontSize: "1.18em", color: "#fff" }} />
                    </button>
                    <button
                      className="edit-location-btn"
                      style={{
                        width: "38px",
                        height: "38px",
                        minWidth: "38px",
                        maxWidth: "38px",
                        border: "none",
                        borderRadius: "10px",
                        background: "#e53e3e",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer"
                      }}
                      onClick={() => setIsEditingLocation(false)}
                      title="Cancel"
                    >
                      <FaTimes style={{ fontSize: "1.18em", color: "#fff" }} />
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="search-section">
              <div className="search-bar">
                <FaSearch />
                <input
                  type="text"
                  placeholder="Search by location (address)..."
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
            {/* Connected wide card */}
            {connectedProvider && (
              <WideProviderCard provider={connectedProvider} />
            )}
            {/* Other services */}
            <div>
              {connectedProvider && otherProviders.length > 0 && (
                <h2 className="dashboard-header-bold-white" style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Other Services</h2>
              )}
              <div className="providers-grid">
                {otherProviders.map(provider => (
                  <ProviderCard key={provider.id} provider={provider} />
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
              {connectedProvider && <WideProviderCard provider={connectedProvider} showBookingDate />}
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