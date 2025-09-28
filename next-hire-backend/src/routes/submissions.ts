import { Router, Response } from "express";
import { param } from "express-validator";
import { Submission, Job, Candidate, User, Interview } from "../models";
import { asyncHandler, createError } from "../middleware/errorHandler";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validation";
import { AuthenticatedRequest } from "../middleware/auth";

const router = Router();

// Get submission timeline/history
const getSubmissionTimeline = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { submissionId } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    const submission = await Submission.findByPk(submissionId, {
      include: [
        {
          model: Job,
          as: "job",
        },
        {
          model: Candidate,
          as: "candidate",
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "email"],
            },
          ],
        },
      ],
    });

    if (!submission) {
      throw createError("Submission not found", 404);
    }

    // Check permissions based on role
    let hasPermission = false;

    if (userRole === "candidate") {
      // Candidates can only view their own submissions
      hasPermission = submission.candidate?.user?.id === userId;
    } else if (userRole === "recruiter") {
      // Recruiters can view submissions for jobs they created or are assigned to
      hasPermission =
        submission.job?.created_by === userId ||
        submission.job?.assigned_to === userId;
    } else if (userRole === "vendor") {
      // Vendors can view submissions they made
      hasPermission = submission.submitted_by === userId;
    }

    if (!hasPermission) {
      throw createError(
        "You do not have permission to view this submission",
        403
      );
    }

    // Get interviews for this submission
    const interviews = await Interview.findAll({
      where: { submission_id: submissionId },
      include: [
        {
          model: User,
          as: "interviewer",
          attributes: ["id", "email"],
        },
        {
          model: User,
          as: "creator",
          attributes: ["id", "email"],
        },
      ],
      order: [["scheduled_at", "ASC"]],
    });

    // Create timeline events
    const timeline = [
      {
        type: "submitted",
        timestamp: submission.submitted_at,
        description: "Application submitted",
        user: submission.candidate?.user?.email,
      },
    ];

    if (submission.reviewed_at && submission.reviewed_by) {
      const reviewer = await User.findByPk(submission.reviewed_by, {
        attributes: ["email"],
      });

      timeline.push({
        type: "reviewed",
        timestamp: submission.reviewed_at,
        description: `Status changed to ${submission.status}`,
        user: reviewer?.email,
      });
    }

    // Add interview events
    interviews.forEach((interview) => {
      timeline.push({
        type: "interview_scheduled",
        timestamp: interview.created_at,
        description: `${interview.interview_type} interview scheduled`,
        user: interview.creator?.email,
      } as any);

      if (interview.status === "completed") {
        timeline.push({
          type: "interview_completed",
          timestamp: interview.updated_at,
          description: `${interview.interview_type} interview completed`,
          user: interview.interviewer?.email,
        } as any);
      }
    });

    // Sort timeline by timestamp
    timeline.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    res.json({
      success: true,
      data: {
        submission,
        timeline,
        interviews,
      },
    });
  }
);

// Add note to submission (recruiter only)
const addSubmissionNote = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { submissionId } = req.params;
    const { note } = req.body;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (userRole !== "recruiter") {
      throw createError("Only recruiters can add notes to submissions", 403);
    }

    const submission = await Submission.findByPk(submissionId, {
      include: [{ model: Job, as: "job" }],
    });

    if (!submission) {
      throw createError("Submission not found", 404);
    }

    // Check if recruiter has permission
    if (
      submission.job?.created_by !== userId &&
      submission.job?.assigned_to !== userId
    ) {
      throw createError(
        "You do not have permission to add notes to this submission",
        403
      );
    }

    // Append note to existing notes
    const existingNotes = submission.notes || "";
    const timestamp = new Date().toISOString();
    const newNote = `[${timestamp}] ${note}`;
    const updatedNotes = existingNotes
      ? `${existingNotes}\n\n${newNote}`
      : newNote;

    await submission.update({ notes: updatedNotes });

    res.json({
      success: true,
      message: "Note added successfully",
      data: { notes: updatedNotes },
    });
  }
);

// Validation rules
const submissionIdValidation = [
  param("submissionId").isUUID().withMessage("Valid submission ID is required"),
];

// Routes
router.use(authenticate); // All routes require authentication

router.get(
  "/:submissionId/timeline",
  submissionIdValidation,
  validate,
  getSubmissionTimeline
);
router.post(
  "/:submissionId/notes",
  submissionIdValidation,
  validate,
  addSubmissionNote
);

export default router;
