import React, { useMemo, useState, useEffect } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  PieChart, Pie, Cell, LineChart, Line, Tooltip,
} from "recharts";
import "./AdminCharts.css";

export const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8087";

const FIXED_CATEGORIES = [
  "Plumbing", "Electrical", "Carpentry", "Cleaning", "Appliance Repair",
];

const PALETTE = [
  "#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#ef4444",
  "#9f7aea", "#2b6cb0", "#7c3aed", "#16a34a", "#f97316",
];

const AdminCharts = ({ bookings = [], providers = [] }) => {
  const resolveDate = (b) => {
    if (!b) return null;
    const candidates = [
      b.createdAt,
      b.created_at,
      b.date,
      b.bookingDate,
      b.bookedAt,
      b.createdOn,
    ];
    for (const c of candidates) {
      if (!c) continue;
      const d = new Date(c);
      if (!isNaN(d)) return d;
    }
    if (typeof b === "number" || (typeof b === "string" && /^\d+$/.test(b))) {
      const d = new Date(Number(b));
      if (!isNaN(d)) return d;
    }
    return null;
  };

  // ---------- 1) Most booked services (fixed 5 categories) ----------
  const categoriesData = useMemo(() => {
    const map = {};
    for (const cat of FIXED_CATEGORIES) map[cat] = 0;
    for (const b of bookings || []) {
      const cat =
        (b.service && (b.service.category || b.service.name)) ||
        b.serviceCategory ||
        b.serviceName ||
        "Unknown";
      const matched =
        FIXED_CATEGORIES.find(
          (c) => String(c).toLowerCase() === String(cat).toLowerCase()
        ) || "Unknown";
      if (!map[matched]) map[matched] = 0;
      map[matched] += 1;
    }
    return FIXED_CATEGORIES.map((name) => ({ name, value: map[name] || 0 }));
  }, [bookings]);

  // ---------- Safe label component for bars ----------
  const SafeBarLabel = (props) => {
    if (!props) return null;
    const { x = 0, y = 0, width = 0, value = "", payload } = props;
    const name = payload && (payload.name || payload.label) ? (payload.name || payload.label) : "";
    if (!name && (value === "" || value === null || value === undefined)) return null;
    const cx = x + width / 2;
    const labelY = y - 6;
    return (
      <g>
        {value !== "" && value !== null && (
          <text
            x={cx}
            y={labelY - 12}
            fill="#0f172a"
            fontSize={12}
            textAnchor="middle"
            style={{ pointerEvents: "none", fontWeight: 700 }}
          >
            {value}
          </text>
        )}
        {name && (
          <text
            x={cx}
            y={labelY}
            fill="#374151"
            fontSize={12}
            textAnchor="middle"
            style={{ pointerEvents: "none", fontWeight: 600 }}
          >
            {name}
          </text>
        )}
      </g>
    );
  };

  // ---------- 2) Top providers (pie + left legend) ----------
  const providersData = useMemo(() => {
    const map = {};
    for (const b of bookings || []) {
      let name =
        (b.provider && (b.provider.name || b.provider.fullName)) ||
        b.providerName ||
        b.provider_name ||
        null;
      if (!name && (b.providerId || b.provider_id)) {
        const p = providers.find(
          (pp) =>
            String(pp.id) === String(b.providerId) ||
            String(pp?.provider?.id) === String(b.providerId)
        );
        if (p) name = p.provider?.name || p.name || String(b.providerId);
      }
      if (!name) name = "Unknown";
      map[name] = (map[name] || 0) + 1;
    }
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [bookings, providers]);

  const [locationList, setLocationList] = useState([]);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/users/locations`);
        if (!res.ok) throw new Error("Failed to fetch locations");
        const data = await res.json();
        if (mounted && Array.isArray(data)) setLocationList(data);
      } catch (err) {
        console.warn("locations fetch failed", err);
        if (mounted) setLocationList([]);
      }
    })();
    return () => (mounted = false);
  }, []);

  const [locLevel, setLocLevel] = useState("state");

  // ----- Improved normalization and city/state extraction using authoritative lists -----

  const normalize = (s) => {
    if (!s && s !== "") return "";
    try {
      return String(s)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
    } catch (e) {
      return String(s || "").toLowerCase().trim();
    }
  };

  // Authoritative lists for India (states + common capitals / major cities).
  // Extend these arrays if you want more city names or alternate spellings.
  const INDIAN_STATES_RAW = [
    "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa",
    "Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala",
    "Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland",
    "Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura",
    "Uttar Pradesh","Uttarakhand","West Bengal","Jammu and Kashmir","Ladakh",
    "Puducherry","Chandigarh","Delhi","Andaman and Nicobar Islands","Lakshadweep",
    "Dadra and Nagar Haveli and Daman and Diu"
  ];

  const INDIAN_CITIES_RAW = [
    "Hyderabad","Bengaluru","Bangalore","Chennai","Mumbai","New Delhi","Delhi","Kolkata","Ahmedabad","Pune",
    "Jaipur","Lucknow","Bhopal","Patna","Ranchi","Thiruvananthapuram","Trivandrum","Kochi","Guwahati",
    "Gandhinagar","Panaji","Raipur","Shimla","Chandigarh","Imphal","Shillong","Aizawl","Kohima","Bhubaneswar",
    "Dehradun","Agartala","Itanagar","Port Blair","Leh","Vishakhapatnam","Visakhapatnam","Surat","Vadodara",
    "Indore","Nagpur","Rajkot","Jodhpur","Madurai","Tiruchirappalli","Mysore","Mysuru","Kalyan","Thane","Nashik"
  ];

  // build normalized lookup arrays sorted by descending key length (prefer longest matches)
  const INDIAN_STATES = INDIAN_STATES_RAW
    .map(name => ({ name, key: normalize(name) }))
    .sort((a,b) => b.key.length - a.key.length);

  const INDIAN_CITIES = INDIAN_CITIES_RAW
    .map(name => ({ name, key: normalize(name) }))
    .sort((a,b) => b.key.length - a.key.length);

  /**
   * extractCityState - improved lookup using known city/state lists
   * - returns { city, state }
   * - tries to find a city/name or state inside the normalized location string
   * - falls back to comma-splitting if no match found
   */
  const extractCityState = (locStr) => {
    let fallbackCity = "Unknown";
    let fallbackState = "Unknown";

    if (!locStr || typeof locStr !== "string") return { city: fallbackCity, state: fallbackState };

    const raw = locStr.trim();
    const parts = raw.split(",").map(p => p.trim()).filter(Boolean);
    if (parts.length > 0) fallbackCity = parts[0];
    if (parts.length > 1) fallbackState = parts[parts.length - 1];

    const norm = normalize(raw);

    // 1) Try to match a known city (longest-first)
    for (const c of INDIAN_CITIES) {
      if (!c.key) continue;
      if (norm.includes(c.key)) {
        const detectedCity = c.name;
        // attempt to find state as well
        for (const s of INDIAN_STATES) {
          if (!s.key) continue;
          if (norm.includes(s.key)) {
            return { city: detectedCity, state: s.name };
          }
        }
        return { city: detectedCity, state: fallbackState || "Unknown" };
      }
    }

    // 2) If no city matched, try to match a state anywhere
    for (const s of INDIAN_STATES) {
      if (!s.key) continue;
      if (norm.includes(s.key)) {
        const stateIndex = norm.indexOf(s.key);
        const prefix = raw.slice(0, stateIndex).trim();
        const prefixParts = prefix.split(",").map(p => p.trim()).filter(Boolean);
        const possibleCity = prefixParts.length ? prefixParts[prefixParts.length - 1] : fallbackCity;
        return { city: possibleCity || "Unknown", state: s.name };
      }
    }

    // 3) Fallback: use comma-splitting (first part = city, last part = state)
    return { city: fallbackCity || "Unknown", state: fallbackState || "Unknown" };
  };

  //split location into city/state
  const locationEntries = useMemo(() => {
    if (!Array.isArray(locationList)) return [];
    return locationList.map((item) => {
      const raw = String(item.location || "");
      const { city, state } = extractCityState(raw);
      return {
        id: item.id ?? null,
        location: raw,
        city: city || "Unknown",
        state: state || "Unknown",
        cityKey: normalize(city || "Unknown"),
        stateKey: normalize(state || "Unknown"),
      };
    });
  }, [locationList]);

  const locationData = useMemo(() => {
    const stateOrder = [];
    const stateSeen = new Set();
    const cityOrder = [];
    const citySeen = new Set();

    for (const e of locationEntries) {
      if (!stateSeen.has(e.stateKey)) { stateSeen.add(e.stateKey); stateOrder.push(e.state); }
      if (!citySeen.has(e.cityKey)) { citySeen.add(e.cityKey); cityOrder.push(e.city); }
    }

    // Initialize maps with every state/city 
    const stateMap = {};
    for (const s of stateOrder) stateMap[s] = 0;
    const cityMap = {};
    for (const c of cityOrder) cityMap[c] = 0;

    // Count bookings by extracting city/state 
    for (const b of bookings || []) {
      const raw =
        (b.customer && (b.customer.location || b.customer.customerLocation)) ||
        b.location ||
        b.customerLocation ||
        "";

      const { city: bkCity, state: bkState } = extractCityState(String(raw || ""));
      const bkCityKey = normalize(bkCity || "Unknown");
      const bkStateKey = normalize(bkState || "Unknown");

      let matchedState = null;
      for (const e of locationEntries) {
        if (e.stateKey === bkStateKey) {
          matchedState = e.state; 
          break;
        }
      }
      if (!matchedState && stateOrder.length > 0) {
        const found = stateOrder.find(s => normalize(s) === bkStateKey);
        if (found) matchedState = found;
      }
      if (!matchedState) matchedState = "Unknown";
      if (stateMap[matchedState] === undefined) stateMap[matchedState] = 0;
      stateMap[matchedState]++;

      let matchedCity = null;
      for (const e of locationEntries) {
        if (e.cityKey === bkCityKey) {
          matchedCity = e.city;
          break;
        }
      }
      if (!matchedCity && cityOrder.length > 0) {
        const foundCity = cityOrder.find(c => normalize(c) === bkCityKey);
        if (foundCity) matchedCity = foundCity;
      }
      if (!matchedCity) matchedCity = "Unknown";
      if (cityMap[matchedCity] === undefined) cityMap[matchedCity] = 0;
      cityMap[matchedCity]++;
    }

    const statesArray = stateOrder.map(s => ({ name: s, value: stateMap[s] || 0 }));
    const citiesArray = cityOrder.map(c => ({ name: c, value: cityMap[c] || 0 }));

    return locLevel === "state" ? statesArray : citiesArray;
  }, [bookings, locationEntries, locLevel]);

  // ---------- 4) Total bookings line ----------
  const [rangeMode, setRangeMode] = useState("year");
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());

  const availableYears = useMemo(() => {
    const years = new Set();
    for (const b of bookings || []) {
      const d = resolveDate(b);
      if (!d) continue;
      years.add(d.getFullYear());
    }
    years.add(new Date().getFullYear());
    return Array.from(years).sort((a,b)=>b-a);
  }, [bookings]);

  const monthsData = useMemo(() => {
    const now = new Date();
    let start, end;
    if (rangeMode === "year") {
      start = new Date(selectedYear, 0, 1);
      end = new Date(selectedYear, 12, 1);
    } else if (rangeMode === "last6") {
      end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      start = new Date(end.getFullYear(), end.getMonth() - 6 , 1);
    } else { // last3
      end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      start = new Date(end.getFullYear(), end.getMonth() - 3 , 1);
    }

    const months = [];
    const cur = new Date(start.getFullYear(), start.getMonth(), 1);
    while (cur < end) {
      months.push(new Date(cur.getFullYear(), cur.getMonth(), 1));
      cur.setMonth(cur.getMonth() + 1);
    }
    const labels = months.map((d) => d.toLocaleString(undefined, { month: "short" }).toLowerCase());
    const counts = new Array(months.length).fill(0);

    for (const b of bookings || []) {
      const d = resolveDate(b);
      if (!d) continue;
      for (let i = 0; i < months.length; i++) {
        const s = new Date(months[i].getFullYear(), months[i].getMonth(), 1);
        const e = new Date(s.getFullYear(), s.getMonth() + 1, 1);
        if (d >= s && d < e) {
          counts[i]++;
          break;
        }
      }
    }
    return labels.map((m, idx) => ({ month: m, count: counts[idx] }));
  }, [bookings, rangeMode, selectedYear]);

  return (
    <div className="admin-charts-root">
      <div className="charts-grid">
        {/* Bar chart card */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h3 className="chart-title">Most booked services</h3>
          </div>
          <div className="chart-body centered-chart">
            {categoriesData.length === 0 ? (
              <div className="empty">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoriesData} margin={{ top: 8, right: 20, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" axisLine={false} tick={false} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} axisLine={false} />
                  <ReTooltip formatter={(value, name, props) => [value, props && props.payload && props.payload.name]} />
                  <Bar dataKey="value" fill={PALETTE[0]} barSize={48} radius={[6,6,0,0]} label={(props)=><SafeBarLabel {...props} />} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Providers pie + left legend */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h3 className="chart-title">Top providers</h3>
          </div>
          <div className="chart-body split-chart">
            <div className="legend-col">
              {providersData.map((p, i) => (
                <div className="legend-row" key={p.name}>
                  <span className="legend-color" style={{ background: PALETTE[i % PALETTE.length] }} />
                  <span className="legend-label">{p.name}</span>
                </div>
              ))}
            </div>
            <div className="chart-col">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={providersData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={45} paddingAngle={2} >
                    {providersData.map((entry, idx) => (
                      <Cell key={`prov-${idx}`} fill={PALETTE[idx % PALETTE.length]} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, name, props) => [v, props && props.payload && props.payload.name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Location pie + left legend */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h3 className="chart-title">Location trends</h3>
            <div className="loc-controls">
              <select value={locLevel} onChange={(e) => setLocLevel(e.target.value)}>
                <option value="state">State</option>
                <option value="city">City</option>
              </select>
            </div>
          </div>

          <div className="chart-body split-chart">
            {(() => {
              const visibleLocationData = (locationData || []).filter(l => Number(l.value) > 0);

              return (
                <>
                  <div className="legend-col">
                    {visibleLocationData.length === 0 ? (
                      <div className="empty">No locations to show</div>
                    ) : (
                      visibleLocationData.map((l, i) => (
                        <div className="legend-row" key={l.name || i}>
                          <span className="legend-color" style={{ background: PALETTE[i % PALETTE.length] }} />
                          <span className="legend-label">{l.name}</span>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="chart-col">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={visibleLocationData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          innerRadius={36}
                          paddingAngle={2}
                        >
                          {visibleLocationData.map((entry, idx) => (
                            <Cell key={`loc-${idx}`} fill={PALETTE[idx % PALETTE.length]} stroke="transparent" />
                          ))}
                        </Pie>

                        <Tooltip
                          formatter={(v, name, props) => {
                            const nm = props && props.payload && props.payload.name;
                            return [v, nm];
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        {/* Line chart */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h3 className="chart-title">Total bookings</h3>
            <div className="line-controls">
              <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
                {availableYears.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
              <select value={rangeMode} onChange={(e) => setRangeMode(e.target.value)}>
                <option value="year">Year (Jan–Dec)</option>
                <option value="last6">Last 6 months</option>
                <option value="last3">Last 3 months</option>
              </select>
            </div>
          </div>

          <div className="chart-body centered-chart">
            <div className="line-top-right">Year: {selectedYear}</div>
            {monthsData.length === 0 ? (
              <div className="empty">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthsData} margin={{ top: 8, right: 18, left: 8, bottom: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke={PALETTE[1]} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCharts;