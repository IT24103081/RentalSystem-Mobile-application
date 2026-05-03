import express from "express";
import Item from "../models/Item.js";
import Order from "../models/Order.js";
import Notification from "../models/Notification.js";
import RentalRecord from "../models/RentalRecord.js";
import { calculateOrderTotals } from "../utils/orderBilling.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  validateCustomerName,
  validatePhoneNumber,
  validateAddress,
  validateQuantity
} from "../utils/validators.js";

const router = express.Router();

router.use(requireAuth);

const validateDates = (givingDate, returnDate) => {
  const start = new Date(givingDate);
  const end = new Date(returnDate);
  return !Number.isNaN(start.valueOf()) && !Number.isNaN(end.valueOf()) && end >= start;
};

router.post("/orders", requireRole("warehouse", "shop", "admin"), async (req, res) => {
  try {
    const {
      customerName,
      address,
      phone,
      itemId,
      quantity,
      orderSource,
      warehouseId,
      shopId,
      givingDate,
      returnDate,
      paymentType,
      paidAmount
    } = req.body;

    // Validate customer information
    const nameError = validateCustomerName(customerName);
    if (nameError) {
      return res.status(400).json({ message: nameError });
    }

    const phoneError = validatePhoneNumber(phone);
    if (phoneError) {
      return res.status(400).json({ message: phoneError });
    }

    const addressError = validateAddress(address);
    if (addressError) {
      return res.status(400).json({ message: addressError });
    }

    // Validate quantity
    const qtyError = validateQuantity(quantity);
    if (qtyError) {
      return res.status(400).json({ message: qtyError });
    }

    let finalOrderSource = orderSource;
    let finalWarehouseId = warehouseId || null;
    let finalShopId = shopId || null;

    if (req.user.role === "warehouse" && orderSource !== "warehouse") {
      return res.status(403).json({ message: "Warehouse staff can only create warehouse orders" });
    }

    if (req.user.role === "shop" && orderSource !== "shop") {
      return res.status(403).json({ message: "Shop staff can only create shop orders" });
    }

    if (req.user.role === "warehouse") {
      if (req.user.assignmentType !== "warehouse" || !req.user.assignmentId) {
        return res
          .status(403)
          .json({ message: "Warehouse account must be assigned to a warehouse" });
      }
      finalOrderSource = "warehouse";
      finalWarehouseId = req.user.assignmentId;
      finalShopId = null;
    }

    if (req.user.role === "shop") {
      if (req.user.assignmentType !== "shop" || !req.user.assignmentId) {
        return res.status(403).json({ message: "Shop account must be assigned to a shop" });
      }
      finalOrderSource = "shop";
      finalShopId = req.user.assignmentId;
      finalWarehouseId = null;
    }

    if (!validateDates(givingDate, returnDate)) {
      return res.status(400).json({ message: "Invalid giving/return dates" });
    }

    const item = await Item.findOne({ _id: itemId, isDeleted: false });
    if (!item) {
      return res.status(404).json({ message: "Selected item is not available" });
    }

    const qty = Number(quantity || 1);
    if (item.quantity < qty) {
      return res
        .status(400)
        .json({ message: `Quantity cannot exceed available stock (${item.quantity})` });
    }

    const billing = calculateOrderTotals({
      givingDate,
      returnDate,
      pricePerDay: item.pricePerDay,
      quantity: qty,
      paymentType,
      paidAmount
    });

    const order = await Order.create({ //save invoice
      customerName,
      address,
      phone,
      itemId,
      itemSnapshot: { name: item.name, pricePerDay: item.pricePerDay },
      quantity: qty,
      orderSource: finalOrderSource,
      warehouseId: finalWarehouseId,
      shopId: finalShopId,
      givingDate,
      returnDate,
      paymentType,
      paidAmount: billing.paidAmount,
      totalDue: billing.totalDue,
      balance: billing.balance // show credit balance
    });

    item.quantity -= qty;
    await item.save();

    await Notification.create({
      title: "New Order",
      message: `${order.orderSource.toUpperCase()} order created for ${order.customerName}`,
      type: "alert",
      metadata: { orderId: order._id, source: order.orderSource }
    });

    return res.status(201).json(order);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.get("/orders", requireRole("warehouse", "shop", "logistics", "admin", "rental"), async (req, res) => {
  try {
    const { source, status } = req.query;
    const filter = {};
    if (source) filter.orderSource = source;
    if (status) filter.status = status;

    if (req.user.role === "warehouse") {
      filter.orderSource = "warehouse";
      if (req.user.assignmentType === "warehouse" && req.user.assignmentId) {
        filter.warehouseId = req.user.assignmentId;
      }
    }

    if (req.user.role === "shop") {
      filter.orderSource = "shop";
      if (req.user.assignmentType === "shop" && req.user.assignmentId) {
        filter.shopId = req.user.assignmentId;
      }
    }

    const orders = await Order.find(filter)
      .populate("itemId", "name pricePerDay")
      .sort({ createdAt: -1 });

    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.put("/orders/:id", requireRole("warehouse", "shop", "admin"), async (req, res) => { // edit billing
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (req.user.role === "warehouse" && order.orderSource !== "warehouse") {
      return res.status(403).json({ message: "Forbidden for this order source" });
    }

    if (
      req.user.role === "warehouse" &&
      req.user.assignmentType === "warehouse" &&
      req.user.assignmentId &&
      order.warehouseId?.toString() !== req.user.assignmentId
    ) {
      return res.status(403).json({ message: "Forbidden for this warehouse assignment" });
    }

    if (req.user.role === "shop" && order.orderSource !== "shop") {
      return res.status(403).json({ message: "Forbidden for this order source" });
    }

    if (order.status === "completed" && status !== undefined && status !== "completed") {
      return res.status(400).json({ message: "Completed orders cannot be edited" });
    }

    if (
      req.user.role === "shop" &&
      req.user.assignmentType === "shop" &&
      req.user.assignmentId &&
      order.shopId?.toString() !== req.user.assignmentId
    ) {
      return res.status(403).json({ message: "Forbidden for this shop assignment" });
    }

    const {
      customerName,
      address,
      phone,
      givingDate,
      returnDate,
      paymentType,
      paidAmount,
      status
    } = req.body;

    if (givingDate || returnDate) {
      const newGivingDate = givingDate || order.givingDate;
      const newReturnDate = returnDate || order.returnDate;
      if (!validateDates(newGivingDate, newReturnDate)) {
        return res.status(400).json({ message: "Invalid giving/return dates" });
      }
      order.givingDate = newGivingDate;
      order.returnDate = newReturnDate;
    }

    if (customerName !== undefined) order.customerName = customerName;
    if (address !== undefined) order.address = address;
    if (phone !== undefined) order.phone = phone;
    if (paymentType !== undefined) order.paymentType = paymentType;
    if (status !== undefined) order.status = status;

    const billing = calculateOrderTotals({ // recalculate billing
      givingDate: order.givingDate,
      returnDate: order.returnDate,
      pricePerDay: order.itemSnapshot.pricePerDay,
      quantity: order.quantity,
      paymentType: order.paymentType,
      paidAmount: paidAmount !== undefined ? paidAmount : order.paidAmount,
      overdueDays: order.overdueDays
    });

    order.paidAmount = billing.paidAmount;
    order.totalDue = billing.totalDue;
    order.balance = billing.balance;

    await order.save();
    return res.json(order);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.delete("/orders/:id", requireRole("warehouse", "shop", "admin"), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (req.user.role === "warehouse" && order.orderSource !== "warehouse") {
      return res.status(403).json({ message: "Forbidden for this order source" });
    }

    if (
      req.user.role === "warehouse" &&
      req.user.assignmentType === "warehouse" &&
      req.user.assignmentId &&
      order.warehouseId?.toString() !== req.user.assignmentId
    ) {
      return res.status(403).json({ message: "Forbidden for this warehouse assignment" });
    }

    if (req.user.role === "shop" && order.orderSource !== "shop") {
      return res.status(403).json({ message: "Forbidden for this order source" });
    }

    if (
      req.user.role === "shop" &&
      req.user.assignmentType === "shop" &&
      req.user.assignmentId &&
      order.shopId?.toString() !== req.user.assignmentId
    ) {
      return res.status(403).json({ message: "Forbidden for this shop assignment" });
    }

    const item = await Item.findById(order.itemId);
    if (item && !item.isDeleted) {
      item.quantity += order.quantity;
      await item.save();
    }

    await Order.deleteOne({ _id: order._id });
    return res.json({ message: "Order deleted" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/orders/:id/finalize", requireRole("warehouse", "shop", "admin"), async (req, res) => { // finalize order
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (req.user.role === "warehouse" && order.orderSource !== "warehouse") {
      return res.status(403).json({ message: "Forbidden for this order source" });
    }

    if (
      req.user.role === "warehouse" &&
      req.user.assignmentType === "warehouse" &&
      req.user.assignmentId &&
      order.warehouseId?.toString() !== req.user.assignmentId
    ) {
      return res.status(403).json({ message: "Forbidden for this warehouse assignment" });
    }

    if (req.user.role === "shop" && order.orderSource !== "shop") {
      return res.status(403).json({ message: "Forbidden for this order source" });
    }

    if (
      req.user.role === "shop" &&
      req.user.assignmentType === "shop" &&
      req.user.assignmentId &&
      order.shopId?.toString() !== req.user.assignmentId
    ) {
      return res.status(403).json({ message: "Forbidden for this shop assignment" });
    }

    order.status = "completed";
    await order.save();

    const record = await RentalRecord.findOneAndUpdate(
      { orderId: order._id },
      {
        orderId: order._id,
        customerName: order.customerName,
        itemName: order.itemSnapshot.name,
        quantity: order.quantity,
        givingDate: order.givingDate,
        returnDate: order.returnDate,
        totalAmount: order.totalDue,
        sourceType: order.orderSource,
        warehouseId: order.warehouseId,
        shopId: order.shopId,
        status: "finalized"
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true
      }
    );

    return res.json({ order, rentalRecord: record });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Create multi-product order
router.post("/orders/multi/create", requireRole("warehouse", "shop", "admin"), async (req, res) => {
  try {
    const {
      customerName,
      address,
      phone,
      lineItems,
      orderSource,
      warehouseId,
      shopId,
      paymentType,
      paidAmount
    } = req.body;

    let finalOrderSource = orderSource;
    let finalWarehouseId = warehouseId || null;
    let finalShopId = shopId || null;

    if (req.user.role === "warehouse") {
      if (req.user.assignmentType !== "warehouse" || !req.user.assignmentId) {
        return res.status(403).json({ message: "Warehouse account must be assigned to a warehouse" });
      }
      finalOrderSource = "warehouse";
      finalWarehouseId = req.user.assignmentId;
      finalShopId = null;
    }

    if (req.user.role === "shop") {
      if (req.user.assignmentType !== "shop" || !req.user.assignmentId) {
        return res.status(403).json({ message: "Shop account must be assigned to a shop" });
      }
      finalOrderSource = "shop";
      finalShopId = req.user.assignmentId;
      finalWarehouseId = null;
    }

    // Validate customer information
    const nameError = validateCustomerName(customerName);
    if (nameError) {
      return res.status(400).json({ message: nameError });
    }

    const phoneError = validatePhoneNumber(phone);
    if (phoneError) {
      return res.status(400).json({ message: phoneError });
    }

    const addressError = validateAddress(address);
    if (addressError) {
      return res.status(400).json({ message: addressError });
    }

    if (!lineItems || lineItems.length === 0) {
      return res.status(400).json({ message: "Order must contain at least one item" });
    }

    // Validate all items exist and have sufficient quantity
    const processedItems = [];
    let totalDue = 0;

    for (const lineItem of lineItems) {
      // Validate quantity
      const qtyError = validateQuantity(lineItem.quantity);
      if (qtyError) {
        return res.status(400).json({ message: qtyError });
      }

      const item = await Item.findOne({ _id: lineItem.itemId, isDeleted: false });
      if (!item) {
        return res.status(404).json({ message: `Item ${lineItem.itemId} not available` });
      }

      if (item.quantity < lineItem.quantity) {
        return res.status(400).json({ message: `Not enough stock for ${item.name}` });
      }

      const daysOfRental = Math.ceil(
        (new Date(lineItem.returnDate) - new Date(lineItem.givingDate)) / (1000 * 60 * 60 * 24)
      ) || 1;

      const itemTotal = item.pricePerDay * lineItem.quantity * daysOfRental;

      processedItems.push({
        itemId: item._id,
        itemName: item.name,
        quantity: lineItem.quantity,
        pricePerDay: item.pricePerDay,
        givingDate: lineItem.givingDate,
        returnDate: lineItem.returnDate,
        totalAmount: itemTotal
      });

      totalDue += itemTotal;
      item.quantity -= lineItem.quantity;
      await item.save();
    }

    // Calculate payment info
    const billing = calculateOrderTotals({
      givingDate: processedItems[0].givingDate,
      returnDate: processedItems[0].returnDate,
      pricePerDay: processedItems[0].pricePerDay,
      quantity: 1,
      paymentType,
      paidAmount
    });

    const order = await Order.create({
      customerName,
      address,
      phone,
      lineItems: processedItems,
      orderSource: finalOrderSource,
      warehouseId: finalWarehouseId,
      shopId: finalShopId,
      paymentType,
      paidAmount: Number(paidAmount) || 0,
      totalDue,
      balance: totalDue - (Number(paidAmount) || 0),
      status: "active"
    });

    await Notification.create({
      title: "New Multi-Product Order",
      message: `${finalOrderSource.toUpperCase()} order created for ${customerName} with ${processedItems.length} items`,
      type: "alert",
      metadata: { orderId: order._id, source: finalOrderSource }
    });

    return res.status(201).json(order);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

// Generate invoice for order
router.post("/orders/:id/generate-invoice", requireRole("warehouse", "shop", "admin"), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const invoiceNumber = `INV-${order._id.toString().slice(-8).toUpperCase()}-${Date.now().toString().slice(-4)}`; // genarate invoiceid
    order.invoiceNumber = invoiceNumber;
    order.invoiceGeneratedAt = new Date();
    await order.save();

    return res.json({
      invoiceNumber,
      order
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Settle order with discount
router.post("/orders/:id/settle", requireRole("warehouse", "shop", "admin"), async (req, res) => { // billing + discount
  try {
    const { discountAmount } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const discount = Number(discountAmount) || 0; 
    const finalAmount = Math.max(0, order.totalDue - discount);

    order.discountAmount = discount;
    order.balance = 0;
    order.paidAmount = finalAmount;
    order.status = "completed";
    await order.save();

    // Create rental record for settlement
    let itemName = order.itemSnapshot?.name || "Multiple Items";
    if (order.lineItems && order.lineItems.length > 0) {
      itemName = `${order.lineItems.length} items`;
    }

    const record = await RentalRecord.findOneAndUpdate(
      { orderId: order._id },
      {
        orderId: order._id,
        customerName: order.customerName,
        itemName,
        quantity: order.quantity || 1,
        givingDate: order.givingDate || order.lineItems?.[0]?.givingDate,
        returnDate: order.returnDate || order.lineItems?.[0]?.returnDate,
        totalAmount: order.totalDue,
        sourceType: order.orderSource,
        warehouseId: order.warehouseId,
        shopId: order.shopId,
        status: "returned",
        notes: `Settled with discount: ${discount} LKR`
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true
      }
    );

    return res.json({ order, rentalRecord: record });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;
