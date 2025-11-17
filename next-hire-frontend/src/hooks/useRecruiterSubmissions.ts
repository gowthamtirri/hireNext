import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { 
  submissionService, 
  Submission, 
  SubmissionFilters, 
  UpdateSubmissionStatusRequest,
  SubmissionStatus
} from "@/services/submissionService";
import { recruiterService } from "@/services/recruiterService";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Hook for recruiters to view all submissions across all their jobs
 */
export const useRecruiterSubmissions = (initialFilters: SubmissionFilters = {}) => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [filters, setFilters] = useState<SubmissionFilters>(initialFilters);

  const { user } = useAuth();

  const fetchAllSubmissions = useCallback(async (searchFilters: SubmissionFilters = {}) => {
    if (user?.role !== "recruiter") return;

    try {
      setLoading(true);
      setError(null);

      // Step 1: Get all jobs created by this recruiter (with pagination)
      console.log("Fetching recruiter jobs...");
      let allRecruiterJobs: any[] = [];
      let currentPage = 1;
      let hasMoreJobs = true;
      const jobsLimit = 100; // Backend max limit
      
      while (hasMoreJobs) {
        const jobsResponse = await recruiterService.getJobs({ 
          page: currentPage, 
          limit: jobsLimit
        });
        
        const jobs = jobsResponse.data.jobs || [];
        allRecruiterJobs = [...allRecruiterJobs, ...jobs];
        
        const pagination = jobsResponse.data.pagination || {};
        const totalPages = pagination.total_pages || pagination.totalPages || 1;
        
        if (currentPage >= totalPages || jobs.length < jobsLimit) {
          hasMoreJobs = false;
        } else {
          currentPage++;
        }
      }
      
      const recruiterJobs = allRecruiterJobs;
      console.log(`Found ${recruiterJobs.length} recruiter jobs`);
      
      if (recruiterJobs.length === 0) {
        console.log("No jobs found for recruiter");
        setSubmissions([]);
        setPagination({
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: 10,
          hasNextPage: false,
          hasPrevPage: false,
        });
        setFilters(searchFilters);
        return;
      }

      // Step 2: Fetch submissions for all jobs (with pagination)
      const allSubmissionsPromises = recruiterJobs.map(async (job) => {
        let allJobSubmissions: any[] = [];
        let currentPage = 1;
        let hasMore = true;
        const submissionsLimit = 100; // Backend max limit
        
        while (hasMore) {
          try {
            const response = await recruiterService.getJobSubmissions(job.id, {
              page: currentPage,
              limit: submissionsLimit,
              ...searchFilters
            });
            
            const submissions = (response as any).data?.submissions || response.data?.submissions || [];
            allJobSubmissions = [...allJobSubmissions, ...submissions];
            
            const pagination = (response as any).data?.pagination || response.data?.pagination || {};
            const totalPages = pagination.total_pages || pagination.totalPages || 1;
            
            if (currentPage >= totalPages || submissions.length < submissionsLimit) {
              hasMore = false;
            } else {
              currentPage++;
            }
          } catch (err) {
            console.warn(`Error fetching submissions for job ${job.id} page ${currentPage}:`, err);
            hasMore = false;
          }
        }
        
        return {
          data: {
            submissions: allJobSubmissions,
            pagination: {
              currentPage: 1,
              totalPages: 1,
              totalItems: allJobSubmissions.length,
              itemsPerPage: allJobSubmissions.length,
              hasNextPage: false,
              hasPrevPage: false,
            }
          }
        };
      });

      const submissionsResponses = await Promise.all(allSubmissionsPromises);

      // Step 3: Combine all submissions into one array
      let allSubmissions: Submission[] = [];
      submissionsResponses.forEach((response, index) => {
        const jobSubmissions = response.data.submissions || [];
        console.log(`Job ${recruiterJobs[index].id} (${recruiterJobs[index].title}): ${jobSubmissions.length} submissions`);
        // Add job info to each submission if not present
        const enrichedSubmissions = jobSubmissions.map(sub => ({
          ...sub,
          job: sub.job || recruiterJobs[index]
        }));
        allSubmissions = [...allSubmissions, ...enrichedSubmissions];
      });
      
      console.log(`Total submissions found: ${allSubmissions.length}`);

      // Step 4: Apply filters (status, search, etc.)
      let filteredSubmissions = allSubmissions;

      if (searchFilters.status) {
        filteredSubmissions = filteredSubmissions.filter(
          sub => sub.status === searchFilters.status
        );
      }

      if (searchFilters.job_id) {
        filteredSubmissions = filteredSubmissions.filter(
          sub => sub.job_id === searchFilters.job_id
        );
      }

      if (searchFilters.search) {
        const searchLower = searchFilters.search.toLowerCase();
        filteredSubmissions = filteredSubmissions.filter(sub => {
          const jobTitle = sub.job?.title?.toLowerCase() || "";
          const candidateName = `${sub.candidate?.first_name || ""} ${sub.candidate?.last_name || ""}`.toLowerCase();
          const companyName = sub.job?.company_name?.toLowerCase() || "";
          return jobTitle.includes(searchLower) || 
                 candidateName.includes(searchLower) || 
                 companyName.includes(searchLower);
        });
      }

      // Step 5: Sort by submitted_at (newest first)
      filteredSubmissions.sort((a, b) => 
        new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
      );

      // Step 6: Apply pagination
      const page = searchFilters.page || 1;
      const limit = searchFilters.limit || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedSubmissions = filteredSubmissions.slice(startIndex, endIndex);

      const totalItems = filteredSubmissions.length;
      const totalPages = Math.ceil(totalItems / limit);

      console.log(`Setting ${paginatedSubmissions.length} submissions (page ${page} of ${totalPages}, total: ${totalItems})`);
      setSubmissions(paginatedSubmissions);
      setPagination({
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      });
      setFilters(searchFilters);

    } catch (err: any) {
      const errorMessage = err.message || "Failed to fetch submissions";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  const searchSubmissions = useCallback((searchFilters: SubmissionFilters) => {
    fetchAllSubmissions(searchFilters);
  }, [fetchAllSubmissions]);

  const loadMore = useCallback(() => {
    if (pagination.hasNextPage) {
      fetchAllSubmissions({ ...filters, page: pagination.currentPage + 1 });
    }
  }, [fetchAllSubmissions, filters, pagination]);

  const refresh = useCallback(() => {
    fetchAllSubmissions(filters);
  }, [fetchAllSubmissions, filters]);

  const updateSubmissionStatus = useCallback(async (
    submissionId: string, 
    data: UpdateSubmissionStatusRequest
  ): Promise<Submission | null> => {
    if (user?.role !== "recruiter") {
      toast.error("Only recruiters can update submission status");
      return null;
    }

    try {
      const response = await recruiterService.updateSubmissionStatus(submissionId, data);
      toast.success(`Application status updated to ${recruiterService.formatSubmissionStatus(data.status)}`);
      
      // Refresh the submissions list
      refresh();
      
      return response.data;
    } catch (err: any) {
      const errorMessage = err.message || "Failed to update submission status";
      toast.error(errorMessage);
      return null;
    }
  }, [user?.role, refresh]);

  // Load initial data
  useEffect(() => {
    if (user?.role === "recruiter") {
      fetchAllSubmissions();
    }
  }, [user?.role]);

  return {
    submissions,
    loading,
    error,
    pagination,
    filters,
    searchSubmissions,
    loadMore,
    refresh,
    updateSubmissionStatus,
    setFilters,
  };
};
