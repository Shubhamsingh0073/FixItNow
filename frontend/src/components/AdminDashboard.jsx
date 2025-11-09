import React, { useState, useEffect, useMemo } from "react";
import {
  FaHome,
  FaUsers,
  FaTools,
  FaCalendarAlt,
  FaStar,
  FaExclamationTriangle,
  FaPhoneAlt,
  FaUserCircle,
  FaEnvelope,
  FaMapMarkerAlt,
  FaSignOutAlt,
  FaCheck,
} from "react-icons/fa";
import "./AdminDashboard.css";
import Reviews from "./Reviews";

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

const bookings = [
  { id: 2001, user: "Suresh Kumar", service: "Plumbing", status: "Completed" },
  { id: 2002, user: "Priya Sharma", service: "Electrical", status: "In Progress" },
  { id: 2003, user: "Arun Raj", service: "Carpentry", status: "Pending" },
  { id: 2004, user: "Meena Reddy", service: "Appliance Repair", status: "Completed" },
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
  const [users, setUsers] = useState(userExamples);
  const [providers, setProviders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(null);

  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [showReviewsCard, setShowReviewsCard] = useState(false); // show reviews column to the right

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

  // Safe provider id getter (works with various shapes)
  const getProviderId = (p) =>
    p == null ? null : (p.id ?? p._id ?? p.providerId ?? p.provider?.id ?? null);

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
    return bookings.filter(b => ["in progress", "inprogress", "active", "pending"].includes(String(b.status || "").toLowerCase())).length;
  }, [bookings]);

  const statsData = useMemo(() => [
    { value: (customers?.length || 0) + verifiedProvidersCount, label: "Total Users" },
    { value: activeBookingsCount, label: "Active Bookings" },
    { value: verifiedProvidersCount, label: "Verified Providers" },
    { value: pendingApprovalsCount, label: "Pending Approvals" },
  ], [customers, activeBookingsCount, verifiedProvidersCount, pendingApprovalsCount]);

  // NEW: only approved providers for Services tab
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
        <div className="sidebar-subtitle">ADMIN</div>
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
                        <td>{b.user}</td>
                        <td>{b.service}</td>
                        <td>
                          <span className={`status ${b.status.replace(" ", "").toLowerCase()}`}>{b.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === "users" && (
          <div>
            <div className="table-header">
              <h3><b>Customers</b></h3>
              <button className="manage-btn" onClick={() => setManageUsers((prev) => !prev)}>
                {manageUsers ? "Done" : "Manage Users"}
              </button>
            </div>
            <div className="table wide-table">
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
            <div className="table-header">
              <h3><b>Service Providers</b></h3>
              <button className="manage-btn" onClick={() => setManageProviders((prev) => !prev)}>
                {manageProviders ? "Done" : "Manage Providers"}
              </button>
            </div>
            <div className="table wide-table">
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
            <div className="table-header">
              <h3><b>Verification of Providers</b></h3>
              <button className="manage-btn" onClick={() => setManageProviders((prev) => !prev)}>
                {manageProviders ? "Done" : "Manage Providers"}
              </button>
            </div>
            <div className="table wide-table">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Provider Name</th>
                    <th></th>
                    <th>Status</th>
                    <th>Created On</th>
                    {manageProviders && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {providers.map((p, i) => (
                    <tr key={i}>
                      <td>{p.id}</td>
                      <td>{p.provider?.name}</td>
                      <td>
                        <button className="admin-connect-button" onClick={() => setSelectedProvider(p.provider ?? p)}>
                          See Document
                        </button>
                      </td>
                      <td>
                        <span className={`status ${p.verified?.toLowerCase()}`}>{p.verified}</span>
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

        {activeTab === "bookings" && (
          <div className="table wide-table">
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
                    <td>{b.user}</td>
                    <td>{b.service}</td>
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
            <h3 style={{ marginBottom: "1.2rem" }}>User Complaints</h3>
            <div className="complaints-list">
              {complaints.map((comp, idx) => (
                <div className="complaint-card" key={idx}>
                  <div className="complaint-header">
                    <strong>
                      {comp.user} &rarr; {comp.provider}
                    </strong>
                    <span className="complaint-date">{comp.date}</span>
                  </div>
                  <div className="complaint-body">{comp.complaint}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div>
            <h3>Settings</h3>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;