import React, { useRef, useEffect, useState } from "react";
import { FaStar, FaEnvelope, FaMapMarkerAlt } from "react-icons/fa";
import "./ProviderModal.css";

function formatForInput(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** parse 'YYYY-MM-DD' into a local Date at midnight */
function parseDateInput(value) {
  if (!value) return null;
  const [y, m, d] = value.split("-").map((s) => parseInt(s, 10));
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

function parseTimeStringToMinutes(timeStr) {
  if (!timeStr && timeStr !== 0) return null;
  const s = String(timeStr).trim().toLowerCase();

  // am/pm formats like "7:30am" or "7:30 am" or "7 pm"
  const ampmMatch = s.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
  if (ampmMatch) {
    let h = parseInt(ampmMatch[1], 10);
    const m = parseInt(ampmMatch[2] || "0", 10);
    const ampm = ampmMatch[3];
    if (ampm === "pm" && h !== 12) h += 12;
    if (ampm === "am" && h === 12) h = 0;
    return h * 60 + m;
  }

  // 24h hh:mm
  const hhmm = s.match(/^(\d{1,2}):(\d{2})$/);
  if (hhmm) {
    const h = parseInt(hhmm[1], 10);
    const m = parseInt(hhmm[2], 10);
    return h * 60 + m;
  }

  // single number "7" or "07" -> 7:00
  const num = s.match(/^(\d{1,2})$/);
  if (num) {
    const h = parseInt(num[1], 10);
    return h * 60;
  }

  return null;
}

/** format minutes-since-midnight to "7:30 AM" */
function formatMinutesToDisplay(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = ((h + 11) % 12) + 1; // convert 0->12
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
}) => {
  const scrollRef = useRef();
  const [selectedDate, setSelectedDate] = useState("");
  const [dateError, setDateError] = useState("");

  // Define local today/min/max inside the component
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const minDate = new Date(today); // today inclusive
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 13); // today + 13 => 14-day window inclusive

  const minDateStr = formatForInput(minDate);
  const maxDateStr = formatForInput(maxDate);

  const [timeSlots, setTimeSlots] = useState([]); // array of { value: "HH:MM", label: "7:30 AM" }
  const [selectedSlot, setSelectedSlot] = useState("");
  const [slotError, setSlotError] = useState("");

  // compute time slots based on provider.availability.from/to
  useEffect(() => {
    const fromStr = provider?.availability?.from;
    const toStr = provider?.availability?.to;

    const startMin = parseTimeStringToMinutes(fromStr);
    const endMin = parseTimeStringToMinutes(toStr);

    if (startMin == null || endMin == null) {
      // no valid availability times -> empty slots
      setTimeSlots([]);
      setSelectedSlot("");
      return;
    }

    // end of allowed start times is 2 hours before the 'to' time
    const latestStart = endMin - 120; // minutes

    if (latestStart < startMin) {
      // no available slots (availability window shorter than 2 hours)
      setTimeSlots([]);
      setSelectedSlot("");
      return;
    }

    const slots = [];
    for (let t = startMin; t <= latestStart; t += SLOT_MINUTES) {
      const hours = Math.floor(t / 60);
      const mins = t % 60;
      const value = `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`; // "07:30" 24h
      slots.push({ value, label: formatMinutesToDisplay(t) });
    }

    setTimeSlots(slots);
    // default to first slot if available
    setSelectedSlot(slots.length > 0 ? slots[0].value : "");
    setSlotError("");
  }, [provider]);

  // Restore modal scroll position when reopening
  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        scrollRef.current.scrollTop = modalScrollTop || 0;
      }, 0);
    }
  }, [selectedServices, modalScrollTop, provider]);

  // When modal opens for a provider, default date to today (optional)
  useEffect(() => {
    setDateError("");
    setSelectedDate(minDateStr);
  }, [provider, minDateStr]);

  const handleCheckboxChange = (name, checked) => {
    if (scrollRef.current) setModalScrollTop(scrollRef.current.scrollTop || 0);
    setSelectedServices((prev) => ({ ...prev, [name]: checked }));
  };

  const onDateChange = (e) => {
    const val = e.target.value; // 'YYYY-MM-DD' or ''
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

    // normalize comparisons
    const min = parseDateInput(minDateStr);
    const max = parseDateInput(maxDateStr);
    if (chosen < min || chosen > max) {
      setDateError(`Please choose a date between ${minDateStr} and ${maxDateStr}.`);
    } else {
      setDateError("");
    }
  };

  const onConnectClick = () => {
    if (provider?.available === false) return;

    if (!selectedDate || dateError) {
      setDateError(`Please choose a valid date between ${minDateStr} and ${maxDateStr}.`);
      return;
    }

    // require slot if slots exist
    if (timeSlots.length > 0 && !selectedSlot) {
      setSlotError("Please select a time slot.");
      return;
    }

    setSlotError("");

    // call parent handler with provider, selectedDate, selectedServices, selectedSlot
    // selectedSlot is in "HH:MM" 24-hour format (e.g., "07:30")
    handleConnect(provider, selectedDate, selectedServices, selectedSlot);

    onClose();
  };

  if (!provider) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          ×
        </button>

        <h2 className="modal-provider-name">{provider.name}</h2>

        <div className="modal-provider-details">
          <div className="modal-detail-row rating-row">
            <FaStar className="star-icon" />
            <span className="modal-detail-value">
              {provider.rating ?? "4.5"} ({provider.reviews ?? "120"} reviews)
            </span>
          </div>
        </div>

        <div className="modal-contact-row">
          <p>Contact: <span className="modal-detail-value">{provider.phone}</span></p>
          <p><FaEnvelope /><span className="modal-detail-value">{provider.email}</span></p>
        </div>

        <div className="modal-content-scroll" ref={scrollRef}>
          <div className="modal-provider-details">
            <div className="modal-location-row">
              <FaMapMarkerAlt color="#cf1616ff" className="modal-map-icon" />
              <span className="modal-detail-value">{provider.location}</span>
            </div>

            <div className="modal-detail-row">
              <span className="modal-detail-value"><strong>Description:</strong> {provider.description}</span>
            </div>

            <div className="modal-detail-row">
              <strong>Availability:</strong>
              <span className="modal-detail-value">
                {provider.availability?.from ?? ""} {provider.availability?.to ? ` to ${provider.availability.to}` : ""}
              </span>
            </div>

            {/* Booking date picker */}
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
            </div>

            {/* New: select time slot dropdown */}
            <div className="modal-detail-row slot-row">
              <label className="modal-row-label">
                <strong>Select time slot:</strong>
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
          disabled={provider.available === false || !!dateError || !selectedDate || (timeSlots.length > 0 && !selectedSlot)}
        >
          {provider.available === false ? "Currently Unavailable" : "Connect Now"}
        </button>
      </div>
    </div>
  );
};

export default ProviderModal;