import Order from "../models/Order.js";
import Notification from "../models/Notification.js";

const MS_IN_DAY = 1000 * 60 * 60 * 24;

const getDayStart = (date) => {
  const clone = new Date(date);
  clone.setHours(0, 0, 0, 0);
  return clone;
};

const processOverdueBilling = async () => {
  const now = new Date();
  const dayStart = getDayStart(now);

  const overdueOrders = await Order.find({
    status: "active",
    returnDate: { $lt: dayStart },
    $or: [
      { lastOverdueChargeDate: null },
      { lastOverdueChargeDate: { $lt: dayStart } }
    ]
  });

  if (!overdueOrders.length) return;

  const alerts = [];

  for (const order of overdueOrders) {
    const dailyCharge = order.itemSnapshot.pricePerDay * order.quantity;
    order.overdueDays += 1;
    order.totalDue += dailyCharge;
    order.balance += dailyCharge;
    order.lastOverdueChargeDate = now;
    await order.save();

    alerts.push({
      title: "Overdue Rental Alert",
      message: `Order ${order._id} is overdue. Added LKR ${dailyCharge} for one extra day.`,
      type: "alert",
      metadata: { orderId: order._id, dailyCharge }
    });
  }

  if (alerts.length) {
    await Notification.insertMany(alerts);
  }
};

export const startOverdueBillingScheduler = () => {
  let lastProcessedDate = "";

  setInterval(async () => {
    const now = new Date();
    const todayKey = now.toISOString().slice(0, 10);

    if (now.getHours() === 9 && todayKey !== lastProcessedDate) {
      try {
        await processOverdueBilling();
        lastProcessedDate = todayKey;
      } catch (error) {
        console.error("Overdue billing job failed:", error.message);
      }
    }
  }, 60 * 1000);
};
