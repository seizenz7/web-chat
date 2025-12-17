/**
 * Message Routes
 *
 * REST API endpoints for managing messages:
 * - GET /api/messages/:conversationId - Get conversation messages
 * - POST /api/messages - Send a message
 * - PATCH /api/messages/:messageId - Edit a message
 * - DELETE /api/messages/:messageId - Delete a message
 * - POST /api/messages/:messageId/status - Update message status (delivered/read)
 * - POST /api/messages/:messageId/reactions - Add reaction to message
 *
 * All endpoints require authentication (Bearer token)
 */

import { Router, Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { requireAuth } from '../middleware/auth';
import {
  getConversationMessages,
  sendMessage,
  updateMessageStatus,
  editMessage,
  deleteMessage,
  addReactionToMessage,
} from '../services/messageService';

const router = Router();

/**
 * ============================
 * MIDDLEWARE
 * ============================
 */

// All routes require authentication
router.use(requireAuth);

/**
 * ============================
 * VALIDATION SCHEMAS
 * ============================
 */

const sendMessageSchema = Joi.object({
  conversation_id: Joi.string().uuid().required(),
  content_encrypted: Joi.string().required(),
  message_type: Joi.string()
    .valid('text', 'image', 'file', 'system', 'voice')
    .optional()
    .default('text'),
  reply_to_id: Joi.string().uuid().optional(),
  metadata: Joi.object().optional(),
}).unknown(false);

const updateMessageStatusSchema = Joi.object({
  status_type: Joi.string().valid('sent', 'delivered', 'read').required(),
}).unknown(false);

const addReactionSchema = Joi.object({
  emoji: Joi.string().required(),
}).unknown(false);

const editMessageSchema = Joi.object({
  content_encrypted: Joi.string().required(),
}).unknown(false);

/**
 * ============================
 * ROUTE HANDLERS
 * ============================
 */

/**
 * GET /api/messages/:conversationId
 *
 * Get message history for a conversation
 *
 * Query parameters:
 * - limit: number of messages (default: 50, max: 100)
 * - offset: pagination offset (default: 0)
 *
 * Response:
 * {
 *   "status": "success",
 *   "data": {
 *     "messages": [
 *       {
 *         "id": "message-uuid",
 *         "sender_id": "user-uuid",
 *         "sender_username": "john",
 *         "content_encrypted": "encrypted-content",
 *         "created_at": "2024-01-01T12:00:00Z",
 *         "status": {
 *           "delivered_by_users": ["user2", "user3"],
 *           "read_by_users": ["user2"],
 *           "reactions": {"😂": ["user2"]}
 *         }
 *       }
 *     ],
 *     "total": 150
 *   }
 * }
 */
router.get('/:conversationId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const userId = (req as any).user.id;
    const result = await getConversationMessages(req.params.conversationId, userId, limit, offset);

    res.json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/messages
 *
 * Send a message to a conversation
 *
 * This is the primary way to send messages via REST API.
 * For real-time delivery, the client should also use Socket.io 'chat:message_send'.
 *
 * Request body:
 * {
 *   "conversation_id": "uuid",
 *   "content_encrypted": "base64-encrypted-content",
 *   "message_type": "text",
 *   "reply_to_id": "optional-uuid"
 * }
 *
 * Response:
 * {
 *   "status": "success",
 *   "data": {
 *     "id": "message-uuid",
 *     "conversation_id": "conv-uuid",
 *     "sender_id": "sender-uuid",
 *     "sender_username": "john",
 *     "content_encrypted": "encrypted-content",
 *     "created_at": "2024-01-01T12:00:00Z",
 *     "status": {...}
 *   }
 * }
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { error, value } = sendMessageSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        status: 'error',
        error: error.details[0].message,
      });
    }

    const userId = (req as any).user.id;

    const message = await sendMessage({
      ...value,
      sender_id: userId,
    });

    res.status(201).json({
      status: 'success',
      data: message,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/messages/:messageId
 *
 * Edit a message (only sender can edit)
 *
 * Request body:
 * {
 *   "content_encrypted": "new-encrypted-content"
 * }
 *
 * Response:
 * {
 *   "status": "success",
 *   "data": {
 *     "id": "message-uuid",
 *     "content_encrypted": "new-encrypted-content",
 *     "is_edited": true,
 *     ...
 *   }
 * }
 */
router.patch('/:messageId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { error, value } = editMessageSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        status: 'error',
        error: error.details[0].message,
      });
    }

    const userId = (req as any).user.id;
    const message = await editMessage(req.params.messageId, userId, value.content_encrypted);

    res.json({
      status: 'success',
      data: message,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/messages/:messageId
 *
 * Delete a message (only sender or admin can delete)
 *
 * Note: This performs a soft delete. The message remains in the database
 * but is marked as deleted. This preserves conversation integrity.
 *
 * Response:
 * {
 *   "status": "success",
 *   "data": {
 *     "success": true
 *   }
 * }
 */
router.delete('/:messageId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const result = await deleteMessage(req.params.messageId, userId);

    res.json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/messages/:messageId/status
 *
 * Update message status (mark as delivered or read)
 *
 * This endpoint is used when the client wants to confirm
 * message delivery or receipt via REST (not WebSocket).
 *
 * Request body:
 * {
 *   "status_type": "delivered" | "read"
 * }
 *
 * Response:
 * {
 *   "status": "success",
 *   "data": {
 *     "message_id": "uuid",
 *     "user_id": "uuid",
 *     "status_type": "delivered"
 *   }
 * }
 */
router.post('/:messageId/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { error, value } = updateMessageStatusSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        status: 'error',
        error: error.details[0].message,
      });
    }

    const userId = (req as any).user.id;
    const result = await updateMessageStatus(req.params.messageId, userId, value.status_type);

    res.json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/messages/:messageId/reactions
 *
 * Add or update a reaction emoji on a message
 *
 * Request body:
 * {
 *   "emoji": "😂"
 * }
 *
 * Response:
 * {
 *   "status": "success",
 *   "data": {
 *     "message_id": "uuid",
 *     "user_id": "uuid",
 *     "reaction_emoji": "😂"
 *   }
 * }
 */
router.post('/:messageId/reactions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { error, value } = addReactionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        status: 'error',
        error: error.details[0].message,
      });
    }

    const userId = (req as any).user.id;
    const result = await addReactionToMessage(req.params.messageId, userId, value.emoji);

    res.json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

export { router as messageRouter };
