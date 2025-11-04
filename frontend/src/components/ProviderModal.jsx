import React, { useRef, useEffect, useState } from "react";
import { FaStar, FaEnvelope, FaMapMarkerAlt, FaPhone, FaUserCircle, FaCommentDots } from "react-icons/fa";
import "./ProviderModal.css";
import Reviews from "./Reviews";

// ChatPanel component
const WS_BASE_URL = "ws://localhost:8087/ws";

const ChatPanel = ({ providerId, customerId, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState("");
  const socketRef = useRef();

  useEffect(() => {
    // For provider chat: ws://.../ws/chat?customerId=...&providerId=...
    const url = `${WS_BASE_URL}/chat?customerId=${customerId}&providerId=${providerId}`;
    socketRef.current = new window.WebSocket(url);

    socketRef.current.onopen = () => {
      // You may send a join event/message here if your backend expects it
    };
    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages((prev) => [...prev, data]);
    };
    socketRef.current.onerror = (e) => console.error("WebSocket error", e);
    socketRef.current.onclose = () => {
      // Optionally handle disconnect
    };
    return () => {
      socketRef.current.close();
    };
  }, [providerId, customerId]);

  const sendMessage = () => {
    if (!inputMsg.trim()) return;
    const msgData = {
      sender: "customer",
      message: inputMsg,
      to: providerId
    };
    try {
      socketRef.current.send(JSON.stringify(msgData));
      setMessages((prev) => [...prev, { sender: "me", message: inputMsg }]);
      setInputMsg("");
    } catch (err) {
      alert("Failed to send message");
    }
  };

  return (
    <div className="chat-panel">
      <button className="back-to-booking-btn" onClick={onBack}>⬅ Back</button>
      <h2 className="chat-title">Chat</h2>
      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`chat-msg ${msg.sender}`}>
            <b>
              {msg.sender === "admin"
                ? "Admin"
                : msg.sender === "provider"
                ? "Provider"
                : msg.sender === "customer"
                ? "You"
                : msg.sender === "me"
                ? "You"
                : msg.sender}
            </b>: {msg.message}
          </div>
        ))}
      </div>
      <div className="chat-input-row">
        <input
          type="text"
          value={inputMsg}
          placeholder="Type a message..."
          onChange={e => setInputMsg(e.target.value)}
          className="chat-input"
        />
        <button className="chat-send-btn" onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};


function formatForInput(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseDateInput(value) {
  if (!value) return null;
  const [y, m, d] = value.split("-").map((s) => parseInt(s, 10));
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

function parseTimeStringToMinutes(timeStr) {
  if (!timeStr && timeStr !== 0) return null;
  const s = String(timeStr).trim().toLowerCase();

  const ampmMatch = s.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
  if (ampmMatch) {
    let h = parseInt(ampmMatch[1], 10);
    const m = parseInt(ampmMatch[2] || "0", 10);
    const ampm = ampmMatch[3];
    if (ampm === "pm" && h !== 12) h += 12;
    if (ampm === "am" && h === 12) h = 0;
    return h * 60 + m;
  }

  const hhmm = s.match(/^(\d{1,2}):(\d{2})$/);
  if (hhmm) {
    const h = parseInt(hhmm[1], 10);
    const m = parseInt(hhmm[2], 10);
    return h * 60 + m;
  }

  const num = s.match(/^(\d{1,2})$/);
  if (num) {
    const h = parseInt(num[1], 10);
    return h * 60;
  }

  return null;
}

function formatMinutesToDisplay(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = ((h + 11) % 12) + 1;
  return `${hour12}:${String(m).padStart(2, "0")} ${ampm}`;
}

const SLOT_MINUTES = 30;

const ProviderModal = ({
  provider,
  onClose,
  selectedServices,
  setSelectedServices,
  modalScrollTop,
  setModalScrollTop,
  handleConnect,
  booking = null,
  viewingBooking = false,
}) => {
  const scrollRef = useRef();
  const [selectedDate, setSelectedDate] = useState("");
  const [dateError, setDateError] = useState("");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const minDate = new Date(today);
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 13);

  const minDateStr = formatForInput(minDate);
  const maxDateStr = formatForInput(maxDate);

  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [slotError, setSlotError] = useState("");

  // rightPanel: booking, reviews, chat
  const [rightPanel, setRightPanel] = useState('booking'); 
  const customerId =
    JSON.parse(localStorage.getItem("currentUser"))?.id || localStorage.getItem("customerId");

  const submitBooking = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You must be logged in to book. Please login.");
      return;
    }
    const bookedServices = {};
    Object.entries(selectedServices)
      .filter(([name, checked]) => checked)
      .forEach(([name]) => {
        bookedServices[name] = provider.subcategory[name];
      });

    const payload = {
      providerId: provider.id,
      bookingDate: selectedDate,
      timeSlot: selectedSlot,
      bookedServices: bookedServices,
      status: "PENDING",
    };

    try {
      const response = await fetch("http://localhost:8087/bookings/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to submit booking");
      }
      alert("Booked successfully!");
    } catch (error) {
      alert("Booking failed: " + error.message);
    }
  };

  useEffect(() => {
    const fromStr = provider?.availability?.from;
    const toStr = provider?.availability?.to;

    const startMin = parseTimeStringToMinutes(fromStr);
    const endMin = parseTimeStringToMinutes(toStr);

    if (startMin == null || endMin == null) {
      setTimeSlots([]);
      setSelectedSlot("");
      return;
    }

    const latestStart = endMin - 120;

    if (latestStart < startMin) {
      setTimeSlots([]);
      setSelectedSlot("");
      return;
    }

    const slots = [];
    for (let t = startMin; t <= latestStart; t += SLOT_MINUTES) {
      const hours = Math.floor(t / 60);
      const mins = t % 60;
      const value = `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
      slots.push({ value, label: formatMinutesToDisplay(t) });
    }

    setTimeSlots(slots);
    setSelectedSlot(slots.length > 0 ? slots[0].value : "");
    setSlotError("");
  }, [provider]);

  const [allReviews, setAllReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  // Fetch reviews when modal opens
  useEffect(() => {
    if (rightPanel === 'booking' || rightPanel === 'reviews') {
      const fetchReviews = async () => {
        try {
          const response = await fetch("http://localhost:8087/reviews/all");
          if (!response.ok) throw new Error("Error fetching reviews");
          const data = await response.json();
          setAllReviews(data);
        } catch (err) {
          console.error(err);
          setAllReviews([]);
        }
        setLoadingReviews(false);
      };
      fetchReviews();
    }
  }, [rightPanel]);

  const providerReviews = allReviews.filter(r => r.provider_id === provider.id);

  const overallRating = providerReviews.length > 0
    ? (providerReviews.reduce((sum, r) => sum + r.rating, 0) / providerReviews.length).toFixed(2)
    : "No rating";

  const totalReviews = providerReviews.length;

  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        scrollRef.current.scrollTop = modalScrollTop || 0;
      }, 0);
    }
  }, [selectedServices, modalScrollTop, provider]);

  useEffect(() => {
    setDateError("");
    setSelectedDate(minDateStr);
  }, [provider, minDateStr]);

  const handleCheckboxChange = (name, checked) => {
    if (scrollRef.current) setModalScrollTop(scrollRef.current.scrollTop || 0);
    setSelectedServices(prev => ({ ...prev, [name]: checked }));
  };

  const onDateChange = (e) => {
    const val = e.target.value;
    setSelectedDate(val);

    if (!val) {
      setDateError("Please select a date.");
      return;
    }

    const chosen = parseDateInput(val);
    if (!chosen) {
      setDateError("Invalid date.");
      return;
    }

    const min = parseDateInput(minDateStr);
    const max = parseDateInput(maxDateStr);
    if (chosen < min || chosen > max) {
      setDateError(`Please choose a date between ${minDateStr} and ${maxDateStr}.`);
    } else {
      setDateError("");
    }
  };

  const onConnectClick = async () => {
    if (provider?.available === false) return;

    if (!selectedDate || dateError) {
      setDateError(`Please choose a valid date between ${minDateStr} and ${maxDateStr}.`);
      return;
    }

    if (timeSlots.length > 0 && !selectedSlot) {
      setSlotError("Please select a time slot.");
      return;
    }

    setSlotError("");

    await submitBooking();

    handleConnect(provider, selectedDate, selectedServices, selectedSlot);

    onClose();
  };

  if (!provider) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>×</button>
        <div className="modal-inner">
          {/* LEFT BOX: Provider Details */}
          <div className="modal-left">
            <div className="card-profile">
              <FaUserCircle color="#fdfdfd" size={90} />
            </div>
            <h2 className="modal-provider-name-left">{provider.name}</h2>
            <div className="modal-provider-details">
              <div className="modal-left-inner">
                <div className="modal-left-rating"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setRightPanel('reviews')}
                  tabIndex={0}
                  role="button"
                  title="See reviews"
                >
                  <FaStar color="#fbbf24" size={32} />
                  <span className="modal-rating-label">
                    {loadingReviews ? "..." : `${overallRating}/5`}
                  </span>
                </div>
                <div
                  className="modal-left-rating"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setRightPanel('reviews')}
                  tabIndex={0}
                  role="button"
                  title="See all reviews"
                >
                  <span className="modal-rating-value">
                    {loadingReviews ? "..." : totalReviews}
                  </span>
                  <span className="modal-rating-label">reviews</span>
                </div>
                <div
                  className="modal-left-rating"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setRightPanel('chat')}
                  tabIndex={0}
                  role="button"
                  title="Chat with Provider or Admin"
                >
                  <FaCommentDots color="#6156f8ff" size={32} />
                  <span className="modal-rating-label">Chat</span>
                </div>
              </div>
            </div>
            <div className="modal-left-info">
              <div className="modal-contact-row">
                <p>Contact: <span className="modal-detail-value">{provider.phone}</span></p>
                <p><FaEnvelope /><span className="modal-detail-value">{provider.email}</span></p>
              </div>
              <p className="modal-location-row">
                <FaMapMarkerAlt color="#cf1616ff" className="modal-map-icon" />
                Location:
              </p>
              <p className="modal-detail-value-left">{provider.location}</p>
            </div>
          </div>
          {/* RIGHT BOX: Booking/services controls */}
          <div className="modal-right">
            <h2 className="modal-provider-name">
              {viewingBooking ? "Booking Details" : "Booking Form"}
            </h2>
            <div className="modal-provider-details">
              <div className="modal-detail-row">
                <span className="modal-detail-value"><strong>Description:</strong> {provider.description}</span>
              </div>
              <div className="modal-detail-row">
                <strong>Availability:</strong>
                <span className="modal-detail-value">
                  {provider.availability?.from ?? ""} {provider.availability?.to ? ` to ${provider.availability.to}` : ""}
                </span>
              </div>
              {/* BOOKING FORM: Only show if not viewingBooking */}
              {!viewingBooking ? (
                <>
                  <div className="modal-detail-row booking-row">
                    <label className="modal-row-label">
                      <strong>Choose booking date:</strong>
                    </label>
                    <input
                      className="date-input"
                      type="date"
                      value={selectedDate}
                      onChange={onDateChange}
                      min={minDateStr}
                      max={maxDateStr}
                      aria-label="Booking date"
                    />
                    {dateError && <div className="date-error">{dateError}</div>}

                    <label className="modal-row-label">
                      <strong>Time slot:</strong>
                    </label>
                    {timeSlots.length === 0 ? (
                      <div className="no-slots">
                        No time slots available for this provider's availability.
                      </div>
                    ) : (
                      <select
                        className="slot-select"
                        value={selectedSlot}
                        onChange={(e) => {
                          setSelectedSlot(e.target.value);
                          setSlotError("");
                        }}
                      >
                        {timeSlots.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    )}
                    {slotError && <div className="slot-error">{slotError}</div>}
                  </div>
                  <div className="modal-content-scroll" ref={scrollRef}>
                    <div className="modal-provider-details">
                      {provider.subcategory && (
                        <div className="modal-subcategories">
                          <strong>Services:</strong>
                          <div className="modal-subcategory-list">
                            {Object.entries(provider.subcategory).map(([name, price]) => (
                              <label key={name} className="modal-subcategory-row">
                                <input
                                  type="checkbox"
                                  checked={!!selectedServices[name]}
                                  onChange={(e) => handleCheckboxChange(name, e.target.checked)}
                                />
                                <span className="modal-subcategory-name">{name}</span>
                                <span className="modal-subcategory-price">₹ {price}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                      <hr className="modal-services-divider" />
                      <div className="modal-services-total-row">
                        <span className="modal-services-total-label"><strong>Total Price :</strong></span>
                        <span className="modal-services-total-value">
                          ₹{Object.entries(selectedServices)
                            .filter(([name, checked]) => checked)
                            .reduce((sum, [name]) => sum + (provider.subcategory?.[name] || 0), 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    className="connect-button"
                    onClick={onConnectClick}
                    disabled={
                      provider.available === false ||
                      !!dateError ||
                      !selectedDate ||
                      (timeSlots.length > 0 && !selectedSlot)
                    }
                  >
                    {provider.available === false ? "Currently Unavailable" : "Connect Now"}
                  </button>
                </>
              ) : (
                /* BOOKING DETAILS: Only show if viewingBooking is true */
                booking && (
                  <>
                    <div className="modal-detail-row">
                      <strong>Booking Date:</strong> {booking.bookingDate}
                    </div>
                    <div className="modal-detail-row">
                      <strong>Time Slot:</strong> {booking.timeSlot}
                    </div>
                    <div className="modal-subcategories">
                      <strong>Booked Services:</strong>
                      <div className="modal-subcategory-list">
                        {booking.bookedServices &&
                          Object.entries(booking.bookedServices).map(([name, price]) => (
                            <div key={name} className="modal-subcategory-row">
                              <span className="modal-subcategory-name">{name}</span>
                              <span className="modal-subcategory-price">₹ {price}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                    <div className="modal-services-total-row">
                      <span className="modal-services-total-label"><strong>Total Price :</strong></span>
                      <span className="modal-services-total-value">
                        ₹{booking.bookedServices
                          ? Object.values(booking.bookedServices).reduce((sum, price) => sum + price, 0)
                          : 0}
                      </span>
                    </div>
                  </>
                )
              )}
            </div>
          </div>
          {rightPanel === "reviews" && (
            <Reviews
              provider={provider}
              onBack={() => setRightPanel('booking')}
              bookingId={booking ? booking.bookingId : null}
            />
          )}
          {rightPanel === "chat" && (
            <ChatPanel
              providerId={provider.id}
              customerId={customerId}
              onBack={() => setRightPanel('booking')}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProviderModal;