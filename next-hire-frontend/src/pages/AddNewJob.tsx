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
import { jobService } from "@/services/jobService";
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
      jobStatus: "draft",
      positionsAvailable: "1",
      maxSubmissionsAllowed: "",
      vendorEligible: true,
      remoteWorkAllowed: false,
      startDate: "",
      endDate: "",
      applicationDeadline: ""
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
        throw new Error("Job title is required");
      }
      if (!data.jobDescription?.trim()) {
        throw new Error("Job description is required");
      }
      if (!data.customer?.trim()) {
        throw new Error("Company name is required");
      }

      // Map form data to API format
      const jobData = {
        title: data.jobTitle.trim(),
        description: data.jobDescription.trim(),
        external_description: data.externalJobDescription?.trim(),
        company_name: data.customer.trim(),
        location: data.location?.trim() || "Remote", // Provide default if missing
        city: data.city?.trim(),
        state: data.state?.trim(),
        country: data.country?.trim(),
        job_type: mapJobTypeToAPI(data.jobType) || "full_time", // Ensure valid job type
        salary_min: data.salaryMin ? parseFloat(data.salaryMin) : undefined,
        salary_max: data.salaryMax ? parseFloat(data.salaryMax) : undefined,
        salary_currency: data.salaryCurrency || "USD",
        experience_min: data.experienceMin ? parseInt(data.experienceMin) : undefined,
        experience_max: data.experienceMax ? parseInt(data.experienceMax) : undefined,
        required_skills: skills.length > 0 ? skills : [],
        preferred_skills: secondarySkills.length > 0 ? secondarySkills : [],
        education_requirements: data.educationRequirements?.trim(),
        status: mapStatusToAPI(data.jobStatus) || "draft",
        priority: mapPriorityToAPI(data.priority) || "medium",
        positions_available: data.positionsAvailable ? parseInt(data.positionsAvailable) : 1,
        vendor_eligible: Boolean(data.vendorEligible),
        remote_work_allowed: Boolean(data.remoteWorkAllowed),
        start_date: data.startDate ? new Date(data.startDate).toISOString() : undefined,
        end_date: data.endDate ? new Date(data.endDate).toISOString() : undefined,
        application_deadline: data.applicationDeadline ? new Date(data.applicationDeadline).toISOString() : undefined,
      };

      // Additional validation
      if (!["full_time", "part_time", "contract", "temporary"].includes(jobData.job_type)) {
        jobData.job_type = "full_time"; // Default to full_time if invalid
      }
      if (!["low", "medium", "high"].includes(jobData.priority)) {
        jobData.priority = "medium"; // Default to medium if invalid
      }
      if (!["draft", "active", "paused", "closed"].includes(jobData.status)) {
        jobData.status = "draft"; // Default to draft if invalid
      }

      console.log('Creating new job:', jobData);
      
      const response = await jobService.createJob(jobData);
      
      if (response.success) {
        toast({
          title: "Job Created Successfully!",
          description: `Job "${jobData.title}" has been created and saved.`,
        });

        navigate("/dashboard/jobs");
      } else {
        throw new Error(response.message || "Failed to create job");
      }
    } catch (error: any) {
      console.error('Error creating job:', error);
      toast({
        title: "Error Creating Job",
        description: error.response?.data?.message || error.message || "An unexpected error occurred",
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="border-gray-200 focus:border-green-400">
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white">
                        <SelectItem value="CA">California</SelectItem>
                        <SelectItem value="NY">New York</SelectItem>
                        <SelectItem value="TX">Texas</SelectItem>
                        <SelectItem value="FL">Florida</SelectItem>
                        <SelectItem value="WA">Washington</SelectItem>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
        <form onSubmit={form.handleSubmit(handleSubmit)}>
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