# Testing Basic Flows

## Prerequisites
1. Backend should be running on http://localhost:5001
2. Frontend should be running on http://localhost:5173
3. Database should be initialized

## Test Steps

### 1. Test Backend Health
- Open browser to http://localhost:5001/health
- Should return: `{"status":"OK","timestamp":"...","uptime":...,"environment":"development"}`

### 2. Test Candidate Flow
1. **Signup as Candidate**
   - Go to http://localhost:5173/auth/signup-candidate
   - Fill form with valid data
   - Check email for OTP
   - Verify OTP

2. **Complete Profile**
   - Go to /dashboard/profile
   - Fill out profile information
   - Save profile

3. **Browse Jobs**
   - Go to /jobs or /dashboard/job-search
   - Should see list of jobs
   - Click on a job to view details

4. **Apply to Job**
   - Click "Apply Now" on job detail page
   - Fill application form
   - Submit application
   - Should redirect to /dashboard/my-submissions

### 3. Test Recruiter Flow
1. **Signup as Recruiter**
   - Go to http://localhost:5173/auth/signup
   - Fill form with role "recruiter"
   - Verify OTP

2. **Create Job**
   - Go to /dashboard/jobs/new
   - Fill job creation form
   - Submit job
   - Should redirect to /dashboard/jobs

3. **View Jobs**
   - Go to /dashboard/jobs
   - Should see created jobs
   - Click on job to view details

4. **Manage Applications**
   - Go to job detail page
   - Should see applications if any
   - Update application status

## Common Issues & Solutions

### Backend Not Starting
- Check if port 5001 is available
- Check database connection
- Check environment variables

### Frontend API Errors
- Check if backend is running
- Check CORS configuration
- Check API endpoints match backend routes

### Authentication Issues
- Check JWT token storage
- Check token expiration
- Check role-based permissions

### Database Issues
- Check if database file exists
- Check if tables are created
- Check if seed data is present

## API Endpoints to Test

### Public Endpoints
- GET /health
- GET /api/v1/jobs (public job search)
- GET /api/v1/jobs/:id/public (public job details)

### Candidate Endpoints (require candidate auth)
- GET /api/v1/candidate/profile
- PUT /api/v1/candidate/profile
- GET /api/v1/candidate/jobs
- POST /api/v1/candidate/jobs/:id/apply
- GET /api/v1/candidate/submissions

### Recruiter Endpoints (require recruiter auth)
- GET /api/v1/recruiter/profile
- GET /api/v1/recruiter/jobs
- POST /api/v1/recruiter/jobs
- GET /api/v1/recruiter/jobs/:id/submissions

### Vendor Endpoints (require vendor auth)
- GET /api/v1/vendor/profile
- GET /api/v1/vendor/jobs
- POST /api/v1/vendor/jobs/:id/submit
