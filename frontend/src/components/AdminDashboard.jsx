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

  const locationTrends = useMemo(() => {
    if (!Array.isArray(bookings)) return [];
    const map = {};
    for (const b of bookings) {
      const loc = (b.customer && (b.customer.location || b.customer.customerLocation)) || b.location || 'Unknown';
      map[loc] = (map[loc] || 0) + 1;
    }
    const arr = Object.entries(map).map(([label, value]) => ({ label, value }));
    arr.sort((a, b) => b.value - a.value);
    return arr.slice(0, 6);
  }, [bookings]);
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
            {/* Charts: Most booked services, Top providers, Location trends */}
            <div style={{ marginTop: 20 }}>
              <h3 style={{ marginBottom: 12 }}>Analytics</h3>
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 360px', background: '#fff', padding: 12, borderRadius: 8, boxShadow: '0 4px 18px rgba(0,0,0,0.04)' }}>
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>Most booked services</div>
                  <SmallPieChart data={topServices} size={180} />
                </div>

                <div style={{ flex: '1 1 360px', background: '#fff', padding: 12, borderRadius: 8, boxShadow: '0 4px 18px rgba(0,0,0,0.04)' }}>
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>Top providers</div>
                  <SmallPieChart data={topProviders} size={180} colors={['#2b6cb0','#2a4365','#2c5282','#2f855a','#234e52']} />
                </div>

                <div style={{ flex: '1 1 360px', background: '#fff', padding: 12, borderRadius: 8, boxShadow: '0 4px 18px rgba(0,0,0,0.04)' }}>
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>Location trends</div>
                  <SmallPieChart data={locationTrends} size={180} colors={['#48bb78','#2f855a','#38a169','#68d391','#9ae6b4']} />
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