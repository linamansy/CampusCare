const prisma = require('../prismaClient');

const {
  findIssueAssignedToWorker
} = require('../services/assignedIssueService');

const {
  notifyRole,
  createNotification
} = require('../services/notificationService');

const {
  isValidStatusTransition,
  parsePositiveInt,
  sanitizeText
} = require('../utils/issueHelpers');

const { addPoints } = require('../services/pointsService');
const { uploadToSupabase } = require('../services/imageUploadService');

const resolveWorkerId = (
  req,
  bodyWorkerId
) => {
  const parsedBodyWorkerId =
    parsePositiveInt(bodyWorkerId);

  const tokenWorkerId =
    req.user
      ? parsePositiveInt(req.user.id)
      : null;

  if (
    parsedBodyWorkerId &&
    tokenWorkerId &&
    parsedBodyWorkerId !==
      tokenWorkerId
  ) {
    return null;
  }

  return (
    parsedBodyWorkerId ||
    tokenWorkerId
  );
};

// GET assigned issues
exports.getAssignedIssues =
  async (req, res, next) => {
    const queryWorkerId =
      parsePositiveInt(
        req.query.workerId
      );

    const tokenWorkerId =
      req.user
        ? parsePositiveInt(
            req.user.id
          )
        : null;

    if (
      queryWorkerId &&
      tokenWorkerId &&
      queryWorkerId !==
        tokenWorkerId
    ) {
      return res.status(403).json({
        error: 'Forbidden'
      });
    }

    const workerId =
      queryWorkerId ||
      tokenWorkerId;

    if (!workerId) {
      return res.status(400).json({
        error:
          'Missing or invalid workerId'
      });
    }

    try {
      const issues =
        await prisma.issue.findMany({
          where: {
            assignedTo:
              workerId
          },

          include: {
            comments: true
          }
        });

      res.json(issues);

    } catch (error) {
      next(error);
    }
  };

// MARK issue in progress
exports.markInProgress =
  async (req, res, next) => {
    const issueId =
      parsePositiveInt(
        req.params.id
      );

    const workerId =
      resolveWorkerId(
        req,
        req.body.workerId
      );

    if (!issueId) {
      return res.status(400).json({
        error:
          'Invalid issue id'
      });
    }

    if (!workerId) {
      return res.status(400).json({
        error:
          'Missing or invalid workerId'
      });
    }

    try {
      const { error } =
        await findIssueAssignedToWorker(
          issueId,
          workerId
        );

      if (error) {
        return res
          .status(error.status)
          .json({
            error:
              error.message
          });
      }

      const currentIssue =
        await prisma.issue.findUnique({
          where: {
            id: issueId
          },

          select: {
            status: true
          }
        });

      if (!currentIssue) {
        return res.status(404).json({
          error:
            'Issue not found'
        });
      }

      if (
        !isValidStatusTransition(
          currentIssue.status,
          'In Progress'
        )
      ) {
        return res.status(409).json({
          error: `Invalid status transition from ${currentIssue.status} to In Progress`
        });
      }

      const issue =
        await prisma.issue.update({
          where: {
            id: issueId
          },

          data: {
            status:
              'In Progress'
          }
        });

      // Notify the reporter that work has started
      await createNotification({
        userId: issue.userId,
        type: 'WORK_STARTED',
        title: 'Worker started work',
        message: `A worker has started working on your ticket #${issueId}.`,
        issueId: issue.id
      });

      // Notify the manager that work has started
      await notifyRole({
        role: 'Facility Manager',
        type: 'WORK_STARTED',
        title: 'Worker started task',
        message: `Worker #${workerId} has started working on ticket #${issueId}.`,
        issueId: issue.id
      });

      res.json(issue);

    } catch (error) {
      next(error);
    }
  };

// UPLOAD completion photo
exports.uploadCompletionPhoto =
  async (req, res, next) => {
    const issueId =
      parsePositiveInt(
        req.params.id
      );

    const workerId =
      resolveWorkerId(
        req,
        req.body.workerId
      );

    const completionNote =
      sanitizeText(
        req.body.note ||
        req.body.completionNote ||
        ''
      );

    if (!issueId) {
      return res.status(400).json({
        error:
          'Invalid issue id'
      });
    }

    if (!workerId) {
      return res.status(400).json({
        error:
          'Missing or invalid workerId'
      });
    }

    const imageUrl = req.body.imageUrl || req.body.image || req.body.photo || req.body.photoUrl || req.body.imageUri || req.body.image_url || req.body.photo_url;

    if (!req.file && !imageUrl) {
      console.warn('[WARN] uploadCompletionPhoto failed: No photo file or URL provided. Body keys:', Object.keys(req.body));
      return res.status(400).json({
        error:
          'Missing photo file or URL',
        code: 'IMAGE_REQUIRED'
      });
    }

    try {
      const { error } =
        await findIssueAssignedToWorker(
          issueId,
          workerId
        );

      if (error) {
        return res
          .status(error.status)
          .json({
            error:
              error.message
          });
      }

      const currentIssue =
        await prisma.issue.findUnique({
          where: {
            id: issueId
          },

          select: {
            status: true
          }
        });

      if (!currentIssue) {
        return res.status(404).json({
          error:
            'Issue not found'
        });
      }

      if (
        !isValidStatusTransition(
          currentIssue.status,
          'Under Review'
        )
      ) {
        return res.status(409).json({
          error: `Invalid status transition from ${currentIssue.status} to Under Review`
        });
      }

      // Upload to Supabase if file is provided, otherwise use imageUrl
      let photoUrl = imageUrl;
      if (req.file) {
        const extension = req.file.originalname.split('.').pop() || 'jpg';
        const supabasePath = `completion-photos/${Date.now()}-${Math.round(Math.random() * 1e9)}.${extension}`;
        
        photoUrl = await uploadToSupabase(
          req.file.buffer || req.file.path, 
          supabasePath, 
          req.file.mimetype
        );
      }

      const issue =
        await prisma.$transaction(
          async (tx) => {
            if (completionNote) {
              await tx.comment.create({
                data: {
                  issueId,
                  userId: workerId,
                  text:
                    `Completion note: ${completionNote}`
                }
              });
            }

            const updatedIssue =
              await tx.issue.update({
                where: {
                  id: issueId
                },
                data: {
                  status: 'Under Review',
                  completionPhotoUrl: photoUrl,
                  completionNote: completionNote
                }
              });

            await tx.completionAttempt.create({
              data: {
                issueId,
                workerId,
                photoUrl: photoUrl || null,
                note: completionNote || null,
              }
            });

            // Notify Manager
            await notifyRole({
              role: 'Facility Manager',
              type:
                'WORKER_COMPLETION_SUBMITTED',

              title:
                'Ticket ready for review',

              message:
                `Ticket #${issueId} has a worker completion update.`,

              issueId
            }, tx);

            // Notify Reporter (Member)
            await tx.notification.create({
              data: {
                userId: updatedIssue.userId,
                type: 'WORKER_COMPLETED',
                title: 'Ticket ready for your review',
                message: `Work on ticket #${issueId} is finished. Please check the completion photo.`,
                issueId: updatedIssue.id
              }
            });

            return updatedIssue;
          }
        );

      await addPoints(
        workerId,
        5
      );

      res.json(issue);

    } catch (error) {
      next(error);
    }
  };

// MARK issue completed
exports.markCompleted =
  async (req, res, next) => {
    const issueId =
      parsePositiveInt(
        req.params.id
      );

    const workerId =
      resolveWorkerId(
        req,
        req.body.workerId
      );

    if (!issueId) {
      return res.status(400).json({
        error:
          'Invalid issue id'
      });
    }

    if (!workerId) {
      return res.status(400).json({
        error:
          'Missing or invalid workerId'
      });
    }

    try {
      const { error } =
        await findIssueAssignedToWorker(
          issueId,
          workerId
        );

      if (error) {
        return res
          .status(error.status)
          .json({
            error:
              error.message
          });
      }

      const currentIssue =
        await prisma.issue.findUnique({
          where: {
            id: issueId
          },

          select: {
            status: true
          }
        });

      if (!currentIssue) {
        return res.status(404).json({
          error:
            'Issue not found'
        });
      }

      if (
        !isValidStatusTransition(
          currentIssue.status,
          'Completed'
        )
      ) {
        return res.status(409).json({
          error: `Invalid status transition from ${currentIssue.status} to Completed`
        });
      }

      const issue =
        await prisma.issue.update({
          where: {
            id: issueId
          },

          data: {
            status:
              'Completed'
          }
        });

      // Notify Reporter
      await createNotification({
        userId: issue.userId,
        type: 'STATUS_CHANGED',
        title: 'Work completed',
        message: `Work on your ticket #${issueId} is now complete.`,
        issueId: issue.id
      });

      await addPoints(
        workerId,
        10
      );

      res.json(issue);

    } catch (error) {
      next(error);
    }
  };
