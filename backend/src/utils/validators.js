// Backend validation utilities
export const validateCustomerName = (name) => {
  if (!name || name.trim().length < 2) {
    return "Customer name must be at least 2 characters";
  }
  if (/\d/.test(name)) {
    return "Customer name cannot contain numbers";
  }
  if (!/^[a-zA-Z\s\-']+$/.test(name)) {
    return "Customer name can only contain letters, spaces, hyphens, and apostrophes";
  }
  return null;
};

export const validatePhoneNumber = (phone) => {
  if (!phone) {
    return "Phone number is required";
  }
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length !== 10) {
    return "Phone number must be exactly 10 digits";
  }
  return null;
};

export const validateUsername = (username) => {
  if (!username || username.length < 4) {
    return "Username must be at least 4 characters";
  }
  if (username.length > 20) {
    return "Username cannot exceed 20 characters";
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return "Username can only contain letters, numbers, and underscores";
  }
  return null;
};

export const validatePassword = (password) => {
  if (!password || password.length < 6) {
    return "Password must be at least 6 characters";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter";
  }
  if (!/[a-z]/.test(password)) {
    return "Password must contain at least one lowercase letter";
  }
  if (!(/[\d\W_]/.test(password))) {
    return "Password must contain at least one number or special character";
  }
  return null;
};

export const validateAddress = (address) => {
  if (!address || address.trim().length < 5) {
    return "Address must be at least 5 characters";
  }
  if (address.trim().length > 100) {
    return "Address cannot exceed 100 characters";
  }
  return null;
};

export const validateWarehouseName = (name) => {
  if (!name || name.trim().length < 2) {
    return "Warehouse name must be at least 2 characters";
  }
  if (name.trim().length > 50) {
    return "Warehouse name cannot exceed 50 characters";
  }
  if (!/^[a-zA-Z0-9\s\-&()]+$/.test(name)) {
    return "Warehouse name can only contain letters, numbers, spaces, hyphens, and parentheses";
  }
  return null;
};

export const validateCode = (code) => {
  if (!code || code.trim().length < 2) {
    return "Code must be at least 2 characters";
  }
  if (code.trim().length > 20) {
    return "Code cannot exceed 20 characters";
  }
  if (!/^[a-zA-Z0-9\-]+$/.test(code)) {
    return "Code can only contain letters, numbers, and hyphens";
  }
  return null;
};

export const validateQuantity = (qty) => {
  const num = Number(qty);
  if (isNaN(num) || num < 1) {
    return "Quantity must be at least 1";
  }
  if (!Number.isInteger(num)) {
    return "Quantity must be a whole number";
  }
  if (num > 1000000) {
    return "Quantity cannot exceed 1,000,000";
  }
  return null;
};

export const validatePrice = (price) => {
  const num = Number(price);
  if (isNaN(num) || num < 0) {
    return "Price must be a positive number";
  }
  if (num > 1000000) {
    return "Price cannot exceed 1,000,000";
  }
  return null;
};
