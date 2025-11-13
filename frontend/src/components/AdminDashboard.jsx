import React, { useState, useEffect, useMemo } from "react";
import {
  FaHome,  FaUsers,  FaTools,  FaCalendarAlt,
  FaStar,  FaExclamationTriangle,  FaPhoneAlt,  FaUserCircle,
  FaEnvelope,  FaMapMarkerAlt,  FaSignOutAlt,  FaCheck,
  FaTimes,  FaFacebookMessenger
} from "react-icons/fa";
import "./AdminDashboard.css";
import Reviews from "./Reviews";
import ChatPanel from "./ChatPanel";

const userExamples = [
  { name: "Suresh Kumar", email: "suresh.k@example.com", role: "Customer" },
  { name: "Priya Sharma", email: "priya.s@example.com", role: "Provider" },
  { name: "Arun Raj", email: "arunr@example.com", role: "Customer" },
  { name: "Meena Reddy", email: "meena.r@example.com", role: "Provider" },
  { name: "Rahul Yadav", email: "rahul.y@example.com", role: "Customer" },
  { name: "Deepa Patel", email: "deepa.p@example.com", role: "Provider" },
  { name: "Vijay Singh", email: "vijay.s@example.com", role: "Customer" },
  { name: "Rita Menon", email: "rita.m@example.com", role: "Provider" },
  { name: "Manoj Kumar", email: "manoj.k@example.com", role: "Customer" },
  { name: "Sunita Rao", email: "sunita.r@example.com", role: "Provider" },
];

const complaints = [
  {
    user: "Rahul Yadav",
    provider: "Priya Sharma",
    complaint: "Service not completed on time. Provider was late.",
    date: "2025-10-02",
  },
  {
    user: "Deepa Patel",
    provider: "Meena Reddy",
    complaint: "Unprofessional behavior during service.",
    date: "2025-09-30",
  },
  {
    user: "Vijay Singh",
    provider: "Rita Menon",
    complaint: "Charged extra amount than agreed.",
    date: "2025-09-28",
  },
  {
    user: "Sunita Rao",
    provider: "Ajay Malhotra",
    complaint: "Damaged appliance during repair.",
    date: "2025-09-25",
  },
];

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [manageUsers, setManageUsers] = useState(false);
  const [manageProviders, setManageProviders] = useState(false);
  const [users, setUsers] = useState([]);
  const [providers, setProviders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [reports, setReports] = useState([]);


  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [processingServiceId, setProcessingServiceId] = useState(null);


  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [showReviewsCard, setShowReviewsCard] = useState(false); // show reviews column to the right


  // Chat-related state for Admin
  const [adminUser, setAdminUser] = useState(null); // { id, name, email }
  const [conversations, setConversations] = useState([]); // { peerId, peerName, lastMessage, lastAt }
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [selectedPeer, setSelectedPeer] = useState(null);
  const [selectedPeerName, setSelectedPeerName] = useState('');


  // document-related state
  const [documentsCache, setDocumentsCache] = useState(null); // cached metadata from /users/documents
  const [docModalUrl, setDocModalUrl] = useState(null); // blob URL when using modal fallback
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [docLoading, setDocLoading] = useState(false);
  // timeframe for service analytics: 'this_month' | 'last_3' | 'last_6' | 'custom'
  const [serviceTimeframe, setServiceTimeframe] = useState('last_3');
  const [serviceCustomMonth, setServiceCustomMonth] = useState('');
  const [providerTimeframe, setProviderTimeframe] = useState('last_3');
  const [providerCustomMonth, setProviderCustomMonth] = useState('');
  // location filter for location trends: 'state' | 'city' | 'district'
  const [locationFilter, setLocationFilter] = useState('state');
  // timeframe for total bookings chart
  const [bookingsTimeframe, setBookingsTimeframe] = useState('last_3');
  const [bookingsCustomMonth, setBookingsCustomMonth] = useState('');

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const response = await fetch("http://localhost:8087/service");
        if (!response.ok) throw new Error("Failed to fetch providers");
        const data = await response.json();
        setProviders(data);
      } catch (error) {
        console.error("Error fetching providers:", error);
        setProviders([]);
      }
    };
    fetchProviders();
  }, []);

  // Build a unified users list (customers + providers) for the dashboard users table
  useEffect(() => {
    const merged = [];
    if (Array.isArray(customers)) {
      for (const c of customers) {
        merged.push({
          id: c.id ?? c.userId ?? c._id ?? null,
          name: c.name ?? c.customerName ?? c.customer?.name ?? '',
          email: c.email ?? c.customerEmail ?? c.customer?.email ?? '',
          role: 'Customer',
          createdOn: c.createdOn ?? c.created_at ?? c.createdAt ?? ''
        });
      }
    }

    if (Array.isArray(providers)) {
      for (const p of providers) {
        // providers may be a services list where nested provider object contains user info
        const providerObj = p.provider ?? p;
        merged.push({
          id: providerObj.id ?? providerObj._id ?? p.id ?? null,
          name: providerObj.name ?? providerObj.fullName ?? '',
          email: providerObj.email ?? '',
          role: 'Provider',
          createdOn: providerObj.createdOn ?? providerObj.created_at ?? providerObj.createdAt ?? ''
        });
      }
    }

    setUsers(merged);
  }, [customers, providers]);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch("http://localhost:8087/api/reports");
        if (!response.ok) throw new Error("Failed to fetch reports");
        const data = await response.json();
        setReports(data);
      } catch (error) {
        console.error("Error fetching reports:", error);
        setReports([]);
      }
    };
    fetchReports();
  }, []);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch("http://localhost:8087/users/customers");
        if (!response.ok) throw new Error("Failed to fetch customers");
        const data = await response.json();
        setCustomers(data);
      } catch (error) {
        console.error("Error fetching customers:", error);
        setCustomers([]);
      }
    };
    fetchCustomers();
  }, []);


  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await fetch("http://localhost:8087/bookings/all");
        if (!response.ok) throw new Error("Failed to fetch bookings");
        const data = await response.json();
        setBookings(data);
      } catch (error) {
        console.error("Error fetching bookings:", error);
        setBookings([]);
      }
    };
    fetchBookings();
  }, []);



  useEffect(() => {
    const fetchReviews = async () => {
      setLoadingReviews(true);
      try {
        const response = await fetch("http://localhost:8087/reviews/all");
        if (!response.ok) throw new Error("Failed to fetch reviews");
        const data = await response.json();
        setReviews(data);
      } catch (error) {
        console.error("Error fetching reviews:", error);
        setReviews([]);
      } finally {
        setLoadingReviews(false);
      }
    };
    fetchReviews();
  }, []);


  // Get admin profile and store admin id (so chat endpoints can use it)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch('http://localhost:8087/users/me', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch admin profile: ' + res.status);
        return res.json();
      })
      .then(data => {
        setAdminUser({ id: data.id, name: data.name, email: data.email });
        if (data.id) localStorage.setItem('userId', data.id);
      })
      .catch(err => {
        console.error('Error fetching admin user:', err);
      });
  }, []);

  // Load conversations for admin when Chat tab active
  useEffect(() => {
    const loadConversations = async () => {
      const token = localStorage.getItem('token');
      const userId = adminUser?.id || localStorage.getItem('userId');
      if (!userId) return;
      setLoadingConversations(true);
      try {
        const url = `http://localhost:8087/api/chat/conversations?userId=${encodeURIComponent(userId)}`;
        const res = await fetch(url, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(`Conversations fetch failed: ${res.status} ${text}`);
        }
        const arr = await res.json();
        const convs = (arr || []).map(c => ({
          peerId: c.peerId,
          peerName: c.peerName || c.peer_name || c.peer || c.peerId,
          lastMessage: c.lastMessage || c.last_message || '',
          lastAt: c.lastAt || c.last_at || ''
        }));
        setConversations(convs);
      } catch (err) {
        console.error('Failed loading admin conversations', err);
        setConversations([]);
      } finally {
        setLoadingConversations(false);
      }
    };

    if (activeTab === 'chat') {
      loadConversations();
      // OPTIONAL: poll every 3s while on chat tab to get updates without sockets
      const interval = setInterval(() => {
        loadConversations().catch(() => {});
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [activeTab, adminUser]);



  // Safe provider id getter (works with various shapes)
  const getProviderId = (p) =>
    p == null ? null : (p.id ?? p._id ?? p.providerId ?? p.provider?.id ?? null);


  // Replace your existing updateProviderVerification with this function
  // helper to resolve an id for a providers list item (service or nested provider)
  const resolveServiceId = (item) => {
    return (
      item?.id ??
      item?._id ??
      item?.serviceId ??
      item?.provider?.id ??
      item?.providerId ??
      null
    );
  };

  const updateProviderVerification = async (serviceItem, newStatus) => {
    const serviceId = resolveServiceId(serviceItem);
    if (!serviceId) {
      console.error("updateProviderVerification: missing id for item", serviceItem);
      alert("Unable to update: missing id");
      return;
    }

    const token = localStorage.getItem("token");
    setProcessingServiceId(serviceId);

    // Adjust URL to your backend route if different
    const url = `http://localhost:8087/service/${serviceId}/verify`; // or /service/{id}/verify

    try {
      console.log("updateProviderVerification: sending", { url, serviceId, newStatus });

      const res = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ verified: newStatus }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("updateProviderVerification: server error", res.status, text);
        alert(`Failed to update provider status: ${res.status} ${text}`);
        return;
      }

      // parse response if JSON returned
      let returned = null;
      try {
        returned = await res.json();
      } catch (_) {
        returned = null;
      }

      // Update providers state by id (merge returned fields with existing item to preserve nested data)
      setProviders(prev => {
        return prev.map(item => {
          const itemId = resolveServiceId(item);
          if (String(itemId) !== String(serviceId)) return item;

          // If server returned an updated object, merge it with the old item (prefer server-provided values)
          if (returned && typeof returned === "object") {
            const merged = {
              ...item,               // start with current item
              ...returned,           // overwrite with server-returned top-level fields
              provider: {
                // nested provider: prefer returned.provider, else keep item.provider
                ...(item.provider || {}),
                ...(returned.provider || {}),
              },
            };
            return merged;
          }

          // No returned body -> optimistic update: keep everything but update verified
          return { ...item, verified: newStatus };
        });
      });

      console.log("updateProviderVerification: success", serviceId, newStatus);
      // Optionally re-fetch providers to be 100% in sync with server:
      // await fetchProviders(); // implement fetchProviders() or call existing loader
    } catch (err) {
      console.error("Error updating provider verification:", err);
      alert("Network error while updating provider verification. See console.");
    } finally {
      setProcessingServiceId(null);
    }
  };

  // Build reviews map for quick stats
  const reviewsMap = useMemo(() => {
    const map = {};
    if (!Array.isArray(reviews)) return map;
    for (const r of reviews) {
      const pid = r.provider_id ?? r.providerId ?? r.provider?.id;
      if (!pid) continue;
      const rating = Number(r.rating) || 0;
      if (!map[pid]) map[pid] = { count: 0, sum: 0 };
      map[pid].count += 1;
      map[pid].sum += rating;
    }
    return map;
  }, [reviews]);

  // reset reviews card when modal closed
  useEffect(() => {
    if (!selectedProvider) setShowReviewsCard(false);
  }, [selectedProvider]);

  const verifiedProvidersCount = useMemo(() => {
    if (!Array.isArray(providers)) return 0;
    const ids = new Set();
    providers.forEach(p => {
      const pid = p.provider?.id ?? p.providerId ?? p.id ?? null;
      const verified = String(p.verified ?? "").toLowerCase();
      if (pid && verified === "approved") ids.add(String(pid));
    });
    return ids.size;
  }, [providers]);

  const pendingApprovalsCount = useMemo(() => {
    if (!Array.isArray(providers)) return 0;
    const ids = new Set();
    providers.forEach(p => {
      const pid = p.provider?.id ?? p.providerId ?? p.id ?? null;
      const verified = String(p.verified ?? "").toLowerCase();
      if (pid && verified === "pending") ids.add(String(pid));
    });
    return ids.size;
  }, [providers]);

  const activeBookingsCount = useMemo(() => {
    if (!Array.isArray(bookings)) return 0;
    return bookings.filter(b => ["in_progress", "confirmed", "pending"].includes(String(b.status || "").toLowerCase())).length;
  }, [bookings]);

  const statsData = useMemo(() => [
    { value: (customers?.length || 0) + verifiedProvidersCount, label: "Total Users" },
    { value: activeBookingsCount, label: "Active Bookings" },
    { value: verifiedProvidersCount, label: "Verified Providers" },
    { value: pendingApprovalsCount, label: "Pending Approvals" },
  ], [customers, activeBookingsCount, verifiedProvidersCount, pendingApprovalsCount]);

  // --- Chart data aggregations ---------------------------------------
  // Small inline SVG pie chart component
  const SmallPieChart = ({ data = [], size = 180, colors = [] }) => {
    if (!Array.isArray(data) || data.length === 0) return <div style={{ color: '#888' }}>No data</div>;
    const total = data.reduce((s, d) => s + (Number(d.value) || 0), 0);
    if (total === 0) return <div style={{ color: '#888' }}>No data</div>;

    const cx = size / 2;
    const cy = size / 2;
    const r = Math.min(cx, cy) - 4;
    let angle = -Math.PI / 2; // start at top

    const defaultColors = ['#6156f8', '#2b6cb0', '#48bb78', '#f6ad55', '#ed64a6', '#9f7aea'];

    const slices = data.map((d, i) => {
      const value = Number(d.value) || 0;
      const frac = value / total;
      const start = angle;
      const end = angle + frac * Math.PI * 2;
      angle = end;
      const large = end - start > Math.PI ? 1 : 0;
      const x1 = cx + r * Math.cos(start);
      const y1 = cy + r * Math.sin(start);
      const x2 = cx + r * Math.cos(end);
      const y2 = cy + r * Math.sin(end);
      const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
      return { path, color: colors[i] || defaultColors[i % defaultColors.length], label: d.label, value };
    });

    return (
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <svg width={size} height={size} style={{ flex: '0 0 auto' }}>
          {slices.map((s, i) => (
            <path key={i} d={s.path} fill={s.color} stroke="#fff" strokeWidth={1} />
          ))}
        </svg>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {slices.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 120 }}>
              <span style={{ width: 12, height: 12, background: s.color, display: 'inline-block', borderRadius: 3 }} />
              <span style={{ fontSize: 13, color: '#333' }}>{s.label}</span>
              <span style={{ marginLeft: 8, color: '#666' }}>({s.value})</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Helper: compute months range and labels for timeframe
  const computeRange = (timeframe, customMonthVal) => {
    const now = new Date();
    let start = new Date(now.getFullYear(), now.getMonth(), 1);
    let end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    if (timeframe === 'last_3') {
      start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    } else if (timeframe === 'last_6') {
      start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    } else if (timeframe === 'custom' && customMonthVal) {
      const parts = customMonthVal.split('-');
      if (parts.length === 2) {
        const y = Number(parts[0]);
        const m = Number(parts[1]) - 1;
        if (!Number.isNaN(y) && !Number.isNaN(m)) {
          start = new Date(y, m, 1);
          end = new Date(y, m + 1, 1);
        }
      }
    }
    const months = [];
    const cur = new Date(start.getFullYear(), start.getMonth(), 1);
    while (cur < end) {
      months.push(new Date(cur.getFullYear(), cur.getMonth(), 1));
      cur.setMonth(cur.getMonth() + 1);
    }
    const monthLabels = months.map(d => d.toLocaleString(undefined, { month: 'short', year: 'numeric' }));
    return { start, end, months, monthLabels };
  };

  // Helper: abbreviate large numbers (e.g. 1200 -> 1.2k)
  const abbreviateNumber = (n) => {
    const num = Number(n || 0);
    if (isNaN(num)) return String(n);
    const abs = Math.abs(num);
    if (abs < 1000) return String(num);
    const units = ['k', 'M', 'B', 'T'];
    let value = num;
    let idx = -1;
    while (Math.abs(value) >= 1000 && idx < units.length - 1) {
      value = value / 1000;
      idx += 1;
    }
    return `${Number(value.toFixed(1))}${units[idx]}`;
  };

  // Month-wise stacked bar chart: months along X, stacked segments per service
  const SmallMonthStackedBarChart = ({ services = [], monthLabels = [], valuesByMonth = [], colors = [] }) => {
    if (!Array.isArray(valuesByMonth) || valuesByMonth.length === 0) return <div style={{ color: '#888' }}>No data</div>;
    const defaultColors = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    const monthTotals = valuesByMonth.map(arr => arr.reduce((a, b) => a + Number(b || 0), 0));
    const max = Math.max(...monthTotals, 1);
    const chartHeight = 160;
    return (
      <div>
        {/* Chart area with totals above each month's stacked bar */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
          {valuesByMonth.map((vals, mi) => (
            <div key={mi} style={{ width: 56, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* numeric total above the bar - hide if zero, show abbreviated with full value in title/aria */}
              {Number(monthTotals[mi]) > 0 ? (
                <div
                  role="img"
                  aria-label={`Total ${monthTotals[mi]} for ${monthLabels[mi]}`}
                  title={`${monthTotals[mi]} total`}
                  style={{ fontSize: 12, color: '#333', marginBottom: 6 }}
                >
                  {abbreviateNumber(monthTotals[mi])}
                </div>
              ) : (
                <div style={{ height: 18 }} />
              )}
              {/* stacked bar area */}
              <div
                role="img"
                aria-label={`${monthLabels[mi]} stacked bar, total ${monthTotals[mi]}`}
                style={{ height: chartHeight, display: 'flex', flexDirection: 'column-reverse', width: '100%', borderRadius: 6, overflow: 'hidden', background: '#fff', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.03)' }}
              >
                {vals.map((v, si) => {
                  const h = Math.round((Number(v || 0) / max) * chartHeight);
                  return <div key={si} title={`${services[si]}: ${v}`} style={{ height: h, background: colors[si] || defaultColors[si % defaultColors.length], width: '100%' }} />;
                })}
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          {monthLabels.map((m, i) => (
            <div key={i} style={{ width: 56, textAlign: 'center', fontSize: 12, color: '#333' }}>{m.split(' ')[0]}</div>
          ))}
        </div>
        <div style={{ marginTop: 10, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {services.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ width: 12, height: 12, background: colors[i] || defaultColors[i % defaultColors.length], display: 'inline-block', borderRadius: 3 }} />
              <div style={{ fontSize: 13, color: '#333' }}>{s}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const topServices = useMemo(() => {
    if (!Array.isArray(bookings)) return [];
    const map = {};
    for (const b of bookings) {
      const svc = (b.service && (b.service.name || b.service.category)) || (b.serviceCategory) || (b.serviceName) || 'Unknown';
      map[svc] = (map[svc] || 0) + 1;
    }
    const arr = Object.entries(map).map(([label, value]) => ({ label, value }));
    arr.sort((a, b) => b.value - a.value);
    return arr.slice(0, 6);
  }, [bookings]);

  

  const topProviders = useMemo(() => {
    if (!Array.isArray(bookings)) return [];
    const map = {};
    for (const b of bookings) {
      const pname = (b.provider && (b.provider.name || b.provider.fullName)) || (b.providerName) || 'Unknown';
      map[pname] = (map[pname] || 0) + 1;
    }
    const arr = Object.entries(map).map(([label, value]) => ({ label, value }));
    arr.sort((a, b) => b.value - a.value);
    return arr.slice(0, 6);
  }, [bookings]);

  // Helper: extract location component (state, city, or district) from location string
  // Assumes format like "City, District, State" or "City, State"
  const extractLocationComponent = (location, component) => {
    if (!location || typeof location !== 'string') return 'Unknown';
    const parts = location.split(',').map(p => p.trim()).filter(p => p);
    
    if (component === 'state') {
      // state is typically the last part
      return parts.length > 0 ? parts[parts.length - 1] : 'Unknown';
    } else if (component === 'city') {
      // city is typically the first part
      return parts.length > 0 ? parts[0] : 'Unknown';
    } else if (component === 'district') {
      // district is typically the middle part (if 3+ parts exist)
      return parts.length > 2 ? parts[1] : (parts.length > 1 ? parts[1] : 'Unknown');
    }
    return 'Unknown';
  };

  const locationTrends = useMemo(() => {
    if (!Array.isArray(bookings)) return [];
    const map = {};
    for (const b of bookings) {
      const loc = (b.customer && (b.customer.location || b.customer.customerLocation)) || b.location || 'Unknown';
      const component = extractLocationComponent(loc, locationFilter);
      map[component] = (map[component] || 0) + 1;
    }
    const arr = Object.entries(map).map(([label, value]) => ({ label, value }));
    arr.sort((a, b) => b.value - a.value);
    return arr.slice(0, 6);
  }, [bookings, locationFilter]);
  // --------------------------------------------------------------------

  // only approved providers for Services tab
  const approvedProviders = useMemo(() => {
    if (!Array.isArray(providers)) return [];
    return providers.filter(p => String(p.verified ?? "").toLowerCase() === "approved");
  }, [providers]);

  const handleLogout = () => {
    window.location.href = "/login";
  };

  const handleDeleteUser = (index) => {
    setUsers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDeleteProvider = (index) => {
    setProviders((prev) => prev.filter((_, i) => i !== index));
  };

  // put with other imports/hooks near top of component
  const providersSorted = React.useMemo(() => {
    if (!Array.isArray(providers)) return [];

    const rank = (p) => {
      const v = String(p?.verified ?? "").toLowerCase();
      if (v === "pending") return 0;    // highest priority -> show first
      if (v === "approved") return 1;
      if (v === "rejected") return 2;
      return 3; // unknown / other last
    };

    // stable sort: include original index so equal-rank items keep original order
    return providers
      .map((p, idx) => ({ p, idx, r: rank(p) }))
      .sort((a, b) => {
        if (a.r !== b.r) return a.r - b.r;
        // tie-breaker: provider name (safe fallback to empty string)
        const nameA = String(a.p?.provider?.name ?? a.p?.name ?? "").toLowerCase();
        const nameB = String(b.p?.provider?.name ?? b.p?.name ?? "").toLowerCase();
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return a.idx - b.idx;
      })
      .map(x => x.p);
  }, [providers]);

  // --- Document logic --------------------------------------------------
  // Fetch and cache documents metadata (lazy load)
  const fetchDocumentsMetadata = async () => {
    if (documentsCache) return documentsCache;
    try {
      const res = await fetch("http://localhost:8087/users/documents");
      if (!res.ok) throw new Error("Failed to fetch documents");
      const data = await res.json();
      setDocumentsCache(data);
      return data;
    } catch (err) {
      console.error("Error fetching documents metadata:", err);
      return null;
    }
  };

  // Try to open the document in a new tab using stream endpoint.
  // If that fails (CORS or 404), fallback to fetching as blob and showing in modal.
  const handleSeeDocument = async (provider) => {
    const providerId = getProviderId(provider);
    if (!providerId) {
      alert("Provider id not available for this row");
      return;
    }

    setDocLoading(true);
    try {
      const docs = await fetchDocumentsMetadata();
      if (!docs) {
        alert("No document metadata available");
        setDocLoading(false);
        return;
      }
      const match = docs.find(d => String(d.provider_id) === String(providerId));
      if (!match) {
        alert("No document found for this provider");
        setDocLoading(false);
        return;
      }

      const openUrl = `http://localhost:8087/users/document/${encodeURIComponent(match.document_id)}`;
      // Preferred: open in new tab so browser displays PDF inline.
      const newTab = window.open(openUrl, "_blank");
      if (newTab) {
        // successfully opened; leave it to browser to render
        setDocLoading(false);
        return;
      }

      // Fallback: fetch as blob and show inside modal (CORS must allow this)
      try {
        const r = await fetch(openUrl);
        if (!r.ok) {
          throw new Error(`Failed to fetch file: ${r.status}`);
        }
        const blob = await r.blob();
        const url = URL.createObjectURL(blob);
        setDocModalUrl(url);
        setDocModalOpen(true);
      } catch (err) {
        console.error("Fallback fetch failed:", err);
        alert("Failed to open document. Check server streaming endpoint or CORS.");
      }
    } finally {
      setDocLoading(false);
    }
  };

  const closeDocModal = () => {
    setDocModalOpen(false);
    if (docModalUrl) {
      URL.revokeObjectURL(docModalUrl);
      setDocModalUrl(null);
    }
  };
  // ---------------------------------------------------------------------

  const CustomerCard = ({ customers }) => (
    <div className="modal-left">
      <div className="card-profile">
        <FaUserCircle color="#fdfdfd" size={80} />
      </div>
      <h2 className="modal-provider-name-left">{customers.name}</h2>
      <div className="modal-left-info">
        <div className="modal-contact-row">
          <p>
            Contact: <span className="modal-detail-value">{customers.phno}</span>
          </p>
          <p>
            <FaEnvelope />
            <span className="modal-detail-value">{customers.email}</span>
          </p>
        </div>
        <p className="modal-location-row">
          <FaMapMarkerAlt color="#cf1616ff" className="modal-map-icon" />
          Location:
        </p>
        <p className="modal-detail-value-left">{customers.location}</p>
      </div>
    </div>
  );

  return (
    <div className="dashboard admin-theme">
      {/* Sidebar */}
      <aside className="sidebar">
        <h2 className="logo">FixItNow</h2>
        <div className="sidebar-title">FixItNow</div>
        
        <ul>
          <li className={activeTab === "home" ? "active" : ""} onClick={() => setActiveTab("home")}>
            <FaHome /> Home
          </li>
          <li className={activeTab === "users" ? "active" : ""} onClick={() => setActiveTab("users")}>
            <FaUsers /> Customers
          </li>
          <li className={activeTab === "services" ? "active" : ""} onClick={() => setActiveTab("services")}>
            <FaTools /> Providers
          </li>
          <li className={activeTab === "verification" ? "active" : ""} onClick={() => setActiveTab("verification")}>
            <FaCheck /> Verification
          </li>
          <li className={activeTab === "bookings" ? "active" : ""} onClick={() => setActiveTab("bookings")}>
            <FaCalendarAlt /> Bookings
          </li>
          <li className={activeTab === "complaints" ? "active" : ""} onClick={() => setActiveTab("complaints")}>
            <FaExclamationTriangle /> Complaints
          </li>
          <li className={activeTab === "chat" ? "active" : ""} onClick={() => setActiveTab("chat")}>
            <FaFacebookMessenger /> Messages
          </li>
        </ul>
        <div className="sidebar-bottom">
          <button className="logout-button" onClick={handleLogout}>
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main">
        {activeTab === "home" && (
          <>
            <div className="stats">
              {statsData.map((stat, idx) => (
                <div className="card" key={idx}>
                  {stat.value}
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>

            <div className="tables">
              <div className="table">
                <h3>Users</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.slice(0, 4).map((u, i) => (
                      <tr key={i}>
                        <td>{u.name}</td>
                        <td>{u.email}</td>
                        <td>{u.role}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="table">
                <h3>Recent Bookings</h3>
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>User</th>
                      <th>Service</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b, i) => (
                      <tr key={i}>
                        <td>{b.id}</td>
                        <td>{b.customer.name}</td>
                        <td>{b.provider.name}</td>
                        <td>
                          <span className={`status ${b.status.replace(" ", "").toLowerCase()}`}>{b.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {/* Charts: 2x2 Grid Layout */}
            <div style={{ marginTop: 20 }}>
              <h3 style={{ marginBottom: 12 }}>Analytics</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, position: 'relative' }}>
                {/* Row 1, Col 1: Most booked services */}
                <div style={{ background: '#fff', padding: 12, borderRadius: 8, boxShadow: '0 4px 18px rgba(0,0,0,0.04)', minHeight: 500 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>Most booked services (month-wise)</div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <select value={serviceTimeframe} onChange={(e) => setServiceTimeframe(e.target.value)} style={{ padding: '6px 8px', fontSize: 13 }}>
                        <option value="this_month">This month</option>
                        <option value="last_3">Last 3 months</option>
                        <option value="last_6">Last 6 months</option>
                        <option value="custom">Select month</option>
                      </select>
                      {serviceTimeframe === 'custom' && (
                      <input type="month" value={serviceCustomMonth} onChange={(e) => setServiceCustomMonth(e.target.value)} style={{ padding: '6px 8px', fontSize: 13 }} />
                      )}
                    </div>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    {
                      (() => {
                        const { months, monthLabels } = computeRange(serviceTimeframe, serviceCustomMonth);
                        if (!months || months.length === 0) return <div style={{ color: '#888' }}>No data</div>;

                        // build svcMap: service -> counts per month index
                        const svcMap = {};
                        const resolveDate = (b) => {
                          if (!b) return null;
                          const candidates = [b.createdAt, b.created_at, b.date, b.bookingDate, b.bookedAt, b.createdOn];
                          for (const c of candidates) {
                            if (!c) continue;
                            const d = new Date(c);
                            if (!isNaN(d)) return d;
                          }
                          if (typeof b === 'number' || (typeof b === 'string' && /^\d+$/.test(b))) {
                            const d = new Date(Number(b));
                            if (!isNaN(d)) return d;
                          }
                          return null;
                        };

                        for (const b of bookings) {
                          const d = resolveDate(b);
                          if (!d) continue;
                          // within range
                          if (d < months[0] || d >= new Date(months[months.length - 1].getFullYear(), months[months.length - 1].getMonth() + 1, 1)) continue;
                          const svc = (b.service && (b.service.name || b.service.category)) || (b.serviceCategory) || (b.serviceName) || (b.bookedService) || 'Unknown';
                          if (!svcMap[svc]) svcMap[svc] = Array(months.length).fill(0);
                          for (let mi = 0; mi < months.length; mi++) {
                            const sStart = months[mi];
                            const sEnd = new Date(sStart.getFullYear(), sStart.getMonth() + 1, 1);
                            if (d >= sStart && d < sEnd) {
                              svcMap[svc][mi]++;
                              break;
                            }
                          }
                        }

                        // determine top services by total across range
                        const svcArr = Object.entries(svcMap).map(([label, values]) => ({ label, values, total: values.reduce((a, b) => a + b, 0) }));
                        svcArr.sort((a, b) => b.total - a.total);
                        const topServicesList = svcArr.slice(0, 6);
                        if (topServicesList.length === 0) return <div style={{ color: '#888' }}>No data</div>;

                        // Calculate % change: current period vs previous (for top 6 services)
                        let currentServicesTotal = 0;
                        let prevServicesTotal = 0;
                        for (const s of topServicesList) {
                          currentServicesTotal += s.total;
                        }
                        
                        let percentChangeServices = 0;
                        if (serviceTimeframe !== 'custom') {
                          let prevStart, prevEnd;
                          if (serviceTimeframe === 'this_month') {
                            const prevMonth = new Date(months[0].getFullYear(), months[0].getMonth() - 1, 1);
                            prevStart = prevMonth;
                            prevEnd = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 1);
                          } else if (serviceTimeframe === 'last_3') {
                            prevStart = new Date(months[0].getFullYear(), months[0].getMonth() - 3, 1);
                            prevEnd = months[0];
                          } else if (serviceTimeframe === 'last_6') {
                            prevStart = new Date(months[0].getFullYear(), months[0].getMonth() - 6, 1);
                            prevEnd = months[0];
                          }
                          
                          if (prevStart && prevEnd) {
                            // Count previous period bookings for same top 6 services
                            const topServiceNames = new Set(topServicesList.map(s => s.label));
                            for (const b of bookings) {
                              const d = resolveDate(b);
                              if (!d) continue;
                              if (d >= prevStart && d < prevEnd) {
                                const svc = (b.service && (b.service.name || b.service.category)) || (b.serviceCategory) || (b.serviceName) || (b.bookedService) || 'Unknown';
                                if (topServiceNames.has(svc)) {
                                  prevServicesTotal++;
                                }
                              }
                            }
                            percentChangeServices = prevServicesTotal === 0 ? (currentServicesTotal > 0 ? 100 : 0) : ((currentServicesTotal - prevServicesTotal) / prevServicesTotal) * 100;
                          }
                        }

                        const services = topServicesList.map(s => s.label);
                        const valuesByMonth = topServicesList[0].values.map((_, mi) => topServicesList.map(s => s.values[mi]));
                        const colors = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
                        const changeColorSvc = percentChangeServices > 0 ? '#10b981' : percentChangeServices < 0 ? '#ef4444' : '#999';
                        const changeSymbolSvc = percentChangeServices > 0 ? '↑' : percentChangeServices < 0 ? '↓' : '→';
                        
                        return (
                          <div>
                            {serviceTimeframe !== 'custom' && (
                              <div style={{ marginBottom: 12, padding: 8, background: '#f0f9ff', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 13, color: '#333' }}>vs previous:</span>
                                <span style={{ fontSize: 14, fontWeight: 600, color: changeColorSvc }}>
                                  {changeSymbolSvc} {Math.abs(percentChangeServices).toFixed(1)}%
                                </span>
                                <span style={{ fontSize: 12, color: '#666' }}>({prevServicesTotal} → {currentServicesTotal})</span>
                              </div>
                            )}
                            <SmallMonthStackedBarChart services={services} monthLabels={monthLabels} valuesByMonth={valuesByMonth} colors={colors} />
                          </div>
                        );
                      })()
                    }
                  </div>
                </div>

                {/* Row 1, Col 2: Top providers */}
                <div style={{ background: '#fff', padding: 12, borderRadius: 8, boxShadow: '0 4px 18px rgba(0,0,0,0.04)', minHeight: 500 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: 700, marginBottom: 8 }}>Top providers (month-wise)</div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <select value={providerTimeframe} onChange={(e) => setProviderTimeframe(e.target.value)} style={{ padding: '6px 8px', fontSize: 13 }}>
                          <option value="this_month">This month</option>
                          <option value="last_3">Last 3 months</option>
                          <option value="last_6">Last 6 months</option>
                          <option value="custom">Select month</option>
                        </select>
                        {providerTimeframe === 'custom' && (
                        <input type="month" value={providerCustomMonth} onChange={(e) => setProviderCustomMonth(e.target.value)} style={{ padding: '6px 8px', fontSize: 13 }} />
                      )}
                      </div>
                    </div>
                    <div style={{ marginTop: 8 }}>
                      {
                        (() => {
                            const { months, monthLabels } = computeRange(providerTimeframe, providerCustomMonth);
                          if (!months || months.length === 0) return <div style={{ color: '#888' }}>No data</div>;

                          const provMap = {};
                          const resolveDate = (b) => {
                            if (!b) return null;
                            const candidates = [b.createdAt, b.created_at, b.date, b.bookingDate, b.bookedAt, b.createdOn];
                            for (const c of candidates) {
                              if (!c) continue;
                              const d = new Date(c);
                              if (!isNaN(d)) return d;
                            }
                            if (typeof b === 'number' || (typeof b === 'string' && /^\d+$/.test(b))) {
                              const d = new Date(Number(b));
                              if (!isNaN(d)) return d;
                            }
                            return null;
                          };

                          const resolveProviderName = (b) => {
                            if (!b) return 'Unknown';
                            const p = b.provider;
                            const candidates = [
                              p?.name,
                              p?.fullName,
                              p?.providerName,
                              p?.displayName,
                              p?.username,
                              p?.user?.name,
                              b.providerName,
                              b.provider_name,
                            ];
                            for (const c of candidates) {
                              if (c) return String(c);
                            }
                            if (typeof p === 'string' || typeof p === 'number') return String(p);
                            if (b.providerId || b.provider_id) return String(b.providerId || b.provider_id);
                            return 'Unknown';
                          };

                          for (const b of bookings) {
                            const d = resolveDate(b);
                            if (!d) continue;
                            if (d < months[0] || d >= new Date(months[months.length - 1].getFullYear(), months[months.length - 1].getMonth() + 1, 1)) continue;
                            const pname = resolveProviderName(b) || 'Unknown';
                            if (!provMap[pname]) provMap[pname] = Array(months.length).fill(0);
                            for (let mi = 0; mi < months.length; mi++) {
                              const sStart = months[mi];
                              const sEnd = new Date(sStart.getFullYear(), sStart.getMonth() + 1, 1);
                              if (d >= sStart && d < sEnd) {
                                provMap[pname][mi]++;
                                break;
                              }
                            }
                          }

                          const provArr = Object.entries(provMap).map(([label, values]) => ({ label, values, total: values.reduce((a, b) => a + b, 0) }));
                          provArr.sort((a, b) => b.total - a.total);
                          const topProv = provArr.slice(0, 6);
                          if (topProv.length === 0) return <div style={{ color: '#888' }}>No data</div>;

                          // Calculate % change: current period vs previous (for top 6 providers)
                          let currentProvidersTotal = 0;
                          let prevProvidersTotal = 0;
                          for (const p of topProv) {
                            currentProvidersTotal += p.total;
                          }
                          
                          let percentChangeProviders = 0;
                          if (providerTimeframe !== 'custom') {
                            let prevStart, prevEnd;
                            if (providerTimeframe === 'this_month') {
                              const prevMonth = new Date(months[0].getFullYear(), months[0].getMonth() - 1, 1);
                              prevStart = prevMonth;
                              prevEnd = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 1);
                            } else if (providerTimeframe === 'last_3') {
                              prevStart = new Date(months[0].getFullYear(), months[0].getMonth() - 3, 1);
                              prevEnd = months[0];
                            } else if (providerTimeframe === 'last_6') {
                              prevStart = new Date(months[0].getFullYear(), months[0].getMonth() - 6, 1);
                              prevEnd = months[0];
                            }
                            
                            if (prevStart && prevEnd) {
                              // Count previous period bookings for same top 6 providers
                              const topProviderNames = new Set(topProv.map(p => p.label));
                              for (const b of bookings) {
                                const d = resolveDate(b);
                                if (!d) continue;
                                if (d >= prevStart && d < prevEnd) {
                                  const pname = (b.provider && (b.provider.name || b.provider.fullName)) || (b.providerName) || 'Unknown';
                                  if (topProviderNames.has(pname)) {
                                    prevProvidersTotal++;
                                  }
                                }
                              }
                              percentChangeProviders = prevProvidersTotal === 0 ? (currentProvidersTotal > 0 ? 100 : 0) : ((currentProvidersTotal - prevProvidersTotal) / prevProvidersTotal) * 100;
                            }
                          }

                          const providersLabels = topProv.map(p => p.label);
                          const valuesByMonth = topProv[0].values.map((_, mi) => topProv.map(p => p.values[mi]));
                          const colors = ['#2b6cb0', '#2a4365', '#2c5282', '#2f855a', '#234e52', '#1e3a8a'];
                          const changeColorProv = percentChangeProviders > 0 ? '#10b981' : percentChangeProviders < 0 ? '#ef4444' : '#999';
                          const changeSymbolProv = percentChangeProviders > 0 ? '↑' : percentChangeProviders < 0 ? '↓' : '→';
                          
                          return (
                            <div>
                              {providerTimeframe !== 'custom' && (
                                <div style={{ marginBottom: 12, padding: 8, background: '#f0f9ff', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{ fontSize: 13, color: '#333' }}>vs previous:</span>
                                  <span style={{ fontSize: 14, fontWeight: 600, color: changeColorProv }}>
                                    {changeSymbolProv} {Math.abs(percentChangeProviders).toFixed(1)}%
                                  </span>
                                  <span style={{ fontSize: 12, color: '#666' }}>({prevProvidersTotal} → {currentProvidersTotal})</span>
                                </div>
                              )}
                              <SmallMonthStackedBarChart services={providersLabels} monthLabels={monthLabels} valuesByMonth={valuesByMonth} colors={colors} />
                            </div>
                          );
                        })()
                      }
                    </div>
                </div>

                {/* Row 2, Col 1: Location trends */}
                <div style={{ background: '#fff', padding: 12, borderRadius: 8, boxShadow: '0 4px 18px rgba(0,0,0,0.04)', minHeight: 500 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>Location trends</div>
                    <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} style={{ padding: '6px 8px', fontSize: 13 }}>
                      <option value="state">State</option>
                      <option value="city">City</option>
                      <option value="district">District</option>
                    </select>
                  </div>
                  <SmallPieChart data={locationTrends} size={180} colors={['#48bb78','#2f855a','#38a169','#68d391','#9ae6b4']} />
                </div>

                {/* Row 2, Col 2: Total bookings */}
                <div style={{ background: '#fff', padding: 12, borderRadius: 8, boxShadow: '0 4px 18px rgba(0,0,0,0.04)', minHeight: 500 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>Total bookings (month-wise)</div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <select value={bookingsTimeframe} onChange={(e) => setBookingsTimeframe(e.target.value)} style={{ padding: '6px 8px', fontSize: 13 }}>
                        <option value="this_month">This month</option>
                        <option value="last_3">Last 3 months</option>
                        <option value="last_6">Last 6 months</option>
                        <option value="custom">Select month</option>
                      </select>
                      {bookingsTimeframe === 'custom' && (
                      <input type="month" value={bookingsCustomMonth} onChange={(e) => setBookingsCustomMonth(e.target.value)} style={{ padding: '6px 8px', fontSize: 13 }} />
                      )}
                    </div>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    {
                      (() => {
                        const { months, monthLabels } = computeRange(bookingsTimeframe, bookingsCustomMonth);
                        if (!months || months.length === 0) return <div style={{ color: '#888' }}>No data</div>;

                        const resolveDate = (b) => {
                          if (!b) return null;
                          const candidates = [b.createdAt, b.created_at, b.date, b.bookingDate, b.bookedAt, b.createdOn];
                          for (const c of candidates) {
                            if (!c) continue;
                            const d = new Date(c);
                            if (!isNaN(d)) return d;
                          }
                          if (typeof b === 'number' || (typeof b === 'string' && /^\d+$/.test(b))) {
                            const d = new Date(Number(b));
                            if (!isNaN(d)) return d;
                          }
                          return null;
                        };

                        // Count total bookings per month
                        const monthCounts = Array(months.length).fill(0);
                        for (const b of bookings) {
                          const d = resolveDate(b);
                          if (!d) continue;
                          if (d < months[0] || d >= new Date(months[months.length - 1].getFullYear(), months[months.length - 1].getMonth() + 1, 1)) continue;
                          for (let mi = 0; mi < months.length; mi++) {
                            const sStart = months[mi];
                            const sEnd = new Date(sStart.getFullYear(), sStart.getMonth() + 1, 1);
                            if (d >= sStart && d < sEnd) {
                              monthCounts[mi]++;
                              break;
                            }
                          }
                        }

                        if (monthCounts.every(c => c === 0)) return <div style={{ color: '#888' }}>No data</div>;

                        // Calculate current vs previous period totals
                        const currentTotal = monthCounts.reduce((a, b) => a + b, 0);
                        let prevTotal = 0;
                        let percentChange = 0;
                        
                        if (bookingsTimeframe !== 'custom') {
                          // Calculate previous period
                          const prevMonths = [];
                          let prevStart, prevEnd;
                          
                          if (bookingsTimeframe === 'this_month') {
                            const prevMonth = new Date(months[0].getFullYear(), months[0].getMonth() - 1, 1);
                            prevStart = prevMonth;
                            prevEnd = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 1);
                          } else if (bookingsTimeframe === 'last_3') {
                            prevStart = new Date(months[0].getFullYear(), months[0].getMonth() - 3, 1);
                            prevEnd = months[0];
                          } else if (bookingsTimeframe === 'last_6') {
                            prevStart = new Date(months[0].getFullYear(), months[0].getMonth() - 6, 1);
                            prevEnd = months[0];
                          }
                          
                          if (prevStart && prevEnd) {
                            for (const b of bookings) {
                              const d = resolveDate(b);
                              if (!d) continue;
                              if (d >= prevStart && d < prevEnd) prevTotal++;
                            }
                            percentChange = prevTotal === 0 ? (currentTotal > 0 ? 100 : 0) : ((currentTotal - prevTotal) / prevTotal) * 100;
                          }
                        }

                        // Render as a simple bar chart (single bar per month, not stacked)
                        const max = Math.max(...monthCounts, 1);
                        const chartHeight = 160;
                        const changeColor = percentChange > 0 ? '#10b981' : percentChange < 0 ? '#ef4444' : '#999';
                        const changeSymbol = percentChange > 0 ? '↑' : percentChange < 0 ? '↓' : '→';
                        
                        return (
                          <div>
                            {/* Percentage change indicator */}
                            {bookingsTimeframe !== 'custom' && (
                              <div style={{ marginBottom: 12, padding: 8, background: '#f0f9ff', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 13, color: '#333' }}>vs previous period:</span>
                                <span style={{ fontSize: 14, fontWeight: 600, color: changeColor }}>
                                  {changeSymbol} {Math.abs(percentChange).toFixed(1)}%
                                </span>
                                <span style={{ fontSize: 12, color: '#666' }}>({prevTotal} → {currentTotal})</span>
                              </div>
                            )}
                            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', height: chartHeight }}>
                              {monthCounts.map((count, mi) => (
                                <div key={mi} style={{ width: 56, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                  {Number(count) > 0 ? (
                                    <div
                                      role="img"
                                      aria-label={`Total ${count} for ${monthLabels[mi]}`}
                                      title={`${count} total`}
                                      style={{ fontSize: 12, color: '#333', marginBottom: 6 }}
                                    >
                                      {abbreviateNumber(count)}
                                    </div>
                                  ) : (
                                    <div style={{ height: 18 }} />
                                  )}
                                  <div
                                    role="img"
                                    aria-label={`${monthLabels[mi]} total ${count} bookings`}
                                    style={{ height: chartHeight, width: 40, borderRadius: 6, background: '#4f46e5', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.03)', position: 'relative' }}
                                  >
                                    <div style={{ height: Math.round((count / max) * chartHeight), width: '100%', background: '#4f46e5', borderRadius: 6, position: 'absolute', bottom: 0 }} />
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                              {monthLabels.map((m, i) => (
                                <div key={i} style={{ width: 56, textAlign: 'center', fontSize: 12, color: '#333' }}>{m.split(' ')[0]}</div>
                              ))}
                            </div>
                          </div>
                        );
                      })()
                    }
                  </div>
                </div>
              </div>
            </div>
          </>
        )}


        {/* Chat Page */}
        {activeTab === 'chat' && (
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
                  currentUserId={adminUser?.id || localStorage.getItem('userId')}
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


        {activeTab === "users" && (
          <div>
            <div className="table wide-table">
              <div className="table-header">
              <h3><b>Customers</b></h3>
              <button className="manage-btn" onClick={() => setManageUsers((prev) => !prev)}>
                {manageUsers ? "Done" : "Manage Users"}
              </button>
            </div>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th></th>
                    <th>Created On</th>
                    {manageUsers && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c, i) => (
                    <tr key={i}>
                      <td>{c.id}</td>
                      <td>{c.name}</td>
                      <td>{c.email}</td>
                      <td>
                        <button className="admin-connect-button" onClick={() => setSelectedCustomer(c)}>
                          See Details
                        </button>
                      </td>
                      <td>{c.createdOn}</td>
                      {manageUsers && (
                        <td>
                          <button className="delete-btn" onClick={() => handleDeleteUser(i)}>
                            Delete
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedCustomer && (
          <div className="a-modal-overlay" onClick={() => setSelectedCustomer(null)}>
            <div className="a-modal-content" onClick={e => e.stopPropagation()}>
              <button className="a-modal-close-btn" onClick={() => setSelectedCustomer(null)}>×</button>
              <div className="a-modal-left">
                <div className="a-card-profile">
                  <p>
                    <FaUserCircle color="#332f2a" size={40} />
                    <h2 className="a-modal-provider-name-left">{selectedCustomer.name}</h2>
                  </p>
                </div>
                <div>
                  <div className="a-modal-contact-row">
                    <p>
                      <FaPhoneAlt />
                      <span className="a-modal-detail-value">{selectedCustomer.phno}</span>
                    </p>
                    <p>
                      <FaEnvelope />
                      <span className="a-modal-detail-value">{selectedCustomer.email}</span>
                    </p>
                  </div>
                  <p className="a-modal-location-row">
                    <FaMapMarkerAlt color="#cf1616ff" className="a-modal-map-icon" />
                    Location:
                  </p>
                  <p className="a-modal-detail-value-left">{selectedCustomer.location}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "services" && (
          <div>
            <div className="table wide-table">
              <div className="table-header">
                <h3><b>Service Providers</b></h3>
                <button className="manage-btn" onClick={() => setManageProviders((prev) => !prev)}>
                  {manageProviders ? "Done" : "Manage Providers"}
                </button>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Provider Name</th>
                    <th>Category</th>
                    <th></th>                  
                    <th>Created On</th>
                    {manageProviders && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {approvedProviders.map((p, i) => (
                    <tr key={i}>
                      <td>{p.id}</td>
                      <td>{p.provider?.name}</td>
                      <td>{p.category}</td>
                      <td>
                        <button className="admin-connect-button" onClick={() => setSelectedProvider(p.provider ?? p)}>
                          See Details
                        </button>
                      </td>                  
                      <td>{p.provider?.createdOn}</td>
                      {manageProviders && (
                        <td>
                          <button className="delete-btn" onClick={() => handleDeleteProvider(i)}>Delete</button>
                      </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* combined modal: provider details on left, reviews panel on right (renders when showReviewsCard true) */}
        {selectedProvider && (
          <div className="a-modal-overlay" onClick={() => { setSelectedProvider(null); }}>
            <div className="a-modal-content a-modal-inner" onClick={e => e.stopPropagation()}>
              <button className="a-modal-close-btn" onClick={() => { setSelectedProvider(null); setShowReviewsCard(false); }}>×</button>

              {/* LEFT - provider details (kept original style) */}
              <div className="a-modal-left provider-card-original">
                <div className="a-card-profile">
                    <p>
                      <FaUserCircle color="#332f2a" size={40} />
                      <h2 className="a-modal-provider-name-left">{selectedProvider.name}</h2>
                    </p>
                </div>

                <div className="a-modal-contact-row">
                  <div
                    className="rating clickable"
                    onClick={() => setShowReviewsCard(true)}
                    role="button"
                    tabIndex={0}
                    title="See reviews"
                  >
                    <FaStar className="star-icon" />
                    {/* provider stats from map */}
                    {(() => {
                      const pid = getProviderId(selectedProvider);
                      const stats = reviewsMap[pid] || { count: 0, sum: 0 };
                      return `${stats.count ? (stats.sum / stats.count).toFixed(1) : "0.0"} (${stats.count} reviews)`;
                    })()}
                  </div>

                  <p>
                    <FaPhoneAlt /> <span className="a-modal-detail-value">{selectedProvider?.phno}</span>
                  </p>
                  <p>
                    <FaEnvelope /> <span className="a-modal-detail-value">{selectedProvider?.email}</span>
                  </p>
                </div>

                <p className="a-modal-location-row">
                  <FaMapMarkerAlt color="#cf1616ff" className="a-modal-map-icon" /> Location:
                </p>
                <p className="a-modal-detail-value-left">{selectedProvider?.location}</p>
              </div>

              {/* RIGHT - reviews (only rendered when showReviewsCard true) */}
              {showReviewsCard && (
                <div>
                  <Reviews
                    provider={selectedProvider}
                    onBack={() => setShowReviewsCard(false)}
                    bookingId={null}
                    showAddButton={false}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "verification" && (
          <div>
            <div className="table wide-table">
              <div className="table-header">
                <h3><b>Verification of Providers</b></h3>
                <button className="manage-btn" onClick={() => setManageProviders((prev) => !prev)}>
                  {manageProviders ? "Done" : "Manage Providers"}
                </button>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Provider Name</th>
                    <th></th>
                    <th>Status</th>
                    <th>Uploaded On</th>
                    {manageProviders && <th>Verify</th>}
                  </tr>
                </thead>
                <tbody>
                  {providersSorted.map((p, i) => (
                    <tr key={p.id ?? p._id ?? i}>
                      <td>{p.id}</td>
                      <td>{p.provider?.name}</td>
                      <td>
                        <button
                          className="admin-connect-button"
                          onClick={() => handleSeeDocument(p.provider ?? p)}
                          disabled={docLoading}
                        >
                          {docLoading ? "Loading..." : "See Document"}
                        </button>
                      </td>
                      <td>
                        <span className={`status ${String(p.verified ?? "").toLowerCase()}`}>{p.verified}</span>
                      </td>
                      <td>{p.provider?.createdOn}</td>
                      {manageProviders && (
                        <td>
                          {String(p.verified ?? "").toLowerCase() === "pending" ? (
                            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                              <button
                                className="approve-btn"
                                onClick={() => updateProviderVerification(p, "APPROVED")}
                                disabled={processingServiceId === (p.id ?? p._id ?? p.provider?.id)}
                                title="Approve provider"
                              >
                                <FaCheck />
                              </button>

                              <button
                                className="reject-btn"
                                onClick={() => updateProviderVerification(p, "REJECTED")}
                                disabled={processingServiceId === (p.id ?? p._id ?? p.provider?.id)}
                                title="Reject provider"
                              >
                                <FaTimes />
                              </button>
                            </div>
                          ) : 'NA'}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "bookings" && (
          <div className="table wide-table">
            <h3>Bookings</h3>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Provider</th>
                  <th>Service</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b, i) => (
                  <tr key={i}>
                    <td>{b.id}</td>
                    <td>{b.customer.name}</td>
                    <td>{b.provider.name}</td>
                    <td>{b.service.category}</td>
                    <td>
                      <span className={`status ${b.status.replace(" ", "").toLowerCase()}`}>{b.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "complaints" && (
          <div className="table wide-table">
            <div className="table-header">
                <h3><b>Reports</b></h3>
                <button className="manage-btn" onClick={() => setManageProviders((prev) => !prev)}>
                  {manageProviders ? "Done" : "Manage Providers"}
                </button>
              </div>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Provider</th>
                  <th>Report</th>
                  <th>Created On</th>
                  {manageProviders && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {reports.map((r, i) => (
                  <tr key={i}>
                    <td>{r.id}</td>
                    <td>{r.reportedBy.name}</td>
                    <td>{r.reportedOn.name}</td>
                    <td>{r.reason}</td>
                    <td>{r.createdAt}</td>
                    
                    {manageProviders && (
                        <td>
                          <button className="delete-btn" onClick={() => handleDeleteProvider(i)}>Delete</button>
                      </td>
                      )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "settings" && (
          <div>
            <h3>Settings</h3>
          </div>
        )}
      </main>

      {/* Document modal fallback */}
      {docModalOpen && (
        <div className="a-modal-overlay" onClick={closeDocModal}>
          <div className="a-modal-content" onClick={e => e.stopPropagation()}>
            <button className="a-modal-close-btn" onClick={closeDocModal}>×</button>
            <div style={{ width: '80vw', height: '80vh' }}>
              <iframe
                src={docModalUrl}
                title="Provider Document"
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;