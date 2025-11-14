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

  const loadReports = async () => {
    try {
      const res = await fetch("http://localhost:8087/api/reports", {
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
      // keep whatever we have in state rather than wiping it aggressively
    }
  };

  // call once on mount
  useEffect(() => {
    loadReports().catch(err => { /* already logged in loadReports */ });
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


  // filtered lists for report and refund tables
  const reportsOnly = useMemo(() => {
    if (!Array.isArray(reports)) return [];
    return reports.filter(r => String(r.category || '').trim().toUpperCase() === 'REPORT');
  }, [reports]);

  const refundsOnly = useMemo(() => {
    if (!Array.isArray(reports)) return [];
    return reports.filter(r => String(r.category || '').trim().toUpperCase() === 'REFUND');
  }, [reports]);


  const openActionModal = (reportObj, type) => {
    // type is 'accept' or 'reject'
    setActionTarget(reportObj);
    setActionType(type);

    // For refunds, if admin clicks "approved" prefill the reply with the refund message and optionally make it readonly
    const category = String(reportObj?.category || '').toUpperCase();
    if (category === 'REFUND' && type === 'approved') {
      setActionReply('Refund has been initiated');
      setActionReadOnly(true); // make readonly so admin doesn't accidentally change; set false if you want editable
    } else {
      // default: empty reply for admin to type
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

  // Submit admin response: sets status and sends reply to backend
  const submitActionResponse = async () => {
    if (!actionTarget || !actionType) return;
    const newStatus = actionType === 'approved' ? 'APPROVED' : 'REJECTED';
    const reportId = actionTarget.id;
    if (!reportId) {
      alert('Report id not available.');
      return;
    }

    setProcessingReportId(reportId);

    // prepare payload
    const payload = {
      status: newStatus,
      reply: actionReply || (newStatus === 'APPROVED' && actionTarget.category === 'REFUND' ? 'Refund has been initiated' : '')
    };

    try {
      const token = localStorage.getItem('token');
      const url = `http://localhost:8087/api/reports/${encodeURIComponent(reportId)}`;
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

        // Temporary heuristic: if backend returns 500 with message indicating update succeeded,
        // we can still optimistically update — optional.
        // Otherwise show error and return.
        alert(`Failed to update report: ${res.status} ${text || res.statusText}`);
        return;
      }

      // Try parse updated object if server returned it
      let updated = null;
      try { updated = await res.json(); } catch (_) { updated = null; }

      // Optimistically update local state immediately so UI changes without needing a reload
      setReports(prev => prev.map(r => {
        if (String(r.id) !== String(reportId)) return r;
        if (updated && typeof updated === 'object') return updated;
        return { ...r, status: newStatus, adminReply: payload.reply };
      }));

      // close modal right away to give snappy UX
      closeActionModal();

      // Refresh canonical data from server (ensures names/fields returned by server are applied)
      await loadReports();

    } catch (err) {
      console.error('Error submitting admin response', err);
      alert('Network error while responding. See console.');
    } finally {
      setProcessingReportId(null);
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