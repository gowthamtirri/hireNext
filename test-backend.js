const axios = require('axios');

const BASE_URL = 'http://localhost:5001';
const API_BASE = `${BASE_URL}/api/v1`;

async function testBackend() {
  console.log('🧪 Testing Backend Connection...\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing Health Check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health Check:', healthResponse.data);
    console.log('');

    // Test 2: Public Jobs Endpoint
    console.log('2. Testing Public Jobs...');
    try {
      const jobsResponse = await axios.get(`${API_BASE}/jobs`);
      console.log('✅ Public Jobs:', {
        success: jobsResponse.data.success,
        jobCount: jobsResponse.data.data?.jobs?.length || 0,
        pagination: jobsResponse.data.data?.pagination
      });
    } catch (error) {
      console.log('❌ Public Jobs Error:', error.response?.data || error.message);
    }
    console.log('');

    // Test 3: Test Job Detail (if jobs exist)
    console.log('3. Testing Job Detail...');
    try {
      const jobsResponse = await axios.get(`${API_BASE}/jobs`);
      if (jobsResponse.data.data?.jobs?.length > 0) {
        const jobId = jobsResponse.data.data.jobs[0].id;
        const jobDetailResponse = await axios.get(`${API_BASE}/jobs/${jobId}/public`);
        console.log('✅ Job Detail:', {
          success: jobDetailResponse.data.success,
          jobTitle: jobDetailResponse.data.data?.job?.title
        });
      } else {
        console.log('⚠️  No jobs available to test job detail');
      }
    } catch (error) {
      console.log('❌ Job Detail Error:', error.response?.data || error.message);
    }
    console.log('');

    // Test 4: Test Authentication Endpoints
    console.log('4. Testing Auth Endpoints...');
    try {
      // Test signup endpoint (should fail without proper data, but endpoint should exist)
      await axios.post(`${API_BASE}/auth/signup`, {});
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Auth Signup endpoint exists (validation error expected)');
      } else {
        console.log('❌ Auth Signup Error:', error.response?.data || error.message);
      }
    }

    try {
      // Test login endpoint (should fail without proper data, but endpoint should exist)
      await axios.post(`${API_BASE}/auth/login`, {});
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Auth Login endpoint exists (validation error expected)');
      } else {
        console.log('❌ Auth Login Error:', error.response?.data || error.message);
      }
    }
    console.log('');

    console.log('🎉 Backend tests completed!');
    console.log('\nNext steps:');
    console.log('1. Start the frontend: cd next-hire-frontend && npm run dev');
    console.log('2. Test the full application flow');
    console.log('3. Check the debug panel on the dashboard');

  } catch (error) {
    console.error('❌ Backend connection failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure backend is running: cd next-hire-backend && npm run dev');
    console.log('2. Check if port 5001 is available');
    console.log('3. Check database connection');
  }
}

testBackend();
