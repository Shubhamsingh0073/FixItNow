import React, { useState } from "react";
import {
  FaHome,
  FaUsers,
  FaTools,
  FaCalendarAlt,
  FaExclamationTriangle,
  FaCog,
  FaSignOutAlt,
} from "react-icons/fa";
import "./AdminDashboard.css";

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

// Service provider shop names
const providerExamples = [
  { id: 3001, name: "QuickFix Plumbing", service: "Plumbing", status: "Active" },
  { id: 3002, name: "BrightSpark Electricals", service: "Electrical", status: "Active" },
  { id: 3003, name: "WoodWorks Carpentry", service: "Carpentry", status: "Inactive" },
  { id: 3004, name: "CleanPro Services", service: "Cleaning", status: "Active" },
  { id: 3005, name: "Appliance Masters", service: "Appliance Repair", status: "Inactive" },
  { id: 3006, name: "PlumbRight Solutions", service: "Plumbing", status: "Active" },
  { id: 3007, name: "ElectroCare", service: "Electrical", status: "Active" },
  { id: 3008, name: "CraftyCarpenters", service: "Carpentry", status: "Active" },
  { id: 3009, name: "Shine&Sparkle", service: "Cleaning", status: "Active" },
  { id: 3010, name: "Appliance Hub", service: "Appliance Repair", status: "Active" },
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

const statsData = [
  { value: 800, label: "Total Users" },
  { value: 220, label: "Active Bookings" },
  { value: 520, label: "Verified Providers" },
  { value: 45, label: "Pending Approvals" },
];

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [manageUsers, setManageUsers] = useState(false);
  const [manageProviders, setManageProviders] = useState(false);
  const [users, setUsers] = useState(userExamples);
  const [providers, setProviders] = useState(providerExamples);

  const handleLogout = () => {
    window.location.href = "/login";
  };

  const handleDeleteUser = (index) => {
    setUsers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDeleteProvider = (index) => {
    setProviders((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="dashboard admin-theme">
      {/* Sidebar */}
      <aside className="sidebar">
        <h2 className="logo">FixItNow</h2>
        <div className="sidebar-title">FixItNow</div>
        <div className="sidebar-subtitle">ADMIN</div>
        <ul>
          <li
            className={activeTab === "home" ? "active" : ""}
            onClick={() => setActiveTab("home")}
          >
            <FaHome /> Home
          </li>
          <li
            className={activeTab === "users" ? "active" : ""}
            onClick={() => setActiveTab("users")}
          >
            <FaUsers /> Users
          </li>
          <li
            className={activeTab === "services" ? "active" : ""}
            onClick={() => setActiveTab("services")}
          >
            <FaTools /> Services
          </li>
          <li
            className={activeTab === "bookings" ? "active" : ""}
            onClick={() => setActiveTab("bookings")}
          >
            <FaCalendarAlt /> Bookings
          </li>
          <li
            className={activeTab === "complaints" ? "active" : ""}
            onClick={() => setActiveTab("complaints")}
          >
            <FaExclamationTriangle /> Complaints
          </li>
          {/* Settings as heading only */}
          <li className="sidebar-heading">
            <FaCog /> Settings
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
                          <span className={`status ${b.status.replace(" ", "").toLowerCase()}`}>
                            {b.status}
                          </span>
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
              <h3>All Users</h3>
              <button
                className="manage-btn"
                onClick={() => setManageUsers((prev) => !prev)}
              >
                {manageUsers ? "Done" : "Manage Users"}
              </button>
            </div>
            <div className="table wide-table">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    {manageUsers && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={i}>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td>{u.role}</td>
                      {manageUsers && (
                        <td>
                          <button
                            className="delete-btn"
                            onClick={() => handleDeleteUser(i)}
                          >
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

        {activeTab === "services" && (
          <div>
            <div className="table-header">
              <h3>All Providers</h3>
              <button
                className="manage-btn"
                onClick={() => setManageProviders((prev) => !prev)}
              >
                {manageProviders ? "Done" : "Manage Providers"}
              </button>
            </div>
            <div className="table wide-table">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Shop Name</th>
                    <th>Service</th>
                    <th>Status</th>
                    {manageProviders && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {providers.map((p, i) => (
                    <tr key={i}>
                      <td>{p.id}</td>
                      <td>{p.name}</td>
                      <td>{p.service}</td>
                      <td>
                        <span
                          className={`status ${
                            p.status === "Active"
                              ? "completed"
                              : "pending"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      {manageProviders && (
                        <td>
                          <button
                            className="delete-btn"
                            onClick={() => handleDeleteProvider(i)}
                          >
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
                      <span className={`status ${b.status.replace(" ", "").toLowerCase()}`}>
                        {b.status}
                      </span>
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