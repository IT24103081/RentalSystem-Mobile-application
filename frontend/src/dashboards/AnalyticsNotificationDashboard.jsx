import { useState, useEffect, useCallback } from "react";
import { Bar, Pie } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, Title } from "chart.js";
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, Title);

const API_URL = import.meta.env.VITE_API_URL ?? "";

const apiRequest = async (path, options = {}) => {
  const token = localStorage.getItem("rental_auth_token");
  const baseHeaders = { "Content-Type": "application/json" };
  if (token) baseHeaders.Authorization = `Bearer ${token}`;
  const { headers: optionHeaders, ...rest } = options;
  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: { ...baseHeaders, ...(optionHeaders || {}) }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || "Request failed");
  return payload;
};

const fmt = (v) =>
  new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 0 }).format(Number(v) || 0);

const downloadFile = async (path, filename) => {
  const token = localStorage.getItem("rental_auth_token");
  const res = await fetch(`${API_URL}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
};

/* ── Phone validation helper ────────────────────────────────────────────────── */
const validatePhone = (v) => {
  if (!v) return "Phone number is required";
  if (!/^\d+$/.test(v)) return "Only numbers allowed";
  if (v.length !== 10) return "Must be exactly 10 digits";
  return "";
};
const onlyDigits = (e) => { if (!/[0-9]/.test(e.key) && e.key.length===1) e.preventDefault(); };

/* ── SMS Send Modal ─────────────────────────────────────────────────────────── */
function SendSmsModal({ notification, onClose, onSuccess }) {
  const [phone, setPhone] = useState(notification.phone || "");
  const [message, setMessage] = useState(notification.message || "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const phoneErr = phone ? validatePhone(phone) : "";

  const handleSend = async (e) => {
    e.preventDefault();
    const err = validatePhone(phone);
    if (err) { setResult({ ok:false, msg:err }); return; }
    setLoading(true); setResult(null);
    try {
      const data = await apiRequest(`/api/notifications/${notification._id}/send`, {
        method: "POST",
        body: JSON.stringify({ phone, message })
      });
      setResult({ ok: true, msg: data.message || "SMS sent!" });
      setTimeout(() => { onSuccess(); onClose(); }, 1500);
    } catch (err) {
      setResult({ ok: false, msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div onClick={onClose} style={{ position:"fixed",inset:0,background:"rgba(9,22,37,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:"var(--surface,#fff)",padding:24,borderRadius:12,width:"90%",maxWidth:480 }}>
        <h3 style={{ marginTop:0 }}>Send SMS</h3>
        <div style={{ background:"var(--surface-soft,#f1f5f9)",padding:10,borderRadius:8,marginBottom:12,fontSize:13 }}>
          <strong>{notification.title}</strong> &mdash; Type: {notification.type}
        </div>
        {result && (
          <p style={{ padding:"8px 12px",borderRadius:6,background:result.ok?"#dcfce7":"#fee2e2",color:result.ok?"#166534":"#991b1b",marginBottom:10 }}>
            {result.ok ? "✅" : "❌"} {result.msg}
          </p>
        )}
        <form onSubmit={handleSend} style={{ display:"grid",gap:10 }}>
          <div>
            <input
              placeholder="Phone Number (10 digits, e.g. 0771234567)"
              value={phone}
              onChange={e=>setPhone(e.target.value.replace(/\D/g,"").slice(0,10))}
              onKeyDown={onlyDigits}
              inputMode="numeric"
              maxLength={10}
              required
              style={{ padding:"8px 12px",borderRadius:6,border:`1px solid ${phoneErr?"#dc2626":"#cbd5e1"}`,fontSize:14,width:"100%",boxSizing:"border-box" }}
            />
            {phoneErr && <p style={{ margin:"4px 0 0",fontSize:12,color:"#dc2626" }}>{phoneErr} ({phone.length}/10)</p>}
            {!phoneErr && phone.length===10 && <p style={{ margin:"4px 0 0",fontSize:12,color:"#16a34a" }}>✓ Valid number</p>}
          </div>
          <textarea
            value={message}
            onChange={e=>setMessage(e.target.value)}
            placeholder="SMS message…"
            rows={4}
            required
            style={{ padding:"8px 12px",borderRadius:6,border:"1px solid #cbd5e1",fontSize:14,resize:"vertical" }}
          />
          <div style={{ display:"flex",gap:8 }}>
            <button type="submit" disabled={loading||!!phoneErr} style={{ flex:1,padding:"10px",borderRadius:6,background:"#2563eb",color:"#fff",border:"none",fontWeight:600,cursor:phoneErr?"not-allowed":"pointer",opacity:phoneErr?0.6:1 }}>
              {loading ? "Sending…" : "Send SMS"}
            </button>
            <button type="button" onClick={onClose} style={{ flex:1,padding:"10px",borderRadius:6,background:"#64748b",color:"#fff",border:"none",cursor:"pointer" }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Return Reminder Panel ──────────────────────────────────────────────────── */
function ReturnReminderPanel({ onSent }) {
  const [days, setDays] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSend = async () => {
    setLoading(true); setResult(null);
    try {
      const data = await apiRequest("/api/notifications/send-return-reminders", {
        method: "POST",
        body: JSON.stringify({ daysBeforeDue: Number(days) })
      });
      setResult({ ok: true, msg: `Sent: ${data.sent}  Failed: ${data.failed}  Total orders: ${data.total}` });
      onSent();
    } catch (err) {
      setResult({ ok: false, msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel" style={{ marginBottom:0 }}>
      <h4 style={{ marginTop:0,color:"#1d4ed8" }}>Automated Return Reminders</h4>
      <p style={{ fontSize:13,color:"#64748b",marginBottom:12 }}>
        Send SMS reminders to all customers whose rentals are due in the selected number of days.
      </p>
      <div style={{ display:"flex",gap:12,alignItems:"center",flexWrap:"wrap" }}>
        <label style={{ fontSize:13,fontWeight:600 }}>Days before due date:</label>
        <select value={days} onChange={e=>setDays(e.target.value)} style={{ padding:"6px 10px",borderRadius:6,border:"1px solid #cbd5e1" }}>
          {[-1,0,1,2,3].map(d=>(
            <option key={d} value={d}>
              {d<0?"Overdue (send now)":d===0?"Today (due date)":`${d} day(s) before`}
            </option>
          ))}
        </select>
        <button onClick={handleSend} disabled={loading} style={{ padding:"8px 18px",borderRadius:6,background:"#2563eb",color:"#fff",border:"none",fontWeight:600,cursor:"pointer" }}>
          {loading ? "Sending…" : "Send Reminders"}
        </button>
      </div>
      {result && (
        <p style={{ marginTop:10,padding:"8px 12px",borderRadius:6,background:result.ok?"#dcfce7":"#fee2e2",color:result.ok?"#166534":"#991b1b",fontSize:13 }}>
          {result.ok ? "" : ""} {result.msg}
        </p>
      )}
    </div>
  );
}

/* ── Status Badge ───────────────────────────────────────────────────────────── */
const SmsBadge = ({ status }) => {
  const map = { sent:["#dcfce7","#166534","Sent"], failed:["#fee2e2","#991b1b","Failed"], pending:["#fef9c3","#854d0e","Pending"] };
  const [bg,col,label] = map[status] || map.pending;
  return <span style={{ background:bg,color:col,padding:"2px 8px",borderRadius:12,fontSize:11,fontWeight:600 }}>{label}</span>;
};

/* ── KPI Card ───────────────────────────────────────────────────────────────── */
const KpiCard = ({ label, value, sub, accent="#2563eb" }) => (
  <div style={{ background:"#fff",borderRadius:12,padding:"18px 20px",boxShadow:"0 1px 4px rgba(0,0,0,.08)",borderLeft:`4px solid ${accent}` }}>
    <div style={{ fontSize:22,fontWeight:700,color:"#0f172a" }}>{value}</div>
    <div style={{ fontSize:12,color:"#64748b",marginTop:4,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.5px" }}>{label}</div>
    {sub && <div style={{ fontSize:11,color:"#94a3b8",marginTop:4 }}>{sub}</div>}
  </div>
);

/* ── Bar Chart — Item Earnings ───────────────────────────────────────────────── */
function EarningsBarChart({ data }) {
  const top = data.slice(0,10);
  if (!top.length) return null;
  const chartData = {
    labels: top.map(r=>(r.itemName||"Unknown").length>18?(r.itemName||"Unknown").slice(0,16)+"…":(r.itemName||"Unknown")),
    datasets: [{ label:"Revenue (LKR)", data:top.map(r=>r.totalRevenue),
      backgroundColor:["#2563eb","#3b82f6","#60a5fa","#93c5fd","#1d4ed8","#1e40af","#0891b2","#06b6d4","#0e7490","#155e75"],
      borderRadius:6, borderSkipped:false }]
  };
  const opts = { responsive:true, plugins:{ legend:{display:false}, title:{display:true,text:"Top 10 Items by Revenue",font:{size:14},color:"#1e293b"} }, scales:{ y:{ beginAtZero:true, ticks:{callback:v=>"LKR "+v.toLocaleString()},grid:{color:"#f1f5f9"} }, x:{grid:{display:false},ticks:{font:{size:11}}} } };
  return <Bar data={chartData} options={opts} />;
}

/* ── Pie Chart — Stock Status ────────────────────────────────────────────────── */
function StockPieChart({ totals }) {
  if (!totals || !totals.totalQty) return null;
  const chartData = {
    labels:["Available","Rented"],
    datasets:[{ data:[totals.available||0, totals.rented||0],
      backgroundColor:["#16a34a","#dc2626"], hoverBackgroundColor:["#15803d","#b91c1c"],
      borderWidth:2, borderColor:"#fff" }]
  };
  const opts = { responsive:true, plugins:{ legend:{position:"bottom",labels:{font:{size:12},padding:16}}, title:{display:true,text:"Stock Distribution",font:{size:14},color:"#1e293b"} } };
  return <Pie data={chartData} options={opts} />;
}

/* ── Bar Chart — Location Stock ──────────────────────────────────────────────── */
function LocationBarChart({ data }) {
  if (!data.length) return null;
  const chartData = {
    labels: data.map(r=>r.locationName),
    datasets:[
      { label:"Available", data:data.map(r=>r.available), backgroundColor:"#16a34a", borderRadius:4 },
      { label:"Rented",    data:data.map(r=>r.rented),    backgroundColor:"#dc2626", borderRadius:4 }
    ]
  };
  const opts = { responsive:true, plugins:{ legend:{position:"top"}, title:{display:true,text:"Stock by Location",font:{size:14},color:"#1e293b"} }, scales:{ x:{stacked:false,grid:{display:false}}, y:{beginAtZero:true,grid:{color:"#f1f5f9"}} } };
  return <Bar data={chartData} options={opts} />;
}

/* ── Analytics Section ──────────────────────────────────────────────────────── */
function AnalyticsSection({ analytics, alertStats, formatLkr }) {
  const [itemEarnings, setItemEarnings] = useState([]);
  const [locationStock, setLocationStock] = useState([]);
  const [overdueData, setOverdueData] = useState({ totalOverdue:0, flat:[] });
  const [stockStatus, setStockStatus] = useState({ items:[], totals:{} });
  const [activeTab, setActiveTab] = useState("earnings");
  const [exporting, setExporting] = useState("");

  const loadReports = useCallback(async () => {
    try {
      const [e, l, o, s] = await Promise.allSettled([
        apiRequest("/api/analytics/item-earnings"),
        apiRequest("/api/analytics/location-stock"),
        apiRequest("/api/analytics/overdue-items"),
        apiRequest("/api/analytics/stock-status")
      ]);
      if (e.status==="fulfilled") setItemEarnings(e.value);
      if (l.status==="fulfilled") setLocationStock(l.value);
      if (o.status==="fulfilled") setOverdueData(o.value);
      if (s.status==="fulfilled") setStockStatus(s.value);
    } catch(_){}
  }, []);

  useEffect(() => { loadReports(); }, [loadReports]);

  const doExport = async (type, ext) => {
    setExporting(type);
    try {
      const reportMap = { earnings:"item-earnings", location:"location-stock", overdue:"overdue", stock:"stock-status" };
      const r = reportMap[activeTab] || "summary";
      await downloadFile(`/api/analytics/export/${ext}?report=${r}`, `rental-${r}.${ext}`);
    } catch(err){ alert("Export failed: "+err.message); }
    setExporting("");
  };

  const tabs = [
    { key:"earnings", label:"Item Earnings" },
    { key:"location", label:"Location Stock" },
    { key:"overdue",  label:"Overdue Items" },
    { key:"stock",    label:"Stock Status" }
  ];

  return (
    <div>
      {/* KPI Row */}
      <div className="analytics-kpi-grid">
        <KpiCard label="Total Orders" value={analytics.totalRentalOrders} accent="#2563eb"/>
        <KpiCard label="Total Income" value={formatLkr(analytics.totalIncome)} accent="#16a34a"/>
        <KpiCard label="Overdue Rentals" value={overdueData.totalOverdue||analytics.overdueCount} accent="#dc2626"/>
        <KpiCard label="New Today" value={alertStats.newOrdersToday} accent="#7c3aed"/>
        <KpiCard label="Items Available" value={stockStatus.totals?.available??"-"} sub={`of ${stockStatus.totals?.totalQty??0} total`} accent="#0891b2"/>
      </div>

      {/* Charts Row */}
      <div className="analytics-chart-grid">
        <div className="panel analytics-chart-panel">
          <EarningsBarChart data={itemEarnings} />
          {!itemEarnings.length && <p style={{textAlign:"center",color:"#94a3b8",fontSize:13}}>No earnings data yet</p>}
        </div>
        <div className="panel analytics-chart-panel analytics-chart-panel-center">
          <StockPieChart totals={stockStatus.totals} />
          {!stockStatus.totals?.totalQty && <p style={{textAlign:"center",color:"#94a3b8",fontSize:13}}>No stock data yet</p>}
        </div>
        <div className="panel analytics-chart-panel">
          <LocationBarChart data={locationStock} />
          {!locationStock.length && <p style={{textAlign:"center",color:"#94a3b8",fontSize:13}}>No location data yet</p>}
        </div>
      </div>

      {/* Export Buttons */}
      <div className="analytics-export-bar">
        <span className="analytics-export-label">Export:</span>
        <button className="analytics-export-btn analytics-export-btn-pdf" onClick={()=>doExport("pdf","pdf")} disabled={!!exporting}>
          {exporting==="pdf"?"…":"📄 PDF"}
        </button>
        <button className="analytics-export-btn analytics-export-btn-csv" onClick={()=>doExport("csv","csv")} disabled={!!exporting}>
          {exporting==="csv"?"…":"📊 CSV / Excel"}
        </button>
      </div>

      {/* Tab Bar */}
      <div className="analytics-tab-bar">
        {tabs.map(t=>(
          <button
            key={t.key}
            className={`analytics-tab-btn ${activeTab===t.key ? "active" : ""}`}
            onClick={()=>setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="panel" style={{ padding:0,overflow:"hidden" }}>
        {activeTab==="earnings" && (
          <div className="table-wrap">
            <table>
              <thead><tr><th>#</th><th>Item Name</th><th>Total Revenue</th><th>Rental Count</th></tr></thead>
              <tbody>
                {itemEarnings.length===0 && <tr><td colSpan={4} style={{textAlign:"center",color:"#94a3b8",padding:20}}>No earnings data</td></tr>}
                {itemEarnings.map((r,i)=>(
                  <tr key={i}>
                    <td style={{color:"#94a3b8"}}>{i+1}</td>
                    <td style={{fontWeight:600}}>{r.itemName||"Unknown"}</td>
                    <td style={{color:"#16a34a",fontWeight:600}}>{fmt(r.totalRevenue)}</td>
                    <td>{r.rentalCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab==="location" && (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Location</th><th>Type</th><th>Total Items</th><th>Rented</th><th>Available</th></tr></thead>
              <tbody>
                {locationStock.length===0 && <tr><td colSpan={5} style={{textAlign:"center",color:"#94a3b8",padding:20}}>No location data</td></tr>}
                {locationStock.map((r,i)=>(
                  <tr key={i}>
                    <td style={{fontWeight:600}}>{r.locationName}</td>
                    <td><span style={{background:r.locationType==="warehouse"?"#dbeafe":"#dcfce7",color:r.locationType==="warehouse"?"#1e40af":"#166534",padding:"2px 8px",borderRadius:12,fontSize:12}}>{r.locationType}</span></td>
                    <td>{r.totalItems}</td>
                    <td style={{color:"#dc2626"}}>{r.rented}</td>
                    <td style={{color:"#16a34a",fontWeight:600}}>{r.available}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab==="overdue" && (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Customer</th><th>Phone</th><th>Items</th><th>Due Date</th><th>Days Overdue</th><th>Balance</th></tr></thead>
              <tbody>
                {overdueData.flat?.length===0 && <tr><td colSpan={6} style={{textAlign:"center",color:"#94a3b8",padding:20}}>No overdue items 🎉</td></tr>}
                {(overdueData.flat||[]).map((r,i)=>(
                  <tr key={i}>
                    <td style={{fontWeight:600}}>{r.customerName}</td>
                    <td style={{fontSize:13,color:"#64748b"}}>{r.phone}</td>
                    <td style={{fontSize:13}}>{r.itemsSummary}</td>
                    <td style={{fontSize:13}}>{new Date(r.returnDate).toLocaleDateString("en-LK")}</td>
                    <td><span style={{background:"#fee2e2",color:"#991b1b",padding:"2px 8px",borderRadius:12,fontSize:12,fontWeight:700}}>{r.daysOverdue}d</span></td>
                    <td style={{color:"#dc2626",fontWeight:600}}>{fmt(r.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab==="stock" && (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Item Name</th><th>Total Qty</th><th>Rented</th><th>Available</th><th>Price/Day</th><th>Utilization</th></tr></thead>
              <tbody>
                {(stockStatus.items||[]).length===0 && <tr><td colSpan={6} style={{textAlign:"center",color:"#94a3b8",padding:20}}>No stock data</td></tr>}
                {(stockStatus.items||[]).map((r,i)=>(
                  <tr key={i}>
                    <td style={{fontWeight:600}}>{r.itemName}</td>
                    <td>{r.totalQty}</td>
                    <td style={{color:"#dc2626"}}>{r.rented}</td>
                    <td style={{color:"#16a34a",fontWeight:600}}>{r.available}</td>
                    <td style={{color:"#64748b"}}>{fmt(r.pricePerDay)}</td>
                    <td>
                      <div className="analytics-utilization-row">
                        <div className="analytics-utilization-track">
                          <div
                            className="analytics-utilization-fill"
                            style={{
                              width:`${r.utilizationRate}%`,
                              background:r.utilizationRate>80?"#dc2626":r.utilizationRate>50?"#f59e0b":"#16a34a"
                            }}
                          />
                        </div>
                        <span className="analytics-utilization-label">{r.utilizationRate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              {stockStatus.totals?.totalQty>0 && (
                <tfoot>
                  <tr style={{fontWeight:700,background:"#f8fafc"}}>
                    <td>TOTAL</td>
                    <td>{stockStatus.totals.totalQty}</td>
                    <td style={{color:"#dc2626"}}>{stockStatus.totals.rented}</td>
                    <td style={{color:"#16a34a"}}>{stockStatus.totals.available}</td>
                    <td colSpan={2}/>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main Dashboard ─────────────────────────────────────────────────────────── */
function AnalyticsNotificationDashboard({
  notificationForm,
  setNotificationForm,
  onCreateNotification,
  notifications,
  onDeleteNotification,
  analytics,
  alertStats,
  formatLkr,
  activeSection
}) {
  const [sendingSmsFor, setSendingSmsFor] = useState(null);
  const selectedSection = activeSection || "notifications";

  return (
    <div className="admin-dashboard">
      <main className="admin-content">
        {/* ── SMS / Notifications Tab ── */}
        {selectedSection === "notifications" && (
          <>
            <ReturnReminderPanel onSent={() => {}} />

            <form className="panel form-grid" onSubmit={onCreateNotification} style={{ marginTop:16 }}>
              <h3 style={{ marginTop:0 }}>New Notification</h3>
              <input
                placeholder="Title"
                value={notificationForm.title}
                onChange={e => setNotificationForm(c=>({...c,title:e.target.value}))}
                required
              />
              <textarea
                placeholder="Message"
                value={notificationForm.message}
                onChange={e => setNotificationForm(c=>({...c,message:e.target.value}))}
                required
              />
              <div>
                <input
                  placeholder="Phone Number (10 digits, optional)"
                  value={notificationForm.phone||""}
                  onChange={e => setNotificationForm(c=>({...c,phone:e.target.value.replace(/\D/g,"").slice(0,10)}))}
                  onKeyDown={onlyDigits}
                  inputMode="numeric"
                  maxLength={10}
                  style={{ padding:"8px 12px",borderRadius:6,border:`1px solid ${notificationForm.phone&&validatePhone(notificationForm.phone)?"#dc2626":"#cbd5e1"}`,fontSize:14,width:"100%",boxSizing:"border-box" }}
                />
                {notificationForm.phone && validatePhone(notificationForm.phone) && (
                  <p style={{ margin:"4px 0 0",fontSize:12,color:"#dc2626" }}>{validatePhone(notificationForm.phone)} ({(notificationForm.phone||'').length}/10)</p>
                )}
                {notificationForm.phone && !validatePhone(notificationForm.phone) && (
                  <p style={{ margin:"4px 0 0",fontSize:12,color:"#16a34a" }}>✓ Valid number</p>
                )}
              </div>
              <select value={notificationForm.type} onChange={e=>setNotificationForm(c=>({...c,type:e.target.value}))}>
                <option value="sms">SMS</option>
                <option value="alert">Alert</option>
              </select>
              <button type="submit">Save Notification</button>
            </form>

            <section className="panel">
              <h3>Notification Queue</h3>
              <style>{`
                @media (max-width:780px){ .desktop-only { display:none; } }
                @media (min-width:781px){ .mobile-notifs{ display:none; } }
                .notif-card{ border:1px solid var(--line); border-radius:8px; padding:12px; margin:8px 0; background:var(--panel-bg,#fff); }
                .notif-card .row{ display:flex; justify-content:space-between; gap:12px; margin:6px 0 }
                .notif-card .label{ color:var(--text-muted); font-size:12px; width:35% }
                .notif-card .value{ width:65%; font-weight:600 }
              `}</style>

              <div className="desktop-only table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Message</th>
                      <th>Type</th>
                      <th>Phone</th>
                      <th>Status</th>
                      <th>Sent At</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notifications.length===0 && (
                      <tr><td colSpan={7} style={{textAlign:"center",color:"#94a3b8",padding:20}}>No notifications yet</td></tr>
                    )}
                    {notifications.map(n=>(
                      <tr key={n._id}>
                        <td style={{fontWeight:600}}>{n.title}</td>
                        <td className="analytics-notification-message">{n.message}</td>
                        <td>{n.type}</td>
                        <td style={{fontSize:13,color:"#64748b"}}>{n.phone||"—"}</td>
                        <td><SmsBadge status={n.smsStatus||"pending"}/></td>
                        <td style={{fontSize:12,color:"#64748b"}}>{n.sentAt?new Date(n.sentAt).toLocaleString():"Not sent"}</td>
                        <td>
                          <div className="button-group">
                            <button onClick={()=>setSendingSmsFor(n)}>Send SMS</button>
                            <button className="danger" onClick={()=>onDeleteNotification(n._id)}>Remove</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mobile-notifs">
                {notifications.length===0 && <p className="note-text">No notifications yet</p>}
                {notifications.map(n => (
                  <article key={n._id} className="notif-card">
                    <div className="row"><div className="label">Title</div><div className="value">{n.title}</div></div>
                    <div className="row"><div className="label">Message</div><div className="value" style={{fontWeight:400}}>{n.message}</div></div>
                    <div className="row"><div className="label">Type</div><div className="value">{n.type}</div></div>
                    <div className="row"><div className="label">Phone</div><div className="value">{n.phone||'—'}</div></div>
                    <div className="row"><div className="label">Status</div><div className="value"><SmsBadge status={n.smsStatus||'pending'} /></div></div>
                    <div className="row"><div className="label">Sent At</div><div className="value">{n.sentAt?new Date(n.sentAt).toLocaleString():'Not sent'}</div></div>
                    <div style={{ marginTop:8, display:'flex', gap:8 }}>
                      <button onClick={()=>setSendingSmsFor(n)}>Send SMS</button>
                      <button className="danger" onClick={()=>onDeleteNotification(n._id)}>Remove</button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}

        {/* ── Analytics Tab ── */}
        {selectedSection === "analytics" && (
          <AnalyticsSection analytics={analytics} alertStats={alertStats} formatLkr={formatLkr} />
        )}

        {sendingSmsFor && (
          <SendSmsModal
            notification={sendingSmsFor}
            onClose={()=>setSendingSmsFor(null)}
            onSuccess={()=>setSendingSmsFor(null)}
          />
        )}
      </main>
    </div>
  );
}

export default AnalyticsNotificationDashboard;
