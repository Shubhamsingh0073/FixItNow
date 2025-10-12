import React, { useState } from 'react';
import { FaUserCircle, FaHome, FaCalendarAlt, FaSignOutAlt, FaQuestionCircle, FaRegComments, FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import './ProviderDashboard.css';

const categories = ['Plumbing', 'Electrical', 'Carpentry', 'Cleaning', 'Appliance Repair', 'Others'];

// Time dropdown options: 12-hour format
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

const initialProvider = {
  name: 'Provider Name',
  email: 'provider@email.com',
  phone: '',
  availability: { from: "9:00 am", to: "4:00 pm" },
  description: '',
  rating: 4.6,
  reviews: [
    { user: 'Alice', stars: 5, text: 'Great work, very professional!' },
    { user: 'Bob', stars: 4, text: 'Quick and reliable service.' },
    { user: 'Carol', stars: 5, text: 'Excellent communication and job done perfectly.' },
    { user: 'David', stars: 3, text: 'Arrived late but completed the job as expected.' }
  ]
};

const ProviderDashboard = () => {
  const [activePage, setActivePage] = useState('profile');
  const [provider, setProvider] = useState(initialProvider);

  // Profile details editing
  const [isEditing, setIsEditing] = useState(false);
  const [phoneInput, setPhoneInput] = useState(provider.phone);
  const [availabilityFrom, setAvailabilityFrom] = useState(provider.availability.from);
  const [availabilityTo, setAvailabilityTo] = useState(provider.availability.to);
  const [descriptionInput, setDescriptionInput] = useState(provider.description);

  // Service price section states
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);
  const [otherCategory, setOtherCategory] = useState('');
  const [services, setServices] = useState([]);
  const [showAddService, setShowAddService] = useState(false);
  const [addServiceName, setAddServiceName] = useState('');
  const [addServicePrice, setAddServicePrice] = useState('');
  const [editServiceIdx, setEditServiceIdx] = useState(null);

  // Only allow digits, max 10
  const handlePhoneInputChange = (e) => {
    if (!isEditing) return;
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhoneInput(val);
  };

  // Save Profile Details
  const handleProfileSave = () => {
    setProvider(prev => ({
      ...prev,
      phone: phoneInput,
      availability: { from: availabilityFrom, to: availabilityTo },
      description: descriptionInput
    }));
    setIsEditing(false);
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

  return (
    <div className="provider-dashboard-root">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-title">FixItNow</div>
        <div className="sidebar-subtitle">Provider</div>
        <nav className="sidebar-nav">
          <button className={activePage === 'home' ? 'active' : ''} onClick={() => setActivePage('home')}>
            <FaHome /> Home
          </button>
          <button className={activePage === 'bookings' ? 'active' : ''} onClick={() => setActivePage('bookings')}>
            <FaCalendarAlt /> Bookings
          </button>
          <button className={activePage === 'profile' ? 'active' : ''} onClick={() => setActivePage('profile')}>
            <FaUserCircle /> Profile
          </button>
        </nav>
        <div className="sidebar-bottom">
          <button className="logout-button" onClick={() => window.location.href = '/login'}>
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </div>
      {/* Main Content */}
      <div className="dashboard-main">
        {activePage === 'profile' && (
          <div className="profile-page">
            {/* Section 1: Profile Details */}
            <div className="profile-info-box wide-profile-box">
              <div className="profile-info-right">
                <h2 className="profile-reviews-heading" style={{fontSize: '1.33rem', marginBottom: '0.7rem'}}>Profile Details</h2>
                <div className="profile-info-item"><strong>Name:</strong> {provider.name}</div>
                <div className="profile-info-item"><strong>Email:</strong> {provider.email}</div>
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
                <div style={{display: 'flex', alignItems: 'center', gap: '0.7rem'}}>
                  <label htmlFor="category" style={{fontWeight: 'bold'}}>Category:</label>
                  <select id="category" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
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
                      style={{marginLeft: '0.7rem', padding: '0.5rem', borderRadius: '0.5rem', border: '2px solid #e2e8f0'}}
                    />
                  )}
                </div>
                <button
                  className="accept-request-btn"
                  style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}
                  onClick={() => openAddService()}
                >
                  <FaPlus /> Add services
                </button>
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
                            <button style={{marginRight: '0.5rem'}} onClick={() => openAddService(idx)} title="Edit"><FaEdit /></button>
                            <button onClick={() => handleDeleteService(idx)} title="Delete"><FaTrash /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
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