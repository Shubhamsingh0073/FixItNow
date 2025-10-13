import React, { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaUserCircle, FaPhone, FaEnvelope, FaHome, FaCalendarAlt, FaSignOutAlt, FaQuestionCircle, FaRegComments, FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import './ProviderDashboard.css';

// Mock data for customers
const mockCustomers = [
  { id: 1, name: 'Alice Johnson', phone: '+1234567890', email: 'alice@email.com', category: 'Plumbing' },
  { id: 2, name: 'Bob Smith', phone: '+1987654321', email: 'bob@email.com', category: 'Electrical' },
  { id: 3, name: 'Carol Lee', phone: '+1472583690', email: 'carol@email.com', category: 'Carpentry' },
  { id: 4, name: 'David King', phone: '+1357924680', email: 'david@email.com', category: 'Cleaning' },
  { id: 5, name: 'Emma Brown', phone: '+1122334455', email: 'emma@email.com', category: 'Appliance Repair' }
];

// Mock bookings
const mockPastBookings = [
  { ...mockCustomers[1], status: 'Completed', bookingDate: '2025-09-25' },
  { ...mockCustomers[2], status: 'Completed', bookingDate: '2025-09-20' },
];

// Mock provider profile
const initialProvider = {
  rating: 4.6,
  reviews: [
    { user: 'Alice', stars: 5, text: 'Great work, very professional!' },
    { user: 'Bob', stars: 4, text: 'Quick and reliable service.' },
    { user: 'Carol', stars: 5, text: 'Excellent communication and job done perfectly.' },
    { user: 'David', stars: 3, text: 'Arrived late but completed the job as expected.' }
  ]
};

const categories = ['Plumbing', 'Electrical', 'Carpentry', 'Cleaning', 'Appliance Repair', 'Others'];

function generateTimeOptions() {
  const times = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hour = h % 12 === 0 ? 12 : h % 12;
      const minute = m === 0 ? "00" : "30";
      const ampm = h < 12 ? "am" : "pm";
      times.push(`${hour}:${minute} ${ampm}`);
    }
  }
  return times;
}
const timeOptions = generateTimeOptions();

const bookingStatusOptions = ['Pending', 'In Progress', 'Completed'];

const ProviderDashboard = () => {
  // Location state (address as text)
  const [location, setLocation] = useState('');
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [locationInput, setLocationInput] = useState('');
  const [latLng, setLatLng] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const [userData, setUserData] = useState({ name: '', email: '' });

  // Sidebar navigation
  const [activePage, setActivePage] = useState('home');
  const [requests, setRequests] = useState(mockCustomers);
  const [acceptedRequest, setAcceptedRequest] = useState(null);
  const [currentBookingStatus, setCurrentBookingStatus] = useState('Pending');
  const [provider, setProvider] = useState(initialProvider);
  const [isEditing, setIsEditing] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [availabilityFrom, setAvailabilityFrom] = useState('');
  const [availabilityTo, setAvailabilityTo] = useState('');
  const [descriptionInput, setDescriptionInput] = useState('');

  // Service price section states
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);
  const [otherCategory, setOtherCategory] = useState('');
  const [services, setServices] = useState([]);
  const [showAddService, setShowAddService] = useState(false);
  const [addServiceName, setAddServiceName] = useState('');
  const [addServicePrice, setAddServicePrice] = useState('');
  const [editServiceIdx, setEditServiceIdx] = useState(null);

  const savePhoneToBackend = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('No token found. Please login.');
      return;
    }
    try {
      const response = await fetch('http://localhost:8087/users/me/phone', {
        method: 'PUT', // or 'POST' if your backend expects it
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ phone: phoneInput }),
      });
      if (!response.ok) throw new Error('Failed to save phone');
      //alert('Phone updated!');
    } catch (error) {
      alert('Phone update failed: ' + error.message);
    }
  };


  const saveAvailabilityDescriptionToBackend = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('No token found. Please login.');
      return;
    }
    try {
      const response = await fetch('http://localhost:8087/service/me', {
        method: 'PUT', // or 'POST' if your backend expects it
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          availability: { from: availabilityFrom, to: availabilityTo },
          description: descriptionInput,
        }),
      });
      if (!response.ok) throw new Error('Failed to save availability/description');
      //alert('Availability and description updated!');
    } catch (error) {
      alert('Availability/description update failed: ' + error.message);
    }
  };
  
  //save location to backend
  const saveLocationToBackend = async (locationText) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('No token found. Please login.');
      return;
    }
    try {
      const response = await fetch('http://localhost:8087/users/me/location', {
        method: 'PUT', // or POST if your backend expects it
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ location: locationText }),
      });
      if (!response.ok) throw new Error('Failed to save location');
      // optionally show a success message here
    } catch (error) {
      alert('Location update failed: ' + error.message);
    }
  };


  // Get user data from localStorage
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error("No JWT found in localStorage. Please login.");
      return;
    }

    fetch('http://localhost:8087/users/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
      .then(res => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then(data => {
        // Backend should return { name, email, phone }
        setUserData({ name: data.name, email: data.email, phone: data.phone });
        setPhoneInput(data.phone || ''); // If you use a separate state for phone input
      })
      .catch(err => {
        console.error('Error fetching user:', err);
      });
    
    // Fetch availability and description
    fetch('http://localhost:8087/service/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    })
      .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch service'))
      .then(data => {
        if (data.availability) {
          setAvailabilityFrom(data.availability.from);
          setAvailabilityTo(data.availability.to);
        }
        if (data.description) setDescriptionInput(data.description);
      })
      .catch(err => console.error('Service fetch error:', err));
  }, []);
  

  // Get geolocation and address using OpenStreetMap Nominatim
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
              const locationText = data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
              setLocation(locationText);
              setLocationInput(locationText);
              setIsLoadingLocation(false);

              // Save location to backend
              saveLocationToBackend(locationText);
            })
            .catch(err => {
              const locationText = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
              setLocation(locationText);
              setLocationInput(locationText);
              setIsLoadingLocation(false);

              // Save fallback location to backend
              saveLocationToBackend(locationText);
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

  // Only allow digits, max 10
  const handlePhoneInputChange = (e) => {
    if (!isEditing) return;
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhoneInput(val);
  };

  // Save Profile Details
  const handleProfileSave = async () => {
    setProvider(prev => ({
      ...prev,
      phone: phoneInput,
      availability: { from: availabilityFrom, to: availabilityTo },
      description: descriptionInput
    }));
    setIsEditing(false);
    await savePhoneToBackend();
    await saveAvailabilityDescriptionToBackend();
    alert('Profile updated!');
  };

  // Service modal open/close handlers
  const openAddService = (idx = null) => {
    if (idx !== null) {
      setEditServiceIdx(idx);
      setAddServiceName(services[idx].name);
      setAddServicePrice(services[idx].price.toString());
    } else {
      setEditServiceIdx(null);
      setAddServiceName('');
      setAddServicePrice('');
    }
    setShowAddService(true);
  };
  const closeAddService = () => {
    setShowAddService(false);
    setAddServiceName('');
    setAddServicePrice('');
    setEditServiceIdx(null);
  };

  const handleAddServiceSubmit = (e) => {
    e.preventDefault();
    if (!addServiceName || !addServicePrice || isNaN(Number(addServicePrice))) return;
    let newService = { name: addServiceName, price: Number(addServicePrice) };
    if (editServiceIdx !== null) {
      setServices(services.map((srv, idx) => idx === editServiceIdx ? newService : srv));
    } else {
      setServices([...services, newService]);
    }
    closeAddService();
  };

  const handleDeleteService = (idx) => {
    setServices(services.filter((_, i) => i !== idx));
  };

  // Edit Button
  const handleEditProfile = () => {
    setIsEditing(true);
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
    saveLocationToBackend(locationInput);
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
              <div style={{marginTop: '0.6rem', marginBottom: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.8rem'}}>
                <FaMapMarkerAlt style={{fontSize: '1.2em'}} />
                {isLoadingLocation ? (
                  <span style={{ color: "#f0f0f0ea" }}>Fetching location...</span>
                ) : isEditingLocation ? (
                  <>
                    <input
                      type="text"
                      value={locationInput}
                      onChange={e => setLocationInput(e.target.value)}
                      placeholder="Enter your address"
                      style={{ padding: "0.5em", borderRadius: "0.5em", fontSize: "1em", width: "18em" }}
                    />
                    <button className="accept-request-btn" style={{marginLeft: "0.6em"}} onClick={handleSaveLocation}>Save</button>
                    <button className="accept-request-btn" style={{marginLeft: "0.6em", background: "#e53e3e"}} onClick={() => setIsEditingLocation(false)}>Cancel</button>
                  </>
                ) : (
                  <>
                    <span style={{fontSize:"1em", color: "#f0f0f0ea", fontWeight: "500"}}>
                      {location}
                    </span>
                    <button className="accept-request-btn" style={{marginLeft: "0.6em"}} onClick={handleEditLocation}>
                      <FaEdit style={{marginRight: "0.4em"}} />
                    </button>
                  </>
                )}
              </div>
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

        {/* Profile (same as before) */}
        {activePage === 'profile' && (
          <div className="profile-page">
            {/* Section 1: Profile Details */}
            <div className="profile-info-box wide-profile-box">
              <div className="profile-info-right">
                <h2 className="profile-reviews-heading" style={{fontSize: '1.33rem', marginBottom: '0.7rem'}}>Profile Details</h2>
                <div className="profile-info-item"><strong>Name:</strong> {userData.name}</div>
                <div className="profile-info-item"><strong>Email:</strong> {userData.email}</div>
                {/* Phone */}
                <div className="profile-info-item phone-box-wide">
                  <label htmlFor="phone"><strong>Phone Number:</strong></label>
                  <input
                    id="phone"
                    type="tel"
                    disabled={!isEditing}
                    placeholder="Add phone number"
                    value={phoneInput}
                    onChange={handlePhoneInputChange}
                  />
                  {phoneInput.length !== 10 && isEditing && (
                    <span style={{ color: 'red', fontSize: '0.96rem', marginLeft: '0.6rem' }}>Phone number must be 10 digits</span>
                  )}
                </div>
                {/* Availability */}
                <div className="profile-info-item phone-box-wide">
                  <label><strong>Availability:</strong></label>
                  <select
                    value={availabilityFrom}
                    disabled={!isEditing}
                    onChange={e => setAvailabilityFrom(e.target.value)}
                    style={{marginLeft:'0.3rem'}}
                  >
                    {timeOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <span style={{margin: "0 0.5rem"}}>to</span>
                  <select
                    value={availabilityTo}
                    disabled={!isEditing}
                    onChange={e => setAvailabilityTo(e.target.value)}
                  >
                    {timeOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                {/* Description */}
                <div className="profile-info-item description-box">
                  <label htmlFor="description"><strong>Description:</strong></label>
                  <textarea
                    id="description"
                    rows={3}
                    disabled={!isEditing}
                    placeholder="Add provider shop details"
                    value={descriptionInput}
                    onChange={e => setDescriptionInput(e.target.value)}
                  />
                </div>
                {/* Edit & Save Buttons */}
                <div style={{display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem'}}>
                  <button className="accept-request-btn" style={{background: '#6b46c1'}} onClick={handleEditProfile} disabled={isEditing}>Edit</button>
                  <button
                    className="save-phone-button"
                    style={{background:'#2b6cb0'}}
                    onClick={handleProfileSave}
                    disabled={!isEditing || phoneInput.length !== 10}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
            {/* Section 2: Service Price Box */}
            <div className="profile-info-box wide-profile-box" style={{marginBottom: '0.5rem', position: 'relative', minHeight: '180px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start'}}>
              <h2 className="profile-reviews-heading" style={{fontSize: '1.33rem', marginBottom: '0.7rem'}}>Service Details</h2>
              <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '1.2rem'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '0.7rem'}}>
                  <label htmlFor="category" style={{fontWeight: 'bold'}}>Category:</label>
                  <select id="category" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  {selectedCategory === 'Others' && (
                    <input
                      type="text"
                      placeholder="Mention your service"
                      value={otherCategory}
                      onChange={e => setOtherCategory(e.target.value)}
                      style={{marginLeft: '0.7rem', padding: '0.5rem', borderRadius: '0.5rem', border: '2px solid #e2e8f0'}}
                    />
                  )}
                </div>
                <button
                  className="accept-request-btn"
                  style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}
                  onClick={() => openAddService()}
                >
                  <FaPlus /> Add services
                </button>
              </div>
              {/* List of services */}
              <div style={{marginTop: '0.7rem', width: '100%', flex: 1, display: 'flex', alignItems: services.length === 0 ? 'center' : 'flex-start', justifyContent: services.length === 0 ? 'center' : 'flex-start'}}>
                {services.length === 0 ? (
                  <div style={{color: '#a0aec0', fontSize: '1.13rem', textAlign: 'center', width: '100%'}}>No services added yet.</div>
                ) : (
                  <table style={{width: '100%', borderCollapse: 'collapse'}}>
                    <thead>
                      <tr style={{background: '#faf5ff'}}>
                        <th style={{textAlign: 'left', padding: '0.6rem'}}>Service</th>
                        <th style={{textAlign: 'right', padding: '0.6rem'}}>Price (₹)</th>
                        <th style={{textAlign: 'center', padding: '0.6rem'}}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {services.map((srv, idx) => (
                        <tr key={idx} style={{borderBottom: '1px solid #e2e8f0'}}>
                          <td style={{padding: '0.6rem'}}>{srv.name}</td>
                          <td style={{padding: '0.6rem', textAlign: 'right'}}>{srv.price}</td>
                          <td style={{padding: '0.6rem', textAlign: 'center'}}>
                            <button style={{marginRight: '0.5rem'}} onClick={() => openAddService(idx)} title="Edit"><FaEdit /></button>
                            <button onClick={() => handleDeleteService(idx)} title="Delete"><FaTrash /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
            {/* Add/Edit Service Modal */}
            {showAddService && (
              <div style={{
                position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                background: 'rgba(0,0,0,0.17)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999
              }}>
                <form
                  onSubmit={handleAddServiceSubmit}
                  style={{
                    background: '#fff', borderRadius: '1rem', boxShadow: '0 4px 28px rgba(80,36,143,0.15)',
                    padding: '2.2rem 2.8rem', minWidth: '320px', maxWidth: '96vw'
                  }}
                >
                  <h3 style={{marginBottom: '1rem'}}>{editServiceIdx !== null ? 'Edit service' : 'Add service'}</h3>
                  <div style={{marginBottom: '1rem'}}>
                    <label style={{fontWeight: 'bold'}}>Service name:</label>
                    <input
                      type="text"
                      value={addServiceName}
                      onChange={e => setAddServiceName(e.target.value)}
                      required
                      style={{marginLeft: '0.7rem', padding: '0.6rem', borderRadius: '0.5rem', border: '2px solid #e2e8f0', width: '80%'}}
                      placeholder="Enter service name"
                    />
                  </div>
                  <div style={{marginBottom: '1.5rem'}}>
                    <label style={{fontWeight: 'bold'}}>Price (₹):</label>
                    <input
                      type="number"
                      min={0}
                      value={addServicePrice}
                      onChange={e => setAddServicePrice(e.target.value)}
                      required
                      style={{marginLeft: '0.7rem', padding: '0.6rem', borderRadius: '0.5rem', border: '2px solid #e2e8f0', width: '60%'}}
                      placeholder="Enter price"
                    />
                  </div>
                  <div style={{display: 'flex', justifyContent: 'flex-end', gap: '0.7rem'}}>
                    <button type="button" className="accept-request-btn" style={{background:'#6b46c1'}} onClick={closeAddService}>Cancel</button>
                    <button type="submit" className="accept-request-btn" style={{background:'#2b6cb0'}}>{editServiceIdx !== null ? 'Update' : 'Add'}</button>
                  </div>
                </form>
              </div>
            )}
            {/* Section 3: Reviews and actions */}
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