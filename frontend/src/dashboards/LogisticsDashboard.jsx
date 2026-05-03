import { useState, useMemo } from "react";

const formatLkr = (value) =>
  new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0
  }).format(Number(value || 0));

function LogisticsDashboard({
  logisticsForm,
  setLogisticsForm,
  orders,
  items,
  getInventoryImageSrc,
  warehouses,
  shops,
  logisticsRequests,
  auditLogs,
  onCreateRequest,
  onChangeStatus,
  onDeleteRequest,
  onExportAudit,
  activeSection
}) {
  const [expandedAuditId, setExpandedAuditId] = useState(null);

  const selectedSection = activeSection || "request-form";

  const availableShops = useMemo(() => {
    if (!logisticsForm.sourceWarehouseId) return shops;
    return shops.filter((shop) => shop.warehouseId === logisticsForm.sourceWarehouseId);
  }, [shops, logisticsForm.sourceWarehouseId]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (logisticsForm.type !== "order_dispatch") return true;
      if (logisticsForm.sourceWarehouseId && order.warehouseId !== logisticsForm.sourceWarehouseId) return false;
      if (logisticsForm.sourceShopId && order.shopId !== logisticsForm.sourceShopId) return false;
      return true;
    });
  }, [orders, logisticsForm]);

  const selectedOrder = useMemo(() => {
    if (!logisticsForm.orderId) return null;
    return filteredOrders.find((order) => order._id === logisticsForm.orderId) || null;
  }, [filteredOrders, logisticsForm.orderId]);

  const selectedItem = useMemo(() => {
    if (!logisticsForm.itemId) return null;
    return items.find((item) => item._id === logisticsForm.itemId) || null;
  }, [items, logisticsForm.itemId]);

  const warehouseNameById = useMemo(() => {
    const map = new Map();
    warehouses.forEach((warehouse) => map.set(String(warehouse._id), warehouse.name));
    return map;
  }, [warehouses]);

  const shopNameById = useMemo(() => {
    const map = new Map();
    shops.forEach((shop) => map.set(String(shop._id), shop.name));
    return map;
  }, [shops]);

  const orderById = useMemo(() => {
    const map = new Map();
    orders.forEach((order) => {
      if (order?._id) {
        map.set(order._id.toString(), order);
      }
    });
    return map;
  }, [orders]);

  const findItemByName = (name) => {
    if (!name) return null;
    const exact = items.find((item) => item.name === name);
    if (exact) return exact;

    const normalized = name.trim().toLowerCase();
    return (
      items.find((item) => item.name?.trim().toLowerCase() === normalized) ||
      null
    );
  };

  const getRequestOrder = (request) => {
    if (!request?.orderId) return null;
    const rawId = typeof request.orderId === "string" ? request.orderId : request.orderId?._id;
    if (!rawId) return null;
    return orderById.get(rawId.toString()) || null;
  };

  const getRequestPrimaryItemName = (requestOrder) => {
    if (!requestOrder) return null;
    if (requestOrder.itemSnapshot?.name) return requestOrder.itemSnapshot.name;
    if (requestOrder.lineItems?.length) return requestOrder.lineItems[0].itemName;
    return null;
  };

  const handleAuditView = (auditId) => {
    setExpandedAuditId((current) => (current === auditId ? null : auditId));
  };

  const handleAuditExport = async (auditId) => {
    if (typeof onExportAudit === "function") {
      await onExportAudit(auditId);
    }
  };

  return (
    <div className="admin-dashboard">
      <main className="admin-content">
        {selectedSection === "request-form" && (
          <form className="panel form-grid" onSubmit={onCreateRequest}>
            <h3>Create Logistics Request</h3>
            
            <select
              value={logisticsForm.transferDirection}
              onChange={(event) =>
                setLogisticsForm((current) => ({
                  ...current,
                  transferDirection: event.target.value,
                  sourceWarehouseId: "",
                  sourceShopId: "",
                  targetWarehouseId: "",
                  targetShopId: ""
                }))
              }
            >
              <option value="warehouse_to_shop">Warehouse to Shop</option>
              <option value="shop_to_warehouse">Shop to Warehouse</option>
            </select>

            {logisticsForm.transferDirection === "warehouse_to_shop" ? (
              <>
                <select
                  value={logisticsForm.sourceWarehouseId}
                  onChange={(event) =>
                    setLogisticsForm((current) => ({
                      ...current,
                      sourceWarehouseId: event.target.value,
                      sourceShopId: ""
                    }))
                  }
                >
                  <option value="">Select Source Warehouse</option>
                  {warehouses.map((warehouse) => (
                    <option key={warehouse._id} value={warehouse._id}>
                      {warehouse.name}
                    </option>
                  ))}
                </select>

                {logisticsForm.sourceWarehouseId && (
                  <select
                    value={logisticsForm.targetShopId}
                    onChange={(event) =>
                      setLogisticsForm((current) => ({ ...current, targetShopId: event.target.value }))
                    }
                  >
                    <option value="">Select Target Shop</option>
                    {availableShops.map((shop) => (
                      <option key={shop._id} value={shop._id}>
                        {shop.name}
                      </option>
                    ))}
                  </select>
                )}
              </>
            ) : (
              <>
                <select
                  value={logisticsForm.sourceShopId}
                  onChange={(event) =>
                    setLogisticsForm((current) => ({
                      ...current,
                      sourceShopId: event.target.value,
                      sourceWarehouseId: ""
                    }))
                  }
                >
                  <option value="">Select Source Shop</option>
                  {shops.map((shop) => (
                    <option key={shop._id} value={shop._id}>
                      {shop.name}
                    </option>
                  ))}
                </select>

                {logisticsForm.sourceShopId && (
                  <select
                    value={logisticsForm.targetWarehouseId}
                    onChange={(event) =>
                      setLogisticsForm((current) => ({ ...current, targetWarehouseId: event.target.value }))
                    }
                  >
                    <option value="">Select Target Warehouse</option>
                    {warehouses.map((warehouse) => (
                      <option key={warehouse._id} value={warehouse._id}>
                        {warehouse.name}
                      </option>
                    ))}
                  </select>
                )}
              </>
            )}

            <div className="stock-grid-section">
              <h4 style={{ margin: "12px 0 8px 0", fontSize: "14px", fontWeight: "600" }}>Available Stock</h4>
              <div className="stock-grid">
                {items.map((item) => (
                  <article key={item._id} className="stock-item">
                    {getInventoryImageSrc(item) ? (
                      <img
                        className="logistics-stock-image"
                        src={getInventoryImageSrc(item)}
                        alt={item.name}
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="logistics-stock-placeholder">No image</div>
                    )}
                    <p style={{ margin: "0 0 6px 0", fontWeight: "600" }}>{item.name}</p>
                    <p style={{ margin: "0", fontSize: "13px", color: "var(--text-muted)" }}>
                      Stock: <strong>{item.quantity}</strong> units
                    </p>
                    <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "var(--text-muted)" }}>
                      Price: <strong>{formatLkr(item.pricePerDay)}</strong>/day
                    </p>
                  </article>
                ))}
              </div>
            </div>

            <select
              value={logisticsForm.orderId}
              onChange={(event) =>
                setLogisticsForm((current) => {
                  const nextOrderId = event.target.value;
                  const nextOrder = filteredOrders.find((order) => order._id === nextOrderId);

                  if (!nextOrderId || !nextOrder) {
                    return { ...current, orderId: nextOrderId };
                  }

                  const nextItemId = nextOrder.itemId || "";
                  return {
                    ...current,
                    orderId: nextOrderId,
                    itemId: nextItemId,
                    requestedQuantity: Number(nextOrder.quantity || current.requestedQuantity || 1)
                  };
                })
              }
            >
              <option value="">Attach Order (optional)</option>
              {filteredOrders.map((order) => (
                <option key={order._id} value={order._id}>
                  {order.customerName} | {order.itemSnapshot?.name || "Multiple items"} | {formatLkr(order.totalDue)}
                </option>
              ))}
            </select>

            <select
              value={logisticsForm.itemId}
              onChange={(event) =>
                setLogisticsForm((current) => ({ ...current, itemId: event.target.value }))
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

            <select
              value={String(logisticsForm.requestedQuantity || 1)}
              onChange={(event) =>
                setLogisticsForm((current) => ({
                  ...current,
                  requestedQuantity: Number(event.target.value || 1)
                }))
              }
            >
              <option value="1">Select Quantity (quick)</option>
              {Array.from({ length: Math.min(Number(selectedItem?.quantity || 10), 20) }, (_, index) => {
                const qty = index + 1;
                return (
                  <option key={qty} value={qty}>
                    {qty}
                  </option>
                );
              })}
            </select>

            <input
              type="number"
              min="1"
              placeholder="Quantity (manual)"
              value={logisticsForm.requestedQuantity}
              onChange={(event) =>
                setLogisticsForm((current) => ({
                  ...current,
                  requestedQuantity: event.target.value === "" ? "" : Number(event.target.value)
                }))
              }
              required
            />

            {selectedOrder ? (
              <p className="note-text">
                Attached order qty: {selectedOrder.quantity} | Selected request qty: {logisticsForm.requestedQuantity}
              </p>
            ) : null}

            {selectedItem ? (
              <p className="note-text">Selected item stock: {selectedItem.quantity}</p>
            ) : null}

            <textarea
              placeholder="Notes"
              value={logisticsForm.notes}
              onChange={(event) =>
                setLogisticsForm((current) => ({ ...current, notes: event.target.value }))
              }
            />
            <button type="submit">Submit Request</button>
          </form>
        )}

        {selectedSection === "requests" && (
      <section className="panel">
        <h3>Logistics Requests</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Type</th>
                <th>Requested Place</th>
                <th>Status</th>
                <th>Order</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {logisticsRequests.map((request) => {
                const requestOrder = getRequestOrder(request);
                const primaryItemName = getRequestPrimaryItemName(requestOrder) || request.itemName;
                const requestItem = findItemByName(primaryItemName);
                const requestImageSrc = requestItem ? getInventoryImageSrc(requestItem) : null;

                return (
                <tr key={request._id}>
                  <td>
                    <div className="logistics-request-item-cell">
                      {requestImageSrc ? (
                        <img
                          className="logistics-request-thumb"
                          src={requestImageSrc}
                          alt={primaryItemName || "Request item"}
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div className="logistics-request-thumb-placeholder">No image</div>
                      )}
                      <div>
                        <strong>{primaryItemName || "No linked order item"}</strong>
                        {request.requestedQuantity ? (
                          <p className="note-text">Qty {request.requestedQuantity}</p>
                        ) : null}
                        {requestOrder?.lineItems?.length > 1 ? (
                          <p className="note-text">+{requestOrder.lineItems.length - 1} more items</p>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td>{request.type}</td>
                  <td>
                    {request.targetWarehouseId
                      ? `Warehouse: ${warehouseNameById.get(String(request.targetWarehouseId)) || "Unknown"}`
                      : request.targetShopId
                        ? `Shop: ${shopNameById.get(String(request.targetShopId)) || "Unknown"}`
                        : "-"}
                  </td>
                  <td>
                    <select
                      value={request.status}
                      onChange={(event) => onChangeStatus(request._id, event.target.value)}
                    >
                      <option value="pending">pending</option>
                      <option value="accepted">accepted</option>
                      <option value="ready">ready</option>
                      <option value="received">received</option>
                      <option value="issued">issued</option>
                      <option value="rejected">rejected</option>
                    </select>
                  </td>
                  <td>{requestOrder ? `${requestOrder.customerName} | ${formatLkr(requestOrder.totalDue)}` : "-"}</td>
                  <td>{request.notes}</td>
                  <td>
                    <button className="danger" onClick={() => onDeleteRequest(request._id)}>
                      Remove Request
                    </button>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </section>
        )}

        {selectedSection === "audit" && (
      <section className="panel">
        <h3>Audit Log</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date Created</th>
                <th>Type</th>
                <th>Item</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs && auditLogs.map((log) => (
                <tr key={log._id}>
                  <td>{new Date(log.createdAt).toLocaleDateString()}</td>
                  <td>{log.type}</td>
                  <td>{log.itemInfo?.itemName || "-"}</td>
                  <td>{log.customerInfo?.name || "-"}</td>
                  <td>{log.requestStatus}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => handleAuditView(log._id)}
                    >
                      {expandedAuditId === log._id ? "Hide" : "View"}
                    </button>
                    <button type="button" onClick={() => handleAuditExport(log._id)}>
                      PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {expandedAuditId && (
          <div className="audit-detail" style={{ marginTop: "20px", padding: "20px", border: "1px solid var(--line)", borderRadius: "4px", backgroundColor: "var(--surface-strong)" }}>
            {auditLogs && auditLogs.find((log) => log._id === expandedAuditId) && (
              <>
                {(() => {
                  const log = auditLogs.find((l) => l._id === expandedAuditId);
                  return (
                    <>
                      <h4>Audit Report: {log._id}</h4>

                      {log.itemInfo && (
                        <>
                          <h5>Item Information</h5>
                          <p>
                            <strong>Item:</strong> {log.itemInfo.itemName}
                          </p>
                          <p>
                            <strong>Quantity:</strong> {log.itemInfo.quantity}
                          </p>
                          <p>
                            <strong>Price Per Day:</strong> {formatLkr(log.itemInfo.pricePerDay)}
                          </p>
                          <p>
                            <strong>Available Stock:</strong> {log.itemInfo.availableStock}
                          </p>
                        </>
                      )}

                      {log.customerInfo && (
                        <>
                          <h5>Customer Information</h5>
                          <p>
                            <strong>Name:</strong> {log.customerInfo.name}
                          </p>
                          <p>
                            <strong>Address:</strong> {log.customerInfo.address}
                          </p>
                          <p>
                            <strong>Phone:</strong> {log.customerInfo.phone}
                          </p>
                        </>
                      )}

                      {log.orderDetails && (
                        <>
                          <h5>Order Details</h5>
                          <p>
                            <strong>Order Date:</strong> {new Date(log.orderDetails.orderDate).toLocaleDateString()}
                          </p>
                          <p>
                            <strong>Giving Date:</strong> {new Date(log.orderDetails.givingDate).toLocaleDateString()}
                          </p>
                          <p>
                            <strong>Return Date:</strong> {new Date(log.orderDetails.returnDate).toLocaleDateString()}
                          </p>
                          <p>
                            <strong>Status:</strong> {log.orderDetails.status}
                          </p>
                          <p>
                            <strong>Total Due:</strong> {formatLkr(log.orderDetails.totalDue)}
                          </p>
                          <p>
                            <strong>Paid Amount:</strong> {formatLkr(log.orderDetails.paidAmount)}
                          </p>
                          <p>
                            <strong>Balance:</strong> {formatLkr(log.orderDetails.balance)}
                          </p>
                        </>
                      )}

                      {log.transferDetails && (
                        <>
                          <h5>Transfer Details</h5>
                          {log.transferDetails.sourceWarehouseName && (
                            <p>
                              <strong>Source Warehouse:</strong> {log.transferDetails.sourceWarehouseName}
                            </p>
                          )}
                          {log.transferDetails.sourceShopName && (
                            <p>
                              <strong>Source Shop:</strong> {log.transferDetails.sourceShopName}
                            </p>
                          )}
                          {log.transferDetails.targetWarehouseName && (
                            <p>
                              <strong>Target Warehouse:</strong> {log.transferDetails.targetWarehouseName}
                            </p>
                          )}
                          {log.transferDetails.targetShopName && (
                            <p>
                              <strong>Target Shop:</strong> {log.transferDetails.targetShopName}
                            </p>
                          )}
                        </>
                      )}

                      {log.notes && (
                        <>
                          <h5>Notes</h5>
                          <p>{log.notes}</p>
                        </>
                      )}
                    </>
                  );
                })()}
              </>
            )}
          </div>
        )}
      </section>
        )}
      </main>
    </div>
  );
}

export default LogisticsDashboard;
