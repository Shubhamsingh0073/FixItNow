import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaCalendarAlt, FaClock } from "react-icons/fa";

// Fix leaflet icon issues
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const CustomerWideCard = ({
  customer,
  showAcceptedStatus = true,
  showMap = true,
  showDropdown = false,
  currentBookingStatus,
  handleBookingStatusChange
}) => {
  const totalPrice = customer.bookedServices
    ? Object.values(customer.bookedServices).reduce((sum, price) => sum + price, 0)
    : 0;

  let lat = 12.9716, lng = 77.5946; // Default: Bangalore
  if (customer.lat && customer.lng) {
    lat = customer.lat;
    lng = customer.lng;
  }

  // Status options (use the ones from your dashboard)
  const bookingStatusOptions = [
  { label: "Confirmed", value: "CONFIRMED" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Completed", value: "COMPLETED" }
];

  return (
    <div className={`provider-customer-card wide-card ${showAcceptedStatus && customer.status ? "accepted-card" : ""}`}>
      <div className="wide-card-columns">
        {/* Left column: customer details */}
        <div className="wide-card-left">
          <div className="customer-info">
            <h3><b>{customer.customerName}</b></h3>
          </div>
          <p className="customer-contact-info">
            <FaMapMarkerAlt color="#cf1616ff" className="map-icon" /> {customer.customerLocation}
          </p>
          <p className="customer-contact-info"><FaPhone /> {customer.customerPhone}</p>
          <p className="customer-contact-info"><FaEnvelope /> {customer.customerEmail}</p>
          <p className="customer-contact-info">
            <FaCalendarAlt /> {customer.bookingDate}
            <FaClock style={{ marginLeft: "0.5em" }} /> {customer.timeSlot}
          </p>
          <div className="booked-services">
            <strong>Booked Services:</strong>
            <ul className="booked-services-list">
              {customer.bookedServices &&
                Object.entries(customer.bookedServices).map(([service, price]) => (
                  <li className="booked-services-item" key={service}>
                    <span className="booked-service-name">{service}</span>
                    <span className="booked-service-price">₹{price}</span>
                  </li>
                ))}
            </ul>
          </div>
        </div>
        {/* Right column: Map (optional) */}
        {showMap && (
          <div className="wide-card-right">
            <MapContainer
              center={[lat, lng]}
              zoom={15}
              style={{
                height: "250px",
                width: "100%",
                borderRadius: "1em",
                minWidth: "220px",
                maxWidth: "350px"
              }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
              />
              <Marker position={[lat, lng]}>
                <Popup>
                  {customer.customerName || customer.name}
                  <br />
                  {customer.customerLocation}
                </Popup>
              </Marker>
            </MapContainer>
          </div>
        )}
      </div>
      {/* Status and Total row at the bottom */}
      <div className="status-total-row" style={{ marginTop: "1em", width: "100%" }}>
        {showDropdown && (
          <div className="booking-status-dropdown">
            <label htmlFor="booking-status-select"><strong>Status:</strong></label>
            <select
              id="booking-status-select"
              value={currentBookingStatus}
              onChange={e => handleBookingStatusChange(e.target.value)}
            >
              {bookingStatusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        )}
        
        {showAcceptedStatus && customer.status && (
            <div className="card-info-item accepted-status">
              Status:
              <span
                className={`accepted-status-label status-${customer.status.toLowerCase().replace(/ /g, "-")}`}
              >
                {customer.status}
              </span>
            </div>
        )}

        <div className="booked-services-total">
          <span className="total-label">Total:</span>
          <span className="total-value">₹{totalPrice}</span>
        </div>
      </div>
    </div>
  );
};

export default CustomerWideCard;