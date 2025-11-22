import React, { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaUserCircle, FaPhone, FaEnvelope, FaHome, FaCalendarAlt, FaSignOutAlt, FaQuestionCircle, FaRegComments, FaEdit, FaTrash, FaPlus, FaCheck, FaTimes, FaClock, FaChartArea, FaFacebookMessenger } from 'react-icons/fa';
import './ProviderDashboard.css';
import CustomerWideCard from './CustomerWideCard';
import ChatPanel from './ChatPanel';
import Sidebar from "./Sidebar"

export const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8087";

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


const ProviderDashboard = () => {
  // Location state (address as text)
  const [location, setLocation] = useState('');
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [locationInput, setLocationInput] = useState('');
  const [latLng, setLatLng] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const [userData, setUserData] = useState({ name: '', email: '' });

   const providerMenu = [
      { key: "home", label: "Home", icon: <FaHome /> },
      { key: "bookings", label: "Bookings", icon: <FaCalendarAlt /> },
      { key: "Chat", label: "Messages", icon: <FaFacebookMessenger /> },
      { key: "profile", label: "Profile", icon: <FaUserCircle /> },
    ];

  // Sidebar navigation
  const [activePage, setActivePage] = useState('home');
  const [pastBookings, setPastBookings] = useState([]); 
  const [acceptedRequest, setAcceptedRequest] = useState(null);
  const [currentBookingStatus, setCurrentBookingStatus] = useState('Confirmed');
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

  const [isEditingServices, setIsEditingServices] = useState(false);

  const savePhoneToBackend = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('No token found. Please login.');
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/users/me/phone`, {
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
      const response = await fetch(`${API_BASE}/service/me`, {
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


  //save service details to backend 
  const saveServiceDetailsToBackend = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('No token found. Please login.');
      return;
    }

    // Build subcategory object: { "wiring": 300, "repair": 500, ... }
    const subcategoriesObj = {};
    services.forEach(srv => {
      subcategoriesObj[srv.name] = srv.price;
    });

    const payload = {
      category: selectedCategory,
      subcategory: subcategoriesObj
    };

    try {
      const response = await fetch(`${API_BASE}/service/me`, {
        method: 'PUT', // or POST if your backend expects it
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Failed to save category/subcategories');
      // Optionally show a success message here
      alert('Service details updated!');
    } catch (error) {
      alert('Service details update failed: ' + error.message);
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
      const response = await fetch(`${API_BASE}/users/me/location`, {
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


  const updateBookingStatusInBackend = async (bookingId, newStatus) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('No token found. Please login.');
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/bookings/status`, {
        method: 'POST', 
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookingId: bookingId,      // send bookingId in body
          status: newStatus          // send status in body
        }),
      });
      if (!response.ok) throw new Error('Failed to update booking status');
      // Optionally handle success here
    } catch (error) {
      alert('Booking status update failed: ' + error.message);
    }
  };


  const [providerBookings, setProviderBookings] = useState([]);
  const [conversations, setConversations] = useState([]); // { peerId, peerName, lastMessage }
  const [selectedPeer, setSelectedPeer] = useState(null);
  const [selectedPeerName, setSelectedPeerName] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${API_BASE}/bookings/provider/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
      .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch bookings'))
      .then(data => {
        setProviderBookings(data); // Array of bookings as received from backend
      })
      .catch(err => {
        console.error('Error fetching provider bookings:', err);
        setProviderBookings([]);
      });
  }, []);


useEffect(() => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.error("No JWT found in localStorage. Please login.");
    return;
  }

  // fetch profile
  fetch(`${API_BASE}/users/me`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })
    .then(res => {
      if (!res.ok) throw new Error(`Failed to fetch user: ${res.status}`);
      return res.json();
    })
    .then(data => {
      setUserData({ id: data.id, name: data.name, email: data.email, phone: data.phone });
      setPhoneInput(data.phone || '');
      if (data.id) localStorage.setItem('userId', data.id);
    })
    .catch(err => {
      console.error('Error fetching user:', err);
    });

  // fetch service/me once
  fetch(`${API_BASE}/service/me`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
  })
    .then(res => res.ok ? res.json() : Promise.reject(`Failed to fetch service: ${res.status}`))
    .then(data => {
      if (data.availability) {
        setAvailabilityFrom(data.availability.from);
        setAvailabilityTo(data.availability.to);
      }
      if (data.description) setDescriptionInput(data.description);
      if (data.category) setSelectedCategory(data.category);
      if (data.subcategories) {
        const savedServices = Object.entries(data.subcategories).map(([name, price]) => ({ name, price }));
        setServices(savedServices);
      }
    })
    .catch(err => console.error('Service fetch error:', err));
}, []); // run once on mount


// Load conversations when Chat page becomes active and userData.id is available
useEffect(() => {
  const loadConversations = async () => {
    const token = localStorage.getItem('token');
    const providerId = userData?.id || localStorage.getItem('userId');
    if (!providerId) return;

    setLoadingConversations(true);
    try {
      const url = `${API_BASE}/api/chat/conversations?userId=${encodeURIComponent(providerId)}`;
      console.log('Fetching conversations:', url);
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      const text = await res.text(); // read raw body for robust logging
      // If not OK, log the raw response and throw
      if (!res.ok) {
        console.error('Conversations fetch failed', res.status, text);
        throw new Error(`Conversations fetch failed: ${res.status}`);
      }

      // Try parsing JSON; if parsing fails log the raw body for debugging
      let arr;
      try {
        arr = JSON.parse(text);
      } catch (parseErr) {
        console.error('Failed to parse conversations JSON. Raw body:', text);
        throw parseErr;
      }

      const convs = (arr || []).map(c => ({
        peerId: c.peerId,
        peerName: c.peerName || c.peer_name || c.peer || c.peerId,
        lastMessage: c.lastMessage || c.last_message || '',
        lastAt: c.lastAt || c.last_at || ''
      }));
      setConversations(convs);
    } catch (err) {
      console.error('Failed loading conversations', err);
      setConversations([]);
    } finally {
      setLoadingConversations(false);
    }
  };

  if (activePage === 'Chat' && (userData && userData.id)) loadConversations();
}, [activePage, userData]);



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

  }, []);


  // Accept request
  const handleAcceptRequest = (customer) => {

    updateBookingStatusInBackend(customer.bookingId, "CONFIRMED");

    // Update booking status in providerBookings
      setProviderBookings(prev =>
        prev.map(req =>
          req.bookingId === customer.bookingId
            ? { ...req, status: "CONFIRMED" }
            : req
        )
      );

    
    setActivePage('home');
  };

  // Cancel request -> move to past bookings with status 'Cancelled'
  const handleCancelRequest = (customer) => {
      
    updateBookingStatusInBackend(customer.bookingId, "CANCELLED");

    // Update the booking status in providerBookings
    setProviderBookings(prev =>
      prev.map(req =>
        req.bookingId === customer.bookingId
          ? { ...req, status: "CANCELLED" }
          : req
      )
    );

    const cancelledCard = {
      ...customer,
      status: 'Cancelled',
      bookingDate: customer.bookingDate || new Date().toISOString().slice(0, 10)
    };

    // Add to past bookings
    setPastBookings(prev => [cancelledCard, ...prev]);

    // Optionally navigate to bookings tab
    setActivePage('bookings');
  };

  // Change status in bookings
  const handleBookingStatusChange = (bookingId, newStatus) => {
    // Update backend
    updateBookingStatusInBackend(bookingId, newStatus);

    // Update status in providerBookings
    setProviderBookings(prev =>
      prev.map(b =>
        b.bookingId === bookingId ? { ...b, status: newStatus } : b
      )
    );

    setAcceptedRequest(prev => prev && prev.bookingId === bookingId
      ? { ...prev, status: newStatus }
      : prev
    );

    // If status is changed to COMPLETED, move to past bookings
    if (newStatus === "COMPLETED") {
      const completedCard = providerBookings.find(b => b.bookingId === bookingId);
      setPastBookings(prev => [completedCard, ...prev]);
      setAcceptedRequest(null);
    }
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
    const trimmed = locationInput.trim();
    if (trimmed === '') {
      setIsEditingLocation(false);
      return;
    }

    // update UI immediately
    setLocation(trimmed);
    setIsEditingLocation(false);

    // save to backend like your old code (no optimistic-revert logic)
    saveLocationToBackend(trimmed).catch(err => {
      console.error('Failed to save location', err);
      alert('Failed to save location. Please try again.');
    });
  };

  // Logout
  const handleLogout = () => {
    window.location.href = '/login';
  };

  // Card for customer request (Home and Past Bookings Small Card)
  const CustomerSmallCard = ({ booking, showAccept, acceptedStatus }) => {
    const totalPrice = booking.bookedServices ? Object.values(booking.bookedServices).reduce((sum, price) => sum + price, 0) : 0;

  return (
    <div className={`customer-card ${acceptedStatus ? 'accepted-card' : ''}`}>
      
      <div className="customer-info">
        <h3><b>{booking.customerName}</b></h3>
      
        <p className="customer-contact-info">
          <FaMapMarkerAlt color="#cf1616ff" className="map-icon" /> {
            (() => {
              const maxWords = 5;
              const words = (booking.customerLocation || "").split(" ");
              const truncated = words.slice(0, maxWords).join(" ");
              return words.length > maxWords ? truncated + "..." : truncated;
            })()
          }
        </p>
        <p className="customer-contact-info"><FaPhone /> {booking.customerPhone}</p>
        <p className="customer-contact-info"><FaEnvelope /> {booking.customerEmail}</p>
        <p className="customer-contact-info">
          <FaCalendarAlt /> {booking.bookingDate}
          <FaClock /> {booking.timeSlot}
        </p>
        <div className="booked-services">
          <strong>Booked Services:</strong>
          <ul className="booked-services-list">
            {booking.bookedServices && Object.entries(booking.bookedServices).map(([service, price]) => (
              <li className="booked-services-item" key={service}>
                <span className="booked-service-name">{service}</span>
                <span className="booked-service-price">₹{price}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      {acceptedStatus && booking.status && (
        <div className="card-info-item accepted-status">
          Status:
          <span className={`accepted-status-label status-${booking.status.toLowerCase().replace(/ /g, '-')}`}
            style={booking.status === 'Cancelled' ? { color: 'red', background: 'pink' } : {}}
          >
            {booking.status}</span>

        </div>
      )}

      {/* Buttons or status badge */}
      {showAccept && (
        <div className="accept-btn-row total-right-row">
          <div>
            <button className="accept-request-btn" onClick={() => handleAcceptRequest(booking)} style={{ marginRight: '0.6rem' }}>Accept</button>
            <button className="accept-request-btn" onClick={() => handleCancelRequest(booking)} style={{ background: '#e53e3e' }}>Cancel</button>
          </div>
          <div className="booked-services-total">
            <span className="total-label">Total:</span>
            <span className="total-value">₹{totalPrice}</span>
          </div>
        </div>
      )}
    </div>
  );
};

  return (
    <div className="provider-dashboard-root">
      {/* Sidebar */}
        <Sidebar
          activeTab={activePage}
          onActivate={(k) => setActivePage(k)}
          menu={providerMenu}        
          showLogoOnCollapsed={true}
          handleLogout={() => {handleLogout()}}
        />

      {/* Main Content */}
      <div className="dashboard-main">
        {/* Home */}
        {activePage === 'home' && (
          <div>
            <div className="dashboard-header">
              <h1 className="dashboard-header-bold-white">Customers Near You</h1>
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
            {providerBookings
              .filter(booking => booking.status === "CONFIRMED" || booking.status === "IN_PROGRESS")
              .map(booking => (
                <CustomerWideCard
                  key={booking.bookingId}
                  customer={booking}
                  showAcceptedStatus={true}
                  showMap={true}
                  showDropdown={false}
                  currentBookingStatus={booking.status}
                  handleBookingStatusChange={handleBookingStatusChange}
                   showChatButton={false}
                  providerId={userData?.id || localStorage.getItem('userId')}
                />
              ))
            }
            <div style={{ marginTop: acceptedRequest ? '2.2rem' : 0 }}>
              <h2 className="dashboard-header-bold-white" style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Customer Requests</h2>
              <div className="customers-grid">
                {providerBookings
                  .filter(booking => booking.status === "PENDING")
                  .map(booking => (
                  <CustomerSmallCard
                    key={booking.bookingId}
                    booking={booking}
                    showAccept={true}
                    acceptedStatus={booking.status === 'CONFIRMED'}
                    handleAcceptRequest={handleAcceptRequest}
                    handleCancelRequest={handleCancelRequest}
                  />
                ))}
              </div>
            </div>
          </div>
        )}


        {/* Chat Page */}
        {activePage === 'Chat' && (
          <div className="chat-page">
            <div className="chat-sidebar">
              <h3>Messages</h3>
              {loadingConversations ? (
                <div style={{ color: '#666' }}>Loading...</div>
              ) : (
                <div className="conversations-list">
                  {conversations.length === 0 ? (
                    <div style={{ color: '#999' }}>No conversations yet.</div>
                  ) : (
                    conversations.map(conv => (
                      <button
                        key={conv.peerId}
                        onClick={() => { setSelectedPeer(conv.peerId); setSelectedPeerName(conv.peerName || conv.peerId); }}
                        className={`conversation-btn ${selectedPeer === conv.peerId ? 'active' : ''}`}
                        type="button"
                      >
                        <div className="conversation-peer">{conv.peerName || conv.peerId}</div>
                        <div className="conversation-preview">{conv.lastMessage}</div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="chat-main">
              {selectedPeer ? (
                <ChatPanel
                  currentUserId={userData?.id || localStorage.getItem('userId')}
                  peerId={selectedPeer}
                  peerName={selectedPeerName}
                  onBack={() => setSelectedPeer(null)}
                />
              ) : (
                <div className="chat-empty">
                  <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No conversation selected</div>
                  <div>Select a person from the left to view and reply to messages.</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bookings */}
        {activePage === 'bookings' && (
          <div className="bookings-page">
            <h2 className="dashboard-header-bold-white">Current Bookings</h2>
            <div className="customers-grid">
              {providerBookings
                .filter(booking => booking.status === "CONFIRMED" || booking.status === "IN_PROGRESS")
                .map(booking => (
                  <CustomerWideCard
                    key={booking.bookingId}
                    customer={booking}
                    showAcceptedStatus={false}
                    showMap={false}
                    showDropdown={true}
                    currentBookingStatus={booking.status}
                    handleBookingStatusChange={newStatus => handleBookingStatusChange(booking.bookingId, newStatus)}
                    providerId={userData?.id || localStorage.getItem('userId')}
                    showChatButton={false}
                  />
                ))}
            </div>
            <h2 className="dashboard-header-bold-white">Past Bookings</h2>
            <div className="customers-grid">
              {providerBookings
                .filter(booking => booking.status === "COMPLETED" || booking.status === "CANCELLED")
                .map(booking => (
                  <CustomerSmallCard
                    key={booking.bookingId}
                    booking={booking}
                    showAccept={false}
                    acceptedStatus={booking.status === 'COMPLETED' || booking.status === 'CANCELLED'}
                  />
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
                {/* Edit Services Button */}
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '1.2rem'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '0.7rem'}}>
                    <label htmlFor="category" style={{fontWeight: 'bold'}}>Category:</label>
                    <select
                      id="category"
                      value={selectedCategory}
                      onChange={e => setSelectedCategory(e.target.value)}
                      disabled={!isEditingServices}
                    >
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
                        disabled={!isEditingServices}
                        style={{marginLeft: '0.7rem', padding: '0.5rem', borderRadius: '0.5rem', border: '2px solid #e2e8f0'}}
                      />
                    )}
                  </div>
                  {isEditingServices ? (
                    <>
                      <button
                        className="accept-request-btn"
                        style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}
                        onClick={() => openAddService()}
                        disabled={!isEditingServices}
                      >
                        <FaPlus /> Add services
                      </button>
                    </>
                  ) : (
                    <button
                      className="accept-request-btn"
                      style={{background:'#6b46c1'}}
                      onClick={() => setIsEditingServices(true)}
                    >
                      Edit
                    </button>
                  )}
                </div>
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
                            <button
                              style={{marginRight: '0.5rem'}}
                              onClick={() => isEditingServices && openAddService(idx)}
                              title="Edit"
                              disabled={!isEditingServices}
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => isEditingServices && handleDeleteService(idx)}
                              title="Delete"
                              disabled={!isEditingServices}
                            >
                              <FaTrash />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>


              {/* Save button at bottom right */}
              {isEditingServices && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  width: '100%',
                  marginTop: '1.2rem'
                }}>
                  <button
                    className="save-phone-button"
                    style={{background:'#2b6cb0'}}
                    onClick={() => {
                      saveServiceDetailsToBackend();
                      setIsEditingServices(false);
                    }}
                  >
                    Save
                  </button>
                </div>
              )}


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