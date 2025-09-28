import { Router, Request, Response } from "express";
import { param, query } from "express-validator";
import { Op } from "sequelize";
import { Job } from "../models";
import { asyncHandler } from "../middleware/errorHandler";
import { validate } from "../middleware/validation";

const router = Router();

// Public job search endpoint (no authentication required)
const searchJobs = asyncHandler(async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 20,
    search,
    job_type,
    location,
    salary_min,
    salary_max,
    experience_min,
    experience_max,
    skills,
    remote_work_allowed,
    company_name,
  } = req.query;

  const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

  // Build where conditions - only show active jobs
  const whereConditions: any = {
    status: "active",
    application_deadline: {
      [Op.or]: [{ [Op.is]: null }, { [Op.gte]: new Date() }],
    },
  };

  // Search in title, description, and company name
  if (search) {
    whereConditions[Op.or] = [
      { title: { [Op.iLike]: `%${search}%` } },
      { external_description: { [Op.iLike]: `%${search}%` } },
      { company_name: { [Op.iLike]: `%${search}%` } },
    ];
  }

  if (job_type) {
    whereConditions.job_type = job_type;
  }

  if (location) {
    whereConditions[Op.or] = [
      { location: { [Op.iLike]: `%${location}%` } },
      { city: { [Op.iLike]: `%${location}%` } },
      { state: { [Op.iLike]: `%${location}%` } },
    ];
  }

  if (salary_min) {
    whereConditions.salary_min = { [Op.gte]: parseFloat(salary_min as string) };
  }

  if (salary_max) {
    whereConditions.salary_max = { [Op.lte]: parseFloat(salary_max as string) };
  }

  if (experience_min) {
    whereConditions.experience_min = {
      [Op.gte]: parseInt(experience_min as string),
    };
  }

  if (experience_max) {
    whereConditions.experience_max = {
      [Op.lte]: parseInt(experience_max as string),
    };
  }

  if (skills) {
    const skillsArray = Array.isArray(skills) ? skills : [skills];
    whereConditions.required_skills = { [Op.overlap]: skillsArray };
  }

  if (remote_work_allowed === "true") {
    whereConditions.remote_work_allowed = true;
  }

  if (company_name) {
    whereConditions.company_name = { [Op.iLike]: `%${company_name}%` };
  }

  const { rows: jobs, count: total } = await Job.findAndCountAll({
    where: whereConditions,
    order: [["created_at", "DESC"]],
    limit: parseInt(limit as string),
    offset,
    attributes: [
      "id",
      "job_id",
      "title",
      "external_description",
      "company_name",
      "location",
      "city",
      "state",
      "job_type",
      "salary_min",
      "salary_max",
      "salary_currency",
      "experience_min",
      "experience_max",
      "required_skills",
      "preferred_skills",
      "education_requirements",
      "remote_work_allowed",
      "positions_available",
      "application_deadline",
      "created_at",
    ],
  });

  const totalPages = Math.ceil(total / parseInt(limit as string));

  res.json({
    success: true,
    data: {
      jobs,
      pagination: {
        current_page: parseInt(page as string),
        total_pages: totalPages,
        total_items: total,
        items_per_page: parseInt(limit as string),
      },
    },
  });
});

// Public job details endpoint
const getPublicJobDetails = asyncHandler(
  async (req: Request, res: Response) => {
    const { jobId } = req.params;

    const job = await Job.findByPk(jobId, {
      attributes: [
        "id",
        "job_id",
        "title",
        "external_description",
        "company_name",
        "location",
        "city",
        "state",
        "country",
        "job_type",
        "salary_min",
        "salary_max",
        "salary_currency",
        "experience_min",
        "experience_max",
        "required_skills",
        "preferred_skills",
        "education_requirements",
        "remote_work_allowed",
        "positions_available",
        "start_date",
        "application_deadline",
        "created_at",
      ],
    });

    if (!job || job.status !== "active") {
      return res.status(404).json({
        success: false,
        message: "Job not found or not available",
      });
    }

    return res.json({
      success: true,
      data: job,
    });
  }
);

// Validation rules
const searchJobsValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("salary_min")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Minimum salary must be positive"),
  query("salary_max")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Maximum salary must be positive"),
  query("experience_min")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Minimum experience must be non-negative"),
  query("experience_max")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Maximum experience must be non-negative"),
  query("job_type")
    .optional()
    .isIn(["full_time", "part_time", "contract", "temporary"])
    .withMessage("Invalid job type"),
];

const jobDetailsValidation = [
  param("jobId").isUUID().withMessage("Valid job ID is required"),
];

// Routes
router.get("/search", searchJobsValidation, validate, searchJobs);
router.get(
  "/:jobId/public",
  jobDetailsValidation,
  validate,
  getPublicJobDetails
);

export default router;
