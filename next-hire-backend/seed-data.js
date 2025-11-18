#!/usr/bin/env node
/**
 * Simple script to seed the database with test data
 * Run with: node seed-data.js
 */

const API_BASE_URL = 'http://localhost:5001/api/v1';

// Helper function for API requests
async function apiRequest(method, path, data = null, token = null) {
  const url = `${API_BASE_URL}${path}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  const response = await fetch(url, options);
  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.message || `HTTP ${response.status}`);
  }
  
  return result;
}

let authToken = '';
let userId = '';
let recruiterId = '';

// Sample data
const recruiterData = {
  email: 'recruiter@test.com',
  password: 'Test123!@#',
  role: 'recruiter',
  first_name: 'John',
  last_name: 'Recruiter',
  phone_number: '+1234567890',
  company_name: 'Test Company'
};

const jobs = [
  {
    title: 'Senior Software Engineer',
    description: 'We are looking for an experienced software engineer...',
    company_name: 'Tech Corp',
    location: 'San Francisco, CA',
    city: 'San Francisco',
    state: 'CA',
    country: 'US',
    job_type: 'full_time',
    salary_min: 120000,
    salary_max: 180000,
    salary_currency: 'USD',
    experience_min: 5,
    experience_max: 10,
    required_skills: ['JavaScript', 'React', 'Node.js', 'TypeScript'],
    preferred_skills: ['AWS', 'Docker', 'Kubernetes'],
    status: 'active',
    priority: 'high',
    positions_available: 2,
    vendor_eligible: true,
    remote_work_allowed: true
  },
  {
    title: 'Full Stack Developer',
    description: 'Join our team as a full stack developer...',
    company_name: 'StartUp Inc',
    location: 'New York, NY',
    city: 'New York',
    state: 'NY',
    country: 'US',
    job_type: 'full_time',
    salary_min: 100000,
    salary_max: 150000,
    salary_currency: 'USD',
    experience_min: 3,
    experience_max: 7,
    required_skills: ['Python', 'Django', 'React', 'PostgreSQL'],
    preferred_skills: ['Redis', 'Celery', 'GraphQL'],
    status: 'active',
    priority: 'medium',
    positions_available: 1,
    vendor_eligible: true,
    remote_work_allowed: false
  },
  {
    title: 'DevOps Engineer',
    description: 'Looking for a DevOps engineer to manage our infrastructure...',
    company_name: 'Cloud Systems',
    location: 'Austin, TX',
    city: 'Austin',
    state: 'TX',
    country: 'US',
    job_type: 'full_time',
    salary_min: 110000,
    salary_max: 160000,
    salary_currency: 'USD',
    experience_min: 4,
    experience_max: 8,
    required_skills: ['AWS', 'Docker', 'Kubernetes', 'Terraform'],
    preferred_skills: ['Jenkins', 'GitLab CI', 'Ansible'],
    status: 'active',
    priority: 'high',
    positions_available: 1,
    vendor_eligible: true,
    remote_work_allowed: true
  }
];

const candidates = [
  {
    email: 'candidate1@test.com',
    password: 'Test123!@#',
    role: 'candidate',
    first_name: 'Alice',
    last_name: 'Johnson',
    phone_number: '+1234567891',
    current_title: 'Software Engineer',
    years_of_experience: 6,
    location: 'San Francisco, CA',
    skills: ['JavaScript', 'React', 'Node.js', 'TypeScript', 'AWS']
  },
  {
    email: 'candidate2@test.com',
    password: 'Test123!@#',
    role: 'candidate',
    first_name: 'Bob',
    last_name: 'Smith',
    phone_number: '+1234567892',
    current_title: 'Full Stack Developer',
    years_of_experience: 4,
    location: 'New York, NY',
    skills: ['Python', 'Django', 'React', 'PostgreSQL', 'Redis']
  },
  {
    email: 'candidate3@test.com',
    password: 'Test123!@#',
    role: 'candidate',
    first_name: 'Carol',
    last_name: 'Davis',
    phone_number: '+1234567893',
    current_title: 'DevOps Engineer',
    years_of_experience: 5,
    location: 'Austin, TX',
    skills: ['AWS', 'Docker', 'Kubernetes', 'Terraform', 'Jenkins']
  }
];

async function signupRecruiter() {
  try {
    console.log('Signing up recruiter...');
    const response = await apiRequest('POST', '/auth/signup', recruiterData);
    authToken = response.data.tokens.accessToken;
    userId = response.data.user.id;
    console.log('✓ Recruiter signed up successfully');
    console.log('  Email:', recruiterData.email);
    console.log('  Password:', recruiterData.password);
    return true;
  } catch (error) {
    if (error.message?.includes('already registered') || error.message?.includes('already exists')) {
      console.log('! Recruiter already exists, logging in...');
      return await loginRecruiter();
    }
    console.error('✗ Error signing up recruiter:', error.message);
    return false;
  }
}

async function loginRecruiter() {
  try {
    const response = await apiRequest('POST', '/auth/login', {
      email: recruiterData.email,
      password: recruiterData.password
    });
    authToken = response.data.tokens.accessToken;
    userId = response.data.user.id;
    console.log('✓ Recruiter logged in successfully');
    return true;
  } catch (error) {
    console.error('✗ Error logging in:', error.message);
    return false;
  }
}

async function createJobs() {
  console.log('\nCreating jobs...');
  const createdJobs = [];
  
  for (const job of jobs) {
    try {
      const response = await apiRequest('POST', '/recruiter/jobs', job, authToken);
      createdJobs.push(response.data);
      console.log(`✓ Created job: ${job.title}`);
    } catch (error) {
      console.error(`✗ Error creating job ${job.title}:`, error.message);
    }
  }
  
  return createdJobs;
}

async function signupCandidates() {
  console.log('\nSigning up candidates...');
  const createdCandidates = [];
  
  for (const candidate of candidates) {
    try {
      const response = await apiRequest('POST', '/auth/signup', candidate);
      createdCandidates.push({
        ...response.data.user,
        candidateId: response.data.user.id
      });
      console.log(`✓ Created candidate: ${candidate.first_name} ${candidate.last_name}`);
    } catch (error) {
      if (error.message?.includes('already registered') || error.message?.includes('already exists')) {
        console.log(`! Candidate ${candidate.first_name} ${candidate.last_name} already exists`);
      } else {
        console.error(`✗ Error creating candidate:`, error.message);
      }
    }
  }
  
  return createdCandidates;
}

async function createSubmissions(createdJobs, createdCandidates) {
  if (createdJobs.length === 0 || createdCandidates.length === 0) {
    console.log('\n! Skipping submission creation - no jobs or candidates available');
    return;
  }
  
  console.log('\nCreating submissions...');
  
  // Create submissions for each candidate to first job
  for (let i = 0; i < Math.min(createdCandidates.length, createdJobs.length); i++) {
    try {
      // Login as candidate first
      const candidateLogin = await apiRequest('POST', '/auth/login', {
        email: candidates[i].email,
        password: candidates[i].password
      });
      
      const candidateToken = candidateLogin.data.tokens.accessToken;
      
      // Create submission
      await apiRequest('POST', '/candidate/submissions', {
        job_id: createdJobs[i].id,
        cover_letter: 'I am very interested in this position and believe I would be a great fit.',
        expected_salary: createdJobs[i].salary_min + 10000
      }, candidateToken);
      
      console.log(`✓ Created submission: ${candidates[i].first_name} ${candidates[i].last_name} → ${createdJobs[i].title}`);
    } catch (error) {
      console.error(`✗ Error creating submission:`, error.message);
    }
  }
}

async function displayDashboard() {
  console.log('\n\n=== Dashboard Stats ===');
  try {
    const response = await apiRequest('GET', '/dashboard/stats', null, authToken);
    console.log(JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('✗ Error fetching dashboard:', error.message);
  }
}

async function main() {
  console.log('=== Seeding Database ===\n');
  
  // 1. Sign up/login recruiter
  const recruiterSuccess = await signupRecruiter();
  if (!recruiterSuccess) {
    console.error('Failed to authenticate recruiter. Exiting.');
    process.exit(1);
  }
  
  // 2. Create jobs
  const createdJobs = await createJobs();
  
  // 3. Sign up candidates
  const createdCandidates = await signupCandidates();
  
  // 4. Create submissions
  await createSubmissions(createdJobs, createdCandidates);
  
  // 5. Display dashboard stats
  await displayDashboard();
  
  console.log('\n=== Seeding Complete ===');
  console.log('\nYou can now login with:');
  console.log(`  Recruiter: ${recruiterData.email} / ${recruiterData.password}`);
  console.log(`  Candidates: candidate1@test.com / Test123!@# (and candidate2, candidate3)`);
}

main().catch(console.error);

