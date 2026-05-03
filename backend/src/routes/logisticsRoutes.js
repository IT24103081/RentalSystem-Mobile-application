import express from "express";
import PDFDocument from "pdfkit";
import LogisticsRequest from "../models/LogisticsRequest.js";
import AuditLog from "../models/AuditLog.js";
import Order from "../models/Order.js";
import Item from "../models/Item.js";
import Warehouse from "../models/Warehouse.js";
import Shop from "../models/Shop.js";
import Notification from "../models/Notification.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

const formatLkr = (value) =>
  new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0
  }).format(Number(value || 0));

router.post("/logistics/requests", requireAuth, requireRole("logistics", "admin", "warehouse", "shop"), async (req, res) => {
  try {
    if ((req.user.role === "warehouse" || req.user.role === "shop") && !req.user.assignmentId) {
      return res.status(400).json({ message: "Requester assignment is required" });
    }

    req.body.requestedQuantity = Number(req.body.requestedQuantity);

    if (req.user.role === "warehouse") {
      req.body.type = "shop_transfer";
      req.body.targetWarehouseId = req.user.assignmentId;
      req.body.sourceWarehouseId = null;
      req.body.orderId = null;
      if (!req.body.sourceShopId) {
        return res.status(400).json({ message: "Source shop is required for warehouse requests" });
      }
    }

    if (req.user.role === "shop") {
      req.body.type = "order_dispatch";
      req.body.targetShopId = req.user.assignmentId;
      req.body.sourceShopId = null;
      req.body.orderId = null;
      if (!req.body.sourceWarehouseId) {
        return res.status(400).json({ message: "Source warehouse is required for shop requests" });
      }
    }

    if (!req.body.itemId) {
      return res.status(400).json({ message: "Item is required" });
    }

    if (!Number.isInteger(req.body.requestedQuantity) || req.body.requestedQuantity < 1) {
      return res.status(400).json({ message: "Quantity must be a whole number greater than 0" });
    }

    const selectedItem = await Item.findById(req.body.itemId);
    if (!selectedItem) {
      return res.status(400).json({ message: "Selected item not found" });
    }

    if (req.body.requestedQuantity > Number(selectedItem.quantity || 0)) {
      return res.status(400).json({
        message: `Requested quantity cannot exceed available stock (${selectedItem.quantity})`
      });
    }

    req.body.itemName = selectedItem.name;

    req.body.requestedByUserId = req.user.id;
    req.body.requestedByUsername = req.user.username;
    req.body.requestedByRole = req.user.role;

    const request = await LogisticsRequest.create(req.body);
    
    // Create audit log
    const auditData = {
      logisticsRequestId: request._id,
      type: request.type,
      transferDetails: {
        sourceWarehouseId: request.sourceWarehouseId,
        sourceShopId: request.sourceShopId,
        targetWarehouseId: request.targetWarehouseId,
        targetShopId: request.targetShopId
      },
      notes: request.notes,
      requestStatus: request.status,
      createdBy: req.user?._id
    };

    let hasItemInfo = false;

    // If order is attached, fetch its details
    if (request.orderId) {
      const order = await Order.findById(request.orderId).populate("itemId");
      if (order) {
        auditData.itemInfo = {
          itemId: order.itemId._id,
          itemName: order.itemSnapshot.name,
          quantity: order.quantity,
          pricePerDay: order.itemSnapshot.pricePerDay,
          availableStock: order.itemId.quantity
        };
        auditData.customerInfo = {
          name: order.customerName,
          address: order.address,
          phone: order.phone
        };
        auditData.orderDetails = {
          orderId: order._id,
          orderDate: order.orderDate,
          givingDate: order.givingDate,
          returnDate: order.returnDate,
          paymentType: order.paymentType,
          paidAmount: order.paidAmount,
          totalDue: order.totalDue,
          balance: order.balance,
          status: order.status
        };
        hasItemInfo = true;
      }
    }

    // Fallback to explicitly selected request item and quantity.
    if (!hasItemInfo && request.itemId) {
      const selectedItem = await Item.findById(request.itemId);
      if (selectedItem) {
        auditData.itemInfo = {
          itemId: selectedItem._id,
          itemName: selectedItem.name,
          quantity: request.requestedQuantity,
          pricePerDay: selectedItem.pricePerDay,
          availableStock: selectedItem.quantity
        };
      }
    }

    // Fetch warehouse and shop names for transfer details
    if (request.sourceWarehouseId) {
      const warehouse = await Warehouse.findById(request.sourceWarehouseId);
      if (warehouse) auditData.transferDetails.sourceWarehouseName = warehouse.name;
    }
    if (request.sourceShopId) {
      const shop = await Shop.findById(request.sourceShopId);
      if (shop) auditData.transferDetails.sourceShopName = shop.name;
    }
    if (request.targetWarehouseId) {
      const warehouse = await Warehouse.findById(request.targetWarehouseId);
      if (warehouse) auditData.transferDetails.targetWarehouseName = warehouse.name;
    }
    if (request.targetShopId) {
      const shop = await Shop.findById(request.targetShopId);
      if (shop) auditData.transferDetails.targetShopName = shop.name;
    }

    await AuditLog.create(auditData);

    await Notification.create({
      title: "Logistics Request Created",
      message: `Request ${request._id} has been created`,
      type: "alert",
      metadata: { requestId: request._id }
    });
    res.status(201).json(request);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/logistics/requests", requireAuth, requireRole("logistics", "admin", "warehouse", "shop"), async (req, res) => {
  try {
    let filter = {};

    if (req.user.role === "warehouse") {
      filter = { targetWarehouseId: req.user.assignmentId || null };
    }

    if (req.user.role === "shop") {
      filter = { targetShopId: req.user.assignmentId || null };
    }

    const requests = await LogisticsRequest.find(filter).sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/logistics/requests/:id", requireAuth, requireRole("logistics", "admin"), async (req, res) => {
  try {
    const request = await LogisticsRequest.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }
    return res.json(request);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.patch("/logistics/requests/:id/status", requireAuth, requireRole("logistics", "admin"), async (req, res) => {
  try {
    const { status } = req.body;
    const request = await LogisticsRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    request.status = status;
    await request.save();

    if (status === "ready") {
      await Notification.create({
        title: "Item Ready to Collect",
        message: `Request ${request._id} has been accepted and marked ready`,
        type: "alert",
        metadata: { requestId: request._id, status }
      });
    }

    return res.json(request);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.delete("/logistics/requests/:id", requireAuth, requireRole("logistics", "admin"), async (req, res) => {
  try {
    const result = await LogisticsRequest.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ message: "Request not found" });
    }

    return res.json({ message: "Request deleted" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/logistics/audit-logs", requireAuth, requireRole("logistics", "admin"), async (_req, res) => {
  try {
    const auditLogs = await AuditLog.find({})
      .populate("logisticsRequestId")
      .sort({ createdAt: -1 });
    res.json(auditLogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/logistics/audit-logs/:id", requireAuth, requireRole("logistics", "admin"), async (req, res) => {
  try {
    const auditLog = await AuditLog.findById(req.params.id).populate("logisticsRequestId");
    if (!auditLog) {
      return res.status(404).json({ message: "Audit log not found" });
    }
    res.json(auditLog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/logistics/audit-logs/:id/export", requireAuth, requireRole("logistics", "admin"), async (req, res) => {
  try {
    const auditLog = await AuditLog.findById(req.params.id).populate("logisticsRequestId");
    if (!auditLog) {
      return res.status(404).json({ message: "Audit log not found" });
    }

    // Generate PDF content
    const pdfBuffer = await generateAuditPDF(auditLog);
    
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="audit-${auditLog._id}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

function generateAuditPDF(auditLog) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("error", (err) => reject(err));
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    // Title
    doc.fontSize(20).text("Logistics Audit Report", { align: "center" });
    doc.moveDown();

    // Report metadata
    doc.fontSize(10);
    doc.text(`Report ID: ${auditLog._id}`, { align: "left" });
    doc.text(`Created: ${new Date(auditLog.createdAt).toLocaleDateString()}`, { align: "left" });
    doc.text(`Type: ${auditLog.type}`, { align: "left" });
    doc.moveDown();

    // Item Information
    if (auditLog.itemInfo && Object.keys(auditLog.itemInfo).length > 0) {
      doc.fontSize(14).text("Item Information", { underline: true });
      doc.fontSize(11);
      doc.text(`Item: ${auditLog.itemInfo.itemName || "N/A"}`);
      doc.text(`Quantity: ${auditLog.itemInfo.quantity || "N/A"}`);
      doc.text(`Price Per Day: ${formatLkr(auditLog.itemInfo.pricePerDay)}`);
      doc.text(`Available Stock: ${auditLog.itemInfo.availableStock || "N/A"}`);
      doc.moveDown();
    }

    // Customer Information
    if (auditLog.customerInfo && Object.keys(auditLog.customerInfo).length > 0) {
      doc.fontSize(14).text("Customer Information", { underline: true });
      doc.fontSize(11);
      doc.text(`Name: ${auditLog.customerInfo.name || "N/A"}`);
      doc.text(`Address: ${auditLog.customerInfo.address || "N/A"}`);
      doc.text(`Phone: ${auditLog.customerInfo.phone || "N/A"}`);
      doc.moveDown();
    }

    // Order Details
    if (auditLog.orderDetails && Object.keys(auditLog.orderDetails).length > 0) {
      doc.fontSize(14).text("Order Details", { underline: true });
      doc.fontSize(11);
      if (auditLog.orderDetails.orderDate) {
        doc.text(`Order Date: ${new Date(auditLog.orderDetails.orderDate).toLocaleDateString()}`);
      }
      if (auditLog.orderDetails.givingDate) {
        doc.text(`Giving Date: ${new Date(auditLog.orderDetails.givingDate).toLocaleDateString()}`);
      }
      if (auditLog.orderDetails.returnDate) {
        doc.text(`Return Date: ${new Date(auditLog.orderDetails.returnDate).toLocaleDateString()}`);
      }
      doc.text(`Status: ${auditLog.orderDetails.status || "N/A"}`);
      doc.text(`Total Due: ${formatLkr(auditLog.orderDetails.totalDue)}`);
      doc.text(`Paid Amount: ${formatLkr(auditLog.orderDetails.paidAmount)}`);
      doc.text(`Balance: ${formatLkr(auditLog.orderDetails.balance)}`);
      doc.moveDown();
    }

    // Transfer Details
    if (auditLog.transferDetails && Object.keys(auditLog.transferDetails).length > 0) {
      doc.fontSize(14).text("Transfer Details", { underline: true });
      doc.fontSize(11);
      if (auditLog.transferDetails.sourceWarehouseName) {
        doc.text(`Source Warehouse: ${auditLog.transferDetails.sourceWarehouseName}`);
      }
      if (auditLog.transferDetails.sourceShopName) {
        doc.text(`Source Shop: ${auditLog.transferDetails.sourceShopName}`);
      }
      if (auditLog.transferDetails.targetWarehouseName) {
        doc.text(`Target Warehouse: ${auditLog.transferDetails.targetWarehouseName}`);
      }
      if (auditLog.transferDetails.targetShopName) {
        doc.text(`Target Shop: ${auditLog.transferDetails.targetShopName}`);
      }
      doc.moveDown();
    }

    // Notes
    if (auditLog.notes) {
      doc.fontSize(14).text("Notes", { underline: true });
      doc.fontSize(11).text(auditLog.notes);
      doc.moveDown();
    }

    // End document
    doc.end();
  });
}

export default router;
