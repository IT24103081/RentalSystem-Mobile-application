import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

const apiRequest = async (path, options = {}) => {
  const token = localStorage.getItem("rental_auth_token");
  const baseHeaders = { "Content-Type": "application/json" };
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

const formatDateInput = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.valueOf())) {
    return "";
  }
  return date.toISOString().split("T")[0];
};

function CreateRentalRecordModal({ onClose, onSuccess, formatLkr, items }) {
  const today = formatDateInput(new Date());
  const [formData, setFormData] = useState({
    customerName: "",
    itemName: "",
    quantity: 1,
    givingDate: today,
    returnDate: today,
    totalAmount: "",
    sourceType: "warehouse",
    notes: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "quantity" ? (value === "" ? "" : parseInt(value, 10)) :
        name === "totalAmount" ? (value === "" ? "" : parseFloat(value)) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.customerName || !formData.itemName || !formData.givingDate || !formData.returnDate || !formData.totalAmount) {
      setError("Please fill in all required fields");
      return;
    }

    if (!Number.isInteger(Number(formData.quantity)) || Number(formData.quantity) < 1) {
      setError("Quantity must be a whole number greater than 0");
      return;
    }

    if (formData.givingDate < today) {
      setError("Giving date cannot be in the past");
      return;
    }

    if (formData.returnDate < today) {
      setError("Return date cannot be in the past");
      return;
    }

    if (formData.returnDate < formData.givingDate) {
      setError("Return date cannot be before giving date");
      return;
    }

    setLoading(true);

    try {
      await apiRequest("/api/rental-records", {
        method: "POST",
        body: JSON.stringify({
          ...formData,
          status: "finalized"
        })
      });

      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
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
      }}
    >
      <div
        className="modal-content panel form-grid"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "600px",
          width: "90%",
          maxHeight: "90vh",
          overflow: "auto"
        }}
      >
        <h3>Create New Rental Record</h3>

        {error && <p className="error-text">{error}</p>}

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "12px" }}>
          <label>
            <strong>Customer Name *</strong>
            <input
              type="text"
              name="customerName"
              value={formData.customerName}
              onChange={handleChange}
              placeholder="Enter customer name"
            />
          </label>

          <label>
            <strong>Item *</strong>
            <select
              name="itemName"
              value={formData.itemName}
              onChange={handleChange}
              required
            >
              <option value="">Select item</option>
              {(items || []).map((item) => (
                <option key={item._id} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <label>
              <strong>Quantity *</strong>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                min="1"
                step="1"
                required
              />
            </label>

            <label>
              <strong>Source Type *</strong>
              <select
                name="sourceType"
                value={formData.sourceType}
                onChange={handleChange}
              >
                <option value="warehouse">Warehouse</option>
                <option value="shop">Shop</option>
              </select>
            </label>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <label>
              <strong>Giving Date *</strong>
              <input
                type="date"
                name="givingDate"
                value={formData.givingDate}
                onChange={handleChange}
                min={today}
                required
              />
            </label>

            <label>
              <strong>Return Date *</strong>
              <input
                type="date"
                name="returnDate"
                value={formData.returnDate}
                onChange={handleChange}
                min={formData.givingDate || today}
                required
              />
            </label>
          </div>

          <label>
            <strong>Total Amount (LKR) *</strong>
            <input
              type="number"
              name="totalAmount"
              value={formData.totalAmount}
              onChange={handleChange}
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </label>

          <label>
            <strong>Notes</strong>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Add any notes about this rental..."
              style={{ minHeight: "100px" }}
            />
          </label>

          <div className="button-group">
            <button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Record"}
            </button>
            <button type="button" onClick={onClose} style={{ background: "var(--muted)" }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddNoteModal({ order, onClose, onSuccess, formatLkr }) {
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const rentalData = {
        orderId: order._id,
        customerName: order.customerName,
        itemName: order.itemSnapshot?.name || "Unknown Item",
        quantity: order.quantity,
        givingDate: order.givingDate,
        returnDate: order.returnDate,
        totalAmount: order.totalDue,
        sourceType: order.orderSource,
        status: "finalized",
        notes: notes
      };

      await apiRequest("/api/rental-records", {
        method: "POST",
        body: JSON.stringify(rentalData)
      });

      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
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
      }}
    >
      <div
        className="modal-content panel form-grid"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "600px",
          width: "90%",
          maxHeight: "90vh",
          overflow: "auto"
        }}
      >
        <h3>Add Note to Rental Record</h3>

        {error && <p className="error-text">{error}</p>}

        <div style={{ background: "var(--surface-soft)", padding: "12px", borderRadius: "8px", marginBottom: "12px" }}>
           <h4 style={{ margin: "0 0 8px 0" }}>Order Details</h4>
          <p style={{ margin: "4px 0" }}><strong>Customer:</strong> {order.customerName}</p>
          <p style={{ margin: "4px 0" }}><strong>Address:</strong> {order.address}</p>
          <p style={{ margin: "4px 0" }}><strong>Phone:</strong> {order.phone}</p>
          <p style={{ margin: "4px 0" }}><strong>Item:</strong> {order.itemSnapshot?.name}</p>
          <p style={{ margin: "4px 0" }}><strong>Quantity:</strong> {order.quantity}</p>
          <p style={{ margin: "4px 0" }}><strong>Giving Date:</strong> {new Date(order.givingDate).toLocaleDateString()}</p>
          <p style={{ margin: "4px 0" }}><strong>Return Date:</strong> {new Date(order.returnDate).toLocaleDateString()}</p>
          <p style={{ margin: "4px 0" }}><strong>Total Amount:</strong> {formatLkr(order.totalDue)}</p>
          <p style={{ margin: "4px 0" }}><strong>Source:</strong> {order.orderSource}</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "12px" }}>
          <label>
            <strong>Rental Manager Notes</strong>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add important notes about this rental..."
              style={{ minHeight: "120px" }}
            />
          </label>

          <div className="button-group">
            <button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save & Record"}
            </button>
            <button type="button" onClick={onClose} style={{ background: "var(--muted)" }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditRecordModal({ record, onClose, onSuccess, formatLkr }) {
  const [formData, setFormData] = useState({
    customerName: record.customerName || "",
    itemName: record.itemName || "",
    quantity: record.quantity || 1,
    givingDate: record.givingDate?.split("T")[0] || "",
    returnDate: record.returnDate?.split("T")[0] || "",
    totalAmount: record.totalAmount || "",
    sourceType: record.sourceType || "warehouse",
    status: record.status || "finalized",
    notes: record.notes || ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "quantity" || name === "totalAmount" ? parseFloat(value) || value : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.customerName || !formData.itemName || !formData.givingDate || !formData.returnDate || !formData.totalAmount) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      await apiRequest(`/api/rental-records/${record._id}`, {
        method: "PUT",
        body: JSON.stringify(formData)
      });
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
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
      }}
    >
      <div
        className="modal-content panel form-grid"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "600px",
          width: "90%",
          maxHeight: "90vh",
          overflow: "auto"
        }}
      >
        <h3>Edit Rental Record</h3>

        {error && <p className="error-text">{error}</p>}

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "12px" }}>
          <label>
            <strong>Customer Name *</strong>
            <input
              type="text"
              name="customerName"
              value={formData.customerName}
              onChange={handleChange}
              placeholder="Enter customer name"
            />
          </label>

          <label>
            <strong>Item Name *</strong>
            <input
              type="text"
              name="itemName"
              value={formData.itemName}
              onChange={handleChange}
              placeholder="Enter item name"
            />
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <label>
              <strong>Quantity *</strong>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                min="1"
              />
            </label>

            <label>
              <strong>Source Type *</strong>
              <select
                name="sourceType"
                value={formData.sourceType}
                onChange={handleChange}
              >
                <option value="warehouse">Warehouse</option>
                <option value="shop">Shop</option>
              </select>
            </label>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <label>
              <strong>Giving Date *</strong>
              <input
                type="date"
                name="givingDate"
                value={formData.givingDate}
                onChange={handleChange}
              />
            </label>

            <label>
              <strong>Return Date *</strong>
              <input
                type="date"
                name="returnDate"
                value={formData.returnDate}
                onChange={handleChange}
              />
            </label>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <label>
              <strong>Total Amount (LKR) *</strong>
              <input
                type="number"
                name="totalAmount"
                value={formData.totalAmount}
                onChange={handleChange}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </label>

            <label>
              <strong>Status *</strong>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="finalized">Finalized</option>
                <option value="returned">Returned</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>
          </div>

          <label>
            <strong>Notes</strong>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Add any notes about this rental..."
              style={{ minHeight: "100px" }}
            />
          </label>

          <div className="button-group">
            <button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Save Changes"}
            </button>
            <button type="button" onClick={onClose} style={{ background: "var(--muted)" }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RentalProcessingDashboard({ orders, rentalRecords, onRefresh, formatLkr, activeSection, items }) {
  const [addNoteToOrder, setAddNoteToOrder] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState("");
  const selectedSection = activeSection || "finalized-orders";

  const handleDelete = async (recordId) => {
    if (!window.confirm("Are you sure you want to delete this rental record?")) {
      return;
    }

    try {
      await apiRequest(`/api/rental-records/${recordId}`, { method: "DELETE" });
      onRefresh();
    } catch (err) {
      setError(err.message);
    }
  };

  const finalizedOrders = orders?.filter((order) => order.status === "completed") || [];
  const activeOrders = orders?.filter((order) => order.status === "active") || [];

  return (
    <div className="admin-dashboard">
      <main className="admin-content">
        {error && (
          <section className="panel">
            <p className="error-text">{error}</p>
          </section>
        )}

        {selectedSection === "finalized-orders" && (
          <section className="panel">
            <h3>Finalized Orders</h3>
            {finalizedOrders.length === 0 ? (
              <p className="note-text">No finalized orders at the moment.</p>
            ) : (
              <div style={{ display: "grid", gap: "16px" }}>
                {finalizedOrders.map((order) => (
                  <div
                    key={order._id}
                    style={{
                      border: "1px solid var(--line)",
                      borderRadius: "8px",
                      padding: "14px",
                      background: "#f5faf5"
                    }}
                  >
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                      <div>
                        <p style={{ margin: "4px 0", fontSize: "14px" }}>
                          <strong>Customer:</strong> {order.customerName}
                        </p>
                        <p style={{ margin: "4px 0", fontSize: "14px" }}>
                          <strong>Address:</strong> {order.address}
                        </p>
                        <p style={{ margin: "4px 0", fontSize: "14px" }}>
                          <strong>Phone:</strong> {order.phone}
                        </p>
                      </div>
                      <div>
                        <p style={{ margin: "4px 0", fontSize: "14px" }}>
                          <strong>Item:</strong> {order.itemSnapshot?.name}
                        </p>
                        <p style={{ margin: "4px 0", fontSize: "14px" }}>
                          <strong>Quantity:</strong> {order.quantity}
                        </p>
                        <p style={{ margin: "4px 0", fontSize: "14px" }}>
                          <strong>Source:</strong> {order.orderSource}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                      <p style={{ margin: "4px 0", fontSize: "14px" }}>
                        <strong>Giving:</strong> {new Date(order.givingDate).toLocaleDateString()}
                      </p>
                      <p style={{ margin: "4px 0", fontSize: "14px" }}>
                        <strong>Return:</strong> {new Date(order.returnDate).toLocaleDateString()}
                      </p>
                      <p style={{ margin: "4px 0", fontSize: "14px" }}>
                        <strong>Total:</strong> {formatLkr(order.totalDue)}
                      </p>
                    </div>

                    <button onClick={() => setAddNoteToOrder(order)}>Add Note & Record</button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {selectedSection === "active-orders" && (
          <section className="panel">
            <h3>Active Rental Orders</h3>
            {activeOrders.length === 0 ? (
              <p className="note-text">No active rental orders at the moment.</p>
            ) : (
              <div style={{ display: "grid", gap: "16px" }}>
                {activeOrders.map((order) => (
                  <div
                    key={order._id}
                    style={{
                      border: "1px solid var(--line)",
                      borderRadius: "8px",
                      padding: "14px",
                      background: "#fafaf8"
                    }}
                  >
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                      <div>
                        <p style={{ margin: "4px 0", fontSize: "14px" }}>
                          <strong>Customer:</strong> {order.customerName}
                        </p>
                        <p style={{ margin: "4px 0", fontSize: "14px" }}>
                          <strong>Address:</strong> {order.address}
                        </p>
                        <p style={{ margin: "4px 0", fontSize: "14px" }}>
                          <strong>Phone:</strong> {order.phone}
                        </p>
                      </div>
                      <div>
                        <p style={{ margin: "4px 0", fontSize: "14px" }}>
                          <strong>Item:</strong> {order.itemSnapshot?.name}
                        </p>
                        <p style={{ margin: "4px 0", fontSize: "14px" }}>
                          <strong>Quantity:</strong> {order.quantity}
                        </p>
                        <p style={{ margin: "4px 0", fontSize: "14px" }}>
                          <strong>Source:</strong> {order.orderSource}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                      <p style={{ margin: "4px 0", fontSize: "14px" }}>
                        <strong>Giving:</strong> {new Date(order.givingDate).toLocaleDateString()}
                      </p>
                      <p style={{ margin: "4px 0", fontSize: "14px" }}>
                        <strong>Return:</strong> {new Date(order.returnDate).toLocaleDateString()}
                      </p>
                      <p style={{ margin: "4px 0", fontSize: "14px" }}>
                        <strong>Total:</strong> {formatLkr(order.totalDue)}
                      </p>
                    </div>

                    <button onClick={() => setAddNoteToOrder(order)}>Add Note & Record</button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {selectedSection === "records" && (
          <section className="panel">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0 }}>Rental Records</h3>
              <button onClick={() => setShowCreateModal(true)} style={{ background: "var(--primary-dark)" }}>
                 Create New Record
              </button>
            </div>
            {rentalRecords.length === 0 ? (
              <p className="note-text">No rental records yet.</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Item</th>
                      <th>Quantity</th>
                      <th>Giving Date</th>
                      <th>Return Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Notes</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rentalRecords.map((record) => (
                      <tr key={record._id}>
                        <td>{record.customerName}</td>
                        <td>{record.itemName}</td>
                        <td>{record.quantity}</td>
                        <td>{new Date(record.givingDate).toLocaleDateString()}</td>
                        <td>{new Date(record.returnDate).toLocaleDateString()}</td>
                        <td>{formatLkr(record.totalAmount)}</td>
                        <td>
                          <span className={`status-pill ${record.status}`}>
                            {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                          </span>
                        </td>
                        <td style={{ maxWidth: "200px", whiteSpace: "normal" }}>
                          {record.notes || "-"}
                        </td>
                        <td>
                          <div className="button-group">
                            <button className="danger" onClick={() => handleDelete(record._id)}>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {addNoteToOrder && (
          <AddNoteModal
            order={addNoteToOrder}
            onClose={() => setAddNoteToOrder(null)}
            onSuccess={() => {
              setAddNoteToOrder(null);
              onRefresh();
            }}
            formatLkr={formatLkr}
          />
        )}

        {editingRecord && (
          <EditRecordModal
            record={editingRecord}
            onClose={() => setEditingRecord(null)}
            onSuccess={() => {
              setEditingRecord(null);
              onRefresh();
            }}
            formatLkr={formatLkr}
          />
        )}

        {showCreateModal && (
          <CreateRentalRecordModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false);
              onRefresh();
            }}
            formatLkr={formatLkr}
            items={items}
          />
        )}
      </main>
    </div>
  );
}

export default RentalProcessingDashboard;
