import { useState } from "react";

function AdminDashboard({
  warehouseForm,
  setWarehouseForm,
  onCreateWarehouse,
  onDeleteWarehouse,
  staffForm,
  setStaffForm,
  staffError,
  onCreateStaff,
  onUpdateStaff,
  warehouses,
  shops,
  staff,
  activeSection,
  onDeleteStaff
}) {
  const [editingStaffId, setEditingStaffId] = useState(null);
  const [editingStaffData, setEditingStaffData] = useState({});
  const selectedSection = activeSection || "new-warehouse";

  return (
    <div className="admin-dashboard">
      <main className="admin-content">
        <style>{`
          /* Mobile-friendly staff cards */
          .staff-card { border:1px solid var(--line); border-radius:8px; padding:12px; margin:8px 0; background:var(--panel-bg, #fff); }
          .staff-card .row { display:flex; justify-content:space-between; gap:12px; margin:6px 0; }
          .staff-card .label { color:var(--text-muted); font-size:12px; width:40%; }
          .staff-card .value { font-weight:600; width:60%; }
          .staff-card .actions { display:flex; gap:8px; margin-top:8px; flex-wrap:wrap; }
          .mobile-only { display:none; }
          @media (max-width: 780px) {
            .table-wrap { display:none; }
            .mobile-only { display:block; }
            .desktop-only { display:none; }
          }
        `}</style>
        {selectedSection === "new-warehouse" && (
          <form className="panel form-grid" onSubmit={onCreateWarehouse}>
        <h3>New Warehouse</h3>
        <input
          placeholder="Warehouse Name"
          value={warehouseForm.name}
          onChange={(event) =>
            setWarehouseForm((current) => ({ ...current, name: event.target.value }))
          }
          required
        />
        <input
          placeholder="Warehouse Code"
          value={warehouseForm.code}
          onChange={(event) =>
            setWarehouseForm((current) => ({ ...current, code: event.target.value }))
          }
          required
        />
        <input
          placeholder="Logistics Manager Name"
          value={warehouseForm.logisticsManagerName}
          onChange={(event) =>
            setWarehouseForm((current) => ({
              ...current,
              logisticsManagerName: event.target.value
            }))
          }
        />
        <button type="submit">Create Warehouse</button>
      </form>
        )}

        {selectedSection === "new-staff" && (
      <form className="panel form-grid" onSubmit={onCreateStaff}>
        <h3>New Staff Account</h3>
        {staffError ? <p className="error-text">{staffError}</p> : null}
        <p className="note-text">
          Enter username and password for staff. User ID is auto-generated and unique.
        </p>
        <input
          placeholder="Username"
          value={staffForm.username}
          onChange={(event) =>
            setStaffForm((current) => ({ ...current, username: event.target.value }))
          }
          required
        />
        <input
          placeholder="Password"
          type="password"
          value={staffForm.password}
          onChange={(event) =>
            setStaffForm((current) => ({ ...current, password: event.target.value }))
          }
          required
        />
        <select
          value={staffForm.role}
          onChange={(event) =>
            setStaffForm((current) => ({
              ...current,
              role: event.target.value,
              assignmentType:
                event.target.value === "warehouse"
                  ? "warehouse"
                  : event.target.value === "shop"
                    ? "shop"
                    : "none",
              assignmentId: ""
            }))
          }
        >
          <option value="admin">admin</option>
          <option value="warehouse">warehouse</option>
          <option value="shop">shop</option>
          <option value="logistics">logistics</option>
          <option value="analytics">analytics</option>
          <option value="rental">rental</option>
        </select>
        <select
          value={staffForm.assignmentType}
          onChange={(event) =>
            setStaffForm((current) => ({
              ...current,
              assignmentType: event.target.value,
              assignmentId: ""
            }))
          }
        >
          {(staffForm.role !== "warehouse" && staffForm.role !== "shop") ? (
            <option value="none">No assignment</option>
          ) : null}
          {staffForm.role !== "shop" ? <option value="warehouse">Warehouse</option> : null}
          {staffForm.role !== "warehouse" ? <option value="shop">Shop</option> : null}
        </select>
        {staffForm.assignmentType !== "none" ? (
          <select
            value={staffForm.assignmentId}
            onChange={(event) =>
              setStaffForm((current) => ({ ...current, assignmentId: event.target.value }))
            }
            required
          >
            <option value="">
              {staffForm.assignmentType === "warehouse" ? "Select warehouse" : "Select shop"}
            </option>
            {staffForm.assignmentType === "warehouse"
              ? warehouses.map((warehouse) => (
                  <option key={warehouse._id} value={warehouse._id}>
                    {warehouse.name}
                  </option>
                ))
              : null}
            {staffForm.assignmentType === "shop"
              ? shops.map((shop) => (
                  <option key={shop._id} value={shop._id}>
                    {shop.name}
                  </option>
                ))
              : null}
          </select>
        ) : null}
        <button type="submit">Create Staff</button>
      </form>
        )}

        {selectedSection === "warehouses" && (
      <section className="panel">
        <h3>Warehouses and Shops</h3>
        <div className="split-list">
          {warehouses.map((warehouse) => (
            <article key={warehouse._id}>
              <h4>
                {warehouse.name} ({warehouse.code})
              </h4>
              <p>Logistics manager: {warehouse.logisticsManagerName || "Not set"}</p>
              <ul>
                {(warehouse.shops || []).map((shop) => (
                  <li key={shop._id}>{shop.name}</li>
                ))}
              </ul>
              <button
                className="danger"
                onClick={() => {
                  if (confirm(`Delete warehouse "${warehouse.name}" and its shops?`)) {
                    onDeleteWarehouse(warehouse._id);
                  }
                }}
              >
                Delete Warehouse
              </button>
            </article>
          ))}
        </div>
      </section>
        )}

        {selectedSection === "staff" && (
      <section className="panel">
        <h3>Staff Accounts</h3>

        {/* Desktop table, hidden on small screens */}
        <div className="table-wrap desktop-only">
          <table>
            <thead>
              <tr>
                <th>User ID</th>
                <th>Username</th>
                <th>Role</th>
                <th>Assignment Type</th>
                <th>Assignment Id</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((member) => (
                <tr key={member._id}>
                  <td>{member.userId || "-"}</td>
                  <td>{member.username}</td>
                  <td>{member.role}</td>
                  <td>{member.assignmentType}</td>
                  <td>{member.assignmentId || "-"}</td>
                  <td>
                    <button
                      onClick={() => {
                        setEditingStaffId(member._id);
                        setEditingStaffData({
                          userId: member.userId,
                          username: member.username,
                          role: member.role,
                          assignmentType: member.assignmentType,
                          assignmentId: member.assignmentId
                        });
                      }}
                    >
                      Edit Account
                    </button>
                    <button
                      className="danger"
                      onClick={() => {
                        if (confirm(`Delete staff account "${member.username}"?`)) {
                          onDeleteStaff(member._id);
                        }
                      }}
                    >
                      Remove Account
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile stacked cards */}
        <div className="mobile-only">
          {staff.map((member) => (
            <article key={member._id} className="staff-card">
              {editingStaffId === member._id ? (
                <div>
                  <div className="row">
                    <div className="label">User ID</div>
                    <div className="value">{editingStaffData.userId || "-"}</div>
                  </div>
                  <div className="row">
                    <div className="label">Username</div>
                    <div className="value">
                      <input
                        type="text"
                        value={editingStaffData.username || ""}
                        onChange={(e) =>
                          setEditingStaffData((current) => ({ ...current, username: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                  <div className="row">
                    <div className="label">Role</div>
                    <div className="value">
                      <select
                        value={editingStaffData.role || ""}
                        onChange={(e) => setEditingStaffData((current) => ({ ...current, role: e.target.value }))}
                      >
                        <option value="admin">admin</option>
                        <option value="warehouse">warehouse</option>
                        <option value="shop">shop</option>
                        <option value="logistics">logistics</option>
                        <option value="analytics">analytics</option>
                        <option value="rental">rental</option>
                      </select>
                    </div>
                  </div>
                  <div className="row">
                    <div className="label">Assignment</div>
                    <div className="value">{editingStaffData.assignmentType || "-"} {editingStaffData.assignmentId ? `: ${editingStaffData.assignmentId}` : ""}</div>
                  </div>
                  <div className="row">
                    <div className="label">New Password</div>
                    <div className="value">
                      <input
                        type="password"
                        placeholder="New password (optional)"
                        value={editingStaffData.password || ""}
                        onChange={(e) => setEditingStaffData((current) => ({ ...current, password: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="actions">
                    <button
                      className="success"
                      onClick={() => {
                        const updates = { username: editingStaffData.username, role: editingStaffData.role };
                        if (editingStaffData.password) updates.password = editingStaffData.password;
                        onUpdateStaff(member._id, updates);
                        setEditingStaffId(null);
                      }}
                    >
                      Save
                    </button>
                    <button onClick={() => setEditingStaffId(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="row">
                    <div className="label">User ID</div>
                    <div className="value">{member.userId || "-"}</div>
                  </div>
                  <div className="row">
                    <div className="label">Username</div>
                    <div className="value">{member.username}</div>
                  </div>
                  <div className="row">
                    <div className="label">Role</div>
                    <div className="value">{member.role}</div>
                  </div>
                  <div className="row">
                    <div className="label">Assignment</div>
                    <div className="value">{member.assignmentType || "-"} {member.assignmentId ? `: ${member.assignmentId}` : ""}</div>
                  </div>
                  <div className="actions">
                    <button
                      onClick={() => {
                        setEditingStaffId(member._id);
                        setEditingStaffData({ userId: member.userId, username: member.username, role: member.role, assignmentType: member.assignmentType, assignmentId: member.assignmentId });
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="danger"
                      onClick={() => {
                        if (confirm(`Delete staff account "${member.username}"?`)) onDeleteStaff(member._id);
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;
