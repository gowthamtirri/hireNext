#!/usr/bin/env node

const axios = require("axios");

const BASE_URL = "http://localhost:5001/api/v1";
let authToken = "";

// Test user data
const testUser = {
  email: "test@example.com",
  password: "password123",
  role: "candidate",
  first_name: "John",
  last_name: "Doe",
};

async function testHealthCheck() {
  try {
    console.log("🔍 Testing Health Check...");
    const response = await axios.get("http://localhost:5001/health");
    console.log("✅ Health Check:", response.data);
    return true;
  } catch (error) {
    console.error("❌ Health Check failed:", error.message);
    return false;
  }
}

async function testSignup() {
  try {
    console.log("\n📝 Testing User Signup...");
    const response = await axios.post(`${BASE_URL}/auth/signup`, testUser);
    console.log("✅ Signup successful:", response.data);
    return true;
  } catch (error) {
    console.error("❌ Signup failed:", error.response?.data || error.message);
    return false;
  }
}

async function testLogin() {
  try {
    console.log("\n🔐 Testing User Login...");
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password,
    });
    authToken = response.data.token;
    console.log("✅ Login successful, token received");
    return true;
  } catch (error) {
    console.error("❌ Login failed:", error.response?.data || error.message);
    return false;
  }
}

async function testProtectedRoute() {
  try {
    console.log("\n👤 Testing Protected Route (Get Profile)...");
    const response = await axios.get(`${BASE_URL}/candidate/profile`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    console.log("✅ Protected route access successful:", response.data);
    return true;
  } catch (error) {
    console.error(
      "❌ Protected route failed:",
      error.response?.data || error.message
    );
    return false;
  }
}

async function runTests() {
  console.log("🚀 Starting API Tests...\n");

  const healthOk = await testHealthCheck();
  if (!healthOk) {
    console.log(
      "\n❌ Server is not running. Please start the server first with: yarn dev"
    );
    return;
  }

  const signupOk = await testSignup();
  // Note: In real scenario, you'd need to verify OTP first

  const loginOk = await testLogin();
  if (loginOk && authToken) {
    await testProtectedRoute();
  }

  console.log("\n✨ API Tests completed!");
  console.log("\n💡 Tips:");
  console.log("- Use Postman or Thunder Client for more detailed testing");
  console.log(
    "- Check the logs in your server console for detailed information"
  );
  console.log("- Remember to verify OTP after signup in real scenarios");
}

// Run tests
runTests().catch(console.error);
