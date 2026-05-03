/**
 * Notify.lk SMS Service  
 *   User ID   : 31607
 *   API Key   : 45hOzHVepRmYPJMkQMNp
 *   Sender ID : NotifyDEMO
 *
 * Environment variables (optional overrides):
 *   NOTIFYLK_USER_ID, NOTIFYLK_API_KEY, NOTIFYLK_SENDER_ID
 */

const NOTIFYLK_BASE_URL = "https://app.notify.lk/api/v1/send";

// Notify.lk sender id
const DEFAULT_USER_ID   = "31607";
const DEFAULT_API_KEY   = "45hOzHVepRmYPJMkQMNp";
const DEFAULT_SENDER_ID = "NotifyDEMO";

/**
 * Normalise a Sri Lankan mobile number to the 94xxxxxxxxx format
 * accepted by Notify.lk.
 *
 * Accepted inputs:
 *   07xxxxxxxx  → 947xxxxxxxx
 *   +947xxxxxxxx / 947xxxxxxxx → kept as-is (digits only)
 *   Any other format → returned unchanged for the caller to reject
 */
export const formatPhoneForSms = (rawPhone) => {
  if (!rawPhone) return "";
  // Strip all non-digit characters
  const digits = String(rawPhone).replace(/\D/g, "");

  if (digits.startsWith("947") && digits.length === 11) {
    return digits; // already in correct format (947xxxxxxxx)
  }
  if (digits.startsWith("94") && digits.length === 11) {
    return digits; // 94xxxxxxxxx — already correct
  }
  if (digits.startsWith("07") && digits.length === 10) {
    return "94" + digits.slice(1); // 07xxxxxxxx → 947xxxxxxxx
  }
  if (digits.startsWith("7") && digits.length === 9) {
    return "94" + digits; // 7xxxxxxxx → 947xxxxxxxx
  }
  // Return digits as-is and let the API validate
  return digits;
};

// ── Core send function ────────────────────────────────────────────────────────

/**
 * Send a single SMS message via Notify.lk.
 *
 * @param {string} toPhone  – Recipient phone number (any SL format accepted)
 * @param {string} message  – The text body to send (max ~160 chars per segment)
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const sendSms = async (toPhone, message) => {
  // Use env vars if provided, fall back to proposal credentials
  const userId   = process.env.NOTIFYLK_USER_ID   || DEFAULT_USER_ID;
  const apiKey   = process.env.NOTIFYLK_API_KEY   || DEFAULT_API_KEY;
  const senderId = process.env.NOTIFYLK_SENDER_ID || DEFAULT_SENDER_ID;

  const formattedPhone = formatPhoneForSms(toPhone);
  if (!formattedPhone) {
    return { success: false, error: "Invalid phone number" };
  }

  const params = new URLSearchParams({
    user_id:   userId,
    api_key:   apiKey,
    sender_id: senderId,
    to:        formattedPhone,
    message:   message
  });

  const url = `${NOTIFYLK_BASE_URL}?${params.toString()}`;

  try {
    const response = await fetch(url, { method: "GET" });
    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    // Notify.lk returns status "success" or "error" in the response body
    if (data.status === "success" || (response.ok && !data.status)) {
      console.log(`[SMS] ✅ Sent to ${formattedPhone}:`, data);
      return { success: true, data };
    } else {
      const errMsg = data.message || data.msg || data.error || "SMS send failed";
      console.error(`[SMS] ❌ Failed to send to ${formattedPhone}:`, errMsg);
      return { success: false, error: errMsg };
    }
  } catch (err) {
    console.error("[SMS] Network error:", err.message);
    return { success: false, error: err.message };
  }
};

// ── Proposal SMS Templates ────────────────────────────────────────────────────

/**
 * 1. OTP Verification — sent during user registration.
 *
 * @param {string} phone    – Recipient phone number
 * @param {string} otp      – 6-digit OTP code
 * @param {string} userName – Customer name (optional)
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const sendOtpVerification = async (phone, otp, userName = "Customer") => {
  const message =
    `Dear ${userName}, your Sri Lions Rental System verification code is: ${otp}. ` +
    `This code is valid for 10 minutes. Do not share it with anyone. - Sri Lions Rentals`;
  return sendSms(phone, message);
};

/**
 * 2. Booking Confirmation — sent when a rental order is created.
 *
 * @param {string} phone        – Customer phone number
 * @param {string} customerName – Customer's full name
 * @param {string} itemName     – Name of the rented item(s)
 * @param {string} givingDate   – Human-readable giving/pickup date
 * @param {string} returnDate   – Human-readable return due date
 * @param {number} totalAmount  – Total amount due (LKR)
 * @param {string} orderId      – Order reference ID
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const sendBookingConfirmation = async (
  phone, customerName, itemName, givingDate, returnDate, totalAmount, orderId
) => {
  const message =
    `Dear ${customerName}, your rental booking is CONFIRMED! ` +
    `Item: ${itemName}. Pickup: ${givingDate}. Return by: ${returnDate}. ` +
    `Total: LKR ${Number(totalAmount).toLocaleString()}. ` +
    `Ref: #${String(orderId).slice(-6).toUpperCase()}. ` +
    `Thank you for choosing Sri Lions Rentals!`;
  return sendSms(phone, message);
};

/**
 * 3. Return Reminder — 1 day before due date OR on the due date.
 *
 * @param {string} phone        – Customer phone number
 * @param {string} customerName – Customer's name
 * @param {string} itemName     – Name of the rented item
 * @param {string} returnDate   – Human-readable return date string
 * @param {number} daysLeft     – Days until due (1 = tomorrow, 0 = today, <0 = overdue)
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const sendReturnReminder = async (
  phone, customerName, itemName, returnDate, daysLeft
) => {
  let message;

  if (daysLeft === 1) {
    // 1 day before due — proposal requirement
    message =
      `Dear ${customerName}, REMINDER: Your rented item "${itemName}" is due for return ` +
      `TOMORROW (${returnDate}). Please ensure timely return to avoid late charges. ` +
      `- Sri Lions Rentals`;
  } else if (daysLeft === 0) {
    // On the due date — proposal requirement
    message =
      `Dear ${customerName}, REMINDER: Your rented item "${itemName}" is due for return ` +
      `TODAY (${returnDate}). Please return it today to avoid extra charges. ` +
      `- Sri Lions Rentals`;
  } else if (daysLeft > 1) {
    message =
      `Dear ${customerName}, this is a reminder that your rented "${itemName}" is due ` +
      `for return on ${returnDate} (${daysLeft} day(s) remaining). ` +
      `- Sri Lions Rentals`;
  } else {
    // Overdue path — redirect to overdue SMS
    const overdueDays = Math.abs(daysLeft);
    message =
      `Dear ${customerName}, your rented "${itemName}" was due on ${returnDate} ` +
      `and is now ${overdueDays} day(s) OVERDUE. Please contact us immediately. ` +
      `- Sri Lions Rentals`;
  }

  return sendSms(phone, message);
};

/**
 * 4. Overdue + Late Fee Alert — sent when an item becomes/remains overdue.
 *
 * @param {string} phone        – Customer phone number
 * @param {string} customerName – Customer's name
 * @param {string} itemName     – Name of the overdue item(s)
 * @param {string} returnDate   – Original due date (human-readable)
 * @param {number} daysOverdue  – How many days overdue
 * @param {number} lateFee      – Late fee charged for today (LKR)
 * @param {number} totalBalance – Total outstanding balance (LKR)
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const sendOverdueAlert = async (
  phone, customerName, itemName, returnDate, daysOverdue, lateFee, totalBalance
) => {
  const message =
    `OVERDUE NOTICE — Dear ${customerName}, your rented "${itemName}" was due on ${returnDate} ` +
    `and is now ${daysOverdue} day(s) overdue. ` +
    `Late fee today: LKR ${Number(lateFee).toLocaleString()}. ` +
    `Total outstanding: LKR ${Number(totalBalance).toLocaleString()}. ` +
    `Please return the item and settle your balance immediately. - Sri Lions Rentals`;
  return sendSms(phone, message);
};

/**
 * 5. Cancellation SMS — sent when a rental order is cancelled.
 *
 * @param {string} phone        – Customer phone number
 * @param {string} customerName – Customer's name
 * @param {string} itemName     – Name of the cancelled item
 * @param {string} orderId      – Order reference ID
 * @param {number} refundAmount – Refund amount if any (0 = no refund)
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const sendCancellationSms = async (
  phone, customerName, itemName, orderId, refundAmount = 0
) => {
  const refundText = refundAmount > 0
    ? ` A refund of LKR ${Number(refundAmount).toLocaleString()} will be processed.`
    : "";
  const message =
    `Dear ${customerName}, your rental booking for "${itemName}" ` +
    `(Ref: #${String(orderId).slice(-6).toUpperCase()}) has been CANCELLED.` +
    refundText +
    ` For assistance, contact Sri Lions Rentals. Thank you.`;
  return sendSms(phone, message);
};
