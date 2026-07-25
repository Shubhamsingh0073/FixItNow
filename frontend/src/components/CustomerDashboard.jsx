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

export const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8087";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const categories = [
  { id: 'all', name: 'All Services' },
  { id: 'favorites', name: 'Favorites ❤️' },
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

  // Premium Features States
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('favorites')) || [];
    } catch {
      return [];
    }
  });
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('bookingCart')) || [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Live Tracking state
  const [trackingBooking, setTrackingBooking] = useState(null);
  const [providerTrackCoords, setProviderTrackCoords] = useState(null);
  const [customerTrackCoords, setCustomerTrackCoords] = useState(null);
  const [trackingEta, setTrackingEta] = useState(15);
  const [trackingIntervalId, setTrackingIntervalId] = useState(null);

  const getProviderDistance = (provider) => {
    if (!latLng || !provider.lat || !provider.lng) return null;
    const lat1 = latLng.lat;
    const lon1 = latLng.lng;
    const lat2 = provider.lat;
    const lon2 = provider.lng;

    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const toggleFavorite = (id) => {
    const updated = favorites.includes(id)
      ? favorites.filter(fid => fid !== id)
      : [...favorites, id];
    setFavorites(updated);
    localStorage.setItem('favorites', JSON.stringify(updated));
  };

  const saveCart = (updatedCart) => {
    setCart(updatedCart);
    localStorage.setItem('bookingCart', JSON.stringify(updatedCart));
  };

  const addToCart = (provider, serviceName, price) => {
    const itemExists = cart.some(item => item.providerId === provider.id && item.serviceName === serviceName);
    if (itemExists) {
      alert("Service is already in your booking cart!");
      return;
    }
    const updated = [...cart, {
      providerId: provider.id,
      providerName: provider.name,
      providerCategory: provider.category,
      providerAvailability: provider.availability,
      subcategory: provider.subcategory,
      serviceName,
      price,
      bookingDate: formatForInput(new Date(Date.now() + 86400000)), // tomorrow
      timeSlot: provider.availability?.from ? provider.availability.from : "09:00 am"
    }];
    saveCart(updated);
    alert("Added service to cart! Click the cart icon in the top header to checkout.");
  };

  const removeFromCart = (providerId, serviceName) => {
    const updated = cart.filter(item => !(item.providerId === providerId && item.serviceName === serviceName));
    saveCart(updated);
  };

  const handleInstantBook = async (provider) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login to book.");
      return;
    }

    const subcats = provider.subcategory ? Object.keys(provider.subcategory) : [];
    if (subcats.length === 0) {
      alert("No services available for this provider.");
      return;
    }
    const defaultSvc = subcats[0];
    const defaultPrice = provider.subcategory[defaultSvc];
    const bookedServices = { [defaultSvc]: defaultPrice };

    let defaultSlot = "09:00 am";
    if (provider.availability?.from) {
      defaultSlot = provider.availability.from;
    }

    const bookingDateStr = formatForInput(new Date());

    const payload = {
      providerId: provider.id,
      bookingDate: bookingDateStr,
      timeSlot: defaultSlot,
      bookedServices: bookedServices,
      status: "PENDING"
    };

    if (isEmergencyMode) {
      payload.bookedServices = {
        ...payload.bookedServices,
        emergency: true
      };
    }

    try {
      const response = await fetch(`${API_BASE}/bookings/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("Instant booking failed");
      alert(`Instant Booking placed with ${provider.name} for Today at ${defaultSlot}!`);
      await fetchCustomerBookings();
      setActivePage('bookings');
    } catch (error) {
      alert("Instant booking failed: " + error.message);
    }
  };

  const handleRepeatBooking = async (oldBooking) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const provider = serviceProviders.find(p => p.id === oldBooking.providerId);
    if (!provider) {
      alert("The provider is no longer registered or active.");
      return;
    }

    const bookingDateStr = formatForInput(new Date(Date.now() + 86400000));

    const payload = {
      providerId: provider.id,
      bookingDate: bookingDateStr,
      timeSlot: oldBooking.timeSlot || provider.availability?.from || "09:00 am",
      bookedServices: oldBooking.bookedServices || {},
      status: "PENDING"
    };

    try {
      const response = await fetch(`${API_BASE}/bookings/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("Rebooking failed");
      alert(`Successfully repeated booking with ${provider.name} for Tomorrow!`);
      await fetchCustomerBookings();
      setActivePage('bookings');
    } catch (error) {
      alert("Failed to repeat booking: " + error.message);
    }
  };

  const startTracking = (booking) => {
    const provider = serviceProviders.find(p => p.id === booking.providerId);
    let cCoords = latLng || { lat: 12.9716, lng: 77.5946 };
    let pCoords = provider && provider.lat ? { lat: provider.lat, lng: provider.lng } : { lat: 12.9300, lng: 77.5800 };

    setTrackingBooking(booking);
    setCustomerTrackCoords(cCoords);
    setProviderTrackCoords({
      lat: pCoords.lat + (Math.random() - 0.5) * 0.02,
      lng: pCoords.lng + (Math.random() - 0.5) * 0.02
    });
    setTrackingEta(15);

    if (trackingIntervalId) clearInterval(trackingIntervalId);

    const interval = setInterval(() => {
      setProviderTrackCoords(prev => {
        if (!prev) return prev;
        const latDiff = cCoords.lat - prev.lat;
        const lngDiff = cCoords.lng - prev.lng;

        const step = 0.15;
        const nextLat = prev.lat + latDiff * step;
        const nextLng = prev.lng + lngDiff * step;

        setTrackingEta(prevEta => {
          if (prevEta <= 1) return 1;
          return prevEta - 1;
        });

        const distanceRemaining = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
        if (distanceRemaining < 0.0005) {
          clearInterval(interval);
          setTrackingEta(0);
        }

        return { lat: nextLat, lng: nextLng };
      });
    }, 3000);

    setTrackingIntervalId(interval);
  };

  const closeTracking = () => {
    if (trackingIntervalId) clearInterval(trackingIntervalId);
    setTrackingIntervalId(null);
    setTrackingBooking(null);
  };

  const handleCartCheckout = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login to checkout.");
      return;
    }
    if (cart.length === 0) return;

    try {
      const promises = cart.map(async (item) => {
        const payload = {
          providerId: item.providerId,
          bookingDate: item.bookingDate,
          timeSlot: item.timeSlot,
          bookedServices: { [item.serviceName]: item.price },
          status: "PENDING"
        };
        if (isEmergencyMode) {
          payload.bookedServices.emergency = true;
        }
        const res = await fetch(`${API_BASE}/bookings/create`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error(`Failed to checkout item from ${item.providerName}`);
      });

      await Promise.all(promises);
      alert("All bookings placed successfully!");
      saveCart([]);
      setIsCartOpen(false);
      await fetchCustomerBookings();
      setActivePage('bookings');
    } catch (error) {
      alert("Cart checkout failed: " + error.message);
    }
  };

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
        const res = await fetch(`${API_BASE}/users/providers`);
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

  const fetchCustomerBookings = () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    return fetch(`${API_BASE}/bookings/customer/me`, {
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
  };

  useEffect(() => {
    fetchCustomerBookings();
  }, []);


  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found. Please login.');
      return;
    }
    fetch(`${API_BASE}/users/me`, {
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
        const res = await fetch(`${API_BASE}/users/providers`);
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
        const res = await fetch(`${API_BASE}/api/reports/customer`, {
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

  const filteredProviders = serviceProviders.filter(provider => {
    const isApproved = (provider?.verified ?? '').toString().toLowerCase() === 'approved';
    if (!isApproved) return false;

    if (isEmergencyMode && provider.available === false) return false;

    let matchesCategory = true;
    if (selectedCategory === 'favorites') {
      matchesCategory = favorites.includes(provider.id);
    } else if (selectedCategory !== 'all') {
      matchesCategory = provider.category && provider.category.toLowerCase().includes(selectedCategory);
    }
    const matchesSearch = (provider.location || '').toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

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

  const homeProviders = React.useMemo(() => {
    const list = filteredProviders.filter(p => {
      const pid = String(p.id ?? '');
      return !activeBookedProviderIds.has(pid);
    });

    if (isEmergencyMode) {
      return [...list].sort((a, b) => {
        const distA = getProviderDistance(a) ?? 999999;
        const distB = getProviderDistance(b) ?? 999999;
        return distA - distB;
      });
    }

    return list;
  }, [filteredProviders, activeBookedProviderIds, isEmergencyMode, latLng]);


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
      const url = `${API_BASE}/api/reports`;
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
        const url = `${API_BASE}/api/chat/conversations?userId=${encodeURIComponent(customerId)}`;
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
        loadConversations().catch(() => { });
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [activePage, userData]);


  const handleConnect = async (provider, bookingDate, selectedServicesFromModal, selectedSlot) => {
    await fetchCustomerBookings();
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
      const response = await fetch(`${API_BASE}/users/me/phone`, {
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h3><b>{provider.name}</b></h3>
          <button
            className={`favorite-btn ${favorites.includes(provider.id) ? 'active' : ''}`}
            onClick={(e) => { e.stopPropagation(); toggleFavorite(provider.id); }}
            title={favorites.includes(provider.id) ? "Remove from Favorites" : "Add to Favorites"}
          >
            {favorites.includes(provider.id) ? "❤️" : "🤍"}
          </button>
        </div>
        <p className="category-info"><FaToolbox /> <b>{provider.category}</b></p>
        {getProviderDistance(provider) !== null && (
          <p className="distance" style={{ fontSize: '0.9rem', color: 'var(--accent-soft)', fontWeight: 600 }}>
            📍 {getProviderDistance(provider).toFixed(1)} km away
          </p>
        )}
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
        <div className="card-info-item accepted-status" style={{ marginBottom: '10px' }}>
          Status:
          <span
            className={`accepted-status-label status-${booking.status.toLowerCase().replace(/ /g, "-")}`}
          >
            {booking.status}
          </span>
        </div>
      )}
      <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
        <button
          className="connect-button"
          style={{ flex: 1 }}
          onClick={onSeeDetails}
          disabled={provider.available === false}
        >
          {provider.available === false ? 'Currently Unavailable' : 'See Details'}
        </button>
        {booking && (booking.status === "CONFIRMED" || booking.status === "IN_PROGRESS") && (
          <button
            className="connect-button"
            style={{ flex: 1, background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)' }}
            onClick={() => startTracking(booking)}
          >
            Track Live 📍
          </button>
        )}
        {booking && (booking.status === "COMPLETED" || booking.status === "CANCELLED") && (
          <button
            className="connect-button"
            style={{ flex: 1, background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)' }}
            onClick={() => handleRepeatBooking(booking)}
          >
            Rebook ⚡
          </button>
        )}
      </div>
    </div>
  );


  const ProviderCard = ({ provider, showBookingDate }) => (
    <div className="provider-card">
      <div className="provider-info">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h3><b>{provider.name}</b></h3>
          <button
            className={`favorite-btn ${favorites.includes(provider.id) ? 'active' : ''}`}
            onClick={(e) => { e.stopPropagation(); toggleFavorite(provider.id); }}
            title={favorites.includes(provider.id) ? "Remove from Favorites" : "Add to Favorites"}
          >
            {favorites.includes(provider.id) ? "❤️" : "🤍"}
          </button>
        </div>
        <div className="rating">
          <FaStar className="star-icon" />
          {provider.rating ? provider.rating : "4.5"} ({provider.reviews ? provider.reviews : "1"} reviews)
        </div>
        <p className="category-info"><FaToolbox /> <b>{provider.category}</b></p>
        {getProviderDistance(provider) !== null && (
          <p className="distance" style={{ fontSize: '0.9rem', color: 'var(--accent-soft)', fontWeight: 600 }}>
            📍 {getProviderDistance(provider).toFixed(1)} km away
          </p>
        )}
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
      <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
        <button
          className="connect-button"
          style={{ flex: 1 }}
          onClick={() => handleSeeDetails(provider)}
          disabled={provider.available === false}
        >
          {provider.available === false ? 'Currently Unavailable' : 'See Details'}
        </button>
        {provider.available !== false && (
          <button
            className="connect-button"
            style={{ flex: 1, background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)' }}
            onClick={() => handleInstantBook(provider)}
            title="Book Instantly using default services and slot"
          >
            Instant Book
          </button>
        )}
      </div>
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
        handleLogout={() => { handleLogout() }}
      />

      <div className="dashboard-main">
        {activePage === 'home' && (
          <div>
            <div className="dashboard-header" style={{ position: 'relative' }}>
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
              {isEmergencyMode && (
                <div className="flashing-emergency " style={{ textAlign: 'center', color: 'red', fontSize: '1.2rem' }}>
                  🚨 EMERGENCY MODE ACTIVE — SHOWING NEAREST AVAILABLE PROVIDERS FIRST 🚨
                </div>
              )}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div className="search-bar" style={{ flex: 1, marginBottom: 0 }}>
                  <FaSearch />
                  <input
                    type="text"
                    placeholder="Search by location..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  className={`emergency-btn-toggle ${isEmergencyMode ? 'active' : ''}`} style={{ background: '#c50303ff', color: 'white', borderRadius: '15px',height: '50px',padding:'10px' }}
                  onClick={() => setIsEmergencyMode(!isEmergencyMode)}
                  title="Find available providers closest to you"
                >
                  🚨 Emergency Mode
                </button>
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
                {homeProviders.length === 0 ? (
                  <div className="no-bookings-text" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '2rem' }}>
                    No service providers found.
                  </div>
                ) : (
                  homeProviders.map(provider => (
                    <ProviderCard key={provider.id} provider={provider} />
                  ))
                )}
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
              {customerBookings.filter(booking => booking.status === "PENDING" || booking.status === "CONFIRMED" || booking.status === "IN_PROGRESS").length === 0 ? (
                <div className="no-bookings-text">
                  No current bookings yet.
                </div>
              ) : (
                customerBookings
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
              )}
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
            addToCart={addToCart}              // Pass cart addition callback!
          />
        )}

        {trackingBooking && (
          <div className="modal-overlay" onClick={closeTracking}>
            <div className="modal-content tracking-modal-content" onClick={e => e.stopPropagation()}>
              <button className="modal-close-btn" onClick={closeTracking}>×</button>
              <div className="tracking-info-bar">
                <h2 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--text-primary)' }}>Live Provider Tracking 📍</h2>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 'bold', color: 'var(--accent-soft)' }}>
                    {trackingEta === 0 ? "🚨 Arrived!" : `ETA: ${trackingEta} mins`}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Booking #{trackingBooking.bookingId}
                  </div>
                </div>
              </div>
              <div style={{ flex: 1, position: 'relative', minHeight: '350px' }}>
                <MapContainer
                  center={[customerTrackCoords?.lat || 12.9716, customerTrackCoords?.lng || 77.5946]}
                  zoom={14}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="&copy; OpenStreetMap contributors"
                  />
                  {customerTrackCoords && (
                    <Marker position={[customerTrackCoords.lat, customerTrackCoords.lng]}>
                      <Popup>Your Location</Popup>
                    </Marker>
                  )}
                  {providerTrackCoords && (
                    <Marker position={[providerTrackCoords.lat, providerTrackCoords.lng]}>
                      <Popup>Service Provider ({getProviderNameById(trackingBooking.providerId)})</Popup>
                    </Marker>
                  )}
                </MapContainer>
              </div>
            </div>
          </div>
        )}

        {isCartOpen && (
          <div className="cart-drawer-overlay" onClick={() => setIsCartOpen(false)}>
            <div className="cart-drawer" onClick={e => e.stopPropagation()}>
              <div className="cart-drawer-header">
                <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Booking Cart 🛒</h2>
                <button className="cart-drawer-close" onClick={() => setIsCartOpen(false)}>×</button>
              </div>
              <div className="cart-items-list">
                {cart.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
                    Your cart is empty.
                  </div>
                ) : (
                  cart.map((item, idx) => (
                    <div className="cart-item" key={idx}>
                      <div className="cart-item-header">
                        <span style={{ fontWeight: 'bold' }}>{item.providerName}</span>
                        <button className="cart-item-remove" onClick={() => removeFromCart(item.providerId, item.serviceName)}>
                          Remove
                        </button>
                      </div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        Category: {item.providerCategory} | Service: {item.serviceName}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 'bold', color: 'var(--accent-soft)' }}>₹{item.price}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <input
                            type="date"
                            className="date-input"
                            value={item.bookingDate}
                            onChange={(e) => {
                              const newCart = [...cart];
                              newCart[idx].bookingDate = e.target.value;
                              saveCart(newCart);
                            }}
                            style={{ padding: '4px 8px', fontSize: '0.85rem', width: '125px', height: '32px' }}
                          />
                          <select
                            className="slot-select"
                            value={item.timeSlot}
                            onChange={(e) => {
                              const newCart = [...cart];
                              newCart[idx].timeSlot = e.target.value;
                              saveCart(newCart);
                            }}
                            style={{ padding: '4px 8px', fontSize: '0.85rem', height: '32px' }}
                          >
                            {item.providerAvailability?.from && (
                              <option value={item.providerAvailability.from}>{item.providerAvailability.from}</option>
                            )}
                            <option value="09:00 am">9:00 am</option>
                            <option value="11:00 am">11:00 am</option>
                            <option value="01:00 pm">1:00 pm</option>
                            <option value="03:00 pm">3:00 pm</option>
                            <option value="05:00 pm">5:00 pm</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {cart.length > 0 && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '16px' }}>
                    <span>Total:</span>
                    <span>₹{cart.reduce((sum, item) => sum + item.price, 0)}</span>
                  </div>
                  <button
                    className="connect-button"
                    style={{ width: '100%', padding: '12px' }}
                    onClick={handleCartCheckout}
                  >
                    Book All in One Order
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Profile (same as before) */}
        {activePage === 'profile' && (
          <div className="profile-page">
            {/* Section 1: Profile Details */}
            <div className="profile-info-box wide-profile-box">
              <div className="profile-info-right">
                <h2 className="profile-reviews-heading" style={{ fontSize: '1.33rem', marginBottom: '0.7rem' }}>Profile Details</h2>
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
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button
                    className="accept-request-btn"
                    style={{ background: '#6b46c1' }}
                    onClick={() => setIsEditingPhone(true)}
                    disabled={isEditingPhone}
                  >
                    Edit
                  </button>
                  <button
                    className="save-phone-button"
                    style={{ background: '#2b6cb0' }}
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
              <div style={{ display: 'inline-block'}}>
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