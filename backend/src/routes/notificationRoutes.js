import express from "express";
import Notification from "../models/Notification.js";
import Order from "../models/Order.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  sendSms,
  sendReturnReminder,
  sendOverdueAlert,
  sendOtpVerification,
  sendBookingConfirmation,
  sendCancellationSms,
  formatPhoneForSms
} from "../utils/smsService.js";

const router = express.Router();

// ── Create a notification record ───────────────────────────────────────────────
router.post(
  "/notifications",
  requireAuth,
  requireRole("analytics", "logistics"),
  async (req, res) => {
    try {
      const notification = await Notification.create(req.body);
      res.status(201).json(notification);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

// ── List all notifications ─────────────────────────────────────────────────────
router.get(
  "/notifications",
  requireAuth,
  requireRole("analytics", "logistics"),
  async (_req, res) => {
    try {
      const notifications = await Notification.find({}).sort({ createdAt: -1 });
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// ── Delete a notification ──────────────────────────────────────────────────────
router.delete(
  "/notifications/:id",
  requireAuth,
  requireRole("analytics", "logistics"),
  async (req, res) => {
    try {
      const deleted = await Notification.findByIdAndDelete(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Notification not found" });
      }
      return res.json({ message: "Notification deleted" });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
);

// ── Send SMS for a notification record ────────────────────────────────────────
// Body: { phone?: string, message?: string }
router.post(
  "/notifications/:id/send",
  requireAuth,
  requireRole("analytics", "logistics"),
  async (req, res) => {
    try {
      const notification = await Notification.findById(req.params.id);
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }

      const targetPhone   = req.body.phone   || notification.phone;
      const targetMessage = req.body.message || notification.message;

      if (!targetPhone) {
        return res.status(400).json({ message: "Phone number is required to send SMS" });
      }

      // Persist phone if not already stored
      if (!notification.phone && targetPhone) {
        notification.phone = targetPhone;
      }

      const result = await sendSms(targetPhone, targetMessage);

      notification.sentAt    = new Date();
      notification.smsStatus = result.success ? "sent" : "failed";
      notification.smsError  = result.success ? null : (result.error || "Unknown error");
      await notification.save();

      if (result.success) {
        return res.json({ message: "SMS sent successfully", notification, smsData: result.data });
      } else {
        return res.status(502).json({ message: "SMS delivery failed", error: result.error, notification });
      }
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
);

// ── OTP Verification SMS ──────────────────────────────────────────────────────
// Body: { phone, userName?, otp? }  — OTP is auto-generated if not supplied
router.post(
  "/notifications/send-otp",
  requireAuth,
  requireRole("analytics", "logistics"),
  async (req, res) => {
    try {
      const { phone, userName = "Customer" } = req.body;
      if (!phone) return res.status(400).json({ message: "phone is required" });

      const otp = req.body.otp || String(Math.floor(100000 + Math.random() * 900000));
      const result = await sendOtpVerification(phone, otp, userName);

      // Log
      await Notification.create({
        title:     `OTP Verification — ${userName}`,
        message:   `OTP ${otp} sent to ${phone} for user registration.`,
        type:      "sms",
        phone,
        sentAt:    new Date(),
        smsStatus: result.success ? "sent" : "failed",
        smsError:  result.success ? null : result.error
      });

      if (result.success) {
        return res.json({ message: "OTP sent successfully", otp });
      } else {
        return res.status(502).json({ message: "OTP SMS failed", error: result.error });
      }
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
);

// ── Booking Confirmation SMS ───────────────────────────────────────────────────
// Body: { orderId }  — fetches order from DB
router.post(
  "/notifications/send-booking-confirmation",
  requireAuth,
  requireRole("analytics", "logistics"),
  async (req, res) => {
    try {
      const { orderId } = req.body;
      if (!orderId) return res.status(400).json({ message: "orderId is required" });

      const order = await Order.findById(orderId).lean();
      if (!order) return res.status(404).json({ message: "Order not found" });
      if (!order.phone) return res.status(400).json({ message: "Order has no phone number" });

      const itemName = order.lineItems?.length
        ? order.lineItems.map((li) => li.itemName).join(", ")
        : order.itemSnapshot?.name || "Rental Item";

      const givingDateStr  = order.givingDate  ? new Date(order.givingDate).toLocaleDateString("en-LK")  : "TBD";
      const returnDateStr  = order.returnDate  ? new Date(order.returnDate).toLocaleDateString("en-LK")  : "TBD";

      const result = await sendBookingConfirmation(
        order.phone,
        order.customerName,
        itemName,
        givingDateStr,
        returnDateStr,
        order.totalDue,
        order._id
      );

      await Notification.create({
        title:     `Booking Confirmation — ${order.customerName}`,
        message:   `Booking confirmed for "${itemName}". Return by ${returnDateStr}.`,
        type:      "sms",
        phone:     order.phone,
        sentAt:    new Date(),
        smsStatus: result.success ? "sent" : "failed",
        smsError:  result.success ? null : result.error,
        metadata:  { orderId: order._id }
      });

      if (result.success) {
        return res.json({ message: "Booking confirmation SMS sent", smsData: result.data });
      } else {
        return res.status(502).json({ message: "Booking confirmation SMS failed", error: result.error });
      }
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
);

// ── Return Reminders — 1 day before AND on due date ────────────────────────────
// Body: { daysBeforeDue: number }  — defaults to 1  (set 0 for due-date SMS)
router.post(
  "/notifications/send-return-reminders",
  requireAuth,
  requireRole("analytics", "logistics"),
  async (req, res) => {
    try {
      const daysBeforeDue = Number(req.body.daysBeforeDue ?? 1);
      const now   = new Date();
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() + daysBeforeDue);
      const end = new Date(start);
      end.setHours(23, 59, 59, 999);

      const orders = await Order.find({
        status:     "active",
        returnDate: { $gte: start, $lte: end }
      });

      if (!orders.length) {
        return res.json({ sent: 0, failed: 0, message: "No qualifying orders found" });
      }

      const results = await Promise.allSettled(
        orders.map(async (order) => {
          if (!order.phone) return { skipped: true, reason: "no phone" };

          const returnDateStr = new Date(order.returnDate).toLocaleDateString("en-LK");
          const itemName      = order.lineItems?.length
            ? order.lineItems.map((li) => li.itemName).join(", ")
            : order.itemSnapshot?.name || "rental item";

          const smsResult = await sendReturnReminder(
            order.phone,
            order.customerName,
            itemName,
            returnDateStr,
            daysBeforeDue
          );

          // Log
          const reminderLabel = daysBeforeDue === 0 ? "Due Today" : `${daysBeforeDue} Day Before`;
          await Notification.create({
            title:     `Return Reminder (${reminderLabel}) — ${order.customerName}`,
            message:   `Reminder sent for "${itemName}" due ${returnDateStr}`,
            type:      "sms",
            phone:     order.phone,
            sentAt:    new Date(),
            smsStatus: smsResult.success ? "sent" : "failed",
            smsError:  smsResult.success ? null : smsResult.error,
            metadata:  { orderId: order._id, daysBeforeDue }
          });

          return smsResult;
        })
      );

      const sent   = results.filter((r) => r.status === "fulfilled" && r.value?.success).length;
      const failed = results.filter((r) => r.status === "fulfilled" && r.value && !r.value.success && !r.value.skipped).length;

      return res.json({ sent, failed, total: orders.length });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
);

// ── Overdue + Late Fee SMS — triggered manually or by scheduler ────────────────
// Sends overdue+late-fee SMS to all currently overdue orders that have a phone
router.post(
  "/notifications/send-overdue-alerts",
  requireAuth,
  requireRole("analytics", "logistics"),
  async (req, res) => {
    try {
      const now      = new Date();
      const dayStart = new Date(now);
      dayStart.setHours(0, 0, 0, 0);

      const overdueOrders = await Order.find({
        status:     "active",
        returnDate: { $lt: dayStart }
      });

      if (!overdueOrders.length) {
        return res.json({ sent: 0, failed: 0, message: "No overdue orders found" });
      }

      const results = await Promise.allSettled(
        overdueOrders.map(async (order) => {
          if (!order.phone) return { skipped: true, reason: "no phone" };

          const daysOverdue   = Math.floor((now - new Date(order.returnDate)) / (1000 * 60 * 60 * 24));
          const returnDateStr = new Date(order.returnDate).toLocaleDateString("en-LK");
          const itemName      = order.lineItems?.length
            ? order.lineItems.map((li) => li.itemName).join(", ")
            : order.itemSnapshot?.name || "rental item";

          // Late fee = daily price × quantity (same logic as overdueScheduler)
          const lateFeePerDay = (order.itemSnapshot?.pricePerDay || 0) * (order.quantity || 1);

          const smsResult = await sendOverdueAlert(
            order.phone,
            order.customerName,
            itemName,
            returnDateStr,
            daysOverdue,
            lateFeePerDay,
            order.balance
          );

          await Notification.create({
            title:     `Overdue Alert — ${order.customerName}`,
            message:   `"${itemName}" is ${daysOverdue} day(s) overdue. Balance: LKR ${order.balance}.`,
            type:      "sms",
            phone:     order.phone,
            sentAt:    new Date(),
            smsStatus: smsResult.success ? "sent" : "failed",
            smsError:  smsResult.success ? null : smsResult.error,
            metadata:  { orderId: order._id, daysOverdue, lateFeePerDay }
          });

          return smsResult;
        })
      );

      const sent   = results.filter((r) => r.status === "fulfilled" && r.value?.success).length;
      const failed = results.filter((r) => r.status === "fulfilled" && r.value && !r.value.success && !r.value.skipped).length;

      return res.json({ sent, failed, total: overdueOrders.length });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
);

// ── Cancellation SMS ───────────────────────────────────────────────────────────
// Body: { orderId }
router.post(
  "/notifications/send-cancellation",
  requireAuth,
  requireRole("analytics", "logistics"),
  async (req, res) => {
    try {
      const { orderId } = req.body;
      if (!orderId) return res.status(400).json({ message: "orderId is required" });

      const order = await Order.findById(orderId).lean();
      if (!order) return res.status(404).json({ message: "Order not found" });
      if (!order.phone) return res.status(400).json({ message: "Order has no phone number" });

      const itemName    = order.lineItems?.length
        ? order.lineItems.map((li) => li.itemName).join(", ")
        : order.itemSnapshot?.name || "Rental Item";
      const refundAmount = order.paidAmount || 0;

      const result = await sendCancellationSms(
        order.phone,
        order.customerName,
        itemName,
        order._id,
        refundAmount
      );

      await Notification.create({
        title:     `Cancellation — ${order.customerName}`,
        message:   `Cancellation SMS sent for "${itemName}".`,
        type:      "sms",
        phone:     order.phone,
        sentAt:    new Date(),
        smsStatus: result.success ? "sent" : "failed",
        smsError:  result.success ? null : result.error,
        metadata:  { orderId: order._id }
      });

      if (result.success) {
        return res.json({ message: "Cancellation SMS sent", smsData: result.data });
      } else {
        return res.status(502).json({ message: "Cancellation SMS failed", error: result.error });
      }
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
);

// ── Alert stats ────────────────────────────────────────────────────────────────
router.get(
  "/notifications/alerts/triggered",
  requireAuth,
  requireRole("analytics", "logistics"),
  async (_req, res) => {
    try {
      const today    = new Date();
      const dayStart = new Date(today);
      dayStart.setHours(0, 0, 0, 0);

      const overdueCount   = await Order.countDocuments({ status: "active", returnDate: { $lt: dayStart } });
      const newOrdersToday = await Order.countDocuments({ orderDate: { $gte: dayStart } });

      res.json({ overdueCount, newOrdersToday });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

export default router;
