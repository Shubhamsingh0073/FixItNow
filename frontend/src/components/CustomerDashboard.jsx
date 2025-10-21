import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { FaMapMarkerAlt, FaSearch, FaTools, FaStar, FaPhone, FaEnvelope, FaUser, FaHome, FaCalendarAlt, FaUserCircle, FaSignOutAlt, FaQuestionCircle, FaRegComments, FaRegThumbsUp, FaEdit, FaTimes, FaCheck, FaToolbox } from 'react-icons/fa';
import './CustomerDashboard.css';

const categories = [
  { id: 'all', name: 'All Services' },
  { id: 'plumbing', name: 'Plumbing' },
  { id: 'electrical', name: 'Electrical' },
  { id: 'carpentry', name: 'Carpentry' },
  { id: 'cleaning', name: 'Cleaning' },
  { id: 'appliance', name: 'Appliance Repair' }
];

const CustomerDashboard = () => {
  const [location, setLocation] = useState('');
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [locationInput, setLocationInput] = useState('');
  const [latLng, setLatLng] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const [serviceProviders, setServiceProviders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentUser, setCurrentUser] = useState({ name: 'Customer Name', email: 'customer@email.com', phone: '' });
  const [activePage, setActivePage] = useState('home');
  const [phoneInput, setPhoneInput] = useState('');
  const [connectedProvider, setConnectedProvider] = useState(null);

  const [modalScrollTop, setModalScrollTop] = useState(0);
  const [selectedServices, setSelectedServices] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [modalProvider, setModalProvider] = useState(null);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const res = await fetch('http://localhost:8087/users/providers');
        if (!res.ok) throw new Error('Failed to fetch providers');
        const providers = await res.json();
        const providersArray = Array.isArray(providers) ? providers : [providers];
        setServiceProviders(providersArray);
      } catch (error) {
        console.error('Error fetching providers:', error);
        setServiceProviders([]);
      }
    };
    fetchProviders();
  }, []);

  useEffect(() => {
    setIsLoadingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setLatLng({ lat, lng });
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
  }, []);

  const filteredProviders = serviceProviders.filter(provider => {
    let matchesCategory = true;
    if (selectedCategory !== 'all') {
      matchesCategory = provider.category && provider.category.toLowerCase().includes(selectedCategory);
    }
    const matchesSearch = (provider.location || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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

  const handleEditLocation = () => {
    setLocationInput(location);
    setIsEditingLocation(true);
  };

  const handleSaveLocation = () => {
    if (locationInput.trim() === "") {
      setIsEditingLocation(false);
      return;
    }
    setLocation(locationInput);
    setIsEditingLocation(false);
  };

  const handleSeeDetails = (provider) => {
    setModalProvider(provider);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalProvider(null);
  };

  const WideProviderCard = ({ provider, showBookingDate }) => (
    <div className="customer-wide-card">
      <div className="wide-card-content">
        <div className="wide-card-title">{provider.name}</div>
        <div className="rating">
          <FaStar className="star-icon" />
          {provider.rating ? provider.rating : "4.5"}
          ({provider.reviews ? provider.reviews : "120"} reviews)
        </div>
        <div className="distance">
          <FaMapMarkerAlt color="#cf1616ff" className="map-icon" />
          {provider.location}
        </div>
        <div className="description">
          <strong>Description:</strong> {provider.description}
        </div>
        <div className="availability">
          <strong>Availability:</strong>
          {provider.availability?.from ? provider.availability.from : ''}
          {provider.availability?.to ? ` to ${provider.availability.to}` : ''}
        </div>
        <div className="contact-info">
          <p><FaPhone /> {provider.phone}</p>
          <p><FaEnvelope /> {provider.email}</p>
        </div>
        {showBookingDate && (
          <div className="booking-date">
            <FaCalendarAlt /> {provider.bookingDate || "2025-10-13"}
          </div>
        )}
      </div>
    </div>
  );

  const ProviderModal = ({ provider, onClose, selectedServices, setSelectedServices, modalScrollTop, setModalScrollTop }) => {
    const scrollRef = useRef();
    useEffect(() => {
      if (scrollRef.current) {
        // Give the browser a moment to render before restoring scroll
        setTimeout(() => {
          scrollRef.current.scrollTop = modalScrollTop;
        }, 0);
      }
    }, [selectedServices, modalScrollTop, provider]);
    const handleCheckboxChange = (name, checked) => {
      if (scrollRef.current) {
        setModalScrollTop(scrollRef.current.scrollTop);
      }
      setSelectedServices(prev => ({ ...prev, [name]: checked }));
    };
    if (!provider) return null;
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <button className="modal-close-btn" onClick={onClose}>×</button>
          
            <h2 className="modal-provider-name">{provider.name}</h2>
            <div className="modal-provider-details">
              <div className="modal-detail-row rating-row">
                <FaStar className="star-icon" />
                <span className="modal-detail-value">
                {provider.rating ? provider.rating : "4.5"} ({provider.reviews ? provider.reviews : "120"} reviews)
                </span>
              </div> 
            </div>
            <div className="modal-contact-row">
              <p>
                Contact: 
                <span className="modal-detail-value">{provider.phone}</span>
              </p>
              <p>
                <FaEnvelope />
                <span className="modal-detail-value">{provider.email}</span>
              </p>
          </div>
          <div className="modal-content-scroll" ref={scrollRef}>
            <div className="modal-provider-details">
              <div className="modal-location-row">
                <FaMapMarkerAlt color="#cf1616ff" className="modal-map-icon" />
                <span className="modal-detail-value">{provider.location}</span>
              </div>
              <div className="modal-detail-row">
                
                <span className="modal-detail-value"><strong>Description:</strong> {provider.description}</span>
              </div>
              <div className="modal-detail-row">
                <strong>Availability:</strong>
                <span className="modal-detail-value">
                {provider.availability?.from} to {provider.availability?.to}
                </span>
              </div>
              {provider.subcategory && (
              <div className="modal-subcategories">
                <strong>Services:</strong>
                <div className="modal-subcategory-list">
                  {Object.entries(provider.subcategory).map(([name, price]) => (
                  <label key={name} className="modal-subcategory-row">
                    <input
                      type="checkbox"
                      checked={!!selectedServices[name]}
                      onChange={e =>
                        handleCheckboxChange(name, e.target.checked)
                      }
                    />
                    <span className="modal-subcategory-name">{name}</span>
                    <span className="modal-subcategory-price">₹ {price}</span>
                  </label>
                  ))}
                </div>
              </div>
              )}
              <hr className="modal-services-divider" />
              <div className="modal-services-total-row">
                <span className="modal-services-total-label"><strong>Total Price :</strong></span>
                <span className="modal-services-total-value">
                ₹{Object.entries(selectedServices)
                  .filter(([name, checked]) => checked)
                  .reduce((sum, [name]) => sum + (provider.subcategory[name] || 0), 0)}
                </span>
              </div>
            </div>
          </div>
              <button
                className="connect-button"
                onClick={() => {
                  handleConnect(provider)
                  onClose();
                }}
                disabled={provider.available === false}
              >
                {provider.available === false ? 'Currently Unavailable' : 'Connect Now'}
              </button>
            
        </div>
      </div>
    );
  };

  const ProviderCard = ({ provider, showBookingDate }) => (
    <div className="provider-card">
      <div className="provider-info">
        <h3><b>{provider.name}</b></h3>
        <div className="rating">
          <FaStar className="star-icon" />
          {provider.rating ? provider.rating : "4.5"} ({provider.reviews ? provider.reviews : "120"} reviews)
        </div>
        <p className="category-info"><FaToolbox /> <b>{provider.category}</b></p>
        <p className="distance">
          <FaMapMarkerAlt color="#cf1616ff" className="map-icon" /> {
            (() => {
              const maxWords = 6;
              const words = (provider.location || "").split(" ");
              const truncated = words.slice(0, maxWords).join(" ");
              return words.length > maxWords ? truncated + "..." : truncated;
            })()
          }
        </p>
        
        <p className="contact-info"><FaPhone /> {provider.phone}</p>
        <p className="contact-info"><FaEnvelope /> {provider.email}</p>
        {showBookingDate && (
          <div className="booking-date">
            <FaCalendarAlt /> {provider.bookingDate}
          </div>
        )}
      </div>
      <button
        className="connect-button"
        onClick={() => handleSeeDetails(provider)}
        disabled={provider.available === false}
      >
        {provider.available === false ? 'Currently Unavailable' : 'See Details'}
      </button>
    </div>
  );

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('currentUser'));
    if (userData) {
      setCurrentUser(userData);
      setPhoneInput(userData.phone || '');
    }
  }, []);

  return (
    <div className="dashboard-root">
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

      <div className="dashboard-main">
        {activePage === 'home' && (
          <div>
            <div className="dashboard-header">
              <h1 className="dashboard-header-bold-white">Find Services Near You</h1>
              <div className="location-row">
                <FaMapMarkerAlt className="map-icon location-icon" />
                {!isEditingLocation ? (
                  <>
                    <div className="location-text">
                      {isLoadingLocation ? "Fetching location..." : location}
                    </div>
                    <button
                      className="edit-location-btn"
                      onClick={handleEditLocation}
                      title="Edit address"
                    >
                      <FaEdit />
                    </button>
                  </>
                ) : (
                  <>
                    <input
                      type="text"
                      value={locationInput}
                      onChange={e => setLocationInput(e.target.value)}
                      placeholder="Enter your address"
                      className="location-input"
                    />
                    <button
                      className="edit-location-btn save-btn"
                      onClick={handleSaveLocation}
                      title="Save address"
                    >
                      <FaCheck />
                    </button>
                    <button
                      className="edit-location-btn cancel-btn"
                      onClick={() => setIsEditingLocation(false)}
                      title="Cancel"
                    >
                      <FaTimes />
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
                  placeholder="Search by location..."
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
            {/*{connectedProvider && (*/}
              {/*<WideProviderCard provider={connectedProvider} />*/}
            {/*)*/}
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

        {activePage === 'bookings' && (
          <div className="bookings-page">
            <h2 className="dashboard-header-bold-white">Current Bookings</h2>
            <div className="providers-grid">
              {connectedProvider ? (
                <WideProviderCard provider={connectedProvider} showBookingDate />
              ) : (
                <div className="no-bookings-text">
                  No current bookings.
                </div>
              )}
            </div>
            <h2 className="dashboard-header-bold-white">Past Bookings</h2>
            <div className="providers-grid">
              <div className="no-bookings-text">
                No past bookings.
              </div>
            </div>
          </div>
        )}

        {showModal && (
          <ProviderModal
            provider={modalProvider}
            onClose={handleCloseModal}
            selectedServices={selectedServices}
            setSelectedServices={setSelectedServices}
            modalScrollTop={modalScrollTop}
            setModalScrollTop={setModalScrollTop}
          />
        )}
        {activePage === 'profile' && (
          <div className="profile-page">
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