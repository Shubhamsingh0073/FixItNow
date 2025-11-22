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
import AdminCharts from "./AdminCharts";
import Sidebar from "./Sidebar"

export const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8087";

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
  const [showReviewsCard, setShowReviewsCard] = useState(false); 

  const [adminUser, setAdminUser] = useState(null); 
  const [conversations, setConversations] = useState([]); 
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [selectedPeer, setSelectedPeer] = useState(null);
  const [selectedPeerName, setSelectedPeerName] = useState('');

  const adminMenu = [
    { key: "home", label: "Home", icon: <FaHome /> },
    { key: "users", label: "Customers", icon: <FaUsers /> },
    { key: "services", label: "Providers", icon: <FaTools /> },
    { key: "verification", label: "Verification", icon: <FaCheck /> },
    { key: "bookings", label: "Bookings", icon: <FaCalendarAlt /> },
    { key: "complaints", label: "Complaints", icon: <FaExclamationTriangle /> },
    { key: "chat", label: "Messages", icon: <FaFacebookMessenger /> },
  ];
  
  
  // document-related state
  const [documentsCache, setDocumentsCache] = useState(null); 
  const [docModalUrl, setDocModalUrl] = useState(null); 
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [docLoading, setDocLoading] = useState(false);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const response = await fetch(`${API_BASE}/service`);
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

  const loadReports = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/reports`, {
        headers: { "Content-Type": "application/json" }
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Failed to fetch reports: ${res.status} ${text}`);
      }
      const data = await res.json();
      setReports(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching reports:", err);
    }
  };


  useEffect(() => {
    loadReports().catch(err => {  });
  }, []);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch(`${API_BASE}/users/customers`);
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
        const response = await fetch(`${API_BASE}/bookings/all`);
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
        const response = await fetch(`${API_BASE}/reviews/all`);
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


  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch(`${API_BASE}/users/me`, {
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

  useEffect(() => {
    const loadConversations = async () => {
      const token = localStorage.getItem('token');
      const userId = adminUser?.id || localStorage.getItem('userId');
      if (!userId) return;
      setLoadingConversations(true);
      try {
        const url = `${API_BASE}/api/chat/conversations?userId=${encodeURIComponent(userId)}`;
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
      const interval = setInterval(() => {
        loadConversations().catch(() => {});
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab, adminUser]);

  const getProviderId = (p) =>
    p == null ? null : (p.id ?? p._id ?? p.providerId ?? p.provider?.id ?? null);

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

    const url = `${API_BASE}/service/${serviceId}/verify`; 

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

      let returned = null;
      try {
        returned = await res.json();
      } catch (_) {
        returned = null;
      }

      setProviders(prev => {
        return prev.map(item => {
          const itemId = resolveServiceId(item);
          if (String(itemId) !== String(serviceId)) return item;

          if (returned && typeof returned === "object") {
            const merged = {
              ...item,               
              ...returned,           
              provider: {
                ...(item.provider || {}),
                ...(returned.provider || {}),
              },
            };
            return merged;
          }

          return { ...item, verified: newStatus };
        });
      });

      console.log("updateProviderVerification: success", serviceId, newStatus);
    } catch (err) {
      console.error("Error updating provider verification:", err);
      alert("Network error while updating provider verification. See console.");
    } finally {
      setProcessingServiceId(null);
    }
  };

  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionTarget, setActionTarget] = useState(null); 
  const [actionType, setActionType] = useState(null); 
  const [actionReply, setActionReply] = useState('');
  const [actionReadOnly, setActionReadOnly] = useState(false); 
  const [processingReportId, setProcessingReportId] = useState(null); 

  const [manageReports, setManageReports] = useState(false);
  const [manageRefunds, setManageRefunds] = useState(false);


  const reportsOnly = useMemo(() => {
    if (!Array.isArray(reports)) return [];
    return reports.filter(r => String(r.category || '').trim().toUpperCase() === 'REPORT');
  }, [reports]);

  const refundsOnly = useMemo(() => {
    if (!Array.isArray(reports)) return [];
    return reports.filter(r => String(r.category || '').trim().toUpperCase() === 'REFUND');
  }, [reports]);


  const openActionModal = (reportObj, type) => {
    setActionTarget(reportObj);
    setActionType(type);

    const category = String(reportObj?.category || '').toUpperCase();
    if (category === 'REFUND' && type === 'approved') {
      setActionReply('Refund has been initiated');
      setActionReadOnly(true); 
    } else {
      setActionReply('');
      setActionReadOnly(false);
    }

    setActionModalOpen(true);
  };

  const closeActionModal = () => {
    setActionModalOpen(false);
    setActionTarget(null);
    setActionType(null);
    setActionReply('');
    setActionReadOnly(false);
  };

  const submitActionResponse = async () => {
    if (!actionTarget || !actionType) return;
    const newStatus = actionType === 'approved' ? 'APPROVED' : 'REJECTED';
    const reportId = actionTarget.id;
    if (!reportId) {
      alert('Report id not available.');
      return;
    }

    setProcessingReportId(reportId);

    const payload = {
      status: newStatus,
      reply: actionReply || (newStatus === 'APPROVED' && actionTarget.category === 'REFUND' ? 'Refund has been initiated' : '')
    };

    try {
      const token = localStorage.getItem('token');
      const url = `${API_BASE}/api/reports/${encodeURIComponent(reportId)}`;
      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.error('Failed updating report status', res.status, text);

        alert(`Failed to update report: ${res.status} ${text || res.statusText}`);
        return;
      }

      let updated = null;
      try { updated = await res.json(); } catch (_) { updated = null; }

      setReports(prev => prev.map(r => {
        if (String(r.id) !== String(reportId)) return r;
        if (updated && typeof updated === 'object') return updated;
        return { ...r, status: newStatus, adminReply: payload.reply };
      }));

      closeActionModal();

      await loadReports();

    } catch (err) {
      console.error('Error submitting admin response', err);
      alert('Network error while responding. See console.');
    } finally {
      setProcessingReportId(null);
    }
  };


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

  const providersSorted = React.useMemo(() => {
    if (!Array.isArray(providers)) return [];

    const rank = (p) => {
      const v = String(p?.verified ?? "").toLowerCase();
      if (v === "pending") return 0;   
      if (v === "approved") return 1;
      if (v === "rejected") return 2;
      return 3; 
    };

    return providers
      .map((p, idx) => ({ p, idx, r: rank(p) }))
      .sort((a, b) => {
        if (a.r !== b.r) return a.r - b.r;
        const nameA = String(a.p?.provider?.name ?? a.p?.name ?? "").toLowerCase();
        const nameB = String(b.p?.provider?.name ?? b.p?.name ?? "").toLowerCase();
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return a.idx - b.idx;
      })
      .map(x => x.p);
  }, [providers]);

  // --- Document logic ---
  const fetchDocumentsMetadata = async () => {
    if (documentsCache) return documentsCache;
    try {
      const res = await fetch(`${API_BASE}/users/documents`);
      if (!res.ok) throw new Error("Failed to fetch documents");
      const data = await res.json();
      setDocumentsCache(data);
      return data;
    } catch (err) {
      console.error("Error fetching documents metadata:", err);
      return null;
    }
  };

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

      const openUrl = `${API_BASE}/users/document/${encodeURIComponent(match.document_id)}`;
      const newTab = window.open(openUrl, "_blank");
      if (newTab) {
        setDocLoading(false);
        return;
      }

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


  return (
    <div className="dashboard admin-theme">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onActivate={(k) => setActiveTab(k)}
        menu={adminMenu}        
        showLogoOnCollapsed={true}
        handleLogout={() => {handleLogout()}}
      />

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

            
            {/* Charts: 2x2 Grid Layout */}
            <div style={{ marginTop: 20 }}>
              <h3 style={{ marginBottom: 12 }}><b>Analytics</b></h3>
              <div style={{ marginTop: 20 }}>
                <AdminCharts bookings={bookings} providers={providers} />
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

        {selectedProvider && (
          <div className="a-modal-overlay" onClick={() => { setSelectedProvider(null); }}>
            <div className="a-modal-content a-modal-inner" onClick={e => e.stopPropagation()}>
              <button className="a-modal-close-btn" onClick={() => { setSelectedProvider(null); setShowReviewsCard(false); }}>×</button>

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
            <h3><b>Bookings</b></h3>
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
        <div>
          {/* REPORTS SECTION */}
          <div className="table wide-table">
            <div className="table-header" >
              <h3><b>Reports</b></h3>
              <button className="manage-btn" onClick={() => setManageReports(prev => !prev)}>
                {manageReports ? "Done" : "Manage Reports"}
              </button>
            </div>

            <div className="table wide-table">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Customer</th>
                    <th>Provider</th>
                    <th>Report</th>
                    <th>Created On</th>
                    <th>Status</th>
                    {manageReports && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {reportsOnly.map((r, i) => {
                    const reportedByName = r.reportedBy?.name ?? r.reportedByName ?? r.reportedById ?? 'Unknown';
                    const reportedOnName = r.reportedOn?.name ?? r.reportedOnName ?? r.reportedOnId ?? 'Unknown';
                    const created = r.createdAt ? new Date(r.createdAt).toLocaleString() : (r.createdOn ?? '');
                    const status = r.status ?? r.state ?? 'UNKNOWN';

                    return (
                      <tr key={r.id ?? i}>
                        <td>{r.id}</td>
                        <td>{reportedByName}</td>
                        <td>{reportedOnName}</td>
                        <td>{r.reason}</td>
                        <td>{created}</td>
                        <td><span className={`status ${String(status).toLowerCase()}`}>{status}</span></td>

                        {manageReports && (
                        <td>
                          <div style={{ display: 'flex', gap: 8 }}>
                            {(() => {
                              const isFinal = ['APPROVED', 'REJECTED'].includes(String(r.status ?? '').toUpperCase());
                              const disabled = processingReportId === r.id || isFinal;

                              return (
                                <>
                                  <button
                                    className="approve-btn"
                                    title="Approve"
                                    onClick={() => openActionModal && openActionModal(r, 'approved')}
                                    disabled={disabled}
                                    aria-disabled={disabled}
                                  >
                                    <FaCheck />
                                  </button>

                                  <button
                                    className="reject-btn"
                                    title="Reject"
                                    onClick={() => openActionModal && openActionModal(r, 'reject')}
                                    disabled={disabled}
                                    aria-disabled={disabled}
                                  >
                                    <FaTimes />
                                  </button>
                                </>
                              );
                            })()}
                          </div>
                        </td>
                      )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* gap between tables */}
          <div style={{ height: 28 }} />

          {/* REFUNDS SECTION */}
          <div className="table wide-table">
            <div className="table-header" >
              <h3><b>Refund Requests</b></h3>
              <button className="manage-btn" onClick={() => setManageRefunds(prev => !prev)}>
                {manageRefunds ? "Done" : "Manage Refunds"}
              </button>
            </div>

            <div className="table wide-table">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Customer</th>                    
                    <th>Reason</th>
                    <th>Created On</th>
                    <th>Status</th>
                    {manageRefunds && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {refundsOnly.map((r, i) => {
                    const reportedByName = r.reportedBy?.name ?? r.reportedByName ?? r.reportedById ?? 'Unknown';
                    const reportedOnName = r.reportedOn?.name ?? r.reportedOnName ?? r.reportedOnId ?? 'Unknown';
                    const created = r.createdAt ? new Date(r.createdAt).toLocaleString() : (r.createdOn ?? '');
                    const status = r.status ?? r.state ?? 'UNKNOWN';

                    return (
                      <tr key={r.id ?? i}>
                        <td>{r.id}</td>
                        <td>{reportedByName}</td>                      
                        <td>{r.reason}</td>
                        <td>{created}</td>
                        <td><span className={`status ${String(status).toLowerCase()}`}>{status}</span></td>

                        {manageRefunds && (
                        <td>
                          <div style={{ display: 'flex', gap: 8 }}>
                            {(() => {
                              const isFinal = ['APPROVED', 'REJECTED'].includes(String(r.status ?? '').toUpperCase());
                              const disabled = processingReportId === r.id || isFinal;

                              return (
                                <>
                                  <button
                                    className="approve-btn"
                                    title="Approve refund"
                                    onClick={() => openActionModal && openActionModal(r, 'approved')}
                                    disabled={disabled}
                                    aria-disabled={disabled}
                                  >
                                    <FaCheck />
                                  </button>

                                  <button
                                    className="reject-btn"
                                    title="Reject refund"
                                    onClick={() => openActionModal && openActionModal(r, 'reject')}
                                    disabled={disabled}
                                    aria-disabled={disabled}
                                  >
                                    <FaTimes />
                                  </button>
                                </>
                              );
                            })()}
                          </div>
                        </td>
                      )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}


        {/* Admin response modal (reply to report/refund) */}
        {actionModalOpen && (
          <div className="a-modal-overlay" onClick={closeActionModal}>
            <div className="a-modal-left " onClick={e => e.stopPropagation()}>
              <button style={{ marginLeft: 400, color: '#444' }} alignItems="flex-start" onClick={closeActionModal}>×</button>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <h3 style={{ margin: 0, color: '#444' }}>
                  {actionType === 'approved' ? 'Approved' : 'Reject'} {actionTarget?.category === 'REFUND' ? 'Refund' : 'Report'}
                </h3>
                <div style={{ fontSize: 13, color: '#444' }}>
                  For: <strong>{actionTarget?.reportedOn?.name ?? actionTarget?.reportedOnId}</strong> — Report ID: {actionTarget?.id}
                </div>

                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontWeight: 600, color: '#444' }}>Reply / Reason</div>
                  <textarea
                    rows={6}
                    value={actionReply}
                    onChange={(e) => setActionReply(e.target.value)}
                    placeholder="Type your reply to the customer..."
                    disabled={actionReadOnly}
                    style={{ padding: 10, borderRadius: 8, border: '1px solid #e6e6ea', color: '#0f172a' }}
                  />
                </label>

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button className="report-cancel-btn" onClick={closeActionModal} disabled={processingReportId !== null}>Cancel</button>
                  <button
                    className="report-submit-btn"
                    onClick={submitActionResponse}
                    disabled={processingReportId !== null || (!actionReply && actionType === 'reject')} // require reply for reject
                  >
                    {processingReportId === actionTarget?.id ? 'Processing…' : 'Done'}
                  </button>
                </div>
              </div>
            </div>
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