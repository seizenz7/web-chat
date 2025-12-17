/**
 * Conversation Routes
 *
 * REST API endpoints for managing conversations:
 * - POST /api/conversations - Create new conversation
 * - GET /api/conversations - Get all user conversations
 * - GET /api/conversations/:id - Get conversation details
 * - POST /api/conversations/:id/participants - Add participant
 * - DELETE /api/conversations/:id/participants/:userId - Remove participant
 *
 * All endpoints require authentication (Bearer token in Authorization header)
 */

import { Router, Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { requireAuth } from '../middleware/auth';
import {
  createDirectMessage,
  createGroupConversation,
  getUserConversations,
  getConversationById,
  addParticipantToConversation,
  removeParticipantFromConversation,
} from '../services/conversationService';
import { errorHandler } from '../middleware/errorHandler';

const router = Router();

/**
 * ============================
 * MIDDLEWARE
 * ============================
 *
 * These middleware functions run before each route handler
 */

// All routes require authentication
router.use(requireAuth);

/**
 * ============================
 * VALIDATION SCHEMAS
 * ============================
 *
 * Joi schemas define what data is valid for each endpoint
 * This prevents bad data from reaching our services
 */

const createDirectMessageSchema = Joi.object({
  user_id: Joi.string().uuid().required(),
}).unknown(false);

const createGroupConversationSchema = Joi.object({
  title: Joi.string().min(1).max(255).required(),
  description: Joi.string().max(500).optional(),
  avatar_url: Joi.string().uri().optional(),
  participant_ids: Joi.array().items(Joi.string().uuid()).required(),
}).unknown(false);

const addParticipantSchema = Joi.object({
  user_id: Joi.string().uuid().required(),
}).unknown(false);

/**
 * ============================
 * ROUTE HANDLERS
 * ============================
 */

/**
 * POST /api/conversations/direct
 *
 * Create a direct message (1:1) conversation with another user
 *
 * Request body:
 * {
 *   "user_id": "uuid-string"
 * }
 *
 * Response:
 * {
 *   "id": "conversation-uuid",
 *   "type": "direct",
 *   "participants": [...],
 *   ...
 * }
 */
router.post('/direct', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { error, value } = createDirectMessageSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        status: 'error',
        error: error.details[0].message,
      });
    }

    const userId = (req as any).user.id;
    const conversation = await createDirectMessage(value.user_id, userId, userId);

    res.status(201).json({
      status: 'success',
      data: conversation,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/conversations/group
 *
 * Create a group conversation
 *
 * Request body:
 * {
 *   "title": "Project Team",
 *   "description": "Discussion about project",
 *   "avatar_url": "https://...",
 *   "participant_ids": ["uuid1", "uuid2"]
 * }
 *
 * Response:
 * {
 *   "id": "conversation-uuid",
 *   "type": "group",
 *   "title": "Project Team",
 *   ...
 * }
 */
router.post('/group', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { error, value } = createGroupConversationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        status: 'error',
        error: error.details[0].message,
      });
    }

    const userId = (req as any).user.id;
    const conversation = await createGroupConversation({
      ...value,
      created_by: userId,
    });

    res.status(201).json({
      status: 'success',
      data: conversation,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/conversations
 *
 * Get all conversations for the authenticated user
 *
 * Query parameters:
 * - limit: number of results (default: 50, max: 100)
 * - offset: pagination offset (default: 0)
 *
 * Response:
 * {
 *   "status": "success",
 *   "data": {
 *     "conversations": [...],
 *     "total": 15
 *   }
 * }
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const userId = (req as any).user.id;
    const result = await getUserConversations(userId, limit, offset);

    res.json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/conversations/:conversationId
 *
 * Get a specific conversation by ID
 *
 * Response:
 * {
 *   "status": "success",
 *   "data": {
 *     "id": "conversation-uuid",
 *     "type": "direct" | "group",
 *     "participants": [...],
 *     "last_message": {...},
 *     ...
 *   }
 * }
 */
router.get('/:conversationId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const conversation = await getConversationById(req.params.conversationId, userId);

    res.json({
      status: 'success',
      data: conversation,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/conversations/:conversationId/participants
 *
 * Add a participant to a group conversation (admin only)
 *
 * Request body:
 * {
 *   "user_id": "uuid-string"
 * }
 *
 * Response:
 * {
 *   "status": "success",
 *   "data": {
 *     // Updated conversation with new participant
 *   }
 * }
 */
router.post(
  '/:conversationId/participants',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { error, value } = addParticipantSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          status: 'error',
          error: error.details[0].message,
        });
      }

      const userId = (req as any).user.id;
      const conversation = await addParticipantToConversation(
        req.params.conversationId,
        value.user_id,
        userId
      );

      res.json({
        status: 'success',
        data: conversation,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/conversations/:conversationId/participants/:userId
 *
 * Remove a participant from a conversation
 * - Admins can remove anyone
 * - Members can remove themselves
 *
 * Response:
 * {
 *   "status": "success",
 *   "data": {
 *     // Updated conversation
 *   }
 * }
 */
router.delete(
  '/:conversationId/participants/:userId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const requestingUserId = (req as any).user.id;
      const conversation = await removeParticipantFromConversation(
        req.params.conversationId,
        req.params.userId,
        requestingUserId
      );

      res.json({
        status: 'success',
        data: conversation,
      });
    } catch (error) {
      next(error);
    }
  }
);

export { router as conversationRouter };
