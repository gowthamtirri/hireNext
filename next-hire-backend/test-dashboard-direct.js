// Direct test of dashboard logic
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./database.sqlite');

console.log('Testing Dashboard Queries Directly\n');

// Test 1: Count jobs for recruiter
db.get(
  `SELECT COUNT(*) as count FROM jobs WHERE created_by = ?`,
  ['dfd8d905-4277-479f-a5de-f0f1cee24fc6'],
  (err, row) => {
    if (err) {
      console.error('Error counting jobs:', err);
    } else {
      console.log('✓ Jobs for recruiter:', row.count);
    }
  }
);

// Test 2: Count submissions
db.get(
  `SELECT COUNT(*) as count FROM submissions`,
  (err, row) => {
    if (err) {
      console.error('Error counting submissions:', err);
    } else {
      console.log('✓ Total submissions:', row.count);
    }
  }
);

// Test 3: Get submissions with job details
db.all(
  `SELECT s.*, j.title, j.company_name, c.first_name, c.last_name 
   FROM submissions s
   LEFT JOIN jobs j ON s.job_id = j.id
   LEFT JOIN candidates c ON s.candidate_id = c.id
   LIMIT 5`,
  (err, rows) => {
    if (err) {
      console.error('Error fetching submissions:', err);
    } else {
      console.log('✓ Submissions with details:', rows.length);
      if (rows.length > 0) {
        console.log('  Sample:', {
          job: rows[0].title,
          candidate: `${rows[0].first_name} ${rows[0].last_name}`,
          status: rows[0].status
        });
      }
    }
    
    db.close();
  }
);

