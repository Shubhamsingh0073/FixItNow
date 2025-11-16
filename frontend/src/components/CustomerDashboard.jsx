import React, { useState, useEffect, useRef } from 'react';
import { FaMapMarkerAlt, FaSearch, FaTools, FaStar, FaPhone, FaEnvelope, FaFacebookMessenger, FaExclamationTriangle, FaUser, FaHome, FaCalendarAlt, FaUserCircle, FaSignOutAlt, FaQuestionCircle, FaRegComments, FaRegThumbsUp, FaEdit, FaTimes, FaCheck, FaToolbox, FaClock, FaMoneyBillWave } from 'react-icons/fa';
import './CustomerDashboard.css';
import ProviderModal from "./ProviderModal";
import ChatPanel from "./ChatPanel";
import Sidebar from "./Sidebar"

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
  const [userData, setUserData] = useState(null);

  const customerMenu = [
      { key: "home", label: "Home", icon: <FaHome /> },
      { key: "bookings", label: "Bookings", icon: <FaCalendarAlt /> },
      { key: "Chat", label: "Messages", icon: <FaFacebookMessenger /> },
      { key: "profile", label: "Profile", icon: <FaUserCircle /> },
    ];

  const [activePage, setActivePage] = useState('home');
  const [phoneInput, setPhoneInput] = useState('');
  const [connectedProvider, setConnectedProvider] = useState(null);

  const [isEditingPhone, setIsEditingPhone] = useState(false);

  const [modalBooking, setModalBooking] = useState(null);

  const [myReports, setMyReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [reportsError, setReportsError] = useState(null);


  const [showReportForm, setShowReportForm] = useState(false);
  const [reportText, setReportText] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);

  const [reportBookingId, setReportBookingId] = useState('');
  const [refundBookingId, setRefundBookingId] = useState('');

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



  const getProviderNameById = (id) => {
    if (!id) return id;
    const p = (serviceProviders || []).find(s =>
      String(s.id) === String(id) ||
      String(s.provider?.id) === String(id) ||
      String(s.providerId) === String(id)
    );
    if (!p) return id;
    return p.provider?.name || p.name || p.category || id;
  };

  // Fetch reports for the logged-in customer
  useEffect(() => {
    const loadMyReports = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setReportsError('Not authenticated');
        return;
      }

      setLoadingReports(true);
      setReportsError(null);

      try {
        const res = await fetch('http://localhost:8087/api/reports/customer', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(`${res.status} ${text || res.statusText}`);
        }

        const data = await res.json();
        setMyReports(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load reports', err);
        setReportsError(err.message || 'Failed to load reports');
        setMyReports([]);
      } finally {
        setLoadingReports(false);
      }
    };

    loadMyReports();
  }, [serviceProviders]);



  const reportsOnly = React.useMemo(() => {
    if (!Array.isArray(myReports)) return [];
    return myReports.filter(r => String(r.category || '').trim().toUpperCase() === 'REPORT');
  }, [myReports]);

  const refundsOnly = React.useMemo(() => {
    if (!Array.isArray(myReports)) return [];
    return myReports.filter(r => String(r.category || '').trim().toUpperCase() === 'REFUND');
  }, [myReports]);


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
  
  // consider these statuses as "active" bookings that should hide a provider
  const ACTIVE_BOOKING_STATUSES = new Set([
    'PENDING',
    'CONFIRMED',
    'IN_PROGRESS',
  ]);

  const activeBookedProviderIds = new Set(
    (customerBookings || [])
      .filter(b => {
        if (!b || !b.status) return false;
        const s = String(b.status).trim().toUpperCase();
        return ACTIVE_BOOKING_STATUSES.has(s);
      })
      .map(b => String(b.providerId))
  );

  const homeProviders = filteredProviders.filter(p => {
    const pid = String(p.id ?? '');
    return !activeBookedProviderIds.has(pid);
  });
  

  const reportBookingOptions = React.useMemo(() => {
    if (!Array.isArray(customerBookings)) return [];
    return customerBookings.map(b => {
      const providerName = getProviderNameById(b.providerId);
      const formattedDate = b.bookingDate ? (new Date(b.bookingDate)).toLocaleString() : '';
      const label = `${providerName}${formattedDate ? ` — ${formattedDate}` : ''}`;
      return {
        bookingId: b.bookingId ?? b.id ?? '',
        providerId: b.providerId,
        label,
        status: b.status
      };
    }).filter(opt => opt.bookingId); 
  }, [customerBookings, serviceProviders]);

  const [showRefundForm, setShowRefundForm] = useState(false);

  const refundBookingOptions = React.useMemo(() => {
    return reportBookingOptions.filter(opt => String(opt.status || '').trim().toLowerCase() === 'cancelled');
  }, [reportBookingOptions]);

  const handleSubmitReportOrRefund = async (category = "REPORT", bookingIdArg = null) => {
    const bookingId = bookingIdArg ?? reportBookingId;
    const reporterId = (userData && userData.id) || localStorage.getItem('userId');

    if (!reporterId) {
      alert('You are not logged in. Please login to submit.');
      return;
    }
    if (!bookingId) {
      alert('Please select a booking from the dropdown.');
      return;
    }
    if (!reportText || !reportText.trim()) {
      alert('Please enter your complaint/reason before submitting.');
      return;
    }

    const booking = (customerBookings || []).find(b => String(b.bookingId ?? b.id) === String(bookingId));
    const reportedOnId = booking?.providerId ?? booking?.provider?.id ?? null;
    if (!reportedOnId) {
      const optFromList = reportBookingOptions.find(o => String(o.bookingId) === String(bookingId));
      if (optFromList) reportedOnId = optFromList.providerId;
    }
    if (!reportedOnId) {
      alert('Could not determine provider for selected booking. Please try again.');
      return;
    }

    setReportSubmitting(true);
    try {
      const url = 'http://localhost:8087/api/reports'; 
      const token = localStorage.getItem('token');
      const payload = {
        reportedById: reporterId,
        reportedOnId: reportedOnId,
        reason: reportText.trim(),
        category: String(category).toUpperCase(),
        bookingId: bookingId
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
        console.error('Submit failed', res.status, text);
        alert(`Failed to submit: ${res.status} ${text || res.statusText}`);
        return;
      }

      const resp = await res.json().catch(() => null);
      console.log('Created report/refund:', resp);

      setReportText('');
      setReportBookingId('');
      setRefundBookingId('');
      setShowReportForm(false);
      setShowRefundForm(false);
      alert('Submitted successfully.');

    } catch (err) {
      console.error('Network error submitting:', err);
      alert('Network error while submitting. Check console.');
    } finally {
      setReportSubmitting(false);
    }
  };
  
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
      {/* Sidebar */}
        <Sidebar
          activeTab={activePage}
          onActivate={(k) => setActivePage(k)}
          menu={customerMenu}        
          showLogoOnCollapsed={true}
          handleLogout={() => {handleLogout()}}
        />

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
                >
                  <FaExclamationTriangle className="profile-action-icon" /> Report
                </button>

                {showReportForm && (
                  <div id="customer-report-form" className="report-form">
                    {/* Report form */}
                    <label className="report-field">
                      <div className="report-label">Select booking</div>
                      <select
                        value={reportBookingId}
                        onChange={(e) => setReportBookingId(e.target.value)}
                      >
                        <option value="">-- select booking --</option>
                        {reportBookingOptions.length === 0 ? (
                          <option value="" disabled>No bookings found</option>
                        ) : (
                          reportBookingOptions.map(opt => (
                            <option key={opt.bookingId} value={opt.bookingId}>
                              {opt.label}
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
                        onClick={() => handleSubmitReportOrRefund('REPORT')}
                        disabled={reportSubmitting || !reportBookingId || !reportText.trim()}
                      >
                        {reportSubmitting ? 'Submitting…' : 'Submit'}
                      </button>
                      <button
                        className="report-cancel-btn"
                        onClick={() => { setShowReportForm(false); setReportText(''); setReportBookingId(''); }}
                        disabled={reportSubmitting}
                      >
                        Cancel
                      </button>
                    </div>

                    
                    <div className="profile-reports-box" style={{ marginTop: 18 }}>
                      <h3 style={{ marginBottom: 10 }}>My Reports</h3>

                      {loadingReports ? (
                        <div style={{ color: '#666' }}>Loading your reports…</div>
                      ) : reportsError ? (
                        <div style={{ color: 'red' }}>Error: {reportsError}</div>
                      ) : reportsOnly.length === 0 ? (
                        <div style={{ color: '#666' }}>You have not submitted any reports.</div>
                      ) : (
                        <div style={{ display: 'grid', gap: 12 }}>
                          {reportsOnly.map((r) => (
                            <div key={r.id ?? `${r.reportedOnId}-${r.createdAt}`} className="report-card">
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
                                <div style={{ fontWeight: 700 }}>
                                  {getProviderNameById(r.reportedOnId)}{r.bookingId ? ` — ${r.bookingId}` : ''}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <div style={{ color: '#666', fontSize: 12 }}>{r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}</div>
                                  <div className={`report-status ${String(r.status || '').toLowerCase()}`}>{r.status}</div>
                                </div>
                              </div>
                              {/* Reason text */}
                              <div style={{ marginTop: 8, color: '#222' }}>
                                {r.reason}
                              </div>

                              {/* Admin reply (if any). Checks several common property names */}
                              {(r.reply || r.adminReply || r.response || r.admin_reply) && (
                                <div className="admin-reply">
                                  <div className="admin-reply-label">Admin reply</div>
                                  <div className="admin-reply-text">
                                    {r.reply ?? r.adminReply ?? r.response ?? r.admin_reply}
                                  </div>

                                  {/* optional reply timestamp if backend provides one */}
                                  {(r.replyAt || r.repliedAt || r.replied_at) && (
                                    <div className="admin-reply-time">
                                      {new Date(r.replyAt ?? r.repliedAt ?? r.replied_at).toLocaleString()}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Report / Refund id */}
                              <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                                Report ID: {r.id}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div> 
                  </div>   
                )}
            
              </div>
              {/* Refund Request button and form */}
              <div style={{ display: 'inline-block', marginLeft: 8 }}>
                <button
                  className="profile-wide-action-btn"
                  onClick={() => setShowRefundForm(prev => !prev)}                  
                >
                  <FaMoneyBillWave className="profile-action-icon" /> Refund Request
                </button>

                {showRefundForm && (
                  <div id="customer-report-form" className="report-form">
                    {/* Refund form */}
                    <label className="report-field">
                      <div className="report-label">Select cancelled booking</div>
                      <select
                        value={refundBookingId}
                        onChange={(e) => setRefundBookingId(e.target.value)}
                      >
                        <option value="">-- select booking --</option>
                        {refundBookingOptions.length === 0 ? (
                          <option value="" disabled>No bookings</option>
                        ) : (
                          refundBookingOptions.map(opt => (
                            <option key={opt.bookingId} value={opt.bookingId}>
                              {opt.label}
                            </option>
                          ))
                        )}
                      </select>
                    </label>

                    <label className="report-field">
                      <div className="report-label">Reason for Refund</div>
                      <textarea
                        rows={4}
                        value={reportText}
                        onChange={(e) => setReportText(e.target.value)}
                        placeholder="Describe your reason..."
                      />
                    </label>

                    <div className="report-actions">
                      <button
                        className="report-submit-btn"
                        onClick={() => handleSubmitReportOrRefund('REFUND', refundBookingId)}
                        disabled={reportSubmitting || !refundBookingId || !reportText.trim()}
                      >
                        {reportSubmitting ? 'Submitting…' : 'Submit'}
                      </button>
                      <button
                        className="report-cancel-btn"
                        onClick={() => {
                          setShowRefundForm(false);
                          setRefundBookingId('');
                        }}
                        disabled={reportSubmitting}
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="profile-reports-box" style={{ marginTop: 18 }}>
                      <h3 style={{ marginBottom: 10 }}>My Refund Requests</h3>

                      {loadingReports ? (
                        <div style={{ color: '#666' }}>Loading your requests…</div>
                      ) : reportsError ? (
                        <div style={{ color: 'red' }}>Error: {reportsError}</div>
                      ) : refundsOnly.length === 0 ? (
                        <div style={{ color: '#666' }}>You have not submitted any refund requests.</div>
                      ) : (
                        <div style={{ display: 'grid', gap: 12 }}>
                          {refundsOnly.map((r) => (
                            <div key={r.id ?? `${r.reportedOnId}-${r.createdAt}`} className="report-card">
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
                                <div style={{ fontWeight: 700 }}>
                                  {getProviderNameById(r.reportedOnId)}{r.bookingId ? ` — ${r.bookingId}` : ''}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <div style={{ color: '#666', fontSize: 12 }}>{r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}</div>
                                  <div className={`report-status ${String(r.status || '').toLowerCase()}`}>{r.status}</div>
                                </div>
                              </div>
                              {/* Reason text */}
                              <div style={{ marginTop: 8, color: '#222' }}>
                                {r.reason}
                              </div>

                              {/* Admin reply (if any). Checks several common property names */}
                              {(r.reply || r.adminReply || r.response || r.admin_reply) && (
                                <div className="admin-reply">
                                  <div className="admin-reply-label">Admin reply</div>
                                  <div className="admin-reply-text">
                                    {r.reply ?? r.adminReply ?? r.response ?? r.admin_reply}
                                  </div>

                                  {/* optional reply timestamp if backend provides one */}
                                  {(r.replyAt || r.repliedAt || r.replied_at) && (
                                    <div className="admin-reply-time">
                                      {new Date(r.replyAt ?? r.repliedAt ?? r.replied_at).toLocaleString()}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Report / Refund id */}
                              <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                                Report ID: {r.id}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
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