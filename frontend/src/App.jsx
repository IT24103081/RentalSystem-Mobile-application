import { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  validateCustomerName,
  validatePhoneNumber,
  validateUsername,
  validatePassword,
  validateQuantity,
  validatePrice,
  validateAddress,
  validateWarehouseName,
  validateCode,
  formatPhoneNumber
} from "./utils/validators.js";
import LogisticsDashboard from "./dashboards/LogisticsDashboard";
import AdminDashboard from "./dashboards/AdminDashboard";
import AnalyticsNotificationDashboard from "./dashboards/AnalyticsNotificationDashboard";
import RentalProcessingDashboard from "./dashboards/RentalProcessingDashboard";

const API_URL = import.meta.env.VITE_API_URL ?? "";

const INVENTORY_IMAGE_MAP = {
  'Angle Grinder 4"': "images/tools images/Angle Grinder 4.jpg",
  'Angle Grinder 4.5"': "images/tools images/Angle Grinder 4-0.5.jpg",
  'Angle Grinder 7"': "images/tools images/Angle Grinder 7.jpg",
  'Angle Grinder 7" Heavy Duty': "images/tools images/Angle Grinder 7.jpg",
  'Drill Machine': "images/tools images/Drill Machine.jpg",
  'Re-Chargeable Drill': "images/tools images/Re- Chargeable Drill.jpeg",
  'Hiltty (Hammer Drill)': "images/tools images/Hiltty (Hammer Drill).jpg",
  'Breaker 5 KG': "images/tools images/Breker 5 KG.jpg",
  'Demolizer': "images/tools images/Demolizer.jpg",
  'Putty Mixer': "images/tools images/Putty Mixer.jpg",
  'Circular Saw': "images/tools images/Circuller Saw.jpg",
  'Marble Cutter': "images/tools images/Marble Cutter.jpg",
  'Sander 4"': "images/tools images/Sander 4.jpg",
  'Sander': "images/tools images/Sander.jpg",
  'Orbital Sander': "images/tools images/orbital sander.jpg",
  'Mitre Saw': "images/tools images/Mitre Saw.jpg",
  'Cut-off Saw': "images/tools images/Cut- off - Saw.jpg",
  'Jig Saw': "images/tools images/Jig Saw.jpg",
  'Router': "images/tools images/Router.jpg",
  'Planer': "images/tools images/Planer.jpg",
  'Electric Poker': "images/tools images/Electric Poker.jpg",
  'Blower': "images/tools images/Blower.jpg",
  'High Pressure Washer Small': "images/tools images/High Pressure Washer Smoll.jpg",
  'High Pressure Washer Medium': "images/tools images/High Pressure Washer Medium.jpg",
  'High Pressure Washer Heavy': "images/tools images/High Pressure Washer Havy.jpg",
  'Air Compressor': "images/tools images/Air Compressure.jpg",
  'Arc Welding Plant': "images/tools images/Arc Welding Plant.jpg",
  'Mig Welding Plant': "images/tools images/Mig Welding Plant.jpg",
  'Tig Welding Plant': "images/tools images/Tig Welding Plant .jpg",
  'Car Polisher': "images/tools images/Car Polisher.jpg",
  'Car polisher': "images/tools images/Car Polisher.jpg",
  'Chainsaw': "images/tools images/chainsaw.jpg",
  'Vacume Cleaner 20 L': "images/tools images/Vacume Cleaner 20 L.jpg",
  'Vacume Cleaner 30 L': "images/tools images/Vacume Cleaner 30 L.jpg",
  'Vacume Cleaner 50 L': "images/tools images/Vacume Cleaner 50 L.jpg"
};

const getInventoryImageSrc = (item) => {
  const imagePath = INVENTORY_IMAGE_MAP[item?.name];
  if (imagePath) {
    return `/${encodeURI(imagePath)}`;
  }

  if (item?.imageUrl) {
    return `${API_URL}${item.imageUrl}`;
  }

  return null;
};

const NAV_ITEMS = [
  { key: "warehouse-items", label: "Warehouse Inventory", roles: ["warehouse"] },
  { key: "warehouse-orders", label: "Warehouse Orders", roles: ["warehouse"] },
  { key: "warehouse-request-items", label: "Request Items", roles: ["warehouse"] },
  { key: "shop-items", label: "Shop Inventory", roles: ["shop"] },
  { key: "shop-orders", label: "Shop Orders", roles: ["shop"] },
  { key: "shop-request-items", label: "Request Items", roles: ["shop"] },
  { key: "logistics-new-request", label: "New Request", roles: ["logistics"] },
  { key: "logistics-requests", label: "Logistics Requests", roles: ["logistics"] },
  { key: "logistics-audit", label: "Audit Log", roles: ["logistics"] },
  { key: "admin-new-warehouse", label: "New Warehouse", roles: ["admin"] },
  { key: "admin-warehouses", label: "Warehouses and Shops", roles: ["admin"] },
  { key: "admin-new-staff", label: "New Staff Account", roles: ["admin"] },
  { key: "admin-staff", label: "Staff Accounts", roles: ["admin"] },
  { key: "analytics-notifications", label: "Notifications", roles: ["analytics"] },
  { key: "analytics-reports", label: "Analytics & Reports", roles: ["analytics"] },
  { key: "rentals-finalized", label: "Finalized Orders", roles: ["rental"] },
  { key: "rentals-active", label: "Active Orders", roles: ["rental"] },
  { key: "rentals-records", label: "Rental Records", roles: ["rental"] }
];

const NAV_ITEM_ICONS = {
  "warehouse-items": "box",
  "warehouse-orders": "clipboard",
  "warehouse-request-items": "refresh",
  "shop-items": "bag",
  "shop-orders": "receipt",
  "shop-request-items": "refresh",
  "logistics-new-request": "plus-circle",
  "logistics-requests": "truck",
  "logistics-audit": "shield-check",
  "admin-new-warehouse": "building",
  "admin-warehouses": "layers",
  "admin-new-staff": "user-plus",
  "admin-staff": "users",
  "analytics-notifications": "bell",
  "analytics-reports": "chart",
  "rentals-finalized": "check-circle",
  "rentals-active": "clock",
  "rentals-records": "book"
};

const NAV_ITEM_SHORT_LABELS = {
  "warehouse-items": "Inventory",
  "warehouse-orders": "Orders",
  "warehouse-request-items": "Requests",
  "shop-items": "Shop",
  "shop-orders": "Shop Orders",
  "shop-request-items": "Requests",
  "logistics-new-request": "New",
  "logistics-requests": "Logistics",
  "logistics-audit": "Audit",
  "admin-new-warehouse": "Warehouse",
  "admin-warehouses": "Locations",
  "admin-new-staff": "Add Staff",
  "admin-staff": "Staff",
  "analytics-notifications": "Notify",
  "analytics-reports": "Analytics",
  "rentals-finalized": "Done",
  "rentals-active": "Active",
  "rentals-records": "Records"
};

const NAV_ICON_PATHS = {
  box: ["M20 7.5 12 3 4 7.5m16 0-8 4.5m8-4.5v9L12 21m0-9L4 7.5m8 4.5v9m0-9 8-4.5M12 12 4 7.5"],
  clipboard: ["M9 4.75h6m-7.5 3h9a2.25 2.25 0 0 1 2.25 2.25v8.5A2.25 2.25 0 0 1 16.5 20.75h-9A2.25 2.25 0 0 1 5.25 18.5V10A2.25 2.25 0 0 1 7.5 7.75Z", "M9 4.75A2.25 2.25 0 0 1 11.25 2.5h1.5A2.25 2.25 0 0 1 15 4.75v0.5H9v-0.5Z"],
  refresh: ["M3.5 12a8.5 8.5 0 0 1 14.6-6.03M20.5 12a8.5 8.5 0 0 1-14.6 6.03", "M18.1 5.97V2.75h3.15", "M5.9 18.03v3.22H2.75"],
  bag: ["M6.5 8.5h11l-0.8 10.25A2 2 0 0 1 14.7 20.5H9.3a2 2 0 0 1-1.99-1.75L6.5 8.5Z", "M9 8.5V7a3 3 0 1 1 6 0v1.5"],
  receipt: ["M7.5 3.5h9a2 2 0 0 1 2 2v14l-2.5-1.5L13.5 19.5 11 18l-2.5 1.5L6 18l-2.5 1.5v-14a2 2 0 0 1 2-2Z", "M8.5 8h7M8.5 11.5h7M8.5 15h4"],
  "plus-circle": ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z", "M12 8v8M8 12h8"],
  truck: ["M2.75 7.5h11v7h-11v-7Zm11 2.25h3.2l2.3 2.3v2.45h-5.5V9.75Z", "M7 17.25a1.75 1.75 0 1 0 0-3.5 1.75 1.75 0 0 0 0 3.5Zm9 0a1.75 1.75 0 1 0 0-3.5 1.75 1.75 0 0 0 0 3.5Z"],
  "shield-check": ["M12 3.25 5.5 5.5v4.6c0 4.25 2.6 8.2 6.5 9.65 3.9-1.45 6.5-5.4 6.5-9.65V5.5L12 3.25Z", "m9.1 11.05 1.95 1.95 3.85-3.85"],
  building: ["M5.5 20.5V4.75h8.5V20.5M14 8h4.5V20.5H14", "M8 8h1.5M8 11h1.5M8 14h1.5"],
  layers: ["m12 4.5 8 4.5-8 4.5L4 9l8-4.5Zm8 9-8 4.5-8-4.5m16-4.5v4.5"],
  "user-plus": ["M16.5 7.5h5m-2.5-2.5v5", "M9 11.5a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5Zm-5.5 8.5a5.5 5.5 0 1 1 11 0"],
  users: ["M8.25 10.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.5 1.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM3.5 19a4.75 4.75 0 1 1 9.5 0m1.75 0a4 4 0 0 1 6.75-2.85"],
  bell: ["M14.25 18a2.25 2.25 0 0 1-4.5 0m7.5-2.25H6.75c.95-.9 1.5-2.2 1.5-3.6V9a3.75 3.75 0 1 1 7.5 0v3.15c0 1.4.55 2.7 1.5 3.6Z"],
  chart: ["M5 19.5h14M7.5 16v-4m4 4V8m4 8v-6"],
  "check-circle": ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z", "m8.5 10.75-3.5 3.5-1.5-1.5"],
  clock: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z", "M12 7.5v5l3 2"],
  book: ["M5.5 4.5h9.75a2 2 0 0 1 2 2V19h-10a2 2 0 0 1-2-2V4.5Zm0 0v12.5A2 2 0 0 0 7.5 19H17"],
  logout: ["M14.5 16.5 20 12l-5.5-4.5", "M20 12H9", "M10.5 20H5.75A1.75 1.75 0 0 1 4 18.25V5.75C4 4.78 4.78 4 5.75 4h4.75"]
};

function NavIcon({ iconKey, className }) {
  const paths = NAV_ICON_PATHS[iconKey] || NAV_ICON_PATHS.box;

  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {paths.map((pathDef) => (
        <path
          key={pathDef}
          d={pathDef}
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}

const ADMIN_VIEW_TO_SECTION = {
  "admin-new-warehouse": "new-warehouse",
  "admin-warehouses": "warehouses",
  "admin-new-staff": "new-staff",
  "admin-staff": "staff"
};

const ADMIN_SECTIONS = new Set(Object.keys(ADMIN_VIEW_TO_SECTION));

const LOGISTICS_VIEW_TO_SECTION = {
  "logistics-new-request": "request-form",
  "logistics-requests": "requests",
  "logistics-audit": "audit"
};

const LOGISTICS_SECTIONS = new Set(Object.keys(LOGISTICS_VIEW_TO_SECTION));

const ANALYTICS_VIEW_TO_SECTION = {
  "analytics-notifications": "notifications",
  "analytics-reports": "analytics"
};

const ANALYTICS_SECTIONS = new Set(Object.keys(ANALYTICS_VIEW_TO_SECTION));

const RENTAL_VIEW_TO_SECTION = {
  "rentals-finalized": "finalized-orders",
  "rentals-active": "active-orders",
  "rentals-records": "records"
};

const RENTAL_SECTIONS = new Set(Object.keys(RENTAL_VIEW_TO_SECTION));

const AUTH_TOKEN_KEY = "rental_auth_token";

const ROLE_DEFAULT_VIEW = {
  warehouse: "warehouse-items",
  shop: "shop-items",
  logistics: "logistics-new-request",
  admin: "admin-new-warehouse",
  analytics: "analytics-notifications",
  rental: "rentals-finalized"
};

const apiRequest = async (path, options = {}) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const baseHeaders = {};
  
  // Only set Content-Type for non-FormData requests
  if (!(options.body instanceof FormData)) {
    baseHeaders["Content-Type"] = "application/json";
  }
  
  if (token) {
    baseHeaders.Authorization = `Bearer ${token}`;
  }

  const { headers: optionHeaders, ...requestOptions } = options;

  const response = await fetch(`${API_URL}${path}`, {
    ...requestOptions,
    headers: { ...baseHeaders, ...(optionHeaders || {}) }
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || "Request failed");
  }
  return payload;
};

const formatLkr = (value) =>
  new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0
  }).format(Number(value || 0));

const formatDateInput = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const getSettledValue = (result, fallback) =>
  result && result.status === "fulfilled" ? result.value : fallback;

function OrderForm({ source, items, onCreated }) {
  const today = formatDateInput(new Date());
  const [form, setForm] = useState({
    customerName: "",
    address: "",
    phone: "",
    itemId: "",
    quantity: 1,
    givingDate: formatDateInput(new Date()),
    returnDate: formatDateInput(new Date(Date.now() + 86400000)),
    paymentType: "full",
    paidAmount: 0
  });
  const [error, setError] = useState("");

  const selectedItem = items.find((item) => item._id === form.itemId);
  const enteredQty = Number(form.quantity || 0);
  const availableQuantity = selectedItem ? Number(selectedItem.quantity || 0) : 0;
  const exceedsStock = selectedItem ? enteredQty > availableQuantity : false;
  const estimatedTotal = selectedItem
    ? Number(selectedItem.pricePerDay) * Number(form.quantity || 1)
    : 0;

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => {
      const next = { ...current, [name]: value };
      if (name === "givingDate" && next.returnDate && next.returnDate < value) {
        next.returnDate = value;
      }
      return next;
    });
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    if (form.givingDate < today) {
      setError("Giving date cannot be in the past");
      return;
    }

    if (form.returnDate < form.givingDate) {
      setError("Return date cannot be before giving date");
      return;
    }

    if (selectedItem && Number(form.quantity) > availableQuantity) {
      setError(`Quantity cannot exceed available stock (${availableQuantity})`);
      return;
    }

    try {
      await apiRequest("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          quantity: Number(form.quantity),
          paidAmount: Number(form.paidAmount),
          orderSource: source
        })
      });

      setForm((current) => ({
        ...current,
        customerName: "",
        address: "",
        phone: "",
        itemId: "",
        quantity: 1,
        paidAmount: 0
      }));
      onCreated();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <form className="panel form-grid" onSubmit={submit}>
      <h3>{source === "warehouse" ? "Warehouse" : "Shop"} - New Rental Order</h3>
      {error ? <p className="error-text">{error}</p> : null}
      <input
        name="customerName"
        placeholder="Customer Name"
        value={form.customerName}
        onChange={onChange}
        required
      />
      <input
        name="address"
        placeholder="Street Address"
        value={form.address}
        onChange={onChange}
        required
      />
      <input
        name="phone"
        placeholder="Phone Number"
        value={form.phone}
        onChange={onChange}
        required
      />
      <select name="itemId" value={form.itemId} onChange={onChange} required>
        <option value="">Select item</option>
        {items.map((item) => (
          <option key={item._id} value={item._id}>
            {item.name} | {formatLkr(item.pricePerDay)} | Qty {item.quantity}
          </option>
        ))}
      </select>
      <p className="note-text">
        {selectedItem ? `Available quantity: ${availableQuantity}` : "Select an item to view available quantity"}
      </p>
      <input
        type="number"
        name="quantity"
        min="1"
        max={selectedItem ? selectedItem.quantity : undefined}
        value={form.quantity}
        onChange={onChange}
        required
      />
      {exceedsStock ? (
        <p className="error-text">Quantity cannot exceed available stock ({availableQuantity})</p>
      ) : null}
      <label>
        Giving Date
        <input
          type="date"
          name="givingDate"
          value={form.givingDate}
          min={today}
          onChange={onChange}
          required
        />
      </label>
      <label>
        Return Date
        <input
          type="date"
          name="returnDate"
          value={form.returnDate}
          min={form.givingDate || today}
          onChange={onChange}
          required
        />
      </label>
      <select name="paymentType" value={form.paymentType} onChange={onChange}>
        <option value="full">Full Payment</option>
        <option value="advance">Advance</option>
      </select>
           <input
          type="date"
          name="returnDate"
          value={form.returnDate}
          min={form.givingDate || today}
          onChange={onChange}
          required
        />
      <input
        type="number"
        min="0"
        name="paidAmount"
        value={form.paidAmount}
        onChange={onChange}
        disabled={form.paymentType === "full"}
      />
      <p className="note-text">Estimated daily total: {formatLkr(estimatedTotal)}</p>
      <button type="submit">Place Order</button>
    </form>
  );
}

function MultiProductOrderForm({ source, items, onCreated }) {
  const today = formatDateInput(new Date());
  const [customerInfo, setCustomerInfo] = useState({
    customerName: "",
    address: "",
    phone: ""
  });
  const [customerErrors, setCustomerErrors] = useState({});
  const [lineItems, setLineItems] = useState([]);
  const [paymentType, setPaymentType] = useState("full");
  const [paidAmount, setPaidAmount] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCustomerChange = (e) => {
    const { name, value } = e.target;
    setCustomerInfo(prev => ({ ...prev, [name]: value }));
    
    // Validate on change
    let validationError = null;
    if (name === "customerName") {
      validationError = validateCustomerName(value);
    } else if (name === "phone") {
      validationError = validatePhoneNumber(value);
    } else if (name === "address") {
      validationError = validateAddress(value);
    }

    setCustomerErrors(prev => ({
      ...prev,
      [name]: validationError
    }));
  };

  const addLineItem = () => {
    setLineItems(prev => [...prev, {
      itemId: "",
      quantity: 1,
      givingDate: formatDateInput(new Date()),
      returnDate: formatDateInput(new Date(Date.now() + 86400000))
    }]);
  };

  const updateLineItem = (idx, field, value) => {
    const updated = [...lineItems];
    const nextItem = { ...updated[idx], [field]: value };
    if (field === "givingDate" && nextItem.returnDate && nextItem.returnDate < value) {
      nextItem.returnDate = value;
    }
    updated[idx] = nextItem;
    setLineItems(updated);
  };

  const removeLineItem = (idx) => {
    setLineItems(prev => prev.filter((_, i) => i !== idx));
  };

  const calculateTotal = () => {
    return lineItems.reduce((sum, item) => {
      const selectedItem = items.find(i => i._id === item.itemId);
      if (!selectedItem) return sum;
      const days = Math.ceil((new Date(item.returnDate) - new Date(item.givingDate)) / (1000 * 60 * 60 * 24)) || 1;
      return sum + (selectedItem.pricePerDay * item.quantity * days);
    }, 0);
  };

  const totalAmount = calculateTotal();

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate customer info
    const nameError = validateCustomerName(customerInfo.customerName);
    const phoneError = validatePhoneNumber(customerInfo.phone);
    const addressError = validateAddress(customerInfo.address);

    if (nameError || phoneError || addressError) {
      setCustomerErrors({
        customerName: nameError,
        phone: phoneError,
        address: addressError
      });
      setError("Please fix validation errors in customer information");
      return;
    }

    if (lineItems.length === 0) {
      setError("Please add at least one item");
      return;
    }

    // Validate all line items
    for (let i = 0; i < lineItems.length; i++) {
      const item = lineItems[i];
      if (!item.itemId) {
        setError(`Item ${i + 1}: Please select an item`);
        return;
      }
      const qtyError = validateQuantity(item.quantity);
      if (qtyError) {
        setError(`Item ${i + 1}: ${qtyError}`);
        return;
      }
      const selectedItem = items.find((invItem) => invItem._id === item.itemId);
      if (selectedItem && Number(item.quantity) > Number(selectedItem.quantity || 0)) {
        setError(`Item ${i + 1}: Quantity cannot exceed available stock (${selectedItem.quantity})`);
        return;
      }
      if (item.givingDate < today) {
        setError(`Item ${i + 1}: Giving date cannot be in the past`);
        return;
      }
      if (item.returnDate < item.givingDate) {
        setError(`Item ${i + 1}: Return date cannot be before giving date`);
        return;
      }
    }

    setLoading(true);

    try {
      await apiRequest("/api/orders/multi/create", {
        method: "POST",
        body: JSON.stringify({
          ...customerInfo,
          lineItems,
          orderSource: source,
          paymentType,
          paidAmount: Number(paidAmount)
        })
      });

      setCustomerInfo({ customerName: "", address: "", phone: "" });
      setCustomerErrors({});
      setLineItems([]);
      setPaidAmount(0);
      onCreated();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="panel form-grid" onSubmit={submit}>
      <h3>{source === "warehouse" ? "Warehouse" : "Shop"} - Multi-Product Order</h3>
      {error && <p className="error-text">{error}</p>}

      <div style={{ background: "var(--surface-soft)", padding: "12px", borderRadius: "8px", marginBottom: "12px" }}>
        <h4 style={{ margin: "0 0 12px 0" }}>Customer Information</h4>
        <div style={{ marginBottom: "12px" }}>
          <input
            name="customerName"
            placeholder="Customer Name"
            value={customerInfo.customerName}
            onChange={handleCustomerChange}
            required
            style={{ marginBottom: customerErrors.customerName ? "4px" : "0" }}
          />
          {customerErrors.customerName && (
            <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#d32f2f" }}>
              {customerErrors.customerName}
            </p>
          )}
        </div>
        <div style={{ marginBottom: "12px" }}>
          <input
            name="address"
            placeholder="Street Address"
            value={customerInfo.address}
            onChange={handleCustomerChange}
            required
            style={{ marginBottom: customerErrors.address ? "4px" : "0" }}
          />
          {customerErrors.address && (
            <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#d32f2f" }}>
              {customerErrors.address}
            </p>
          )}
        </div>
        <div>
          <input
            name="phone"
            placeholder="Phone Number (10 digits)"
            value={customerInfo.phone}
            onChange={handleCustomerChange}
            required
            style={{ marginBottom: customerErrors.phone ? "4px" : "0" }}
          />
          {customerErrors.phone && (
            <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#d32f2f" }}>
              {customerErrors.phone}
            </p>
          )}
        </div>
      </div>

      <div style={{ background: "var(--surface-soft-3)", padding: "12px", borderRadius: "8px", marginBottom: "12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <h4 style={{ margin: 0 }}>Order Items</h4>
          <button type="button" onClick={addLineItem} style={{ padding: "6px 12px" }}>
            + Add Item
          </button>
        </div>

        {lineItems.map((item, idx) => {
          const selectedItem = items.find(i => i._id === item.itemId);
          const availableQuantity = selectedItem ? Number(selectedItem.quantity || 0) : 0;
          const days = Math.ceil((new Date(item.returnDate) - new Date(item.givingDate)) / (1000 * 60 * 60 * 24)) || 1;
          const itemTotal = selectedItem ? selectedItem.pricePerDay * item.quantity * days : 0;

          return (
            <div key={idx} style={{
              border: "1px solid var(--line)",
              padding: "12px",
              borderRadius: "6px",
              marginBottom: "12px",
              background: "#fff"
            }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <select
                  value={item.itemId}
                  onChange={(e) => updateLineItem(idx, "itemId", e.target.value)}
                  required
                >
                  <option value="">Select item</option>
                  {items.map(i => (
                    <option key={i._id} value={i._id}>
                      {i.name} | {formatLkr(i.pricePerDay)}/day | Qty: {i.quantity}
                    </option>
                  ))}
                </select>
                <p className="note-text" style={{ margin: "6px 0 0 0" }}>
                  {selectedItem ? `Available quantity: ${availableQuantity}` : "Select an item to view available quantity"}
                </p>
                <div>
                  <input
                    type="number"
                    min="1"
                    max={selectedItem ? selectedItem.quantity : undefined}
                    value={item.quantity}
                    onChange={(e) => updateLineItem(idx, "quantity", e.target.value)}
                    placeholder="Quantity"
                    required
                  />
                  {validateQuantity(item.quantity) && (
                    <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "#d32f2f" }}>
                      {validateQuantity(item.quantity)}
                    </p>
                  )}
                  {selectedItem && Number(item.quantity || 0) > availableQuantity && (
                    <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "#d32f2f" }}>
                      Quantity cannot exceed available stock ({availableQuantity})
                    </p>
                  )}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <label>
                  Giving Date
                  <input
                    type="date"
                    value={item.givingDate}
                    min={today}
                    onChange={(e) => updateLineItem(idx, "givingDate", e.target.value)}
                    required
                  />
                </label>
                <label>
                  Return Date
                  <input
                    type="date"
                    value={item.returnDate}
                    min={item.givingDate || today}
                    onChange={(e) => updateLineItem(idx, "returnDate", e.target.value)}
                    required
                  />
                </label>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ margin: 0 }}>
                  <strong>Item Total:</strong> {formatLkr(itemTotal)}
                </p>
                <button
                  type="button"
                  onClick={() => removeLineItem(idx)}
                  className="danger"
                  style={{ padding: "4px 8px" }}
                >
                  Remove
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{
        background: "var(--surface-warm)",
        padding: "12px",
        borderRadius: "8px",
        marginBottom: "12px",
        border: "2px solid var(--accent)"
      }}>
        <p style={{ margin: "0 0 12px 0", fontSize: "16px" }}>
          <strong>Order Total: {formatLkr(totalAmount)}</strong>
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <select value={paymentType} onChange={(e) => setPaymentType(e.target.value)}>
            <option value="full">Full Payment</option>
            <option value="advance">Advance Payment</option>
          </select>
          <input
            type="number"
            min="0"
            value={paidAmount}
            onChange={(e) => setPaidAmount(e.target.value)}
            placeholder="Paid Amount"
            disabled={paymentType === "full"}
          />
        </div>
      </div>

      <button type="submit" disabled={loading || lineItems.length === 0}>
        {loading ? "Creating Order..." : "Place Order"}
      </button>
    </form>
  );
}

function InvoiceModal({ order, onClose, formatLkr }) {
  const handleDownloadPDF = async () => {
    const element = document.getElementById(`invoice-${order._id}`);
    if (!element) return;

    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const pdf = new jsPDF("p", "mm", "a4");
      const imgData = canvas.toDataURL("image/png");
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`invoice-${order.invoiceNumber || order._id}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(9, 22, 37, 0.58)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000
    }} onClick={onClose}>
      <div style={{
        background: "white",
        padding: "20px",
        borderRadius: "8px",
        maxWidth: "800px",
        width: "90%",
        maxHeight: "80vh",
        overflow: "auto"
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ margin: 0 }}>Invoice</h3>
          <button onClick={onClose} style={{ background: "var(--muted)", padding: "6px 12px" }}>
            Close
          </button>
        </div>

        <div id={`invoice-${order._id}`} style={{ background: "white", padding: "20px" }}>
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <h2 style={{ margin: "0 0 8px 0" }}>RENTAL INVOICE</h2>
            <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)" }}>
              Invoice: {order.invoiceNumber || "N/A"}
            </p>
            <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "var(--text-muted)" }}>
              Date: {new Date(order.invoiceGeneratedAt || order.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
            <div>
              <p style={{ margin: "0 0 4px 0", fontWeight: "bold" }}>Customer Details</p>
              <p style={{ margin: "2px 0", fontSize: "14px" }}>{order.customerName}</p>
              <p style={{ margin: "2px 0", fontSize: "14px" }}>{order.address}</p>
              <p style={{ margin: "2px 0", fontSize: "14px" }}>{order.phone}</p>
            </div>
            <div>
              <p style={{ margin: "0 0 4px 0", fontWeight: "bold" }}>Order Details</p>
              <p style={{ margin: "2px 0", fontSize: "14px" }}>Source: {order.orderSource}</p>
              <p style={{ margin: "2px 0", fontSize: "14px" }}>Date: {new Date(order.orderDate).toLocaleDateString()}</p>
              <p style={{ margin: "2px 0", fontSize: "14px" }}>Status: {order.status}</p>
            </div>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
            <thead>
              <tr style={{ background: "var(--surface-soft)", borderBottom: "2px solid var(--line)" }}>
                <th style={{ padding: "8px", textAlign: "left", borderRight: "1px solid var(--line)" }}>Item</th>
                <th style={{ padding: "8px", textAlign: "center", borderRight: "1px solid var(--line)" }}>Qty</th>
                <th style={{ padding: "8px", textAlign: "center", borderRight: "1px solid var(--line)" }}>Dates</th>
                <th style={{ padding: "8px", textAlign: "right" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {order.lineItems && order.lineItems.length > 0 ? (
                order.lineItems.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid var(--line)" }}>
                    <td style={{ padding: "8px", borderRight: "1px solid var(--line)" }}>{item.itemName}</td>
                    <td style={{ padding: "8px", textAlign: "center", borderRight: "1px solid var(--line)" }}>{item.quantity}</td>
                    <td style={{ padding: "8px", textAlign: "center", borderRight: "1px solid var(--line)", fontSize: "12px" }}>
                      {new Date(item.givingDate).toLocaleDateString()} - {new Date(item.returnDate).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "8px", textAlign: "right" }}>{formatLkr(item.totalAmount)}</td>
                  </tr>
                ))
              ) : (
                <tr style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={{ padding: "8px", borderRight: "1px solid var(--line)" }}>{order.itemSnapshot?.name}</td>
                  <td style={{ padding: "8px", textAlign: "center", borderRight: "1px solid var(--line)" }}>{order.quantity}</td>
                  <td style={{ padding: "8px", textAlign: "center", borderRight: "1px solid var(--line)", fontSize: "12px" }}>
                    {new Date(order.givingDate).toLocaleDateString()} - {new Date(order.returnDate).toLocaleDateString()}
                  </td>
                  <td style={{ padding: "8px", textAlign: "right" }}>{formatLkr(order.totalDue)}</td>
                </tr>
              )}
            </tbody>
          </table>

          <div style={{ textAlign: "right", marginBottom: "20px" }}>
            <div style={{ display: "inline-block", minWidth: "250px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "8px" }}>
                <span>Subtotal:</span>
                <span style={{ textAlign: "right" }}>{formatLkr(order.totalDue)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "8px" }}>
                  <span>Discount:</span>
                  <span style={{ textAlign: "right", color: "green" }}>-{formatLkr(order.discountAmount)}</span>
                </div>
              )}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
                marginBottom: "8px",
                borderTop: "2px solid #333",
                paddingTop: "8px",
                fontWeight: "bold"
              }}>
                <span>Total Amount:</span>
                <span style={{ textAlign: "right" }}>{formatLkr(order.totalDue - order.discountAmount)}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <span>Paid Amount:</span>
                <span style={{ textAlign: "right" }}>{formatLkr(order.paidAmount)}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <span>Balance:</span>
                <span style={{ textAlign: "right" }}>{formatLkr(order.balance)}</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "20px" }}>
                  <button onClick={handleDownloadPDF} style={{ background: "var(--primary-dark)", padding: "8px 16px" }}>
            Download PDF
          </button>
          <button onClick={onClose} style={{ background: "var(--muted)", padding: "8px 16px" }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function SettlementModal({ order, onClose, onSuccess, formatLkr }) {
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const finalAmount = order.totalDue - Number(discount);

  const handleSettle = async () => {
    setError("");
    setLoading(true);

    try {
      await apiRequest(`/api/orders/${order._id}/settle`, {
        method: "POST",
        body: JSON.stringify({ discountAmount: Number(discount) })
      });
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(9, 22, 37, 0.58)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000
    }} onClick={onClose}>
      <div style={{
        background: "white",
        padding: "20px",
        borderRadius: "8px",
        maxWidth: "500px",
        width: "90%"
      }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>Order Settlement</h3>

        {error && <p className="error-text">{error}</p>}

        <div style={{ background: "var(--surface-soft)", padding: "12px", borderRadius: "8px", marginBottom: "16px" }}>
          <p style={{ margin: "4px 0" }}>
            <strong>Customer:</strong> {order.customerName}
          </p>
          <p style={{ margin: "4px 0" }}>
            <strong>Order Total:</strong> {formatLkr(order.totalDue)}
          </p>
        </div>

        <label style={{ display: "block", marginBottom: "16px" }}>
          <strong>Discount Amount (LKR)</strong>
          <input
            type="number"
            min="0"
            max={order.totalDue}
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            placeholder="0"
            style={{ marginTop: "4px" }}
          />
          <small style={{ display: "block", marginTop: "4px", color: "var(--text-muted)" }}>
            Customer pays: {formatLkr(finalAmount)}
          </small>
        </label>

        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={handleSettle}
            disabled={loading}
            style={{
              flex: 1,
              background: "var(--success)",
              padding: "10px",
              border: "none",
              borderRadius: "4px",
              color: "white",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: "bold"
            }}
          >
            {loading ? "Settling..." : "Confirm Settlement"}
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              background: "var(--muted)",
              padding: "10px",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function OrdersTable({ orders, onRefresh }) {
  const [showInvoice, setShowInvoice] = useState(null);
  const [showSettlement, setShowSettlement] = useState(null);

  const updateStatus = async (orderId, status) => {
    await apiRequest(`/api/orders/${orderId}`, {
      method: "PUT",
      body: JSON.stringify({ status })
    });
    onRefresh();
  };

  const deleteOrder = async (orderId) => {
    await apiRequest(`/api/orders/${orderId}`, { method: "DELETE" });
    onRefresh();
  };

  const generateInvoice = async (orderId) => {
    try {
      const result = await apiRequest(`/api/orders/${orderId}/generate-invoice`, {
        method: "POST"
      });
      setShowInvoice(result.order);
    } catch (error) {
      console.error("Error generating invoice:", error);
    }
  };

  const finalizeOrder = async (orderId) => {
    await apiRequest(`/api/orders/${orderId}/finalize`, { method: "POST" });
    onRefresh();
  };

  const handleInvoiceClick = async (order) => {
    if (order.invoiceNumber) {
      setShowInvoice(order);
      return;
    }

    await generateInvoice(order._id);
  };

  return (
    <>
      <section className="panel">
        <h3>Orders (Active & Historical)</h3>
        <style>{`
          /* Orders responsive: show table on desktop, cards on mobile */
          .order-card { border:1px solid var(--line); border-radius:8px; padding:12px; margin:8px 0; background:var(--panel-bg,#fff); }
          .order-card .row { display:flex; justify-content:space-between; gap:12px; margin:6px 0; }
          .order-card .label { color:var(--text-muted); font-size:12px; width:40%; }
          .order-card .value { font-weight:600; width:60%; }
          @media (min-width: 781px) { .mobile-orders { display:none; } }
          @media (max-width: 780px) { .desktop-only { display:none; } }
        `}</style>
        <div className="desktop-only table-wrap">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Items</th>
                <th>Source</th>
                <th>Order Date</th>
                <th>Total</th>
                <th>Balance</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id}>
                  <td>{order.customerName}</td>
                  <td>
                    {order.lineItems && order.lineItems.length > 0
                      ? `${order.lineItems.length} items`
                      : order.itemSnapshot?.name || "N/A"}
                  </td>
                  <td>{order.orderSource}</td>
                  <td>{new Date(order.orderDate).toLocaleDateString()}</td>
                  <td>{formatLkr(order.totalDue)}</td>
                  <td>{formatLkr(order.balance)}</td>
                  <td>
                    {order.status === "completed" ? (
                      <span className={`status-pill ${order.status}`}>Completed</span>
                    ) : (
                      <select
                        value={order.status}
                        onChange={(event) => updateStatus(order._id, event.target.value)}
                      >
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    )}
                  </td>
                  <td>
                    <div className="button-group">
                      <button type="button" onClick={() => handleInvoiceClick(order)}>
                        Invoice
                      </button>
                      {order.status === "active" && (
                        <button type="button" onClick={() => setShowSettlement(order)} style={{ background: "var(--success)" }}>
                          Settle
                        </button>
                      )}
                      <button className="danger" onClick={() => deleteOrder(order._id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile card list */}
        <div className="mobile-orders">
          {orders.map((order) => (
            <article key={order._id} className="order-card">
              <div className="row"><div className="label">Customer</div><div className="value">{order.customerName}</div></div>
              <div className="row"><div className="label">Items</div><div className="value">{order.lineItems?.length ? `${order.lineItems.length} items` : order.itemSnapshot?.name || 'N/A'}</div></div>
              <div className="row"><div className="label">Source</div><div className="value">{order.orderSource}</div></div>
              <div className="row"><div className="label">Date</div><div className="value">{new Date(order.orderDate).toLocaleDateString()}</div></div>
              <div className="row"><div className="label">Total</div><div className="value">{formatLkr(order.totalDue)}</div></div>
              <div className="row"><div className="label">Balance</div><div className="value">{formatLkr(order.balance)}</div></div>
              <div className="row"><div className="label">Status</div><div className="value">{order.status === 'completed' ? <span className={`status-pill ${order.status}`}>Completed</span> : <select value={order.status} onChange={(e)=>updateStatus(order._id,e.target.value)}><option value="active">Active</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select>}</div></div>
              <div style={{ marginTop:8, display:'flex', gap:8, flexWrap:'wrap' }}>
                <button onClick={()=>handleInvoiceClick(order)}>Invoice</button>
                {order.status === 'active' && <button style={{ background:'var(--success)' }} onClick={()=>setShowSettlement(order)}>Settle</button>}
                <button className="danger" onClick={()=>deleteOrder(order._id)}>Delete</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {showInvoice && (
        <InvoiceModal
          order={showInvoice}
          onClose={() => setShowInvoice(null)}
          formatLkr={formatLkr}
        />
      )}

      {showSettlement && (
        <SettlementModal
          order={showSettlement}
          onClose={() => setShowSettlement(null)}
          onSuccess={() => {
            setShowSettlement(null);
            onRefresh();
          }}
          formatLkr={formatLkr}
        />
      )}
    </>
  );
}

function App() {
  const [activeView, setActiveView] = useState("warehouse-items");
  const [currentUser, setCurrentUser] = useState(null);
  const [authForm, setAuthForm] = useState({ username: "", password: "" });
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(true);
  const [health, setHealth] = useState("Checking backend...");
  const [items, setItems] = useState([]);
  const [damagedItems, setDamagedItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [shops, setShops] = useState([]);
  const [staff, setStaff] = useState([]);
  const [logisticsRequests, setLogisticsRequests] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [alertStats, setAlertStats] = useState({ overdueCount: 0, newOrdersToday: 0 });
  const [analytics, setAnalytics] = useState({
    totalRentalOrders: 0,
    totalIncome: 0,
    overdueCount: 0,
    incomeOverTime: [],
    orderTrendsBySource: []
  });
  const [rentalRecords, setRentalRecords] = useState([]);
  const [orderSourceFilter, setOrderSourceFilter] = useState("all");
  const [inventorySearchInput, setInventorySearchInput] = useState("");
  const [inventorySearchTerm, setInventorySearchTerm] = useState("");
  const [error, setError] = useState("");
  const [warehouseOrderMode, setWarehouseOrderMode] = useState("multi");
  const [shopOrderMode, setShopOrderMode] = useState("multi");

  const [itemForm, setItemForm] = useState({ name: "", quantity: "", pricePerDay: "", image: null });
  const [itemFormErrors, setItemFormErrors] = useState({ name: "", quantity: "", pricePerDay: "" });
  const [editingItemId, setEditingItemId] = useState("");
  const [editingItemForm, setEditingItemForm] = useState({ name: "", quantity: "", pricePerDay: "" });
  const [editingItemFormErrors, setEditingItemFormErrors] = useState({ name: "", quantity: "", pricePerDay: "" });
  const [damageItemId, setDamageItemId] = useState("");
  const [damageForm, setDamageForm] = useState({ damagedQuantity: "", reason: "" });
  const [damageFormErrors, setDamageFormErrors] = useState({ damagedQuantity: "", reason: "" });
  const [warehouseForm, setWarehouseForm] = useState({
    name: "",
    code: "",
    logisticsManagerName: ""
  });
  const [staffForm, setStaffForm] = useState({
    username: "",
    password: "",
    role: "warehouse",
    assignmentType: "warehouse",
    assignmentId: ""
  });
  const [warehouseError, setWarehouseError] = useState("");
  const [staffError, setStaffError] = useState("");
  const [logisticsForm, setLogisticsForm] = useState({
    type: "order_dispatch",
    transferDirection: "warehouse_to_shop",
    orderId: "",
    itemId: "",
    requestedQuantity: 1,
    sourceWarehouseId: "",
    sourceShopId: "",
    targetWarehouseId: "",
    targetShopId: "",
    notes: ""
  });
  const [warehouseRequestForm, setWarehouseRequestForm] = useState({
    sourceShopId: "",
    itemId: "",
    requestedQuantity: "1",
    notes: ""
  });
  const [shopRequestForm, setShopRequestForm] = useState({
    sourceWarehouseId: "",
    itemId: "",
    requestedQuantity: "1",
    notes: ""
  });
  const [notificationForm, setNotificationForm] = useState({
    title: "",
    message: "",
    type: "sms",
    phone: ""
  });

  const filteredOrders =
    orderSourceFilter === "all"
      ? orders
      : orders.filter((order) => order.orderSource === orderSourceFilter);

  const isInventoryView = activeView === "warehouse-items" || activeView === "shop-items";

  const filteredInventoryItems = useMemo(() => {
    const query = inventorySearchTerm.trim().toLowerCase();
    if (!query) {
      return items;
    }

    return items.filter((item) => String(item.name || "").toLowerCase().includes(query));
  }, [items, inventorySearchTerm]);

  const selectedWarehouseRequestItem = useMemo(
    () => items.find((item) => item._id === warehouseRequestForm.itemId) || null,
    [items, warehouseRequestForm.itemId]
  );

  const selectedShopRequestItem = useMemo(
    () => items.find((item) => item._id === shopRequestForm.itemId) || null,
    [items, shopRequestForm.itemId]
  );

  const validateRequestQuantity = (itemId, requestedQuantity) => {
    if (!itemId) {
      return "Please select an item";
    }

    const selectedItem = items.find((item) => item._id === itemId);
    if (!selectedItem) {
      return "Selected item not found";
    }

    const qty = Number(requestedQuantity);
    if (!Number.isInteger(qty) || qty < 1) {
      return "Quantity must be a whole number greater than 0";
    }

    const availableStock = Number(selectedItem.quantity || 0);
    if (qty > availableStock) {
      return `Requested quantity cannot exceed available stock (${availableStock})`;
    }

    return "";
  };

  const allowedNavItems = useMemo(() => {
    if (!currentUser) return [];
    return NAV_ITEMS.filter((item) => item.roles.includes(currentUser.role));
  }, [currentUser]);

  const logisticsRequestNotificationCount = useMemo(() => {
    if (!currentUser || currentUser.role !== "logistics") {
      return 0;
    }

    return logisticsRequests.filter(
      (request) =>
        request.status === "pending" &&
        (request.requestedByRole === "warehouse" || request.requestedByRole === "shop")
    ).length;
  }, [currentUser, logisticsRequests]);

  const isAdminSectionView = ADMIN_SECTIONS.has(activeView);
  const adminSection = ADMIN_VIEW_TO_SECTION[activeView] || "new-warehouse";
  const isLogisticsSectionView = LOGISTICS_SECTIONS.has(activeView);
  const logisticsSection = LOGISTICS_VIEW_TO_SECTION[activeView] || "request-form";
  const isAnalyticsSectionView = ANALYTICS_SECTIONS.has(activeView);
  const analyticsSection = ANALYTICS_VIEW_TO_SECTION[activeView] || "notifications";
  const isRentalSectionView = RENTAL_SECTIONS.has(activeView);
  const rentalSection = RENTAL_VIEW_TO_SECTION[activeView] || "finalized-orders";

  const applyInventorySearch = (event) => {
    event.preventDefault();
    setInventorySearchTerm(inventorySearchInput.trim());
  };

  const clearInventorySearch = () => {
    setInventorySearchInput("");
    setInventorySearchTerm("");
  };

  const loadPublicItems = async () => {
    try {
      const itemsPayload = await fetch(`${API_URL}/api/items/public/list`).then(r => r.json());
      setItems(itemsPayload);
    } catch (error) {
      // Silently fail - items are optional on login page
    }
  };

  const loadAllData = async () => {
    if (!currentUser) return;

    try {
      const healthPayload = await apiRequest("/api/health");
      setHealth(healthPayload.message);

      if (currentUser.role === "warehouse") {
        const results = await Promise.allSettled([
          apiRequest("/api/items"),
          apiRequest("/api/items/damaged/history"),
          apiRequest("/api/orders?source=warehouse"),
          apiRequest("/api/admin/warehouses"),
          apiRequest("/api/admin/shops"),
          apiRequest("/api/logistics/requests")
        ]);

        setItems(getSettledValue(results[0], []));
        setDamagedItems(getSettledValue(results[1], []));
        setOrders(getSettledValue(results[2], []));
        setWarehouses(getSettledValue(results[3], []));
        setShops(getSettledValue(results[4], []));
        setLogisticsRequests(getSettledValue(results[5], []));
      }

      if (currentUser.role === "shop") {
        const results = await Promise.allSettled([
          apiRequest("/api/items"),
          apiRequest("/api/orders?source=shop"),
          apiRequest("/api/admin/warehouses"),
          apiRequest("/api/admin/shops"),
          apiRequest("/api/logistics/requests")
        ]);

        setItems(getSettledValue(results[0], []));
        setOrders(getSettledValue(results[1], []));
        setWarehouses(getSettledValue(results[2], []));
        setShops(getSettledValue(results[3], []));
        setLogisticsRequests(getSettledValue(results[4], []));
      }

      if (currentUser.role === "logistics") {
        const [ordersPayload, logisticsPayload, itemsPayload, warehousesPayload, shopsPayload, auditPayload] = await Promise.all([
          apiRequest("/api/orders"),
          apiRequest("/api/logistics/requests"),
          apiRequest("/api/items"),
          apiRequest("/api/admin/warehouses"),
          apiRequest("/api/admin/shops"),
          apiRequest("/api/logistics/audit-logs")
        ]);

        setOrders(ordersPayload);
        setLogisticsRequests(logisticsPayload);
        setItems(itemsPayload);
        setWarehouses(warehousesPayload);
        setShops(shopsPayload);
        setAuditLogs(auditPayload);
      }

      if (currentUser.role === "admin") {
        const [
          warehousePayload,
          shopsPayload,
          staffPayload
        ] = await Promise.all([
          apiRequest("/api/admin/warehouses"),
          apiRequest("/api/admin/shops"),
          apiRequest("/api/admin/staff")
        ]);

        setWarehouses(warehousePayload);
        setShops(shopsPayload);
        setStaff(staffPayload);
      }

      if (currentUser.role === "analytics") {
        const [notificationsPayload, alertsPayload, analyticsPayload] = await Promise.all([
          apiRequest("/api/notifications"),
          apiRequest("/api/notifications/alerts/triggered"),
          apiRequest("/api/analytics/summary")
        ]);

        setNotifications(notificationsPayload);
        setAlertStats(alertsPayload);
        setAnalytics(analyticsPayload);
      }

      if (currentUser.role === "rental") {
        const [recordsPayload, ordersPayload] = await Promise.all([
          apiRequest("/api/rental-records"),
          apiRequest("/api/orders")
        ]);
        setRentalRecords(recordsPayload);
        setOrders(ordersPayload);
      }

      setError("");
    } catch (loadError) {
      setError(loadError.message);
      setHealth("Cannot reach backend API");
    }
  };

  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      setAuthLoading(false);
      // Load items for the login page display
      loadPublicItems();
      return;
    }

    const loadCurrentUser = async () => {
      try {
        const payload = await apiRequest("/api/auth/me");
        setCurrentUser(payload.user);
        setActiveView(ROLE_DEFAULT_VIEW[payload.user.role]);
      } catch (_error) {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        setCurrentUser(null);
        // Show available items on the staff portal immediately if token is invalid/expired.
        loadPublicItems();
      } finally {
        setAuthLoading(false);
      }
    };

    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    setActiveView(ROLE_DEFAULT_VIEW[currentUser.role]);
    loadAllData();
  }, [currentUser]);

  // Poll for logistics updates when user is logistics manager so mobile sees new requests/audit
  useEffect(() => {
    if (!currentUser || currentUser.role !== "logistics") return;
    const id = setInterval(() => {
      loadAllData();
    }, 15000);
    return () => clearInterval(id);
  }, [currentUser]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setAuthError("");

    // Validate inputs
    const usernameError = validateUsername(authForm.username);
    const passwordError = validatePassword(authForm.password);

    if (usernameError) {
      setAuthError(usernameError);
      return;
    }

    if (passwordError) {
      setAuthError(passwordError);
      return;
    }

    try {
      const payload = await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(authForm)
      });
      localStorage.setItem(AUTH_TOKEN_KEY, payload.token);
      setCurrentUser(payload.user);
      setAuthForm({ username: "", password: "" });
    } catch (requestError) {
      setAuthError(requestError.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setCurrentUser(null);
    setItems([]);
    setDamagedItems([]);
    setOrders([]);
    setWarehouses([]);
    setShops([]);
    setStaff([]);
    setLogisticsRequests([]);
    setNotifications([]);
    setRentalRecords([]);
    setError("");
    setAuthError("");
    setHealth("Checking backend...");

    // Refresh the public item list for the staff portal without requiring a page reload.
    loadPublicItems();
  };

  const canView = (viewKey) => allowedNavItems.some((item) => item.key === viewKey);

  const addItem = async (event) => {
    event.preventDefault();
    setError("");
    
    // Validate all fields
    const nameError = itemForm.name.trim() === "" ? "Item name is required" : 
                     itemForm.name.trim().length < 2 ? "Item name must be at least 2 characters" : 
                     itemForm.name.trim().length > 100 ? "Item name must be less than 100 characters" : null;
    const qtyError = validateQuantity(itemForm.quantity);
    const priceError = validatePrice(itemForm.pricePerDay);

    if (nameError || qtyError || priceError) {
      setItemFormErrors({
        name: nameError,
        quantity: qtyError,
        pricePerDay: priceError
      });
      return;
    }

    const formData = new FormData();
    formData.append("name", itemForm.name);
    formData.append("quantity", Number(itemForm.quantity));
    formData.append("pricePerDay", Number(itemForm.pricePerDay));
    if (itemForm.image) {
      formData.append("image", itemForm.image);
    }

    try {
      const createdItem = await apiRequest("/api/items", {
        method: "POST",
        body: formData
      });

      setItemForm({ name: "", quantity: "", pricePerDay: "", image: null });
      setItemFormErrors({ name: "", quantity: "", pricePerDay: "" });
      setItems((current) => [createdItem, ...current.filter((item) => item._id !== createdItem._id)]);
      loadAllData();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const startEditItem = (item) => {
    setEditingItemId(item._id);
    setEditingItemForm({
      name: item.name,
      quantity: String(item.quantity),
      pricePerDay: String(item.pricePerDay)
    });
    setEditingItemFormErrors({ name: "", quantity: "", pricePerDay: "" });
  };

  const handleItemFormChange = (e) => {
    const { name, value } = e.target;
    setItemForm(prev => ({ ...prev, [name]: value }));
    
    let validationError = null;
    if (name === "name") {
      if (!value.trim()) {
        validationError = "Item name is required";
      } else if (value.trim().length < 2) {
        validationError = "Item name must be at least 2 characters";
      } else if (value.trim().length > 100) {
        validationError = "Item name must be less than 100 characters";
      }
    } else if (name === "quantity") {
      validationError = validateQuantity(value);
    } else if (name === "pricePerDay") {
      validationError = validatePrice(value);
    }
    setItemFormErrors(prev => ({ ...prev, [name]: validationError }));
  };

  const handleEditingItemFormChange = (e) => {
    const { name, value } = e.target;
    setEditingItemForm(prev => ({ ...prev, [name]: value }));
    
    let validationError = null;
    if (name === "name") {
      if (!value.trim()) {
        validationError = "Item name is required";
      } else if (value.trim().length < 2) {
        validationError = "Item name must be at least 2 characters";
      } else if (value.trim().length > 100) {
        validationError = "Item name must be less than 100 characters";
      }
    } else if (name === "quantity") {
      validationError = validateQuantity(value);
    } else if (name === "pricePerDay") {
      validationError = validatePrice(value);
    }
    setEditingItemFormErrors(prev => ({ ...prev, [name]: validationError }));
  };

  const handleDamageFormChange = (e) => {
    const { name, value } = e.target;
    setDamageForm(prev => ({ ...prev, [name]: value }));
    
    let validationError = null;
    if (name === "damagedQuantity") {
      validationError = validateQuantity(value);
    } else if (name === "reason") {
      if (!value.trim()) {
        validationError = "Reason is required";
      } else if (value.trim().length < 5) {
        validationError = "Reason must be at least 5 characters";
      } else if (value.trim().length > 500) {
        validationError = "Reason must be less than 500 characters";
      }
    }
    setDamageFormErrors(prev => ({ ...prev, [name]: validationError }));
  };

  const saveItemEdit = async (itemId) => {
    // Validate all fields
    const nameError = editingItemForm.name.trim() === "" ? "Item name is required" : 
                     editingItemForm.name.trim().length < 2 ? "Item name must be at least 2 characters" : 
                     editingItemForm.name.trim().length > 100 ? "Item name must be less than 100 characters" : null;
    const qtyError = validateQuantity(editingItemForm.quantity);
    const priceError = validatePrice(editingItemForm.pricePerDay);

    if (nameError || qtyError || priceError) {
      setEditingItemFormErrors({
        name: nameError,
        quantity: qtyError,
        pricePerDay: priceError
      });
      return;
    }

    await apiRequest(`/api/items/${itemId}`, {
      method: "PUT",
      body: JSON.stringify({
        name: editingItemForm.name,
        quantity: Number(editingItemForm.quantity),
        pricePerDay: Number(editingItemForm.pricePerDay)
      })
    });
    setEditingItemId("");
    setEditingItemForm({ name: "", quantity: "", pricePerDay: "" });
    setEditingItemFormErrors({ name: "", quantity: "", pricePerDay: "" });
    loadAllData();
  };

  const startDamageItem = (itemId) => {
    setDamageItemId(itemId);
    setDamageForm({ damagedQuantity: "", reason: "" });
    setDamageFormErrors({ damagedQuantity: "", reason: "" });
  };

  const saveDamagedItem = async (itemId) => {
    // Validate all fields
    const qtyError = validateQuantity(damageForm.damagedQuantity);
    let reasonError = null;
    if (!damageForm.reason.trim()) {
      reasonError = "Reason is required";
    } else if (damageForm.reason.trim().length < 5) {
      reasonError = "Reason must be at least 5 characters";
    } else if (damageForm.reason.trim().length > 500) {
      reasonError = "Reason must be less than 500 characters";
    }

    if (qtyError || reasonError) {
      setDamageFormErrors({
        damagedQuantity: qtyError,
        reason: reasonError
      });
      return;
    }

    await apiRequest(`/api/items/${itemId}`, {
      method: "DELETE",
      body: JSON.stringify({
        damagedQuantity: Number(damageForm.damagedQuantity),
        reason: damageForm.reason
      })
    });
    setDamageItemId("");
    setDamageForm({ damagedQuantity: "", reason: "" });
    setDamageFormErrors({ damagedQuantity: "", reason: "" });
    loadAllData();
  };

  const createWarehouse = async (event) => {
    event.preventDefault();
    setWarehouseError("");

    // Validate warehouse inputs
    const nameError = validateWarehouseName(warehouseForm.name);
    const codeError = validateCode(warehouseForm.code);

    if (nameError) {
      setWarehouseError(nameError);
      return;
    }

    if (codeError) {
      setWarehouseError(codeError);
      return;
    }

    try {
      await apiRequest("/api/admin/warehouses", {
        method: "POST",
        body: JSON.stringify(warehouseForm)
      });
      setWarehouseForm({ name: "", code: "", logisticsManagerName: "" });
      setWarehouseError("");
      loadAllData();
    } catch (err) {
      setWarehouseError(err.message);
    }
  };

  const createStaff = async (event) => {
    event.preventDefault();
    setStaffError("");

    // Validate staff inputs
    const usernameError = validateUsername(staffForm.username);
    const passwordError = validatePassword(staffForm.password);

    if (usernameError) {
      setStaffError(usernameError);
      return;
    }

    if (passwordError) {
      setStaffError(passwordError);
      return;
    }

    if (staffForm.role === "warehouse" && staffForm.assignmentType !== "warehouse") {
      setStaffError("Warehouse staff must use warehouse assignment type");
      return;
    }

    if (staffForm.role === "shop" && staffForm.assignmentType !== "shop") {
      setStaffError("Shop staff must use shop assignment type");
      return;
    }

    if (staffForm.assignmentType !== "none" && !staffForm.assignmentId) {
      setStaffError(
        staffForm.assignmentType === "warehouse"
          ? "Please select a warehouse assignment"
          : "Please select a shop assignment"
      );
      return;
    }

    try {
      await apiRequest("/api/admin/staff", {
        method: "POST",
        body: JSON.stringify({
          username: staffForm.username,
          password: staffForm.password,
          role: staffForm.role,
          assignmentType: staffForm.assignmentType,
          assignmentId: staffForm.assignmentType === "none" ? null : staffForm.assignmentId
        })
      });
      setStaffForm({
        username: "",
        password: "",
        role: "warehouse",
        assignmentType: "warehouse",
        assignmentId: ""
      });
      setStaffError("");
      loadAllData();
    } catch (err) {
      setStaffError(err.message);
    }
  };

  const deleteStaff = async (staffId) => {
    await apiRequest(`/api/admin/staff/${staffId}`, { method: "DELETE" });
    loadAllData();
  };

  const deleteWarehouse = async (warehouseId) => {
    await apiRequest(`/api/admin/warehouses/${warehouseId}`, { method: "DELETE" });
    loadAllData();
  };

  const updateStaff = async (staffId, updates) => {
    await apiRequest(`/api/admin/staff/${staffId}`, {
      method: "PUT",
      body: JSON.stringify(updates)
    });
    loadAllData();
  };

  const createLogisticsRequest = async (event) => {
    event.preventDefault();
    const quantityError = validateRequestQuantity(logisticsForm.itemId, logisticsForm.requestedQuantity);
    if (quantityError) {
      setError(quantityError);
      return;
    }
    try {
      await apiRequest("/api/logistics/requests", {
        method: "POST",
        body: JSON.stringify({
          ...logisticsForm,
          orderId: logisticsForm.orderId || null,
          itemId: logisticsForm.itemId || null,
          requestedQuantity: Number(logisticsForm.requestedQuantity || 1),
          sourceWarehouseId: logisticsForm.sourceWarehouseId || null,
          sourceShopId: logisticsForm.sourceShopId || null,
          targetWarehouseId: logisticsForm.targetWarehouseId || null,
          targetShopId: logisticsForm.targetShopId || null
        })
      });

      setLogisticsForm({
        type: "order_dispatch",
        transferDirection: "warehouse_to_shop",
        orderId: "",
        itemId: "",
        requestedQuantity: 1,
        sourceWarehouseId: "",
        sourceShopId: "",
        targetWarehouseId: "",
        targetShopId: "",
        notes: ""
      });
      setError("");
      await loadAllData();
    } catch (err) {
      setError(err.message || "Failed to create request");
    }
  };

  const createWarehouseRequest = async (event) => {
    event.preventDefault();
    const quantityError = validateRequestQuantity(
      warehouseRequestForm.itemId,
      warehouseRequestForm.requestedQuantity
    );
    if (quantityError) {
      setError(quantityError);
      return;
    }
    try {
      await apiRequest("/api/logistics/requests", {
        method: "POST",
        body: JSON.stringify({
          sourceShopId: warehouseRequestForm.sourceShopId || null,
          itemId: warehouseRequestForm.itemId || null,
          requestedQuantity: Number(warehouseRequestForm.requestedQuantity || 1),
          notes: warehouseRequestForm.notes
        })
      });

      setWarehouseRequestForm({
        sourceShopId: "",
        itemId: "",
        requestedQuantity: "1",
        notes: ""
      });
      setError("");
      await loadAllData();
    } catch (err) {
      setError(err.message || "Failed to create warehouse request");
    }
  };

  const createShopRequest = async (event) => {
    event.preventDefault();
    const quantityError = validateRequestQuantity(
      shopRequestForm.itemId,
      shopRequestForm.requestedQuantity
    );
    if (quantityError) {
      setError(quantityError);
      return;
    }
    try {
      await apiRequest("/api/logistics/requests", {
        method: "POST",
        body: JSON.stringify({
          sourceWarehouseId: shopRequestForm.sourceWarehouseId || null,
          itemId: shopRequestForm.itemId || null,
          requestedQuantity: Number(shopRequestForm.requestedQuantity || 1),
          notes: shopRequestForm.notes
        })
      });

      setShopRequestForm({
        sourceWarehouseId: "",
        itemId: "",
        requestedQuantity: "1",
        notes: ""
      });
      setError("");
      await loadAllData();
    } catch (err) {
      setError(err.message || "Failed to create shop request");
    }
  };

  const changeLogisticsStatus = async (requestId, status) => {
    try {
      await apiRequest(`/api/logistics/requests/${requestId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });
      await loadAllData();
    } catch (err) {
      setError(err.message || "Failed to update status");
    }
  };

  const deleteLogisticsRequest = async (requestId) => {
    try {
      await apiRequest(`/api/logistics/requests/${requestId}`, { method: "DELETE" });
      await loadAllData();
    } catch (err) {
      setError(err.message || "Failed to delete request");
    }
  };

  const deleteAuditLog = async (auditId) => {
    try {
      await apiRequest(`/api/logistics/audit-logs/${auditId}`, { method: "DELETE" });
      await loadAllData();
    } catch (err) {
      setError(err.message || "Failed to delete audit log");
    }
  };

  const exportAuditPDF = async (auditLogId) => {
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      const response = await fetch(`${API_URL}/api/logistics/audit-logs/${auditLogId}/export`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to export PDF: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      // Return the blob URL to the caller so they can open it in a modal/tab and revoke when done
      return url;
    } catch (error) {
      console.error("Error exporting PDF:", error);
      throw error;
    }
  };

  const createNotification = async (event) => {
    event.preventDefault();
    await apiRequest("/api/notifications", {
      method: "POST",
      body: JSON.stringify(notificationForm)
    });
    setNotificationForm({ title: "", message: "", type: "sms", phone: "" });
    loadAllData();
  };

  const deleteNotification = async (notificationId) => {
    await apiRequest(`/api/notifications/${notificationId}`, { method: "DELETE" });
    loadAllData();
  };

  if (authLoading) {
    return (
      <div className="auth-shell">
        <section className="auth-card">
          <h2>Loading session...</h2>
        </section>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="auth-shell">
        <div className="auth-wrapper auth-wrapper-portal">
          <section className="auth-form-section">
            <form className="auth-form-card" onSubmit={handleLogin}>
              <div className="form-header">
                <h2>Staff Portal</h2>
                <p>Access your role-based dashboard</p>
              </div>

              {authError ? <div className="form-error">{authError}</div> : null}

              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={authForm.username}
                  onChange={(event) =>
                    setAuthForm((current) => ({ ...current, username: event.target.value }))
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={authForm.password}
                  onChange={(event) =>
                    setAuthForm((current) => ({ ...current, password: event.target.value }))
                  }
                  required
                />
              </div>

              <button type="submit" className="form-submit-btn">Sign In</button>

              <p className="form-footer">Credentials assigned by system administrator</p>
            </form>

            {items.length > 0 && (
              <div className="auth-featured-section">
                <h3>Featured Inventory Items</h3>
                <div className="auth-featured-grid">
                  {items.slice(0, 4).map((item) => (
                    <div key={item._id} className="auth-item-card">
                      <div className="item-image-wrapper">
                        {getInventoryImageSrc(item) ? (
                          <img
                            className="featured-item-image"
                            src={getInventoryImageSrc(item)}
                            alt={item.name}
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <div className="item-placeholder">📷</div>
                        )}
                        <span className="item-stock-badge">{item.quantity} available</span>
                      </div>
                      <div className="item-info">
                        <p className="item-name">{item.name}</p>
                        <p className="item-price">{formatLkr(item.pricePerDay)}/day</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="auth-system-details">
              <h3>System Capabilities</h3>
              <div className="auth-features">
                <div className="auth-feature-item">
                  <div className="feature-icon">📦</div>
                  <div>
                    <strong>Inventory Control</strong>
                    <p>Real-time stock tracking across warehouses and shops with damage logs.</p>
                  </div>
                </div>
                <div className="auth-feature-item">
                  <div className="feature-icon">🚚</div>
                  <div>
                    <strong>Logistics Hub</strong>
                    <p>Manage transfers, dispatch orders, and track logistics with audit trails.</p>
                  </div>
                </div>
                <div className="auth-feature-item">
                  <div className="feature-icon">💰</div>
                  <div>
                    <strong>Billing System</strong>
                    <p>Support full and advance payments, balance tracking, and overdue handling.</p>
                  </div>
                </div>
                <div className="auth-feature-item">
                  <div className="feature-icon">📊</div>
                  <div>
                    <strong>Analytics & Notifications</strong>
                    <p>Generate reports and monitor operational performance in one place.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className={`app-shell ${(activeView === "admin" || isAdminSectionView) ? "admin-view" : ""}`}>
      <div className="app-main-layout">
        <aside className="global-sidebar">
          <div className="global-sidebar-head">
            <h3>{currentUser.role} dashboard</h3>
            <p className="global-user-text">
              <strong>{currentUser.username}</strong>
            </p>
            <div className="health-status global-health-status">
              <span className={`status-indicator ${health && !health.includes("Cannot") ? "connected" : "disconnected"}`}></span>
              <span className="status-text">{health && health.includes("Cannot") ? "Not Connected" : "Connected"}</span>
            </div>
            {error ? <p className="error-text">{error}</p> : null}
            {isInventoryView ? (
              <form onSubmit={applyInventorySearch} className="global-search-form">
                <input
                  type="text"
                  value={inventorySearchInput}
                  onChange={(event) => setInventorySearchInput(event.target.value)}
                  placeholder="Search items"
                  aria-label="Search inventory items"
                />
                <div className="global-search-actions">
                  <button type="submit">Search</button>
                  {inventorySearchTerm ? (
                    <button type="button" onClick={clearInventorySearch}>
                      Clear
                    </button>
                  ) : null}
                </div>
              </form>
            ) : null}
          </div>
          <nav className="global-nav">
            {allowedNavItems.map((item) => (
              <button
                key={item.key}
                className={`global-nav-btn ${activeView === item.key ? "active" : ""}`}
                onClick={() => setActiveView(item.key)}
              >
                <NavIcon iconKey={NAV_ITEM_ICONS[item.key]} className="global-nav-icon" />
                <span className="global-nav-text">
                  {item.key === "logistics-requests" && currentUser.role === "logistics"
                    ? `Logistics Requests (${logisticsRequestNotificationCount})`
                    : item.label}
                </span>
              </button>
            ))}
          </nav>
          <button className="global-logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </aside>

        <nav className="mobile-bottom-nav" aria-label="Mobile dashboard navigation">
          {allowedNavItems.map((item) => (
            <button
              key={`mobile-${item.key}`}
              type="button"
              className={`mobile-nav-btn ${activeView === item.key ? "active" : ""}`}
              onClick={() => setActiveView(item.key)}
            >
              <NavIcon iconKey={NAV_ITEM_ICONS[item.key]} className="mobile-nav-icon" />
              <span className="mobile-nav-label">
                {NAV_ITEM_SHORT_LABELS[item.key] || item.label}
              </span>
            </button>
          ))}
          <button
            type="button"
            className="mobile-nav-btn mobile-logout-btn"
            onClick={handleLogout}
          >
            <NavIcon iconKey="logout" className="mobile-nav-icon" />
            <span className="mobile-nav-label">Logout</span>
          </button>
        </nav>

        <main className="content-grid">
          {(activeView === "warehouse-items" || activeView === "warehouse-orders" || activeView === "warehouse-request-items") && (canView("warehouse-items") || canView("warehouse-orders") || canView("warehouse-request-items")) ? (
            <div className="warehouse-dashboard">
              <div className="warehouse-content">
            {activeView === "warehouse-items" && canView("warehouse-items") ? (
              <>
                <form className="panel form-grid" onSubmit={addItem}>
              <h3>New Inventory Item</h3>
              <input
                placeholder="Item Name"
                name="name"
                value={itemForm.name}
                onChange={handleItemFormChange}
                required
              />
              {itemFormErrors.name && <p style={{ color: "var(--error-color)", fontSize: "12px", margin: "0" }}>{itemFormErrors.name}</p>}
              <input
                type="number"
                min="0"
                placeholder="Available Quantity"
                name="quantity"
                value={itemForm.quantity}
                onChange={handleItemFormChange}
                required
              />
              {itemFormErrors.quantity && <p style={{ color: "var(--error-color)", fontSize: "12px", margin: "0" }}>{itemFormErrors.quantity}</p>}
              <input
                type="number"
                min="0"
                placeholder="Daily Rental Price (LKR)"
                name="pricePerDay"
                value={itemForm.pricePerDay}
                onChange={handleItemFormChange}
                required
              />
              {itemFormErrors.pricePerDay && <p style={{ color: "var(--error-color)", fontSize: "12px", margin: "0" }}>{itemFormErrors.pricePerDay}</p>}
              <input
                type="file"
                accept="image/*"
                onChange={(event) =>
                  setItemForm((current) => ({ ...current, image: event.target.files[0] || null }))
                }
              />
              {itemForm.image && (
                <p style={{ fontSize: "12px", color: "var(--muted)", margin: "0" }}>
                  Selected: {itemForm.image.name}
                </p>
              )}
              <button type="submit">Add Item to Inventory</button>
            </form>

            <section className="panel">
              <h3>Warehouse Inventory Items</h3>
              {filteredInventoryItems.length > 0 ? (
                <div className="warehouse-inventory-grid">
                  {filteredInventoryItems.map((item) => (
                    <article key={item._id} className="warehouse-inventory-card">
                      <div className="warehouse-inventory-image-wrap">
                        {getInventoryImageSrc(item) ? (
                          <img
                            className="warehouse-inventory-image"
                            src={getInventoryImageSrc(item)}
                            alt={item.name}
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <div className="warehouse-inventory-image-placeholder">No image</div>
                        )}
                      </div>

                      <div className="warehouse-inventory-content">
                        {editingItemId === item._id ? (
                          <div className="warehouse-edit-fields">
                            <div>
                              <input
                                value={editingItemForm.name}
                                name="name"
                                onChange={handleEditingItemFormChange}
                                required
                              />
                              {editingItemFormErrors.name ? (
                                <p style={{ color: "var(--error-color)", fontSize: "11px", margin: "2px 0 0 0" }}>
                                  {editingItemFormErrors.name}
                                </p>
                              ) : null}
                            </div>
                            <div>
                              <input
                                type="number"
                                min="0"
                                value={editingItemForm.quantity}
                                name="quantity"
                                onChange={handleEditingItemFormChange}
                                required
                              />
                              {editingItemFormErrors.quantity ? (
                                <p style={{ color: "var(--error-color)", fontSize: "11px", margin: "2px 0 0 0" }}>
                                  {editingItemFormErrors.quantity}
                                </p>
                              ) : null}
                            </div>
                            <div>
                              <input
                                type="number"
                                min="0"
                                value={editingItemForm.pricePerDay}
                                name="pricePerDay"
                                onChange={handleEditingItemFormChange}
                                required
                              />
                              {editingItemFormErrors.pricePerDay ? (
                                <p style={{ color: "var(--error-color)", fontSize: "11px", margin: "2px 0 0 0" }}>
                                  {editingItemFormErrors.pricePerDay}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="warehouse-inventory-name">{item.name}</p>
                            <p className="warehouse-inventory-meta">Qty: {item.quantity}</p>
                            <p className="warehouse-inventory-price">{formatLkr(item.pricePerDay)} / day</p>
                          </>
                        )}

                        <div className="warehouse-item-actions">
                          {editingItemId === item._id ? (
                            <>
                              <button type="button" onClick={() => saveItemEdit(item._id)}>
                                Save Item
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingItemId("");
                                  setEditingItemForm({ name: "", quantity: "", pricePerDay: "" });
                                  setEditingItemFormErrors({ name: "", quantity: "", pricePerDay: "" });
                                }}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button type="button" onClick={() => startEditItem(item)}>
                              Edit Item
                            </button>
                          )}

                          {damageItemId === item._id ? (
                            <>
                              <div className="warehouse-damage-fields">
                                <input
                                  type="number"
                                  min="1"
                                  max={item.quantity}
                                  placeholder="Damaged qty"
                                  name="damagedQuantity"
                                  value={damageForm.damagedQuantity}
                                  onChange={handleDamageFormChange}
                                  required
                                />
                                {damageFormErrors.damagedQuantity ? (
                                  <p style={{ color: "var(--error-color)", fontSize: "11px", margin: "0" }}>
                                    {damageFormErrors.damagedQuantity}
                                  </p>
                                ) : null}
                              </div>
                              <div className="warehouse-damage-fields">
                                <input
                                  placeholder="Reason for damage"
                                  name="reason"
                                  value={damageForm.reason}
                                  onChange={handleDamageFormChange}
                                  required
                                />
                                {damageFormErrors.reason ? (
                                  <p style={{ color: "var(--error-color)", fontSize: "11px", margin: "0" }}>
                                    {damageFormErrors.reason}
                                  </p>
                                ) : null}
                              </div>
                              <button
                                type="button"
                                className="danger"
                                onClick={() => saveDamagedItem(item._id)}
                              >
                                Save Damage
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setDamageItemId("");
                                  setDamageForm({ damagedQuantity: "", reason: "" });
                                  setDamageFormErrors({ damagedQuantity: "", reason: "" });
                                }}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              className="danger"
                              onClick={() => startDamageItem(item._id)}
                            >
                              Mark Damaged
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="note-text" style={{ textAlign: "center" }}>
                  No inventory items found for your search.
                </p>
              )}
            </section>

            <section className="panel">
              <h3>Item Loss Log</h3>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>Reason</th>
                      <th>Logged At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {damagedItems.map((item) => (
                      <tr key={item._id}>
                        <td>{item.name}</td>
                        <td>{item.quantity}</td>
                        <td>{formatLkr(item.pricePerDay)}</td>
                        <td>{item.reason}</td>
                        <td>{new Date(item.deletedAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : null}

        {activeView === "warehouse-orders" && canView("warehouse-orders") ? (
          <>
            <section className="panel">
              <h3>Warehouse Order Type</h3>
              <div className="button-group">
                <button type="button" onClick={() => setWarehouseOrderMode("single")}>
                  Single Item Order
                </button>
                <button type="button" onClick={() => setWarehouseOrderMode("multi")}>
                  Multiple Items Order
                </button>
              </div>
            </section>
            {warehouseOrderMode === "single" ? (
              <OrderForm
                source="warehouse"
                items={items}
                onCreated={loadAllData}
              />
            ) : (
              <MultiProductOrderForm
                source="warehouse"
                items={items}
                onCreated={loadAllData}
              />
            )}
            <OrdersTable
              orders={filteredOrders}
              onRefresh={loadAllData}
            />
          </>
        ) : null}

        {activeView === "warehouse-request-items" && canView("warehouse-request-items") ? (
          <>
            <form className="panel form-grid" onSubmit={createWarehouseRequest}>
              <h3>Request Items to Warehouse</h3>
              <select
                value={warehouseRequestForm.sourceShopId}
                onChange={(event) =>
                  setWarehouseRequestForm((current) => ({ ...current, sourceShopId: event.target.value }))
                }
                required
              >
                <option value="">Select Source Shop</option>
                {shops.map((shop) => (
                  <option key={shop._id} value={shop._id}>{shop.name}</option>
                ))}
              </select>

              <select
                value={warehouseRequestForm.itemId}
                onChange={(event) =>
                  setWarehouseRequestForm((current) => ({ ...current, itemId: event.target.value }))
                }
                required
              >
                <option value="">Select Item</option>
                {items.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name} | Stock {item.quantity}
                  </option>
                ))}
              </select>

              <input
                type="number"
                min="1"
                step="1"
                max={selectedWarehouseRequestItem ? Number(selectedWarehouseRequestItem.quantity || 0) : undefined}
                placeholder="Requested Quantity"
                value={warehouseRequestForm.requestedQuantity}
                onChange={(event) =>
                  setWarehouseRequestForm((current) => ({
                    ...current,
                    requestedQuantity: event.target.value
                  }))
                }
                required
              />

              {selectedWarehouseRequestItem ? (
                <p className="note-text">Available stock: {selectedWarehouseRequestItem.quantity}</p>
              ) : null}

              <textarea
                placeholder="Request notes"
                value={warehouseRequestForm.notes}
                onChange={(event) =>
                  setWarehouseRequestForm((current) => ({ ...current, notes: event.target.value }))
                }
              />
              <button type="submit">Request Items</button>
            </form>

            <section className="panel">
              <h3>Warehouse Item Requests</h3>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Quantity</th>
                      <th>From Shop</th>
                      <th>Status</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logisticsRequests.map((request) => (
                      <tr key={request._id}>
                        <td>{request.itemName || "-"}</td>
                        <td>{request.requestedQuantity || "-"}</td>
                        <td>{shops.find((shop) => shop._id === request.sourceShopId)?.name || "-"}</td>
                        <td>{request.status}</td>
                        <td>{request.notes || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : null}
              </div>
            </div>
          ) : null}

          {(activeView === "shop-items" || activeView === "shop-orders" || activeView === "shop-request-items") && (canView("shop-items") || canView("shop-orders") || canView("shop-request-items")) ? (
            <div className="shop-dashboard">
              <div className="shop-content">
                {activeView === "shop-items" && canView("shop-items") ? (
                  <section className="panel">
                    <h3>Shop Inventory Items</h3>
                    {filteredInventoryItems.length > 0 ? (
                      <div className="shop-inventory-grid">
                        {filteredInventoryItems.map((item) => (
                          <article key={item._id} className="shop-inventory-card">
                            <div className="shop-inventory-image-wrap">
                              {getInventoryImageSrc(item) ? (
                                <img
                                  className="shop-inventory-image"
                                  src={getInventoryImageSrc(item)}
                                  alt={item.name}
                                  loading="lazy"
                                  decoding="async"
                                />
                              ) : (
                                <div className="shop-inventory-image-placeholder">No image</div>
                              )}
                            </div>
                            <div className="shop-inventory-content">
                              <p className="shop-inventory-name">{item.name}</p>
                              <p className="shop-inventory-price">{formatLkr(item.pricePerDay)} / day</p>
                            </div>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <p className="note-text" style={{ textAlign: "center" }}>
                        No inventory items found for your search.
                      </p>
                    )}
                  </section>
                ) : null}

                {activeView === "shop-orders" && canView("shop-orders") ? (
                  <>
                    <section className="panel">
                      <h3>Shop Order Type</h3>
                      <div className="button-group">
                        <button type="button" onClick={() => setShopOrderMode("single")}>
                          Single Item Order
                        </button>
                        <button type="button" onClick={() => setShopOrderMode("multi")}>
                          Multiple Items Order
                        </button>
                      </div>
                    </section>
                    {shopOrderMode === "single" ? (
                      <OrderForm
                        source="shop"
                        items={items}
                        onCreated={loadAllData}
                      />
                    ) : (
                      <MultiProductOrderForm
                        source="shop"
                        items={items}
                        onCreated={loadAllData}
                      />
                    )}
                    <OrdersTable
                      orders={filteredOrders}
                      onRefresh={loadAllData}
                    />
                  </>
                ) : null}

                {activeView === "shop-request-items" && canView("shop-request-items") ? (
                  <>
                    <form className="panel form-grid" onSubmit={createShopRequest}>
                      <h3>Request Items to Shop</h3>
                      <select
                        value={shopRequestForm.sourceWarehouseId}
                        onChange={(event) =>
                          setShopRequestForm((current) => ({ ...current, sourceWarehouseId: event.target.value }))
                        }
                        required
                      >
                        <option value="">Select Source Warehouse</option>
                        {warehouses.map((warehouse) => (
                          <option key={warehouse._id} value={warehouse._id}>{warehouse.name}</option>
                        ))}
                      </select>

                      <select
                        value={shopRequestForm.itemId}
                        onChange={(event) =>
                          setShopRequestForm((current) => ({ ...current, itemId: event.target.value }))
                        }
                        required
                      >
                        <option value="">Select Item</option>
                        {items.map((item) => (
                          <option key={item._id} value={item._id}>
                            {item.name} | Stock {item.quantity}
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        min="1"
                        step="1"
                        max={selectedShopRequestItem ? Number(selectedShopRequestItem.quantity || 0) : undefined}
                        placeholder="Requested Quantity"
                        value={shopRequestForm.requestedQuantity}
                        onChange={(event) =>
                          setShopRequestForm((current) => ({
                            ...current,
                            requestedQuantity: event.target.value
                          }))
                        }
                        required
                      />

                      {selectedShopRequestItem ? (
                        <p className="note-text">Available stock: {selectedShopRequestItem.quantity}</p>
                      ) : null}

                      <textarea
                        placeholder="Request notes"
                        value={shopRequestForm.notes}
                        onChange={(event) =>
                          setShopRequestForm((current) => ({ ...current, notes: event.target.value }))
                        }
                      />
                      <button type="submit">Request Items</button>
                    </form>

                    <section className="panel">
                      <h3>Shop Item Requests</h3>
                      <div className="table-wrap">
                        <table>
                          <thead>
                            <tr>
                              <th>Item</th>
                              <th>Quantity</th>
                              <th>From Warehouse</th>
                              <th>Status</th>
                              <th>Notes</th>
                            </tr>
                          </thead>
                          <tbody>
                            {logisticsRequests.map((request) => (
                              <tr key={request._id}>
                                <td>{request.itemName || "-"}</td>
                                <td>{request.requestedQuantity || "-"}</td>
                                <td>{warehouses.find((warehouse) => warehouse._id === request.sourceWarehouseId)?.name || "-"}</td>
                                <td>{request.status}</td>
                                <td>{request.notes || "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  </>
                ) : null}
              </div>
            </div>
          ) : null}

          {isLogisticsSectionView && canView(activeView) ? (
            <LogisticsDashboard
              logisticsForm={logisticsForm}
              setLogisticsForm={setLogisticsForm}
              orders={orders}
              items={items}
              getInventoryImageSrc={getInventoryImageSrc}
              warehouses={warehouses}
              shops={shops}
              logisticsRequests={logisticsRequests}
              auditLogs={auditLogs}
              currentUser={currentUser}
              onDeleteAudit={deleteAuditLog}
              onCreateRequest={createLogisticsRequest}
              onChangeStatus={changeLogisticsStatus}
              onDeleteRequest={deleteLogisticsRequest}
              onExportAudit={exportAuditPDF}
              activeSection={logisticsSection}
            />
          ) : null}

          {(activeView === "admin" || isAdminSectionView) && (canView("admin") || isAdminSectionView) ? (
            <AdminDashboard
              warehouseForm={warehouseForm}
              setWarehouseForm={setWarehouseForm}
              onCreateWarehouse={createWarehouse}
              onDeleteWarehouse={deleteWarehouse}
              staffForm={staffForm}
              setStaffForm={setStaffForm}
              staffError={staffError}
              onCreateStaff={createStaff}
              onUpdateStaff={updateStaff}
              warehouses={warehouses}
              shops={shops}
              staff={staff}
              activeSection={adminSection}
              onSectionChange={(sectionId) => {
                const nextView = Object.keys(ADMIN_VIEW_TO_SECTION).find(
                  (viewKey) => ADMIN_VIEW_TO_SECTION[viewKey] === sectionId
                );
                setActiveView(nextView || "admin-new-warehouse");
              }}
              onDeleteStaff={deleteStaff}
              onLogout={handleLogout}
            />
          ) : null}

          {isAnalyticsSectionView && canView(activeView) ? (
            <AnalyticsNotificationDashboard
              notificationForm={notificationForm}
              setNotificationForm={setNotificationForm}
              onCreateNotification={createNotification}
              notifications={notifications}
              onDeleteNotification={deleteNotification}
              analytics={analytics}
              alertStats={alertStats}
              formatLkr={formatLkr}
              activeSection={analyticsSection}
            />
          ) : null}

          {isRentalSectionView && canView(activeView) ? (
            <RentalProcessingDashboard
              orders={orders}
              rentalRecords={rentalRecords}
              items={items}
              onRefresh={loadAllData}
              formatLkr={formatLkr}
              activeSection={rentalSection}
            />
          ) : null}
        </main>
      </div>
      <zapier-interfaces-chatbot-embed is-popup='true' chatbot-id='cmohi0691005cc55s82roeulk'></zapier-interfaces-chatbot-embed>
    </div>
  );
}

export default App;
