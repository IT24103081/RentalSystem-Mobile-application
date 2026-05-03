// Customer name validation - no numbers, min 2 characters
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

// Phone number validation - exactly 10 digits
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

// Username validation - alphanumeric, 4-20 characters
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

// Password validation - min 6 characters, must include uppercase, lowercase, number or special character
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

// Email validation
export const validateEmail = (email) => {
  if (!email) {
    return "Email is required";
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return "Please enter a valid email address";
  }
  return null;
};

// Address validation - min 5 characters
export const validateAddress = (address) => {
  if (!address || address.trim().length < 5) {
    return "Address must be at least 5 characters";
  }
  if (address.trim().length > 100) {
    return "Address cannot exceed 100 characters";
  }
  return null;
};

// Warehouse/Shop name validation - no special chars, 2-50 characters
export const validateWarehouseName = (name) => {
  if (!name || name.trim().length < 2) {
    return "Name must be at least 2 characters";
  }
  if (name.trim().length > 50) {
    return "Name cannot exceed 50 characters";
  }
  if (!/^[a-zA-Z0-9\s\-&()]+$/.test(name)) {
    return "Name can only contain letters, numbers, spaces, hyphens, and parentheses";
  }
  return null;
};

// Code validation - alphanumeric, 2-20 characters
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

// Quantity validation - positive integer
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

// Price validation - positive number
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

// Date validation - cannot be in past
export const validateFutureDate = (dateStr) => {
  if (!dateStr) {
    return "Date is required";
  }
  const selectedDate = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (selectedDate < today) {
    return "Date cannot be in the past";
  }
  return null;
};

// Discount validation - cannot exceed total
export const validateDiscount = (discount, total) => {
  const num = Number(discount);
  if (isNaN(num) || num < 0) {
    return "Discount must be a positive number";
  }
  if (num > total) {
    return `Discount cannot exceed total amount (${total})`;
  }
  return null;
};

// Text field validation - min/max length
export const validateTextField = (text, min = 1, max = 500, fieldName = "Field") => {
  if (!text && min > 0) {
    return `${fieldName} is required`;
  }
  if (text.trim().length < min) {
    return `${fieldName} must be at least ${min} characters`;
  }
  if (text.trim().length > max) {
    return `${fieldName} cannot exceed ${max} characters`;
  }
  return null;
};

// Format phone display
export const formatPhoneNumber = (phone) => {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length !== 10) return phone;
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
};

// Validate all fields in an object
export const validateForm = (formData, validationRules) => {
  const errors = {};
  
  Object.keys(validationRules).forEach(field => {
    const validator = validationRules[field];
    const error = validator(formData[field]);
    if (error) {
      errors[field] = error;
    }
  });
  
  return errors;
};

// Has validation errors
export const hasErrors = (errors) => {
  return Object.keys(errors).length > 0;
};
