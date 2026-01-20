import { API_BASE_URL } from "../config/api";

/* LOGIN */
export async function loginUser(data: {
  email: string;
  password: string;
}) {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Invalid credentials");
  }

  return await response.text();
}

/* REGISTER */
export async function registerUser(data: {
  userName: string;
  email: string;
  password: string;
}) {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Registration failed");
  }

  return await response.text();
}
/* SEND OTP */
export async function sendOtp(email: string) {
  const response = await fetch(`${API_BASE_URL}/api/auth/login/send-otp?email=${email}`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Failed to send OTP");
  }
}

/* VERIFY OTP */
export async function verifyOtp(data: {
  email: string;
  otp: string;
}) {
  const response = await fetch(`${API_BASE_URL}/api/auth/login/verify-otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Invalid OTP");
  }

  const json = await response.json();
  return json.token;   // 🔐 ONLY return JWT token
}

