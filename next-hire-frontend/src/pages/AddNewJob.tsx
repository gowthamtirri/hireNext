import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Plus,
  Building2,
  Briefcase,
  MapPin,
  DollarSign,
  Calendar,
  Users2,
  FileText,
  Settings,
  Target,
  User,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Clock,
  Trash2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { recruiterService } from "@/services/recruiterService";
import { useAuth } from "@/contexts/AuthContext";

const AddNewJob = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);
  const [secondarySkills, setSecondarySkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [newSecondarySkill, setNewSecondarySkill] = useState("");

  const form = useForm({
    defaultValues: {
      jobTitle: "",
      customer: "",
      jobDescription: "",
      externalJobDescription: "",
      jobType: "",
      location: "",
      city: "",
      state: "",
      country: "US",
      salaryMin: "",
      salaryMax: "",
      salaryCurrency: "USD",
      experienceMin: "",
      experienceMax: "",
      educationRequirements: "",
      priority: "",
      jobStatus: "Active",
      positionsAvailable: "1",
      maxSubmissionsAllowed: "",
      vendorEligible: true,
      remoteWorkAllowed: false,
      startDate: "",
      endDate: "",
      applicationDeadline: "",
      clientContact: "",
      clientJobId: "",
      jobStartDate: "",
      jobEndDate: "",
      numberOfPositions: "1",
      taxTerms: "",
      paymentTerms: "",
      expensePaid: false,
      spokenLanguages: "",
      documentsRequired: ""
    }
  });

  const steps = [
    { id: 1, title: "Basic Info", icon: Briefcase },
    { id: 2, title: "Details", icon: FileText },
    { id: 3, title: "Requirements", icon: Target },
    { id: 4, title: "Terms", icon: Settings }
  ];

  const addSkill = (type: 'primary' | 'secondary') => {
    const skill = type === 'primary' ? newSkill : newSecondarySkill;
    const setSkillsArray = type === 'primary' ? setSkills : setSecondarySkills;
    const currentSkills = type === 'primary' ? skills : secondarySkills;
    const setNewSkillState = type === 'primary' ? setNewSkill : setNewSecondarySkill;

    if (skill.trim() && !currentSkills.includes(skill.trim())) {
      setSkillsArray([...currentSkills, skill.trim()]);
      setNewSkillState("");
    }
  };

  const removeSkill = (skillToRemove: string, type: 'primary' | 'secondary') => {
    const setSkillsArray = type === 'primary' ? setSkills : setSecondarySkills;
    const currentSkills = type === 'primary' ? skills : secondarySkills;
    setSkillsArray(currentSkills.filter(skill => skill !== skillToRemove));
  };

  // Helper functions to map form values to API format
  const mapJobTypeToAPI = (jobType: string) => {
    const mapping: Record<string, string> = {
      "Full-time": "full_time",
      "Part-time": "part_time",
      "Contract": "contract",
      "Temporary": "temporary",
      "Full Time": "full_time",
      "Part Time": "part_time",
    };
    return mapping[jobType] || jobType?.toLowerCase().replace(/[\s-]/g, '_');
  };

  const mapPriorityToAPI = (priority: string) => {
    const mapping: Record<string, string> = {
      "High": "high",
      "Medium": "medium", 
      "Low": "low",
    };
    return mapping[priority] || priority?.toLowerCase();
  };

  const mapStatusToAPI = (status: string) => {
    const mapping: Record<string, string> = {
      "Draft": "draft",
      "Active": "active",
      "Paused": "paused",
      "Closed": "closed",
    };
    return mapping[status] || status?.toLowerCase();
  };

  const handleSubmit = async (data: any) => {
    // Ensure we're on the final step before submitting
    if (currentStep !== 4) {
      toast({
        title: "Please Complete All Steps",
        description: "Please complete all steps before submitting.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a job.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!data.jobTitle?.trim()) {
        toast({
          title: "Validation Error",
          description: "Job title is required",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      
      if (!data.jobDescription?.trim()) {
        toast({
          title: "Validation Error",
          description: "Job description is required",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      
      if (!data.customer?.trim()) {
        toast({
          title: "Validation Error",
          description: "Company name is required",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Validate location (backend requires it)
      if (!data.location?.trim()) {
        toast({
          title: "Validation Error",
          description: "Location is required",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Validate job type (backend requires it)
      const mappedJobType = mapJobTypeToAPI(data.jobType);
      if (!mappedJobType || !["full_time", "part_time", "contract", "temporary"].includes(mappedJobType)) {
        toast({
          title: "Validation Error",
          description: "Please select a valid job type",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Map form data to API format - start with required fields
      const jobData: any = {
        title: data.jobTitle.trim(),
        description: (data.jobDescription || "").trim(), // Ensure it's a string
        company_name: data.customer.trim(),
        location: data.location.trim(), // Required field
        job_type: mappedJobType, // Required field, already validated
        country: (data.country?.trim() || "US"), // Always send country
        salary_currency: (data.salaryCurrency || "USD"), // Always send currency
      };
      
      // Ensure description is not empty (backend requires it)
      if (!jobData.description) {
        toast({
          title: "Validation Error",
          description: "Job description is required",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Status - map from form to API format (default to active)
      const mappedStatus = mapStatusToAPI(data.jobStatus);
      if (mappedStatus && ["draft", "active", "paused", "closed"].includes(mappedStatus)) {
        jobData.status = mappedStatus;
      } else {
        // Default to active if not specified or invalid
        jobData.status = "active";
      }

      // Optional fields - only add if they have values
      if (data.externalJobDescription?.trim()) {
        jobData.external_description = data.externalJobDescription.trim();
      }
      
      if (data.city?.trim()) {
        jobData.city = data.city.trim();
      }
      
      if (data.state?.trim()) {
        jobData.state = data.state.trim();
      }

      // Salary fields
      // Note: salary_currency is already set in initial jobData object above
      
      if (data.salaryMin && data.salaryMin.toString().trim() !== "") {
        const salaryMin = parseFloat(data.salaryMin);
        if (!isNaN(salaryMin) && salaryMin >= 0) {
          jobData.salary_min = salaryMin;
        }
      }
      
      if (data.salaryMax && data.salaryMax.toString().trim() !== "") {
        const salaryMax = parseFloat(data.salaryMax);
        if (!isNaN(salaryMax) && salaryMax >= 0) {
          jobData.salary_max = salaryMax;
        }
      }

      // Experience fields
      if (data.experienceMin && data.experienceMin.toString().trim() !== "") {
        const expMin = parseInt(data.experienceMin.toString());
        if (!isNaN(expMin) && expMin >= 0) {
          jobData.experience_min = expMin;
        }
      }
      
      if (data.experienceMax && data.experienceMax.toString().trim() !== "") {
        const expMax = parseInt(data.experienceMax.toString());
        if (!isNaN(expMax) && expMax >= 0) {
          jobData.experience_max = expMax;
        }
      }

      // Skills
      if (skills.length > 0) {
        jobData.required_skills = skills;
      }
      
      if (secondarySkills.length > 0) {
        jobData.preferred_skills = secondarySkills;
      }

      // Other optional fields
      if (data.educationRequirements?.trim()) {
        jobData.education_requirements = data.educationRequirements.trim();
      }

      // Priority (optional, defaults to medium in backend)
      const mappedPriority = mapPriorityToAPI(data.priority);
      if (mappedPriority && ["low", "medium", "high"].includes(mappedPriority)) {
        jobData.priority = mappedPriority;
      }

      // Positions available - check both numberOfPositions and positionsAvailable
      const positionsValue = data.numberOfPositions || data.positionsAvailable;
      if (positionsValue && positionsValue.toString().trim() !== "") {
        const positions = parseInt(positionsValue.toString());
        if (!isNaN(positions) && positions >= 1) {
          jobData.positions_available = positions;
        }
      } else {
        // Default to 1 if not provided
        jobData.positions_available = 1;
      }

      if (data.maxSubmissionsAllowed && data.maxSubmissionsAllowed.toString().trim() !== "") {
        const maxSubs = parseInt(data.maxSubmissionsAllowed.toString());
        if (!isNaN(maxSubs) && maxSubs >= 1) {
          jobData.max_submissions_allowed = maxSubs;
        }
      }

      // Terms fields - store in external_description or as custom fields
      let termsInfo = "";
      if (data.taxTerms?.trim()) {
        termsInfo += `Tax Terms: ${data.taxTerms.trim()}\n`;
      }
      if (data.paymentTerms?.trim()) {
        termsInfo += `Payment Terms: ${data.paymentTerms.trim()}\n`;
      }
      if (data.expensePaid !== undefined) {
        termsInfo += `Expenses Paid: ${data.expensePaid ? "Yes" : "No"}\n`;
      }
      if (data.spokenLanguages?.trim()) {
        termsInfo += `Spoken Languages: ${data.spokenLanguages.trim()}\n`;
      }
      if (data.documentsRequired?.trim()) {
        termsInfo += `Required Documents: ${data.documentsRequired.trim()}\n`;
      }
      
      if (termsInfo) {
        if (jobData.external_description) {
          jobData.external_description = `${jobData.external_description}\n\n${termsInfo}`;
        } else {
          jobData.external_description = termsInfo.trim();
        }
      }

      // Boolean fields
      jobData.vendor_eligible = Boolean(data.vendorEligible);
      jobData.remote_work_allowed = Boolean(data.remoteWorkAllowed);

      // Date fields - check both field names (jobStartDate/jobEndDate from form, startDate/endDate for compatibility)
      const startDateValue = data.jobStartDate || data.startDate;
      const endDateValue = data.jobEndDate || data.endDate;
      
      if (startDateValue) {
        try {
          jobData.start_date = new Date(startDateValue).toISOString();
        } catch (e) {
          console.warn("Invalid start date:", startDateValue);
        }
      }
      
      if (endDateValue) {
        try {
          jobData.end_date = new Date(endDateValue).toISOString();
        } catch (e) {
          console.warn("Invalid end date:", endDateValue);
        }
      }
      
      if (data.applicationDeadline) {
        try {
          jobData.application_deadline = new Date(data.applicationDeadline).toISOString();
        } catch (e) {
          console.warn("Invalid application deadline:", data.applicationDeadline);
        }
      }

      // Client fields - append to external_description to preserve the data
      // These can be extracted later if backend adds dedicated fields
      let clientInfo = "";
      if (data.clientContact?.trim()) {
        clientInfo += `Client Contact: ${data.clientContact.trim()}\n`;
      }
      if (data.clientJobId?.trim()) {
        clientInfo += `Client Job ID: ${data.clientJobId.trim()}\n`;
      }
      
      if (clientInfo) {
        if (jobData.external_description) {
          jobData.external_description = `${jobData.external_description}\n\n${clientInfo}`;
        } else {
          jobData.external_description = clientInfo.trim();
        }
      }

      // Log all form data for debugging
      console.log('=== FORM DATA DEBUG ===');
      console.log('Raw form data:', data);
      console.log('Skills:', { required: skills, preferred: secondarySkills });
      console.log('Processed job data:', JSON.stringify(jobData, null, 2));
      console.log('=== END DEBUG ===');
      
      const response = await recruiterService.createJob(jobData);
      console.log('Job creation response:', response);
      
      // Handle response structure - backend returns { success: true, data: job, message: "..." }
      if (response.success || response.data) {
        toast({
          title: "Job Created Successfully!",
          description: `Job "${jobData.title}" has been created and saved.`,
        });

        // Small delay to show success message
        setTimeout(() => {
        navigate("/dashboard/jobs");
        }, 1000);
      } else {
        throw new Error(response.message || "Failed to create job");
      }
    } catch (error: any) {
      console.error('Error creating job:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      
      // Better error handling for validation errors
      let errorMessage = "An unexpected error occurred";
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Handle validation errors array
        if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
          const firstError = errorData.errors[0];
          errorMessage = firstError.message || firstError.msg || "Validation error";
        } 
        // Handle single error message (validation middleware joins all errors with ", ")
        else if (errorData.message) {
          errorMessage = errorData.message;
          // If multiple errors are joined, show first one for cleaner UI
          if (errorMessage.includes(", ")) {
            errorMessage = errorMessage.split(", ")[0];
          }
        }
        // Handle error string
        else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error Creating Job",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const previousStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="jobTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">Job Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Senior React Developer" className="border-gray-200 focus:border-green-400" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="customer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">Company *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. TechCorp Inc" className="border-gray-200 focus:border-green-400" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="jobType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">Job Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="border-gray-200 focus:border-green-400">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white">
                        <SelectItem value="Full-time">Full-time</SelectItem>
                        <SelectItem value="Part-time">Part-time</SelectItem>
                        <SelectItem value="Contract">Contract</SelectItem>
                        <SelectItem value="Temporary">Temporary</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">Priority *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="border-gray-200 focus:border-green-400">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white">
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">Location *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. San Francisco, CA or Remote" className="border-gray-200 focus:border-green-400" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">City</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. San Francisco" className="border-gray-200 focus:border-green-400" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">State</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. CA" className="border-gray-200 focus:border-green-400" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">Country</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="border-gray-200 focus:border-green-400">
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white">
                        <SelectItem value="US">United States</SelectItem>
                        <SelectItem value="CA">Canada</SelectItem>
                        <SelectItem value="UK">United Kingdom</SelectItem>
                        <SelectItem value="AU">Australia</SelectItem>
                        <SelectItem value="IN">India</SelectItem>
                        <SelectItem value="DE">Germany</SelectItem>
                        <SelectItem value="FR">France</SelectItem>
                        <SelectItem value="SG">Singapore</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="salaryMin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">Min Salary</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g. 120000" className="border-gray-200 focus:border-green-400" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="salaryMax"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">Max Salary</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g. 150000" className="border-gray-200 focus:border-green-400" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="salaryCurrency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">Currency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="border-gray-200 focus:border-green-400">
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white">
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="jobDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 font-medium">Internal Job Description *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Detailed description for internal use..."
                      className="min-h-[120px] border-gray-200 focus:border-green-400"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="externalJobDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 font-medium">External Job Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Description for job boards and candidates..."
                      className="min-h-[120px] border-gray-200 focus:border-green-400"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="jobStartDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" className="border-gray-200 focus:border-green-400" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="jobEndDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">End Date</FormLabel>
                    <FormControl>
                      <Input type="date" className="border-gray-200 focus:border-green-400" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="clientContact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">Client Contact</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. John Smith" className="border-gray-200 focus:border-green-400" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="clientJobId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">Client Job ID</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. TC-001" className="border-gray-200 focus:border-green-400" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="minExperience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">Min Experience (years)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g. 2" className="border-gray-200 focus:border-green-400" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxExperience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">Max Experience (years)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g. 8" className="border-gray-200 focus:border-green-400" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="educationQualifications"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 font-medium">Education Requirements</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Bachelor's in Computer Science" className="border-gray-200 focus:border-green-400" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Primary Skills */}
            <div>
              <Label className="text-gray-700 font-medium mb-3 block">Primary Skills</Label>
              <div className="flex flex-wrap gap-2 mb-3">
                {skills.map((skill, index) => (
                  <Badge key={index} variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                    {skill}
                    <button
                      onClick={() => removeSkill(skill, 'primary')}
                      className="ml-2 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Add a skill"
                  className="border-gray-200 focus:border-green-400"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill('primary'))}
                />
                <Button type="button" onClick={() => addSkill('primary')} variant="outline" size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Secondary Skills */}
            <div>
              <Label className="text-gray-700 font-medium mb-3 block">Secondary Skills</Label>
              <div className="flex flex-wrap gap-2 mb-3">
                {secondarySkills.map((skill, index) => (
                  <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                    {skill}
                    <button
                      onClick={() => removeSkill(skill, 'secondary')}
                      className="ml-2 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newSecondarySkill}
                  onChange={(e) => setNewSecondarySkill(e.target.value)}
                  placeholder="Add a secondary skill"
                  className="border-gray-200 focus:border-green-400"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill('secondary'))}
                />
                <Button type="button" onClick={() => addSkill('secondary')} variant="outline" size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <FormField
              control={form.control}
              name="spokenLanguages"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 font-medium">Spoken Languages</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. English, Spanish" className="border-gray-200 focus:border-green-400" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="documentsRequired"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 font-medium">Required Documents</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Resume, Portfolio, References" className="border-gray-200 focus:border-green-400" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="numberOfPositions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">Number of Positions</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="1" className="border-gray-200 focus:border-green-400" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxSubmissionsAllowed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">Max Submissions</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="10" className="border-gray-200 focus:border-green-400" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="taxTerms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">Tax Terms</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="border-gray-200 focus:border-green-400">
                          <SelectValue placeholder="Select tax terms" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white">
                        <SelectItem value="W2">W2</SelectItem>
                        <SelectItem value="1099">1099</SelectItem>
                        <SelectItem value="Corp to Corp">Corp to Corp</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentTerms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">Payment Terms</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="border-gray-200 focus:border-green-400">
                          <SelectValue placeholder="Select payment terms" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white">
                        <SelectItem value="Net 15">Net 15</SelectItem>
                        <SelectItem value="Net 30">Net 30</SelectItem>
                        <SelectItem value="Net 45">Net 45</SelectItem>
                        <SelectItem value="Net 60">Net 60</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="expensePaid"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-200 p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-gray-700 font-medium">Expenses Paid</FormLabel>
                    <div className="text-sm text-gray-600">
                      Will the company cover job-related expenses?
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-gradient-to-br from-green-500/20 to-green-600/30 backdrop-blur-sm border border-white/20">
              <Plus className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 font-roboto-slab">Add New Job</h1>
              <p className="text-sm lg:text-base text-gray-600 font-roboto-slab">Create a new job posting</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => navigate("/dashboard/jobs")}
            className="border-gray-200 hover:bg-gray-50"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        </div>
      </div>

      {/* Progress Steps */}
      <Card className="backdrop-blur-xl bg-white/30 border border-white/20 shadow-md">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isActive 
                        ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/30' 
                        : isCompleted
                        ? 'bg-green-100 text-green-600 border-2 border-green-200'
                        : 'bg-gray-100 text-gray-400 border-2 border-gray-200'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <IconComponent className="w-5 h-5" />
                      )}
                    </div>
                    <span className={`text-sm font-medium mt-2 ${
                      isActive ? 'text-green-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-0.5 mx-4 transition-all duration-300 ${
                      currentStep > step.id ? 'bg-green-400' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Form Content */}
      <Form {...form}>
        <form onSubmit={(e) => {
          e.preventDefault();
          // Only allow submission on step 4
          if (currentStep === 4) {
            form.handleSubmit(handleSubmit)(e);
          } else {
            toast({
              title: "Please Complete All Steps",
              description: "Please complete all steps before submitting.",
              variant: "destructive",
            });
          }
        }}>
          <Card className="backdrop-blur-xl bg-white/30 border border-white/20 shadow-md">
            <CardHeader className="border-b border-white/20 pb-4">
              <CardTitle className="text-lg font-bold font-roboto-slab text-gray-800">
                {steps.find(s => s.id === currentStep)?.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {renderStepContent()}
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={previousStep}
              disabled={currentStep === 1}
              className="border-gray-200 hover:bg-gray-50"
            >
              Previous
            </Button>
            
            <div className="flex gap-2">
              {currentStep < 4 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white shadow-md"
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white shadow-md disabled:opacity-50"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSubmitting ? "Creating Job..." : "Create Job"}
                </Button>
              )}
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default AddNewJob;