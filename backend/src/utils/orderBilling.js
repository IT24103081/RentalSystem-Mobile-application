export const MS_IN_DAY = 1000 * 60 * 60 * 24;

export const normalizeDate = (dateInput) => {
  const date = new Date(dateInput);
  date.setHours(0, 0, 0, 0);
  return date;
};

export const calculateBaseDays = (givingDate, returnDate) => {
  const start = normalizeDate(givingDate);
  const end = normalizeDate(returnDate);
  const diffDays = Math.ceil((end - start) / MS_IN_DAY);
  return Math.max(diffDays, 1);
};

export const calculateOrderTotals = ({
  givingDate,
  returnDate,
  pricePerDay,
  quantity,
  paymentType,
  paidAmount,
  overdueDays = 0
}) => {
  const baseDays = calculateBaseDays(givingDate, returnDate);
  const rate = Number(pricePerDay) * Number(quantity);
  const totalDue = rate * (baseDays + Number(overdueDays));
  const safePaidAmount = paymentType === "full" ? totalDue : Number(paidAmount || 0);
  const balance = Math.max(totalDue - safePaidAmount, 0);

  return {
    baseDays,
    totalDue,
    paidAmount: safePaidAmount,
    balance
  };
};
