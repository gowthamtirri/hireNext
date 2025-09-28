const axios = require("axios");

const BASE_URL = "http://localhost:5001/api/v1";

// Test data for different user types
const testUsers = {
  candidate: {
    email: "test.candidate@example.com",
    password: "testpassword123",
    role: "candidate",
    first_name: "John",
    last_name: "Doe",
    phone: "+1234567890",
  },
  recruiter: {
    email: "test.recruiter@example.com",
    password: "testpassword123",
    role: "recruiter",
    first_name: "Jane",
    last_name: "Smith",
  },
  vendor: {
    email: "test.vendor@example.com",
    password: "testpassword123",
    role: "vendor",
    first_name: "Bob",
    last_name: "Johnson",
    company_name: "Test Staffing Inc",
    contact_name: "Bob Johnson",
  },
};

// Helper function to make API calls
async function apiCall(method, endpoint, data = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status,
    };
  }
}

// Test signup for a specific user type
async function testSignup(userType) {
  console.log(`\n🔍 Testing ${userType} signup...`);
  const userData = testUsers[userType];

  const result = await apiCall("POST", "/auth/signup", userData);

  if (result.success) {
    console.log(`✅ ${userType} signup successful:`, result.data.message);
    return result.data.data;
  } else {
    console.log(
      `❌ ${userType} signup failed:`,
      result.error.message || result.error
    );
    return null;
  }
}

// Test OTP verification
async function testVerifyOTP(email, otp = "123456") {
  console.log(`\n🔍 Testing OTP verification for ${email}...`);

  const result = await apiCall("POST", "/auth/verify-otp", { email, otp });

  if (result.success) {
    console.log(`✅ OTP verification successful`);
    return result.data.data;
  } else {
    console.log(
      `❌ OTP verification failed:`,
      result.error.message || result.error
    );
    return null;
  }
}

// Test login
async function testLogin(email, password) {
  console.log(`\n🔍 Testing login for ${email}...`);

  const result = await apiCall("POST", "/auth/login", { email, password });

  if (result.success) {
    console.log(`✅ Login successful for ${result.data.data.user.role}`);
    return result.data.data;
  } else {
    console.log(`❌ Login failed:`, result.error.message || result.error);
    return null;
  }
}

// Test forgot password
async function testForgotPassword(email) {
  console.log(`\n🔍 Testing forgot password for ${email}...`);

  const result = await apiCall("POST", "/auth/forgot-password", { email });

  if (result.success) {
    console.log(`✅ Forgot password request successful`);
    return true;
  } else {
    console.log(
      `❌ Forgot password failed:`,
      result.error.message || result.error
    );
    return false;
  }
}

// Main test function
async function runAuthTests() {
  console.log("🚀 Starting comprehensive auth flow tests...\n");

  // Test health check first
  console.log("🔍 Testing health check...");
  const healthResult = await apiCall("GET", "/../../health");
  if (healthResult.success) {
    console.log("✅ Backend is running");
  } else {
    console.log(
      "❌ Backend is not responding. Make sure it's running on port 5000"
    );
    return;
  }

  // Test each user type
  for (const userType of ["candidate", "recruiter", "vendor"]) {
    console.log(`\n${"=".repeat(50)}`);
    console.log(`Testing ${userType.toUpperCase()} flow`);
    console.log(`${"=".repeat(50)}`);

    // 1. Test signup
    const signupData = await testSignup(userType);
    if (!signupData) continue;

    // 2. Test OTP verification (using hardcoded OTP)
    console.log(`\n✅ Using hardcoded OTP '123456' for testing`);
    const otpData = await testVerifyOTP(testUsers[userType].email);
    if (!otpData) continue;

    // 3. Test login after verification
    const loginData = await testLogin(
      testUsers[userType].email,
      testUsers[userType].password
    );
    if (!loginData) continue;

    // 4. Test forgot password
    await testForgotPassword(testUsers[userType].email);

    console.log(`\n✅ ${userType} auth flow tests completed`);
  }

  console.log(`\n${"=".repeat(50)}`);
  console.log("🎉 All auth flow tests completed!");
  console.log("✅ Using hardcoded OTP '123456' for all tests");
  console.log("🔧 Ready for frontend testing with predictable OTP");
  console.log(`${"=".repeat(50)}`);
}

// Run the tests
if (require.main === module) {
  runAuthTests().catch(console.error);
}

module.exports = { testSignup, testVerifyOTP, testLogin, testForgotPassword };
