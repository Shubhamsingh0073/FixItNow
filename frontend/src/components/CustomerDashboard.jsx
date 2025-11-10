import React, { useState, useEffect, useRef } from 'react';
import { FaMapMarkerAlt, FaSearch, FaTools, FaStar, FaPhone, FaEnvelope, FaExclamationTriangle, FaUser, FaHome, FaCalendarAlt, FaUserCircle, FaSignOutAlt, FaQuestionCircle, FaRegComments, FaRegThumbsUp, FaEdit, FaTimes, FaCheck, FaToolbox, FaClock } from 'react-icons/fa';
import './CustomerDashboard.css';
import ProviderModal from "./ProviderModal";
import ChatPanel from "./ChatPanel";

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});


const categories = [
  { id: 'all', name: 'All Services' },
  { id: 'plumbing', name: 'Plumbing' },
  { id: 'electrical', name: 'Electrical' },
  { id: 'carpentry', name: 'Carpentry' },
  { id: 'cleaning', name: 'Cleaning' },
  { id: 'appliance', name: 'Appliance Repair' }
];


async function geocodeAddress(address) {
  const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
  const data = await res.json();
  if (data && data.length > 0) {
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  }
  return null;
}

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
  // userData added to hold id/name used by chat endpoints
  const [userData, setUserData] = useState(null);

  const [activePage, setActivePage] = useState('home');
  const [phoneInput, setPhoneInput] = useState('');
  const [connectedProvider, setConnectedProvider] = useState(null);

  const [isEditingPhone, setIsEditingPhone] = useState(false);

  const [modalBooking, setModalBooking] = useState(null);


  const [showReportForm, setShowReportForm] = useState(false);
  const [reportProviderId, setReportProviderId] = useState('');
  const [reportText, setReportText] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);

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


  // Get geolocation and address using OpenStreetMap Nominatim
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
              const locationText = data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
              setLocation(locationText);
              setLocationInput(locationText);
              setIsLoadingLocation(false);
              saveLocationToBackend(locationText);
            })
            .catch(err => {
              const locationText = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
              setLocation(locationText);
              setLocationInput(locationText);
              setIsLoadingLocation(false);
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


  const [customerBookings, setCustomerBookings] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch('http://localhost:8087/bookings/customer/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
      .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch bookings'))
      .then(data => {
        setCustomerBookings(data); // Array of bookings received from backend
      })
      .catch(err => {
        console.error('Error fetching customer bookings:', err);
        setCustomerBookings([]);
      });
  }, []);


  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found. Please login.');
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
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(data => {
        // Backend should return { id, name, email, phone }
        setCurrentUser({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || ''
        });
        setPhoneInput(data.phone || '');
        // store user id for chat endpoints and local use
        if (data.id) {
          setUserData({ id: data.id, name: data.name, email: data.email });
          localStorage.setItem('userId', data.id);
        }
      })
      .catch(err => {
        console.error('Error fetching user:', err);
      });
  }, []);


  useEffect(() => {
    async function fetchAndGeocodeProviders() {
      try {
        const res = await fetch('http://localhost:8087/users/providers');
        const providers = await res.json();
        const providersArray = Array.isArray(providers) ? providers : [providers];

        // Geocode each provider's location field
        const providersWithCoords = await Promise.all(
          providersArray.map(async (provider) => {
            const coords = provider.location
              ? await geocodeAddress(provider.location)
              : null;
            return coords
              ? { ...provider, ...coords }
              : provider;
          })
        );
        setServiceProviders(providersWithCoords);
      } catch (error) {
        console.error('Error fetching providers:', error);
        setServiceProviders([]);
      }
    }

    fetchAndGeocodeProviders();
  }, []);


  // Chat-specific state for customers
  const [conversations, setConversations] = useState([]); // { peerId, peerName, lastMessage }
  const [selectedPeer, setSelectedPeer] = useState(null);
  const [selectedPeerName, setSelectedPeerName] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(false);

  // only show providers that are approved (and match category/search)
  const filteredProviders = serviceProviders.filter(provider => {
    // require provider to be approved for the home list
    const isApproved = (provider?.verified ?? '').toString().toLowerCase() === 'approved';

    if (!isApproved) return false;

    let matchesCategory = true;
    if (selectedCategory !== 'all') {
      matchesCategory = provider.category && provider.category.toLowerCase().includes(selectedCategory);
    }
    const matchesSearch = (provider.location || '').toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });
  
  const bookedProviderIds = new Set(
    customerBookings
      .filter(b => b.status) // status is assigned
      .map(b => b.providerId) // assuming booking has providerId
  );
  
  const homeProviders = filteredProviders.filter(
    p => !bookedProviderIds.has(p.id)
  );


  const reportOptions = React.useMemo(() => {
  // gather providerIds from customerBookings (bookings has providerId)
  const providerIds = Array.from(new Set((customerBookings || []).map(b => b.providerId).filter(Boolean)));
  // map to provider objects (look up from serviceProviders by id)
  return providerIds.map(pid => {
    const prov = serviceProviders.find(s => String(s.id) === String(pid) || (s.provider && String(s.provider.id) === String(pid)));
    const name = prov?.provider?.name || prov?.name || prov?.category || pid;
    const createdOn = prov?.provider?.createdOn || prov?.createdOn || '';
    return { id: pid, name, createdOn };
  });
}, [customerBookings, serviceProviders]);

  // Handler to submit report
  const handleReportSubmit = async () => {
    // reporter id: prefer the userData object if you have it, otherwise fallback to localStorage
    const reporterId = (userData && userData.id) || localStorage.getItem('userId');
    if (!reporterId) {
      alert('You are not logged in. Please login to submit a report.');
      return;
    }

    if (!reportProviderId) {
      alert('Please select a provider to report.');
      return;
    }

    if (!reportText || !reportText.trim()) {
      alert('Please enter a complaint before submitting.');
      return;
    }

    setReportSubmitting(true);

    try {
      // Use full backend URL if you don't have a proxy; otherwise you can use '/api/reports'
      const url = 'http://localhost:8087/api/reports';

      const token = localStorage.getItem('token'); // include JWT if backend requires auth

      const payload = {
        reportedById: reporterId,
        reportedOnId: reportProviderId,
        reason: reportText.trim()
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.error('Report submit failed', res.status, text);
        // show helpful message to user
        alert(`Failed to submit report: ${res.status} ${text || res.statusText}`);
        return;
      }

      // server responds with created resource details (per your backend)
      const data = await res.json().catch(() => null);
      console.log('Report created:', data);

      // Success UX: clear form, close panel, show confirmation
      setReportText('');
      setReportProviderId('');
      setShowReportForm(false); // if you used a toggle to show the form
      alert('Report submitted. Thank you.');

      // Optionally refresh any UI or fetch server-side complaints if you display them
    } catch (err) {
      console.error('Network error submitting report', err);
      alert('Network error while submitting report. Please try again.');
    } finally {
      setReportSubmitting(false);
    }
  };

  
  // load conversations for customer when Chat tab active
  // inside CustomerDashboard component (replace the existing conversations-loading useEffect)
  useEffect(() => {
    const ADMIN_PEER_ID = 'U10';
    const ADMIN_PEER_NAME = 'Admin';

    const loadConversations = async () => {
      const token = localStorage.getItem('token');
      const customerId = userData?.id || localStorage.getItem('userId');
      if (!customerId) return;

      setLoadingConversations(true);
      try {
        const url = `http://localhost:8087/api/chat/conversations?userId=${encodeURIComponent(customerId)}`;
        const res = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        let arr = [];
        if (res.ok) {
          arr = await res.json();
        } else {
          // if server returns error, keep arr empty and still inject admin conv below
          const raw = await res.text().catch(() => '');
          console.warn('Conversations fetch failed', res.status, raw);
          arr = [];
        }

        // Normalize server results to { peerId, peerName, lastMessage, lastAt }
        const convsFromServer = (arr || []).map(c => ({
          peerId: c.peerId,
          peerName: c.peerName || c.peer_name || c.peer || c.peerId,
          lastMessage: c.lastMessage || c.last_message || '',
          lastAt: c.lastAt || c.last_at || ''
        }));

        // Ensure admin conversation is present. If server already returned admin conv, keep it.
        const hasAdmin = convsFromServer.some(c => String(c.peerId) === String(ADMIN_PEER_ID));
        const finalConvs = hasAdmin
          ? convsFromServer
          : // put admin at top
            [{ peerId: ADMIN_PEER_ID, peerName: ADMIN_PEER_NAME, lastMessage: '', lastAt: '' }, ...convsFromServer];

        // Remove duplicates by peerId (keeping first occurrence)
        const seen = new Set();
        const dedup = [];
        for (const c of finalConvs) {
          const pid = String(c.peerId);
          if (!seen.has(pid)) {
            seen.add(pid);
            dedup.push(c);
          }
        }

        setConversations(dedup);

        // OPTIONAL: If you want the server to create the conversation record for admin (so history endpoints return a conversation id),
        // you can POST to the server when no admin conv exists. Uncomment the block below if you have a backend endpoint
        // to create/initiate a conversation (adjust URL to your API).
        /*
        if (!hasAdmin) {
          try {
            await fetch('http://localhost:8087/api/chat/conversations', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ participants: [customerId, ADMIN_PEER_ID], initiatedBy: customerId })
            });
            // no need to re-fetch immediately; polling will pick it up next tick/interval
          } catch (err) {
            console.warn('Failed to create admin conversation on server', err);
          }
        }
        */

      } catch (err) {
        console.error('Failed loading conversations', err);
        // Even if fetch fails, still show the admin conv so customers can message Admin
        setConversations([{ peerId: ADMIN_PEER_ID, peerName: ADMIN_PEER_NAME, lastMessage: '', lastAt: '' }]);
      } finally {
        setLoadingConversations(false);
      }
    };

    if (activePage === 'Chat') {
      loadConversations();
      const interval = setInterval(() => {
        loadConversations().catch(() => {});
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [activePage, userData]);


const handleConnect = (provider, bookingDate, selectedServicesFromModal, selectedSlot) => {
  // Prepare the booked services object
  const bookedServices = {};
  Object.entries(selectedServicesFromModal || {})
    .filter(([name, checked]) => checked)
    .forEach(([name]) => {
      bookedServices[name] = provider.subcategory[name];
    });

  // Create the new booking object as expected in your booking cards
  const newBooking = {
    bookingId: Date.now(), // Or get from backend later
    providerId: provider.id,
    status: "PENDING",
    bookingDate,
    timeSlot: selectedSlot,
    bookedServices,
  };

  setCustomerBookings(prev => [...prev, newBooking]);
  setActivePage('bookings');
  setShowModal(false); // Close the modal
};

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    window.location.href = '/login';
  };


  const savePhoneToBackend = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('No token found. Please login.');
      return;
    }
    try {
      const response = await fetch('http://localhost:8087/users/me/phone', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ phone: phoneInput }),
      });
      if (!response.ok) throw new Error('Failed to save phone');
    } catch (error) {
      alert('Phone update failed: ' + error.message);
    }
  };

  const handlePhoneSave = async () => {
    setCurrentUser(prev => ({ ...prev, phone: phoneInput }));
    localStorage.setItem('currentUser', JSON.stringify({ ...currentUser, phone: phoneInput }));
    setIsEditingPhone(false);
    await savePhoneToBackend();
    alert("Phone number saved!");
  };

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


  const handleEditLocation = () => {
    setLocationInput(location);
    setIsEditingLocation(true);
  };

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

  const handleSeeDetails = (provider) => {
    setModalProvider(provider);
    setShowModal(true);
    setModalBooking(null);
    // Reset selectedServices for all catalog services to false!
    const initialState = {};
    if (provider && provider.subcategory) {
      Object.keys(provider.subcategory).forEach(svc => initialState[svc] = false);
    }
    setSelectedServices(initialState);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalProvider(null);
  };

  const WideProviderCard = ({ provider, booking, onSeeDetails }) => (
    <div className="provider-card">
      <div className="provider-info">
        <h3><b>{provider.name}</b></h3>
        <p className="category-info"><FaToolbox /> <b>{provider.category}</b></p>
        <p className="distance">
          <FaMapMarkerAlt color="#cf1616ff" className="map-icon" /> {
            (() => {
              const maxWords = 5;
              const words = (provider.location || "").split(" ");
              const truncated = words.slice(0, maxWords).join(" ");
              return words.length > maxWords ? truncated + "..." : truncated;
            })()
          }
        </p>
        <p className="contact-info"><FaPhone /> {provider.phone}</p>
        <p className="contact-info"><FaEnvelope /> {provider.email}</p>
        {booking && (
          <>
            <div className="booking-date">
              <FaCalendarAlt /> {booking.bookingDate}
              <FaClock /> {booking.timeSlot}
            </div>
          </>
        )}
      </div>
      {/* Status display */}
        {booking && booking.status && (
          <div className="card-info-item accepted-status">
            Status:
            <span
              className={`accepted-status-label status-${booking.status.toLowerCase().replace(/ /g, "-")}`}
            >
              {booking.status}
            </span>
          </div>
        )}
      <button
        className="connect-button"
        onClick={onSeeDetails}
        disabled={provider.available === false}
      >
        {provider.available === false ? 'Currently Unavailable' : 'See Details'}
      </button>
    </div>
  );


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
              const maxWords = 5;
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
    const userDataStored = JSON.parse(localStorage.getItem('currentUser'));
    if (userDataStored) {
      setCurrentUser(userDataStored);
      setPhoneInput(userDataStored.phone || '');
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
          {/* Chat tab for customer */}
          <button className={activePage === 'Chat' ? 'active' : ''}
                  onClick={() => setActivePage('Chat')}>
            <FaRegComments /> Messages
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
              <div style={{ margin: "2em 0" }}>
                <MapContainer
                  center={[
                    homeProviders[0]?.lat || 20,
                    homeProviders[0]?.lng || 80
                  ]}
                  zoom={4}
                  style={{ height: '400px', width: '100%', borderRadius: '1em' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="&copy; OpenStreetMap contributors"
                  />
                  {homeProviders.map((provider) =>
                    provider.lat && provider.lng ? (
                      <Marker key={provider.id} position={[provider.lat, provider.lng]}>
                        <Popup>
                          <strong>{provider.name}</strong><br />
                          {provider.location}
                        </Popup>
                      </Marker>
                    ) : null
                  )}
                </MapContainer>
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
            
            <div>
              {connectedProvider && homeProviders.length > 0 && (
                <h2 className="dashboard-header-bold-white" style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Other Services</h2>
              )}
              <div className="providers-grid">
                {homeProviders.map(provider => (
                  <ProviderCard key={provider.id} provider={provider} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Chat Page */}
        {activePage === 'Chat' && (
          <div className="chat-page">
            <div className="chat-sidebar">
              <h3>Conversations</h3>
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


        {activePage === 'bookings' && (
          <div className="bookings-page">
            <h2 className="dashboard-header-bold-white">Current Bookings</h2>
            <div className="providers-grid">
              {customerBookings
                .filter(booking => booking.status === "PENDING" || booking.status === "CONFIRMED" || booking.status === "IN_PROGRESS")
                .map((booking, idx) => {
                  const provider = serviceProviders.find(p => p.id === booking.providerId);
                  if (!provider) return null; // skip if provider not found
                  return (
                    <WideProviderCard
                      key={booking.bookingId || idx}
                      provider={provider}
                      booking={booking}
                      onSeeDetails={() => {
                        setModalProvider(provider);
                        setShowModal(true);
                        setModalBooking(booking); // new state to hold booking info
                      }}
                    />
                  );
                })
              }
            </div>
            <h2 className="dashboard-header-bold-white">Past Bookings</h2>
            <div className="providers-grid">
              {customerBookings.filter(booking => booking.status === "COMPLETED" || booking.status === "CANCELLED").length === 0 ? (
                <div className="no-bookings-text">
                  No past bookings.
                </div>
              ) : (
                customerBookings
                .filter(booking => booking.status === "COMPLETED" || booking.status === "CANCELLED")
                .map((booking, idx) => {
                  const provider = serviceProviders.find(p => p.id === booking.providerId);
                  if (!provider) return null; // skip if provider not found
                  return (
                    <WideProviderCard
                      key={booking.bookingId || idx}
                      provider={provider}
                      booking={booking}
                      onSeeDetails={() => {
                        setModalProvider(provider);
                        setShowModal(true);
                        setModalBooking(booking); // new state to hold booking info
                      }}
                    />
                  );
                })
              )}
            </div>
          </div>
        )}

        {showModal && (
          <ProviderModal
            provider={modalProvider}
            booking={modalBooking}             // Pass booking object!
            viewingBooking={!!modalBooking}
            onClose={handleCloseModal}
            selectedServices={selectedServices}
            setSelectedServices={setSelectedServices}
            modalScrollTop={modalScrollTop}
            setModalScrollTop={setModalScrollTop}
            handleConnect={handleConnect}
          />
        )}

        {/* Profile (same as before) */}
        {activePage === 'profile' && (
          <div className="profile-page">
            {/* Section 1: Profile Details */}
            <div className="profile-info-box wide-profile-box">
              <div className="profile-info-right">
                <h2 className="profile-reviews-heading" style={{fontSize: '1.33rem', marginBottom: '0.7rem'}}>Profile Details</h2>
                <div className="profile-info-item"><strong>Name:</strong> {currentUser.name}</div>
                <div className="profile-info-item"><strong>Email:</strong> {currentUser.email}</div>
                {/* Phone */}
                <div className="profile-info-item phone-box-wide">
                  <label htmlFor="phone"><strong>Phone Number:</strong></label>
                  <input
                    id="phone"
                    type="tel"
                    disabled={!isEditingPhone}
                    placeholder="Add phone number"
                    value={phoneInput}
                    onChange={e => setPhoneInput(e.target.value)}
                  />
                  {phoneInput.length !== 10 && isEditingPhone && (
                    <span style={{ color: 'red', fontSize: '0.96rem', marginLeft: '0.6rem' }}>Phone number must be 10 digits</span>
                  )}
                </div>
                
                
                {/* Edit & Save Buttons */}
                <div style={{display: 'flex', gap: '1rem', marginTop: '1rem'}}>
                  <button
                    className="accept-request-btn"
                    style={{background: '#6b46c1'}}
                    onClick={() => setIsEditingPhone(true)}
                    disabled={isEditingPhone}
                  >
                    Edit
                  </button>
                  <button
                    className="save-phone-button"
                    style={{background:'#2b6cb0'}}
                    onClick={handlePhoneSave}
                    disabled={!isEditingPhone || phoneInput.length !== 10}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>


            <div className="profile-actions-box">
              <button className="profile-wide-action-btn">
                <FaQuestionCircle className="profile-action-icon" /> Help
              </button>
              <div className="report-container">
              <button
                className="profile-wide-action-btn"
                onClick={() => setShowReportForm(prev => !prev)}
                aria-expanded={showReportForm}
                aria-controls="customer-report-form"
              >
                <FaExclamationTriangle className="profile-action-icon" /> Report
              </button>

              {showReportForm && (
                <div id="customer-report-form" className="report-form">
                  <label className="report-field">
                    <div className="report-label">Select provider</div>
                    <select
                      value={reportProviderId}
                      onChange={(e) => setReportProviderId(e.target.value)}
                    >
                      <option value="">-- select provider --</option>
                      {reportOptions.length === 0 ? (
                        <option value="" disabled>No providers booked yet</option>
                      ) : (
                        reportOptions.map(opt => (
                          <option key={opt.id} value={opt.id}>
                            {opt.name}{opt.createdOn ? ` — ${opt.createdOn}` : ''}
                          </option>
                        ))
                      )}
                    </select>
                  </label>

                  <label className="report-field">
                    <div className="report-label">Complaint</div>
                    <textarea
                      rows={4}
                      value={reportText}
                      onChange={(e) => setReportText(e.target.value)}
                      placeholder="Describe your complaint..."
                    />
                  </label>

                  <div className="report-actions">
                    <button
                      className="report-submit-btn"
                      onClick={handleReportSubmit}
                      disabled={reportSubmitting || !reportProviderId || !reportText.trim()}
                    >
                      {reportSubmitting ? 'Submitting…' : 'Submit'}
                    </button>
                    <button
                      className="report-cancel-btn"
                      onClick={() => { setShowReportForm(false); setReportText(''); setReportProviderId(''); }}
                      disabled={reportSubmitting}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
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